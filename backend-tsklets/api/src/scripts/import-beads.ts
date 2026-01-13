import * as fs from 'fs';
import * as readline from 'readline';
import { db } from '../db/index';
import { epics, features, devTasks, users, products, clients } from '../db/schema';
import { eq } from 'drizzle-orm';

interface BeadsIssue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number;
  issue_type: 'epic' | 'feature' | 'task';
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
  dependencies?: Array<{
    issue_id: string;
    depends_on_id: string;
    type: string;
  }>;
  labels?: string[];
}

// Status mapping: beads → tasklets
const mapStatus = (beadsStatus: string, type: 'epic' | 'feature' | 'task'): string => {
  const statusMap: Record<string, string> = {
    open: 'backlog',
    in_progress: 'in_progress',
    closed: 'completed',
    pending_internal_review: 'backlog',
    waiting_for_customer: 'backlog',
    rebuttal: 'backlog',
    resolved: 'completed',
    reopened: 'backlog',
    cancelled: 'cancelled',
  };

  return statusMap[beadsStatus] || 'backlog';
};

// Priority mapping: P0-P4 → 0-4 (tasklets uses 0-4, lower = higher priority)
const mapPriority = (beadsPriority: number | string): number => {
  if (typeof beadsPriority === 'string') {
    const match = beadsPriority.match(/P(\d)/);
    if (match) return parseInt(match[1]);
  }
  return beadsPriority as number;
};

