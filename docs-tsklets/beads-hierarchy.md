# Beads Issue Hierarchy - Tsklets Project

## Overview
This document defines the hierarchical structure for organizing work in the Tsklets project using beads.

## Hierarchy Levels

```
Product: Tsklets (tsklets-*)
    │
    ├─── Epic (Strategic initiatives, 3-6 months)
    │      │
    │      ├─── Feature (User-facing functionality, 2-4 weeks)
    │      │      │
    │      │      ├─── Task (Implementation work, 1-5 days)
    │      │      │      │
    │      │      │      └─── Subtask (Granular work, hours to 1 day)
    │      │      │
    │      │      ├─── Bug (Defects to fix)
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
- **Contains**: Tasks, bugs, chores, spikes
- **When to use**:
  - Adds new capability users/developers interact with
  - Implements a complete user story
  - Delivers standalone value

### 4. **Task**
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

### 5. **Subtask**
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

### 6. **Bug**
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

### 7. **Spike**
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

### 8. **Chore**
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

### 9. **Merge Request**
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

### 10. **Molecule**
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
│  │  ├─ Task: Create User model in Drizzle schema
│  │  ├─ Task: Implement POST /api/auth/signup
│  │  ├─ Task: Implement POST /api/auth/signin
│  │  ├─ Task: Create JWT generation utility
│  │  ├─ Task: Write integration tests
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
- **Task**: Can one dev finish this in < 1 week? → Task
- **Subtask**: Is this a few hours of work? → Subtask

### 2. **When to Create What**

| Scenario | Type | Example |
|----------|------|---------|
| Major roadmap item | Epic | "Authentication System" |
| New user capability | Feature | "User Signup" |
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

## Commands Reference

```bash
# Create epic
bd create --title="Epic Name" --type=epic --priority=0

# Create feature under epic
bd create --title="Feature Name" --type=feature --priority=0
bd dep add <feature-id> <epic-id>

# Create task under feature
bd create --title="Task Name" --type=task --parent=<feature-id>

# Create subtask under task
bd create --title="Subtask Name" --type=task --parent=<task-id>

# Create bug
bd create --title="Bug Description" --type=bug --priority=0

# Create spike
bd create --title="Research Question" --type=task --labels=spike --estimate=120

# Create chore
bd create --title="Maintenance Work" --type=chore --priority=3

# Add dependencies
bd dep add <child-id> <parent-id>  # child depends on parent

# Check what's ready to work on
bd ready

# View hierarchy
bd show <epic-id>
```

## Summary

The Tsklets project uses beads to organize work from strategic (epics) to tactical (tasks). This hierarchy ensures:
- **Clear ownership**: Each level has appropriate scope
- **Manageable chunks**: Work is broken down appropriately
- **Dependency tracking**: Blockers are visible
- **Progress visibility**: Status rolls up from tasks → features → epics
- **Strategic alignment**: All work ties to business goals

Use `bd ready` to find work with no blockers, and `bd show <id>` to understand dependencies at any level.
