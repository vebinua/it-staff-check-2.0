import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { AVAILABLE_MODULES } from '../modules';

interface ModuleContainerProps {
  moduleId: string;
  onClose: () => void;
  onBack: () => void;
}

export function ModuleContainer({ moduleId, onClose, onBack }: ModuleContainerProps) {
  const module = AVAILABLE_MODULES.find(m => m.id === moduleId);

  if (!module || !module.component) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Module Not Found</h2>
            <p className="text-sm text-gray-600 mb-6">The requested module could not be loaded.</p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white h-10 px-4 py-2 text-sm rounded-lg hover:bg-blue-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const ModuleComponent = module.component;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-4 text-white flex-shrink-0 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">{module.name}</h2>
              <p className="text-blue-100 mt-0.5 text-sm">{module.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1.5 transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Module Content */}
      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        <ModuleComponent />
      </div>
    </div>
  );
}