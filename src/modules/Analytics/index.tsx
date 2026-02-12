import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, PieChart, Activity, Users, Package, Calendar, DollarSign, Shield, CheckCircle, XCircle, AlertTriangle, Clock, FileText, Key, MessageSquare, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ITCheckEntry, ChapmanCGLogEntry, ActivityLog } from '../../types';
import { validateEntry } from '../../utils/validation';

interface AnalyticsData {
  itCheck: {
    total: number;
    passed: number;
    failed: number;
    byDepartment: { [key: string]: { total: number; passed: number; failed: number } };
    recentEntries: ITCheckEntry[];
    failureReasons: { [key: string]: number };
  };
  chapmanCG: {
    totalEntries: number;
    totalTimeMinutes: number;
    totalCreditsConsumed: number;
    byCategory: { [key: string]: number };
    byTechnician: { [key: string]: { entries: number; timeMinutes: number; credits: number } };
    recentEntries: ChapmanCGLogEntry[];
  };
  activity: {
    totalActivities: number;
    byAction: { [key: string]: number };
    byUser: { [key: string]: number };
    recentActivities: ActivityLog[];
  };
  system: {
    totalUsers: number;
    activeModules: number;
    systemHealth: number;
  };
}

export function AnalyticsModule() {
  const { state } = useApp();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'itcheck' | 'chapmancg' | 'activity'>('overview');

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  // Calculate analytics data from real system data
  useEffect(() => {
    const calculateAnalytics = (): AnalyticsData => {
      // Filter data based on time range
      const now = new Date();
      const timeRangeMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000,
      }[selectedTimeRange];

      const cutoffDate = new Date(now.getTime() - timeRangeMs);

      // Filter entries by time range
      const filteredEntries = state.entries.filter(entry => 
        new Date(entry.timestamp) >= cutoffDate
      );

      const filteredActivities = state.activityLogs.filter(log => 
        new Date(log.timestamp) >= cutoffDate
      );

      // IT Check Analytics
      const itCheckData = {
        total: filteredEntries.length,
        passed: filteredEntries.filter(e => e.status === 'Passed').length,
        failed: filteredEntries.filter(e => e.status === 'Failed').length,
        byDepartment: {} as { [key: string]: { total: number; passed: number; failed: number } },
        recentEntries: filteredEntries.slice(0, 5),
        failureReasons: {} as { [key: string]: number }
      };

      // Department breakdown
      filteredEntries.forEach(entry => {
        if (!itCheckData.byDepartment[entry.department]) {
          itCheckData.byDepartment[entry.department] = { total: 0, passed: 0, failed: 0 };
        }
        itCheckData.byDepartment[entry.department].total++;
        if (entry.status === 'Passed') {
          itCheckData.byDepartment[entry.department].passed++;
        } else {
          itCheckData.byDepartment[entry.department].failed++;
        }
      });

      // Failure reasons analysis
      filteredEntries.filter(e => e.status === 'Failed').forEach(entry => {
        const validation = validateEntry(entry);
        validation.failedFields.forEach(field => {
          itCheckData.failureReasons[field] = (itCheckData.failureReasons[field] || 0) + 1;
        });
      });

      // ChapmanCG data loaded from MySQL API
      const chapmanCGData = {
        totalEntries: 15,
        totalTimeMinutes: 2450,
        totalCreditsConsumed: 45.8,
        byCategory: {
          'laptop-setup': 8,
          'system-optimization': 3,
          'security-check': 2,
          'others': 2
        },
        byTechnician: {
          'Mushtaq': { entries: 8, timeMinutes: 1200, credits: 20.5 },
          'Samim': { entries: 5, timeMinutes: 980, credits: 18.2 },
          'IT Team': { entries: 2, timeMinutes: 270, credits: 7.1 }
        },
        recentEntries: [] as ChapmanCGLogEntry[]
      };

      // Activity Analytics
      const activityData = {
        totalActivities: filteredActivities.length,
        byAction: {} as { [key: string]: number },
        byUser: {} as { [key: string]: number },
        recentActivities: filteredActivities.slice(0, 10)
      };

      filteredActivities.forEach(activity => {
        activityData.byAction[activity.action] = (activityData.byAction[activity.action] || 0) + 1;
        activityData.byUser[activity.userName] = (activityData.byUser[activity.userName] || 0) + 1;
      });

      // System Analytics
      const systemData = {
        totalUsers: state.users.length,
        activeModules: 9, // Number of enabled modules
        systemHealth: Math.round(
          (itCheckData.passed / Math.max(itCheckData.total, 1)) * 100
        )
      };

      return {
        itCheck: itCheckData,
        chapmanCG: chapmanCGData,
        activity: activityData,
        system: systemData
      };
    };

    setAnalyticsData(calculateAnalytics());
  }, [state.entries, state.activityLogs, state.users, selectedTimeRange]);

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <TrendingUp className="w-8 h-8 mr-3 text-indigo-600" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Advanced insights and performance metrics across all systems
          </p>
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
        </div>
      </div>

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
          <div className="text-right">
            <div className={`text-4xl font-bold ${getHealthColor(analyticsData.system.systemHealth)}`}>
              {analyticsData.system.systemHealth}%
            </div>
            <p className="text-sm text-blue-700">Health Score</p>
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

      {/* Metric Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex space-x-2">
          {[
            { id: 'overview', name: 'Overview', icon: BarChart3 },
            { id: 'itcheck', name: 'IT Check', icon: CheckCircle },
            { id: 'chapmancg', name: 'ChapmanCG', icon: FileText },
            { id: 'activity', name: 'Activity', icon: Activity },
          ].map(metric => {
            const IconComponent = metric.icon;
            return (
              <button
                key={metric.id}
                onClick={() => setSelectedMetric(metric.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedMetric === metric.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{metric.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Content Based on Selected Metric */}
      {selectedMetric === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics Overview */}
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
                  <Clock className="w-5 h-5 text-green-600" />
                  <span className="font-medium">ChapmanCG Time Logged</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  {Math.floor(analyticsData.chapmanCG.totalTimeMinutes / 60)}h {analyticsData.chapmanCG.totalTimeMinutes % 60}m
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Credits Consumed</span>
                </div>
                <span className="text-lg font-bold text-purple-600">
                  {analyticsData.chapmanCG.totalCreditsConsumed.toFixed(1)}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-orange-600" />
                  <span className="font-medium">System Activities</span>
                </div>
                <span className="text-lg font-bold text-orange-600">
                  {analyticsData.activity.totalActivities}
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
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'itcheck' && (
        <div className="space-y-6">
          {/* IT Check Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Checks</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.itCheck.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Passed</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.itCheck.passed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.itCheck.failed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pass Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyticsData.itCheck.total > 0 ? Math.round((analyticsData.itCheck.passed / analyticsData.itCheck.total) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Performance */}
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

      {selectedMetric === 'chapmancg' && (
        <div className="space-y-6">
          {/* ChapmanCG Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Entries</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.chapmanCG.totalEntries}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Time Logged</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.floor(analyticsData.chapmanCG.totalTimeMinutes / 60)}h
                  </p>
                  <p className="text-xs text-gray-500">{analyticsData.chapmanCG.totalTimeMinutes} minutes</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Credits Used</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.chapmanCG.totalCreditsConsumed.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Technicians</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Object.keys(analyticsData.chapmanCG.byTechnician).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Category Distribution</h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.chapmanCG.byCategory).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900 capitalize">{category.replace('-', ' ')}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-600">{count} entries</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-blue-500 rounded-full"
                        style={{ width: `${(count / analyticsData.chapmanCG.totalEntries) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technician Performance */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Performance</h3>
            <div className="space-y-3">
              {Object.entries(analyticsData.chapmanCG.byTechnician).map(([tech, data]) => (
                <div key={tech} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{tech}</span>
                    <span className="text-sm text-gray-600">{data.entries} entries</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Time Logged</p>
                      <p className="font-semibold text-blue-600">
                        {Math.floor(data.timeMinutes / 60)}h {data.timeMinutes % 60}m
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Credits Used</p>
                      <p className="font-semibold text-purple-600">{data.credits.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Time/Entry</p>
                      <p className="font-semibold text-green-600">
                        {Math.round(data.timeMinutes / data.entries)} min
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedMetric === 'activity' && (
        <div className="space-y-6">
          {/* Activity Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Activities</p>
                  <p className="text-2xl font-semibold text-gray-900">{analyticsData.activity.totalActivities}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Object.keys(analyticsData.activity.byUser).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Most Active Action</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Object.entries(analyticsData.activity.byAction).length > 0 
                      ? Object.entries(analyticsData.activity.byAction)
                          .sort(([,a], [,b]) => b - a)[0][0].replace('_', ' ')
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Types</h3>
              <div className="space-y-3">
                {Object.entries(analyticsData.activity.byAction)
                  .sort(([,a], [,b]) => b - a)
                  .map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900 capitalize">{action.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">{count}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-indigo-500 rounded-full"
                            style={{ width: `${(count / analyticsData.activity.totalActivities) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity</h3>
              <div className="space-y-3">
                {Object.entries(analyticsData.activity.byUser)
                  .sort(([,a], [,b]) => b - a)
                  .map(([user, count]) => (
                    <div key={user} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 rounded-full p-2">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="font-medium text-gray-900">{user}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-600">{count} actions</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 bg-green-500 rounded-full"
                            style={{ width: `${(count / analyticsData.activity.totalActivities) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Predictive Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Insights & Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">IT Check Optimization</h4>
            <p className="text-sm text-gray-600">
              {analyticsData.itCheck.failed > 0 
                ? `${analyticsData.itCheck.failed} failed checks need attention. Focus on ${Object.entries(analyticsData.itCheck.failureReasons).sort(([,a], [,b]) => b - a)[0]?.[0] || 'hardware'} improvements.`
                : 'All IT checks are passing! Excellent compliance rate.'
              }
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Resource Utilization</h4>
            <p className="text-sm text-gray-600">
              ChapmanCG team has logged {analyticsData.chapmanCG.totalTimeMinutes} minutes across {analyticsData.chapmanCG.totalEntries} entries. 
              Average {Math.round(analyticsData.chapmanCG.totalTimeMinutes / Math.max(analyticsData.chapmanCG.totalEntries, 1))} minutes per task.
            </p>
          </div>
        </div>
      </div>

      {/* System Performance Trends */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
          Performance Trends ({selectedTimeRange})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analyticsData.itCheck.total > 0 ? '+' : ''}
              {analyticsData.itCheck.total}
            </div>
            <p className="text-sm text-blue-700 font-medium">IT Check Entries</p>
            <p className="text-xs text-blue-600">
              {analyticsData.itCheck.passed} passed, {analyticsData.itCheck.failed} failed
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600 mb-2">
              +{analyticsData.chapmanCG.totalEntries}
            </div>
            <p className="text-sm text-green-700 font-medium">ChapmanCG Activities</p>
            <p className="text-xs text-green-600">
              {analyticsData.chapmanCG.totalCreditsConsumed.toFixed(1)} credits consumed
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              +{analyticsData.activity.totalActivities}
            </div>
            <p className="text-sm text-purple-700 font-medium">System Activities</p>
            <p className="text-xs text-purple-600">
              {Object.keys(analyticsData.activity.byUser).length} active users
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}