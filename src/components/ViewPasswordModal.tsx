import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, Globe, User, Mail, FileText, Tag, Star, Copy, Edit, Calendar, Shield, AlertTriangle } from 'lucide-react';
import { PasswordEntry } from '../types/password';
import { analyzePasswordStrength } from '../utils/passwordUtils';

interface ViewPasswordModalProps {
  entry: PasswordEntry;
  onClose: () => void;
  onEdit: (entry: PasswordEntry) => void;
}

export function ViewPasswordModal({ entry, onClose, onEdit }: ViewPasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState<{ [key: string]: boolean }>({});

  const passwordStrength = analyzePasswordStrength(entry.password);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const toggleCustomFieldVisibility = (fieldId: string) => {
    setShowCustomFields(prev => ({
      ...prev,
      [fieldId]: !prev[fieldId]
    }));
  };

  const getStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'Unknown';
    }
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
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold">{entry.title}</h2>
                  {entry.isFavorite && (
                    <Star className="w-5 h-5 text-yellow-300 fill-current" />
                  )}
                </div>
                <p className="text-blue-100 text-sm">{entry.website || 'No website specified'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => onEdit(entry)}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                title="Edit Password"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 p-8 space-y-8">
          {/* Security Alerts */}
          {(entry.isCompromised || passwordStrength.score < 2) && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-start space-x-3">
                <div className="bg-red-100 rounded-full p-2">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Security Alert</h3>
                  <div className="space-y-2 text-sm text-red-800">
                    {entry.isCompromised && (
                      <p>• This password has been found in known data breaches</p>
                    )}
                    {passwordStrength.score < 2 && (
                      <p>• This password is weak and should be updated</p>
                    )}
                  </div>
                  <button
                    onClick={() => onEdit(entry)}
                    className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm font-medium"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2 text-blue-600" />
              Login Information
            </h3>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
              {entry.website && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Website</label>
                      <a 
                        href={entry.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {entry.website}
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(entry.website, 'Website URL')}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}

              {entry.username && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Username</label>
                      <p className="text-gray-900 font-medium">{entry.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(entry.username, 'Username')}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}

              {entry.email && (
                <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 font-medium">{entry.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(entry.email, 'Email')}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Password</label>
                    <div className="flex items-center space-x-3">
                      <code className="text-gray-900 font-mono">
                        {showPassword ? entry.password : '•'.repeat(entry.password.length)}
                      </code>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-all"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(entry.password, 'Password')}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {/* Password Strength */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Password Strength</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    passwordStrength.score >= 3 ? 'bg-green-100 text-green-800' :
                    passwordStrength.score >= 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStrengthLabel(passwordStrength.score)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Estimated crack time:</strong> {passwordStrength.crackTime}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                    <div className={`flex items-center ${passwordStrength.hasUppercase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordStrength.hasUppercase ? '✓' : '✗'} Uppercase
                    </div>
                    <div className={`flex items-center ${passwordStrength.hasLowercase ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordStrength.hasLowercase ? '✓' : '✗'} Lowercase
                    </div>
                    <div className={`flex items-center ${passwordStrength.hasNumbers ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordStrength.hasNumbers ? '✓' : '✗'} Numbers
                    </div>
                    <div className={`flex items-center ${passwordStrength.hasSymbols ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordStrength.hasSymbols ? '✓' : '✗'} Symbols
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Custom Fields */}
          {entry.customFields.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Custom Fields ({entry.customFields.length})
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-3">
                {entry.customFields.map((field) => (
                  <div key={field.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-600">{field.label}</label>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-900 font-medium">
                            {field.type === 'password' && !showCustomFields[field.id] 
                              ? '•'.repeat(field.value.length)
                              : field.value
                            }
                          </span>
                          {field.type === 'password' && (
                            <button
                              onClick={() => toggleCustomFieldVisibility(field.id)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded transition-all"
                            >
                              {showCustomFields[field.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(field.value, field.label)}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {entry.tags.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-blue-600" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Notes */}
          {entry.notes && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Notes
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-gray-900 whitespace-pre-wrap">{entry.notes}</p>
                </div>
              </div>
            </section>
          )}

          {/* Metadata */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Information</h3>
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Category</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <div 
                      className="w-3 h-3 rounded-full bg-gray-300 flex-shrink-0"
                      style={{ 
                        backgroundColor: entry.category?.color || undefined 
                      }}
                    />
                    <span className="text-gray-900 font-medium">
                      {entry.category?.name || 'No Category'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Created</label>
                  <p className="text-gray-900 font-medium">{new Date(entry.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Last Updated</label>
                  <p className="text-gray-900 font-medium">{new Date(entry.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              {entry.lastUsed && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Last used: {new Date(entry.lastUsed).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-between">
            <button
              onClick={() => onEdit(entry)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Password</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 font-medium transition-all duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}