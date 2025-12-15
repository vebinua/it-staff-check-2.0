import { Module, ModuleCategory } from '../types/modules';

// Import module components
import { ITCheckDashboardModule } from './ITCheckDashboard';
import { ChapmanCGLogModule } from './AssetManagement';
import { InternalLogModule } from './InternalLog';
import { SoftwareLicenseModule } from './SoftwareLicense';
import { ReportingModule } from './Reporting';
import { SecurityAuditModule } from './SecurityAudit';
import { AnalyticsModule } from './Analytics';
import { TicketingModule } from './Ticketing';
import { CustomerServiceFeedbackModule } from './CustomerServiceFeedback';
import { PasswordManagerModule } from './PasswordManager';

export const MODULE_CATEGORIES: ModuleCategory[] = [
  {
    id: 'management',
    name: 'Asset Management',
    description: 'Manage physical and digital assets',
    icon: 'Package',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'Schedule and track maintenance activities',
    icon: 'Wrench',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'reporting',
    name: 'Reporting',
    description: 'Generate reports and insights',
    icon: 'BarChart3',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Security audits and compliance',
    icon: 'Shield',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Advanced analytics and insights',
    icon: 'TrendingUp',
    color: 'from-indigo-500 to-purple-500'
  }
];

export const AVAILABLE_MODULES: Module[] = [
  {
    id: 'it-check-dashboard',
    name: 'IT Check Dashboard',
    description: 'Manage and view all staff IT check entries',
    icon: 'CheckCircle',
    category: 'management',
    enabled: true,
    permissions: ['global-admin', 'module-admin', 'standard-user'],
    component: ITCheckDashboardModule
  },
  {
    id: 'chapmancg-log',
    name: 'ChapmanCG Log',
    description: 'Track and manage ChapmanCG client activities and time logs',
    icon: 'FileText',
    category: 'management',
    enabled: true,
    permissions: ['global-admin', 'module-admin', 'standard-user'],
    component: ChapmanCGLogModule
  },
  {
    id: 'internal-log',
    name: 'Internal Log',
    description: 'Track internal activities and time logs without credit system',
    icon: 'FileText',
    category: 'management',
    enabled: true,
    permissions: ['global-admin', 'module-admin', 'standard-user'],
    component: InternalLogModule
  },
  {
    id: 'ticketing-system',
    name: 'Ticketing System',
    description: 'Comprehensive help desk and ticket management system',
    icon: 'Ticket',
    category: 'management',
    enabled: true,
    permissions: ['global-admin', 'module-admin', 'standard-user'],
    component: TicketingModule
  },
  {
    id: 'customer-service-feedback',
    name: 'Customer Service Feedback',
    description: 'Generate feedback links and manage customer service evaluations',
    icon: 'MessageSquare',
    category: 'management',
    enabled: true,
    permissions: ['global-admin', 'module-admin', 'standard-user'],
    component: CustomerServiceFeedbackModule
  },
  {
    id: 'password-manager',
    name: 'Password Manager',
    description: 'Secure password storage and management with strength analysis',
    icon: 'Key',
    category: 'security',
    enabled: true,
    permissions: ['global-admin', 'module-admin', 'standard-user'],
    component: PasswordManagerModule
  },
  {
    id: 'software-licenses',
    name: 'Software License Management',
    description: 'Manage software licenses, track usage, and monitor compliance',
    icon: 'Key',
    category: 'management',
    enabled: true,
    permissions: ['global-admin', 'module-admin', 'standard-user'],
    component: SoftwareLicenseModule
  },
  {
    id: 'reporting-dashboard',
    name: 'Advanced Reporting',
    description: 'Generate comprehensive reports and export data in various formats',
    icon: 'BarChart3',
    category: 'reporting',
    enabled: true,
    permissions: ['global-admin', 'module-admin', 'standard-user'],
    component: ReportingModule
  },
  {
    id: 'security-audit',
    name: 'Security Audit',
    description: 'Conduct security audits, track findings, and manage compliance',
    icon: 'Shield',
    category: 'security',
    enabled: true,
    permissions: ['global-admin'],
    component: SecurityAuditModule
  },
  {
    id: 'inventory-tracking',
    name: 'Inventory Tracking',
    description: 'Real-time inventory tracking with barcode/QR code support',
    icon: 'Scan',
    category: 'management',
    enabled: false,
    permissions: ['global-admin', 'module-admin'],
  },
  {
    id: 'vendor-management',
    name: 'Vendor Management',
    description: 'Manage vendor relationships, contracts, and performance',
    icon: 'Building2',
    category: 'management',
    enabled: false,
    permissions: ['global-admin', 'module-admin'],
  },
  {
    id: 'cost-tracking',
    name: 'Cost Tracking',
    description: 'Track IT costs, budgets, and financial analytics',
    icon: 'DollarSign',
    category: 'analytics',
    enabled: false,
    permissions: ['global-admin'],
  },
  {
    id: 'compliance-manager',
    name: 'Compliance Manager',
    description: 'Manage regulatory compliance and audit trails',
    icon: 'FileCheck',
    category: 'security',
    enabled: false,
    permissions: ['global-admin'],
  }
];

export const getEnabledModules = (userRole: 'global-admin' | 'module-admin' | 'standard-user', modulePermissions?: string[]) => {
  return AVAILABLE_MODULES.filter(module => {
    if (!module.enabled) return false;
    
    // Global admin has access to everything
    if (userRole === 'global-admin') return true;
    
    // Module admin and standard user only have access to modules they're assigned to
    if (userRole === 'module-admin') {
      return modulePermissions?.includes(module.id) || false;
    }
    
    // Standard user only has access to modules they're specifically assigned to
    if (userRole === 'standard-user') {
      return modulePermissions?.includes(module.id) || false;
    }
    
    return false;
  });
};

export const getModulesByCategory = (category: string, userRole: 'global-admin' | 'module-admin' | 'standard-user', modulePermissions?: string[]) => {
  return getEnabledModules(userRole, modulePermissions).filter(module => module.category === category);
};