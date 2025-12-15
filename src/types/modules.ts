export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'management' | 'reporting' | 'maintenance' | 'security' | 'analytics';
  enabled: boolean;
  permissions: ('global-admin' | 'module-admin' | 'standard-user')[];
  component?: React.ComponentType<any>;
}

export interface ModuleConfig {
  modules: Module[];
  categories: ModuleCategory[];
}

export interface ModuleCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Asset Management Types
export interface Asset {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  purchasePrice: number;
  warranty: {
    startDate: string;
    endDate: string;
    provider: string;
  };
  location: string;
  assignedTo?: string;
  status: 'active' | 'maintenance' | 'retired' | 'lost' | 'damaged';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string;
  addedBy: string;
  timestamp: string;
}

export type AssetCategory = 
  | 'laptop' 
  | 'desktop' 
  | 'monitor' 
  | 'keyboard' 
  | 'mouse' 
  | 'printer' 
  | 'scanner' 
  | 'phone' 
  | 'tablet' 
  | 'server' 
  | 'network' 
  | 'software' 
  | 'other';

// Maintenance Types
export interface MaintenanceRecord {
  id: string;
  assetId: string;
  assetName: string;
  type: 'preventive' | 'corrective' | 'upgrade' | 'inspection';
  description: string;
  scheduledDate: string;
  completedDate?: string;
  technician: string;
  cost: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  addedBy: string;
  timestamp: string;
}

// Software License Types
export interface SoftwareAddIn {
  id: string;
  name: string;
  cost: number;
  totalLicenses: number;
  usedLicenses: number;
  purchaseDate: string;
  expiryDate?: string;
  notes: string;
}

export interface SoftwareLicense {
  id: string;
  name: string;
  vendor: string;
  version: string;
  licenseType: 'perpetual' | 'subscription' | 'volume' | 'oem';
  totalLicenses: number;
  usedLicenses: number;
  purchaseDate: string;
  expiryDate?: string;
  cost: number;
  licenseKey?: string;
  assignedUsers: string[];
  status: 'active' | 'expired' | 'suspended';
  notes: string;
  addIns: SoftwareAddIn[];
  addedBy: string;
  timestamp: string;
}

// Reporting Types
export interface Report {
  id: string;
  name: string;
  type: 'asset-summary' | 'maintenance-schedule' | 'license-usage' | 'cost-analysis' | 'custom';
  description: string;
  filters: ReportFilter[];
  generatedBy: string;
  generatedAt: string;
  data: any;
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
  value: any;
}

// Security Audit Types
export interface SecurityAudit {
  id: string;
  auditDate: string;
  auditor: string;
  scope: string[];
  findings: SecurityFinding[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'in-review' | 'approved' | 'implemented';
  nextAuditDate: string;
  addedBy: string;
  timestamp: string;
}

export interface SecurityFinding {
  id: string;
  category: 'access-control' | 'data-protection' | 'network-security' | 'physical-security' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  status: 'open' | 'in-progress' | 'resolved' | 'accepted-risk';
  assignedTo?: string;
  dueDate?: string;
}