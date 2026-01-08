/**
 * Demo Seed: AI Configs
 * Run: npm run db:seed:demo
 *
 * Creates sample AI configurations for demo purposes.
 */

import { eq, sql } from 'drizzle-orm'
import { db } from '../../index.js'
import { aiConfigs, aiConfigVersions, tags, aiConfigTags, aiConfigFavorites } from '../../schema.js'

// Demo tags for organizing AI configs
export const tagsData = [
  { id: 1, name: 'Customer Support', slug: 'customer-support', color: '#3B82F6', description: 'Prompts for customer service interactions' },
  { id: 2, name: 'Code Generation', slug: 'code-generation', color: '#10B981', description: 'Prompts for generating code' },
  { id: 3, name: 'Data Analysis', slug: 'data-analysis', color: '#8B5CF6', description: 'Prompts for analyzing data' },
  { id: 4, name: 'Documentation', slug: 'documentation', color: '#F59E0B', description: 'Prompts for writing documentation' },
  { id: 5, name: 'Translation', slug: 'translation', color: '#EC4899', description: 'Prompts for language translation' },
  { id: 6, name: 'Summarization', slug: 'summarization', color: '#06B6D4', description: 'Prompts for summarizing content' },
  { id: 7, name: 'Internal', slug: 'internal', color: '#6B7280', description: 'Internal use only' },
  { id: 8, name: 'Production', slug: 'production', color: '#EF4444', description: 'Production-ready configs' },
]

