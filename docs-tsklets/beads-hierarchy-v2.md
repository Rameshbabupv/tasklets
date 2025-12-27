# Beads Issue Hierarchy - Tsklets Project (v2)

> **Version 2** - Includes Requirements Workflow Integration
>
> **Changes from v1:**
> - Added Requirements (RQ) ticket type and lifecycle
> - Defined DRAFT → BRAINSTORM → SOLIDIFIED → AMENDMENT workflow
> - Claude as bridge between business requirements and technical implementation
> - Simplified: No bidirectional sync, one-way flow (App → Claude → Beads)

## Overview
This document defines the hierarchical structure for organizing work in the Tsklets project using beads, including the requirements workflow where CEO/BA collaborate with Claude to translate business needs into technical epics and features.

## Hierarchy Levels

```
Product: Tsklets (tsklets-*)
    │
    ├─── Epic (Strategic initiatives, 3-6 months)
    │      │
    │      ├─── Feature (User-facing functionality, 2-4 weeks)
    │      │      │
    │      │      ├─── Use Case (Specific user scenario - LOGICAL grouping)
    │      │      │      │
    │      │      │      ├─── Task (Implementation work, 1-5 days)
    │      │      │      │      │
    │      │      │      │      └─── Subtask (Granular work, hours to 1 day)
    │      │      │      │
    │      │      │      ├─── Task (Test work for use case)
    │      │      │      │
    │      │      │      └─── Bug (Use case specific defects)
    │      │      │
    │      │      ├─── Spike (Research/investigation, timeboxed)
    │      │      │
    │      │      └─── Chore (Tech debt, refactoring, maintenance)
    │      │
    │      └─── Merge Request (Code review, tied to feature/task)
    │
    └─── Molecule (Atomic reusable patterns/components)
```

## Issue Type Definitions

### 1. **Product** (Implicit - Project Name)
- **What**: The top-level product or project
- **Example**: `Tsklets` (prefix: `tsklets-`)
- **Characteristics**:
  - Not a beads type, but the organizational boundary
  - All issues belong to one product
  - Defined by beads database prefix

### 2. **Epic**
- **Type**: `--type=epic`
- **What**: Large strategic initiatives that deliver major business value
- **Duration**: 3-6 months (or longer)
- **Size**: Multiple features
- **Priority**: P0-P2 typically
- **Examples**:
  - "Authentication & Authorization System"
  - "Multi-Tenant Ticket Management"
  - "Feature Request & Quote Management"
- **Contains**: Features, sometimes direct tasks
- **When to use**:
  - Major product capabilities
  - Cross-team initiatives
  - Long-term roadmap items

### 3. **Feature**
- **Type**: `--type=feature`
- **What**: User-facing functionality or significant technical capability
- **Duration**: 2-4 weeks
- **Size**: Multiple tasks
- **Priority**: P0-P3
- **Examples**:
  - "User Signup & Signin with JWT"
  - "Role-Based Access Control (RBAC) Middleware"
  - "Multi-Tenant Isolation & Tenant Resolution"
- **Parent**: Epic (via `--parent` or dependency)
- **Contains**: Use cases (logical grouping), tasks, bugs, chores, spikes
- **When to use**:
  - Adds new capability users/developers interact with
  - Implements a complete user story
  - Delivers standalone value

### 4. **Use Case** (LOGICAL Layer - Not a beads type)
- **Type**: Implemented as `--type=task` with `--parent=<feature-id>` and label `--labels=use-case`
- **What**: Specific user scenario or interaction flow within a feature
- **Duration**: 2-5 days (including implementation + testing)
- **Size**: One complete scenario from start to finish
- **Priority**: Inherits from parent feature
- **Examples** (for "User Signup & Signin" feature):
  - "UC: User signs up with valid email and password"
  - "UC: User attempts signup with duplicate email (should fail)"
  - "UC: User signs in with correct credentials"
  - "UC: User signs in with wrong password (should fail)"
  - "UC: User signs in with non-existent email (should fail)"
  - "UC: User session expires and gets 401 error"
- **Parent**: Feature (via `--parent`)
- **Contains**:
  - Implementation tasks (code to make it work)
  - Test tasks (verify it works)
  - Bugs (when use case fails)
- **When to use**:
  - Feature has multiple distinct user scenarios
  - Each scenario needs separate implementation and testing
  - Helps organize acceptance criteria
  - Enables scenario-driven development (BDD style)
- **Implementation Pattern**:
  ```bash
  # Create use case as a task under feature
  bd create --title="UC: User signs up with valid credentials" \
            --type=task \
            --parent=<feature-id> \
            --labels=use-case \
            --priority=0

  # Create implementation task under use case
  bd create --title="Implement valid signup flow" \
            --type=task \
            --parent=<use-case-id>

  # Create test task under use case
  bd create --title="Test valid signup scenario" \
            --type=task \
            --parent=<use-case-id> \
            --labels=test
  ```

### 5. **Task**
- **Type**: `--type=task` (default)
- **What**: Individual unit of implementation work
- **Duration**: 1-5 days
- **Size**: Single developer, focused scope
- **Priority**: P0-P4
- **Examples**:
  - "Create User model in Drizzle schema"
  - "Implement /api/auth/signup endpoint"
  - "Add JWT generation utility function"
  - "Write integration tests for signup flow"
- **Parent**: Feature (via `--parent`)
- **Contains**: Subtasks (optional)
- **When to use**:
  - Specific implementation work
  - Can be completed independently
  - Has clear acceptance criteria

### 6. **Subtask**
- **Type**: `--type=task` with `--parent=<task-id>`
- **What**: Granular breakdown of a task
- **Duration**: Hours to 1 day
- **Size**: Very focused, single responsibility
- **Priority**: Inherits from parent
- **Examples**:
  - "Define User schema fields"
  - "Add email uniqueness constraint"
  - "Create database migration for users table"
- **Parent**: Task (via `--parent`)
- **When to use**:
  - Task is too large and needs breakdown
  - Parallel work by multiple developers
  - Track very granular progress

### 7. **Bug**
- **Type**: `--type=bug`
- **What**: Defect or incorrect behavior to fix
- **Duration**: Variable (hours to days)
- **Priority**: P0 (critical) to P4 (minor)
- **Severity**: Based on impact
- **Examples**:
  - "Signup fails when email contains +"
  - "JWT token expires too quickly"
  - "Tenant isolation broken for admin users"
