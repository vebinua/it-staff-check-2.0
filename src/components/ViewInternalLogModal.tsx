import React from 'react';
import { X, FileText, User, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

interface ViewInternalLogModalProps {
  entry: InternalLogEntry;
  onClose: () => void;
}

export function ViewInternalLogModal({ entry, onClose }: ViewInternalLogModalProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'on-hold':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'on-hold':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'calendar-delegation':
        return 'bg-blue-100 text-blue-800';
      case 'system-optimization':
        return 'bg-green-100 text-green-800';
      case 'security-check':
        return 'bg-purple-100 text-purple-800';
      case 'yammer':
        return 'bg-yellow-100 text-yellow-800';
      case 'password-reset':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-green-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{entry.idCode}</h2>
              <p className="text-sm text-gray-600">{entry.clientName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(entry.status)}`}>
              {getStatusIcon(entry.status)}
              <span className="ml-1 capitalize">{entry.status === 'on-hold' ? 'On Hold' : entry.status}</span>
            </span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600" />
              Basic Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">ID Code</label>
                <p className="text-gray-900 font-mono font-medium">{entry.idCode}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Client Name</label>
                <p className="text-gray-900 font-medium">{entry.clientName}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Subject Issue</label>
                <p className="text-gray-900 mt-1">{entry.subjectIssue}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Category</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getCategoryColor(entry.category)}`}>
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
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Technician</label>
                <p className="text-gray-900 font-medium">{entry.technicianName}</p>
              </div>
            </div>
          </section>

          {/* Time Tracking */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-green-600" />
              Time Tracking
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <h4 className="font-medium text-gray-900">Start Time</h4>
                  </div>
                  <div className="pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Date</label>
                      <p className="text-gray-900">{new Date(entry.dateStarted).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-600">Time</label>
                      <p className="text-gray-900 font-mono">{entry.timeStarted}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <h4 className="font-medium text-gray-900">End Time</h4>
                  </div>
                  <div className="pl-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Date</label>
                      <p className="text-gray-900">{new Date(entry.dateFinished).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-600">Time</label>
                      <p className="text-gray-900 font-mono">{entry.timeFinished}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Calculations */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Time Calculations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <label className="block text-sm font-medium text-gray-600">Time Consumed</label>
                    <p className="text-lg font-semibold text-green-600">{entry.timeConsumedMinutes} min</p>
                    <p className="text-sm text-gray-500">{formatTime(entry.timeConsumedMinutes)}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <label className="block text-sm font-medium text-gray-600">Total Time Charge</label>
                    <p className="text-lg font-semibold text-blue-600">{entry.totalTimeChargeMinutes} min</p>
                    <p className="text-sm text-gray-500">{formatTime(entry.totalTimeChargeMinutes)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Resolution and Status */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Resolution and Status
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Resolution Details</label>
                <div className="mt-2 p-3 bg-white rounded-lg border">
                  <p className="text-gray-900 whitespace-pre-wrap">{entry.resolutionDetails}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(entry.status)}`}>
                    {getStatusIcon(entry.status)}
                    <span className="ml-1 capitalize">{entry.status === 'on-hold' ? 'On Hold' : entry.status}</span>
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Remarks</label>
                  <div className="mt-2 p-3 bg-white rounded-lg border min-h-[60px]">
                    <p className="text-gray-900 whitespace-pre-wrap">{entry.remarks || 'No remarks provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* System Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Added By</label>
                <p className="text-gray-900 font-medium">{entry.addedBy}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Entry Created</label>
                <p className="text-gray-900 font-medium">{new Date(entry.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}