async function importBeads() {
  console.log('🚀 Starting Beads Import...\n');

  try {
    // 1. Get Tasklets product
    console.log('📦 Finding Tasklets product...');
    const taskletProduct = await db
      .select()
      .from(products)
      .where(eq(products.name, 'Tasklets'))
      .limit(1);

    if (!taskletProduct.length) {
      throw new Error('❌ Tasklets product not found! Create it in the app first.');
    }

    const productId = taskletProduct[0].id;
    const tenantId = taskletProduct[0].tenantId;
    console.log(`✅ Found product: ${taskletProduct[0].name} (ID: ${productId})\n`);

    // 2. Get ramesh@systech.com user
    console.log('👤 Finding ramesh@systech.com user...');
    const rameshUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'ramesh@systech.com'))
      .limit(1);

    if (!rameshUser.length) {
      throw new Error('❌ ramesh@systech.com user not found! Create account first.');
    }

    const userId = rameshUser[0].id;
    console.log(`✅ Found user: ${rameshUser[0].name} (ID: ${userId})\n`);

    // 3. Read beads issues
    console.log('📖 Reading .beads/issues.jsonl...');
    const beadsPath = '../../../../.beads/issues.jsonl';
    const issues: BeadsIssue[] = [];

    const fileStream = fs.createReadStream(beadsPath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (line.trim()) {
        try {
          issues.push(JSON.parse(line));
        } catch (e) {
          console.error(`⚠️  Failed to parse line: ${line}`);
        }
      }
    }

    console.log(`✅ Loaded ${issues.length} issues\n`);

    // 4. Separate by type
    const epicIssues = issues.filter((i) => i.issue_type === 'epic');
    const featureIssues = issues.filter((i) => i.issue_type === 'feature');
    const taskIssues = issues.filter((i) => i.issue_type === 'task');

    console.log(`📊 Issue breakdown:`);
    console.log(`   Epics: ${epicIssues.length}`);
    console.log(`   Features: ${featureIssues.length}`);
    console.log(`   Tasks: ${taskIssues.length}\n`);

    // 5. Create maps for linking
    const beadsToEpicId = new Map<string, number>();
    const beadsToFeatureId = new Map<string, number>();
    const beadsToTaskId = new Map<string, number>();

    // 6. Import Epics
    console.log('📌 Importing Epics...');
    for (const issue of epicIssues) {
      try {
        // Check if already imported
        const existing = await db
          .select()
          .from(epics)
          .where(eq(epics.beadsId, issue.id))
          .limit(1);

        if (existing.length) {
          console.log(`   ⏭️  ${issue.id} (already imported)`);
          beadsToEpicId.set(issue.id, existing[0].id);
          continue;
        }

        const [result] = await db
          .insert(epics)
          .values({
            tenantId,
            productId,
            beadsId: issue.id,
            title: issue.title,
            description: issue.description || '',
            status: mapStatus(issue.status, 'epic') as any,
            priority: mapPriority(issue.priority),
            createdBy: userId,
            ownerId: userId,
            labels: issue.labels || [],
            color: '#3B82F6', // Default blue
            progress: issue.status === 'closed' ? 100 : 0,
            createdAt: new Date(issue.created_at || Date.now()),
            updatedAt: new Date(issue.updated_at || Date.now()),
            closedAt: issue.status === 'closed' ? new Date(issue.closed_at || Date.now()) : null,
          })
          .returning();

        beadsToEpicId.set(issue.id, result.id);
        console.log(`   ✅ ${issue.id} → Epic ${result.id}`);
      } catch (error) {
        console.error(`   ❌ Failed to import ${issue.id}:`, (error as Error).message);
      }
    }
    console.log('');

    // 7. Import Features
    console.log('📌 Importing Features...');
    for (const issue of featureIssues) {
      try {
        // Check if already imported
        const existing = await db
          .select()
          .from(features)
          .where(eq(features.beadsId, issue.id))
          .limit(1);

        if (existing.length) {
          console.log(`   ⏭️  ${issue.id} (already imported)`);
          beadsToFeatureId.set(issue.id, existing[0].id);
          continue;
        }

        // Find parent epic by looking at dependencies
        let parentEpicId: number | null = null;
        if (issue.dependencies) {
          for (const dep of issue.dependencies) {
            if (dep.type === 'parent-child' && beadsToEpicId.has(dep.depends_on_id)) {
              parentEpicId = beadsToEpicId.get(dep.depends_on_id)!;
              break;
            }
          }
        }

        if (!parentEpicId && epicIssues.length > 0) {
          // Fallback: assign to first epic if no parent specified
          parentEpicId = beadsToEpicId.values().next().value ?? null;
        }

        if (!parentEpicId) {
          console.log(`   ⚠️  ${issue.id} has no parent epic, skipping`);
          continue;
        }

        const [result] = await db
          .insert(features)
          .values({
            tenantId,
            epicId: parentEpicId,
            beadsId: issue.id,
            title: issue.title,
            description: issue.description || '',
            status: mapStatus(issue.status, 'feature') as any,
            priority: mapPriority(issue.priority),
            createdBy: userId,
            ownerId: userId,
            labels: issue.labels || [],
            createdAt: new Date(issue.created_at || Date.now()),
            updatedAt: new Date(issue.updated_at || Date.now()),
            closedAt: issue.status === 'closed' ? new Date(issue.closed_at || Date.now()) : null,
          })
          .returning();

        beadsToFeatureId.set(issue.id, result.id);
        console.log(`   ✅ ${issue.id} → Feature ${result.id} (Epic ${parentEpicId})`);
      } catch (error) {
        console.error(`   ❌ Failed to import ${issue.id}:`, (error as Error).message);
      }
    }
    console.log('');

    // 8. Import Tasks
    console.log('📌 Importing Tasks...');
    for (const issue of taskIssues) {
      try {
        // Check if already imported
        const existing = await db
          .select()
          .from(devTasks)
          .where(eq(devTasks.beadsId, issue.id))
          .limit(1);

        if (existing.length) {
          console.log(`   ⏭️  ${issue.id} (already imported)`);
          beadsToTaskId.set(issue.id, existing[0].id);
          continue;
        }

        // Find parent feature by looking at dependencies
        let parentFeatureId: number | null = null;
        if (issue.dependencies) {
          for (const dep of issue.dependencies) {
            if (dep.type === 'parent-child' && beadsToFeatureId.has(dep.depends_on_id)) {
              parentFeatureId = beadsToFeatureId.get(dep.depends_on_id)!;
              break;
            }
          }
        }

        if (!parentFeatureId && featureIssues.length > 0) {
          // Fallback: assign to first feature if no parent specified
          parentFeatureId = beadsToFeatureId.values().next().value ?? null;
        }

        const [result] = await db
          .insert(devTasks)
          .values({
            tenantId,
            productId,
            featureId: parentFeatureId || undefined,
            beadsId: issue.id,
            title: issue.title,
            description: issue.description || '',
            type: 'task',
            status: mapStatus(issue.status, 'task') as any,
            priority: mapPriority(issue.priority),
            createdBy: userId,
            implementorId: userId,
            developerId: userId,
            labels: issue.labels || [],
            createdAt: new Date(issue.created_at || Date.now()),
            updatedAt: new Date(issue.updated_at || Date.now()),
            closedAt: issue.status === 'closed' ? new Date(issue.closed_at || Date.now()) : null,
          })
          .returning();

        beadsToTaskId.set(issue.id, result.id);
        console.log(`   ✅ ${issue.id} → Task ${result.id}${parentFeatureId ? ` (Feature ${parentFeatureId})` : ''}`);
      } catch (error) {
        console.error(`   ❌ Failed to import ${issue.id}:`, (error as Error).message);
      }
    }
    console.log('');

    // 9. Summary
    console.log('📈 Import Summary:');
    console.log(`   Epics imported: ${beadsToEpicId.size}`);
    console.log(`   Features imported: ${beadsToFeatureId.size}`);
    console.log(`   Tasks imported: ${beadsToTaskId.size}`);
    console.log(
      `\n✅ Beads import complete! All items linked via beadsId for future sync.\n`
    );

    // 10. Verify counts in DB
    const epicCount = await db.select().from(epics).where(eq(epics.tenantId, tenantId));
    const featureCount = await db.select().from(features).where(eq(features.tenantId, tenantId));
    const taskCount = await db
      .select()
      .from(devTasks)
      .where(eq(devTasks.tenantId, tenantId));

    console.log('📊 Database Verification:');
    console.log(`   Total Epics in DB: ${epicCount.length}`);
    console.log(`   Total Features in DB: ${featureCount.length}`);
    console.log(`   Total Tasks in DB: ${taskCount.length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run import
importBeads();
