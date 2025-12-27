import { db } from './index.js'
import { tenants, clients, users, products, clientProducts, userProducts, epics, features, devTasks, taskAssignments } from './schema.js'
import bcrypt from 'bcryptjs'

const PASSWORD = 'systech@123'

async function seed() {
  console.log('Seeding database...')

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  // === TENANT (SaaS Owner - SysTech) ===

  const [sysTechTenant] = await db.insert(tenants).values({
    name: 'SysTech',
    plan: 'enterprise',
  }).returning()

  console.log('Created tenant: SysTech (Owner)')

  // === CLIENTS (SysTech's Customers) ===

  const [acmeClient] = await db.insert(clients).values({
    tenantId: sysTechTenant.id,
    name: 'Acme Corp',
    tier: 'enterprise',
  }).returning()

  const [techcorpClient] = await db.insert(clients).values({
    tenantId: sysTechTenant.id,
    name: 'TechCorp',
    tier: 'business',
  }).returning()

  console.log('Created clients: Acme Corp, TechCorp')

  // === PRODUCTS (Owned by Tenant) ===

  const productList = [
    // Legacy Products
    { name: 'CRM (legacy)', code: 'CRML', description: 'Customer Relationship Management - Marketing, lead generation, deal conversion' },
    { name: 'SDMS (legacy)', code: 'SDMSL', description: 'Supply & Distribution Management - Multi-location distributors' },
    { name: 'MMS (legacy)', code: 'MMSL', description: 'Manufacturing Management System - Discrete manufacturing' },
    { name: 'HRM (legacy)', code: 'HRML', description: 'Human Resource Management - Recruitment to retirement' },
    { name: 'Finance (legacy)', code: 'FINL', description: 'Financial Management - Standalone and integrated finance module' },

    // New/v2 Products
    { name: 'CRM Sales', code: 'CRMS', description: 'Customer Relationship Management v2 - Pre-sale customer engagement' },
    { name: 'CRM Service', code: 'CRMSV', description: 'Customer Relationship Management v2 - Post-sale customer support' },
    { name: 'SDMS v2', code: 'SDMS', description: 'Supply & Distribution Management System v2' },
    { name: 'MMS v2', code: 'MMS', description: 'Manufacturing Management System v2' },
    { name: 'TMS', code: 'TMS', description: 'Textile Management System - spinning, processing, weaving, knitting, apparel' },
    { name: 'HRM v2', code: 'HRM', description: 'Human Resource Management v2' },
    { name: 'Finance v2', code: 'FIN', description: 'Financial Management v2' },
    { name: 'EXIM', code: 'EXIM', description: 'Export & Import Management' },

    // Internal Tools
    { name: 'Tasklets', code: 'TSKLTS', description: 'Unified platform for client issues, internal requests, and development progress' },
  ]

  const createdProducts: { id: number; name: string }[] = []
  for (const p of productList) {
    const [prod] = await db.insert(products).values({
      tenantId: sysTechTenant.id,
      name: p.name,
      code: p.code,
      description: p.description,
    }).returning()
    createdProducts.push({ id: prod.id, name: prod.name })
  }
  console.log(`Created ${productList.length} products`)

  // Helper function to find product by name
  const findProduct = (name: string) => {
    const product = createdProducts.find(p => p.name === name)
    if (!product) throw new Error(`Product not found: ${name}`)
    return product.id
  }

  // Assign products to clients
  // Acme Corp: CRM Sales, CRM Service, HRM v2, Finance v2, EXIM
  await db.insert(clientProducts).values([
    { tenantId: sysTechTenant.id, clientId: acmeClient.id, productId: findProduct('CRM Sales') },
    { tenantId: sysTechTenant.id, clientId: acmeClient.id, productId: findProduct('CRM Service') },
    { tenantId: sysTechTenant.id, clientId: acmeClient.id, productId: findProduct('HRM v2') },
    { tenantId: sysTechTenant.id, clientId: acmeClient.id, productId: findProduct('Finance v2') },
    { tenantId: sysTechTenant.id, clientId: acmeClient.id, productId: findProduct('EXIM') },
  ])

  // TechCorp: MMS v2, TMS, HRM v2
  await db.insert(clientProducts).values([
    { tenantId: sysTechTenant.id, clientId: techcorpClient.id, productId: findProduct('MMS v2') },
    { tenantId: sysTechTenant.id, clientId: techcorpClient.id, productId: findProduct('TMS') },
    { tenantId: sysTechTenant.id, clientId: techcorpClient.id, productId: findProduct('HRM v2') },
  ])
  console.log('Assigned products to clients')

  // === INTERNAL USERS (SysTech Team - clientId = null) ===

  const internalUsers = [
    { email: 'ramesh@systech.com', name: 'Ramesh', role: 'admin' },
    { email: 'mohan@systech.com', name: 'Mohan', role: 'support' },
    { email: 'sakthi@systech.com', name: 'Sakthi', role: 'integrator' },
    { email: 'jai@systech.com', name: 'Jai', role: 'developer' },
    { email: 'priya@systech.com', name: 'Priya', role: 'developer' },
  ]

  const createdInternalUsers: any[] = []
  for (const u of internalUsers) {
    const [user] = await db.insert(users).values({
      email: u.email,
      passwordHash,
      name: u.name,
      role: u.role as any,
      tenantId: sysTechTenant.id,
      clientId: null, // Internal user - no client
    }).returning()
    createdInternalUsers.push(user)
  }
  console.log('Created 5 internal users (SysTech team)')

  const jaiId = createdInternalUsers.find(u => u.email === 'jai@systech.com')?.id
  const priyaId = createdInternalUsers.find(u => u.email === 'priya@systech.com')?.id

  // === CLIENT USERS (Acme Corp) ===

  const acmeUsers = [
    { email: 'john@acme.com', name: 'John Doe', role: 'user' },
    { email: 'jane@acme.com', name: 'Jane Smith', role: 'user' },
    { email: 'kumar@acme.com', name: 'Kumar', role: 'user' },
    { email: 'latha@acme.com', name: 'Latha', role: 'company_admin' },
    { email: 'deepa@acme.com', name: 'Deepa', role: 'company_admin' },
  ]

  const createdAcmeUsers: any[] = []
  for (const u of acmeUsers) {
    const [user] = await db.insert(users).values({
      email: u.email,
      passwordHash,
      name: u.name,
      role: u.role as any,
      tenantId: sysTechTenant.id,
      clientId: acmeClient.id, // Belongs to Acme Corp
    }).returning()
    createdAcmeUsers.push(user)
  }
  console.log('Created 5 Acme Corp users')

  // === CLIENT USERS (TechCorp) ===

  const techcorpUsers = [
    { email: 'alex@techcorp.com', name: 'Alex', role: 'user' },
    { email: 'sara@techcorp.com', name: 'Sara', role: 'user' },
    { email: 'mike@techcorp.com', name: 'Mike', role: 'company_admin' },
  ]

  const createdTechcorpUsers: any[] = []
  for (const u of techcorpUsers) {
    const [user] = await db.insert(users).values({
      email: u.email,
      passwordHash,
      name: u.name,
      role: u.role as any,
      tenantId: sysTechTenant.id,
      clientId: techcorpClient.id, // Belongs to TechCorp
    }).returning()
    createdTechcorpUsers.push(user)
  }
  console.log('Created 3 TechCorp users')

  // === DEV TASKS (Internal Development) ===

  // Epic 1: CRM Sales Enhancement
  const [crmEpic] = await db.insert(epics).values({
    tenantId: sysTechTenant.id,
    productId: findProduct('CRM Sales'),
    title: 'Lead Management & Pipeline Improvements',
    description: 'Enhance lead tracking, scoring, and pipeline visualization',
    status: 'in_progress',
    priority: 1,
  }).returning()

  // Feature 1.1: Lead Scoring Engine
  const [leadScoringFeature] = await db.insert(features).values({
    tenantId: sysTechTenant.id,
    epicId: crmEpic.id,
    title: 'Automated Lead Scoring',
    description: 'AI-based lead scoring based on engagement and demographics',
    status: 'in_progress',
    priority: 1,
  }).returning()

  // Tasks for Lead Scoring
  const [task1] = await db.insert(devTasks).values({
    tenantId: sysTechTenant.id,
    featureId: leadScoringFeature.id,
    title: 'Design scoring algorithm',
    description: 'Define scoring rules and weightage for different attributes',
    type: 'task',
    status: 'done',
    priority: 1,
    storyPoints: 3,
  }).returning()

  const [task2] = await db.insert(devTasks).values({
    tenantId: sysTechTenant.id,
    featureId: leadScoringFeature.id,
    title: 'Implement scoring API endpoint',
    description: 'Create POST /api/leads/:id/score endpoint',
    type: 'task',
    status: 'in_progress',
    priority: 1,
    storyPoints: 5,
  }).returning()

  const [task3] = await db.insert(devTasks).values({
    tenantId: sysTechTenant.id,
    featureId: leadScoringFeature.id,
    title: 'Build scoring dashboard UI',
    description: 'Display lead scores in the CRM dashboard with color coding',
    type: 'task',
    status: 'todo',
    priority: 2,
    storyPoints: 5,
  }).returning()

  // Assign tasks to developers
  await db.insert(taskAssignments).values([
    { tenantId: sysTechTenant.id, taskId: task1.id, userId: jaiId },
    { tenantId: sysTechTenant.id, taskId: task2.id, userId: jaiId },
    { tenantId: sysTechTenant.id, taskId: task3.id, userId: priyaId },
  ])

  // Feature 1.2: Pipeline Visualization
  const [pipelineFeature] = await db.insert(features).values({
    tenantId: sysTechTenant.id,
    epicId: crmEpic.id,
    title: 'Visual Pipeline Board',
    description: 'Kanban-style pipeline view with drag-drop',
    status: 'planned',
    priority: 2,
  }).returning()

  const [task4] = await db.insert(devTasks).values({
    tenantId: sysTechTenant.id,
    featureId: pipelineFeature.id,
    title: 'Design pipeline stages',
    description: 'Define default stages and custom stage configuration',
    type: 'task',
    status: 'todo',
    priority: 2,
    storyPoints: 2,
  }).returning()

  const [task5] = await db.insert(devTasks).values({
    tenantId: sysTechTenant.id,
    featureId: pipelineFeature.id,
    title: 'Implement drag-drop library',
    description: 'Integrate react-beautiful-dnd for pipeline board',
    type: 'task',
    status: 'todo',
    priority: 2,
    storyPoints: 8,
  }).returning()

  await db.insert(taskAssignments).values([
    { tenantId: sysTechTenant.id, taskId: task4.id, userId: priyaId },
    { tenantId: sysTechTenant.id, taskId: task5.id, userId: jaiId },
    { tenantId: sysTechTenant.id, taskId: task5.id, userId: priyaId },
  ])

  // Epic 2: HRM v2 Attendance Module
  const [hrmEpic] = await db.insert(epics).values({
    tenantId: sysTechTenant.id,
    productId: findProduct('HRM v2'),
    title: 'Biometric Attendance Integration',
    description: 'Integrate with multiple biometric devices and build attendance reports',
    status: 'backlog',
    priority: 3,
  }).returning()

  const [biometricFeature] = await db.insert(features).values({
    tenantId: sysTechTenant.id,
    epicId: hrmEpic.id,
    title: 'Multi-device Biometric Sync',
    description: 'Support for ZKTeco, eSSL, and Anviz devices',
    status: 'backlog',
    priority: 3,
  }).returning()

  const [task6] = await db.insert(devTasks).values({
    tenantId: sysTechTenant.id,
    featureId: biometricFeature.id,
    title: 'Research device APIs',
    description: 'Document API specifications for all 3 device types',
    type: 'task',
    status: 'todo',
    priority: 3,
    storyPoints: 3,
  }).returning()

  await db.insert(taskAssignments).values([
    { tenantId: sysTechTenant.id, taskId: task6.id, userId: jaiId },
  ])

  // Bug task
  const [bugTask] = await db.insert(devTasks).values({
    tenantId: sysTechTenant.id,
    featureId: leadScoringFeature.id,
    title: 'Fix lead score calculation for null values',
    description: 'Handle null demographics gracefully without breaking scoring',
    type: 'bug',
    status: 'review',
    priority: 1,
    storyPoints: 2,
  }).returning()

  await db.insert(taskAssignments).values([
    { tenantId: sysTechTenant.id, taskId: bugTask.id, userId: priyaId },
  ])

  console.log('Created 2 epics, 3 features, 7 tasks with assignments')

  // === USER PRODUCT ASSIGNMENTS ===

  const rameshId = createdInternalUsers.find(u => u.email === 'ramesh@systech.com')?.id
  const mohanId = createdInternalUsers.find(u => u.email === 'mohan@systech.com')?.id
  const sakthiId = createdInternalUsers.find(u => u.email === 'sakthi@systech.com')?.id

  await db.insert(userProducts).values([
    { tenantId: sysTechTenant.id, userId: rameshId, productId: findProduct('CRM Sales') },
    { tenantId: sysTechTenant.id, userId: mohanId, productId: findProduct('CRM Sales') },
    { tenantId: sysTechTenant.id, userId: mohanId, productId: findProduct('CRM Service') },
    { tenantId: sysTechTenant.id, userId: sakthiId, productId: findProduct('HRM v2') },
    { tenantId: sysTechTenant.id, userId: jaiId, productId: findProduct('CRM Sales') },
    { tenantId: sysTechTenant.id, userId: priyaId, productId: findProduct('CRM Sales') },
    { tenantId: sysTechTenant.id, userId: priyaId, productId: findProduct('HRM v2') },
  ])

  // Acme Corp users
  const johnId = createdAcmeUsers.find(u => u.email === 'john@acme.com')?.id
  const janeId = createdAcmeUsers.find(u => u.email === 'jane@acme.com')?.id
  const kumarId = createdAcmeUsers.find(u => u.email === 'kumar@acme.com')?.id
  const lathaId = createdAcmeUsers.find(u => u.email === 'latha@acme.com')?.id
  const deepaId = createdAcmeUsers.find(u => u.email === 'deepa@acme.com')?.id

  await db.insert(userProducts).values([
    { tenantId: sysTechTenant.id, userId: johnId, productId: findProduct('CRM Sales') },
    { tenantId: sysTechTenant.id, userId: janeId, productId: findProduct('CRM Sales') },
    { tenantId: sysTechTenant.id, userId: janeId, productId: findProduct('CRM Service') },
    { tenantId: sysTechTenant.id, userId: kumarId, productId: findProduct('HRM v2') },
    { tenantId: sysTechTenant.id, userId: lathaId, productId: findProduct('CRM Sales') },
    { tenantId: sysTechTenant.id, userId: lathaId, productId: findProduct('HRM v2') },
    { tenantId: sysTechTenant.id, userId: deepaId, productId: findProduct('Finance v2') },
  ])

  // TechCorp users
  const alexId = createdTechcorpUsers.find(u => u.email === 'alex@techcorp.com')?.id
  const saraId = createdTechcorpUsers.find(u => u.email === 'sara@techcorp.com')?.id
  const mikeId = createdTechcorpUsers.find(u => u.email === 'mike@techcorp.com')?.id

  await db.insert(userProducts).values([
    { tenantId: sysTechTenant.id, userId: alexId, productId: findProduct('MMS v2') },
    { tenantId: sysTechTenant.id, userId: saraId, productId: findProduct('TMS') },
    { tenantId: sysTechTenant.id, userId: mikeId, productId: findProduct('MMS v2') },
    { tenantId: sysTechTenant.id, userId: mikeId, productId: findProduct('TMS') },
  ])

  console.log('Assigned products to users')

  // === SUMMARY ===

  console.log('\n✅ Seed complete!')
  console.log('\n📋 All users password: systech@123')
  console.log('\n┌─────────────────────────────────────────────────────────┐')
  console.log('│ TENANT: SysTech (Owner)                                 │')
  console.log('├─────────────────────────────────────────────────────────┤')
  console.log('│ INTERNAL PORTAL (http://localhost:3003)                 │')
  console.log('│   ramesh@systech.com    admin                           │')
  console.log('│   mohan@systech.com     support                         │')
  console.log('│   sakthi@systech.com    integrator                      │')
  console.log('│   jai@systech.com       developer                       │')
  console.log('│   priya@systech.com     developer                       │')
  console.log('├─────────────────────────────────────────────────────────┤')
  console.log('│ CLIENT PORTAL (http://localhost:3000)                   │')
  console.log('│ Client: Acme Corp                                       │')
  console.log('│   john@acme.com         user                            │')
  console.log('│   jane@acme.com         user                            │')
  console.log('│   kumar@acme.com        user                            │')
  console.log('│   latha@acme.com        company_admin                   │')
  console.log('│   deepa@acme.com        company_admin                   │')
  console.log('│ Client: TechCorp                                        │')
  console.log('│   alex@techcorp.com     user                            │')
  console.log('│   sara@techcorp.com     user                            │')
  console.log('│   mike@techcorp.com     company_admin                   │')
  console.log('└─────────────────────────────────────────────────────────┘')
}

seed().catch(console.error)
