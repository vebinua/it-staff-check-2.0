import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Copy, Settings, Shield, Zap } from 'lucide-react';
import { PasswordGeneratorSettings, PasswordStrength } from '../types/password';
import { generatePassword, analyzePasswordStrength } from '../utils/passwordUtils';

interface PasswordGeneratorModalProps {
  onClose: () => void;
  onUsePassword?: (password: string) => void;
}

export function PasswordGeneratorModal({ onClose, onUsePassword }: PasswordGeneratorModalProps) {
  const [settings, setSettings] = useState<PasswordGeneratorSettings>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
    excludeAmbiguous: false,
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    generateNewPassword();
  }, [settings]);

  const generateNewPassword = () => {
    try {
      const password = generatePassword(settings);
      setGeneratedPassword(password);
      setPasswordStrength(analyzePasswordStrength(password));
    } catch (error) {
      console.error('Error generating password:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      alert('Password copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleUsePassword = () => {
    if (onUsePassword) {
      onUsePassword(generatedPassword);
    }
    onClose();
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-2">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Password Generator</h2>
                <p className="text-blue-100 text-sm">Generate secure passwords with custom settings</p>
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

        <div className="p-8 space-y-6">
          {/* Generated Password Display */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Password</h3>
              <button
                onClick={generateNewPassword}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate</span>
              </button>
            </div>
            
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <code className="text-lg font-mono text-gray-900 break-all flex-1 mr-4">
                  {generatedPassword}
                </code>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Password Strength */}
            {passwordStrength && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Password Strength</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    passwordStrength.score >= 3 ? 'bg-green-100 text-green-800' :
                    passwordStrength.score >= 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {getStrengthLabel(passwordStrength.score)}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength.score)}`}
                    style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Estimated crack time:</strong> {passwordStrength.crackTime}</p>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium">Suggestions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Generator Settings */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-2">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Generator Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Password Length */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Password Length</label>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {settings.length} characters
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={settings.length}
                  onChange={(e) => setSettings(prev => ({ ...prev, length: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>8</span>
                  <span>64</span>
                </div>
              </div>

              {/* Character Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includeUppercase}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeUppercase: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">Uppercase (A-Z)</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includeLowercase}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeLowercase: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">Lowercase (a-z)</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includeNumbers}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeNumbers: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">Numbers (0-9)</span>
                </label>

                <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.includeSymbols}
                    onChange={(e) => setSettings(prev => ({ ...prev, includeSymbols: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-medium text-gray-900">Symbols (!@#$)</span>
                </label>
              </div>

              {/* Advanced Options */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Options</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.excludeSimilar}
                      onChange={(e) => setSettings(prev => ({ ...prev, excludeSimilar: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Exclude similar characters</span>
                      <p className="text-xs text-gray-500">Avoid i, l, 1, L, o, 0, O</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.excludeAmbiguous}
                      onChange={(e) => setSettings(prev => ({ ...prev, excludeAmbiguous: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Exclude ambiguous characters</span>
                      <p className="text-xs text-gray-500">Avoid {}, [], (), /, \, ', ", `, ~, etc.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 hover:border-gray-400 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            {onUsePassword && (
              <button
                onClick={handleUsePassword}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition-all duration-200 flex items-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>Use This Password</span>
              </button>
            )}
            <button
              onClick={copyToClipboard}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl hover:from-blue-700 hover:to-purple-800 font-medium transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Password</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}