- **Parent**: Feature or Epic (optional)
- **Labels**: `production`, `regression`, `security`, etc.
- **When to use**:
  - Something doesn't work as expected
  - Production incidents
  - Regression from previous changes
  - Security vulnerabilities

### 8. **Spike**
- **Type**: `--type=task` with label `spike`
- **What**: Timeboxed research or investigation
- **Duration**: Fixed timebox (e.g., 2-4 hours)
- **Output**: Decision, proof-of-concept, or recommendation
- **Examples**:
  - "Research OAuth vs JWT for auth"
  - "Investigate bcrypt vs argon2 for password hashing"
  - "Prototype multi-tenant query middleware"
- **Parent**: Feature or Epic
- **When to use**:
  - Unclear implementation approach
  - Technology evaluation needed
  - Performance investigation
  - **IMPORTANT**: Always timebox spikes!

### 9. **Chore**
- **Type**: `--type=chore`
- **What**: Maintenance, refactoring, tech debt that doesn't change behavior
- **Duration**: Variable
- **Priority**: Usually P2-P4
- **Examples**:
  - "Refactor auth middleware to reduce duplication"
  - "Update dependencies to latest versions"
  - "Add TypeScript strict mode to auth module"
  - "Organize imports in auth files"
- **Parent**: Feature or Epic (optional)
- **When to use**:
  - Code cleanup without behavior change
  - Dependency updates
  - Tech debt reduction
  - Developer experience improvements

### 10. **Merge Request**
- **Type**: `--type=merge-request`
- **What**: Code review request (like GitHub PR)
- **Duration**: Hours (review time)
- **Examples**:
  - "MR: Implement user signup endpoint"
  - "MR: Add RBAC middleware"
- **Parent**: Feature or Task
- **When to use**:
  - Track code review process
  - Link PR to task/feature
  - Manage review feedback

### 11. **Molecule**
- **Type**: `--type=molecule`
- **What**: Reusable atomic patterns or components
- **Duration**: N/A (pattern definition)
- **Examples**:
  - "Auth Guard Pattern"
  - "Tenant Scoping Query Pattern"
  - "Error Response Format"
- **When to use**:
  - Define reusable patterns across project
  - Template for common solutions
  - Architectural building blocks

## Dependency Relationships

### Hierarchical Dependencies (Parent-Child)
```bash
# Create child with explicit parent
bd create --title="Task" --type=task --parent=<feature-id>
bd create --title="Subtask" --type=task --parent=<task-id>
```

### Logical Dependencies (Blocks/Depends-On)
```bash
# Feature depends on Epic (Epic blocks Feature)
bd dep add <feature-id> <epic-id>

# Task depends on another Task
bd dep add <task-b> <task-a>  # Task B depends on Task A
```

### Dependency Types

1. **Blocks** (`A blocks B`):
   - B cannot start until A is done
   - `bd dep add B A` → "B depends on A" → "A blocks B"

2. **Discovered-From**:
   - Track issue discovery source
   - `bd create --deps discovered-from:bd-123`

3. **Waits-For** (Fanout Gates):
   - Parent waits for all/any children
   - `bd create --waits-for=<parent-id> --waits-for-gate=all-children`

## Tsklets Project Example

```
Product: Tsklets (tsklets-*)
│
├─ Epic: Authentication & Authorization System [tsklets-8he]
│  │
│  ├─ Feature: Password Security & Hashing [tsklets-bcx]
│  │  ├─ Task: Install bcrypt package [tsklets-xxx]
│  │  ├─ Task: Create password hash utility [tsklets-yyy]
│  │  │  └─ Subtask: Write hash function
│  │  │  └─ Subtask: Write compare function
│  │  ├─ Task: Add password validation [tsklets-zzz]
│  │  ├─ Task: Write unit tests for password utils
│  │  └─ Bug: Hash comparison fails for special chars
│  │
│  ├─ Feature: User Signup & Signin with JWT [tsklets-cbt]
│  │  │  (depends on: Password Security & Hashing)
│  │  │
│  │  ├─ Use Case: UC01 - Valid User Signup [tsklets-uc1] (label: use-case)
│  │  │  ├─ Task: Create User model in Drizzle schema
│  │  │  ├─ Task: Implement POST /api/auth/signup endpoint
│  │  │  ├─ Task: Add JWT generation on successful signup
│  │  │  └─ Task: Test valid signup flow (label: test)
│  │  │
│  │  ├─ Use Case: UC02 - Duplicate Email Signup [tsklets-uc2] (label: use-case)
│  │  │  ├─ Task: Add email uniqueness validation
│  │  │  ├─ Task: Return 409 Conflict error
│  │  │  └─ Task: Test duplicate email rejection (label: test)
│  │  │
│  │  ├─ Use Case: UC03 - Valid User Signin [tsklets-uc3] (label: use-case)
│  │  │  ├─ Task: Implement POST /api/auth/signin endpoint
│  │  │  ├─ Task: Verify password using bcrypt
│  │  │  ├─ Task: Generate and return JWT token
│  │  │  └─ Task: Test successful signin flow (label: test)
│  │  │
│  │  ├─ Use Case: UC04 - Invalid Credentials Signin [tsklets-uc4] (label: use-case)
│  │  │  ├─ Task: Handle wrong password scenario
│  │  │  ├─ Task: Handle non-existent email scenario
│  │  │  ├─ Task: Return 401 Unauthorized error
│  │  │  └─ Task: Test invalid credential rejection (label: test)
│  │  │
│  │  ├─ Spike: Research JWT expiration best practices
│  │  └─ Chore: Refactor auth route handlers
│  │
│  ├─ Feature: Multi-Tenant Isolation [tsklets-4tj]
│  │  ├─ Task: Create tenant resolution middleware
│  │  ├─ Task: Add tenant_id to JWT payload
│  │  ├─ Task: Implement query auto-injection
│  │  └─ Bug: Owner can't see all tenants
│  │
│  ├─ Feature: RBAC Middleware [tsklets-af1]
│  │  │  (depends on: User Signup & Signin)
│  │  ├─ Task: Define role enum in types
│  │  ├─ Task: Create role check middleware
│  │  ├─ Task: Add role decorators for routes
│  │  └─ Task: Write tests for each role
│  │
│  ├─ Feature: Protected Routes & Auth Guards [tsklets-4rp]
│  │  │  (depends on: RBAC Middleware, Signup & Signin)
│  │  ├─ Task: Create JWT verification middleware
│  │  ├─ Task: Handle missing/invalid tokens
│  │  ├─ Task: Add 401/403 error responses
│  │  └─ Task: Apply guards to client & internal portals
│  │
│  └─ Feature: Session Management & Token Refresh [tsklets-0sq]
│     │  (depends on: User Signup & Signin)
│     ├─ Task: Implement token refresh endpoint
│     ├─ Task: Create logout handler
│     ├─ Spike: Evaluate refresh token pattern
│     └─ Task: Add token expiration handling
│
├─ Epic: Multi-Tenant Ticket Management [tsklets-3ss]
│  ├─ Feature: Ticket CRUD Operations
│  ├─ Feature: Screenshot Upload
│  └─ Feature: Dual Priority/Severity
│
└─ Epic: Infrastructure & Deployment [tsklets-u02]
   ├─ Feature: Docker Setup
   ├─ Feature: PostgreSQL Migration
   └─ Feature: Security Hardening
```

