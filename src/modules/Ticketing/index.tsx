import React, { useState, useEffect } from 'react';
import { 
  Ticket, Plus, Search, Filter, Eye, Edit, Trash2, MessageSquare, 
  Paperclip, Clock, AlertTriangle, CheckCircle, User, Calendar,
  Tag, ArrowUp, ArrowDown, Minus, BarChart3, Users, FileText,
  Settings, Star, Archive, RefreshCw, Send, ChevronDown, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/api';
import { 
  Ticket as TicketType, 
  TicketComment, 
  TicketStats, 
  TicketStatus, 
  TicketPriority,
  TICKET_CATEGORIES,
  TICKET_LABELS 
} from '../../types/ticketing';
import { CreateTicketModal } from '../../components/CreateTicketModal';
import { ViewTicketModal } from '../../components/ViewTicketModal';

export function TicketingModule() {
  const { state } = useApp();
  const canManage = state.currentUser?.role === 'global-admin' || 
                   (state.currentUser?.role === 'module-admin' && state.currentUser?.modulePermissions?.includes('ticketing-system'));

  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<TicketType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'inbox' | 'my-tickets' | 'unassigned' | 'overdue'>('inbox');

  useEffect(() => {
    loadTickets();
  }, []);

  // 2. Fix loadTickets — NEVER let tickets be undefined
const loadTickets = async () => {
  try {
    setLoading(true);
    const data = await apiClient.getTickets();
    // ← CRITICAL: always set an array, even if API returns null/undefined
    setTickets(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Error loading tickets:', error);
    setTickets([]); // ← never leave it undefined
    alert('Failed to load tickets. Please refresh.');
  } finally {
    setLoading(false);
  }
};

  // Filter tickets based on current filters
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'all' || ticket.assignedTo === assigneeFilter;
    
    // View-specific filtering
    let matchesView = true;
    switch (selectedView) {
      case 'my-tickets':
        matchesView = ticket.assignedTo === state.currentUser?.id;
        break;
      case 'unassigned':
        matchesView = !ticket.assignedTo;
        break;
      case 'overdue':
        matchesView = ticket.slaBreached;
        break;
      default:
        matchesView = true;
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesView;
  });

  // Calculate stats
  const stats: TicketStats = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    inProgressTickets: tickets.filter(t => t.status === 'in-progress').length,
    resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
    overdueTickets: tickets.filter(t => t.slaBreached).length,
    slaBreachedTickets: tickets.filter(t => t.slaBreached).length,
    avgResponseTime: 45, // Mock data
    avgResolutionTime: 180, // Mock data
    ticketsByPriority: {
      low: tickets.filter(t => t.priority === 'low').length,
      medium: tickets.filter(t => t.priority === 'medium').length,
      high: tickets.filter(t => t.priority === 'high').length,
      urgent: tickets.filter(t => t.priority === 'urgent').length,
    },
    ticketsByStatus: {
      open: tickets.filter(t => t.status === 'open').length,
      'in-progress': tickets.filter(t => t.status === 'in-progress').length,
      'pending-customer': tickets.filter(t => t.status === 'pending-customer').length,
      'pending-internal': tickets.filter(t => t.status === 'pending-internal').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      cancelled: tickets.filter(t => t.status === 'cancelled').length,
    },
    recentActivity: [] // Mock data
  };

  const handleCreateTicket = async (ticketData: Omit<TicketType, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => {
    try {
      await apiClient.createTicket(ticketData);
      setShowCreateModal(false);
      await loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    }
  };

  const handleViewTicket = (ticket: TicketType) => {
    setViewingTicket(ticket);
  };

  const getPriorityIcon = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return <ArrowUp className="w-4 h-4 text-red-600" />;
      case 'high':
        return <ArrowUp className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <Minus className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <ArrowDown className="w-4 h-4 text-green-600" />;
    }
  };

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'pending-customer':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending-internal':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
    }
  };

  const formatStatus = (status: TicketStatus) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const views = [
    { id: 'inbox', name: 'All Tickets', count: tickets.length },
    { id: 'my-tickets', name: 'My Tickets', count: tickets.filter(t => t.assignedTo === state.currentUser?.id).length },
    { id: 'unassigned', name: 'Unassigned', count: tickets.filter(t => !t.assignedTo).length },
    { id: 'overdue', name: 'Overdue', count: tickets.filter(t => t.slaBreached).length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Ticket className="w-8 h-8 mr-3 text-indigo-600" />
            Ticketing System
          </h2>
          <p className="text-gray-600 mt-1">
            Comprehensive help desk and ticket management system ({stats.totalTickets} total tickets)
          </p>
        </div>
        {canManage && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition-all flex items-center space-x-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Create Ticket</span>
          </button>
        )}
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Ticket className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.openTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.inProgressTickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdueTickets}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Views */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Views</h3>
            <div className="space-y-2">
              {views.map(view => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    selectedView === view.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{view.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedView === view.id
                      ? 'bg-indigo-200 text-indigo-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {view.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Ticket List */}
        <div className="lg:col-span-3">
          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="pending-customer">Pending Customer</option>
                <option value="pending-internal">Pending Internal</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>{filteredTickets.length} tickets</span>
              </div>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredTickets.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium">No tickets found</p>
                <p className="text-sm">Try adjusting your filters or create a new ticket</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewTicket(ticket)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-sm text-indigo-600 font-medium">
                            {ticket.ticketNumber}
                          </span>
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                            {getPriorityIcon(ticket.priority)}
                            <span className="ml-1 capitalize">{ticket.priority}</span>
                          </div>
                          {ticket.slaBreached && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              SLA Breached
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                          {ticket.title}
                        </h3>
                        
                        <div 
                          className="text-gray-600 text-sm mb-3 line-clamp-2 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: ticket.description }}
                          style={{
                            lineHeight: '1.4',
                            fontFamily: 'system-ui, -apple-system, sans-serif'
                          }}
                        />
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            <span>{ticket.createdByName}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                          </div>
                          {ticket.assignedToName && (
                            <div className="flex items-center">
                              <span>Assigned to: {ticket.assignedToName}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Tag className="w-4 h-4 mr-1" />
                            <span>{ticket.category}</span>
                          </div>
                        </div>
                        
                        {Array.isArray(ticket.labels) && ticket.labels.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
                          {ticket.labels.map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2 ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                          {formatStatus(ticket.status)}
                        </span>
                        
                        <div className="flex items-center space-x-2 text-gray-400">
                          {/* Attachments */}
                          {Array.isArray(ticket.attachments) && ticket.attachments.length > 0 && (
                            <div className="flex items-center">
                              <Paperclip className="w-4 h-4 mr-1" />
                              <span className="text-xs">{ticket.attachments.length}</span>
                            </div>
                          )}

                          {/* Comments */}
                          {comments.filter(c => c.ticketId === ticket.id).length > 0 && (
                            <div className="flex items-center">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              <span className="text-xs">{comments.filter(c => c.ticketId === ticket.id).length}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTicket}
          currentUser={state.currentUser!}
        />
      )}

      {viewingTicket && (
        <ViewTicketModal
          ticket={viewingTicket}
          comments={comments.filter(c => c.ticketId === viewingTicket.id)}
          onClose={() => setViewingTicket(null)}
          onUpdate={(updatedTicket) => {
            setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
            setViewingTicket(updatedTicket);
          }}
          onAddComment={(comment) => {
            setComments(prev => [...prev, comment]);
          }}
          currentUser={state.currentUser!}
        />
      )}
    </div>
  );
}