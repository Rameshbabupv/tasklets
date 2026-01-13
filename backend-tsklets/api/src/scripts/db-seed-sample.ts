import { db } from '../db/index.js';
import { tenants, clients, users, products, clientProducts, userProducts, teams, ideas } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const PASSWORD = 'Systech@123';

async function seedSampleData() {
  console.log('🌱 Seeding sample data...\n');

  try {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    // === GET OR CREATE TENANT ===
    console.log('🏢 Getting SysTech tenant...');
    let [sysTechTenant] = await db.select().from(tenants).where(eq(tenants.name, 'SysTech'));

    if (!sysTechTenant) {
      const created = await db.insert(tenants).values({
        name: 'SysTech',
        plan: 'enterprise',
      }).returning();
      sysTechTenant = created[0];
      console.log(`  ✅ Created tenant: SysTech`);
    } else {
      console.log(`  ✅ Using existing tenant: SysTech`);
    }

    const tenantId = sysTechTenant.id;

    // === CLIENTS ===
    console.log('\n👥 Creating sample clients...');
    const clientList = [
      { name: 'Acme Corp', domain: 'acme.com', tier: 'enterprise' },
      { name: 'TechCorp Inc', domain: 'techcorp.com', tier: 'business' },
      { name: 'StartupXYZ', domain: 'startupxyz.com', tier: 'starter' },
    ];

    const createdClients = [];
    for (const client of clientList) {
      const [c] = await db.insert(clients).values({
        tenantId,
        name: client.name,
        domain: client.domain,
        tier: client.tier as any,
        type: 'customer',
        isActive: true,
      }).returning();
      createdClients.push(c);
      console.log(`  ✅ ${client.name}`);
    }

    // === PRODUCTS ===
    console.log('\n📦 Creating sample products...');
    const productList = [
      { name: 'Tasklets', code: 'TSKLTS', description: 'Task & Issue Management Platform' },
      { name: 'CRM Sales', code: 'CRMS', description: 'Customer Relationship Management' },
      { name: 'SDMS v2', code: 'SDMS', description: 'Supply Distribution Management' },
      { name: 'HRM v2', code: 'HRM', description: 'Human Resource Management' },
    ];

    const createdProducts = [];
    for (const product of productList) {
      const [p] = await db.insert(products).values({
        tenantId,
        name: product.name,
        code: product.code,
        description: product.description,
      }).returning();
      createdProducts.push(p);
      console.log(`  ✅ ${product.name}`);
    }

    // === ASSIGN PRODUCTS TO CLIENTS ===
    console.log('\n🔗 Assigning products to clients...');
    for (let i = 0; i < createdClients.length; i++) {
      const client = createdClients[i];
      // Assign first 2-3 products to each client
      const productsToAssign = createdProducts.slice(0, Math.min(3, createdProducts.length));
      for (const product of productsToAssign) {
        await db.insert(clientProducts).values({
          tenantId,
          clientId: client.id,
          productId: product.id,
        });
      }
      console.log(`  ✅ ${client.name}: ${productsToAssign.length} products`);
    }

    // === INTERNAL USERS (SysTech Team) ===
    console.log('\n👤 Creating internal users...');
    const internalUsers = [
      {
        email: 'ramesh@systech.com',
        name: 'Ramesh Babu',
        role: 'admin',
      },
      {
        email: 'john@systech.com',
        name: 'John Developer',
        role: 'developer',
      },
      {
        email: 'sarah@systech.com',
        name: 'Sarah QA',
        role: 'support',
      },
      {
        email: 'mike@systech.com',
        name: 'Mike Manager',
        role: 'company_admin',
      },
    ];

    const createdInternalUsers = [];
    for (const user of internalUsers) {
      const [u] = await db.insert(users).values({
        tenantId,
        email: user.email,
        passwordHash,
        name: user.name,
        role: user.role as any,
        isActive: true,
      }).returning();
      createdInternalUsers.push(u);
      console.log(`  ✅ ${user.email} (${user.role})`);

      // Assign to all products
      for (const product of createdProducts) {
        await db.insert(userProducts).values({
          tenantId,
          userId: u.id,
          productId: product.id,
        });
      }
    }

    // === CLIENT USERS ===
    console.log('\n👤 Creating client users...');
    const clientUsersList = [
      { clientIdx: 0, email: 'john@acme.com', name: 'John Smith', role: 'user' },
      { clientIdx: 0, email: 'admin@acme.com', name: 'Admin Acme', role: 'company_admin' },
      { clientIdx: 1, email: 'tech@techcorp.com', name: 'Tech Support', role: 'user' },
      { clientIdx: 2, email: 'founder@startupxyz.com', name: 'Startup Founder', role: 'company_admin' },
    ];

    const createdClientUsers = [];
    for (const user of clientUsersList) {
      const client = createdClients[user.clientIdx];
      const [u] = await db.insert(users).values({
        tenantId,
        clientId: client.id,
        email: user.email,
        passwordHash,
        name: user.name,
        role: user.role as any,
        isActive: true,
      }).returning();
      createdClientUsers.push(u);
      console.log(`  ✅ ${user.email} (${client.name})`);

      // Assign to client's products
      const clientProdLinks = await db.select().from(clientProducts).where(
        eq(clientProducts.clientId, client.id)
      );
      for (const link of clientProdLinks) {
        await db.insert(userProducts).values({
          tenantId,
          userId: u.id,
          productId: link.productId,
        });
      }
    }

    // === TEAMS ===
    console.log('\n👥 Creating sample teams...');
    const teamList = [
      { name: 'Development', productIdx: 0 },
      { name: 'QA & Testing', productIdx: 0 },
      { name: 'Sales Team', productIdx: 1 },
      { name: 'HR Team', productIdx: 3 },
    ];

    for (const team of teamList) {
      const [t] = await db.insert(teams).values({
        tenantId,
        name: team.name,
        productId: createdProducts[team.productIdx].id,
      }).returning();
      console.log(`  ✅ ${team.name}`);
    }

    // === IDEAS ===
    console.log('\n💡 Creating sample ideas...');
    const ideaList = [
      {
        title: 'Add dark mode to client portal',
        description: 'Users have requested dark mode support for the client portal UI',
        creatorIdx: 0,
      },
      {
        title: 'Implement API rate limiting',
        description: 'Add rate limiting to prevent abuse',
        creatorIdx: 1,
      },
      {
        title: 'Mobile app for support tickets',
        description: 'Create native mobile app for faster ticket management',
        creatorIdx: 0,
      },
    ];

    for (const idea of ideaList) {
      const [i] = await db.insert(ideas).values({
        tenantId,
        title: idea.title,
        description: idea.description,
        createdBy: createdInternalUsers[idea.creatorIdx].id,
        status: 'inbox',
        visibility: 'public',
      }).returning();
      console.log(`  ✅ ${idea.title}`);
    }

    console.log(`\n✅ Sample data seeded successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`  Tenants: 1`);
    console.log(`  Clients: ${createdClients.length}`);
    console.log(`  Products: ${createdProducts.length}`);
    console.log(`  Internal Users: ${createdInternalUsers.length}`);
    console.log(`  Client Users: ${createdClientUsers.length}`);
    console.log(`  Teams: ${teamList.length}`);
    console.log(`  Ideas: ${ideaList.length}`);
    console.log(`\n🔐 Test Users (Password: ${PASSWORD}):`);
    console.log(`  Internal Portal: ramesh@systech.com`);
    console.log(`  Client Portal: john@acme.com\n`);
    console.log(`Next steps:`);
    console.log(`  npm run dev                  (start all services)`);
    console.log(`  npm run db:import:beads:api  (import beads items)\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', (error as Error).message);
    console.error((error as Error).stack);
    process.exit(1);
  }
}

// Run seeding
seedSampleData();
