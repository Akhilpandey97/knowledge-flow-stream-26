# Developer Documentation: HR Manager Handover System

## Technical Implementation Guide

This document provides detailed technical information for developers working with the HR manager handover functionality.

## Database Schema Details

### Table Structures

#### Users Table
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('exiting', 'successor', 'hr-manager', 'admin')),
  department text,
  created_at timestamp with time zone DEFAULT now()
);
```

#### Handovers Table
```sql
CREATE TABLE handovers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES users(id),
  successor_id uuid REFERENCES users(id),
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at timestamp with time zone DEFAULT now()
);
```

### Foreign Key Relationships

1. **handovers.employee_id → users.id**
   - Links handover to the departing employee
   - Cannot be null (every handover must have an exiting employee)
   - References user with role 'exiting'

2. **handovers.successor_id → users.id**
   - Links handover to the replacement employee
   - Can be null (handover can be created without successor initially)
   - References user with role 'successor'

## API Operations

### Creating Handovers

The `useRealHandovers` hook provides the `createHandover` function:

```typescript
const createHandover = async (employeeId: string, successorId?: string) => {
  const { data, error } = await supabase
    .from('handovers')
    .insert({
      employee_id: employeeId,
      successor_id: successorId || null,
      progress: 0
    })
    .select()
    .single();
    
  return { data, error: error?.message || null };
};
```

### Fetching Handovers with Relations

```typescript
const { data: handoversData, error } = await supabase
  .from('handovers')
  .select(`
    *,
    employee:users!handovers_employee_id_fkey(email, department),
    successor:users!handovers_successor_id_fkey(email, department),
    tasks(id, status)
  `)
  .order('created_at', { ascending: false });
```

## React Components Architecture

### Component Hierarchy

```
HRManagerDashboard
├── Tabs (Overview, Successors, Exiting)
├── ManageHandovers (when navigated)
│   ├── CreateHandoverModal
│   ├── AddExitingEmployeeModal
│   └── AddSuccessorModal
└── ExportButton
```

### Key Hooks

#### useRealHandovers
- **Purpose**: Manages handover CRUD operations
- **Real-time**: Subscribes to handover table changes
- **Returns**: handovers array, loading state, error state, CRUD functions

#### useHandoversList
- **Purpose**: Provides formatted handover data with computed fields
- **Features**: Calculates progress percentages, risk levels, status
- **Returns**: Processed handover data suitable for UI display

#### useHandoverStats
- **Purpose**: Aggregates handover statistics for dashboard
- **Metrics**: Total handovers, completion rates, risk distributions
- **Returns**: Statistical summary data

## Role-Based Access Control

### Permission Matrix

| Action | Exiting | Successor | HR Manager | Admin |
|--------|---------|-----------|------------|-------|
| Create Handover | ❌ | ❌ | ✅ | ✅ |
| View Own Handover | ✅ | ✅ | ❌ | ✅ |
| View All Handovers | ❌ | ❌ | ✅ | ✅ |
| Add Users | ❌ | ❌ | ✅ | ✅ |
| Modify Handover | ❌ | ❌ | ✅ | ✅ |

### Access Control Implementation

#### Database Functions
```sql
-- Returns candidates for successor assignment
CREATE OR REPLACE FUNCTION list_successor_candidates()
RETURNS TABLE(id uuid, email text, role text)
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.role
  FROM users u
  WHERE u.role <> 'exiting'
    AND u.id <> auth.uid()
    AND (
      (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
      OR 
      (SELECT role FROM users WHERE id = auth.uid()) IN ('exiting', 'hr-manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### TypeScript Type Guards
```typescript
type UserRole = 'exiting' | 'successor' | 'hr-manager' | 'admin';

const isHRManager = (role: UserRole): boolean => role === 'hr-manager';
const canCreateHandover = (role: UserRole): boolean => 
  role === 'hr-manager' || role === 'admin';
```

## User Interface Patterns

### Form Handling
The ManageHandovers component uses controlled forms with validation:

```typescript
const [formData, setFormData] = useState({
  exitingEmployee: '',
  successor: '',
  department: ''
});

const handleCreateHandover = async () => {
  if (!formData.exitingEmployee) {
    toast({ title: "Error", description: "Please select an exiting employee" });
    return;
  }
  // ... create handover logic
};
```

### Real-time Updates
All handover data automatically updates via Supabase real-time subscriptions:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('handovers-management-changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'handovers'
    }, () => {
      fetchHandovers(); // Refresh data
    })
    .subscribe();

  return () => supabase.removeChannel(channel);
}, []);
```

## Error Handling Patterns

### Database Operations
```typescript
try {
  const { data, error } = await supabase
    .from('handovers')
    .insert(handoverData);
    
  if (error) throw error;
  
  toast({ title: "Success", description: "Handover created!" });
} catch (err) {
  console.error('Handover creation failed:', err);
  toast({ 
    title: "Error", 
    description: err.message || "Failed to create handover",
    variant: "destructive" 
  });
}
```

### Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await performAction();
  } finally {
    setLoading(false);
  }
};
```