## Best Practices

### 1. **Granularity Guidelines**
- **Epic**: Can you ship pieces independently over months? → Epic
- **Feature**: Can users/developers see/use this? → Feature
- **Use Case**: Is this one specific user interaction scenario? → Use Case
- **Task**: Can one dev finish this in < 1 week? → Task
- **Subtask**: Is this a few hours of work? → Subtask

### 2. **When to Create What**

| Scenario | Type | Example |
|----------|------|---------|
| Major roadmap item | Epic | "Authentication System" |
| New user capability | Feature | "User Signup & Signin" |
| Specific user scenario | Use Case (task + label) | "UC: User signs up with valid email" |
| Implementation work | Task | "Create signup endpoint" |
| Very granular work | Subtask | "Add email field to schema" |
| Something broken | Bug | "Signup fails for Gmail users" |
| Need to research | Spike (task + label) | "Research JWT libraries" |
| Code cleanup | Chore | "Refactor auth middleware" |
| Code review | Merge Request | "MR: Add signup feature" |
| Reusable pattern | Molecule | "Auth Guard Pattern" |

### 3. **Priority Assignment**

| Priority | Epic | Feature | Task/Bug |
|----------|------|---------|----------|
| **P0** | Critical business need | Core MVP functionality | Blocker, production down |
| **P1** | Important next phase | Key features | High impact, must have |
| **P2** | Medium-term goal | Nice to have | Should have |
| **P3** | Future consideration | Enhancement | Nice to have |
| **P4** | Backlog | Wishlist | Low priority, polish |

### 4. **Dependency Management**
- **Link features to epics**: Creates strategic alignment
- **Link tasks to features**: Shows implementation breakdown
- **Link bugs to features**: Tracks quality issues
- **Avoid circular dependencies**: Use `bd doctor` to detect

### 5. **Workflow States**
```
open → in_progress → review → done
              ↓
           blocked (if dependencies not met)
```

### 6. **Naming Conventions**
- **Epic**: Business outcome → "Authentication & Authorization System"
- **Feature**: Capability → "User Signup & Signin with JWT"
- **Task**: Action → "Implement POST /api/auth/signup"
- **Bug**: Problem → "Signup fails for emails with +"
- **Spike**: Question → "Research OAuth vs JWT trade-offs"
- **Chore**: Maintenance → "Refactor auth middleware"

## Requirements Workflow (New in v2)

### Overview

The Tsklets project uses a special **Requirements (RQ)** ticket type to bridge business needs and technical implementation. This workflow involves CEO/BA collaboration with Claude to translate high-level requirements into structured epics, features, and use cases.

### Requirements Lifecycle

```
DRAFT → BRAINSTORM → SOLIDIFIED → IN_DEVELOPMENT → COMPLETED
  ↑                                                      │
  │                                                      │
  └──────────────── AMENDMENT (cycle repeats) ◄─────────┘
```

### Status Definitions

| Status | Description | Who's Involved | Next Step |
|--------|-------------|----------------|-----------|
| **DRAFT** | Requirements team drafts initial business need | BA, Product, CEO | Collaborative editing until ready |
| **BRAINSTORM** | Claude session to analyze and structure | BA, CEO, Claude | Iterate until agreement |
| **SOLIDIFIED** | Final approved structure ready for dev | BA, CEO approve | Claude creates in beads |
| **IN_DEVELOPMENT** | Implementation started in beads | Developers | Work on epic/features |
| **COMPLETED** | All features implemented and shipped | - | Close or add amendment |
| **AMENDMENT** | New addition to existing requirement | BA, CEO, Claude | Back to BRAINSTORM |

### Workflow Steps

#### Step 1: DRAFT - Requirements Team Collaboration

```
App: Create new ticket
  Type: REQUIREMENTS (RQ)
  ID: TSK-RQ-042
  Title: "Need better authentication"
  Status: DRAFT

  Description (collaborative editing):
  ─────────────────────────────────────
  Customers asking for SSO
  Maybe OAuth? Not sure...
  Need "remember me" functionality
  Security concerns about passwords
  Some enterprise clients need SAML
  ─────────────────────────────────────

  Created by: Sarah (BA)
  Contributors: John (CEO), Mike (Product)
  Last edited: 2025-12-22
```

**Actions:**
- Requirements team adds/edits content freely
- No structure required yet
- Capture all ideas, concerns, customer requests
- When ready: Click "Start Brainstorm" → Status = BRAINSTORM

#### Step 2: BRAINSTORM - Claude Session

```
BA opens Claude session with requirement:

BA: "Claude, here's requirement TSK-RQ-042. Help us structure this."

Claude reads:
  ✓ Requirement draft
  ✓ Current codebase architecture
  ✓ Existing epics/features
  ✓ Related dependencies

Claude analyzes:
  "I see you already have JWT utils in the codebase.
   For SSO, we have options:

   Option A: Start with JWT (simpler, faster)
     - Covers signup/signin/remember-me
     - SAML/OAuth as Phase 2
     - Estimated: 3 weeks

   Option B: Go straight to OAuth
     - More future-proof
     - Requires provider setup
     - Estimated: 6 weeks

   Recommendation: Option A - JWT first, OAuth later

   Proposed structure:
   Epic: Authentication & Authorization System
     Feature 1: User Signup & Signin (JWT)
       - UC01: Valid signup
       - UC02: Duplicate email rejection
       - UC03: Valid signin
       - UC04: Invalid credentials
     Feature 2: Remember Me (30-day token)
     Feature 3: OAuth SSO (Phase 2 - defer)
     Feature 4: SAML SSO (Phase 2 - defer)

   Questions:
   1. Start with Option A (JWT)?
   2. Any specific OAuth providers needed?
   3. Timeline constraints?"

BA/CEO: "Yes, start with JWT. We need Google OAuth for Phase 2.
         Timeline: 4 weeks max."

Claude: "Got it. Let me refine based on 4-week timeline..."
```

