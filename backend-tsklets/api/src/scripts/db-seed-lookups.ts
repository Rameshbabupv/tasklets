import { db } from '../db/index.js';
import { tenants, tags } from '../db/schema.js';

/**
 * Seed lookup tables with reference data
 * This should be run after db:reset or db:push
 *
 * Current lookup data:
 * - Tenant (SysTech owner)
 * - Tags (for organizing AI configs)
 */

async function seedLookups() {
  console.log('📚 Seeding lookup tables...\n');

  try {
    // === TENANT (SaaS Owner) ===
    console.log('🏢 Creating SysTech tenant...');
    const [sysTechTenant] = await db.insert(tenants).values({
      name: 'SysTech',
      plan: 'enterprise',
      isActive: true,
    }).returning();

    console.log(`  ✅ Created tenant: SysTech (ID: ${sysTechTenant.id})\n`);

    // === TAGS (for AI Configs) ===
    console.log('🏷️  Creating reference tags...');
    const tagList = [
      { name: 'system-prompt', slug: 'system-prompt', description: 'System prompts for Claude models', color: '#EF4444' },
      { name: 'template', slug: 'template', description: 'Reusable prompt templates', color: '#F97316' },
      { name: 'workflow', slug: 'workflow', description: 'Multi-step workflow chains', color: '#EAB308' },
      { name: 'skill', slug: 'skill', description: 'Slash commands and skills', color: '#84CC16' },
      { name: 'hook', slug: 'hook', description: 'Pre/post execution hooks', color: '#22C55E' },
      { name: 'mcp', slug: 'mcp', description: 'Model Context Protocol configs', color: '#10B981' },
      { name: 'codebase', slug: 'codebase', description: 'Codebase-specific prompts', color: '#14B8A6' },
      { name: 'documentation', slug: 'documentation', description: 'Documentation helpers', color: '#06B6D4' },
      { name: 'code-generation', slug: 'code-generation', description: 'Code generation templates', color: '#0EA5E9' },
      { name: 'analysis', slug: 'analysis', description: 'Code analysis and review', color: '#3B82F6' },
      { name: 'testing', slug: 'testing', description: 'Test generation and validation', color: '#6366F1' },
      { name: 'debugging', slug: 'debugging', description: 'Debugging and error analysis', color: '#8B5CF6' },
      { name: 'architecture', slug: 'architecture', description: 'Architecture and design patterns', color: '#A855F7' },
      { name: 'api', slug: 'api', description: 'API design and documentation', color: '#D946EF' },
      { name: 'database', slug: 'database', description: 'Database schema and queries', color: '#EC4899' },
      { name: 'devops', slug: 'devops', description: 'Deployment and infrastructure', color: '#F43F5E' },
      { name: 'security', slug: 'security', description: 'Security and compliance checks', color: '#E11D48' },
      { name: 'performance', slug: 'performance', description: 'Performance optimization', color: '#DC2626' },
    ];

    const createdTags = [];
    for (const tag of tagList) {
      try {
        const [createdTag] = await db.insert(tags).values({
          tenantId: sysTechTenant.id,
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
          color: tag.color,
        }).returning();
        createdTags.push(createdTag);
        console.log(`  ✅ ${tag.name}`);
      } catch (error) {
        console.log(`  ⚠️  ${tag.name}: ${(error as Error).message}`);
      }
    }

    console.log(`\n✅ Lookup tables seeded!`);
    console.log(`📊 Tags created: ${createdTags.length}/${tagList.length}`);
    console.log(`\nNext steps:`);
    console.log(`  1. npm run db:seed:sample    (add sample data)`);
    console.log(`  2. npm run db:import:beads:api (import beads items)\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', (error as Error).message);
    process.exit(1);
  }
}

// Run seeding
seedLookups();