## Testing Considerations

### Unit Tests
- Test handover creation with valid/invalid data
- Test role-based access control
- Test form validation logic
- Mock Supabase client operations

### Integration Tests
- Test complete handover creation flow
- Test real-time subscription updates
- Test error handling scenarios
- Test cross-component communication

### Manual Testing Scenarios
1. **HR Manager Creates Handover**
   - Login as HR manager
   - Navigate to Manage Handovers
   - Create handover with exiting employee only
   - Create handover with both exiting employee and successor
   - Verify database records

2. **Role-Based Access**
   - Test that exiting employees cannot access management interface
   - Test that successors cannot create handovers
   - Test that HR managers can see all handovers

## Performance Considerations

### Database Queries
- Use joins to fetch related data in single query
- Index foreign key columns for efficient lookups
- Implement pagination for large handover lists

### React Optimization
- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Consider virtualization for large lists

### Real-time Subscriptions
- Limit subscription scope to necessary tables
- Implement debouncing for rapid updates
- Clean up subscriptions on component unmount

## Security Considerations

### Row Level Security (RLS)
Supabase RLS policies should enforce:
- HR managers can access all handovers
- Exiting employees can only access their own handover
- Successors can only access assigned handovers

### Input Validation
- Validate email formats
- Sanitize user inputs
- Enforce role constraints
- Validate foreign key references

### Authentication
- Verify user authentication before database operations
- Use secure session management
- Implement proper logout procedures

## Future Enhancements

### Recommended Database Changes
1. **Add audit trail fields**:
   ```sql
   ALTER TABLE handovers 
   ADD COLUMN created_by uuid REFERENCES users(id),
   ADD COLUMN updated_at timestamp DEFAULT now(),
   ADD COLUMN updated_by uuid REFERENCES users(id);
   ```

2. **Add handover status enum**:
   ```sql
   ALTER TABLE handovers 
   ADD COLUMN status text DEFAULT 'active' 
   CHECK (status IN ('draft', 'active', 'completed', 'cancelled'));
   ```

### Feature Improvements
- Bulk handover creation
- Handover templates
- Advanced progress tracking
- Email notifications
- Calendar integration
- Document attachment system

### Monitoring & Analytics
- Track handover completion rates
- Monitor time-to-completion metrics
- Identify bottlenecks in the process
- Generate management reports

## Troubleshooting

### Common Issues

1. **Handover creation fails**
   - Check user roles are correctly assigned
   - Verify foreign key references exist
   - Check RLS policies allow the operation

2. **Real-time updates not working**
   - Verify subscription channel configuration
   - Check network connectivity
   - Ensure proper cleanup of subscriptions

3. **Permission denied errors**
   - Verify user authentication
   - Check role assignments in database
   - Review RLS policy configurations

### Debug Tools
- Supabase dashboard for database inspection
- Browser network tab for API requests
- React DevTools for component state
- Console logs for error tracking