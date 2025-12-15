import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Edit, Trash2, Eye, Clock, User, Calendar, Download } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/api';
import { AddInternalLogModal } from '../../components/AddInternalLogModal';
import { ViewInternalLogModal } from '../../components/ViewInternalLogModal';
import * as XLSX from 'xlsx';

interface InternalLogEntry {
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
  addedBy: string;
  timestamp: string;
}

export function InternalLogModule() {
  const { state } = useApp();
  const canManage = state.currentUser?.role === 'global-admin' || 
                   (state.currentUser?.role === 'module-admin' && state.currentUser?.modulePermissions?.includes('internal-log'));

  const [logEntries, setLogEntries] = useState<InternalLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const entries = await apiClient.getInternalLogEntries();
      setLogEntries(entries);
    } catch (error) {
      console.error('Error loading internal log entries:', error);
    } finally {
      setLoading(false);
    }
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InternalLogEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<InternalLogEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  // Calculate totals
  const totalTimeCharge = logEntries.reduce((sum, entry) => sum + entry.timeConsumedMinutes, 0);

  const filteredEntries = logEntries.filter(entry => {
    const matchesSearch = entry.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.subjectIssue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.technicianName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.idCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.resolutionDetails.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
    const matchesClient = clientFilter === 'all' || entry.clientName === clientFilter;
    const matchesTechnician = technicianFilter === 'all' || entry.technicianName === technicianFilter;
    const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
    
    // Date range filter
    let matchesDateRange = true;
    if (dateFromFilter || dateToFilter) {
      const entryDate = new Date(entry.dateStarted);
      if (dateFromFilter) {
        const fromDate = new Date(dateFromFilter);
        matchesDateRange = matchesDateRange && entryDate >= fromDate;
      }
      if (dateToFilter) {
        const toDate = new Date(dateToFilter);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && entryDate <= toDate;
      }
    }
    
    return matchesSearch && matchesCategory && matchesClient && matchesTechnician && matchesStatus && matchesDateRange;
  });

  const generateIdCode = (date: Date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const sameDay = logEntries.filter(entry => {
      const entryDate = new Date(entry.dateStarted);
      return entryDate.toDateString() === date.toDateString();
    });
    
    const sequence = (sameDay.length + 1).toString().padStart(3, '0');
    return `INT${year}${month}${day}${sequence}`;
  };

  const calculateTimeConsumed = (dateStarted: string, timeStarted: string, dateFinished: string, timeFinished: string) => {
    const startDateTime = new Date(`${dateStarted}T${timeStarted}`);
    const endDateTime = new Date(`${dateFinished}T${timeFinished}`);
    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60)));
  };

  const handleSaveEntry = async (entryData: Omit<InternalLogEntry, 'id' | 'addedBy' | 'timestamp'>) => {
    try {
      if (editingEntry) {
        await apiClient.updateInternalLogEntry(editingEntry.id, entryData);
        setEditingEntry(null);
      } else {
        await apiClient.createInternalLogEntry(entryData);
        setShowAddModal(false);
      }
      await loadEntries();
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      try {
        await apiClient.deleteInternalLogEntry(id);
        await loadEntries();
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
      }
    }
  };

  const handleViewEntry = (entry: InternalLogEntry) => {
    setViewingEntry(entry);
  };

  const uniqueClients = [...new Set(logEntries.map(entry => entry.clientName))].sort();
  const uniqueTechnicians = [...new Set(logEntries.map(entry => entry.technicianName))].sort();

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setClientFilter('all');
    setTechnicianFilter('all');
    setStatusFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const exportToExcel = () => {
    const exportData = filteredEntries.map(entry => ({
      'ID Code': entry.idCode,
      'Client Name': entry.clientName,
      'Subject Issue': entry.subjectIssue,
      'Category': entry.category,
      'Date Started': entry.dateStarted,
      'Time Started': entry.timeStarted,
      'Date Finished': entry.dateFinished,
      'Time Finished': entry.timeFinished,
      'Technician Name': entry.technicianName,
      'Time Consumed (Minutes)': entry.timeConsumedMinutes,
      'Total Time Charge (Minutes)': entry.totalTimeChargeMinutes,
      'Resolution Details': entry.resolutionDetails,
      'Remarks': entry.remarks || 'No remarks',
      'Status': entry.status,
      'Added By': entry.addedBy,
      'Entry Created': new Date(entry.timestamp).toLocaleString()
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    const colWidths = [
      { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 18 }, { wch: 40 },
      { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 20 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Internal Log');

    const currentDate = new Date().toISOString().split('T')[0];
    let filename = `Internal_Log_${currentDate}`;
    
    const activeFilters = [];
    if (clientFilter !== 'all') activeFilters.push(`Client-${clientFilter}`);
    if (categoryFilter !== 'all') activeFilters.push(`Category-${categoryFilter}`);
    if (technicianFilter !== 'all') activeFilters.push(`Tech-${technicianFilter}`);
    if (statusFilter !== 'all') activeFilters.push(`Status-${statusFilter}`);
    if (dateFromFilter || dateToFilter) {
      const dateRange = `${dateFromFilter || 'start'}_to_${dateToFilter || 'end'}`;
      activeFilters.push(`DateRange-${dateRange}`);
    }
    
    if (activeFilters.length > 0) {
      filename += `_Filtered_${activeFilters.join('_')}`;
    }
    
    filename += '.xlsx';

    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-green-600" />
            Internal Log
          </h2>
          <p className="text-gray-600 mt-1">
            Track internal activities and time logs ({logEntries.length} total entries)
          </p>
        </div>
        {canManage && (
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all flex items-center space-x-2 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Log Entry</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-semibold text-gray-900">{logEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Time (Minutes)</p>
              <p className="text-2xl font-semibold text-gray-900">{totalTimeCharge}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <User className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Entries</p>
              <p className="text-2xl font-semibold text-gray-900">
                {logEntries.filter(e => e.status === 'done').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-1">
                <Filter className="w-3 h-3 text-white" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">Filters & Search</h3>
                <p className="text-green-100 text-xs">Find and filter entries</p>
              </div>
            </div>
            <button
              onClick={clearFilters}
              className="bg-white/20 hover:bg-white/30 text-white px-2 py-1 rounded-md font-medium transition-all duration-200 text-xs"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by client, issue, technician, ID code, or resolution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm text-sm placeholder-gray-400"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Client Name</label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              >
                <option value="all">All Clients</option>
                {uniqueClients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              >
                <option value="all">All Categories</option>
                <option value="calendar-delegation">Calendar Delegation</option>
                <option value="system-optimization">System Optimization</option>
                <option value="security-check">Security Check</option>
                <option value="yammer">Yammer</option>
                <option value="password-reset">Password Reset</option>
                <option value="account-setup">Account Setup</option>
                <option value="mailbox-delegation">Mailbox Delegation</option>
                <option value="invenias">Invenias</option>
                <option value="signature-setup">Signature Set Up</option>
                <option value="account-closure">Account Closure</option>
                <option value="outlook">Outlook</option>
                <option value="laptop-setup">Laptop Setup</option>
                <option value="software-application">Software/Application</option>
                <option value="dropbox">Dropbox</option>
                <option value="others">Others</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Technician</label>
              <select
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              >
                <option value="all">All Technicians</option>
                {uniqueTechnicians.map(tech => (
                  <option key={tech} value={tech}>{tech}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="done">Done</option>
                <option value="pending">Pending</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Date From</label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Date To</label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              />
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg px-4 py-2.5 h-full flex items-center">
                <div className="flex items-center space-x-3 text-green-700">
                  <div className="bg-green-100 rounded-full p-1.5">
                    <Filter className="w-3 h-3 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      Showing {filteredEntries.length} of {logEntries.length} entries
                    </p>
                    {filteredEntries.length !== logEntries.length && (
                      <p className="text-xs text-green-600 font-medium">
                        Ready to export {filteredEntries.length} filtered entries
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <button 
                onClick={exportToExcel}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
                title={`Export ${filteredEntries.length} entries to Excel`}
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject Issue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time (Min)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <FileText className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No log entries found</p>
                      <p className="text-sm">Start by adding your first log entry</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm font-medium text-green-600">{entry.idCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{entry.clientName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{entry.subjectIssue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.category === 'calendar-delegation'
                          ? 'bg-blue-100 text-blue-800'
                          : entry.category === 'system-optimization'
                          ? 'bg-green-100 text-green-800'
                          : entry.category === 'security-check'
                          ? 'bg-purple-100 text-purple-800'
                          : entry.category === 'yammer'
                          ? 'bg-yellow-100 text-yellow-800'
                          : entry.category === 'password-reset'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.category === 'calendar-delegation' ? 'Calendar Delegation'
                          : entry.category === 'system-optimization' ? 'System Optimization'
                          : entry.category === 'security-check' ? 'Security Check'
                          : entry.category === 'yammer' ? 'Yammer'
                          : entry.category === 'password-reset' ? 'Password Reset'
                          : entry.category === 'account-setup' ? 'Account Setup'
                          : entry.category === 'mailbox-delegation' ? 'Mailbox Delegation'
                          : entry.category === 'invenias' ? 'Invenias'
                          : entry.category === 'signature-setup' ? 'Signature Set Up'
                          : entry.category === 'account-closure' ? 'Account Closure'
                          : entry.category === 'outlook' ? 'Outlook'
                          : entry.category === 'laptop-setup' ? 'Laptop Setup'
                          : entry.category === 'software-application' ? 'Software/Application'
                          : entry.category === 'dropbox' ? 'Dropbox'
                          : entry.category === 'others' ? 'Others'
                          : entry.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Start: {entry.dateStarted} {entry.timeStarted}</div>
                      <div>End: {entry.dateFinished} {entry.timeFinished}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.technicianName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === 'done'
                          ? 'bg-green-100 text-green-800'
                          : entry.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.status === 'done' ? 'Done' : entry.status === 'pending' ? 'Pending' : 'On Hold'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{entry.timeConsumedMinutes}</div>
                      <div className="text-xs text-gray-500">
                        {Math.floor(entry.timeConsumedMinutes / 60)}h {entry.timeConsumedMinutes % 60}m
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewEntry(entry)}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingEntry({
                              ...entry,
                              dateStarted: entry.dateStarted.split('T')[0],
                              dateFinished: entry.dateFinished.split('T')[0],
                            });
                          }}
                          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Edit Entry"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Time Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Time Logged</h4>
            <p className="text-2xl font-bold text-green-600">{totalTimeCharge} minutes</p>
            <p className="text-sm text-gray-600">{Math.floor(totalTimeCharge / 60)}h {totalTimeCharge % 60}m</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Completed Tasks</h4>
            <p className="text-2xl font-bold text-blue-600">{logEntries.filter(e => e.status === 'done').length}</p>
            <p className="text-sm text-gray-600">Out of {logEntries.length} total entries</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showAddModal || editingEntry) && (
        <AddInternalLogModal
          entry={editingEntry}
          onClose={() => {
            setShowAddModal(false);
            setEditingEntry(null);
          }}
          onSave={handleSaveEntry}
          existingEntries={logEntries}
        />
      )}

      {viewingEntry && (
        <ViewInternalLogModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}
    </div>
  );
}