**Iteration continues** until everyone agrees.

#### Step 3: SOLIDIFIED - Final Structure

Claude writes final structure in the requirement's `#claude-rewrite-session` section:

```
Requirement: TSK-RQ-042
Status: SOLIDIFIED

#original-draft
─────────────────────────────────────
Customers asking for SSO
Maybe OAuth? Not sure...
Need "remember me" functionality
Security concerns about passwords
Some enterprise clients need SAML
─────────────────────────────────────

#claude-rewrite-session
─────────────────────────────────────
Solidified: 2025-12-27
Participants: Sarah (BA), John (CEO), Claude

Epic: Authentication & Authorization System

Phase 1 (MVP - 4 weeks):
  Feature 1: User Signup & Signin with JWT
    Use Cases:
      - UC01: Valid user signup (email + password)
      - UC02: Duplicate email rejection (409 error)
      - UC03: Valid user signin (credentials match)
      - UC04: Invalid credentials (wrong password/email)
    Acceptance:
      - Returns 201 + JWT on signup
      - Returns 200 + JWT on signin
      - JWT contains: tenant_id, user_id, role, is_owner
      - Password hashed with bcrypt (10 rounds)

  Feature 2: Remember Me Token
    Use Cases:
      - UC01: User selects "remember me" (30-day token)
      - UC02: Token refresh before expiration
      - UC03: Token revocation on logout
    Acceptance:
      - Extended JWT expiration (30 days vs 24 hours)
      - Refresh endpoint available
      - Secure httpOnly cookie storage

Phase 2 (Future - Post-MVP):
  Feature 3: OAuth SSO (Google, Microsoft)
  Feature 4: SAML SSO for Enterprise
  Feature 5: Two-Factor Authentication (2FA)

Technical Decisions:
  - JWT (not OAuth) for MVP
  - bcrypt for password hashing
  - Token expiration: 24h default, 30d with remember-me
  - No refresh tokens in Phase 1 (keep simple)
  - Refresh tokens in Phase 2

Out of Scope (Not doing):
  - Magic link login (maybe Phase 3)
  - Biometric authentication
  - Passwordless login

Dependencies:
  - Requires: User model, Tenant model (already exists)
  - Blocks: All user-facing features (everything needs auth)

Timeline:
  - Week 1: Feature 1 (Signup/Signin)
  - Week 2-3: Feature 2 (Remember Me)
  - Week 4: Testing, bug fixes, deployment

Approved by:
  - John (CEO) - 2025-12-27
  - Sarah (BA) - 2025-12-27

Ready for implementation: YES
─────────────────────────────────────
```

**App updates:**
- Status: SOLIDIFIED
- Solidified date: 2025-12-27
- Approved by: ['john', 'sarah']

#### Step 4: IN_DEVELOPMENT - Claude Creates in Beads

```
Claude executes in beads session:

# Create Epic
bd create --title="Authentication & Authorization System" \
          --type=epic \
          --priority=0 \
          --description="Complete auth system with JWT, remember-me, and future SSO support" \
          --external-ref=TSK-RQ-042
Result: tsklets-abc123

# Create Feature 1
bd create --title="User Signup & Signin with JWT" \
          --type=feature \
          --priority=0 \
          --estimate=2400 \
          --labels=mvp,phase-1,auth \
          --external-ref=TSK-RQ-042-F1
Result: tsklets-def456
bd dep add tsklets-def456 tsklets-abc123

# Create Use Cases
bd create --title="UC01: Valid user signup" \
          --type=task \
          --parent=tsklets-def456 \
          --labels=use-case,happy-path \
          --acceptance="Returns 201 + JWT token"
Result: tsklets-uc001

bd create --title="UC02: Duplicate email rejection" \
          --type=task \
          --parent=tsklets-def456 \
          --labels=use-case,error-case \
          --acceptance="Returns 409 Conflict error"
Result: tsklets-uc002

# ... continue for all use cases and features
```

**App updates:**
```
Requirement: TSK-RQ-042
  Status: IN_DEVELOPMENT
  Beads Epic: tsklets-abc123
  Created in beads: 2025-12-27

  Implementation tracking:
    Epic: tsklets-abc123 (0% complete)
    Features: 2 created
    Use Cases: 8 created
    Tasks: 0 created (pending)
```

**No bidirectional sync needed!** Claude created everything manually with context.

#### Step 5: AMENDMENT - Future Changes

