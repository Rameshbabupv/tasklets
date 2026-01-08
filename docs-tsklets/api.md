# API Reference

Base: `/api/v1`

## Auth
| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/auth/signup` | `{email, password, name}` | `{user, token}` |
| POST | `/auth/signin` | `{email, password}` | `{user, token}` |
| POST | `/auth/logout` | - | `{success}` |

## Tickets (User)
| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/tickets` | `{title, description, priority, files[]}` | `{ticket}` |
| GET | `/tickets` | - | `{tickets[]}` (own only) |
| GET | `/tickets/:id` | - | `{ticket, attachments[]}` |

## Admin
| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| GET | `/admin/tickets` | `?status=&priority=` | `{tickets[]}` (all tenant) |
| PATCH | `/admin/tickets/:id/status` | `{status}` | `{ticket}` |

## Headers
- `Authorization: Bearer <jwt>`
- `X-Tenant-ID: <tenant_id>` (or via subdomain)
