# Customer Support App - Design Prompt

## App Overview
Multi-tenant B2B customer support ticketing system. Clean, minimal UI - anti-Jira/Zendesk complexity. Users submit tickets with screenshots, track status. Admins manage and resolve.

## Tech Stack
React + Tailwind CSS. Modern, responsive, dark/light mode.

## Design Style
- Clean, minimal, whitespace-heavy
- Card-based layouts
- Subtle shadows, rounded corners (8px)
- Primary: Blue (#3B82F6), Success: Green, Warning: Amber, Error: Red
- Font: Inter or system-ui
- Icons: Lucide or Heroicons

## User Roles & Pages

### 1. AUTH
| Page | Description |
|------|-------------|
| /login | Email + password, "Forgot password" link, company logo |
| /signup | Name, email, password, company code to join tenant |

### 2. USER (Client)
| Page | Description |
|------|-------------|
| /dashboard | Stats cards (open/resolved), recent tickets list, "New Ticket" CTA |
| /tickets/new | Form: title, description (rich text), product dropdown, priority (1-4), severity (1-4), drag-drop screenshot upload (max 5) |
| /tickets/:id | Ticket detail card, status badge, timeline of updates, attachments gallery |

### 3. COMPANY ADMIN (Client)
| Page | Description |
|------|-------------|
| /admin/users | User table with role badges, invite button, remove action |
| /admin/tickets | Filterable table: all company tickets, status/priority filters, search |

### 4. SUPPORT (Our Side)
| Page | Description |
|------|-------------|
| /support/queue | Kanban or table view, columns: Open → In Progress → Resolved, ticket cards with priority indicator |
| /support/ticket/:id | Full ticket view, customer info sidebar, status dropdown, comment thread, resolution notes |

### 5. ADMIN (Our Side)
| Page | Description |
|------|-------------|
| /manage/tenants | Tenant cards: name, tier badge (Enterprise/Business/Starter), user count, config button |
| /manage/users | Internal user table, role assignment dropdown |

## Key Components
- Navbar: Logo, navigation, user avatar dropdown
- Sidebar: Role-based menu items
- Ticket Card: Title, status badge, priority pill, created date, assignee avatar
- Status Badge: Open (blue), In Progress (amber), Resolved (green), Closed (gray)
- Priority Pill: P1 (red), P2 (orange), P3 (yellow), P4 (gray)
- File Upload: Drag-drop zone, thumbnail preview, remove button
- Empty State: Illustration + "No tickets yet" message + CTA

## Responsive
- Desktop: Sidebar + main content
- Tablet: Collapsible sidebar
- Mobile: Bottom nav, stacked cards

## Generate
1. Login page
2. User dashboard
3. New ticket form
4. Ticket detail view
5. Support queue (kanban)
6. Admin tenant management