// Demo AI configs with various content types
export const aiConfigsData = [
  {
    id: 1,
    name: 'Support Ticket Classifier',
    slug: 'support-ticket-classifier',
    description: 'Classifies incoming support tickets by category and priority',
    content: `You are a support ticket classifier for {{company_name}}.

Analyze the following ticket and classify it:

**Ticket Content:**
{{ticket_content}}

**Classification Required:**
1. Category: [Bug, Feature Request, Question, Account Issue, Billing, Other]
2. Priority: [Critical, High, Medium, Low]
3. Suggested Team: [Support, Engineering, Sales, Billing]
4. Estimated Complexity: [Simple, Moderate, Complex]

Provide your classification in JSON format.`,
    contentType: 'text',
    variables: JSON.stringify([
      { name: 'company_name', description: 'Company name for context', defaultValue: 'Systech' },
      { name: 'ticket_content', description: 'The support ticket text to classify' },
    ]),
    visibility: 'public',
    createdBy: 1, // Ramesh
    metadata: JSON.stringify({ icon: 'tag', color: '#3B82F6', category: 'support' }),
  },
  {
    id: 2,
    name: 'Code Review Assistant',
    slug: 'code-review-assistant',
    description: 'Reviews code for best practices, bugs, and improvements',
    content: `You are an expert code reviewer for {{language}} projects.

Review the following code:

\`\`\`{{language}}
{{code}}
\`\`\`

Provide feedback on:
1. **Bugs & Issues**: Any potential bugs or runtime errors
2. **Best Practices**: Adherence to {{language}} best practices
3. **Performance**: Any performance concerns
4. **Security**: Potential security vulnerabilities
5. **Readability**: Code clarity and maintainability

Format your response with clear sections and code examples where applicable.`,
    contentType: 'markdown',
    variables: JSON.stringify([
      { name: 'language', description: 'Programming language', defaultValue: 'TypeScript' },
      { name: 'code', description: 'Code to review' },
    ]),
    visibility: 'public',
    createdBy: 4, // Jai (developer)
    metadata: JSON.stringify({ icon: 'code', color: '#10B981', category: 'development' }),
  },
  {
    id: 3,
    name: 'API Response Generator',
    slug: 'api-response-generator',
    description: 'Generates standardized API response structures',
    content: JSON.stringify({
      systemPrompt: "Generate API responses following REST best practices",
      responseFormat: {
        success: {
          status: "success",
          data: "{{response_data}}",
          meta: {
            timestamp: "{{timestamp}}",
            version: "{{api_version}}"
          }
        },
        error: {
          status: "error",
          error: {
            code: "{{error_code}}",
            message: "{{error_message}}"
          }
        }
      },
      guidelines: [
        "Always include appropriate HTTP status codes",
        "Use camelCase for JSON keys",
        "Include pagination for list endpoints"
      ]
    }, null, 2),
    contentType: 'json',
    variables: JSON.stringify([
      { name: 'response_data', description: 'The response payload' },
      { name: 'timestamp', description: 'ISO timestamp', defaultValue: 'auto' },
      { name: 'api_version', description: 'API version', defaultValue: 'v1' },
      { name: 'error_code', description: 'Error code for error responses' },
      { name: 'error_message', description: 'Human-readable error message' },
    ]),
    visibility: 'team',
    createdBy: 4, // Jai
    metadata: JSON.stringify({ icon: 'server', color: '#8B5CF6', category: 'api' }),
  },
  {
    id: 4,
    name: 'Customer Email Response',
    slug: 'customer-email-response',
    description: 'Generates professional customer support email responses',
    content: `You are a customer support specialist for {{company_name}}.

Draft a professional email response to the following customer inquiry:

**Customer Name:** {{customer_name}}
**Issue Type:** {{issue_type}}
**Original Message:**
{{customer_message}}

**Guidelines:**
- Be empathetic and professional
- Acknowledge the customer's concern
- Provide clear next steps
- Use a friendly but professional tone
- Sign off with: {{agent_name}}, {{company_name}} Support Team

Generate only the email body, starting with a greeting.`,
    contentType: 'text',
    variables: JSON.stringify([
      { name: 'company_name', description: 'Your company name', defaultValue: 'Systech' },
      { name: 'customer_name', description: 'Customer name' },
      { name: 'issue_type', description: 'Type of issue (billing, technical, etc.)' },
      { name: 'customer_message', description: 'The customer inquiry to respond to' },
      { name: 'agent_name', description: 'Support agent name', defaultValue: 'Support Team' },
    ]),
    visibility: 'public',
    createdBy: 2, // Mohan (support)
    metadata: JSON.stringify({ icon: 'mail', color: '#F59E0B', category: 'support' }),
  },
  {
    id: 5,
    name: 'SQL Query Generator',
    slug: 'sql-query-generator',
    description: 'Generates SQL queries from natural language descriptions',
    content: `You are a SQL expert. Generate a {{database_type}} query based on the following request.

**Database Schema:**
{{schema}}

**Request:**
{{request}}

**Requirements:**
- Use proper table aliases
- Include appropriate JOINs
- Add comments explaining complex logic
- Consider performance (use indexes where available)
- Return only the SQL query, no explanations

\`\`\`sql
-- Generated Query
\`\`\``,
    contentType: 'text',
    variables: JSON.stringify([
      { name: 'database_type', description: 'Database type', defaultValue: 'PostgreSQL' },
      { name: 'schema', description: 'Database schema description or DDL' },
      { name: 'request', description: 'Natural language query request' },
    ]),
    visibility: 'public',
    createdBy: 4, // Jai
    metadata: JSON.stringify({ icon: 'database', color: '#06B6D4', category: 'development' }),
  },
  {
    id: 6,
    name: 'Meeting Notes Summarizer',
    slug: 'meeting-notes-summarizer',
    description: 'Summarizes meeting notes into actionable items',
    content: `Summarize the following meeting notes into a structured format.

**Meeting Notes:**
{{notes}}

**Output Format:**

## Meeting Summary
[2-3 sentence overview]

## Key Decisions
- [Decision 1]
- [Decision 2]

## Action Items
| Item | Owner | Due Date |
|------|-------|----------|
| [Task] | [Person] | [Date] |

## Open Questions
- [Question 1]

## Next Steps
[What happens next]`,
    contentType: 'markdown',
    variables: JSON.stringify([
      { name: 'notes', description: 'Raw meeting notes to summarize' },
    ]),
    visibility: 'public',
    createdBy: 1, // Ramesh
    metadata: JSON.stringify({ icon: 'file-text', color: '#EC4899', category: 'productivity' }),
  },
  {
    id: 7,
    name: 'Release Notes Generator',
    slug: 'release-notes-generator',
    description: 'Generates user-friendly release notes from commit history',
    content: `Generate release notes for version {{version}} based on the following changes.

**Commit History:**
{{commits}}

**Format the release notes as:**

# Release {{version}}
*Released: {{release_date}}*

## Highlights
[Top 2-3 features in plain language]

## New Features
- [Feature descriptions for end users]

## Improvements
- [Enhancements to existing features]

## Bug Fixes
- [Fixed issues]

## Breaking Changes
- [Any breaking changes - highlight clearly]

---
*Thank you for using {{product_name}}!*`,
    contentType: 'markdown',
    variables: JSON.stringify([
      { name: 'version', description: 'Version number', defaultValue: '1.0.0' },
      { name: 'commits', description: 'Git commits or changelog entries' },
      { name: 'release_date', description: 'Release date', defaultValue: 'today' },
      { name: 'product_name', description: 'Product name', defaultValue: 'Tsklets' },
    ]),
    visibility: 'team',
    createdBy: 5, // Priya
    metadata: JSON.stringify({ icon: 'package', color: '#10B981', category: 'documentation' }),
  },
  {
    id: 8,
    name: 'Bug Report Analyzer',
    slug: 'bug-report-analyzer',
    description: 'Analyzes bug reports and suggests debugging steps',
    content: `Analyze this bug report and provide debugging guidance.

**Bug Report:**
{{bug_report}}

**Environment:**
- Application: {{app_name}}
- Version: {{app_version}}
- OS: {{os}}

**Analysis Required:**

1. **Root Cause Hypothesis**
   - Most likely cause
   - Confidence level (High/Medium/Low)

2. **Reproduction Steps**
   - Steps to reproduce (if determinable)

3. **Debugging Checklist**
   - [ ] Check logs for...
   - [ ] Verify configuration...
   - [ ] Test with...

4. **Suggested Fix**
   - Quick fix (if applicable)
   - Proper fix recommendation

5. **Prevention**
   - How to prevent similar issues`,
    contentType: 'markdown',
    variables: JSON.stringify([
      { name: 'bug_report', description: 'The bug report content' },
      { name: 'app_name', description: 'Application name', defaultValue: 'Tsklets' },
      { name: 'app_version', description: 'Application version' },
      { name: 'os', description: 'Operating system' },
    ]),
    visibility: 'public',
    createdBy: 4, // Jai
    metadata: JSON.stringify({ icon: 'bug', color: '#EF4444', category: 'development' }),
  },
  {
    id: 9,
    name: 'CI/CD Pipeline Config',
    slug: 'cicd-pipeline-config',
    description: 'Template for GitHub Actions CI/CD pipeline',
    content: `name: {{pipeline_name}}

on:
  push:
    branches: [{{branch}}]
  pull_request:
    branches: [{{branch}}]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '{{node_version}}'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  deploy:
    needs: build
    if: github.ref == 'refs/heads/{{branch}}'
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to {{environment}}
        run: echo "Deploying to {{environment}}"`,
    contentType: 'yaml',
    variables: JSON.stringify([
      { name: 'pipeline_name', description: 'Name of the pipeline', defaultValue: 'CI/CD' },
      { name: 'branch', description: 'Target branch', defaultValue: 'main' },
      { name: 'node_version', description: 'Node.js version', defaultValue: '20' },
      { name: 'environment', description: 'Deployment environment', defaultValue: 'production' },
    ]),
    visibility: 'team',
    createdBy: 3, // Sakthi (integrator)
    metadata: JSON.stringify({ icon: 'git-branch', color: '#6366F1', category: 'devops' }),
  },
  {
    id: 10,
    name: 'Data Privacy Checker',
    slug: 'data-privacy-checker',
    description: 'Reviews content for PII and sensitive data',
    content: `Review the following content for privacy and data protection compliance.

**Content to Review:**
{{content}}

**Check For:**
1. **Personally Identifiable Information (PII)**
   - Names, emails, phone numbers
   - Addresses, SSN, ID numbers
   - Financial information

2. **Sensitive Data**
   - Health information
   - Religious/political views
   - Biometric data

3. **Compliance Issues**
   - GDPR concerns
   - CCPA concerns
   - Industry-specific regulations

**Output Format:**
| Finding | Type | Severity | Location | Recommendation |
|---------|------|----------|----------|----------------|

**Risk Assessment:** [Low/Medium/High/Critical]
**Recommended Actions:** [List actions]`,
    contentType: 'text',
    variables: JSON.stringify([
      { name: 'content', description: 'Content to check for privacy issues' },
    ]),
    visibility: 'private',
    createdBy: 1, // Ramesh
    metadata: JSON.stringify({ icon: 'shield', color: '#EF4444', category: 'compliance' }),
  },
]

