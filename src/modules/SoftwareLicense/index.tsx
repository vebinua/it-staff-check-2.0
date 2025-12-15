import React, { useState, useEffect } from 'react';
import { Key, Plus, Search, Filter, Edit, Trash2, Eye, Calendar, DollarSign, Users, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/api';
import { AddEditLicenseModal } from '../../components/AddEditLicenseModal';
import { ViewLicenseModal } from '../../components/ViewLicenseModal';

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
  entity: string;
  department: string;
  addedBy: string;
  timestamp: string;
}

export function SoftwareLicenseModule() {
  const { state } = useApp();
  const canManage = state.currentUser?.role === 'global-admin' ||
                   (state.currentUser?.role === 'module-admin' && state.currentUser?.modulePermissions?.includes('software-licenses'));

  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSoftwareLicenses();
      setLicenses(data);
    } catch (error) {
      console.error('Error loading licenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate expiration notifications
  const getExpiringLicenses = () => {
    const today = new Date();
    const expiringLicenses = [];
    
    licenses.forEach(license => {
      // Check main license
      if (license.expiryDate) {
        const expiry = new Date(license.expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30) {
          expiringLicenses.push({
            ...license,
            daysUntilExpiry: diffDays,
            blockName: 'Main License',
            isAddIn: false
          });
        }
      }
      
      // Check add-ins
      if (license.addIns) {
        license.addIns.forEach((addIn, index) => {
          if (addIn.expiryDate) {
            const expiry = new Date(addIn.expiryDate);
            const diffTime = expiry.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 30) {
              expiringLicenses.push({
                ...license,
                daysUntilExpiry: diffDays,
                blockName: addIn.name,
                isAddIn: true,
                addInIndex: index
              });
            }
          }
        });
      }
    });
    
    return expiringLicenses.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  };

  const expiringLicenses = getExpiringLicenses();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<SoftwareLicense | null>(null);
  const [viewingLicense, setViewingLicense] = useState<SoftwareLicense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || license.status === statusFilter;
    const matchesType = typeFilter === 'all' || license.licenseType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSaveLicense = async (licenseData: Omit<SoftwareLicense, 'id' | 'addedBy' | 'timestamp'>) => {
    try {
      if (editingLicense) {
        await apiClient.updateSoftwareLicense(editingLicense.id, licenseData);
        setEditingLicense(null);
      } else {
        await apiClient.createSoftwareLicense(licenseData);
      }
      setShowAddModal(false);
      await loadLicenses();
    } catch (error) {
      console.error('Error saving license:', error);
      alert('Failed to save license. Please try again.');
    }
  };

  const handleEditLicense = (license: SoftwareLicense) => {
    setEditingLicense(license);
    setShowAddModal(true);
  };

  const handleDeleteLicense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this license?')) {
      try {
        await apiClient.deleteSoftwareLicense(id);
        await loadLicenses();
      } catch (error) {
        console.error('Error deleting license:', error);
        alert('Failed to delete license. Please try again.');
      }
    }
  };

  const handleViewLicense = (license: SoftwareLicense) => {
    setViewingLicense(license);
  };

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

  // Calculate totals
  const totalLicenses = licenses.reduce((sum, license) => sum + license.totalLicenses, 0);
  const usedLicenses = licenses.reduce((sum, license) => sum + license.usedLicenses, 0);
  const totalCost = licenses.reduce((sum, license) => {
    const addInsCost = (license.addIns || []).reduce((addInSum, addIn) => addInSum + (addIn.cost || 0), 0);
    return sum + (license.cost || 0) + addInsCost;
  }, 0);
  const activeLicenses = licenses.filter(license => license.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Key className="w-8 h-8 mr-3 text-blue-600" />
            Software License Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage software licenses, track usage, and monitor compliance ({licenses.length} total licenses)
          </p>
        </div>
        {canManage && (
          <button 
            onClick={() => {
              setShowAddModal(true);
              setEditingLicense(null);
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center space-x-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            <span>Add License</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <Key className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Licenses</p>
              <p className="text-2xl font-semibold text-gray-900">{totalLicenses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Used Licenses</p>
              <p className="text-2xl font-semibold text-gray-900">{usedLicenses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cost</p>
              <p className="text-2xl font-semibold text-gray-900">${totalCost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Licenses</p>
              <p className="text-2xl font-semibold text-gray-900">{activeLicenses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expiration Notifications */}
      {expiringLicenses.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="bg-orange-100 rounded-full p-2 mt-1">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-orange-900 mb-3">License Expiration Alerts</h3>
              <div className="space-y-3">
                {expiringLicenses.map((item, index) => (
                  <div key={`${item.id}-${item.isAddIn ? item.addInIndex : 'main'}`} 
                       className="bg-white rounded-lg p-4 border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${
                          item.daysUntilExpiry < 0 ? 'bg-red-100' :
                          item.daysUntilExpiry <= 7 ? 'bg-red-100' :
                          'bg-orange-100'
                        }`}>
                          {item.daysUntilExpiry < 0 ? (
                            <XCircle className={`w-4 h-4 text-red-600`} />
                          ) : item.daysUntilExpiry <= 7 ? (
                            <AlertTriangle className={`w-4 h-4 text-red-600`} />
                          ) : (
                            <Clock className={`w-4 h-4 text-orange-600`} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {item.name} - {item.blockName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {item.daysUntilExpiry < 0 
                              ? `Expired ${Math.abs(item.daysUntilExpiry)} days ago`
                              : item.daysUntilExpiry === 0
                              ? 'Expires today!'
                              : `Expires in ${item.daysUntilExpiry} days`
                            }
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleViewLicense(item)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                <p className="text-sm text-orange-800">
                  <strong>Action Required:</strong> {expiringLicenses.filter(l => l.daysUntilExpiry <= 7).length} licenses expire within 7 days. 
                  Contact your vendor to renew these licenses to avoid service interruption.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="subscription">Subscription</option>
            <option value="perpetual">Perpetual</option>
            <option value="volume">Volume</option>
            <option value="oem">OEM</option>
          </select>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span>{filteredLicenses.length} of {licenses.length} licenses</span>
          </div>
        </div>
      </div>

      {/* Licenses Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Software
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Licenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLicenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <Key className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No licenses found</p>
                      <p className="text-sm">Start by adding your first software license</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLicenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{license.name}</div>
                      <div className="text-sm text-gray-500">{license.vendor} - {license.version}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {license.entity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {license.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{license.totalLicenses}</div>
                      <div className="text-xs text-gray-500">licenses</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">
                        {license.vendor === 'Trend Micro' ? 'S$' : '$'}
                        {(license.cost + (license.addIns || []).reduce((sum, addIn) => sum + (addIn.cost || 0), 0)).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {license.vendor === 'Trend Micro' ? 'S$' : '$'}
                        {((license.cost + (license.addIns || []).reduce((sum, addIn) => sum + (addIn.cost || 0), 0)) / license.totalLicenses).toFixed(2)} per license
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {license.expiryDate ? (
                        <div>
                          <div>{new Date(license.expiryDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {(() => {
                              const days = Math.ceil((new Date(license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                              return days > 0 ? `${days} days` : `${Math.abs(days)} days ago`;
                            })()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No expiry</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(license.status)}`}>
                        {getStatusIcon(license.status)}
                        <span className="ml-1 capitalize">{license.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewLicense(license)}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded hover:bg-gray-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditLicense(license)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit License"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteLicense(license.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete License"
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

      {/* License Usage Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">License Usage Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Total Investment</h4>
            <p className="text-2xl font-bold text-blue-600">${totalCost.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Across {licenses.length} software licenses</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">License Utilization</h4>
            <p className="text-2xl font-bold text-purple-600">
              {totalLicenses > 0 ? Math.round((usedLicenses / totalLicenses) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-600">{usedLicenses} of {totalLicenses} licenses used</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Active Software</h4>
            <p className="text-2xl font-bold text-green-600">{activeLicenses}</p>
            <p className="text-sm text-gray-600">Currently active licenses</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showAddModal || editingLicense) && (
        <AddEditLicenseModal
          license={editingLicense}
          onClose={() => {
            setShowAddModal(false);
            setEditingLicense(null);
          }}
          onSave={handleSaveLicense}
        />
      )}

      {viewingLicense && (
        <ViewLicenseModal
          license={viewingLicense}
          onClose={() => setViewingLicense(null)}
        />
      )}
    </div>
  );
}