```
Time: 2 weeks later
Situation: Enterprise customer needs SAML NOW (contract requirement)

BA creates amendment:
  Requirement: TSK-RQ-042
  Amendment #1: TSK-RQ-042-A001

  Title: "Add SAML SSO for Enterprise (Urgent)"
  Requested by: Acme Corp (enterprise customer)
  Business justification: Contract requirement, $500K deal
  Urgency: HIGH

  Status: AMENDMENT_DRAFT
  Description:
  ─────────────────────────────────────
  Acme Corp (enterprise) needs SAML SSO
  They use Okta as identity provider
  Required before Phase 2 OAuth
  Deadline: 3 weeks from now
  ─────────────────────────────────────

BA starts Claude session for amendment:

BA: "Claude, we need to add SAML SSO urgently. Check TSK-RQ-042-A001."

Claude reads:
  ✓ Original requirement (TSK-RQ-042)
  ✓ Current implementation status (60% complete)
  ✓ Existing Epic (tsklets-abc123)
  ✓ Amendment details (SAML urgency)

Claude analyzes:
  "Current status:
   - Feature 1 (Signup/Signin): 80% complete
   - Feature 2 (Remember Me): 40% complete

   Options for SAML:

   Option A: Add to existing Epic (RECOMMENDED)
     - Fits architecturally
     - Can reuse JWT infrastructure
     - Add as Feature 3 (before OAuth)
     - Estimated: 2 weeks

   Option B: New Epic
     - Separates SSO concerns
     - More complex coordination
     - Estimated: 3 weeks

   Recommendation: Option A

   Proposed addition:
   Epic: Authentication & Authorization System (tsklets-abc123)
     Feature 3: SAML SSO for Enterprise (NEW)
       - UC01: Enterprise user signs in via SAML
       - UC02: SAML metadata configuration
       - UC03: User provisioning via SAML
       - UC04: SAML logout (single sign-out)

   Impact:
   - Slight delay to OAuth (pushes to later)
   - No impact on current work (parallel track)
   - Requires: SAML library (passport-saml or similar)"

BA/CEO: "Approved. Add to existing epic. Prioritize over OAuth."

#claude-rewrite-session (amendment):
─────────────────────────────────────
Amendment #1: SAML SSO for Enterprise
Solidified: 2025-01-15
Urgency: HIGH (contract requirement)

Add to Epic: tsklets-abc123

Feature 3: SAML SSO for Enterprise
  Use Cases:
    - UC01: Enterprise user SAML login via Okta
    - UC02: Admin configures SAML metadata
    - UC03: User auto-provisioning via SAML attributes
    - UC04: Single sign-out (SAML logout)

  Technical:
    - Library: passport-saml
    - Provider: Okta (first), generic SAML later
    - Metadata: Store in database per tenant
    - Attributes mapping: email, name, role

  Timeline: 2 weeks
  Priority: Insert before OAuth (was Feature 3)

Updated Phase Plan:
  Phase 1: Signup/Signin, Remember Me (original)
  Phase 1.5: SAML SSO (NEW - urgent)
  Phase 2: OAuth, 2FA (delayed)

Approved by:
  - John (CEO) - 2025-01-15
  - Sarah (BA) - 2025-01-15
─────────────────────────────────────

Claude creates in beads:
  bd create --title="SAML SSO for Enterprise" \
            --type=feature \
            --priority=0 \
            --labels=enterprise,urgent,saml \
            --external-ref=TSK-RQ-042-A001
  Result: tsklets-xyz789

  bd dep add tsklets-xyz789 tsklets-abc123  # Add to existing epic

App updates:
  Requirement: TSK-RQ-042
    Status: IN_DEVELOPMENT
    Amendments: [1]

  Amendment #1: TSK-RQ-042-A001
    Status: AMENDMENT_SOLIDIFIED
    Beads Feature: tsklets-xyz789
    Created: 2025-01-15
```

### Database Schema (App Side)

```sql
-- Requirements table
CREATE TABLE requirements (
  id VARCHAR PRIMARY KEY,                   -- TSK-RQ-042
  title VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR NOT NULL,                  -- DRAFT, BRAINSTORM, SOLIDIFIED, etc.

  -- Original draft (preserved)
  original_draft TEXT,
  original_draft_updated_at TIMESTAMP,

  -- Claude rewrite session output
  claude_rewrite TEXT,                      -- Final structure
  claude_rewrite_updated_at TIMESTAMP,

  -- Implementation tracking
  beads_epic_id VARCHAR,                    -- tsklets-abc123
  implementation_started_at TIMESTAMP,

  -- Workflow tracking
  created_by VARCHAR,
  created_at TIMESTAMP,
  brainstorm_started_at TIMESTAMP,
  brainstorm_participants VARCHAR[],        -- ['sarah', 'john', 'claude']
  solidified_at TIMESTAMP,
  approved_by VARCHAR[],                    -- ['john', 'sarah']
  completed_at TIMESTAMP,

  CONSTRAINT valid_status CHECK (status IN (
    'DRAFT', 'BRAINSTORM', 'SOLIDIFIED',
    'IN_DEVELOPMENT', 'COMPLETED'
  ))
);

-- Amendments table
CREATE TABLE requirement_amendments (
  id VARCHAR PRIMARY KEY,                   -- TSK-RQ-042-A001
  requirement_id VARCHAR REFERENCES requirements(id),
  amendment_number INT NOT NULL,            -- 1, 2, 3...

  title VARCHAR NOT NULL,
  description TEXT,
  business_justification TEXT,
  urgency VARCHAR,                          -- LOW, MEDIUM, HIGH, CRITICAL
  requested_by VARCHAR,
  requested_at TIMESTAMP,

  claude_rewrite TEXT,
  status VARCHAR NOT NULL,                  -- AMENDMENT_DRAFT, AMENDMENT_BRAINSTORM, AMENDMENT_SOLIDIFIED

  beads_feature_id VARCHAR,                 -- tsklets-xyz789
  approved_by VARCHAR[],
  approved_at TIMESTAMP,

  CONSTRAINT valid_amendment_status CHECK (status IN (
    'AMENDMENT_DRAFT', 'AMENDMENT_BRAINSTORM',
    'AMENDMENT_SOLIDIFIED', 'AMENDMENT_IN_DEVELOPMENT',
    'AMENDMENT_COMPLETED'
  ))
);

CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_requirements_beads_epic ON requirements(beads_epic_id);
CREATE INDEX idx_amendments_requirement ON requirement_amendments(requirement_id);
CREATE INDEX idx_amendments_status ON requirement_amendments(status);
```

### Key Principles

#### 1. **No Bidirectional Sync**
- Requirements stay in App
- Epics/features created in Beads
- Link via `external-ref` (one-way reference)
- No complex sync logic needed

#### 2. **Claude as Bridge**
- Understands business language
- Knows codebase architecture
- Translates between domains
- Creates technical structure

#### 3. **Preserve History**
- Original draft never deleted
- All amendments tracked
- Full audit trail
- See evolution over time

#### 4. **Status-Driven Workflow**
- Clear states for tracking
- Each status has specific actions
- Visual progress indicators
- Easy to query/report

#### 5. **Flexible Amendments**
- Requirements evolve over time
- Don't require new requirement ticket
- Linked to original context
- Can add features to existing epics

### Integration Points

```
App (Tsklets)                      Beads (Developer Tool)
─────────────────────────────────────────────────────────

1. Requirement Created (DRAFT)
   ↓
2. Requirement Refined (BRAINSTORM)
   ↓
3. Requirement Solidified
   ↓
4. Claude creates Epic ──────────→ Epic created (auto-generated ID)
   external-ref stored                external-ref = TSK-RQ-042
   ↓
5. App shows implementation ←────── Beads tracks progress
   link to beads epic                 Epic → Features → Use Cases → Tasks
   ↓
6. Amendment needed
   ↓
7. Claude adds Feature ───────────→ Feature added to existing Epic
   external-ref stored                external-ref = TSK-RQ-042-A001
   ↓
8. Requirement completed ←────────── All beads issues closed
   marked COMPLETED                   Epic status = done
```