// Config-to-tag mappings
export const configTagsData = [
  // Support Ticket Classifier
  { configId: 1, tagId: 1 }, // Customer Support
  { configId: 1, tagId: 8 }, // Production

  // Code Review Assistant
  { configId: 2, tagId: 2 }, // Code Generation
  { configId: 2, tagId: 8 }, // Production

  // API Response Generator
  { configId: 3, tagId: 2 }, // Code Generation
  { configId: 3, tagId: 7 }, // Internal

  // Customer Email Response
  { configId: 4, tagId: 1 }, // Customer Support
  { configId: 4, tagId: 8 }, // Production

  // SQL Query Generator
  { configId: 5, tagId: 2 }, // Code Generation
  { configId: 5, tagId: 3 }, // Data Analysis

  // Meeting Notes Summarizer
  { configId: 6, tagId: 6 }, // Summarization
  { configId: 6, tagId: 8 }, // Production

  // Release Notes Generator
  { configId: 7, tagId: 4 }, // Documentation
  { configId: 7, tagId: 7 }, // Internal

  // Bug Report Analyzer
  { configId: 8, tagId: 2 }, // Code Generation
  { configId: 8, tagId: 8 }, // Production

  // CI/CD Pipeline Config
  { configId: 9, tagId: 2 }, // Code Generation
  { configId: 9, tagId: 7 }, // Internal

  // Data Privacy Checker
  { configId: 10, tagId: 7 }, // Internal
]

