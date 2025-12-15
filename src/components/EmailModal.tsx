import React from 'react';
import { X, Mail, Copy } from 'lucide-react';
import { ITCheckEntry } from '../types';
import { useApp } from '../context/AppContext';

interface EmailModalProps {
  entry: ITCheckEntry;
  onClose: () => void;
}

export function EmailModal({ entry, onClose }: EmailModalProps) {
  const { logActivity } = useApp();
  const generateEmailContent = () => {
    const subject = `${entry.name}'s PC Setup – Completed`;
    
    const body = `Hi all,
This is to inform you that ${entry.name}'s new PC setup has been completed.

Below are the details:

IP Address: ${entry.ipAddress}
ISP Name: ${entry.isp}
Internet Connection Type: ${entry.connectionType}

${entry.speedTests.map((test, index) => `${test.url}
Download: ${test.downloadSpeed} Mbps
Upload: ${test.uploadSpeed} Mbps
Ping: ${test.ping} Ms`).join('\n')}

Required Applications	Versions	Remarks
${entry.installedApps.map(app => `${app.name}	${app.version}	${app.notes || 'OK'}`).join('\n')}

PC Specs:
Operating System: ${entry.operatingSystem}
Processor: ${entry.computerType === 'Mac' 
  ? entry.processor.macProcessor 
  : `${entry.processor.brand} ${entry.processor.series} ${entry.processor.generation}`}
Storage: ${entry.storage}
Memory: ${entry.memory}
VGA: ${entry.graphics}
PC Model: ${entry.pcModel}
PC Type: ${entry.computerType === 'Windows' ? 'Desktop/Laptop' : 'Mac'}`;

    return { subject, body };
  };

  const { subject, body } = generateEmailContent();
  const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      logActivity('email_entry', entry.id, entry.name, `Copied email content for ${entry.name} (${entry.department})`);
      alert('Email content copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleEmailClick = () => {
    logActivity('email_entry', entry.id, entry.name, `Opened email client for ${entry.name} (${entry.department})`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Mail className="w-6 h-6 mr-3 text-blue-600" />
            Email IT Check Details - {entry.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              readOnly
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Body
            </label>
            <textarea
              value={body}
              readOnly
              rows={20}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 font-mono text-sm"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition-all"
            >
              <Copy className="w-4 h-4" />
              <span>Copy to Clipboard</span>
            </button>
            <a
              href={mailtoLink}
              onClick={handleEmailClick}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium"
            >
              <Mail className="w-4 h-4" />
              <span>Open in Email Client</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}