### Example: Full Lifecycle

```
Day 1: BA creates TSK-RQ-042 (DRAFT)
  "Need better authentication"

Day 2-3: Team collaborates on draft
  Adds customer requests, concerns

Day 4: Start brainstorm (BRAINSTORM)
  BA + Claude session
  Iterate on structure

Day 5: Finalize structure (SOLIDIFIED)
  Epic, 2 features, 8 use cases defined
  Approved by CEO and BA

Day 5 (later): Claude creates in beads (IN_DEVELOPMENT)
  Epic: tsklets-abc123
  Features: tsklets-def456, tsklets-ghi789
  Use Cases: tsklets-uc001 through uc008

Week 2-4: Development proceeds
  Developers work on tasks
  Progress visible in app

Week 3: Amendment needed (AMENDMENT)
  TSK-RQ-042-A001: "Add SAML SSO"
  Brainstorm → Solidified
  Claude adds Feature: tsklets-xyz789

Week 6: All features complete (COMPLETED)
  Epic tsklets-abc123 closed
  Requirement TSK-RQ-042 marked COMPLETED
  Amendment TSK-RQ-042-A001 marked COMPLETED
```

### Benefits

✅ **Clear Separation**: Business (app) vs Technical (beads)
✅ **No Sync Complexity**: One-way flow, human-in-loop
✅ **Full Traceability**: Requirements linked to epics
✅ **Flexibility**: Amendments without new tickets
✅ **Context Preservation**: Claude knows codebase + business need
✅ **Audit Trail**: Complete history of decisions
✅ **Collaboration**: BA/CEO/Claude work together

## Custom ID Naming Conventions

### Why Use Custom IDs?

By default, beads auto-generates IDs like `tsklets-8he`, `tsklets-cbt`, etc. While functional, these are hard to remember and don't indicate the issue type. **Custom IDs** make your workflow more intuitive.

### Recommended ID Schema for Tsklets

| Type | Prefix | Format | Example | Description |
|------|--------|--------|---------|-------------|
| **Epic** | `e` | `tsklets-e###` | `tsklets-e001` | Epic #1 |
| **Feature** | `f` | `tsklets-f###` | `tsklets-f001` | Feature #1 |
| **Use Case** | `uc` | `tsklets-uc###` | `tsklets-uc001` | Use Case #1 |
| **Task** | `t` | `tsklets-t###` | `tsklets-t001` | Task #1 |
| **Bug** | `b` | `tsklets-b###` | `tsklets-b001` | Bug #1 |
| **Spike** | `s` | `tsklets-s###` | `tsklets-s001` | Spike #1 |
| **Chore** | `c` | `tsklets-c###` | `tsklets-c001` | Chore #1 |

### Hierarchical ID Schema (Alternative)

For complex projects, use hierarchical IDs that show parent-child relationships:

```
tsklets-e001              Epic: Authentication System
├─ tsklets-e001-f001      Feature: User Signup & Signin
│  ├─ tsklets-e001-f001-uc001   Use Case: Valid Signup
│  │  ├─ tsklets-e001-f001-uc001-t001   Task: Create User model
│  │  ├─ tsklets-e001-f001-uc001-t002   Task: Implement signup endpoint
│  │  └─ tsklets-e001-f001-uc001-t003   Task: Test valid signup
│  ├─ tsklets-e001-f001-uc002   Use Case: Duplicate Email Signup
│  └─ tsklets-e001-f001-uc003   Use Case: Valid Signin
├─ tsklets-e001-f002      Feature: RBAC Middleware
└─ tsklets-e001-f003      Feature: Protected Routes
```

**Benefits:**
- ✅ See hierarchy at a glance
- ✅ Easy to find related issues
- ✅ Clear parent-child relationships
- ✅ Scalable numbering

### Creating Issues with Custom IDs

```bash
# Epic with custom ID
bd create --title="Authentication & Authorization System" \
          --type=epic \
          --id=tsklets-e001 \
          --priority=0

# Feature under epic with hierarchical ID
bd create --title="User Signup & Signin with JWT" \
          --type=feature \
          --id=tsklets-e001-f001 \
          --priority=0
bd dep add tsklets-e001-f001 tsklets-e001

# Use case under feature
bd create --title="UC01: Valid User Signup" \
          --type=task \
          --id=tsklets-e001-f001-uc001 \
          --parent=tsklets-e001-f001 \
          --labels=use-case \
          --priority=0

# Task under use case
bd create --title="Create User model in Drizzle schema" \
          --type=task \
          --id=tsklets-e001-f001-uc001-t001 \
          --parent=tsklets-e001-f001-uc001 \
          --priority=0
```

### ID Numbering Best Practices

1. **Zero-pad numbers**: Use `e001` not `e1` for better sorting
2. **Reserve ranges**:
   - `e001-e099`: MVP epics
   - `e100-e199`: Phase 2 epics
   - `e200-e299`: Phase 3 epics
3. **Group by epic**: All features for epic e001 start with `e001-f001`
4. **Sequential within type**: Don't skip numbers unnecessarily
5. **Document schema**: Keep ID conventions in this file

### When to Use Auto-Generated vs Custom IDs

| Scenario | Recommendation |
|----------|----------------|
| Quick task/bug during dev | Auto-generated (faster) |
| Strategic epic/feature | Custom ID (better tracking) |
| Use cases for a feature | Custom hierarchical ID |
| Experimental/throwaway work | Auto-generated |
| Production planning | Custom ID |

## Built-In Fields Reference

Beads doesn't support arbitrary custom fields, but provides specialized built-in fields for common needs.

### Available Fields

