# SPARK - Idea Management Feature Specification

**Status**: Planning
**Created**: 2024-12-24
**Owner**: Product Team

---

## Executive Summary

SPARK is a signature feature that enables friction-free idea capture, collaborative vetting, and seamless conversion to actionable tickets across multiple projects. It solves the problem of losing great ideas because they don't fit neatly into existing project structures.

### Key Innovation
**Idea-First vs Project-First** - Most tools force users to pick a project before capturing an idea. SPARK reverses this: capture freely, organize later.

---

## Problem Statement

### Current Pain Points
1. **Ideas get lost** - Shared in Slack, email, meetings but never tracked
2. **Premature structuring** - Must know which project/epic before capturing
3. **Privacy concerns** - Fear of sharing half-baked ideas publicly
4. **Cross-project ideas** - One idea might affect multiple products, but tools force single-project assignment
5. **No lineage** - Once idea becomes ticket, origin is lost

### Who This Affects
- **Support Engineers** - See customer pain points, need place to capture improvement ideas
- **Developers** - Have technical ideas during coding, don't want to interrupt flow
- **Product Managers** - Need to see all ideas across teams, prioritize strategically
- **Leadership** - Want innovation visibility without stifling creativity

---

## Solution: SPARK

### The Flow
```
Capture → Refine → Vet → Convert → Ship → Measure
  |        |        |       |        |        |
Private  Team    Public  Tickets  Deploy  Analytics
```

### Core Capabilities

#### 1. Privacy-First Capture
- **Private Draft** - Keep idea to yourself while refining
- **Team Share** - Test with trusted circle
- **Public** - Share org-wide when ready
- **Admin Oversight** - Leadership sees all (even private) for strategic insight

#### 2. Collaborative Vetting
- **Comments** - Discuss, refine, build on ideas
- **Reactions** - Quick sentiment (👍 ❤️ 🔥)
- **Status Progression** - inbox → discussing → vetted → in_progress → shipped
- **Vote Counts** - Surface popular ideas

#### 3. Smart Conversion
- **Multi-Project** - One idea → tickets in multiple products
- **Lineage Tracking** - Tickets always link back to source idea
- **Template Pre-Fill** - Discussion becomes ticket acceptance criteria
- **Bulk Create** - Convert to epic/features/tasks in one action

#### 4. Discovery & Learning
- **Search All Ideas** - Not just tickets, find the thinking behind work
- **Innovation Analytics** - Which ideas became reality? What's the ROI?
- **Contribution Tracking** - Recognize idea champions
- **Pattern Recognition** - See themes across teams

---

## User Personas & Use Cases

### Sarah - Support Engineer
**Goal**: Capture customer pain points without disrupting workflow

**Journey**:
1. During call, customer mentions confusing billing page
2. Sarah quickly creates private idea: "Simplify billing layout"
3. After call, adds details from discussion
4. Shares with Support Team for feedback
5. Team upvotes, PM sees it, converts to Product Dashboard ticket
6. 2 weeks later, shipped - Sarah gets credit notification

### Dev - Backend Developer
**Goal**: Share technical debt ideas without appearing negative

**Journey**:
1. Notices slow database query pattern
2. Creates private idea: "Add Redis caching layer"
3. Refines with benchmark data
4. Shares with Dev Team, gets feedback
5. Team Lead sees it, makes public, gets exec buy-in
6. Converts to tickets in multiple products (API, Dashboard, Mobile)

### Ramesh - Admin/CTO
**Goal**: See innovation across org, spot strategic opportunities

**Journey**:
1. Checks "All Sparks" dashboard weekly
2. Sees 3 private ideas from different teams about "mobile offline mode"
3. Reaches out to idea creators, suggests collaboration
4. Facilitates cross-team discussion
5. Idea goes public, becomes company initiative
6. Tracks from inception to shipped feature

---

## Technical Architecture

### Data Model

