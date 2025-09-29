export const DEPARTMENTS = [
  'Sales',
  'Engineering', 
  'HR',
  'Marketing',
  'Finance',
  'Operations'
] as const;

export type Department = typeof DEPARTMENTS[number];