| Field | Flag | Type | Purpose | Example |
|-------|------|------|---------|---------|
| **Title** | `--title` | String | Issue name (required) | `"User Signup Feature"` |
| **Description** | `--description` or `-d` | String | Detailed explanation | `"Implement JWT-based signup"` |
| **Type** | `--type` or `-t` | Enum | Issue category | `epic`, `feature`, `task`, `bug` |
| **Priority** | `--priority` or `-p` | 0-4 or P0-P4 | Urgency level | `0` (critical) to `4` (backlog) |
| **Status** | `--status` | Enum | Current state | `open`, `in_progress`, `done` |
| **Assignee** | `--assignee` or `-a` | String | Person responsible | `john`, `sarah` |
| **Labels** | `--labels` or `-l` | String[] | Tags/categories | `use-case,frontend,p0` |
| **Estimate** | `--estimate` or `-e` | Integer | Time in minutes | `120` (2 hours) |
| **Acceptance** | `--acceptance` | String | Acceptance criteria | `"Returns 201 + JWT token"` |
| **Design** | `--design` | String | Design notes/specs | `"Use bcrypt with 10 rounds"` |
| **External Ref** | `--external-ref` | String | Link to external system | `gh-123`, `jira-ABC-456` |
| **Parent** | `--parent` | String | Parent issue ID | `tsklets-e001-f001` |
| **Dependencies** | `--deps` | String[] | Blocking issues | `blocks:bd-15,discovered-from:bd-20` |

### Field Usage Examples

#### 1. **Labels** - Most Flexible for Custom Metadata

Use labels to add custom categorization:

```bash
# Use case with multiple labels
bd create --title="UC01: Valid Signup" \
          --type=task \
          --labels=use-case,frontend,api,p0,sprint-1,team-auth

# Query by label
bd list --labels=use-case
bd list --labels=frontend,p0
```

**Recommended Label Categories:**

| Category | Examples | Purpose |
|----------|----------|---------|
| **Type Markers** | `use-case`, `spike`, `tech-debt` | Supplement issue type |
| **Component** | `frontend`, `backend`, `api`, `database` | Code area |
| **Team** | `team-auth`, `team-tickets`, `team-infra` | Ownership |
| **Sprint** | `sprint-1`, `sprint-2`, `q1-2025` | Time-boxing |
| **Status Markers** | `blocked`, `ready`, `reviewed`, `deployed` | Workflow states |
| **Severity** | `critical`, `security`, `performance` | Impact level |
| **Platform** | `ios`, `android`, `web`, `mobile` | Target platform |

#### 2. **Acceptance Criteria** - Define "Done"

```bash
bd create --title="UC01: Valid User Signup" \
          --type=task \
          --acceptance="
          - User receives 201 status code
          - JWT token returned in response
          - User record created in database
          - Password is bcrypt hashed
          - Email uniqueness enforced
          "
```

#### 3. **Design Notes** - Technical Specifications

```bash
bd create --title="Password Security & Hashing" \
          --type=feature \
          --design="
          Library: bcrypt
          Salt rounds: 10 (configurable via env)
          Password min length: 8 chars
          Complexity: 1 uppercase, 1 lowercase, 1 number
          Storage: Never store plaintext, hash only
          Comparison: Use bcrypt.compare() for constant-time
          "
```

#### 4. **Time Estimates** - Planning & Tracking

```bash
# Spike with 2-hour timebox
bd create --title="Research OAuth vs JWT trade-offs" \
          --type=task \
          --labels=spike \
          --estimate=120

# Feature with estimated effort
bd create --title="User Signup & Signin" \
          --type=feature \
          --estimate=2400  # 40 hours = 1 week
```

#### 5. **External References** - Link to GitHub, Jira, etc.

```bash
# Link to GitHub issue
bd create --title="Fix signup validation bug" \
          --type=bug \
          --external-ref=gh-456

# Link to Jira ticket
bd create --title="Implement SSO" \
          --type=feature \
          --external-ref=jira-AUTH-123

# Multiple references
bd create --title="Security audit fixes" \
          --type=epic \
          --external-ref=gh-789,jira-SEC-45,doc-https://example.com/audit
```

### Using Fields Together - Complete Example

```bash
bd create \
  --id=tsklets-e001-f001-uc001 \
  --title="UC01: Valid User Signup with Email & Password" \
  --type=task \
  --parent=tsklets-e001-f001 \
  --priority=0 \
  --assignee=john \
  --labels=use-case,api,frontend,sprint-1,p0 \
  --estimate=480 \
  --description="User scenario: New user signs up with valid email and password, receives JWT token and can immediately use the system." \
  --acceptance="
  Given: User provides valid email and password
  When: User submits signup form
  Then:
    - Returns 201 Created status
    - Response contains valid JWT token
    - User record exists in database
    - Password is bcrypt hashed (not plaintext)
    - Email is unique (no duplicates)
    - JWT contains tenant_id and is_owner claims
  " \
  --design="
  Endpoint: POST /api/auth/signup
  Request Body: { email: string, password: string, tenantId?: string }
  Response: { token: string, user: { id, email, tenantId, role } }
  Validation: Zod schema for email format and password strength
  Hash: bcrypt with 10 rounds
  JWT: Sign with secret from env, 24h expiration
  " \
  --external-ref=gh-123
```

### Querying with Fields

```bash
# Find all use cases
bd list --labels=use-case

# Find P0 tasks assigned to john
bd list --type=task --priority=0 --assignee=john

# Find all frontend bugs
bd list --type=bug --labels=frontend

# Show issue with all field details
bd show tsklets-e001-f001-uc001

# JSON output for scripting
bd show tsklets-e001-f001-uc001 --json
```

## Commands Reference

### Basic Commands

