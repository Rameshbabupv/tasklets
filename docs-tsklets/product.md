# Product Overview

## Vision
Simple, multi-tenant customer support ticketing — anti-Jira/Zendesk complexity.

## User Personas

| Persona | Side | Goal |
|---------|------|------|
| End User | Client | Report issues, track status, request features |
| Gatekeeper | Client | Vet tickets before submission (large orgs) |
| Approver | Client | Approve/reject quotes for feature requests |
| Company Admin | Client | Manage team, view company tickets |
| Integrator | Our side | Triage, prioritize based on customer relationship |
| Support | Our side | Resolve tickets |
| CEO | Our side | Review feature requests, create/revise quotes |
| Admin | Our side | System config, reporting |

## User Stories

### End User
- As a user, I can sign up and join my company
- As a user, I can create a ticket with title, description, priority, severity, screenshots
- As a user, I can select which product the issue relates to
- As a user, I can view my tickets and their status
- As a user, I can submit a feature request

### Gatekeeper (Client)
- As a gatekeeper, I can see pending tickets from my company
- As a gatekeeper, I can approve or reject tickets before they reach support
- As a gatekeeper, I can add notes when rejecting

### Company Admin (Client)
- As a company admin, I can invite/remove users
- As a company admin, I can assign gatekeeper role
- As a company admin, I can view all company tickets

### Integrator (Our Side)
- As an integrator, I can see incoming tickets for my assigned companies
- As an integrator, I can set internal priority/severity
- As an integrator, I can assign to support team
- As an integrator, I can view company contact/sales info

### Support (Our Side)
- As support, I can see tickets assigned to me
- As support, I can update ticket status
- As support, I can add comments/resolution notes
- As support, I can escalate to integrator

### Approver (Client)
- As an approver, I can see quotes for my company's feature requests
- As an approver, I can approve or reject quotes
- As an approver, I can request revisions with comments
- As an approver, I can view negotiation history

### CEO (Our Side)
- As CEO, I can see all incoming feature requests
- As CEO, I can create quotes with scope, price, timeline
- As CEO, I can revise quotes based on feedback
- As CEO, I can grant access to specific users for a feature request
- As CEO, I can view approved features and their delivery status

### Admin (Our Side)
- As admin, I can manage tenants (tier, gatekeeper config)
- As admin, I can manage our-side users
- As admin, I can view SLA compliance reports

## MVP Scope

**Phase 1 (MVP):**
- Auth (signup, signin)
- Ticket CRUD with screenshots
- Dual priority/severity
- Basic roles (user, company_admin, support, admin)
- Multi-tenant isolation

**Phase 2:**
- Gatekeeper workflow
- Integrator triage
- SLA tracking/alerts
- Email notifications

**Phase 3:**
- Feature request submission
- Quote creation (CEO)
- Approval workflow with revisions
- Auto-create beads epic on approval
- Reporting dashboard

## Acceptance Criteria
Detailed AC maintained in beads per task. Run `bd show <task-id>` for specifics.
