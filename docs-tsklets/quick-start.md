# Quick Start Guide

## Prerequisites
- Node.js v18+
- npm

## Port Configuration

| App | Port | Config File |
|-----|------|-------------|
| API | 4000 | `apps/api/src/index.ts` |
| Client Portal | 3000 | `apps/client-portal/vite.config.ts` |
| Internal Portal | 3003 | `apps/internal-portal/vite.config.ts` |

**Proxy Configuration:**
- Client Portal (3000) → proxies `/api` to API (4000)
- Internal Portal (3003) → proxies `/api` to API (4000)

## Setup

```bash
# Install dependencies (from root)
npm install

# Initialize database and seed data
cd apps/api
npm run db:push
npm run db:seed
```

## Run Applications

**Start all servers (from root):**
```bash
npm run dev
```

This starts all three servers in one terminal with color-coded output:
- 🔵 **API** (blue) → http://localhost:4000
- 🟢 **CLIENT** (green) → http://localhost:3000
- 🟣 **INTERNAL** (magenta) → http://localhost:3003

**Or run individually:**
```bash
npm run dev:api       # API only (port 4000)
npm run dev:client    # Client Portal only (port 3000)
npm run dev:internal  # Internal Portal only (port 3003)
```

## URLs

### Local Development
| App | URL |
|-----|-----|
| API | http://localhost:4000 |
| Client Portal | http://localhost:3000 |
| Internal Portal | http://localhost:3003 |

### Network Access (replace with your IP)
| App | URL |
|-----|-----|
| API | http://10.0.0.X:4000 |
| Client Portal | http://10.0.0.X:3000 |
| Internal Portal | http://10.0.0.X:3003 |

## Test Users

**Password for all users:** `systech@123`

### Internal Portal (http://localhost:3003)

| Email | Role | Access |
|-------|------|--------|
| ramesh@systech.com | admin | Full access |
| mohan@systech.com | support | Ticket management |
| sakthi@systech.com | integrator | Integrations |
| jai@systech.com | support | Ticket management |
| priya@systech.com | support | Ticket management |

**Features:** Tickets (Kanban), Tenants (CRUD + products), Products (CRUD)

### Client Portal (http://localhost:3000)

Login requires: Email + Password + **Tenant Code**

**Acme Corp** (Tenant Code: check Internal Portal → Tenants)

| Email | Role |
|-------|------|
| john@acme.com | user |
| jane@acme.com | user |
| kumar@acme.com | user |
| latha@acme.com | company_admin |
| deepa@acme.com | company_admin |

**TechCorp** (Tenant Code: check Internal Portal → Tenants)

| Email | Role |
|-------|------|
| alex@techcorp.com | user |
| sara@techcorp.com | user |
| mike@techcorp.com | company_admin |

> **Note:** Tenant codes are auto-generated nanoid (e.g., `XK9Q2MZLP1`).
> View them in Internal Portal → Tenants page → Tenant Code column.

## Products (15 seeded)

HRM, Payroll, Attendance, Leave Management, Recruitment, Performance, Employee Self Service, Training & LMS, Asset Management, Expense Management, Project Management, Timesheet, Document Management, Onboarding, Exit Management

## Database

SQLite database at: `apps/api/src/db/data.db`

**Reset database:**
```bash
cd apps/api
rm -f src/db/data.db*
npm run db:push
npm run db:seed
```

## npm Scripts

Run from `apps/api`:

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API server on port 4000 |
| `npm run db:push` | Push schema to SQLite |
| `npm run db:seed` | Seed sample data |

## AWS Deployment (EC2)

### 1. Launch EC2 Instance
- Ubuntu 22.04 LTS
- Instance type: t2.micro (free tier) or t2.small
- Security Group: Allow inbound on ports 22, 3000, 3003, 4000

### 2. SSH into Instance
```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 3. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # Verify: v20.x
```

### 4. Clone & Setup
```bash
git clone https://github.com/Rameshbabupv/customer-support.git
cd customer-support
npm install
cd apps/api
npm run db:push
npm run db:seed
cd ../..
```

### 5. Run with Host Binding
```bash
# Option A: Run all servers (use screen/tmux to keep running)
npm run dev

# Option B: Run with --host for network access
cd apps/api && npm run dev &
cd apps/client-portal && npm run dev -- --host &
cd apps/internal-portal && npm run dev -- --host &
```

### 6. Access URLs
| App | URL |
|-----|-----|
| API | http://<EC2_PUBLIC_IP>:4000 |
| Client Portal | http://<EC2_PUBLIC_IP>:3000 |
| Internal Portal | http://<EC2_PUBLIC_IP>:3003 |

### 7. Run in Background (using PM2)
```bash
# Install PM2
sudo npm install -g pm2

# Start API
cd apps/api && pm2 start "npm run dev" --name api

# Start portals (with host binding)
cd ../client-portal && pm2 start "npm run dev -- --host" --name client
cd ../internal-portal && pm2 start "npm run dev -- --host" --name internal

# Save & auto-start on reboot
pm2 save
pm2 startup
```

### Security Group Rules (AWS Console)
| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP |
| Custom TCP | 3000 | 0.0.0.0/0 |
| Custom TCP | 3003 | 0.0.0.0/0 |
| Custom TCP | 4000 | 0.0.0.0/0 |

---

## API Endpoints (http://localhost:4000)

### Auth
- `POST /api/auth/signin` - Login
- `POST /api/auth/register` - Register (requires tenant code)

### Tenants (owner only)
- `GET /api/tenants` - List tenants
- `POST /api/tenants` - Create tenant (auto-generates nanoid code)
- `PATCH /api/tenants/:id` - Update tenant

### Products (owner only for mutations)
- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `GET /api/products/tenant/:id` - Tenant's products
- `PUT /api/products/tenant/:id` - Update tenant's products

### Users (owner only)
- `GET /api/users/tenant/:id` - List tenant users
- `POST /api/users` - Create user (default password: systech@123)

### Tickets
- `GET /api/tickets` - List tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/:id` - Get ticket
- `PATCH /api/tickets/:id` - Update ticket
