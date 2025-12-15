import React from 'react';
import { X, User, Monitor, Wifi, Zap, HardDrive, Cpu, CheckCircle, XCircle } from 'lucide-react';
import { ITCheckEntry } from '../types';
import { validateEntry } from '../utils/validation';

interface ViewDetailsModalProps {
  entry: ITCheckEntry;
  onClose: () => void;
}

export function ViewDetailsModal({ entry, onClose }: ViewDetailsModalProps) {
  const averageDownload = entry.speedTests.reduce((sum, test) => sum + test.downloadSpeed, 0) / entry.speedTests.length;
  const averageUpload = entry.speedTests.reduce((sum, test) => sum + test.uploadSpeed, 0) / entry.speedTests.length;
  const averagePing = entry.speedTests.reduce((sum, test) => sum + test.ping, 0) / entry.speedTests.length;
  
  // Get validation results to highlight failed fields
  const validationResult = validateEntry(entry);
  const failedFields = validationResult.failedFields;

  const getProcessorDisplay = () => {
    if (entry.computerType === 'Mac') {
      return entry.processor.macProcessor;
    }
    return `${entry.processor.brand} ${entry.processor.series} ${entry.processor.generation}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{entry.name}</h2>
              <p className="text-sm text-gray-600">{entry.department} Department</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              entry.status === 'Passed'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {entry.status === 'Passed' ? (
                <CheckCircle className="w-4 h-4 mr-1" />
              ) : (
                <XCircle className="w-4 h-4 mr-1" />
              )}
              {entry.status}
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
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Staff Name</label>
                <p className="text-gray-900 font-medium">{entry.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Department</label>
                <p className="text-gray-900 font-medium">{entry.department}</p>
              </div>
              {entry.department === 'BLAB' && entry.batchNumber && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Batch Number</label>
                  <p className="text-gray-900 font-medium">{entry.batchNumber}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600">Computer Type</label>
                <p className="text-gray-900 font-medium">{entry.computerType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">IT Check Completed</label>
                <p className="text-gray-900 font-medium">{new Date(entry.itCheckCompleted).toLocaleDateString()}</p>
              </div>
            </div>
          </section>

          {/* Network Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Wifi className="w-5 h-5 mr-2 text-blue-600" />
              Network Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">IP Address</label>
                <p className="text-gray-900 font-medium font-mono">{entry.ipAddress}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">ISP</label>
                <p className="text-gray-900 font-medium">{entry.isp}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Connection Type</label>
                <p className="text-gray-900 font-medium">{entry.connectionType}</p>
              </div>
            </div>
          </section>

          {/* Internet Speed Tests */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Internet Speed Test Results
            </h3>
            <div className="space-y-4">
              {/* Individual Tests */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {entry.speedTests.map((test, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Test {index + 1}</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <label className="block text-gray-600">URL</label>
                        <a 
                          href={test.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {test.url}
                        </a>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-gray-600">Download</label>
                          <p className="font-medium">{test.downloadSpeed} Mbps</p>
                        </div>
                        <div>
                          <label className="block text-gray-600">Upload</label>
                          <p className="font-medium">{test.uploadSpeed} Mbps</p>
                        </div>
                        <div>
                          <label className="block text-gray-600">Ping</label>
                          <p className="font-medium">{test.ping} ms</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Average Results */}
              <div className={`border rounded-lg p-4 ${failedFields.includes('Internet Speed') ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <h4 className="font-medium text-blue-900 mb-3">Average Results</h4>
                <div className={`grid grid-cols-3 gap-4 text-sm ${failedFields.includes('Internet Speed') ? 'bg-red-50 border-red-200' : ''}`}>
                  <div>
                    <label className={`block ${failedFields.includes('Internet Speed') ? 'text-red-700' : 'text-blue-700'}`}>
                      Average Download
                    </label>
                    <p className={`font-semibold ${failedFields.includes('Internet Speed') ? 'text-red-900' : 'text-blue-900'}`}>
                      {averageDownload.toFixed(1)} Mbps
                      {failedFields.includes('Internet Speed') && averageDownload < 20 && <span className="ml-2 text-red-500">✗</span>}
                    </p>
                  </div>
                  <div>
                    <label className={`block ${failedFields.includes('Internet Speed') ? 'text-red-700' : 'text-blue-700'}`}>
                      Average Upload
                    </label>
                    <p className={`font-semibold ${failedFields.includes('Internet Speed') ? 'text-red-900' : 'text-blue-900'}`}>
                      {averageUpload.toFixed(1)} Mbps
                      {failedFields.includes('Internet Speed') && averageUpload < 5 && <span className="ml-2 text-red-500">✗</span>}
                    </p>
                  </div>
                  <div>
                    <label className={`block ${failedFields.includes('Internet Speed') ? 'text-red-700' : 'text-blue-700'}`}>
                      Average Ping
                    </label>
                    <p className={`font-semibold ${failedFields.includes('Internet Speed') ? 'text-red-900' : 'text-blue-900'}`}>
                      {averagePing.toFixed(1)} ms
                      {failedFields.includes('Internet Speed') && averagePing > 50 && <span className="ml-2 text-red-500">✗</span>}
                    </p>
                  </div>
                </div>
                {failedFields.includes('Internet Speed') && (
                  <div className="mt-2 text-sm text-red-600">
                    <p>Requirements: Download ≥20 Mbps, Upload ≥5 Mbps, Ping ≤50 ms</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* PC Specifications */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-blue-600" />
              PC Specifications
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Operating System</label>
                  <p className={`font-medium ${failedFields.includes('Operating System') ? 'text-red-600' : 'text-gray-900'}`}>
                    {entry.operatingSystem}
                    {failedFields.includes('Operating System') && <span className="ml-2 text-red-500">✗</span>}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">PC Model</label>
                  <p className="text-gray-900 font-medium">{entry.pcModel}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 flex items-center">
                    <Cpu className="w-4 h-4 mr-1" />
                    Processor
                  </label>
                  <p className={`font-medium ${failedFields.includes('Processor') ? 'text-red-600' : 'text-gray-900'}`}>
                    {getProcessorDisplay()}
                    {failedFields.includes('Processor') && <span className="ml-2 text-red-500">✗</span>}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Memory (RAM)</label>
                  <p className={`font-medium ${failedFields.includes('Memory') ? 'text-red-600' : 'text-gray-900'}`}>
                    {entry.memory}
                    {failedFields.includes('Memory') && <span className="ml-2 text-red-500">✗</span>}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Graphics</label>
                  <p className={`font-medium ${failedFields.includes('Graphics') ? 'text-red-600' : 'text-gray-900'}`}>
                    {entry.graphics}
                    {failedFields.includes('Graphics') && <span className="ml-2 text-red-500">✗</span>}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 flex items-center">
                    <HardDrive className="w-4 h-4 mr-1" />
                    Storage
                  </label>
                  <p className={`font-medium ${failedFields.includes('Storage') ? 'text-red-600' : 'text-gray-900'}`}>
                    {entry.storage}
                    {failedFields.includes('Storage') && <span className="ml-2 text-red-500">✗</span>}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Installed Applications */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-blue-600" />
              Installed Applications ({entry.installedApps.length})
            </h3>
            <div className="space-y-3">
              {entry.installedApps.map((app, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Application Name</label>
                      <p className="text-gray-900 font-medium">{app.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Version</label>
                      <p className="text-gray-900 font-medium font-mono">{app.version}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-gray-900">{app.notes || 'No notes'}</p>
                    </div>
                  </div>
                </div>
              ))}
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
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}