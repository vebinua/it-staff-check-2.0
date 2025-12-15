import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, User, Shield, UserPlus, Users, Crown, Briefcase, Eye, Zap, Copy, EyeOff, Key } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User as UserType } from '../types';
import { AVAILABLE_MODULES } from '../modules';
import { generatePassword, analyzePasswordStrength } from '../utils/passwordUtils';

interface UserManagementModalProps {
  onClose: () => void;
}

export function UserManagementModal({ onClose }: UserManagementModalProps) {
  const { state, addUser, updateUser, deleteUser } = useApp();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [passwordOption, setPasswordOption] = useState<'manual' | 'generate'>('generate');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UserType | null>(null);
  const [resetPasswordOption, setResetPasswordOption] = useState<'manual' | 'generate'>('generate');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetGeneratedPassword, setResetGeneratedPassword] = useState('');
  const [resetPasswordStrength, setResetPasswordStrength] = useState<any>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    role: 'standard-user' as 'global-admin' | 'module-admin' | 'standard-user',
    modulePermissions: [] as string[],
    password: '',
  });

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      role: 'standard-user',
      modulePermissions: [],
      password: '',
    });
    setPasswordOption('generate');
    setGeneratedPassword('');
    setPasswordStrength(null);
    setShowPassword(false);
    setShowAddForm(false);
    setEditingUser(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if username already exists (excluding current user when editing)
    const existingUser = state.users.find(u => 
      u.username === formData.username && u.id !== editingUser?.id
    );
    
    if (existingUser) {
      alert('Username already exists. Please choose a different username.');
      return;
    }

    if (editingUser) {
      updateUser({
        ...editingUser,
        ...formData,
      });
    } else {
      addUser(formData);
    }

    resetForm();
  };

  const handleEdit = (user: UserType) => {
    setFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      modulePermissions: user.modulePermissions || [],
      password: '',
    });
    setPasswordOption('manual');
    setGeneratedPassword('');
    setPasswordStrength(null);
    setEditingUser(user);
    setShowAddForm(true);
  };

  const handleDelete = (id: string) => {
    if (state.currentUser?.id === id) {
      alert('You cannot delete your own account.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

  const handleResetPassword = (user: UserType) => {
    setResetPasswordUser(user);
    setResetPasswordOption('generate');
    setResetPasswordValue('');
    setResetGeneratedPassword('');
    setResetPasswordStrength(null);
    setShowResetPassword(false);
    setShowResetPasswordModal(true);
  };

  const generateResetPassword = () => {
    try {
      const password = generatePassword({
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        excludeAmbiguous: false,
      });
      setResetGeneratedPassword(password);
      setResetPasswordValue(password);
      setResetPasswordStrength(analyzePasswordStrength(password));
    } catch (error) {
      console.error('Error generating password:', error);
      alert('Failed to generate password. Please try again.');
    }
  };

  const confirmResetPassword = () => {
    if (!resetPasswordUser) return;

    const newPassword = resetPasswordOption === 'generate' ? resetGeneratedPassword : resetPasswordValue;

    if (!newPassword) {
      alert('Please set a password');
      return;
    }

    updateUser({
      ...resetPasswordUser,
      password: newPassword,
    });

    alert(`Password reset successfully for ${resetPasswordUser.name}!\n\nNew password: ${newPassword}\n\nMake sure to share this with the user securely.`);

    setShowResetPasswordModal(false);
    setResetPasswordUser(null);
    setResetPasswordValue('');
    setResetGeneratedPassword('');
    setResetPasswordStrength(null);
  };

  const generateSecurePassword = () => {
    try {
      const password = generatePassword({
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeSimilar: false,
        excludeAmbiguous: false,
      });
      setGeneratedPassword(password);
      setFormData(prev => ({ ...prev, password }));
      setPasswordStrength(analyzePasswordStrength(password));
    } catch (error) {
      console.error('Error generating password:', error);
      alert('Failed to generate password. Please try again.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Password copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score >= 3) return 'bg-green-100 text-green-800';
    if (score >= 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPasswordStrengthLabel = (score: number) => {
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

  const getPasswordStrengthBarColor = (score: number) => {
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

  // Update password strength when manual password changes
  React.useEffect(() => {
    if (passwordOption === 'manual' && formData.password) {
      setPasswordStrength(analyzePasswordStrength(formData.password));
    }
  }, [formData.password, passwordOption]);

  // Update reset password strength when manual password changes
  React.useEffect(() => {
    if (resetPasswordOption === 'manual' && resetPasswordValue) {
      setResetPasswordStrength(analyzePasswordStrength(resetPasswordValue));
    }
  }, [resetPasswordValue, resetPasswordOption]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4" />;
      case 'editor':
        return <Briefcase className="w-4 h-4" />;
      case 'hr':
        return <Eye className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-blue-500 to-purple-600 text-white';
      case 'editor':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'hr':
        return 'bg-gradient-to-r from-green-500 to-teal-500 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'global-admin':
        return 'Full system access, user management, activity logs';
      case 'module-admin':
        return 'Manage entries, send emails, view reports';
      case 'standard-user':
        return 'View-only access to entries and reports';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">User Management</h2>
                <p className="text-blue-100 mt-1">Manage system users and permissions</p>
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Users</p>
                  <p className="text-2xl font-bold text-blue-900">{state.users.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Admins</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {state.users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <Crown className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Module Admins</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {state.users.filter(u => u.role === 'module-admin').length}
                  </p>
                </div>
                <Briefcase className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Standard Users</p>
                  <p className="text-2xl font-bold text-green-900">
                    {state.users.filter(u => u.role === 'standard-user').length}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Add User Button */}
          {!showAddForm && (
            <div className="mb-8">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add New User</span>
              </button>
            </div>
          )}

          {/* Add/Edit User Form */}
          {showAddForm && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-8 border border-gray-200 shadow-inner">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-2">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                {/* Password Section - Only show when adding new user */}
                {!editingUser && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Password *
                    </label>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="passwordOption"
                            value="manual"
                            checked={passwordOption === 'manual'}
                            onChange={(e) => setPasswordOption(e.target.value as 'manual' | 'generate')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Set Password Manually</span>
                        </label>
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="passwordOption"
                            value="generate"
                            checked={passwordOption === 'generate'}
                            onChange={(e) => setPasswordOption(e.target.value as 'manual' | 'generate')}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Generate Secure Password</span>
                        </label>
                      </div>

                      {passwordOption === 'manual' ? (
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 font-mono"
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm">
                                {generatedPassword || 'Click generate to create password'}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={generateSecurePassword}
                              className="ml-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center space-x-2"
                            >
                              <Zap className="w-4 h-4" />
                              <span>Generate</span>
                            </button>
                          </div>
                          {generatedPassword && (
                            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                              <span className="text-sm text-green-800 font-medium">Secure password generated!</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(generatedPassword)}
                                className="text-green-600 hover:text-green-800 p-1 rounded transition-all"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Password Strength Indicator */}
                      {(formData.password || generatedPassword) && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Password Strength</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPasswordStrengthColor(passwordStrength?.score || 0)}`}>
                              {getPasswordStrengthLabel(passwordStrength?.score || 0)}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthBarColor(passwordStrength?.score || 0)}`}
                              style={{ width: `${((passwordStrength?.score || 0) / 4) * 100}%` }}
                            />
                          </div>
                          {passwordStrength && passwordStrength.feedback.length > 0 && passwordStrength.score < 4 && (
                            <div className="mt-2 text-xs text-gray-600">
                              <p className="font-medium">Suggestions:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {passwordStrength.feedback.slice(0, 2).map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'global-admin' | 'module-admin' | 'standard-user' }))}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white"
                  >
                    <option value="standard-user">Standard User - View Only</option>
                    <option value="module-admin">Module Admin - Manage Entries</option>
                    <option value="global-admin">Global Admin - Full Access</option>
                  </select>
                </div>
                
                {/* Module Permissions for Module Admin */}
                {formData.role === 'module-admin' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Module Permissions
                    </label>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {AVAILABLE_MODULES.filter(m => m.enabled && m.permissions.includes('module-admin')).map((module) => (
                          <label key={module.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.modulePermissions.includes(module.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    modulePermissions: [...prev.modulePermissions, module.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    modulePermissions: prev.modulePermissions.filter(id => id !== module.id)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{module.name}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Select which modules this Module Admin can access
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Module Permissions for Standard User */}
                {formData.role === 'standard-user' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Module Permissions
                    </label>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {AVAILABLE_MODULES.filter(m => m.enabled).map((module) => (
                          <label key={module.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.modulePermissions.includes(module.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({
                                    ...prev,
                                    modulePermissions: [...prev.modulePermissions, module.id]
                                  }));
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    modulePermissions: prev.modulePermissions.filter(id => id !== module.id)
                                  }));
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{module.name}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Select which modules this Standard User can view
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all duration-200 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-medium shadow-lg"
                  >
                    {editingUser ? 'Update User' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Users List */}
          <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-lg">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Users className="w-6 h-6 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  System Users ({state.users.length})
                </h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Role & Permissions
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {state.users.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-8 py-6">
                        <div className="flex items-center space-x-4">
                          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-3">
                            <User className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-lg">{user.name}</div>
                            {state.currentUser?.id === user.id && (
                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                Current User
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg text-gray-800">
                          {user.username}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-2">
                          <div className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getRoleColor(user.role)}`}>
                            {getRoleIcon(user.role)}
                            <span className="ml-2">
                              {user.role === 'global-admin' ? 'GLOBAL ADMIN' :
                               user.role === 'module-admin' ? 'MODULE ADMIN' :
                               user.role === 'standard-user' ? 'STANDARD USER' :
                               user.role.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 max-w-xs">
                            {getRoleDescription(user.role)}
                          </p>
                          {user.role === 'module-admin' && user.modulePermissions && user.modulePermissions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 font-medium">Module Access:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {user.modulePermissions.slice(0, 2).map(moduleId => {
                                  const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
                                  return module ? (
                                    <span key={moduleId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {module.name}
                                    </span>
                                  ) : null;
                                })}
                                {user.modulePermissions.length > 2 && (
                                  <span className="text-xs text-gray-500">+{user.modulePermissions.length - 2} more</span>
                                )}
                              </div>
                            </div>
                          )}
                          {user.role === 'standard-user' && user.modulePermissions && user.modulePermissions.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 font-medium">Module Access:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {user.modulePermissions.slice(0, 2).map(moduleId => {
                                  const module = AVAILABLE_MODULES.find(m => m.id === moduleId);
                                  return module ? (
                                    <span key={moduleId} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {module.name}
                                    </span>
                                  ) : null;
                                })}
                                {user.modulePermissions.length > 2 && (
                                  <span className="text-xs text-gray-500">+{user.modulePermissions.length - 2} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            title="Edit User"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200"
                            title="Reset Password"
                          >
                            <Key className="w-5 h-5" />
                          </button>
                          {state.currentUser?.id !== user.id && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200"
                              title="Delete User"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <div className="bg-amber-100 rounded-full p-2 mt-1">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-amber-900 mb-2">Security Notice</h4>
                <p className="text-sm text-amber-800 leading-relaxed">
                  All users use the default password <span className="font-mono bg-amber-100 px-2 py-1 rounded">password</span>. 
                  In a production environment, implement proper password management and require users to change their passwords on first login.
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

      {/* Reset Password Modal */}
      {showResetPasswordModal && resetPasswordUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <Key className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Reset Password</h2>
                    <p className="text-green-100 mt-1">Reset password for {resetPasswordUser.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* User Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 rounded-full p-3">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">User</p>
                    <p className="text-lg font-bold text-green-900">{resetPasswordUser.name}</p>
                    <p className="text-sm text-green-700 font-mono">{resetPasswordUser.username}</p>
                  </div>
                </div>
              </div>

              {/* Password Options */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  New Password *
                </label>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="resetPasswordOption"
                        value="manual"
                        checked={resetPasswordOption === 'manual'}
                        onChange={(e) => setResetPasswordOption(e.target.value as 'manual' | 'generate')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Set Password Manually</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="resetPasswordOption"
                        value="generate"
                        checked={resetPasswordOption === 'generate'}
                        onChange={(e) => setResetPasswordOption(e.target.value as 'manual' | 'generate')}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Generate Secure Password</span>
                    </label>
                  </div>

                  {resetPasswordOption === 'manual' ? (
                    <div className="relative">
                      <input
                        type={showResetPassword ? 'text' : 'password'}
                        required
                        value={resetPasswordValue}
                        onChange={(e) => setResetPasswordValue(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-all duration-200 font-mono"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResetPassword(!showResetPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm">
                            {resetGeneratedPassword || 'Click generate to create password'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={generateResetPassword}
                          className="ml-3 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center space-x-2"
                        >
                          <Zap className="w-4 h-4" />
                          <span>Generate</span>
                        </button>
                      </div>
                      {resetGeneratedPassword && (
                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                          <span className="text-sm text-green-800 font-medium">Secure password generated!</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(resetGeneratedPassword)}
                            className="text-green-600 hover:text-green-800 p-1 rounded transition-all"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Password Strength Indicator */}
                  {(resetPasswordValue || resetGeneratedPassword) && (
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Password Strength</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPasswordStrengthColor(resetPasswordStrength?.score || 0)}`}>
                          {getPasswordStrengthLabel(resetPasswordStrength?.score || 0)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthBarColor(resetPasswordStrength?.score || 0)}`}
                          style={{ width: `${((resetPasswordStrength?.score || 0) / 4) * 100}%` }}
                        />
                      </div>
                      {resetPasswordStrength && resetPasswordStrength.feedback.length > 0 && resetPasswordStrength.score < 4 && (
                        <div className="mt-2 text-xs text-gray-600">
                          <p className="font-medium">Suggestions:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {resetPasswordStrength.feedback.slice(0, 2).map((item: string, index: number) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-900 font-medium">Important</p>
                    <p className="text-xs text-amber-800 mt-1">
                      Make sure to securely share the new password with the user. They will need it to log in.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmResetPassword}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white rounded-xl focus:ring-4 focus:ring-green-200 transition-all duration-200 font-medium shadow-lg"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}