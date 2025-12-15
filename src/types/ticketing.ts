// Ticketing System Types
export interface Ticket {
  id: string;
  ticketNumber: string; // Auto-generated (e.g., TKT-2025-001)
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  assignedTo?: string;
  assignedToName?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  dueDate?: string;
  
  // Parent-Child relationships
  parentTicketId?: string;
  childTicketIds: string[];
  
  // Custom fields
  customFields: { [key: string]: any };
  
  // Labels and tags
  labels: string[];
  
  // SLA tracking
  slaBreached: boolean;
  responseTime?: number; // in minutes
  resolutionTime?: number; // in minutes
  
  // File attachments
  attachments: TicketAttachment[];
  
  // Collaboration
  isBeingViewed: boolean;
  viewedBy: string[];
  lastViewedAt?: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  content: string;
  isPrivate: boolean; // Private notes vs public comments
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string;
  attachments: TicketAttachment[];
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
  url: string; // In real app, this would be a secure URL
}

export interface CannedResponse {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  usageCount: number;
}

export interface TicketSLA {
  id: string;
  name: string;
  priority: TicketPriority;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'date' | 'number' | 'checkbox';
  options?: string[]; // For select/multiselect fields
  required: boolean;
  isActive: boolean;
  order: number;
  createdBy: string;
  createdAt: string;
}

export interface TicketFilter {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assignedTo?: string[];
  createdBy?: string[];
  labels?: string[];
  category?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  slaBreached?: boolean;
  hasAttachments?: boolean;
}

export type TicketStatus = 
  | 'open' 
  | 'in-progress' 
  | 'pending-customer' 
  | 'pending-internal' 
  | 'resolved' 
  | 'closed' 
  | 'cancelled';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketActivity {
  id: string;
  ticketId: string;
  action: TicketAction;
  description: string;
  performedBy: string;
  performedByName: string;
  performedAt: string;
  metadata?: { [key: string]: any };
}

export type TicketAction = 
  | 'created'
  | 'updated' 
  | 'assigned'
  | 'status_changed'
  | 'priority_changed'
  | 'comment_added'
  | 'attachment_added'
  | 'merged'
  | 'split'
  | 'deleted'
  | 'restored';

// Dashboard statistics
export interface TicketStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  overdueTickets: number;
  slaBreachedTickets: number;
  avgResponseTime: number;
  avgResolutionTime: number;
  ticketsByPriority: { [key in TicketPriority]: number };
  ticketsByStatus: { [key in TicketStatus]: number };
  recentActivity: TicketActivity[];
}

export const TICKET_CATEGORIES = [
  'Hardware Issue',
  'Software Issue',
  'Network Problem',
  'Access Request',
  'Password Reset',
  'Account Setup',
  'Equipment Request',
  'System Maintenance',
  'Security Incident',
  'Training Request',
  'General Inquiry',
  'Other'
];

export const TICKET_LABELS = [
  'urgent',
  'bug',
  'feature-request',
  'documentation',
  'training',
  'security',
  'hardware',
  'software',
  'network',
  'user-error',
  'escalated',
  'waiting-approval'
];