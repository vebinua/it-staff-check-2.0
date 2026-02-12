import React, { useState } from 'react';
import { Plus, Edit, Trash2, Mail, Search, Filter, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ITCheckEntry } from '../../types';
import { AddEditEntryModal } from '../../components/AddEditEntryModal';
import { EmailModal } from '../../components/EmailModal';
import { ViewDetailsModal } from '../../components/ViewDetailsModal';

export function ITCheckDashboardModule() {
  const { state, deleteEntry, logActivity } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ITCheckEntry | null>(null);
  const [emailEntry, setEmailEntry] = useState<ITCheckEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<ITCheckEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');

  const canManageEntries = state.currentUser?.role === 'global-admin' || 
                           (state.currentUser?.role === 'module-admin' && state.currentUser?.modulePermissions?.includes('it-check-dashboard'));

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CheckCircle className="w-8 h-8 mr-3 text-blue-600" />
            IT Check Dashboard
          </h2>
          <p className="text-gray-600 mt-1">
            Manage and view all staff IT check entries ({state.entries.length} total)
          </p>
        </div>
        {canManageEntries && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center space-x-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add New Entry</span>
          </button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className={`grid grid-cols-1 gap-4 ${
          departmentFilter === 'BLAB' ? 'md:grid-cols-5' : 'md:grid-cols-4'
        }`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, department, or PC model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'passed' | 'failed')}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>
          
          <select
            value={departmentFilter}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          
          {departmentFilter === 'BLAB' && (
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Batches</option>
              {blabBatches.map(batch => (
                <option key={batch} value={batch}>Batch {batch}</option>
              ))}
            </select>
          )}
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>{filteredEntries.length} of {state.entries.length} entries</span>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Computer Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IT Check Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Search className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No entries found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{entry.name}</div>
                      <div className="text-sm text-gray-500">{entry.pcModel}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.computerType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(entry.itCheckCompleted).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{entry.addedBy}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === 'Passed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.status === 'Passed' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(entry)}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canManageEntries && (
                          <>
                            <button
                              onClick={() => setEditingEntry(entry)}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                              title="Edit Entry"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {canManageEntries && (
                          <button
                            onClick={() => handleEmail(entry)}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                            title="Email Details"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddEditEntryModal
          entry={null}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {editingEntry && (
        <AddEditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {viewingEntry && (
        <ViewDetailsModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}

      {emailEntry && (
        <EmailModal
          entry={emailEntry}
          onClose={() => setEmailEntry(null)}
        />
      )}
    </div>
  );
}