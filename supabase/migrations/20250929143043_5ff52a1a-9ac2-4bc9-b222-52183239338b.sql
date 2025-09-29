-- Update existing users with sample departments based on their roles
UPDATE users SET department = 
  CASE 
    WHEN role = 'admin' THEN 'HR'
    WHEN role = 'hr-manager' THEN 'HR'
    WHEN role = 'exiting' AND email LIKE '%sales%' THEN 'Sales'
    WHEN role = 'exiting' AND email LIKE '%engineering%' THEN 'Engineering'
    WHEN role = 'exiting' AND email LIKE '%finance%' THEN 'Finance'
    WHEN role = 'successor' AND email LIKE '%sales%' THEN 'Sales'
    WHEN role = 'successor' AND email LIKE '%engineering%' THEN 'Engineering'
    WHEN role = 'successor' AND email LIKE '%finance%' THEN 'Finance'
    WHEN role = 'exiting' THEN 'Sales'  -- Default exiting to Sales
    WHEN role = 'successor' THEN 'Engineering'  -- Default successor to Engineering
    ELSE 'Operations'  -- Default fallback
  END
WHERE department IS NULL;