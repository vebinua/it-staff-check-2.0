import React, { useState } from 'react';
import { X, Ticket, User, AlertTriangle, ArrowUp, ArrowDown, Minus, Paperclip, Image, Bold, Italic, Underline, List, Link2, Trash2, Type } from 'lucide-react';
import { Ticket as TicketType, TicketPriority, TICKET_CATEGORIES, TICKET_LABELS } from '../types/ticketing';
import { User as UserType } from '../types';

interface CreateTicketModalProps {
  onClose: () => void;
  onSave: (ticket: Omit<TicketType, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt'>) => void;
  currentUser: UserType;
}

export function CreateTicketModal({ onClose, onSave, currentUser }: CreateTicketModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TicketPriority,
    category: '',
    assignedTo: '',
    assignedToName: '',
    labels: [] as string[],
    dueDate: '',
    attachments: [] as File[],
  });
  
  const [editorRef, setEditorRef] = useState<HTMLDivElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  // Get real description from the editor (not from stale state!)
  const description = editorRef?.innerHTML?.trim() || '';
  const title = formData.title.trim();

  if (!title || !description || !formData.category) {
    alert('Please fill in Title, Description, and Category');
    return;
  }

  // ONLY SEND WHAT THE BACKEND NEEDS — NO MORE, NO LESS
  const payload = {
    title,
    description,
    priority: formData.priority,
    category: formData.category,
    assignedTo: null,                    // ← NEVER send undefined or fake ID
    dueDate: formData.dueDate || null,   // ← null = SQL NULL
    labels: formData.labels || [],
  };

  console.log('Sending to backend:', payload); // ← Remove this later

  onSave(payload as any);
  onClose();
};

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDescriptionChange = () => {
    if (editorRef) {
      const content = editorRef.innerHTML;
      handleInputChange('description', content);
    }
  };
  const toggleLabel = (label: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label)
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, file]
          }));
        }
      }
    }
  };

  const applyFormatting = (command: string) => {
    if (!editorRef) return;
    
    editorRef.focus();
    
    try {
      switch (command) {
        case 'bold':
          document.execCommand('bold', false);
          break;
        case 'italic':
          document.execCommand('italic', false);
          break;
        case 'underline':
          document.execCommand('underline', false);
          break;
        case 'list':
          document.execCommand('insertUnorderedList', false);
          break;
        case 'link':
          const url = prompt('Enter URL:');
          if (url) {
            document.execCommand('createLink', false, url);
          }
          break;
        default:
          return;
      }
      handleDescriptionChange();
    } catch (error) {
      console.error('Formatting command failed:', error);
    }
  };

  const handlePasteInEditor = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, file]
          }));
          
          // Insert image placeholder in editor
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target?.result as string;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.margin = '10px 0';
            img.style.border = '1px solid #e5e7eb';
            img.style.borderRadius = '8px';
            
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              range.insertNode(img);
              range.collapse(false);
            } else if (editorRef) {
              editorRef.appendChild(img);
            }
            handleDescriptionChange();
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = document.createElement('img');
      img.src = event.target?.result as string;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.margin = '10px 0';
      img.style.border = '1px solid #e5e7eb';
      img.style.borderRadius = '8px';
      
      if (editorRef) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.insertNode(img);
          range.collapse(false);
        } else {
          editorRef.appendChild(img);
        }
        handleDescriptionChange();
      }
    };
    reader.readAsDataURL(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        return 'border-red-300 bg-red-50';
      case 'high':
        return 'border-orange-300 bg-orange-50';
      case 'medium':
        return 'border-yellow-300 bg-yellow-50';
      case 'low':
        return 'border-green-300 bg-green-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-2">
                <Ticket className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Create New Ticket</h2>
                <p className="text-indigo-100 text-sm">Submit a new support request</p>
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
          <form id="ticket-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white text-sm"
                    placeholder="Brief description of the issue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  
                  {/* Rich Text Formatting Toolbar */}
                  <div className="flex items-center space-x-1 mb-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => applyFormatting('bold')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-all"
                      title="Bold (Ctrl+B)"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('italic')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-all"
                      title="Italic (Ctrl+I)"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('underline')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-all"
                      title="Underline (Ctrl+U)"
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <button
                      type="button"
                      onClick={() => applyFormatting('insertUnorderedList')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-all"
                      title="Bullet List"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('createLink')}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-all"
                      title="Insert Link"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                    <div className="w-px h-6 bg-gray-300"></div>
                    <label className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-all cursor-pointer" title="Insert Image">
                      <Image className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          files.forEach(file => {
                            insertImage(file);
                            setFormData(prev => ({
                              ...prev,
                              attachments: [...prev.attachments, file]
                            }));
                          });
                        }}
                        className="hidden"
                      />
                    </label>
                    <label className="p-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded transition-all cursor-pointer" title="Attach File">
                      <Paperclip className="w-4 h-4" />
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Rich Text Editor */}
                  <div
                    ref={setEditorRef}
                    contentEditable
                    onInput={handleDescriptionChange}
                    onPaste={handlePasteInEditor}
                    onKeyDown={(e) => {
                      // Handle keyboard shortcuts
                      if (e.ctrlKey || e.metaKey) {
                        switch (e.key) {
                          case 'b':
                            e.preventDefault();
                            applyFormatting('bold');
                            break;
                          case 'i':
                            e.preventDefault();
                            applyFormatting('italic');
                            break;
                          case 'u':
                            e.preventDefault();
                            applyFormatting('underline');
                            break;
                        }
                      }
                    }}
                    className="w-full min-h-[150px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white text-sm focus:outline-none"
                    style={{ 
                      lineHeight: '1.5',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}
                    data-placeholder="Detailed description of the issue or request. You can format text, paste images (Ctrl+V), and attach files..."
                  />
                  
                  {/* Placeholder styling */}
                  <style>{`
                    [contenteditable]:empty:before {
                      content: attr(data-placeholder);
                      color: #9ca3af;
                      pointer-events: none;
                    }
                  `}</style>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    <p>Use Ctrl+B for <strong>bold</strong>, Ctrl+I for <em>italic</em>, Ctrl+U for <u>underline</u></p>
                    <p>Paste images directly (Ctrl+V) or use the toolbar buttons above</p>
                  </div>
                </div>
                
                {/* File Attachments */}
                {formData.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attachments ({formData.attachments.length})
                    </label>
                    <div className="space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {file.type.startsWith('image/') ? (
                              <Image className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Paperclip className="w-5 h-5 text-gray-600" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-all"
                            title="Remove attachment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white text-sm"
                    >
                      <option value="">Select Category</option>
                      {TICKET_CATEGORIES.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => handleInputChange('dueDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Priority Selection */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Level</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {(['low', 'medium', 'high', 'urgent'] as TicketPriority[]).map((priority) => (
                    <label
                      key={priority}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        formData.priority === priority
                          ? `${getPriorityColor(priority)} border-current`
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={formData.priority === priority}
                        onChange={(e) => handleInputChange('priority', e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(priority)}
                        <span className="font-medium capitalize">{priority}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </section>

            {/* Assignment */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign To
                  </label>
                  <input
                    type="text"
                    value={formData.assignedToName}
                    onChange={(e) => {
                      handleInputChange('assignedToName', e.target.value);
                      // Do NOT set assignedTo at all — we always send null for now
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white text-sm"
                    placeholder="Enter assignee name (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to create an unassigned ticket</p>
                </div>
              </div>
            </section>

            {/* Labels */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Labels</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex flex-wrap gap-2">
                  {TICKET_LABELS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleLabel(label)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                        formData.labels.includes(label)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-indigo-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
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
              form="ticket-form"
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl hover:from-indigo-700 hover:to-purple-800 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Create Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}