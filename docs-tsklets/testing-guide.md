# Testing Guide

**Password for all users:** `systech@123`

## Test Users

| Portal   | Email              | Role          | Tenant    |
| -------- | ------------------ | ------------- | --------- |
| Internal | ramesh@systech.com | admin         | SysTech   |
|          | mohan@systech.com  | support       | SysTech   |
|          | sakthi@systech.com | integrator    | SysTech   |
|          | jai@systech.com    | support       | SysTech   |
|          | priya@systech.com  | support       | SysTech   |
| Client   | john@acme.com      | user          | Acme Corp |
|          | jane@acme.com      | user          | Acme Corp |
|          | kumar@acme.com     | user          | Acme Corp |
|          | latha@acme.com     | company_admin | Acme Corp |
|          | deepa@acme.com     | company_admin | Acme Corp |
| Client   | alex@techcorp.com  | user          | TechCorp  |
|          | sara@techcorp.com  | user          | TechCorp  |
|          | mike@techcorp.com  | company_admin | TechCorp  |

---

## Role Definitions

### Internal Portal Roles (SysTech - Owner)

#### admin
Full system access. Can manage tenants, users, and all tickets across tenants.

**Test scenarios:**
- [ ] Login to internal portal (http://localhost:3001)
- [ ] View all tickets from all tenants in Kanban board
- [ ] Change ticket status (open → in_progress → resolved → closed)
- [ ] Set internal priority/severity on any ticket
- [ ] View tenant management page
- [ ] See tickets from both Acme Corp and TechCorp

#### support
Handles ticket triage and resolution. Can view all tickets, set internal priority/severity.

**Test scenarios:**
- [ ] Login to internal portal
- [ ] View Kanban board with all tickets
- [ ] Update ticket status
- [ ] Set internal priority (P1-P5) different from client priority
- [ ] Set internal severity different from client severity
- [ ] Cannot access tenant management (future restriction)

#### integrator
Cross-tenant visibility for client communication. Bridges client and internal teams.

**Test scenarios:**
- [ ] Login to internal portal
- [ ] View tickets across all tenants
- [ ] Update ticket status
- [ ] Add internal notes (future feature)

---

### Client Portal Roles

#### user
Regular client user. Can create tickets and view only their own tickets.

**Test scenarios:**
- [ ] Login to client portal (http://localhost:3000)
- [ ] View dashboard with only MY tickets (not other users in same company)
- [ ] Create new ticket with title, description, priority, severity
- [ ] View ticket detail
- [ ] Cannot see tickets created by other users (e.g., john cannot see jane's tickets)

#### company_admin
Client-side admin. Can view all tickets within their tenant/company.

**Test scenarios:**
- [ ] Login to client portal
- [ ] View dashboard with ALL tickets from their company
- [ ] latha@acme.com should see tickets from john, jane, kumar, deepa
- [ ] mike@techcorp.com should see tickets from alex, sara
- [ ] Cannot see tickets from other tenants (Acme admin cannot see TechCorp tickets)

---

## Multi-Tenant Isolation Tests

### Test 1: Tenant Separation
1. Login as `john@acme.com`, create ticket "Acme Issue"
2. Login as `alex@techcorp.com`, create ticket "TechCorp Issue"
3. Login as `ramesh@systech.com` (internal) → should see BOTH tickets
4. Login as `latha@acme.com` (Acme admin) → should see ONLY "Acme Issue"
5. Login as `mike@techcorp.com` (TechCorp admin) → should see ONLY "TechCorp Issue"

### Test 2: User Isolation within Tenant
1. Login as `john@acme.com`, create ticket "John's Bug"
2. Login as `jane@acme.com` → should NOT see "John's Bug"
3. Login as `latha@acme.com` (company_admin) → should see "John's Bug"

### Test 3: Internal Triage
1. Login as `john@acme.com`, create ticket with Priority P4, Severity S4
2. Login as `mohan@systech.com` (support)
3. Set internal priority to P1 (critical internally, low for client)
4. Verify Kanban shows ticket with P1 priority stripe

---

## URLs

| App | Local | Network |
|-----|-------|---------|
| Client Portal | http://localhost:3000 | http://10.0.0.9:3000 |
| Internal Portal | http://localhost:3001 | http://10.0.0.9:3001 |
| API | http://localhost:4000 | (proxied via portals) |

**To start in network mode:**
```bash
# Kill existing
lsof -ti:4000,3000,3001 | xargs kill -9

# Start all apps
npm run dev:api &
cd apps/client-portal && npx vite --host --port 3000 &
cd apps/internal-portal && npx vite --host --port 3001 &
```