```typescript
// Core entity
ideas {
  id: string
  tenant_id: string
  title: string
  description: string
  status: 'inbox' | 'discussing' | 'vetted' | 'in_progress' | 'shipped' | 'archived'
  visibility: 'private' | 'team' | 'public'
  team_id?: string
  created_by: string (user_id)
  created_at: timestamp
  updated_at: timestamp
  published_at?: timestamp  // When first shared
  vote_count: number
  comment_count: number
}

// Supporting tables
teams { id, tenant_id, name, product_id? }
team_members { team_id, user_id, role }
idea_comments { id, idea_id, user_id, comment, created_at }
idea_reactions { id, idea_id, user_id, reaction }
idea_products { idea_id, product_id }  // Which products affected
idea_tickets { idea_id, ticket_id }    // Lineage tracking

// Enhanced existing
tickets {
  ...,
  source_idea_id?: string  // Origin tracking
}
```

### Permission Model

| Role | Private (Own) | Private (Others) | Team Ideas | Public Ideas | Admin View All |
|------|--------------|------------------|------------|--------------|----------------|
| User | ✓ | ✗ | ✓ (if member) | ✓ | ✗ |
| Team Lead | ✓ | ✗ | ✓ (team) | ✓ | ✗ |
| Admin | ✓ | **✓** | ✓ | ✓ | **✓** |
| Systech | ✓ | **✓** | ✓ | ✓ | **✓** |

### API Endpoints

**Ideas**
- `POST /api/ideas` - Create
- `GET /api/ideas` - List (with visibility filter)
- `GET /api/ideas/:id` - Detail
- `PATCH /api/ideas/:id` - Update
- `DELETE /api/ideas/:id` - Soft delete

**Collaboration**
- `POST /api/ideas/:id/comments` - Add comment
- `GET /api/ideas/:id/comments` - List
- `POST /api/ideas/:id/reactions` - Toggle reaction
- `GET /api/ideas/:id/activity` - Activity feed

**Conversion**
- `POST /api/ideas/:id/convert` - Create tickets
- `GET /api/ideas/:id/tickets` - Show lineage

**Teams**
- `GET /api/teams` - User's teams
- `POST /api/teams` - Create (admin)
- `POST /api/teams/:id/members` - Add member

---

## UI/UX Design

