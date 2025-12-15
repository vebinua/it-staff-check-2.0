import React, { useState } from 'react';
import { X, Ticket, User, Clock, MessageSquare, Paperclip, Tag, Calendar, ArrowUp, ArrowDown, Minus, Send } from 'lucide-react';
import { Ticket as TicketType, TicketComment, TicketStatus, TicketPriority } from '../types/ticketing';
import { User as UserType } from '../types';

interface ViewTicketModalProps {
  ticket: TicketType;
  comments: TicketComment[];
  onClose: () => void;
  onUpdate: (ticket: TicketType) => void;
  onAddComment: (comment: TicketComment) => void;
  currentUser: UserType;
}

export function ViewTicketModal({ ticket, comments, onClose, onUpdate, onAddComment, currentUser }: ViewTicketModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState(ticket.status);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) return;

    const comment: TicketComment = {
      id: Date.now().toString(),
      ticketId: ticket.id,
      content: newComment,
      isPrivate,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: new Date().toISOString(),
      attachments: []
    };

    onAddComment(comment);
    setNewComment('');
    setIsPrivate(false);
  };

  const handleStatusUpdate = () => {
    const updatedTicket: TicketType = {
      ...ticket,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : ticket.resolvedAt
    };
    
    onUpdate(updatedTicket);
    setEditingStatus(false);
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-2">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{ticket.ticketNumber}</h2>
                <p className="text-indigo-100 text-sm">{ticket.title}</p>
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

        <div className="flex flex-1 min-h-0">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Ticket Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticket.priority)}`}>
                    {getPriorityIcon(ticket.priority)}
                    <span className="ml-1 capitalize">{ticket.priority}</span>
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{ticket.category}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {editingStatus ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                        className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="pending-customer">Pending Customer</option>
                        <option value="pending-internal">Pending Internal</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        onClick={handleStatusUpdate}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingStatus(false)}
                        className="bg-gray-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingStatus(true)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)} hover:opacity-80 transition-opacity`}
                    >
                      {formatStatus(ticket.status)}
                    </button>
                  )}
                </div>
              </div>

              <div className="prose max-w-none">
                <div 
                  className="text-gray-900 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: ticket.description }}
                  style={{
                    lineHeight: '1.6',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                />
              </div>

              {/* Labels */}
              {ticket.labels.length > 0 && (
                <div className="flex items-center space-x-2 mt-4">
                  <Tag className="w-4 h-4 text-gray-400" />
                  {ticket.labels.map(label => (
                    <span
                      key={label}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Ticket Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Created By</label>
                  <p className="text-gray-900 font-medium">{ticket.createdByName}</p>
                  <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Assigned To</label>
                  <p className="text-gray-900 font-medium">{ticket.assignedToName || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900 font-medium">{new Date(ticket.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-indigo-600" />
                Comments ({comments.length})
              </h3>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="mb-3">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 resize-none text-sm"
                    placeholder="Add a comment..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600">Private note (internal only)</span>
                  </label>
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2 text-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Add Comment</span>
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-4 rounded-lg border ${
                      comment.isPrivate 
                        ? 'bg-yellow-50 border-yellow-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{comment.createdByName}</span>
                        {comment.isPrivate && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Private
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-900 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p>No comments yet</p>
                    <p className="text-sm">Be the first to add a comment</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                  {formatStatus(ticket.status)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(ticket.priority)}`}>
                  {getPriorityIcon(ticket.priority)}
                  <span className="ml-1 capitalize">{ticket.priority}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <p className="text-gray-900">{ticket.category}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Assigned To</label>
                <p className="text-gray-900">{ticket.assignedToName || 'Unassigned'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Created By</label>
                <p className="text-gray-900">{ticket.createdByName}</p>
                <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleString()}</p>
              </div>

              {ticket.dueDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Due Date</label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p className="text-gray-900">{new Date(ticket.dueDate).toLocaleDateString()}</p>
                  </div>
                </div>
              )}

              {ticket.labels.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Labels</label>
                  <div className="flex flex-wrap gap-1">
                    {ticket.labels.map(label => (
                      <span
                        key={label}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {ticket.slaBreached && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">SLA Breached</span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">This ticket has exceeded the response time SLA</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}