// User favorites
export const favoritesData = [
  { configId: 1, userId: 2 }, // Mohan favorites Support Ticket Classifier
  { configId: 4, userId: 2 }, // Mohan favorites Customer Email Response
  { configId: 2, userId: 4 }, // Jai favorites Code Review Assistant
  { configId: 5, userId: 4 }, // Jai favorites SQL Query Generator
  { configId: 8, userId: 4 }, // Jai favorites Bug Report Analyzer
  { configId: 6, userId: 1 }, // Ramesh favorites Meeting Notes Summarizer
  { configId: 1, userId: 1 }, // Ramesh favorites Support Ticket Classifier
]

export async function seedAiConfigs(tenantId: number) {
  console.log('Seeding AI configs...')

  // 1. Seed tags
  for (const tag of tagsData) {
    await db.insert(tags).values({
      ...tag,
      tenantId,
      createdBy: 1,
    }).onConflictDoNothing()
  }
  console.log(`Seeded ${tagsData.length} tags`)

  // 2. Seed AI configs
  for (const config of aiConfigsData) {
    await db.insert(aiConfigs).values({
      ...config,
      tenantId,
    }).onConflictDoNothing()
  }
  console.log(`Seeded ${aiConfigsData.length} AI configs`)

  // 3. Create initial versions for each config
  for (const config of aiConfigsData) {
    const [version] = await db.insert(aiConfigVersions).values({
      tenantId,
      configId: config.id,
      version: 1,
      content: config.content,
      contentType: config.contentType,
      variables: config.variables,
      changeNote: 'Initial version',
      createdBy: config.createdBy,
    }).onConflictDoNothing().returning()

    // Update config with activeVersionId
    if (version) {
      await db.update(aiConfigs)
        .set({ activeVersionId: version.id })
        .where(eq(aiConfigs.id, config.id))
    }
  }
  console.log(`Seeded ${aiConfigsData.length} config versions`)

  // 4. Seed config-tag relationships
  for (const ct of configTagsData) {
    await db.insert(aiConfigTags).values({
      tenantId,
      configId: ct.configId,
      tagId: ct.tagId,
    }).onConflictDoNothing()
  }
  console.log(`Seeded ${configTagsData.length} config-tag relationships`)

  // 5. Seed favorites
  for (const fav of favoritesData) {
    await db.insert(aiConfigFavorites).values({
      tenantId,
      configId: fav.configId,
      userId: fav.userId,
    }).onConflictDoNothing()
  }
  console.log(`Seeded ${favoritesData.length} favorites`)

  // 6. Reset sequences to avoid primary key conflicts
  await db.execute(sql`SELECT setval('ai_configs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ai_configs))`)
  await db.execute(sql`SELECT setval('ai_config_versions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ai_config_versions))`)
  await db.execute(sql`SELECT setval('tags_id_seq', (SELECT COALESCE(MAX(id), 1) FROM tags))`)
  await db.execute(sql`SELECT setval('ai_config_tags_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ai_config_tags))`)
  await db.execute(sql`SELECT setval('ai_config_favorites_id_seq', (SELECT COALESCE(MAX(id), 1) FROM ai_config_favorites))`)
  console.log('Reset sequences')
}
