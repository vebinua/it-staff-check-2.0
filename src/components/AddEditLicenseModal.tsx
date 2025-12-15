import React, { useState, useEffect } from 'react';
import { X, Key, Plus } from 'lucide-react';
import { SoftwareLicense, SoftwareAddIn } from '../types/modules';

interface AddEditLicenseModalProps {
  license: SoftwareLicense | null;
  onClose: () => void;
  onSave: (license: Omit<SoftwareLicense, 'id' | 'addedBy' | 'timestamp'>) => void;
}

export function AddEditLicenseModal({ license, onClose, onSave }: AddEditLicenseModalProps) {
  const isEditing = !!license;
  
  const [formData, setFormData] = useState({
    name: '',
    vendor: '',
    version: '',
    licenseType: 'subscription' as 'perpetual' | 'subscription' | 'volume' | 'oem',
    totalLicenses: 1,
    usedLicenses: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    cost: 0,
    licenseKey: '',
    assignedUsers: [] as string[],
    status: 'active' as 'active' | 'expired' | 'suspended',
    notes: '',
    addIns: [] as SoftwareAddIn[],
  });

  useEffect(() => {
  if (license) {
    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return '';
      // Handle both "2025-04-15" and "2025-04-15T00:00:00.000Z"
      return dateString.split('T')[0];
    };

    setFormData({
      name: license.name || '',
      vendor: license.vendor || '',
      version: license.version || '',
      licenseType: license.licenseType,
      totalLicenses: license.totalLicenses || 1,
      usedLicenses: license.usedLicenses || 0,
      purchaseDate: formatDate(license.purchaseDate),           // ← fixed
      expiryDate: formatDate(license.expiryDate) || '',         // ← fixed
      cost: license.cost || 0,
      licenseKey: license.licenseKey || '',
      assignedUsers: license.assignedUsers || [],
      status: license.status,
      notes: license.notes || '',
      addIns: (license.addIns || []).map(addIn => ({
        ...addIn,
        purchaseDate: formatDate(addIn.purchaseDate),           // ← also fix add-ins
        expiryDate: formatDate(addIn.expiryDate) || '',
      })),
    });
  }
}, [license]);

  const addAddIn = () => {
    const today = new Date().toISOString().split('T')[0];
    const newAddIn: SoftwareAddIn = {
      id: Date.now().toString(),
      name: '',
      cost: 0,
      totalLicenses: 1,
      usedLicenses: 0,
      purchaseDate: today,    // ← good format
      expiryDate: '',
      notes: '',
    };
    // ...
  };

  const removeAddIn = (index: number) => {
    setFormData(prev => ({
      ...prev,
      addIns: prev.addIns.filter((_, i) => i !== index),
    }));
  };

  const updateAddIn = (index: number, field: keyof SoftwareAddIn, value: any) => {
    setFormData(prev => ({
      ...prev,
      addIns: prev.addIns.map((addIn, i) => 
        i === index ? { ...addIn, [field]: value } : addIn
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.vendor) {
      alert('Please fill in all required fields');
      return;
    }

    if (formData.usedLicenses > formData.totalLicenses) {
      alert('Used licenses cannot exceed total licenses');
      return;
    }

    onSave(formData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-2">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {isEditing ? 'Edit License' : 'Add New License'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {isEditing ? 'Update license information' : 'Create a new software license'}
                </p>
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
          <form id="license-form" onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Software Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                      placeholder="e.g., Microsoft Office"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.vendor}
                      onChange={(e) => handleInputChange('vendor', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                      placeholder="e.g., Microsoft"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Version
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => handleInputChange('version', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                      placeholder="e.g., 2023"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Type *
                    </label>
                    <select
                      required
                      value={formData.licenseType}
                      onChange={(e) => handleInputChange('licenseType', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                    >
                      <option value="subscription">Subscription</option>
                      <option value="perpetual">Perpetual</option>
                      <option value="volume">Volume</option>
                      <option value="oem">OEM</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* License Details */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">License Details</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Licenses *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.totalLicenses}
                      onChange={(e) => handleInputChange('totalLicenses', parseInt(e.target.value) || 1)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Used Licenses
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.usedLicenses}
                      onChange={(e) => handleInputChange('usedLicenses', parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.purchaseDate}
                      onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost ($) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      required
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Key
                  </label>
                  <input
                    type="text"
                    value={formData.licenseKey}
                    onChange={(e) => handleInputChange('licenseKey', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm font-mono"
                    placeholder="Enter license key (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm resize-none"
                    placeholder="Additional notes or comments"
                  />
                </div>
              </div>
            </section>

            {/* Add-ins Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add-ins</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                {formData.addIns.map((addIn, index) => (
                  <div key={addIn.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">Add-in #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeAddIn(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                        title="Remove Add-in"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Add-in Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={addIn.name}
                          onChange={(e) => updateAddIn(index, 'name', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                          placeholder="e.g., Microsoft Project"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost ($) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={addIn.cost}
                          onChange={(e) => updateAddIn(index, 'cost', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Total Licenses *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={addIn.totalLicenses}
                          onChange={(e) => updateAddIn(index, 'totalLicenses', parseInt(e.target.value) || 1)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Used Licenses
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={addIn.usedLicenses}
                          onChange={(e) => updateAddIn(index, 'usedLicenses', parseInt(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Purchase Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={addIn.purchaseDate}
                          onChange={(e) => updateAddIn(index, 'purchaseDate', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry Date
                        </label>
                        <input
                          type="date"
                          value={addIn.expiryDate}
                          onChange={(e) => updateAddIn(index, 'expiryDate', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={addIn.notes}
                        onChange={(e) => updateAddIn(index, 'notes', e.target.value)}
                        rows={2}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm resize-none"
                        placeholder="Additional notes for this add-in"
                      />
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addAddIn}
                  className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-3 rounded-xl font-medium transition-all duration-200 border-2 border-dashed border-blue-300 hover:border-blue-400"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add New Add-in</span>
                </button>
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
              form="license-form"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl hover:from-blue-700 hover:to-purple-800 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isEditing ? 'Update License' : 'Create License'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}