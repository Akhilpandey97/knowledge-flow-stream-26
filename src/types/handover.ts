export interface HandoverTask {
  id: string;
  title: string;
  description: string;
  category: string;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  notes?: string;
  attachments?: string[];
  videoLinks?: string[];
}

export interface Handover {
  id: string;
  exitingEmployeeId: string;
  exitingEmployeeName: string;
  successorId?: string;
  successorName?: string;
  department: string;
  position: string;
  startDate: string;
  targetDate: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'review' | 'completed';
  tasks: HandoverTask[];
  criticalGaps: string[];
}

export interface DepartmentProgress {
  department: string;
  progress: number;
  totalHandovers: number;
  completedHandovers: number;
  criticalIssues: number;
}