import React, { useState } from 'react';
import { X, Package, Wrench, Key, BarChart3, Shield, TrendingUp, Building2, DollarSign, FileCheck, Scan, Settings, Grid3X3, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AVAILABLE_MODULES, MODULE_CATEGORIES, getEnabledModules } from '../modules';

interface ModulesModalProps {
  onClose: () => void;
  onModuleSelect: (moduleId: string) => void;
}

export function ModulesModal({ onClose, onModuleSelect }: ModulesModalProps) {
  const { state } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const userRole = state.currentUser?.role || 'standard-user';
  const enabledModules = getEnabledModules(userRole, state.currentUser?.modulePermissions);
  
  const filteredModules = selectedCategory === 'all' 
    ? enabledModules 
    : enabledModules.filter(module => module.category === selectedCategory);

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      Package, Wrench, Key, BarChart3, Shield, TrendingUp, Building2, DollarSign, FileCheck, Scan
    };
    return icons[iconName] || Package;
  };

  const getCategoryIcon = (iconName: string) => {
    const icons: { [key: string]: React.ComponentType<any> } = {
      Package, Wrench, BarChart3, Shield, TrendingUp
    };
    return icons[iconName] || Package;
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? CheckCircle : Clock;
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (enabled: boolean) => {
    return enabled ? 'Available' : 'Coming Soon';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Grid3X3 className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">System Modules</h2>
                <p className="text-blue-100 mt-1">Explore and access additional features and capabilities</p>
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

        <div className="p-8 overflow-y-auto flex-1 min-h-0">
          {/* Category Filter */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Modules ({enabledModules.length})
              </button>
              {MODULE_CATEGORIES.map((category) => {
                const IconComponent = getCategoryIcon(category.icon);
                const categoryModules = enabledModules.filter(m => m.category === category.id);
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      selectedCategory === category.id
                        ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{category.name} ({categoryModules.length})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => {
              const IconComponent = getIcon(module.icon);
              const StatusIcon = getStatusIcon(module.enabled);
              
              return (
                <div
                  key={module.id}
                  className={`bg-white border-2 rounded-2xl p-6 transition-all duration-200 ${
                    module.enabled
                      ? 'border-gray-200 hover:border-blue-300 hover:shadow-lg cursor-pointer transform hover:-translate-y-1'
                      : 'border-gray-100 opacity-75'
                  }`}
                  onClick={() => module.enabled && onModuleSelect(module.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${
                      module.enabled 
                        ? 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100' 
                        : 'bg-gray-50 border border-gray-200'
                    }`}>
                      <IconComponent className={`w-8 h-8 ${
                        module.enabled ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(module.enabled)}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{getStatusText(module.enabled)}</span>
                    </div>
                  </div>
                  
                  <h3 className={`text-lg font-bold mb-2 ${
                    module.enabled ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {module.name}
                  </h3>
                  
                  <p className={`text-sm mb-4 leading-relaxed ${
                    module.enabled ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                    {module.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Permissions:</span>
                      <div className="flex space-x-1">
                        {module.permissions.map((permission) => (
                          <span
                            key={permission}
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              permission === 'admin'
                                ? 'bg-blue-100 text-blue-800'
                                : permission === 'editor'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {permission.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {module.enabled && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md">
                        Open Module
                      </button>
                    </div>
                  )}
                  
                  {!module.enabled && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-center space-x-2 text-gray-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>Coming Soon</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredModules.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Grid3X3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium">No modules found</p>
              <p className="text-sm">Try selecting a different category</p>
            </div>
          )}

          {/* Module Info */}
          <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 rounded-full p-2 mt-1">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Module System</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  The module system allows you to access additional features based on your role permissions. 
                  Enabled modules are fully functional, while "Coming Soon" modules are planned for future releases.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-8 py-6 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}