### Ideas List Page
```
┌─────────────────────────────────────────────┐
│  💡 SPARK Ideas                             │
│  ┌──────────────────────────────────────┐  │
│  │ All │ My Ideas │ Team │ Private     │  │
│  └──────────────────────────────────────┘  │
│  Filter: [Inbox ▼] [Team ▼]                │
│  [+ New Idea]                               │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ 🔒 Dark Mode Support               │    │
│  │ Inbox • 12 👍 • 5 💬               │    │
│  │ Created 2 days ago by Sarah        │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ 👥 Engineering • Mobile Offline    │    │
│  │ Discussing • 45 👍 • 23 💬         │    │
│  │ Created 1 week ago by Dev          │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### Idea Detail Page
```
┌─────────────────────────────────────────────┐
│  ← Back to Ideas                            │
│                                             │
│  Dark Mode Support                   [Edit] │
│  🔒 Private • Inbox                  [🗑️]   │
│  Created by You • 2 days ago                │
│                                             │
│  Description:                               │
│  Add dark mode to reduce eye strain...     │
│                                             │
│  Visibility: 🔒 Private ▼                   │
│  Status: Inbox → Discussing → Vetted        │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 👍 12  ❤️ 5  🔥 3                   │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  💬 Comments (5)                            │
│  ┌─────────────────────────────────────┐   │
│  │ Sarah • 1 day ago                   │   │
│  │ Great idea! Should include toggle   │   │
│  │ in settings.                        │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Add Comment...]                           │
│                                             │
│  [Convert to Ticket] (when status=vetted)   │
└─────────────────────────────────────────────┘
```

### Create Idea Modal
```
┌─────────────────────────────────────────────┐
│  💡 New Idea                         [✕]    │
│                                             │
│  Title*                                     │
│  [________________________________]         │
│                                             │
│  Description*                               │
│  [                                ]         │
│  [                                ]         │
│  [________________________________]         │
│                                             │
│  Who can see this?                          │
│  ○ Private (just me)                        │
│  ○ Team  [Engineering Team      ▼]         │
│  ○ Public (everyone in org)                 │
│                                             │
│  [Save as Draft]  [Publish Idea]            │
└─────────────────────────────────────────────┘
```

---

## Success Metrics

### Engagement Metrics
- **Ideas captured per week** (target: 10+ per 100 users)
- **Conversion rate**: ideas → tickets (target: 30%)
- **Time to vet**: inbox → vetted (target: < 3 days)
- **Cross-project ideas**: % affecting multiple products (target: 20%)

### Collaboration Metrics
- **Comments per idea** (target: 3+)
- **Reaction engagement** (target: 50% of viewers react)
- **Team discussions**: % of ideas that go team → public (target: 40%)

### Business Impact
- **Time to ship**: idea created → feature shipped (track)
- **ROI tracking**: value of shipped ideas vs development cost
- **Innovation leaderboard**: top contributors recognized

### Admin Insights
- **Private idea visibility**: how many ideas admins discover early
- **Cross-team collaboration**: ideas from one team adopted by others
- **Idea themes**: what topics are trending

---

## Competitive Analysis

| Feature | SPARK | Jira | Linear | Monday.com |
|---------|-------|------|--------|------------|
| Privacy levels | ✓ | ✗ | ✗ | ✗ |
| Idea-first capture | ✓ | ✗ | ✗ | ✗ |
| Cross-project promotion | ✓ | Limited | ✗ | ✗ |
| Lineage tracking | ✓ | ✗ | ✗ | ✗ |
| Admin full visibility | ✓ | ✗ | ✗ | ✗ |
| Reactions/voting | ✓ | ✗ | ✓ | ✓ |

**Key Differentiator**: No other tool combines privacy-first capture with cross-project conversion and full admin oversight.

---

## Risks & Mitigations

### Risk 1: Low Adoption
**Mitigation**:
- Make creation ultra-simple (3 clicks)
- Integrate into existing workflows (mobile, email, Slack)
- Gamification: recognize top contributors

### Risk 2: Admin Visibility Backlash
**Mitigation**:
- Clearly communicate purpose (strategic insight, not surveillance)
- Admins cannot edit/delete private ideas
- Show value: "Your private idea influenced company strategy"

### Risk 3: Idea Graveyard
**Mitigation**:
- Auto-archive after 90 days inactive
- Gentle nudges: "Your idea got 10 upvotes, ready to share?"
- Regular review cadence for high-voted ideas

### Risk 4: Duplicate Ideas
**Mitigation**:
- AI duplicate detection on create
- Suggest merging similar ideas
- Link related ideas

---

## Phased Rollout

### Phase 1: Internal Beta (Week 1-2)
- Core team only (5-10 users)
- Test basic create/list/comment flow
- Gather feedback on privacy UX

### Phase 2: Pilot Team (Week 3-4)
- Engineering + Support teams (~30 users)
- Add reactions, visibility changes
- Test team collaboration features

### Phase 3: Full Launch (Week 5)
- All users
- Add AI features, analytics
- Marketing push

### Phase 4: Advanced Features (Week 6+)
- Email/Slack integration
- Mobile voice capture
- Public idea submission (external)

---

## Open Questions

1. **Team Structure**: Use existing product assignments or create separate team entity?
2. **Notifications**: How aggressive? Push, email, or in-app only?
3. **Archival Policy**: Auto-archive shipped ideas after X days?
4. **AI Integration**: Which AI features in MVP vs later?
5. **External Ideas**: Allow customers to submit ideas? Separate visibility level?

---

## Next Steps

1. ✓ Review this spec with stakeholders
2. Finalize data model decisions
3. Create UI mockups/prototypes
4. Begin Phase 1 development (see tasks/todo.md)
5. Setup analytics tracking

---

## References

- Implementation Plan: `tasks/todo.md`
- API Design: TBD
- UI Mockups: TBD
- User Research: TBD
