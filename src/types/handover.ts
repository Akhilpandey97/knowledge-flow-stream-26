export interface TaskInsight {
  id: string;
  topic: string;
  content: string;
  createdAt: string;
  attachments?: string[];
}

export interface HandoverTask {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'pending' | 'completed' | 'in-progress';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  notes?: string;
  insights?: TaskInsight[];
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

// New interfaces for step-based handover process
export interface HandoverStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  order: number;
}

export interface PersonalAccountsData {
  clientAccounts: Array<{
    clientName: string;
    accountValue: string;
    relationship: string;
    keyContacts: string;
    notes: string;
  }>;
  pipelineDeals: Array<{
    dealName: string;
    value: string;
    stage: string;
    timeline: string;
    notes: string;
  }>;
  additionalNotes: string;
}

export interface CustomerInsightsData {
  customerProfiles: Array<{
    customerName: string;
    industry: string;
    preferences: string;
    history: string;
    specialNotes: string;
  }>;
  marketInsights: string;
  competitorInfo: string;
  recommendations: string;
}

export interface InternalWorkflowsData {
  processes: Array<{
    processName: string;
    description: string;
    frequency: string;
    stakeholders: string;
    notes: string;
  }>;
  systemAccess: Array<{
    systemName: string;
    accessLevel: string;
    credentials: string;
    notes: string;
  }>;
  teamDynamics: string;
  operationalNotes: string;
}

export interface PendingTasksData {
  urgentTasks: Array<{
    taskName: string;
    priority: 'high' | 'medium' | 'low';
    deadline: string;
    assignedTo: string;
    description: string;
  }>;
  projectStatus: Array<{
    projectName: string;
    status: string;
    nextSteps: string;
    stakeholders: string;
    notes: string;
  }>;
  followUpRequired: string;
  criticalDeadlines: string;
}

export interface StepBasedHandover {
  id: string;
  exitingEmployeeId: string;
  currentStep: number;
  steps: HandoverStep[];
  personalAccounts: PersonalAccountsData;
  customerInsights: CustomerInsightsData;
  internalWorkflows: InternalWorkflowsData;
  pendingTasks: PendingTasksData;
  overallProgress: number;
  lastUpdated: string;
}