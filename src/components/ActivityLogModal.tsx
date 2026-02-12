import React, { useState } from 'react';
import { X, Activity, User, Calendar, Filter, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActivityLog } from '../types';

interface ActivityLogModalProps {
  onClose: () => void;
}

export function ActivityLogModal({ onClose }: ActivityLogModalProps) {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');

  // Filter activity logs
  const filteredLogs = state.activityLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.targetName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesUser = userFilter === 'all' || log.userId === userFilter;
    
    return matchesSearch && matchesAction && matchesUser;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getActionLabel = (action: ActivityLog['action']) => {
    const labels = {
      login: 'Login',
      logout: 'Logout',
      add_entry: 'Add Entry',
      update_entry: 'Update Entry',
      delete_entry: 'Delete Entry',
      add_user: 'Add User',
      update_user: 'Update User',
      delete_user: 'Delete User',
      view_entry: 'View Entry',
      email_entry: 'Email Entry',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: ActivityLog['action']) => {
    const colors = {
      login: 'bg-gradient-to-r from-green-500 to-teal-500 text-white',
      logout: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
      add_entry: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
      update_entry: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
      delete_entry: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      add_user: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      update_user: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white',
      delete_user: 'bg-gradient-to-r from-red-500 to-pink-500 text-white',
      view_entry: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white',
      email_entry: 'bg-gradient-to-r from-green-500 to-teal-500 text-white',
    };
    return colors[action] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const uniqueActions = [...new Set(state.activityLogs.map(log => log.action))];
  const uniqueUsers = Array.from(
        new Map(
          state.activityLogs.map(log => [log.userId, log.userName])
        ).entries()
      ).map(([id, name]) => ({ id, name }));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Activity Log</h2>
                <p className="text-blue-100 mt-1">View system activity and user actions ({state.activityLogs.length} total activities)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1 min-h-0">
          {/* Filters */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-8 border border-gray-200 shadow-inner">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-2">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Filter Activities</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
                />
              </div>
              
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{getActionLabel(action)}</option>
                ))}
              </select>
              
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
              >
                <option value="all">All Users</option>
                {uniqueUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
              
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 bg-white rounded-xl px-4 py-3 border-2 border-gray-200">
                <Filter className="w-4 h-4" />
                <span>{filteredLogs.length} of {state.activityLogs.length} activities</span>
              </div>
            </div>
          </div>

          {/* Activity Log Table */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Activity History ({filteredLogs.length})
                </h3>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 min-h-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Activity className="w-12 h-12 text-gray-300 mb-4" />
                          <p className="text-lg font-medium">No activities found</p>
                          <p className="text-sm">Try adjusting your search or filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-3">
                              <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="font-semibold text-gray-900 text-lg">{log.userName}</div>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getActionColor(log.action)}`}>
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {log.targetName || '-'}
                        </td>
                        <td className="px-8 py-6 text-sm text-gray-900 max-w-xs truncate">
                          {log.details || '-'}
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            <div>
                              <div className="font-medium">{new Date(log.timestamp).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-400">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-6 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}