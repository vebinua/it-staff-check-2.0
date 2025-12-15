import React from 'react';
import { X, Key, Calendar, DollarSign, Users, CheckCircle, XCircle, AlertTriangle, Bell, Clock } from 'lucide-react';

interface SoftwareLicense {
  id: string;
  name: string;
  vendor: string;
  version: string;
  licenseType: 'perpetual' | 'subscription' | 'volume' | 'oem';
  totalLicenses: number;
  usedLicenses: number;
  purchaseDate: string;
  expiryDate?: string;
  cost: number;
  licenseKey?: string;
  assignedUsers: string[];
  status: 'active' | 'expired' | 'suspended';
  notes: string;
  addedBy: string;
  timestamp: string;
}

interface ViewLicenseModalProps {
  license: SoftwareLicense;
  onClose: () => void;
}

export function ViewLicenseModal({ license, onClose }: ViewLicenseModalProps) {
  // Calculate days until expiration for main license and add-ins
  const calculateDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationStatus = (daysUntilExpiry: number | null) => {
    if (daysUntilExpiry === null) return null;
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    if (daysUntilExpiry <= 90) return 'expiring-warning';
    return 'active';
  };

  const getExpirationColor = (status: string | null) => {
    switch (status) {
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expiring-soon':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expiring-warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getExpirationIcon = (status: string | null) => {
    switch (status) {
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      case 'expiring-soon':
        return <AlertTriangle className="w-4 h-4" />;
      case 'expiring-warning':
        return <Bell className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const mainLicenseDaysUntilExpiry = calculateDaysUntilExpiry(license.expiryDate);
  const mainLicenseStatus = getExpirationStatus(mainLicenseDaysUntilExpiry);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'expired':
        return <XCircle className="w-4 h-4" />;
      case 'suspended':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLicenseTypeColor = (type: string) => {
    switch (type) {
      case 'subscription':
        return 'bg-blue-100 text-blue-800';
      case 'perpetual':
        return 'bg-green-100 text-green-800';
      case 'volume':
        return 'bg-purple-100 text-purple-800';
      case 'oem':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const utilizationPercentage = (license.usedLicenses / license.totalLicenses) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{license.name}</h2>
              <p className="text-sm text-gray-600">{license.vendor} - {license.version}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(license.status)}`}>
              {getStatusIcon(license.status)}
              <span className="ml-1 capitalize">{license.status}</span>
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
          {/* Expiration Alerts */}
          {(mainLicenseStatus === 'expired' || mainLicenseStatus === 'expiring-soon' || mainLicenseStatus === 'expiring-warning') && (
            <div className={`border-2 rounded-xl p-4 ${getExpirationColor(mainLicenseStatus)}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getExpirationIcon(mainLicenseStatus)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">
                    {mainLicenseStatus === 'expired' ? 'License Expired!' :
                     mainLicenseStatus === 'expiring-soon' ? 'License Expiring Soon!' :
                     'License Expiration Warning'}
                  </h4>
                  <p className="text-sm">
                    {mainLicenseStatus === 'expired' 
                      ? `This license expired ${Math.abs(mainLicenseDaysUntilExpiry!)} days ago. Immediate renewal required.`
                      : `This license expires in ${mainLicenseDaysUntilExpiry} days. ${
                          mainLicenseStatus === 'expiring-soon' 
                            ? 'Please renew immediately to avoid service interruption.'
                            : 'Consider planning for renewal.'
                        }`
                    }
                  </p>
                  {license.expiryDate && (
                    <p className="text-xs mt-1 font-medium">
                      Expiry Date: {new Date(license.expiryDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-blue-600" />
              License Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Software Name</label>
                <p className="text-gray-900 font-medium">{license.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Vendor</label>
                <p className="text-gray-900 font-medium">{license.vendor}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Version</label>
                <p className="text-gray-900 font-medium">{license.version}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">License Type</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${getLicenseTypeColor(license.licenseType)}`}>
                  {license.licenseType ? license.licenseType.charAt(0).toUpperCase() + license.licenseType.slice(1) : 'N/A'}
                </span>
              </div>
            </div>
          </section>

          {/* License Usage */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              License Usage
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600">Total Licenses</label>
                  <p className="text-2xl font-bold text-blue-600">{license.totalLicenses}</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600">Used Licenses</label>
                  <p className="text-2xl font-bold text-green-600">{license.usedLicenses}</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <label className="block text-sm font-medium text-gray-600">Available</label>
                  <p className="text-2xl font-bold text-orange-600">{license.totalLicenses - license.usedLicenses}</p>
                </div>
              </div>
              
              {/* Usage Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Utilization</span>
                  <span>{utilizationPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-300 ${
                      utilizationPercentage >= 90 ? 'bg-red-500' :
                      utilizationPercentage >= 75 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </section>

          {/* Financial Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
              Financial Information
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Total Cost</label>
                <p className="text-2xl font-bold text-green-600">${(license.cost || 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Cost per License</label>
                <p className="text-2xl font-bold text-blue-600">
                  ${((license.cost || 0) / (license.totalLicenses || 1)).toFixed(2)}
                </p>
              </div>
            </div>
          </section>

          {/* Dates */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Important Dates
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Purchase Date</label>
                <p className="text-gray-900 font-medium">{new Date(license.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Expiry Date</label>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-900 font-medium">
                    {license.expiryDate ? new Date(license.expiryDate).toLocaleDateString() : 'No expiry date'}
                  </p>
                  {mainLicenseDaysUntilExpiry !== null && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getExpirationColor(mainLicenseStatus)}`}>
                      {getExpirationIcon(mainLicenseStatus)}
                      <span className="ml-1">
                        {mainLicenseDaysUntilExpiry < 0 
                          ? `${Math.abs(mainLicenseDaysUntilExpiry)} days overdue`
                          : `${mainLicenseDaysUntilExpiry} days left`
                        }
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* License Key */}
          {license.licenseKey && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">License Key</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="font-mono text-sm text-gray-900 break-all">{license.licenseKey}</p>
                </div>
              </div>
            </section>
          )}

          {/* Add-ins Section */}
          {license.addIns && license.addIns.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Key className="w-5 h-5 mr-2 text-blue-600" />
                Add-ins ({license.addIns.length})
              </h3>
              <div className="space-y-4">
                {license.addIns.map((addIn, index) => {
                  const addInDaysUntilExpiry = calculateDaysUntilExpiry(addIn.expiryDate);
                  const addInStatus = getExpirationStatus(addInDaysUntilExpiry);
                  
                  return (
                    <div key={addIn.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {/* Add-in Expiration Alert */}
                      {(addInStatus === 'expired' || addInStatus === 'expiring-soon' || addInStatus === 'expiring-warning') && (
                        <div className={`border rounded-lg p-3 mb-4 ${getExpirationColor(addInStatus)}`}>
                          <div className="flex items-center space-x-2">
                            {getExpirationIcon(addInStatus)}
                            <span className="font-medium text-sm">
                              {addInStatus === 'expired' ? 'Block Expired!' :
                               addInStatus === 'expiring-soon' ? 'Block Expiring Soon!' :
                               'Block Expiration Warning'}
                            </span>
                            <span className="text-sm">
                              {addInStatus === 'expired' 
                                ? `${Math.abs(addInDaysUntilExpiry!)} days overdue`
                                : `${addInDaysUntilExpiry} days remaining`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{addIn.name}</h4>
                        <span className="text-sm text-gray-500">Add-in #{index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white p-3 rounded-lg">
                          <label className="block text-sm font-medium text-gray-600">Total Licenses</label>
                          <p className="text-lg font-bold text-blue-600">{addIn.totalLicenses}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <label className="block text-sm font-medium text-gray-600">Used Licenses</label>
                          <p className="text-lg font-bold text-green-600">{addIn.usedLicenses}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <label className="block text-sm font-medium text-gray-600">Available</label>
                          <p className="text-lg font-bold text-orange-600">{addIn.totalLicenses - addIn.usedLicenses}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <label className="block text-sm font-medium text-gray-600">Cost</label>
                          <p className="text-lg font-bold text-purple-600">${addIn.cost.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Purchase Date</label>
                          <p className="text-gray-900 font-medium">{new Date(addIn.purchaseDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600">Expiry Date</label>
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900 font-medium">
                              {addIn.expiryDate ? new Date(addIn.expiryDate).toLocaleDateString() : 'No expiry date'}
                            </p>
                            {addInDaysUntilExpiry !== null && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getExpirationColor(addInStatus)}`}>
                                {getExpirationIcon(addInStatus)}
                                <span className="ml-1">
                                  {addInDaysUntilExpiry < 0 
                                    ? `${Math.abs(addInDaysUntilExpiry)} days overdue`
                                    : `${addInDaysUntilExpiry} days left`
                                  }
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {addIn.notes && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-600">Notes</label>
                          <div className="bg-white p-3 rounded-lg border border-gray-200 mt-1">
                            <p className="text-gray-900 text-sm">{addIn.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Notes */}
          {license.notes && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{license.notes}</p>
                </div>
              </div>
            </section>
          )}

          {/* System Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Added By</label>
                <p className="text-gray-900 font-medium">{license.addedBy}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-900 font-medium">{new Date(license.timestamp).toLocaleString()}</p>
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