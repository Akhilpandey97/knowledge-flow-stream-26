

# Manager's Dashboard Redesign

## Overview
A complete visual and structural redesign of the Manager's Dashboard, transforming it from a long vertical scroll of cards into a modern, tabbed layout with better information hierarchy, visual density, and actionable workflows.

## Current Problems
- Everything stacked vertically -- requires excessive scrolling
- Metric cards take too much space for simple numbers
- AI Insights section is visually dominant but often empty
- Handover list is flat with no filtering or sorting
- No quick-glance view of what needs attention right now

## New Layout

### 1. Compact Header with Inline Metrics
Replace the large header + 5 separate metric cards with a single compact header row containing inline stat pills. This saves vertical space and gives an at-a-glance overview immediately.

### 2. Tabbed Content Area
Organize the dashboard into 3 tabs:
- **Overview** -- AI insights + a summary of handovers grouped by status (needs attention, in progress, completed)
- **Handovers** -- Full handover list with search/filter, sortable, with expanded detail on click
- **Escalations** -- The help requests panel (currently buried at the bottom)

### 3. "Needs Attention" Priority Section (Overview Tab)
A highlighted section at the top of the Overview tab combining:
- Handovers with no successor assigned
- Low-progress handovers
- Pending escalations count

All as actionable items rather than passive alerts.

### 4. Handover Cards Redesign
Replace the current verbose handover cards with a compact table-like layout showing key info (names, progress bar, status badge, risk level) in a single row, with expand-on-click for details.

### 5. Condensed AI Insights
Show insights as a horizontal scrollable row of small chips/badges rather than large cards, making them less visually dominant when few exist.

---

## Technical Details

### Files Modified
- **`src/components/dashboard/HRManagerDashboard.tsx`** -- Complete rewrite of the component with new layout structure using Tabs (from existing `@radix-ui/react-tabs`), compact metrics, and reorganized sections.

### No New Files Required
All UI primitives already exist: Tabs, Card, Badge, Progress, Button, Alert, etc.

### No Database Changes
The same hooks (`useHandoverStats`, `useHandoversList`, `useAIInsightsForHR`, `useHelpRequests`) will be reused with the same data.

### Key Implementation Details

**Compact Stat Bar**: Replace 5 separate Card components with a single flex row of styled stat items inside the header area.

**Tabs Structure**:
```text
+--------------------------------------------------+
| Manager's Dashboard    [Department]  [Export] [+]  |
|                                                    |
| [42%] Overall  [3] Exiting  [2] Successors        |
| [1] Completed  [2] At Risk                        |
+--------------------------------------------------+
| [Overview]  [Handovers]  [Escalations (2)]        |
+--------------------------------------------------+
| Tab content here                                   |
+--------------------------------------------------+
```

**Overview Tab Content**:
- Attention-required banner (combines risk alerts + pending escalations into one actionable section)
- AI Insights displayed as compact horizontal cards
- Quick handover summary showing counts by status

**Handovers Tab Content**:
- Search input for filtering by name/email
- Status filter dropdown (All / In Progress / Review / Completed)
- Compact table rows for each handover with inline progress bars
- Click to expand for details (emails, dates, AI recommendation)

**Escalations Tab Content**:
- Reuses existing `HelpRequestsPanel` component
- Tab label shows pending count as a badge for quick visibility

**Responsive Behavior**:
- Stat pills wrap on mobile
- Handover rows stack vertically on small screens
- Tabs remain horizontal with scroll on mobile

