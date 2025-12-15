import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Edit, Trash2, Eye, Clock, User, Calendar, Download, History, CreditCard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/api';
import { AddChapmanCGLogModal } from '../../components/AddChapmanCGLogModal';
import { ViewChapmanCGLogModal } from '../../components/ViewChapmanCGLogModal';
import { CreditHistoryModal } from '../../components/CreditHistoryModal';
import { AddCreditBlockModal } from '../../components/AddCreditBlockModal';
import * as XLSX from 'xlsx';

interface ChapmanCGLogEntry {
  id: string;
  idCode: string;
  clientName: string;
  subjectIssue: string;
  category: 'hardware' | 'software' | 'network' | 'support' | 'maintenance' | 'other';
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

interface CreditBlock {
  id: string;
  blockNumber: number;
  startDate: string;
  maxedOutDate?: string;
  renewedDate?: string;
  totalCredits: number;
  creditsUsed: number;
  status: 'active' | 'maxed-out' | 'renewed';
  entries: string[]; // Entry IDs that contributed to this block
}

export function ChapmanCGLogModule() {
  const { state } = useApp();
  const canManage = state.currentUser?.role === 'global-admin' || 
                   (state.currentUser?.role === 'module-admin' && state.currentUser?.modulePermissions?.includes('chapmancg-log'));

  const [logEntries, setLogEntries] = useState<ChapmanCGLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntries();
    loadCreditBlocks();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const entries = await apiClient.getChapmanCGEntries();
      setLogEntries(entries);
    } catch (error) {
      console.error('Error loading ChapmanCG entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCreditBlocks = async () => {
    try {
      const blocks = await apiClient.getCreditBlocks();
      setCreditBlocks(blocks);
    } catch (error) {
      console.error('Error loading credit blocks:', error);
    }
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ChapmanCGLogEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<ChapmanCGLogEntry | null>(null);
  const [showCreditHistory, setShowCreditHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  // Credit blocks state - manually managed
  const [creditBlocks, setCreditBlocks] = useState<CreditBlock[]>([]);
  const [showAddCreditBlock, setShowAddCreditBlock] = useState(false);

  // Calculate totals
  const totalTimeCharge = logEntries.reduce((sum, entry) => sum + entry.timeConsumedMinutes, 0);
  const totalCreditConsumed = logEntries.reduce((sum, entry) => sum + entry.creditConsumed, 0);
  const totalCreditsPurchased = creditBlocks.reduce((sum, block) => sum + block.totalCredits, 0);
  const remainingCredit = totalCreditsPurchased - totalCreditConsumed;

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
        toDate.setHours(23, 59, 59, 999); // Include the entire end date
        matchesDateRange = matchesDateRange && entryDate <= toDate;
      }
    }
    
    return matchesSearch && matchesCategory && matchesClient && matchesTechnician && matchesStatus && matchesDateRange;
  });

  const generateIdCode = (date: Date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Count entries for the same day
    const sameDay = logEntries.filter(entry => {
      const entryDate = new Date(entry.dateStarted);
      return entryDate.toDateString() === date.toDateString();
    });
    
    const sequence = (sameDay.length + 1).toString().padStart(3, '0');
    return `IT${year}${month}${day}${sequence}`;
  };

  const calculateTimeConsumed = (dateStarted: string, timeStarted: string, dateFinished: string, timeFinished: string) => {
    const startDateTime = new Date(`${dateStarted}T${timeStarted}`);
    const endDateTime = new Date(`${dateFinished}T${timeFinished}`);
    const diffMs = endDateTime.getTime() - startDateTime.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60))); // Convert to minutes
  };

  const handleSaveEntry = async (entryData: Omit<ChapmanCGLogEntry, 'id' | 'addedBy' | 'timestamp'>) => {
    try {
      if (editingEntry) {
        await apiClient.updateChapmanCGEntry(editingEntry.id, entryData);
        setEditingEntry(null);
      } else {
        await apiClient.createChapmanCGEntry(entryData);
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
        await apiClient.deleteChapmanCGEntry(id);
        await loadEntries();
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
      }
    }
  };

  const handleAddCreditBlock = async (blockData: Omit<CreditBlock, 'id' | 'addedBy' | 'timestamp'>) => {
    try {
      await apiClient.createCreditBlock(blockData);
      setShowAddCreditBlock(false);
      await loadCreditBlocks();
    } catch (error) {
      console.error('Error adding credit block:', error);
      alert('Failed to add credit block. Please try again.');
    }
  };

  const handleDeleteCreditBlock = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this credit block?')) {
      try {
        await apiClient.deleteCreditBlock(id);
        await loadCreditBlocks();
      } catch (error) {
        console.error('Error deleting credit block:', error);
        alert('Failed to delete credit block. Please try again.');
      }
    }
  };

  const handleViewEntry = (entry: ChapmanCGLogEntry) => {
    setViewingEntry(entry);
  };

  // Get unique values for filter dropdowns
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
    // Prepare data for export
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
      'Credit Consumed': entry.creditConsumed.toFixed(2),
      'Total Credit Consumed': entry.totalCreditConsumed.toFixed(2),
      'Resolution Details': entry.resolutionDetails,
      'Remarks': entry.remarks || 'No remarks',
      'Status': entry.status,
      'Added By': entry.addedBy,
      'Entry Created': new Date(entry.timestamp).toLocaleString()
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // ID Code
      { wch: 20 }, // Client Name
      { wch: 30 }, // Subject Issue
      { wch: 12 }, // Category
      { wch: 12 }, // Date Started
      { wch: 12 }, // Time Started
      { wch: 12 }, // Date Finished
      { wch: 12 }, // Time Finished
      { wch: 18 }, // Technician Name
      { wch: 15 }, // Time Consumed
      { wch: 18 }, // Total Time Charge
      { wch: 15 }, // Credit Consumed
      { wch: 18 }, // Total Credit Consumed
      { wch: 40 }, // Resolution Details
      { wch: 25 }, // Remarks
      { wch: 10 }, // Status
      { wch: 15 }, // Added By
      { wch: 20 }  // Entry Created
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'ChapmanCG Log');

    // Generate filename with current date and filter info
    const currentDate = new Date().toISOString().split('T')[0];
    let filename = `ChapmanCG_Log_${currentDate}`;
    
    // Add filter info to filename if filters are applied
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

    // Save file
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-blue-600" />
            ChapmanCG Log
          </h2>
          <p className="text-gray-600 mt-1">
            Track and manage ChapmanCG client activities and time logs ({logEntries.length} total entries)
          </p>
        </div>
        {canManage && (
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center space-x-2 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Log Entry</span>
            </button>
            <button 
              onClick={() => setShowCreditHistory(true)}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-200 transition-all flex items-center space-x-2 font-medium text-sm"
            >
              <History className="w-4 h-4" />
              <span>Credit History</span>
            </button>
            <button 
              onClick={() => setShowAddCreditBlock(true)}
              className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all flex items-center space-x-2 font-medium text-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>Add Credit Block</span>
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-semibold text-gray-900">{logEntries.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Clock className="w-6 h-6 text-green-600" />
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
              <p className="text-sm font-medium text-gray-600">Credits Consumed</p>
              <p className="text-2xl font-semibold text-gray-900">{totalCreditConsumed.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Remaining Credit</p>
              <p className={`text-2xl font-semibold ${remainingCredit < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {remainingCredit.toFixed(2)}
              </p>
              {remainingCredit < 0 && (
                <p className="text-xs text-red-500 font-medium">Over budget</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-1">
                <Filter className="w-3 h-3 text-white" />
              </div>
              <div>
                <h3 className="text-base font-medium text-white">Filters & Search</h3>
                <p className="text-blue-100 text-xs">Find and filter entries</p>
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

        {/* Filter Content */}
        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by client, issue, technician, ID code, or resolution..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm placeholder-gray-400"
            />
          </div>
          
          {/* Main Filters Row */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Client Name</label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              >
                <option value="all">All Categories</option>
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="network">Network</option>
                <option value="support">Support</option>
                <option value="maintenance">Maintenance</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Technician</label>
              <select
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="done">Done</option>
                <option value="pending">Pending</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>
          
          {/* Date Range and Results Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Date From</label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-700">Date To</label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm text-sm text-gray-900"
              />
            </div>
            
            {/* Results Counter */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg px-4 py-2.5 h-full flex items-center">
                <div className="flex items-center space-x-3 text-blue-700">
                  <div className="bg-blue-100 rounded-full p-1.5">
                    <Filter className="w-3 h-3 text-blue-600" />
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
            
            {/* Export Button */}
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
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
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
                      <div className="font-mono text-sm font-medium text-blue-600">{entry.idCode}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{entry.clientName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{entry.subjectIssue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.category === 'hardware'
                          ? 'bg-blue-100 text-blue-800'
                          : entry.category === 'software'
                          ? 'bg-green-100 text-green-800'
                          : entry.category === 'network'
                          ? 'bg-purple-100 text-purple-800'
                          : entry.category === 'support'
                          ? 'bg-yellow-100 text-yellow-800'
                          : entry.category === 'maintenance'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {entry.category}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{entry.creditConsumed.toFixed(2)}</div>
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
                            // Convert dates to YYYY-MM-DD format before passing to modal
                            const formattedEntry = {
                              ...entry,
                              dateStarted: entry.dateStarted.split('T')[0],
                              dateFinished: entry.dateFinished.split('T')[0],
                            };
                            setEditingEntry(formattedEntry);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
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

      {/* Credit Usage Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Credit Usage Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Time Logged</h4>
            <p className="text-2xl font-bold text-blue-600">{totalTimeCharge} minutes</p>
            <p className="text-sm text-gray-600">{Math.floor(totalTimeCharge / 60)}h {totalTimeCharge % 60}m</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Credits Consumed</h4>
            <p className="text-2xl font-bold text-purple-600">{totalCreditConsumed.toFixed(2)}</p>
            <p className="text-sm text-gray-600">From {Math.ceil(totalCreditConsumed / 100)} blocks</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Current Block Remaining</h4>
            <p className="text-2xl font-bold text-green-600">{remainingCredit.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Out of 100 credits</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showAddModal || editingEntry) && (
        <AddChapmanCGLogModal
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
        <ViewChapmanCGLogModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}

      {showCreditHistory && (
        <CreditHistoryModal
          creditBlocks={creditBlocks}
          logEntries={logEntries}
          onAddBlock={() => setShowAddCreditBlock(true)}
          onDeleteBlock={handleDeleteCreditBlock}
          onClose={() => setShowCreditHistory(false)}
        />
      )}

      {showAddCreditBlock && (
        <AddCreditBlockModal
          existingBlocks={creditBlocks}
          onClose={() => setShowAddCreditBlock(false)}
          onSave={handleAddCreditBlock}
        />
      )}
    </div>
  );
}