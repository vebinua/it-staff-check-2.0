export interface User {
  id: string;
  auth_user_id?: string;
  username: string;
  role: 'global-admin' | 'module-admin' | 'standard-user';
  name: string;
  modulePermissions?: string[]; // For module admins - which modules they can admin
  password?: string; // Temporary field for mock authentication
  created_at?: string;
  updated_at?: string;
}

export interface SpeedTest {
  url: string;
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
}

export interface InstalledApp {
  name: string;
  version: string;
  notes: string;
}

export interface ITCheckEntry {
  id: string;
  // Basic Information
  name: string;
  department: string;
  batchNumber?: string; // Optional field for BLAB department
  computerType: 'Windows' | 'Mac';
  itCheckCompleted: string;
  
  // Network Information
  ipAddress: string;
  isp: string;
  connectionType: string;
  
  // Speed Test Results (3 required)
  speedTests: SpeedTest[];
  
  // Installed Applications
  installedApps: InstalledApp[];
  
  // PC Specifications
  operatingSystem: string;
  processor: {
    brand?: string;
    series?: string;
    generation?: string;
    macProcessor?: string;
  };
  memory: string;
  graphics: string;
  storage: string;
  pcModel: string;
  
  // System fields
  addedBy: string;
  timestamp: string;
  status: 'Passed' | 'Failed';
}

export interface ValidationResult {
  passed: boolean;
  failedFields: string[];
}

export const DEPARTMENTS = [
  'Abled Online',
  'BLAB',
  'Business Development',
  'Coach',
  'Creative',
  'CS',
  'EA',
  'EMT',
  'ESG',
  'Finance',
  'HR',
  'IT',
  'Lang',
  'LD',
  'Learning',
  'Mancom',
  'MKT',
  'Others',
  'QA',
  'RS',
  'Special Projects',
  'Student',
  'Trainee',
  'WebDev'
];


export const WINDOWS_OS_OPTIONS = [
  'Windows 10 Home',
  'Windows 10 Home Single Language',
  'Windows 10 Pro',
  'Windows 11 Home',
  'Windows 11 Home Single Language',
  'Windows 11 Pro'
];

export const MAC_OS_OPTIONS = [
  'Mojave',
  'Catalina',
  'Big Sur',
  'Monterey',
  'Ventura',
  'Sonoma',
  'Sequoia'
];

export const INTEL_SERIES = ['Core i3', 'Core i5', 'Core i7', 'Core i9'];
export const AMD_SERIES = ['Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9'];
export const GENERATIONS = ['8th Gen', '9th Gen', '10th Gen', '11th Gen', '12th Gen', '13th Gen', '14th Gen'];
export const MAC_PROCESSORS = ['M1', 'M1 Pro', 'M1 Max', 'M1 Ultra', 'M2', 'M2 Pro', 'M2 Max', 'M2 Ultra', 'M3', 'M3 Pro', 'M3 Max'];

export const MEMORY_OPTIONS = ['4GB', '8GB', '16GB', '32GB'];
export const STORAGE_OPTIONS = ['120GB', '240GB', '256GB', '480GB', '512GB', '1TB'];

// Premium departments with stricter validation requirements
export const PREMIUM_DEPARTMENTS = ['Abled Online', 'WebDev', 'Creative', 'Learning'];

// Other departments with standard validation requirements
export const OTHER_DEPARTMENTS = [
  'BLAB',
  'Business Development', 
  'Coach',
  'CS',
  'EA',
  'EMT',
  'ESG',
  'Finance',
  'HR',
  'IT',
  'Lang',
  'LD',
  'Mancom',
  'MKT',
  'Others',
  'QA',
  'RS',
  'Special Projects',
  'Student',
  'Trainee'
];

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: 'login' | 'logout' | 'add_entry' | 'update_entry' | 'delete_entry' | 'add_user' | 'update_user' | 'delete_user' | 'view_entry' | 'email_entry';
  targetId?: string;
  targetName?: string;
  details?: string;
  timestamp: string;
}

export interface ChapmanCGLogEntry {
  id: string;
  idCode: string;
  clientName: string;
  subjectIssue: string;
  category: 'calendar-delegation' | 'system-optimization' | 'security-check' | 'yammer' | 'password-reset' | 'account-setup' | 'mailbox-delegation' | 'invenias' | 'signature-setup' | 'account-closure' | 'outlook' | 'laptop-setup' | 'software-application' | 'dropbox' | 'others';
  dateStarted: string;
  timeStarted: string;
  dateFinished: string;
  timeFinished: string;
  technicianName: string;
  resolutionDetails: string;
  remarks: string;
  status: 'done' | 'pending' | 'on-hold';
  timeConsumedMinutes: number;
  totalTimeChargeMinutes: number;
  creditConsumed: number;
  totalCreditConsumed: number;
  addedBy: string;
  timestamp: string;
}

export interface CreditBlock {
  id: string;
  blockNumber: number;
  purchaseDate: string;
  totalCredits: number;
  isActive: boolean;
  addedBy: string;
  timestamp: string;
}