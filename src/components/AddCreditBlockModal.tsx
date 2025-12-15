import React, { useState } from 'react';
import { X, CreditCard, Calendar, Plus } from 'lucide-react';
import { CreditBlock } from '../types';

interface AddCreditBlockModalProps {
  existingBlocks: CreditBlock[];
  onClose: () => void;
  onSave: (block: Omit<CreditBlock, 'id' | 'addedBy' | 'timestamp'>) => void;
}

export function AddCreditBlockModal({ existingBlocks, onClose, onSave }: AddCreditBlockModalProps) {
  const [formData, setFormData] = useState({
    purchaseDate: new Date().toISOString().split('T')[0],
    totalCredits: 100,
  });

  const nextBlockNumber = Math.max(...existingBlocks.map(b => b.blockNumber), 0) + 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.purchaseDate || formData.totalCredits <= 0) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    const blockData = {
      blockNumber: nextBlockNumber,
      purchaseDate: formData.purchaseDate,
      totalCredits: formData.totalCredits,
      isActive: true,
    };

    onSave(blockData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-1.5">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Add Credit Block</h2>
                <p className="text-green-100 text-xs">Purchase a new credit block</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Block Information */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-inner">
            <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center">
              <CreditCard className="w-4 h-4 mr-2 text-green-600" />
              Block Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Block Number
                </label>
                <div className="w-full border border-gray-200 rounded-md px-2 py-1.5 bg-gray-100 text-gray-600 font-mono text-sm">
                  Block {nextBlockNumber}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Auto-generated based on existing blocks</p>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white text-sm"
                />
              </div>
            </div>
            
            <div className="mt-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Total Credits *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.totalCredits}
                  onChange={(e) => handleInputChange('totalCredits', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-white text-sm"
                  placeholder="100"
                />
                <p className="text-xs text-gray-500 mt-0.5">Standard block is 100 credits</p>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-medium text-green-900 mb-2 flex items-center text-sm">
              <Calendar className="w-3 h-3 mr-2" />
              Block Preview
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white p-2 rounded-md">
                <p className="text-xs text-gray-600">Block Number</p>
                <p className="font-medium text-gray-900 text-sm">Block {nextBlockNumber}</p>
              </div>
              <div className="bg-white p-2 rounded-md">
                <p className="text-xs text-gray-600">Credits</p>
                <p className="font-medium text-green-600 text-sm">{formData.totalCredits} credits</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 hover:border-gray-400 font-medium transition-all duration-200 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-all duration-200 flex items-center space-x-1 text-sm"
            >
              <Plus className="w-3 h-3" />
              <span>Add Credit Block</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}