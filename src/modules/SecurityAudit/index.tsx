import React, { useState } from 'react';
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { SecurityAudit } from '../../types/modules';

export function SecurityAuditModule() {
  const [audits, setAudits] = useState<SecurityAudit[]>([]);

  const criticalFindings = audits.reduce((count, audit) => 
    count + audit.findings.filter(f => f.severity === 'critical' && f.status === 'open').length, 0
  );

  const highFindings = audits.reduce((count, audit) => 
    count + audit.findings.filter(f => f.severity === 'high' && f.status === 'open').length, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-red-600" />
            Security Audit
          </h2>
          <p className="text-gray-600 mt-1">
            Conduct security audits and manage compliance
          </p>
        </div>
        <button className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all flex items-center space-x-2 font-medium">
          <Plus className="w-5 h-5" />
          <span>New Audit</span>
        </button>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Audits</p>
              <p className="text-2xl font-semibold text-gray-900">{audits.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Critical Issues</p>
              <p className="text-2xl font-semibold text-gray-900">{criticalFindings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <XCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Priority</p>
              <p className="text-2xl font-semibold text-gray-900">{highFindings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-semibold text-gray-900">
                {audits.reduce((count, audit) => 
                  count + audit.findings.filter(f => f.status === 'resolved').length, 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Overview */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Overview</h3>
        <div className="text-center py-12 text-gray-500">
          <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium">No security audits conducted</p>
          <p className="text-sm">Start your first security audit</p>
        </div>
      </div>
    </div>
  );
}