```bash
# Create epic with custom ID
bd create --title="Authentication & Authorization System" \
          --type=epic \
          --id=tsklets-e001 \
          --priority=0 \
          --description="Complete auth system with JWT and RBAC"

# Create feature under epic with custom hierarchical ID
bd create --title="User Signup & Signin with JWT" \
          --type=feature \
          --id=tsklets-e001-f001 \
          --priority=0 \
          --assignee=john \
          --estimate=2400 \
          --labels=api,frontend,mvp
bd dep add tsklets-e001-f001 tsklets-e001

# Create use case under feature
bd create --title="UC01: Valid User Signup" \
          --type=task \
          --id=tsklets-e001-f001-uc001 \
          --parent=tsklets-e001-f001 \
          --labels=use-case,happy-path \
          --priority=0 \
          --acceptance="User receives 201 + JWT token"

# Create task under use case
bd create --title="Implement POST /api/auth/signup endpoint" \
          --type=task \
          --id=tsklets-e001-f001-uc001-t001 \
          --parent=tsklets-e001-f001-uc001 \
          --assignee=john \
          --estimate=240 \
          --labels=api,backend

# Create subtask under task
bd create --title="Add Zod validation schema for signup" \
          --type=task \
          --parent=tsklets-e001-f001-uc001-t001 \
          --estimate=60

# Create bug with context
bd create --title="Signup fails for emails with + character" \
          --type=bug \
          --id=tsklets-b001 \
          --priority=0 \
          --labels=production,security,regression \
          --description="Plus sign in email causes validation failure" \
          --external-ref=gh-456

# Create spike with timebox
bd create --title="Research OAuth vs JWT for authentication" \
          --type=task \
          --id=tsklets-s001 \
          --labels=spike,research \
          --estimate=120 \
          --assignee=sarah \
          --description="Evaluate trade-offs between OAuth 2.0 and JWT"

# Create chore
bd create --title="Refactor auth middleware for better testability" \
          --type=chore \
          --id=tsklets-c001 \
          --priority=3 \
          --labels=tech-debt,backend

# Add dependencies
bd dep add tsklets-e001-f001 tsklets-e001  # feature depends on epic
bd dep add <child-id> <parent-id>          # child depends on parent

# Check what's ready to work on
bd ready

# View hierarchy
bd show tsklets-e001
bd show tsklets-e001-f001-uc001

# List issues with filters
bd list --type=epic
bd list --labels=use-case
bd list --assignee=john
bd list --status=in_progress
bd list --priority=0

# Update issue
bd update tsklets-e001-f001-uc001-t001 --status=in_progress
bd update tsklets-e001-f001-uc001-t001 --assignee=sarah
bd update tsklets-e001-f001-uc001-t001 --priority=1

# Close issues
bd close tsklets-e001-f001-uc001-t001
bd close tsklets-b001 --reason="Fixed in v1.2.3"

# Sync with git
bd sync
bd sync --status
```

### Advanced Commands

```bash
# Create issue from file
bd create --file=issues.md

# Create with all fields
bd create \
  --id=tsklets-e001-f001-uc001 \
  --title="UC01: Valid User Signup" \
  --type=task \
  --parent=tsklets-e001-f001 \
  --priority=0 \
  --assignee=john \
  --labels=use-case,api,frontend,sprint-1 \
  --estimate=480 \
  --description="Complete user signup scenario" \
  --acceptance="Returns 201 + JWT" \
  --design="Use bcrypt with 10 rounds" \
  --external-ref=gh-123

# Bulk operations
bd close tsklets-t001 tsklets-t002 tsklets-t003

# Find blocked issues
bd blocked

# Project statistics
bd stats

# Diagnose issues
bd doctor

# JSON output for scripting
bd show tsklets-e001 --json
bd list --type=epic --json
```

## Summary

The Tsklets project uses beads to organize work from strategic (epics) to tactical (tasks). This hierarchy ensures:
- **Clear ownership**: Each level has appropriate scope
- **Manageable chunks**: Work is broken down appropriately
- **Dependency tracking**: Blockers are visible
- **Progress visibility**: Status rolls up from tasks → features → epics
- **Strategic alignment**: All work ties to business goals

Use `bd ready` to find work with no blockers, and `bd show <id>` to understand dependencies at any level.

---

## Quick Reference

### Issue Type Hierarchy

```
1. Product       → tsklets-*
2. Epic          → tsklets-e001         (3-6 months)
3. Feature       → tsklets-e001-f001    (2-4 weeks)
4. Use Case      → tsklets-e001-f001-uc001 (2-5 days, label: use-case)
5. Task          → tsklets-e001-f001-uc001-t001 (1-5 days)
6. Subtask       → tsklets-e001-f001-uc001-t001.1 (hours-1 day)
```

### Custom ID Prefixes

| Type | Prefix | Example |
|------|--------|---------|
| Epic | `e###` | `tsklets-e001` |
| Feature | `f###` | `tsklets-f001` or `tsklets-e001-f001` |
| Use Case | `uc###` | `tsklets-uc001` or `tsklets-e001-f001-uc001` |
| Task | `t###` | `tsklets-t001` or `tsklets-e001-f001-uc001-t001` |
| Bug | `b###` | `tsklets-b001` |
| Spike | `s###` | `tsklets-s001` |
| Chore | `c###` | `tsklets-c001` |

### Essential Fields

| Field | Flag | Example |
|-------|------|---------|
| ID | `--id` | `tsklets-e001-f001-uc001` |
| Type | `--type` | `epic`, `feature`, `task`, `bug` |
| Priority | `--priority` | `0` (critical) to `4` (backlog) |
| Labels | `--labels` | `use-case,api,frontend,sprint-1` |
| Assignee | `--assignee` | `john`, `sarah` |
| Estimate | `--estimate` | `120` (minutes) |
| Acceptance | `--acceptance` | `"Returns 201 + JWT"` |
| Design | `--design` | `"Use bcrypt with 10 rounds"` |
| Parent | `--parent` | `tsklets-e001-f001` |

### Most Common Commands

```bash
# Create with custom ID
bd create --title="..." --type=epic --id=tsklets-e001

# Create with parent
bd create --title="..." --type=task --parent=tsklets-e001-f001

# Add dependency
bd dep add <child> <parent>

# Update status
bd update <id> --status=in_progress

# View details
bd show <id>

# List filtered
bd list --type=epic --labels=use-case --assignee=john

# Find ready work
bd ready

# Find blocked
bd blocked

# Close
bd close <id>

# Sync to git
bd sync
```

### Recommended Label Categories

```
Type:      use-case, spike, tech-debt
Component: frontend, backend, api, database
Team:      team-auth, team-tickets, team-infra
Sprint:    sprint-1, sprint-2, q1-2025
Status:    blocked, ready, reviewed, deployed
Severity:  critical, security, performance
Platform:  ios, android, web, mobile
```

### Example Workflow

```bash
# 1. Create epic
bd create --title="Auth System" --type=epic --id=tsklets-e001 --priority=0

# 2. Create feature
bd create --title="User Signup" --type=feature --id=tsklets-e001-f001 --priority=0
bd dep add tsklets-e001-f001 tsklets-e001

# 3. Create use case
bd create --title="UC01: Valid Signup" --type=task --id=tsklets-e001-f001-uc001 \
  --parent=tsklets-e001-f001 --labels=use-case --acceptance="Returns 201 + JWT"

# 4. Create tasks
bd create --title="Create signup endpoint" --type=task \
  --id=tsklets-e001-f001-uc001-t001 --parent=tsklets-e001-f001-uc001 \
  --assignee=john --estimate=240

# 5. Start work
bd update tsklets-e001-f001-uc001-t001 --status=in_progress

# 6. Complete
bd close tsklets-e001-f001-uc001-t001

# 7. Sync
bd sync
```
