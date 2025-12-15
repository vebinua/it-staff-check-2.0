import React, { useState } from 'react';
import { X, History, CreditCard, Calendar, TrendingUp, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { CreditBlock, ChapmanCGLogEntry } from '../types';

interface CreditHistoryModalProps {
  creditBlocks: CreditBlock[];
  logEntries: ChapmanCGLogEntry[];
  onAddBlock: () => void;
  onDeleteBlock: (id: string) => void;
  onClose: () => void;
}

export function CreditHistoryModal({ creditBlocks, logEntries, onAddBlock, onDeleteBlock, onClose }: CreditHistoryModalProps) {
  const totalCreditsPurchased = creditBlocks.reduce((sum, block) => sum + block.totalCredits, 0);
  const totalCreditsUsed = logEntries.reduce((sum, entry) => sum + entry.creditConsumed, 0);
  const remainingCredits = totalCreditsPurchased - totalCreditsUsed;
  const totalBlocks = creditBlocks.length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-2">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Credit History</h2>
                <p className="text-purple-100 mt-1 text-sm">Track credit block usage and renewals</p>
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

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-xs font-medium">Total Blocks</p>
                  <p className="text-xl font-semibold text-blue-900">{totalBlocks}</p>
                </div>
                <CreditCard className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-xs font-medium">Total Credits Purchased</p>
                  <p className="text-xl font-semibold text-purple-900">{totalCreditsPurchased}</p>
                </div>
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-xs font-medium">Credits Used</p>
                  <p className="text-xl font-semibold text-green-900">{totalCreditsUsed.toFixed(2)}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-xs font-medium">Remaining Credits</p>
                  <p className={`text-xl font-semibold ${remainingCredits < 0 ? 'text-red-900' : 'text-orange-900'}`}>
                    {remainingCredits.toFixed(2)}
                  </p>
                  {remainingCredits < 0 && (
                    <p className="text-xs text-red-600 font-normal">Over budget</p>
                  )}
                </div>
                {remainingCredits < 0 ? (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <Calendar className="w-6 h-6 text-orange-500" />
                )}
              </div>
            </div>
          </div>

          {/* Add Block Button */}
          <div className="mb-6">
            <button
              onClick={onAddBlock}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-sm hover:shadow-md text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Credit Block</span>
            </button>
          </div>

          {/* Credit Blocks Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <History className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Credit Blocks ({totalBlocks})</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Block #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Purchase Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Total Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Added By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {creditBlocks.map((block) => (
                    <tr 
                      key={block.id} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 rounded-full p-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="font-semibold text-gray-900">Block {block.blockNumber}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {new Date(block.purchaseDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(block.purchaseDate).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {block.totalCredits} credits
                        </div>
                        <div className="text-sm text-gray-500">
                          Purchased block
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                          block.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {block.isActive ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <CreditCard className="w-3 h-3 mr-1" />
                          )}
                          {block.isActive ? 'Active' : 'Purchased'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium text-sm">{block.addedBy}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(block.timestamp).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onDeleteBlock(block.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                            title="Delete Block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Credit Usage Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-3 text-sm">Credit Usage Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-1 text-sm">Total Credits Purchased</h5>
                <p className="text-lg font-semibold text-blue-600">{totalCreditsPurchased}</p>
                <p className="text-sm text-gray-600">From {totalBlocks} blocks</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-1 text-sm">Credits Used</h5>
                <p className="text-lg font-semibold text-purple-600">{totalCreditsUsed.toFixed(2)}</p>
                <p className="text-sm text-gray-600">From {logEntries.length} entries</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-1 text-sm">Remaining Credits</h5>
                <p className={`text-lg font-semibold ${remainingCredits < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {remainingCredits.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  {remainingCredits < 0 ? 'Over budget' : 'Available'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}