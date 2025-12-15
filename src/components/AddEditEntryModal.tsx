import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ITCheckEntry, SpeedTest, InstalledApp, DEPARTMENTS, WINDOWS_OS_OPTIONS, MAC_OS_OPTIONS, INTEL_SERIES, AMD_SERIES, GENERATIONS, MAC_PROCESSORS, MEMORY_OPTIONS, STORAGE_OPTIONS } from '../types';
import { validateEntry } from '../utils/validation';

interface AddEditEntryModalProps {
  entry: ITCheckEntry | null;
  onClose: () => void;
}

export function AddEditEntryModal({ entry, onClose }: AddEditEntryModalProps) {
  const { addEntry, updateEntry } = useApp();
  const isEditing = !!entry;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    batchNumber: '',
    computerType: 'Windows' as 'Windows' | 'Mac',
    itCheckCompleted: '',
    ipAddress: '',
    isp: '',
    connectionType: '',
    speedTests: [
      { url: '', downloadSpeed: 0, uploadSpeed: 0, ping: 0 },
      { url: '', downloadSpeed: 0, uploadSpeed: 0, ping: 0 },
      { url: '', downloadSpeed: 0, uploadSpeed: 0, ping: 0 },
    ] as SpeedTest[],
    installedApps: [{ name: '', version: '', notes: '' }] as InstalledApp[],
    operatingSystem: '',
    processor: {
      brand: '',
      series: '',
      generation: '',
      macProcessor: '',
    },
    memory: '',
    graphics: '',
    storage: '',
    pcModel: '',
  });

  // Initialize form with entry data if editing
 useEffect(() => {
  if (!entry) return;

  setFormData({
    name: entry.name ?? '',
    department: entry.department ?? '',
    batchNumber: entry.batchNumber ?? '',
    computerType: (entry.computerType as 'Windows' | 'Mac') ?? 'Windows',
    itCheckCompleted: entry.itCheckCompleted ?? '',
    ipAddress: entry.ipAddress ?? '',
    isp: entry.isp ?? '',
    connectionType: entry.connectionType ?? '',
    speedTests:
      entry.speedTests && entry.speedTests.length
        ? entry.speedTests.map((t) => ({
            url: t.url ?? '',
            downloadSpeed: t.downloadSpeed ?? 0,
            uploadSpeed: t.uploadSpeed ?? 0,
            ping: t.ping ?? 0,
          }))
        : [
            { url: '', downloadSpeed: 0, uploadSpeed: 0, ping: 0 },
            { url: '', downloadSpeed: 0, uploadSpeed: 0, ping: 0 },
            { url: '', downloadSpeed: 0, uploadSpeed: 0, ping: 0 },
          ],
    installedApps:
      entry.installedApps && entry.installedApps.length
        ? entry.installedApps.map((a) => ({
            name: a.name ?? '',
            version: a.version ?? '',
            notes: a.notes ?? '',
          }))
        : [{ name: '', version: '', notes: '' }],
    operatingSystem: entry.operatingSystem ?? '',
    processor: entry.processor ?? {
      brand: '',
      series: '',
      generation: '',
      macProcessor: '',
    },
    memory: entry.memory ?? '',
    graphics: entry.graphics ?? '',
    storage: entry.storage ?? '',
    pcModel: entry.pcModel ?? '',
  });
}, [entry]);

  // Update OS options when computer type changes
  // useEffect(() => {
  //   setFormData(prev => ({
  //     ...prev,
  //     operatingSystem: '',
  //     processor: {
  //       brand: '',
  //       series: '',
  //       generation: '',
  //       macProcessor: '',
  //     },
  //   }));
  // }, [formData.computerType]);

  const handleInputChange = (field: string, value: any, nested?: string) => {
  // Special case: switching Windows <-> Mac
  if (field === 'computerType') {
    setFormData(prev => ({
      ...prev,
      computerType: value,
      operatingSystem: '',  // clear OS
      processor: {
        brand: '',
        series: '',
        generation: '',
        macProcessor: '',
      },
    }));
    return;
  }

  if (nested) {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...(prev as any)[field],
        [nested]: value,
      },
    }));
  } else {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }
};


  const updateSpeedTest = (index: number, field: keyof SpeedTest, value: string | number) => {
    const newSpeedTests = [...formData.speedTests];
    newSpeedTests[index] = {
      ...newSpeedTests[index],
      [field]: field === 'url' ? value : Number(value),
    };
    setFormData(prev => ({ ...prev, speedTests: newSpeedTests }));
  };

  const updateInstalledApp = (index: number, field: keyof InstalledApp, value: string) => {
    const newApps = [...formData.installedApps];
    newApps[index] = { ...newApps[index], [field]: value };
    setFormData(prev => ({ ...prev, installedApps: newApps }));
  };

  const addInstalledApp = () => {
    setFormData(prev => ({
      ...prev,
      installedApps: [...prev.installedApps, { name: '', version: '', notes: '' }],
    }));
  };

  const removeInstalledApp = (index: number) => {
    if (formData.installedApps.length > 1) {
      setFormData(prev => ({
        ...prev,
        installedApps: prev.installedApps.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name || !formData.department || !formData.itCheckCompleted || 
        !formData.ipAddress || !formData.isp || !formData.connectionType ||
        !formData.operatingSystem || !formData.memory || !formData.graphics || 
        !formData.storage || !formData.pcModel) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate processor fields
    if (formData.computerType === 'Windows') {
      if (!formData.processor.brand || !formData.processor.series || !formData.processor.generation) {
        alert('Please complete all processor fields');
        return;
      }
    } else if (formData.computerType === 'Mac') {
      if (!formData.processor.macProcessor) {
        alert('Please select a Mac processor');
        return;
      }
    }

    // Validate speed tests
    for (let i = 0; i < formData.speedTests.length; i++) {
      const test = formData.speedTests[i];
      if (!test.url || test.downloadSpeed <= 0 || test.uploadSpeed <= 0 || test.ping <= 0) {
        alert(`Please complete all fields for Speed Test ${i + 1}`);
        return;
      }
    }

    // Validate installed apps
    for (let i = 0; i < formData.installedApps.length; i++) {
      const app = formData.installedApps[i];
      if (!app.name || !app.version) {
        alert(`Please complete name and version for Application ${i + 1}`);
        return;
      }
    }

    // Validate BLAB batch number
    if (formData.department === 'BLAB' && !formData.batchNumber) {
      alert('Batch number is required for BLAB department');
      return;
    }

    // Create entry object for validation
    const entryForValidation = {
      ...formData,
      id: 'temp',
      addedBy: 'temp',
      timestamp: new Date().toISOString(),
      status: 'Passed' as const,
    } as ITCheckEntry;

    // Validate and determine status
    const validationResult = validateEntry(entryForValidation);
    
    const finalEntry: Omit<ITCheckEntry, 'id' | 'addedBy' | 'timestamp'> = {
      ...formData,
      status: validationResult.passed ? 'Passed' as const : 'Failed' as const,
    };

    if (isEditing && entry) {
      updateEntry({
        ...entry,
        ...finalEntry,
      });
    } else {
      addEntry(finalEntry);
    }

    onClose();
  };

  const getOSOptions = () => {
    return formData.computerType === 'Windows' ? WINDOWS_OS_OPTIONS : MAC_OS_OPTIONS;
  };

  const getSeriesOptions = () => {
    if (formData.computerType === 'Mac') return [];
    return formData.processor.brand === 'Intel' ? INTEL_SERIES : AMD_SERIES;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Modern Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Plus className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {isEditing ? 'Edit IT Check Entry' : 'Add New IT Check Entry'}
                </h2>
                <p className="text-blue-100 mt-1">Complete the form below to {isEditing ? 'update' : 'create'} an IT check entry</p>
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
          <form id="entry-form" onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 shadow-lg">1</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Basic Information</span>
            </h3>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Staff Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  placeholder="Enter staff member's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Department *
                </label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              {formData.department === 'BLAB' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                    placeholder="Enter batch number"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Computer Type *
                </label>
                <div className="flex space-x-6">
                  <label className="flex items-center bg-white rounded-xl px-4 py-3 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-sm">
                    <input
                      type="radio"
                      name="computerType"
                      value="Windows"
                      checked={formData.computerType === 'Windows'}
                      onChange={(e) => handleInputChange('computerType', e.target.value)}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">Windows</span>
                  </label>
                  <label className="flex items-center bg-white rounded-xl px-4 py-3 border-2 border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer shadow-sm">
                    <input
                      type="radio"
                      name="computerType"
                      value="Mac"
                      checked={formData.computerType === 'Mac'}
                      onChange={(e) => handleInputChange('computerType', e.target.value)}
                      className="mr-3 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">Mac</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  IT Check Completed Date *
                </label>
                <input
                    type="date"
                    required
                    value={
                      formData.itCheckCompleted
                        ? new Date(formData.itCheckCompleted).toISOString().slice(0, 10) // "YYYY-MM-DD"
                        : ''
                    }
                    onChange={(e) =>
                      handleInputChange('itCheckCompleted', e.target.value || '')
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />

              </div>
              </div>
            </div>
          </section>

          {/* Network Information */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 shadow-lg">2</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Network Information</span>
            </h3>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  IP Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ipAddress}
                  onChange={(e) => handleInputChange('ipAddress', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm font-mono"
                  placeholder="192.168.1.1"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  ISP *
                </label>
                <input
                  type="text"
                  required
                  value={formData.isp}
                  onChange={(e) => handleInputChange('isp', e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  placeholder="Internet Service Provider"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Connection Type *
                </label>
                <input
                  type="text"
                  required
                  value={formData.connectionType}
                  onChange={(e) => handleInputChange('connectionType', e.target.value)}
                  placeholder="e.g., Fiber, DSL, Cable"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                />
              </div>
              </div>
            </div>
          </section>

          {/* Internet Speed Tests */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 shadow-lg">3</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Internet Speed Tests</span>
              <span className="ml-3 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">3 Required</span>
            </h3>
            <div className="space-y-6">
            {formData.speedTests.map((test, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-inner">
                <div className="flex items-center mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <h4 className="font-bold text-gray-900">Speed Test {index + 1}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={test.url}
                      onChange={(e) => updateSpeedTest(index, 'url', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="https://speedtest.net/result/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Download (Mbps) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={test.downloadSpeed}
                      onChange={(e) => updateSpeedTest(index, 'downloadSpeed', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Upload (Mbps) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={test.uploadSpeed}
                      onChange={(e) => updateSpeedTest(index, 'uploadSpeed', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Ping (ms) *
                    </label>
                    <input
                      type="number"
                      required
                      value={test.ping}
                      onChange={(e) => updateSpeedTest(index, 'ping', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
            </div>
          </section>

          {/* Installed Applications */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 shadow-lg">4</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Installed Applications</span>
            </h3>
            <div className="space-y-6">
            {formData.installedApps.map((app, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <h4 className="font-bold text-gray-900">Application {index + 1}</h4>
                  </div>
                  {formData.installedApps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeInstalledApp(index)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                      title="Remove Application"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Application Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={app.name}
                      onChange={(e) => updateInstalledApp(index, 'name', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      placeholder="e.g., Microsoft Office"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Version *
                    </label>
                    <input
                      type="text"
                      required
                      value={app.version}
                      onChange={(e) => updateInstalledApp(index, 'version', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm font-mono"
                      placeholder="e.g., 16.0.18129.20116"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Notes
                    </label>
                    <textarea
                      value={app.notes}
                      onChange={(e) => updateInstalledApp(index, 'notes', e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm resize-none"
                      rows={2}
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
              </div>
            ))}
            </div>
            <button
              type="button"
              onClick={addInstalledApp}
              className="flex items-center space-x-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-3 rounded-xl font-medium transition-all duration-200 border-2 border-dashed border-blue-300 hover:border-blue-400 w-full justify-center"
            >
              <Plus className="w-5 h-5" />
              <span>Add Another Application</span>
            </button>
          </section>

          {/* PC Specifications */}
          <section>
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 shadow-lg">5</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">PC Specifications</span>
            </h3>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 shadow-inner space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Operating System *
                  </label>
                  <select
                    required
                    value={formData.operatingSystem}
                    onChange={(e) => handleInputChange('operatingSystem', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Select OS</option>
                    {getOSOptions().map(os => (
                      <option key={os} value={os}>{os}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    PC Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.pcModel}
                    onChange={(e) => handleInputChange('pcModel', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                    placeholder="e.g., Dell Inspiron 15 3000"
                  />
                </div>
              </div>

              {/* Processor section */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Processor *
                </label>
                {formData.computerType === 'Windows' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <select
                      required
                      value={formData.processor.brand}
                      onChange={(e) => handleInputChange('processor', e.target.value, 'brand')}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                    >
                      <option value="">Select Brand</option>
                      <option value="Intel">Intel</option>
                      <option value="AMD">AMD</option>
                    </select>
                    <select
                      required
                      value={formData.processor.series}
                      onChange={(e) => handleInputChange('processor', e.target.value, 'series')}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                      disabled={!formData.processor.brand}
                    >
                      <option value="">Select Series</option>
                      {getSeriesOptions().map(series => (
                        <option key={series} value={series}>{series}</option>
                      ))}
                    </select>
                    <select
                      required
                      value={formData.processor.generation}
                      onChange={(e) => handleInputChange('processor', e.target.value, 'generation')}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                    >
                      <option value="">Select Generation</option>
                      {GENERATIONS.map(gen => (
                        <option key={gen} value={gen}>{gen}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <select
                    required
                    value={formData.processor.macProcessor}
                    onChange={(e) => handleInputChange('processor', e.target.value, 'macProcessor')}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Select Processor</option>
                    {MAC_PROCESSORS.map(proc => (
                      <option key={proc} value={proc}>{proc}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Memory (RAM) *
                  </label>
                  <select
                    required
                    value={formData.memory}
                    onChange={(e) => handleInputChange('memory', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Select Memory</option>
                    {MEMORY_OPTIONS.map(mem => (
                      <option key={mem} value={mem}>{mem}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Graphics *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.graphics}
                    onChange={(e) => handleInputChange('graphics', e.target.value)}
                    placeholder="e.g., NVIDIA RTX 3060, Intel Iris XE"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Storage *
                  </label>
                  <select
                    required
                    value={formData.storage}
                    onChange={(e) => handleInputChange('storage', e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                  >
                    <option value="">Select Storage</option>
                    {STORAGE_OPTIONS.map(storage => (
                      <option key={storage} value={storage}>{storage}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Form Actions */}
          </form>
        </div>

        {/* Footer with action buttons */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="entry-form"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl hover:from-blue-700 hover:to-purple-800 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isEditing ? 'Update Entry' : 'Create Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}