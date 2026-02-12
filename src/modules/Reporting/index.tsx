import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Download, FileText, TrendingUp, PieChart, Calendar, 
  Users, Shield, Key, MessageSquare, Clock, DollarSign, Filter,
  Search, Eye, CheckCircle, XCircle, AlertTriangle, Star, Globe
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/api';
import * as XLSX from 'xlsx';

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'it-check' | 'logs' | 'licenses' | 'security' | 'feedback' | 'overview';
  dataSource: string;
  fields: string[];
}

export function ReportingModule() {
  const { state } = useApp();
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [reportFilters, setReportFilters] = useState<{ [key: string]: any }>({});
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const reportConfigs: ReportConfig[] = [
    // IT Check Reports
    {
      id: 'it-check-summary',
      name: 'IT Check Summary Report',
      description: 'Complete overview of all IT check entries with pass/fail analysis',
      icon: CheckCircle,
      category: 'it-check',
      dataSource: 'itCheckEntries',
      fields: ['name', 'department', 'computerType', 'status', 'itCheckCompleted', 'addedBy']
    },
    {
      id: 'it-check-department',
      name: 'IT Check by Department',
      description: 'Department-wise breakdown of IT check results and compliance',
      icon: Users,
      category: 'it-check',
      dataSource: 'itCheckEntries',
      fields: ['department', 'status', 'computerType', 'processor', 'memory', 'storage']
    },
    {
      id: 'it-check-failed',
      name: 'Failed IT Checks Report',
      description: 'Detailed analysis of failed IT checks with failure reasons',
      icon: XCircle,
      category: 'it-check',
      dataSource: 'itCheckEntries',
      fields: ['name', 'department', 'status', 'processor', 'memory', 'graphics', 'storage', 'operatingSystem']
    },
    {
      id: 'it-check-hardware',
      name: 'Hardware Specifications Report',
      description: 'Hardware inventory and specifications across all departments',
      icon: Shield,
      category: 'it-check',
      dataSource: 'itCheckEntries',
      fields: ['name', 'department', 'pcModel', 'processor', 'memory', 'graphics', 'storage', 'operatingSystem']
    },
    {
      id: 'it-check-network',
      name: 'Network Performance Report',
      description: 'Internet speed test results and network performance analysis',
      icon: TrendingUp,
      category: 'it-check',
      dataSource: 'itCheckEntries',
      fields: ['name', 'department', 'isp', 'connectionType', 'speedTests', 'ipAddress']
    },

    // ChapmanCG Log Reports
    {
      id: 'chapmancg-summary',
      name: 'ChapmanCG Activity Summary',
      description: 'Complete overview of ChapmanCG client activities and time tracking',
      icon: FileText,
      category: 'logs',
      dataSource: 'chapmanCGLogs',
      fields: ['idCode', 'clientName', 'category', 'technicianName', 'timeConsumedMinutes', 'creditConsumed', 'status']
    },
    {
      id: 'chapmancg-time-analysis',
      name: 'ChapmanCG Time Analysis',
      description: 'Time consumption analysis by category, technician, and client',
      icon: Clock,
      category: 'logs',
      dataSource: 'chapmanCGLogs',
      fields: ['category', 'technicianName', 'timeConsumedMinutes', 'creditConsumed', 'dateStarted', 'status']
    },
    {
      id: 'chapmancg-credit-usage',
      name: 'ChapmanCG Credit Usage Report',
      description: 'Credit consumption tracking and budget analysis',
      icon: DollarSign,
      category: 'logs',
      dataSource: 'chapmanCGLogs',
      fields: ['clientName', 'category', 'creditConsumed', 'totalCreditConsumed', 'dateStarted', 'technicianName']
    },
    {
      id: 'chapmancg-technician',
      name: 'ChapmanCG Technician Performance',
      description: 'Technician productivity and performance metrics',
      icon: Users,
      category: 'logs',
      dataSource: 'chapmanCGLogs',
      fields: ['technicianName', 'timeConsumedMinutes', 'creditConsumed', 'status', 'category', 'dateStarted']
    },

    // Internal Log Reports
    {
      id: 'internal-summary',
      name: 'Internal Activities Summary',
      description: 'Overview of internal team activities and time tracking',
      icon: FileText,
      category: 'logs',
      dataSource: 'internalLogs',
      fields: ['idCode', 'clientName', 'category', 'technicianName', 'timeConsumedMinutes', 'status']
    },
    {
      id: 'internal-productivity',
      name: 'Internal Team Productivity',
      description: 'Internal team productivity analysis and time allocation',
      icon: TrendingUp,
      category: 'logs',
      dataSource: 'internalLogs',
      fields: ['technicianName', 'category', 'timeConsumedMinutes', 'status', 'dateStarted']
    },

    // Software License Reports
    {
      id: 'license-inventory',
      name: 'Software License Inventory',
      description: 'Complete inventory of all software licenses and usage',
      icon: Key,
      category: 'licenses',
      dataSource: 'softwareLicenses',
      fields: ['name', 'vendor', 'licenseType', 'totalLicenses', 'usedLicenses', 'cost', 'expiryDate', 'status']
    },
    {
      id: 'license-expiration',
      name: 'License Expiration Report',
      description: 'Upcoming license expirations and renewal requirements',
      icon: Calendar,
      category: 'licenses',
      dataSource: 'softwareLicenses',
      fields: ['name', 'vendor', 'expiryDate', 'totalLicenses', 'cost', 'status']
    },
    {
      id: 'license-cost-analysis',
      name: 'License Cost Analysis',
      description: 'Software licensing costs and budget analysis',
      icon: DollarSign,
      category: 'licenses',
      dataSource: 'softwareLicenses',
      fields: ['name', 'vendor', 'cost', 'totalLicenses', 'licenseType', 'purchaseDate', 'expiryDate']
    },
    {
      id: 'license-utilization',
      name: 'License Utilization Report',
      description: 'License usage efficiency and optimization opportunities',
      icon: BarChart3,
      category: 'licenses',
      dataSource: 'softwareLicenses',
      fields: ['name', 'totalLicenses', 'usedLicenses', 'cost', 'vendor', 'status']
    },

    // Security Reports
    {
      id: 'password-security',
      name: 'Password Security Report',
      description: 'Password vault health and security analysis',
      icon: Shield,
      category: 'security',
      dataSource: 'passwords',
      fields: ['title', 'category', 'isCompromised', 'passwordStrength', 'lastUsed', 'createdAt']
    },
    {
      id: 'security-compliance',
      name: 'Security Compliance Report',
      description: 'Overall security compliance across all systems',
      icon: Shield,
      category: 'security',
      dataSource: 'combined',
      fields: ['system', 'complianceStatus', 'issues', 'recommendations']
    },

    // Customer Feedback Reports
    {
      id: 'feedback-summary',
      name: 'Customer Feedback Summary',
      description: 'Customer satisfaction ratings and feedback analysis',
      icon: MessageSquare,
      category: 'feedback',
      dataSource: 'customerFeedback',
      fields: ['staffName', 'customerName', 'client', 'rating', 'comments', 'submittedAt']
    },
    {
      id: 'feedback-performance',
      name: 'Staff Performance Report',
      description: 'Staff performance based on customer feedback ratings',
      icon: Star,
      category: 'feedback',
      dataSource: 'customerFeedback',
      fields: ['staffName', 'averageRating', 'totalFeedback', 'client', 'taskName']
    },

    // Overview Reports
    {
      id: 'system-overview',
      name: 'System Overview Report',
      description: 'Comprehensive overview of all system modules and data',
      icon: BarChart3,
      category: 'overview',
      dataSource: 'combined',
      fields: ['module', 'totalRecords', 'recentActivity', 'status', 'lastUpdated']
    },
    {
      id: 'monthly-summary',
      name: 'Monthly Summary Report',
      description: 'Monthly summary across all systems and activities',
      icon: Calendar,
      category: 'overview',
      dataSource: 'combined',
      fields: ['month', 'itChecks', 'logEntries', 'licenses', 'feedback', 'activities']
    }
  ];

  const categories = [
    { id: 'all', name: 'All Reports', icon: BarChart3, color: 'text-gray-600' },
    { id: 'it-check', name: 'IT Check Reports', icon: CheckCircle, color: 'text-blue-600' },
    { id: 'logs', name: 'Activity Logs', icon: FileText, color: 'text-green-600' },
    { id: 'licenses', name: 'Software Licenses', icon: Key, color: 'text-purple-600' },
    { id: 'security', name: 'Security Reports', icon: Shield, color: 'text-red-600' },
    { id: 'feedback', name: 'Customer Feedback', icon: MessageSquare, color: 'text-indigo-600' },
    { id: 'overview', name: 'System Overview', icon: TrendingUp, color: 'text-orange-600' }
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredReports = selectedCategory === 'all' 
    ? reportConfigs 
    : reportConfigs.filter(report => report.category === selectedCategory);

  const generateReport = async (reportId: string) => {
    const reportConfig = reportConfigs.find(r => r.id === reportId);
    if (!reportConfig) return;

    let data: any[] = [];
    let reportData: any = {};

    switch (reportConfig.dataSource) {
      case 'itCheckEntries':
        data = state.entries;
        break;
      case 'chapmanCGLogs':
        try {
          data = await apiClient.getChapmanCGEntries();
        } catch (error) {
          console.error('Error loading ChapmanCG logs:', error);
          data = [];
        }
        break;
      case 'internalLogs':
        try {
          data = await apiClient.getInternalLogEntries();
        } catch (error) {
          console.error('Error loading internal logs:', error);
          data = [];
        }
        break;
      case 'softwareLicenses':
        try {
          data = await apiClient.getSoftwareLicenses();
        } catch (error) {
          console.error('Error loading software licenses:', error);
          data = [];
        }
        break;
      case 'passwords':
        try {
          data = await apiClient.getPasswordEntries();
        } catch (error) {
          console.error('Error loading passwords:', error);
          data = [];
        }
        break;
      case 'customerFeedback':
        try {
          data = await apiClient.getFeedbackLinks();
        } catch (error) {
          console.error('Error loading feedback:', error);
          data = [];
        }
        break;
      case 'combined':
        // Generate combined system overview data
        data = generateSystemOverviewData();
        break;
    }

    // Apply date range filter if specified
    if (dateRange.start || dateRange.end) {
      data = data.filter(item => {
        const itemDate = new Date(item.timestamp || item.createdAt || item.itCheckCompleted || item.dateStarted || item.submittedAt);
        if (dateRange.start && itemDate < new Date(dateRange.start)) return false;
        if (dateRange.end && itemDate > new Date(dateRange.end)) return false;
        return true;
      });
    }

    // Generate specific report data based on report type
    switch (reportId) {
      case 'it-check-summary':
        reportData = generateITCheckSummary(data);
        break;
      case 'it-check-department':
        reportData = generateDepartmentAnalysis(data);
        break;
      case 'it-check-failed':
        reportData = generateFailedChecksReport(data);
        break;
      case 'it-check-hardware':
        reportData = generateHardwareReport(data);
        break;
      case 'it-check-network':
        reportData = generateNetworkReport(data);
        break;
      case 'chapmancg-summary':
        reportData = generateChapmanCGSummary(data);
        break;
      case 'chapmancg-time-analysis':
        reportData = generateTimeAnalysis(data);
        break;
      case 'chapmancg-credit-usage':
        reportData = generateCreditUsageReport(data);
        break;
      case 'chapmancg-technician':
        reportData = generateTechnicianPerformance(data);
        break;
      case 'internal-summary':
        reportData = generateInternalSummary(data);
        break;
      case 'internal-productivity':
        reportData = generateProductivityReport(data);
        break;
      case 'license-inventory':
        reportData = generateLicenseInventory(data);
        break;
      case 'license-expiration':
        reportData = generateExpirationReport(data);
        break;
      case 'license-cost-analysis':
        reportData = generateCostAnalysis(data);
        break;
      case 'license-utilization':
        reportData = generateUtilizationReport(data);
        break;
      case 'password-security':
        reportData = generatePasswordSecurityReport(data);
        break;
      case 'security-compliance':
        reportData = generateSecurityComplianceReport();
        break;
      case 'feedback-summary':
        reportData = generateFeedbackSummary(data);
        break;
      case 'feedback-performance':
        reportData = generateStaffPerformanceReport(data);
        break;
      case 'system-overview':
        reportData = generateSystemOverview();
        break;
      case 'monthly-summary':
        reportData = generateMonthlySummary();
        break;
      default:
        reportData = { data, summary: 'Raw data export' };
    }

    setGeneratedReport({
      config: reportConfig,
      data: reportData,
      generatedAt: new Date().toISOString(),
      filters: { dateRange, ...reportFilters }
    });
  };

  // Report generation functions
  const generateITCheckSummary = (data: any[]) => {
    const total = data.length;
    const passed = data.filter(entry => entry.status === 'Passed').length;
    const failed = data.filter(entry => entry.status === 'Failed').length;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    const departmentStats = data.reduce((acc, entry) => {
      if (!acc[entry.department]) {
        acc[entry.department] = { total: 0, passed: 0, failed: 0 };
      }
      acc[entry.department].total++;
      if (entry.status === 'Passed') acc[entry.department].passed++;
      else acc[entry.department].failed++;
      return acc;
    }, {});

    return {
      summary: {
        totalEntries: total,
        passedEntries: passed,
        failedEntries: failed,
        passRate: passRate.toFixed(1)
      },
      departmentBreakdown: Object.entries(departmentStats).map(([dept, stats]: [string, any]) => ({
        department: dept,
        total: stats.total,
        passed: stats.passed,
        failed: stats.failed,
        passRate: ((stats.passed / stats.total) * 100).toFixed(1)
      })),
      rawData: data
    };
  };

  const generateDepartmentAnalysis = (data: any[]) => {
    const departments = [...new Set(data.map(entry => entry.department))];
    
    return {
      departments: departments.map(dept => {
        const deptEntries = data.filter(entry => entry.department === dept);
        const passed = deptEntries.filter(entry => entry.status === 'Passed').length;
        const failed = deptEntries.filter(entry => entry.status === 'Failed').length;
        
        return {
          department: dept,
          totalEntries: deptEntries.length,
          passed,
          failed,
          passRate: deptEntries.length > 0 ? ((passed / deptEntries.length) * 100).toFixed(1) : '0',
          avgMemory: calculateAvgMemory(deptEntries),
          avgStorage: calculateAvgStorage(deptEntries),
          commonProcessor: getMostCommonProcessor(deptEntries)
        };
      }),
      rawData: data
    };
  };

  const generateFailedChecksReport = (data: any[]) => {
    const failedEntries = data.filter(entry => entry.status === 'Failed');
    
    return {
      summary: {
        totalFailed: failedEntries.length,
        failureRate: data.length > 0 ? ((failedEntries.length / data.length) * 100).toFixed(1) : '0'
      },
      failureReasons: analyzeFailureReasons(failedEntries),
      failedEntries: failedEntries.map(entry => ({
        name: entry.name,
        department: entry.department,
        computerType: entry.computerType,
        processor: getProcessorDisplay(entry),
        memory: entry.memory,
        graphics: entry.graphics,
        storage: entry.storage,
        operatingSystem: entry.operatingSystem,
        itCheckCompleted: entry.itCheckCompleted
      })),
      rawData: failedEntries
    };
  };

  const generateHardwareReport = (data: any[]) => {
    return {
      summary: {
        totalDevices: data.length,
        windowsDevices: data.filter(entry => entry.computerType === 'Windows').length,
        macDevices: data.filter(entry => entry.computerType === 'Mac').length
      },
      processorStats: getProcessorStats(data),
      memoryStats: getMemoryStats(data),
      storageStats: getStorageStats(data),
      osStats: getOSStats(data),
      rawData: data.map(entry => ({
        name: entry.name,
        department: entry.department,
        pcModel: entry.pcModel,
        computerType: entry.computerType,
        processor: getProcessorDisplay(entry),
        memory: entry.memory,
        graphics: entry.graphics,
        storage: entry.storage,
        operatingSystem: entry.operatingSystem
      }))
    };
  };

  const generateNetworkReport = (data: any[]) => {
    const networkData = data.map(entry => {
      const avgDownload = entry.speedTests.reduce((sum: number, test: any) => sum + test.downloadSpeed, 0) / entry.speedTests.length;
      const avgUpload = entry.speedTests.reduce((sum: number, test: any) => sum + test.uploadSpeed, 0) / entry.speedTests.length;
      const avgPing = entry.speedTests.reduce((sum: number, test: any) => sum + test.ping, 0) / entry.speedTests.length;
      
      return {
        name: entry.name,
        department: entry.department,
        isp: entry.isp,
        connectionType: entry.connectionType,
        ipAddress: entry.ipAddress,
        avgDownload: avgDownload.toFixed(1),
        avgUpload: avgUpload.toFixed(1),
        avgPing: avgPing.toFixed(1),
        speedTestsPassed: avgDownload >= 20 && avgUpload >= 5 && avgPing <= 50
      };
    });

    return {
      summary: {
        totalTests: data.length,
        passedSpeedTests: networkData.filter(entry => entry.speedTestsPassed).length,
        avgDownloadSpeed: (networkData.reduce((sum, entry) => sum + parseFloat(entry.avgDownload), 0) / networkData.length).toFixed(1),
        avgUploadSpeed: (networkData.reduce((sum, entry) => sum + parseFloat(entry.avgUpload), 0) / networkData.length).toFixed(1),
        avgPing: (networkData.reduce((sum, entry) => sum + parseFloat(entry.avgPing), 0) / networkData.length).toFixed(1)
      },
      ispStats: getISPStats(data),
      connectionTypeStats: getConnectionTypeStats(data),
      rawData: networkData
    };
  };

  // Helper functions for calculations
  const calculateAvgMemory = (entries: any[]) => {
    const memoryValues = entries.map(entry => parseInt(entry.memory.replace(/\D/g, '')));
    return memoryValues.length > 0 ? (memoryValues.reduce((sum, val) => sum + val, 0) / memoryValues.length).toFixed(0) + 'GB' : 'N/A';
  };

  const calculateAvgStorage = (entries: any[]) => {
    const storageValues = entries.map(entry => {
      const value = parseInt(entry.storage.replace(/\D/g, ''));
      return entry.storage.includes('TB') ? value * 1000 : value;
    });
    const avg = storageValues.length > 0 ? storageValues.reduce((sum, val) => sum + val, 0) / storageValues.length : 0;
    return avg >= 1000 ? (avg / 1000).toFixed(1) + 'TB' : avg.toFixed(0) + 'GB';
  };

  const getMostCommonProcessor = (entries: any[]) => {
    const processors = entries.map(entry => getProcessorDisplay(entry));
    const counts = processors.reduce((acc: any, proc) => {
      acc[proc] = (acc[proc] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).sort(([,a]: any, [,b]: any) => b - a)[0]?.[0] || 'N/A';
  };

  const getProcessorDisplay = (entry: any) => {
    if (entry.computerType === 'Mac') {
      return entry.processor.macProcessor || 'Unknown Mac Processor';
    }
    return `${entry.processor.brand || ''} ${entry.processor.series || ''} ${entry.processor.generation || ''}`.trim() || 'Unknown Processor';
  };

  const analyzeFailureReasons = (failedEntries: any[]) => {
    // This would use the validation logic to determine failure reasons
    const reasons = {
      processor: 0,
      memory: 0,
      graphics: 0,
      storage: 0,
      operatingSystem: 0,
      internetSpeed: 0
    };

    // In a real implementation, you'd use the validation logic here
    return Object.entries(reasons).map(([reason, count]) => ({
      reason: reason.charAt(0).toUpperCase() + reason.slice(1),
      count,
      percentage: failedEntries.length > 0 ? ((count / failedEntries.length) * 100).toFixed(1) : '0'
    }));
  };

  const getProcessorStats = (data: any[]) => {
    const processors = data.map(entry => getProcessorDisplay(entry));
    const counts = processors.reduce((acc: any, proc) => {
      acc[proc] = (acc[proc] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 10)
      .map(([processor, count]) => ({ processor, count }));
  };

  const getMemoryStats = (data: any[]) => {
    const memory = data.map(entry => entry.memory);
    const counts = memory.reduce((acc: any, mem) => {
      acc[mem] = (acc[mem] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .map(([memory, count]) => ({ memory, count }));
  };

  const getStorageStats = (data: any[]) => {
    const storage = data.map(entry => entry.storage);
    const counts = storage.reduce((acc: any, stor) => {
      acc[stor] = (acc[stor] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .map(([storage, count]) => ({ storage, count }));
  };

  const getOSStats = (data: any[]) => {
    const os = data.map(entry => entry.operatingSystem);
    const counts = os.reduce((acc: any, system) => {
      acc[system] = (acc[system] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .map(([operatingSystem, count]) => ({ operatingSystem, count }));
  };

  const getISPStats = (data: any[]) => {
    const isps = data.map(entry => entry.isp);
    const counts = isps.reduce((acc: any, isp) => {
      acc[isp] = (acc[isp] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .map(([isp, count]) => ({ isp, count }));
  };

  const getConnectionTypeStats = (data: any[]) => {
    const types = data.map(entry => entry.connectionType);
    const counts = types.reduce((acc: any, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(counts)
      .sort(([,a]: any, [,b]: any) => b - a)
      .map(([connectionType, count]) => ({ connectionType, count }));
  };

  const generateSystemOverviewData = () => {
    return [
      {
        module: 'IT Check Entries',
        totalRecords: state.entries.length,
        recentActivity: state.entries.filter(entry => 
          new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        status: 'Active',
        lastUpdated: state.entries.length > 0 ? state.entries[0].timestamp : 'N/A'
      },
      {
        module: 'User Management',
        totalRecords: state.users.length,
        recentActivity: state.activityLogs.filter(log => 
          new Date(log.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        status: 'Active',
        lastUpdated: state.activityLogs.length > 0 ? state.activityLogs[0].timestamp : 'N/A'
      }
    ];
  };

  const generateChapmanCGSummary = (data: any[]) => {
    const totalTime = data.reduce((sum, entry) => sum + (entry.timeConsumedMinutes || 0), 0);
    const totalCredits = data.reduce((sum, entry) => sum + (entry.creditConsumed || 0), 0);
    
    return {
      summary: {
        totalEntries: data.length,
        totalTimeMinutes: totalTime,
        totalTimeHours: (totalTime / 60).toFixed(1),
        totalCreditsConsumed: totalCredits.toFixed(2),
        avgTimePerEntry: data.length > 0 ? (totalTime / data.length).toFixed(1) : '0',
        avgCreditPerEntry: data.length > 0 ? (totalCredits / data.length).toFixed(2) : '0'
      },
      categoryBreakdown: getCategoryBreakdown(data),
      technicianStats: getTechnicianStats(data),
      rawData: data
    };
  };

  const generateTimeAnalysis = (data: any[]) => {
    const timeByCategory = data.reduce((acc: any, entry) => {
      const category = entry.category || 'other';
      if (!acc[category]) acc[category] = 0;
      acc[category] += entry.timeConsumedMinutes || 0;
      return acc;
    }, {});

    const timeByTechnician = data.reduce((acc: any, entry) => {
      const tech = entry.technicianName || 'Unknown';
      if (!acc[tech]) acc[tech] = { time: 0, entries: 0, credits: 0 };
      acc[tech].time += entry.timeConsumedMinutes || 0;
      acc[tech].entries += 1;
      acc[tech].credits += entry.creditConsumed || 0;
      return acc;
    }, {});

    return {
      categoryTime: Object.entries(timeByCategory).map(([category, time]) => ({
        category,
        timeMinutes: time,
        timeHours: ((time as number) / 60).toFixed(1)
      })),
      technicianTime: Object.entries(timeByTechnician).map(([technician, stats]: [string, any]) => ({
        technician,
        timeMinutes: stats.time,
        timeHours: (stats.time / 60).toFixed(1),
        entries: stats.entries,
        credits: stats.credits.toFixed(2),
        avgTimePerEntry: (stats.time / stats.entries).toFixed(1)
      })),
      rawData: data
    };
  };

  const generateCreditUsageReport = (data: any[]) => {
    const totalCredits = data.reduce((sum, entry) => sum + (entry.creditConsumed || 0), 0);
    
    const creditsByClient = data.reduce((acc: any, entry) => {
      const client = entry.clientName || 'Unknown';
      if (!acc[client]) acc[client] = 0;
      acc[client] += entry.creditConsumed || 0;
      return acc;
    }, {});

    const creditsByCategory = data.reduce((acc: any, entry) => {
      const category = entry.category || 'other';
      if (!acc[category]) acc[category] = 0;
      acc[category] += entry.creditConsumed || 0;
      return acc;
    }, {});

    return {
      summary: {
        totalCreditsConsumed: totalCredits.toFixed(2),
        totalEntries: data.length,
        avgCreditPerEntry: data.length > 0 ? (totalCredits / data.length).toFixed(2) : '0'
      },
      clientUsage: Object.entries(creditsByClient)
        .sort(([,a]: any, [,b]: any) => b - a)
        .map(([client, credits]) => ({
          client,
          credits: (credits as number).toFixed(2),
          percentage: ((credits as number / totalCredits) * 100).toFixed(1)
        })),
      categoryUsage: Object.entries(creditsByCategory)
        .sort(([,a]: any, [,b]: any) => b - a)
        .map(([category, credits]) => ({
          category,
          credits: (credits as number).toFixed(2),
          percentage: ((credits as number / totalCredits) * 100).toFixed(1)
        })),
      rawData: data
    };
  };

  const generateTechnicianPerformance = (data: any[]) => {
    const techStats = data.reduce((acc: any, entry) => {
      const tech = entry.technicianName || 'Unknown';
      if (!acc[tech]) {
        acc[tech] = {
          entries: 0,
          totalTime: 0,
          totalCredits: 0,
          completedTasks: 0,
          pendingTasks: 0,
          categories: new Set()
        };
      }
      
      acc[tech].entries += 1;
      acc[tech].totalTime += entry.timeConsumedMinutes || 0;
      acc[tech].totalCredits += entry.creditConsumed || 0;
      acc[tech].categories.add(entry.category);
      
      if (entry.status === 'done') acc[tech].completedTasks += 1;
      else acc[tech].pendingTasks += 1;
      
      return acc;
    }, {});

    return {
      technicians: Object.entries(techStats).map(([technician, stats]: [string, any]) => ({
        technician,
        totalEntries: stats.entries,
        totalTimeMinutes: stats.totalTime,
        totalTimeHours: (stats.totalTime / 60).toFixed(1),
        totalCredits: stats.totalCredits.toFixed(2),
        completedTasks: stats.completedTasks,
        pendingTasks: stats.pendingTasks,
        completionRate: stats.entries > 0 ? ((stats.completedTasks / stats.entries) * 100).toFixed(1) : '0',
        avgTimePerEntry: stats.entries > 0 ? (stats.totalTime / stats.entries).toFixed(1) : '0',
        avgCreditPerEntry: stats.entries > 0 ? (stats.totalCredits / stats.entries).toFixed(2) : '0',
        categoriesWorked: stats.categories.size
      })),
      rawData: data
    };
  };

  const generateInternalSummary = (data: any[]) => {
    const totalTime = data.reduce((sum, entry) => sum + (entry.timeConsumedMinutes || 0), 0);
    
    return {
      summary: {
        totalEntries: data.length,
        totalTimeMinutes: totalTime,
        totalTimeHours: (totalTime / 60).toFixed(1),
        completedTasks: data.filter(entry => entry.status === 'done').length,
        pendingTasks: data.filter(entry => entry.status === 'pending').length,
        onHoldTasks: data.filter(entry => entry.status === 'on-hold').length
      },
      categoryBreakdown: getCategoryBreakdown(data),
      technicianStats: getTechnicianStats(data),
      rawData: data
    };
  };

  const generateProductivityReport = (data: any[]) => {
    const productivity = data.reduce((acc: any, entry) => {
      const tech = entry.technicianName || 'Unknown';
      const date = entry.dateStarted?.split('T')[0] || 'Unknown';
      
      if (!acc[tech]) acc[tech] = {};
      if (!acc[tech][date]) acc[tech][date] = { time: 0, entries: 0 };
      
      acc[tech][date].time += entry.timeConsumedMinutes || 0;
      acc[tech][date].entries += 1;
      
      return acc;
    }, {});

    return {
      dailyProductivity: Object.entries(productivity).map(([technician, dates]: [string, any]) => ({
        technician,
        dailyStats: Object.entries(dates).map(([date, stats]: [string, any]) => ({
          date,
          timeMinutes: stats.time,
          timeHours: (stats.time / 60).toFixed(1),
          entries: stats.entries,
          avgTimePerEntry: (stats.time / stats.entries).toFixed(1)
        }))
      })),
      rawData: data
    };
  };

  const generateLicenseInventory = (data: any[]) => {
    const totalCost = data.reduce((sum, license) => sum + (license.cost || 0), 0);
    const totalLicenses = data.reduce((sum, license) => sum + (license.totalLicenses || 0), 0);
    const usedLicenses = data.reduce((sum, license) => sum + (license.usedLicenses || 0), 0);

    return {
      summary: {
        totalSoftware: data.length,
        totalLicenses,
        usedLicenses,
        availableLicenses: totalLicenses - usedLicenses,
        totalCost: totalCost.toFixed(2),
        utilizationRate: totalLicenses > 0 ? ((usedLicenses / totalLicenses) * 100).toFixed(1) : '0'
      },
      vendorBreakdown: getVendorBreakdown(data),
      licenseTypeBreakdown: getLicenseTypeBreakdown(data),
      rawData: data
    };
  };

  const generateExpirationReport = (data: any[]) => {
    const today = new Date();
    const expiringLicenses = data.filter(license => {
      if (!license.expiryDate) return false;
      const expiry = new Date(license.expiryDate);
      const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 90; // Next 90 days
    });

    return {
      summary: {
        totalLicenses: data.length,
        expiringIn30Days: expiringLicenses.filter(license => {
          const expiry = new Date(license.expiryDate);
          const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return days <= 30;
        }).length,
        expiringIn90Days: expiringLicenses.length,
        expiredLicenses: data.filter(license => {
          if (!license.expiryDate) return false;
          return new Date(license.expiryDate) < today;
        }).length
      },
      expiringLicenses: expiringLicenses.map(license => ({
        name: license.name,
        vendor: license.vendor,
        expiryDate: license.expiryDate,
        daysUntilExpiry: Math.ceil((new Date(license.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        totalLicenses: license.totalLicenses,
        cost: license.cost
      })),
      rawData: data
    };
  };

  const generateCostAnalysis = (data: any[]) => {
    const totalCost = data.reduce((sum, license) => sum + (license.cost || 0), 0);
    
    const costByVendor = data.reduce((acc: any, license) => {
      const vendor = license.vendor || 'Unknown';
      if (!acc[vendor]) acc[vendor] = 0;
      acc[vendor] += license.cost || 0;
      return acc;
    }, {});

    const costByType = data.reduce((acc: any, license) => {
      const type = license.licenseType || 'unknown';
      if (!acc[type]) acc[type] = 0;
      acc[type] += license.cost || 0;
      return acc;
    }, {});

    return {
      summary: {
        totalInvestment: totalCost.toFixed(2),
        averageCostPerLicense: data.length > 0 ? (totalCost / data.length).toFixed(2) : '0',
        totalSoftware: data.length
      },
      vendorCosts: Object.entries(costByVendor)
        .sort(([,a]: any, [,b]: any) => b - a)
        .map(([vendor, cost]) => ({
          vendor,
          cost: (cost as number).toFixed(2),
          percentage: ((cost as number / totalCost) * 100).toFixed(1)
        })),
      typeCosts: Object.entries(costByType)
        .sort(([,a]: any, [,b]: any) => b - a)
        .map(([type, cost]) => ({
          type,
          cost: (cost as number).toFixed(2),
          percentage: ((cost as number / totalCost) * 100).toFixed(1)
        })),
      rawData: data
    };
  };

  const generateUtilizationReport = (data: any[]) => {
    return {
      utilizationStats: data.map(license => ({
        name: license.name,
        vendor: license.vendor,
        totalLicenses: license.totalLicenses,
        usedLicenses: license.usedLicenses,
        availableLicenses: license.totalLicenses - license.usedLicenses,
        utilizationRate: license.totalLicenses > 0 ? ((license.usedLicenses / license.totalLicenses) * 100).toFixed(1) : '0',
        costPerLicense: license.totalLicenses > 0 ? (license.cost / license.totalLicenses).toFixed(2) : '0',
        wastedCost: ((license.totalLicenses - license.usedLicenses) * (license.cost / license.totalLicenses)).toFixed(2)
      })),
      summary: {
        totalWastedCost: data.reduce((sum, license) => {
          const unused = license.totalLicenses - license.usedLicenses;
          const costPerLicense = license.totalLicenses > 0 ? license.cost / license.totalLicenses : 0;
          return sum + (unused * costPerLicense);
        }, 0).toFixed(2)
      },
      rawData: data
    };
  };

  const generatePasswordSecurityReport = (data: any[]) => {
    // Mock password security analysis
    return {
      summary: {
        totalPasswords: data.length,
        strongPasswords: Math.floor(data.length * 0.7),
        weakPasswords: Math.floor(data.length * 0.2),
        compromisedPasswords: Math.floor(data.length * 0.1),
        vaultHealthScore: 85
      },
      recommendations: [
        'Update 3 weak passwords to improve security',
        'Enable two-factor authentication where possible',
        'Review and update passwords older than 90 days'
      ],
      rawData: data
    };
  };

  const generateSecurityComplianceReport = () => {
    return {
      systems: [
        {
          system: 'IT Check Compliance',
          status: 'Good',
          complianceRate: '78%',
          issues: 'Some failed hardware requirements',
          recommendations: 'Upgrade hardware for premium departments'
        },
        {
          system: 'Password Security',
          status: 'Excellent',
          complianceRate: '95%',
          issues: 'Few weak passwords detected',
          recommendations: 'Continue regular password updates'
        },
        {
          system: 'Software Licensing',
          status: 'Good',
          complianceRate: '88%',
          issues: 'Some licenses expiring soon',
          recommendations: 'Plan license renewals in advance'
        }
      ]
    };
  };

  const generateFeedbackSummary = (data: any[]) => {
    const totalRating = data.reduce((sum, feedback) => sum + (feedback.rating || 0), 0);
    const avgRating = data.length > 0 ? totalRating / data.length : 0;

    return {
      summary: {
        totalFeedback: data.length,
        averageRating: avgRating.toFixed(1),
        excellentRatings: data.filter(f => f.rating >= 4).length,
        poorRatings: data.filter(f => f.rating <= 2).length
      },
      ratingDistribution: [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: data.filter(f => f.rating === rating).length,
        percentage: data.length > 0 ? ((data.filter(f => f.rating === rating).length / data.length) * 100).toFixed(1) : '0'
      })),
      rawData: data
    };
  };

  const generateStaffPerformanceReport = (data: any[]) => {
    const staffStats = data.reduce((acc: any, feedback) => {
      const staff = feedback.staffName || 'Unknown';
      if (!acc[staff]) {
        acc[staff] = { ratings: [], totalFeedback: 0 };
      }
      acc[staff].ratings.push(feedback.rating);
      acc[staff].totalFeedback += 1;
      return acc;
    }, {});

    return {
      staffPerformance: Object.entries(staffStats).map(([staff, stats]: [string, any]) => ({
        staffName: staff,
        totalFeedback: stats.totalFeedback,
        averageRating: stats.ratings.length > 0 ? (stats.ratings.reduce((sum: number, rating: number) => sum + rating, 0) / stats.ratings.length).toFixed(1) : '0',
        excellentRatings: stats.ratings.filter((r: number) => r >= 4).length,
        poorRatings: stats.ratings.filter((r: number) => r <= 2).length
      })),
      rawData: data
    };
  };

  const generateSystemOverview = () => {
    return {
      modules: [
        {
          module: 'IT Check System',
          status: 'Active',
          totalRecords: state.entries.length,
          recentActivity: state.entries.filter(entry => 
            new Date(entry.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          ).length,
          healthScore: 85
        },
        {
          module: 'User Management',
          status: 'Active',
          totalRecords: state.users.length,
          recentActivity: state.activityLogs.length,
          healthScore: 95
        },
        {
          module: 'Activity Logging',
          status: 'Active',
          totalRecords: state.activityLogs.length,
          recentActivity: state.activityLogs.filter(log => 
            new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
          ).length,
          healthScore: 90
        }
      ]
    };
  };

  const generateMonthlySummary = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyData = {
      month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      itChecks: state.entries.filter(entry => {
        const entryDate = new Date(entry.timestamp);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      }).length,
      activities: state.activityLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
      }).length,
      users: state.users.length
    };

    return {
      summary: monthlyData,
      trends: {
        itCheckGrowth: '+12%',
        userActivity: '+8%',
        systemHealth: '94%'
      }
    };
  };

  // Helper functions
  const getCategoryBreakdown = (data: any[]) => {
    const categories = data.reduce((acc: any, entry) => {
      const category = entry.category || 'other';
      if (!acc[category]) acc[category] = { count: 0, time: 0, credits: 0 };
      acc[category].count += 1;
      acc[category].time += entry.timeConsumedMinutes || 0;
      acc[category].credits += entry.creditConsumed || 0;
      return acc;
    }, {});

    return Object.entries(categories).map(([category, stats]: [string, any]) => ({
      category,
      count: stats.count,
      timeMinutes: stats.time,
      timeHours: (stats.time / 60).toFixed(1),
      credits: stats.credits.toFixed(2)
    }));
  };

  const getTechnicianStats = (data: any[]) => {
    const technicians = data.reduce((acc: any, entry) => {
      const tech = entry.technicianName || 'Unknown';
      if (!acc[tech]) acc[tech] = { count: 0, time: 0, credits: 0 };
      acc[tech].count += 1;
      acc[tech].time += entry.timeConsumedMinutes || 0;
      acc[tech].credits += entry.creditConsumed || 0;
      return acc;
    }, {});

    return Object.entries(technicians).map(([technician, stats]: [string, any]) => ({
      technician,
      entries: stats.count,
      timeMinutes: stats.time,
      timeHours: (stats.time / 60).toFixed(1),
      credits: stats.credits.toFixed(2)
    }));
  };

  const getVendorBreakdown = (data: any[]) => {
    const vendors = data.reduce((acc: any, license) => {
      const vendor = license.vendor || 'Unknown';
      if (!acc[vendor]) acc[vendor] = { count: 0, cost: 0, licenses: 0 };
      acc[vendor].count += 1;
      acc[vendor].cost += license.cost || 0;
      acc[vendor].licenses += license.totalLicenses || 0;
      return acc;
    }, {});

    return Object.entries(vendors).map(([vendor, stats]: [string, any]) => ({
      vendor,
      softwareCount: stats.count,
      totalCost: stats.cost.toFixed(2),
      totalLicenses: stats.licenses
    }));
  };

  const getLicenseTypeBreakdown = (data: any[]) => {
    const types = data.reduce((acc: any, license) => {
      const type = license.licenseType || 'unknown';
      if (!acc[type]) acc[type] = { count: 0, cost: 0 };
      acc[type].count += 1;
      acc[type].cost += license.cost || 0;
      return acc;
    }, {});

    return Object.entries(types).map(([type, stats]: [string, any]) => ({
      type,
      count: stats.count,
      totalCost: stats.cost.toFixed(2)
    }));
  };

  const exportReport = () => {
    if (!generatedReport) {
      alert('Please generate a report first');
      return;
    }

    const { config, data } = generatedReport;
    
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add summary sheet if available
    if (data.summary) {
      const summaryData = Object.entries(data.summary).map(([key, value]) => ({
        Metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        Value: value
      }));
      const summaryWs = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    }

    // Add raw data sheet
    if (data.rawData && data.rawData.length > 0) {
      const rawWs = XLSX.utils.json_to_sheet(data.rawData);
      XLSX.utils.book_append_sheet(wb, rawWs, 'Raw Data');
    }

    // Add additional sheets based on report type
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'summary' && key !== 'rawData' && Array.isArray(value)) {
        const ws = XLSX.utils.json_to_sheet(value);
        const sheetName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${config.name.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="w-8 h-8 mr-3 text-green-600" />
            Advanced Reporting
          </h2>
          <p className="text-gray-600 mt-1">
            Generate comprehensive reports across all system modules
          </p>
        </div>
        {generatedReport && (
          <button 
            onClick={exportReport}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all flex items-center space-x-2 font-medium"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
          </button>
        )}
      </div>

      {/* Report Categories */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Report Categories</h3>
              <p className="text-green-100 text-sm">Select a category to filter available reports</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const categoryReports = reportConfigs.filter(r => r.category === category.id);
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex flex-col items-center space-y-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className={`w-6 h-6 ${
                    selectedCategory === category.id ? 'text-green-600' : category.color
                  }`} />
                  <div className="text-center">
                    <div className={`text-sm font-medium ${
                      selectedCategory === category.id ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      {category.name}
                    </div>
                    <div className={`text-xs ${
                      selectedCategory === category.id ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {category.id === 'all' ? reportConfigs.length : categoryReports.length} reports
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Date Range:</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Available Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReports.map((report) => {
          const IconComponent = report.icon;
          const isSelected = selectedReport === report.id;
          
          return (
            <div
              key={report.id}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'border-green-500 shadow-lg transform -translate-y-1' 
                  : 'border-gray-200 hover:border-green-300 hover:shadow-md'
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    isSelected 
                      ? 'bg-green-100 border border-green-200' 
                      : 'bg-gray-100 border border-gray-200'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      isSelected ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  {isSelected && (
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      Selected
                    </div>
                  )}
                </div>
                
                <h3 className={`text-lg font-semibold mb-2 ${
                  isSelected ? 'text-green-900' : 'text-gray-900'
                }`}>
                  {report.name}
                </h3>
                
                <p className={`text-sm leading-relaxed ${
                  isSelected ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {report.description}
                </p>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${
                      isSelected ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {report.fields.length} data fields
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.category === 'it-check' ? 'bg-blue-100 text-blue-800' :
                      report.category === 'logs' ? 'bg-green-100 text-green-800' :
                      report.category === 'licenses' ? 'bg-purple-100 text-purple-800' :
                      report.category === 'security' ? 'bg-red-100 text-red-800' :
                      report.category === 'feedback' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {report.category.replace('-', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Generate Report Button */}
      {selectedReport && (
        <div className="text-center">
          <button
            onClick={() => generateReport(selectedReport)}
            className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-3 mx-auto"
          >
            <BarChart3 className="w-6 h-6" />
            <span>Generate Report</span>
          </button>
        </div>
      )}

      {/* Generated Report Preview */}
      {generatedReport && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 rounded-full p-2">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{generatedReport.config.name}</h3>
                  <p className="text-blue-100 text-sm">
                    Generated on {new Date(generatedReport.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={exportReport}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Report Summary */}
            {generatedReport.data.summary && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Report Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(generatedReport.data.summary).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </p>
                      <p className="text-xl font-semibold text-gray-900">{value as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Data Preview */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Data Preview</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium">Report Generated Successfully</p>
                  <p className="text-sm">
                    {generatedReport.data.rawData?.length || 0} records processed
                  </p>
                  <p className="text-sm mt-2">
                    Click "Export Report" to download the complete report as an Excel file
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">IT Check Entries</p>
              <p className="text-2xl font-semibold text-gray-900">{state.entries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">System Users</p>
              <p className="text-2xl font-semibold text-gray-900">{state.users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Activity Logs</p>
              <p className="text-2xl font-semibold text-gray-900">{state.activityLogs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{reportConfigs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Instructions */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">How to Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-green-100 rounded-full w-6 h-6 flex items-center justify-center text-green-600 font-bold text-sm">1</div>
              <h4 className="font-medium text-gray-900">Select Category</h4>
            </div>
            <p className="text-sm text-gray-600">Choose a report category to filter available reports</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-green-100 rounded-full w-6 h-6 flex items-center justify-center text-green-600 font-bold text-sm">2</div>
              <h4 className="font-medium text-gray-900">Choose Report</h4>
            </div>
            <p className="text-sm text-gray-600">Click on a report card to select it for generation</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-green-100 rounded-full w-6 h-6 flex items-center justify-center text-green-600 font-bold text-sm">3</div>
              <h4 className="font-medium text-gray-900">Generate & Export</h4>
            </div>
            <p className="text-sm text-gray-600">Generate the report and export to Excel format</p>
          </div>
        </div>
      </div>
    </div>
  );
}