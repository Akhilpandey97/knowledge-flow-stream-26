# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/f693cea2-a1b0-4aad-8375-f4c233cf234a

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f693cea2-a1b0-4aad-8375-f4c233cf234a) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f693cea2-a1b0-4aad-8375-f4c233cf234a) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

---

# HR Manager Handover System Documentation

## Overview

The Knowledge Flow Stream system enables HR managers to create and manage handovers between exiting employees and their successors. This documentation explains how HR managers link exiting employees and successors through the handover management system.

## Data Model

### Core Tables

#### Users Table
```sql
users {
  id: uuid (primary key)
  email: text (unique)
  role: text ('exiting' | 'successor' | 'hr-manager' | 'admin')
  department: text (nullable)
  created_at: timestamp
}
```

#### Handovers Table
```sql
handovers {
  id: uuid (primary key)
  employee_id: uuid (foreign key → users.id)
  successor_id: uuid (foreign key → users.id, nullable)
  progress: integer (0-100)
  created_at: timestamp
}
```

#### Supporting Tables
- **tasks**: Track handover task completion
- **messages**: Communication between exiting employee and successor
- **notes**: Additional documentation and context

### Key Relationships

- `handovers.employee_id` → `users.id` (many-to-one)
- `handovers.successor_id` → `users.id` (many-to-one, optional)
- HR managers are **not directly linked** in the handover table but act as administrators

## HR Manager Functionality

### 1. Creating Handovers

HR managers with the 'hr-manager' role can create handovers through the **Manage Handovers** interface:

1. **Access**: Navigate to HR Manager Dashboard → "Manage Handovers" button
2. **Create Handover**: Click "Create New Handover"
3. **Select Exiting Employee**: Choose from users with role 'exiting'
4. **Select Successor** (optional): Choose from users with role 'successor'
5. **Submit**: System creates handover record with `employee_id` and optional `successor_id`

### 2. User Management

HR managers can add new users to the system:

#### Adding Exiting Employees
```typescript
// Creates user record with role 'exiting'
{
  email: "employee@company.com",
  role: "exiting",
  department: "Engineering" // or other department
}
```

#### Adding Successors
```typescript
// Creates user record with role 'successor'
{
  email: "successor@company.com", 
  role: "successor",
  department: "Engineering" // or other department
}
```

### 3. Handover Linking Process

When an HR manager creates a handover:

1. **Employee Selection**: System filters users where `role = 'exiting'`
2. **Successor Selection**: System filters users where `role = 'successor'`
3. **Database Insert**: 
   ```sql
   INSERT INTO handovers (employee_id, successor_id, progress)
   VALUES (selected_employee_id, selected_successor_id, 0)
   ```

### 4. Administrative Role

HR managers act as **facilitators** rather than direct participants:
- They create the handover relationships
- They can view all handovers across the organization
- They monitor progress and identify risks
- They are **not stored as creators** in the current handover table structure

## Access Control

### Role-Based Permissions

- **HR Managers (`hr-manager`)**: 
  - Create/manage all handovers
  - Add users with 'exiting' or 'successor' roles
  - View organization-wide handover statistics
  - Access AI insights and recommendations

- **Exiting Employees (`exiting`)**:
  - View their own handover
  - Complete handover tasks
  - Communicate with assigned successor

- **Successors (`successor`)**:
  - View assigned handover
  - Complete successor-specific tasks
  - Communicate with exiting employee

### Database Functions

The system includes helper functions for access control:
- `list_successor_candidates()`: Returns available successors for HR managers
- `get_current_user_role()`: Determines user permissions
- `is_admin()`: Administrative access checking

## Current Limitations

### Missing Audit Trail
The current `handovers` table does not track:
- Which HR manager created the handover
- When the handover was last modified
- Who made specific changes

### Recommended Improvements

#### 1. Add Created By Field
```sql
ALTER TABLE handovers 
ADD COLUMN created_by uuid REFERENCES users(id);
```

This would enable:
- Tracking which HR manager created each handover
- Better audit trails and accountability
- Reporting on HR manager activity

#### 2. Add Audit Fields
```sql
ALTER TABLE handovers 
ADD COLUMN updated_at timestamp DEFAULT now(),
ADD COLUMN updated_by uuid REFERENCES users(id);
```

#### 3. Activity Logging
Implement comprehensive logging for:
- Handover creation events
- User assignments and changes
- Progress updates
- Status transitions

## Implementation Files

### Key Components
- `src/components/dashboard/HRManagerDashboard.tsx`: Main HR interface
- `src/components/dashboard/ManageHandovers.tsx`: Handover creation/management
- `src/hooks/useRealHandovers.ts`: Handover data operations
- `src/hooks/useHandoversList.ts`: Handover listing and filtering

### Database Schema
- `supabase/migrations/`: Contains table creation and modification scripts
- `src/integrations/supabase/types.ts`: TypeScript type definitions

### Authentication & Authorization
- Role-based access implemented through Supabase RLS policies
- User roles managed in `users` table
- Functions provide secure data access patterns

---
