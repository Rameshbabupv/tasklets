import * as fs from 'fs';
import * as readline from 'readline';

// Configuration
const API_BASE = 'http://localhost:4030/api';
const BEADS_EMAIL = 'ramesh@systech.com';
const BEADS_PASSWORD = process.env.BEADS_PASSWORD || 'Systech@123'; // Default from seed
const PRODUCT_NAME = 'Tasklets';

interface BeadsIssue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: number | string;
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

// API Response Types
interface AuthResponse {
  user: { id: number; tenantId: number; isInternal: boolean };
  token: string;
}

interface Epic {
  id: number;
  beadsId?: string;
  title: string;
}

interface Feature {
  id: number;
  beadsId?: string;
  title: string;
}

interface Task {
  id: number;
  beadsId?: string;
  title: string;
}

// Status mapping
const mapStatus = (beadsStatus: string): string => {
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

// Priority mapping
const mapPriority = (beadsPriority: number | string): number => {
  if (typeof beadsPriority === 'string') {
    const match = beadsPriority.match(/P(\d)/);
    if (match) return parseInt(match[1]);
  }
  return (beadsPriority as number) || 3;
};

// API Client
class BeadsImporter {
  private token: string = '';
  private productId: number = 0;
  private userId: number = 0;
  private beadsToEpicId = new Map<string, number>();
  private beadsToFeatureId = new Map<string, number>();
  private beadsToTaskId = new Map<string, number>();

  async makeRequest(
    method: string,
    path: string,
    body?: unknown,
    useAuth = true
  ): Promise<unknown> {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error ${response.status}: ${error}`);
    }

    return response.json();
  }

  async authenticate() {
    console.log(`🔐 Authenticating as ${BEADS_EMAIL}...`);
    try {
      const result = (await this.makeRequest('POST', '/auth/signin', {
        email: BEADS_EMAIL,
        password: BEADS_PASSWORD,
      }, false)) as AuthResponse;

      this.token = result.token;
      this.userId = result.user.id;
      console.log(`✅ Authenticated successfully (User ID: ${this.userId})\n`);
    } catch (error) {
      throw new Error(`Authentication failed: ${(error as Error).message}`);
    }
  }

  async getProduct() {
    console.log(`📦 Finding "${PRODUCT_NAME}" product...`);
    try {
      const products = (await this.makeRequest('GET', '/products')) as any[];
      const product = products.find((p) => p.name === PRODUCT_NAME);

      if (!product) {
        throw new Error(`Product "${PRODUCT_NAME}" not found`);
      }

      this.productId = product.id;
      console.log(`✅ Found product: ${product.name} (ID: ${this.productId})\n`);
    } catch (error) {
      throw new Error(`Failed to get product: ${(error as Error).message}`);
    }
  }

  async readBeadsIssues(): Promise<BeadsIssue[]> {
    console.log('📖 Reading .beads/issues.jsonl...');
    // Try multiple possible paths
    const possiblePaths = [
      '../../../../.beads/issues.jsonl', // From src/scripts/
      '../../../.beads/issues.jsonl', // From node_modules execution
      '.beads/issues.jsonl', // From root
      '/Users/rameshbabu/data/projects/systech/tsklets/.beads/issues.jsonl', // Absolute
    ];

    let beadsPath = '';
    for (const path of possiblePaths) {
      try {
        if (fs.existsSync(path)) {
          beadsPath = path;
          break;
        }
      } catch (e) {
        // Continue to next path
      }
    }

    if (!beadsPath) {
      throw new Error(
        `Could not find .beads/issues.jsonl. Tried: ${possiblePaths.join(', ')}`
      );
    }

    const issues: BeadsIssue[] = [];

    return new Promise((resolve, reject) => {
      const fileStream = fs.createReadStream(beadsPath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      rl.on('line', (line) => {
        if (line.trim()) {
          try {
            issues.push(JSON.parse(line));
          } catch (e) {
            console.error(`⚠️  Failed to parse line: ${line}`);
          }
        }
      });

      rl.on('close', () => {
        console.log(`✅ Loaded ${issues.length} issues\n`);
        resolve(issues);
      });

      rl.on('error', reject);
    });
  }

  async createEpic(issue: BeadsIssue): Promise<number | null> {
    try {
      const result = (await this.makeRequest('POST', '/epics', {
        productId: this.productId,
        title: issue.title,
        description: issue.description || '',
        priority: mapPriority(issue.priority),
        status: mapStatus(issue.status),
        labels: issue.labels || [],
        color: '#3B82F6',
        metadata: {
          beadsId: issue.id,
          beadsStatus: issue.status,
          beadsPriority: issue.priority,
        },
      })) as any;

      const epicId = result.epic.id;
      this.beadsToEpicId.set(issue.id, epicId);
      console.log(`   ✅ ${issue.id} → Epic ${epicId}`);
      return epicId;
    } catch (error) {
      console.error(`   ❌ Failed to create epic ${issue.id}:`, (error as Error).message);
      return null;
    }
  }

  async createFeature(issue: BeadsIssue, parentEpicId: number): Promise<number | null> {
    try {
      const result = (await this.makeRequest('POST', '/features', {
        epicId: parentEpicId,
        title: issue.title,
        description: issue.description || '',
        priority: mapPriority(issue.priority),
        status: mapStatus(issue.status),
        labels: issue.labels || [],
        metadata: {
          beadsId: issue.id,
          beadsStatus: issue.status,
          beadsPriority: issue.priority,
        },
      })) as any;

      const featureId = result.feature.id;
      this.beadsToFeatureId.set(issue.id, featureId);
      console.log(`   ✅ ${issue.id} → Feature ${featureId} (Epic ${parentEpicId})`);
      return featureId;
    } catch (error) {
      console.error(`   ❌ Failed to create feature ${issue.id}:`, (error as Error).message);
      return null;
    }
  }

  async createTask(issue: BeadsIssue, parentFeatureId: number): Promise<number | null> {
    try {
      const result = (await this.makeRequest('POST', '/tasks', {
        featureId: parentFeatureId,
        title: issue.title,
        description: issue.description || '',
        type: 'task',
        priority: mapPriority(issue.priority),
        status: mapStatus(issue.status),
        labels: issue.labels || [],
        metadata: {
          beadsId: issue.id,
          beadsStatus: issue.status,
          beadsPriority: issue.priority,
        },
      })) as any;

      const taskId = result.task.id;
      this.beadsToTaskId.set(issue.id, taskId);
      console.log(`   ✅ ${issue.id} → Task ${taskId} (Feature ${parentFeatureId})`);
      return taskId;
    } catch (error) {
      console.error(`   ❌ Failed to create task ${issue.id}:`, (error as Error).message);
      return null;
    }
  }

  async import() {
    try {
      console.log('🚀 Starting Beads Import via API...\n');

      // Step 1: Authenticate
      await this.authenticate();

      // Step 2: Get product
      await this.getProduct();

      // Step 3: Read beads issues
      const issues = await this.readBeadsIssues();

      // Step 4: Separate by type
      const epicIssues = issues.filter((i) => i.issue_type === 'epic');
      const featureIssues = issues.filter((i) => i.issue_type === 'feature');
      const taskIssues = issues.filter((i) => i.issue_type === 'task');

      console.log(`📊 Issue breakdown:`);
      console.log(`   Epics: ${epicIssues.length}`);
      console.log(`   Features: ${featureIssues.length}`);
      console.log(`   Tasks: ${taskIssues.length}\n`);

      // Step 5: Create Epics
      console.log('📌 Importing Epics...');
      for (const issue of epicIssues) {
        await this.createEpic(issue);
      }
      console.log('');

      // Step 6: Create Features
      console.log('📌 Importing Features...');
      for (const issue of featureIssues) {
        // Find parent epic
        let parentEpicId: number | null = null;

        if (issue.dependencies) {
          for (const dep of issue.dependencies) {
            if (dep.type === 'parent-child' && this.beadsToEpicId.has(dep.depends_on_id)) {
              parentEpicId = this.beadsToEpicId.get(dep.depends_on_id)!;
              break;
            }
          }
        }

        if (!parentEpicId && epicIssues.length > 0) {
          // Fallback: use first epic
          parentEpicId = Array.from(this.beadsToEpicId.values())[0];
        }

        if (!parentEpicId) {
          console.log(`   ⚠️  ${issue.id} has no parent epic, skipping`);
          continue;
        }

        await this.createFeature(issue, parentEpicId);
      }
      console.log('');

      // Step 7: Create Tasks
      console.log('📌 Importing Tasks...');
      for (const issue of taskIssues) {
        // Find parent feature
        let parentFeatureId: number | null = null;

        if (issue.dependencies) {
          for (const dep of issue.dependencies) {
            if (dep.type === 'parent-child' && this.beadsToFeatureId.has(dep.depends_on_id)) {
              parentFeatureId = this.beadsToFeatureId.get(dep.depends_on_id)!;
              break;
            }
          }
        }

        if (!parentFeatureId && featureIssues.length > 0) {
          // Fallback: use first feature
          parentFeatureId = Array.from(this.beadsToFeatureId.values())[0];
        }

        if (!parentFeatureId) {
          console.log(`   ⚠️  ${issue.id} has no parent feature, skipping`);
          continue;
        }

        await this.createTask(issue, parentFeatureId);
      }
      console.log('');

      // Step 8: Summary
      console.log('📈 Import Summary:');
      console.log(`   Epics created: ${this.beadsToEpicId.size}`);
      console.log(`   Features created: ${this.beadsToFeatureId.size}`);
      console.log(`   Tasks created: ${this.beadsToTaskId.size}`);
      console.log(`\n✅ Beads import complete!\n`);
    } catch (error) {
      console.error('\n❌ Import failed:', (error as Error).message);
      process.exit(1);
    }
  }
}

// Run import
const importer = new BeadsImporter();
importer.import();
