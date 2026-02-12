import React, { useState } from 'react';
import { Plus, Edit, Trash2, Mail, Search, Filter, CheckCircle, XCircle, Eye, Package, Wrench, Key, BarChart3, Shield, TrendingUp, Building2, DollarSign, FileCheck, Scan, ChevronRight, Users, Activity, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ITCheckEntry } from '../types';
import { AddEditEntryModal } from './AddEditEntryModal';
import { EmailModal } from './EmailModal';
import { ViewDetailsModal } from './ViewDetailsModal';
import { ModuleContainer } from './ModuleContainer';
import { AVAILABLE_MODULES, getEnabledModules } from '../modules';

export function Dashboard() {
  const { state, deleteEntry, logActivity } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ITCheckEntry | null>(null);
  const [emailEntry, setEmailEntry] = useState<ITCheckEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<ITCheckEntry | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  const isAdmin = state.currentUser?.role === 'admin';
  const canManageEntries = state.currentUser?.role === 'global-admin' || 
                           (state.currentUser?.role === 'module-admin' && state.currentUser?.modulePermissions?.includes('it-check'));
  const userRole = state.currentUser?.role || 'standard-user';
  const enabledModules = getEnabledModules(userRole, state.currentUser?.modulePermissions);

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  // Calculate analytics data
  const analyticsData = React.useMemo(() => {
    const now = new Date();
    const timeRangeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    }[selectedTimeRange];

    const cutoffDate = new Date(now.getTime() - timeRangeMs);
    const recentEntries = state.entries.filter(entry => new Date(entry.timestamp) >= cutoffDate);
    const recentActivities = state.activities?.filter(activity => new Date(activity.timestamp) >= cutoffDate) || [];

    const itCheckData = {
      total: recentEntries.length,
      passed: recentEntries.filter(e => e.status === 'Passed').length,
      failed: recentEntries.filter(e => e.status === 'Failed').length,
      byDepartment: recentEntries.reduce((acc, entry) => {
        if (!acc[entry.department]) {
          acc[entry.department] = { total: 0, passed: 0, failed: 0 };
        }
        acc[entry.department].total++;
        if (entry.status === 'Passed') {
          acc[entry.department].passed++;
        } else {
          acc[entry.department].failed++;
        }
        return acc;
      }, {} as Record<string, { total: number; passed: number; failed: number }>),
      failureReasons: recentEntries
        .filter(e => e.status === 'Failed' && e.failureReasons)
        .reduce((acc, entry) => {
          entry.failureReasons?.forEach(reason => {
            acc[reason] = (acc[reason] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>)
    };

    const systemHealth = itCheckData.total > 0 ? Math.round((itCheckData.passed / itCheckData.total) * 100) : 100;

    return {
      itCheck: itCheckData,
      system: {
        systemHealth,
        totalUsers: new Set(recentActivities.map(a => a.userId)).size || 1,
        activeModules: enabledModules.length,
      },
      activity: {
        totalActivities: recentActivities.length,
        recentActivities: recentActivities.slice(0, 10)
      }
    };
  }, [state.entries, state.activities, selectedTimeRange, enabledModules]);

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-green-600';
    if (score >= 70) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  // Filter entries based on search term, status, and department
  const filteredEntries = state.entries.filter(entry => {
    const matchesSearch = entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.pcModel.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'passed' && entry.status === 'Passed') ||
                         (statusFilter === 'failed' && entry.status === 'Failed');
    
    const matchesDepartment = departmentFilter === 'all' || entry.department === departmentFilter;
    
    const matchesBatch = batchFilter === 'all' || 
                        (entry.department === 'BLAB' && entry.batchNumber === batchFilter);
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesBatch;
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      deleteEntry(id);
    }
  };

  const handleEmail = (entry: ITCheckEntry) => {
    setEmailEntry(entry);
  };

  const handleView = (entry: ITCheckEntry) => {
    setViewingEntry(entry);
    logActivity('view_entry', entry.id, entry.name, `Viewed IT check entry for ${entry.name} (${entry.department})`);
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentFilter(value);
    // Reset batch filter when switching away from BLAB
    if (value !== 'BLAB') {
      setBatchFilter('all');
    }
  };

  const departments = [...new Set(state.entries.map(entry => entry.department))];
  const blabBatches = [...new Set(state.entries
    .filter(entry => entry.department === 'BLAB' && entry.batchNumber)
    .map(entry => entry.batchNumber!)
  )].sort();

  const getModuleIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      Package, Wrench, Key, BarChart3, Shield, TrendingUp, Building2, DollarSign, FileCheck, Scan
    };
    return icons[iconName] || Package;
  };

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModule(moduleId);
  };

  const handleModuleClose = () => {
    setSelectedModule(null);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">System Modules</h2>
          <p className="text-sm text-gray-600 mt-1">Available features and tools</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {/* Available Modules */}
            {enabledModules.map((module) => {
              const IconComponent = getModuleIcon(module.icon);
              const isSelected = selectedModule === module.id;
              
              return (
                <button
                  key={module.id}
                  onClick={() => handleModuleSelect(module.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{module.name}</div>
                    <div className={`text-sm truncate ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                      {module.description}
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`} />
                </button>
              );
            })}
            
            {/* Coming Soon Modules */}
            {AVAILABLE_MODULES.filter(m => {
              if (m.enabled) return false;
              
              // Global admin can see all coming soon modules
              if (userRole === 'global-admin') return true;
              
              // Module admin can see coming soon modules they might get access to
              if (userRole === 'module-admin') {
                return m.permissions.includes('module-admin');
              }
              
              // Standard users can see coming soon modules available to them
              return m.permissions.includes('standard-user');
            }).map((module) => {
              const IconComponent = getModuleIcon(module.icon);
              
              return (
                <div
                  key={module.id}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-400 cursor-not-allowed opacity-60"
                >
                  <IconComponent className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{module.name}</div>
                    <div className="text-sm truncate">
                      Coming Soon
                    </div>
                  </div>
                  <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Soon
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Render selected module or default dashboard */}
            {selectedModule ? (
              <div>
                {(() => {
                  const module = AVAILABLE_MODULES.find(m => m.id === selectedModule);
                  if (module && module.component) {
                    const ModuleComponent = module.component;
                    return <ModuleComponent />;
                  }
                  return (
                    <div className="text-center py-12">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">Module Not Found</h2>
                      <p className="text-gray-600">The requested module could not be loaded.</p>
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* Analytics Dashboard - Default View */
              <div>
                {analyticsData && (
                  <div className="space-y-6">
                    {/* System Health Overview */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className={`bg-gradient-to-r ${getHealthBgColor(analyticsData.system.systemHealth)} rounded-full p-3`}>
                            <Shield className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-blue-900">System Health Score</h3>
                            <p className="text-blue-700 text-sm">Overall system performance and compliance</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <select
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value)}
                            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            {timeRanges.map(range => (
                              <option key={range.value} value={range.value}>{range.label}</option>
                            ))}
                          </select>
                          <div className="text-right">
                            <div className={`text-4xl font-bold ${getHealthColor(analyticsData.system.systemHealth)}`}>
                              {analyticsData.system.systemHealth}%
                            </div>
                            <p className="text-sm text-blue-700">Health Score</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-600 text-sm font-medium">IT Check Compliance</p>
                              <p className="text-2xl font-bold text-blue-900">
                                {analyticsData.itCheck.total > 0 ? Math.round((analyticsData.itCheck.passed / analyticsData.itCheck.total) * 100) : 0}%
                              </p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-blue-500" />
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-600 text-sm font-medium">Active Users</p>
                              <p className="text-2xl font-bold text-green-900">{analyticsData.system.totalUsers}</p>
                            </div>
                            <Users className="w-8 h-8 text-green-500" />
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-600 text-sm font-medium">Active Modules</p>
                              <p className="text-2xl font-bold text-purple-900">{analyticsData.system.activeModules}</p>
                            </div>
                            <Package className="w-8 h-8 text-purple-500" />
                          </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-600 text-sm font-medium">Total Activities</p>
                              <p className="text-2xl font-bold text-orange-900">{analyticsData.activity.totalActivities}</p>
                            </div>
                            <Activity className="w-8 h-8 text-orange-500" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Key Performance Indicators */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                          Key Performance Indicators
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                              <span className="font-medium">IT Check Pass Rate</span>
                            </div>
                            <span className="text-lg font-bold text-blue-600">
                              {analyticsData.itCheck.total > 0 ? Math.round((analyticsData.itCheck.passed / analyticsData.itCheck.total) * 100) : 0}%
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Activity className="w-5 h-5 text-green-600" />
                              <span className="font-medium">System Activities</span>
                            </div>
                            <span className="text-lg font-bold text-green-600">
                              {analyticsData.activity.totalActivities}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Users className="w-5 h-5 text-purple-600" />
                              <span className="font-medium">Active Users</span>
                            </div>
                            <span className="text-lg font-bold text-purple-600">
                              {analyticsData.system.totalUsers}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Recent Activity Feed */}
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                          Recent System Activity
                        </h3>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {analyticsData.activity.recentActivities.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                              <div className="bg-indigo-100 rounded-full p-2 mt-1">
                                <Activity className="w-4 h-4 text-indigo-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {activity.userName} {activity.action.replace('_', ' ')}
                                  {activity.targetName && ` ${activity.targetName}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </p>
                                {activity.details && (
                                  <p className="text-xs text-gray-600 mt-1 truncate">{activity.details}</p>
                                )}
                              </div>
                            </div>
                          ))}
                          {analyticsData.activity.recentActivities.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm">No recent activity</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Department Performance */}
                    {Object.keys(analyticsData.itCheck.byDepartment).length > 0 && (
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
                        <div className="space-y-3">
                          {Object.entries(analyticsData.itCheck.byDepartment).map(([dept, data]) => (
                            <div key={dept} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 rounded-full p-2">
                                  <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="font-medium text-gray-900">{dept}</span>
                              </div>
                              <div className="flex items-center space-x-4">
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Pass Rate</p>
                                  <p className="font-bold text-gray-900">
                                    {Math.round((data.passed / data.total) * 100)}%
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">Total</p>
                                  <p className="font-bold text-gray-900">{data.total}</p>
                                </div>
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      (data.passed / data.total) >= 0.8 ? 'bg-green-500' :
                                      (data.passed / data.total) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${(data.passed / data.total) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Common Failure Reasons */}
                    {Object.keys(analyticsData.itCheck.failureReasons).length > 0 && (
                      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
                          Common Failure Reasons
                        </h3>
                        <div className="space-y-3">
                          {Object.entries(analyticsData.itCheck.failureReasons)
                            .sort(([,a], [,b]) => b - a)
                            .map(([reason, count]) => (
                              <div key={reason} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                <span className="font-medium text-red-900">{reason}</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-red-600 font-bold">{count}</span>
                                  <span className="text-xs text-red-600">failures</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Modals */}
          </div>
        </div>
      </div>
    </div>
  );
}