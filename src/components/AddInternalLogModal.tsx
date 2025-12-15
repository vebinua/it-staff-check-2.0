import React, { useState, useEffect } from 'react';
import { X, Clock, User, FileText, Calendar } from 'lucide-react';

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

interface AddInternalLogModalProps {
  entry: InternalLogEntry | null;
  onClose: () => void;
  onSave: (entry: Omit<InternalLogEntry, 'id' | 'addedBy' | 'timestamp'>) => void;
  existingEntries: InternalLogEntry[];
}

export function AddInternalLogModal({ entry, onClose, onSave, existingEntries }: AddInternalLogModalProps) {
  const isEditing = !!entry;
  
  const [formData, setFormData] = useState({
    clientName: '',
    subjectIssue: '',
    category: 'others' as InternalLogEntry['category'],
    dateStarted: '',
    timeStarted: '',
    dateFinished: '',
    timeFinished: '',
    technicianName: '',
    resolutionDetails: '',
    remarks: '',
    status: 'pending' as 'done' | 'pending' | 'on-hold',
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        clientName: entry.clientName,
        subjectIssue: entry.subjectIssue,
        category: entry.category,
        dateStarted: entry.dateStarted,
        timeStarted: entry.timeStarted,
        dateFinished: entry.dateFinished,
        timeFinished: entry.timeFinished,
        technicianName: entry.technicianName,
        resolutionDetails: entry.resolutionDetails,
        remarks: entry.remarks,
        status: entry.status,
      });
    }
  }, [entry]);

  const generateIdCode = (date: Date) => {
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    const sameDay = existingEntries.filter(existingEntry => {
      const entryDate = new Date(existingEntry.dateStarted);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clientName || !formData.subjectIssue || !formData.dateStarted || 
        !formData.timeStarted || !formData.dateFinished || !formData.timeFinished || 
        !formData.technicianName || !formData.resolutionDetails) {
      alert('Please fill in all required fields');
      return;
    }

    const startDateTime = new Date(`${formData.dateStarted}T${formData.timeStarted}`);
    const endDateTime = new Date(`${formData.dateFinished}T${formData.timeFinished}`);
    
    if (endDateTime <= startDateTime) {
      alert('End date and time must be after start date and time');
      return;
    }

    const timeConsumedMinutes = calculateTimeConsumed(
      formData.dateStarted, 
      formData.timeStarted, 
      formData.dateFinished, 
      formData.timeFinished
    );
    
    const totalTimeChargeMinutes = existingEntries.reduce((sum, entry) => sum + entry.timeConsumedMinutes, 0) + timeConsumedMinutes;
    
    const idCode = isEditing ? entry!.idCode : generateIdCode(new Date(formData.dateStarted));

    const logEntry = {
      idCode,
      clientName: formData.clientName,
      subjectIssue: formData.subjectIssue,
      category: formData.category,
      dateStarted: formData.dateStarted,
      timeStarted: formData.timeStarted,
      dateFinished: formData.dateFinished,
      timeFinished: formData.timeFinished,
      technicianName: formData.technicianName,
      resolutionDetails: formData.resolutionDetails,
      remarks: formData.remarks,
      status: formData.status,
      timeConsumedMinutes,
      totalTimeChargeMinutes,
    };

    onSave(logEntry);
    onClose();
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const previewTimeConsumed = formData.dateStarted && formData.timeStarted && 
                             formData.dateFinished && formData.timeFinished
    ? calculateTimeConsumed(formData.dateStarted, formData.timeStarted, formData.dateFinished, formData.timeFinished)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-2">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {isEditing ? 'Edit Internal Log Entry' : 'Add New Internal Log Entry'}
                </h2>
                <p className="text-green-100 text-sm">Complete the form below to {isEditing ? 'update' : 'create'} an internal log entry</p>
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

        <div className="overflow-y-auto flex-1 min-h-0">
          <form id="log-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Client Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 shadow-md">1</span>
                <span className="text-gray-900">Client Information</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.clientName}
                      onChange={(e) => handleInputChange('clientName', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white text-sm"
                      placeholder="Enter client name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white text-sm"
                    >
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
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject Issue *
                  </label>
                  <textarea
                    required
                    value={formData.subjectIssue}
                    onChange={(e) => handleInputChange('subjectIssue', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white text-sm resize-none"
                    placeholder="Describe the issue or task in detail"
                  />
                </div>
              </div>
            </section>

            {/* Time Tracking */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 shadow-md">2</span>
                <span className="text-gray-900">Time Tracking</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="w-5 h-5 text-green-600" />
                     <h4 className="font-normal text-gray-700">Start Time</h4>
                    </div>
                    <div>
                     <label className="block text-sm font-normal text-gray-600 mb-2">
                        Date Started *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dateStarted}
                        onChange={(e) => handleInputChange('dateStarted', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      />
                    </div>
                    <div>
                     <label className="block text-sm font-normal text-gray-600 mb-2">
                        Time Started *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.timeStarted}
                        onChange={(e) => handleInputChange('timeStarted', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="w-5 h-5 text-red-600" />
                     <h4 className="font-normal text-gray-700">End Time</h4>
                    </div>
                    <div>
                     <label className="block text-sm font-normal text-gray-600 mb-2">
                        Date Finished *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dateFinished}
                        onChange={(e) => handleInputChange('dateFinished', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      />
                    </div>
                    <div>
                     <label className="block text-sm font-normal text-gray-600 mb-2">
                        Time Finished *
                      </label>
                      <input
                        type="time"
                        required
                        value={formData.timeFinished}
                        onChange={(e) => handleInputChange('timeFinished', e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white shadow-sm"
                      />
                    </div>
                  </div>
                </div>
                {previewTimeConsumed > 0 && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
                    <h4 className="font-medium text-green-900 mb-2 text-sm">Time Calculation Preview</h4>
                    <div className="text-sm">
                      <span className="text-green-700">Time Consumed:</span>
                      <span className="ml-2 font-medium text-green-900">
                        {Math.floor(previewTimeConsumed / 60)}h {previewTimeConsumed % 60}m ({previewTimeConsumed} minutes)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Technician Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 shadow-md">3</span>
                <span className="text-gray-900">Technician Information</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technician's Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.technicianName}
                    onChange={(e) => handleInputChange('technicianName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white text-sm"
                    placeholder="Enter technician's full name"
                  />
                </div>
              </div>
            </section>

            {/* Resolution and Status */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 shadow-md">4</span>
                <span className="text-gray-900">Resolution and Status</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution Details *
                  </label>
                  <textarea
                    required
                    value={formData.resolutionDetails}
                    onChange={(e) => handleInputChange('resolutionDetails', e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white text-sm resize-none"
                    placeholder="Describe how the issue was resolved or what actions were taken"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white text-sm"
                    >
                      <option value="pending">Pending</option>
                      <option value="on-hold">On Hold</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => handleInputChange('remarks', e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white text-sm resize-none"
                      placeholder="Additional remarks or notes (optional)"
                    />
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="log-form"
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isEditing ? 'Update Entry' : 'Create Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}