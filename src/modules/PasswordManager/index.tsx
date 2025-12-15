import React, { useState, useEffect } from 'react';
import { 
  Key, Plus, Search, Filter, Eye, Edit, Trash2, Star, Globe, 
  User, Shield, AlertTriangle, Copy, Zap, Lock, Unlock,
  BarChart3, TrendingUp, CheckCircle, XCircle, Clock, FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/api';
import { 
  PasswordEntry, 
  SecureNote, 
  VaultStats, 
  DEFAULT_CATEGORIES,
  COMMON_TAGS 
} from '../../types/password';
import { 
  analyzePasswordStrength, 
  checkPasswordReuse, 
  isPasswordCompromised 
} from '../../utils/passwordUtils';
import { AddEditPasswordModal } from '../../components/AddEditPasswordModal';
import { ViewPasswordModal } from '../../components/ViewPasswordModal';
import { PasswordGeneratorModal } from '../../components/PasswordGeneratorModal';

export function PasswordManagerModule() {
  const { state } = useApp();
  const canManage = state.currentUser?.role === 'global-admin' || 
                   (state.currentUser?.role === 'module-admin' && state.currentUser?.modulePermissions?.includes('password-manager'));

  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [secureNotes, setSecureNotes] = useState<SecureNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPasswords();
    loadSecureNotes();
  }, []);

  const loadPasswords = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getPasswordEntries();
      setPasswords(data);
    } catch (error) {
      console.error('Error loading passwords:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecureNotes = async () => {
    try {
      const data = await apiClient.getSecureNotes();
      setSecureNotes(data);
    } catch (error) {
      console.error('Error loading secure notes:', error);
    }
  };
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);
  const [viewingPassword, setViewingPassword] = useState<PasswordEntry | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [securityFilter, setSecurityFilter] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'all' | 'favorites' | 'weak' | 'compromised' | 'notes'>('all');


  // Calculate vault statistics
  const calculateVaultStats = (): VaultStats => {
    const allPasswords = passwords.map(p => p.password);
    const weakPasswords = passwords.filter(p => analyzePasswordStrength(p.password).score < 2).length;
    const reusedPasswords = passwords.filter(p => checkPasswordReuse(p.password, allPasswords)).length;
    const compromisedPasswords = passwords.filter(p => p.isCompromised).length;
    
    const totalIssues = weakPasswords + reusedPasswords + compromisedPasswords;
    const vaultHealth = passwords.length > 0 ? Math.max(0, 100 - (totalIssues / passwords.length) * 100) : 100;

    return {
      totalPasswords: passwords.length,
      weakPasswords,
      reusedPasswords,
      compromisedPasswords,
      secureNotes: secureNotes.length,
      vaultHealth: Math.round(vaultHealth),
    };
  };

  const stats = calculateVaultStats();

  // Filter passwords
  const filteredPasswords = passwords.filter(password => {
    const matchesSearch = password.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         password.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || 
    (password.category && password.category.id === categoryFilter);
    const matchesTag = tagFilter === 'all' || password.tags.includes(tagFilter);
    
    let matchesSecurity = true;
    switch (securityFilter) {
      case 'weak':
        matchesSecurity = analyzePasswordStrength(password.password).score < 2;
        break;
      case 'compromised':
        matchesSecurity = password.isCompromised;
        break;
      case 'strong':
        matchesSecurity = analyzePasswordStrength(password.password).score >= 3;
        break;
    }
    
    let matchesView = true;
    switch (selectedView) {
      case 'favorites':
        matchesView = password.isFavorite;
        break;
      case 'weak':
        matchesView = analyzePasswordStrength(password.password).score < 2;
        break;
      case 'compromised':
        matchesView = password.isCompromised;
        break;
    }
    
    return matchesSearch && matchesCategory && matchesTag && matchesSecurity && matchesView;
  });

  const handleSavePassword = async (passwordData: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    try {
      if (editingPassword) {
        await apiClient.updatePasswordEntry(editingPassword.id, passwordData);
        setEditingPassword(null);
      } else {
        await apiClient.createPasswordEntry(passwordData);
      }
      setShowAddModal(false);
      await loadPasswords();
    } catch (error) {
      console.error('Error saving password:', error);
      alert('Failed to save password. Please try again.');
    }
  };

  const handleEditPassword = (password: PasswordEntry) => {
    setEditingPassword(password);
    setShowAddModal(true);
  };

  const handleDeletePassword = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this password? This action cannot be undone.')) {
      try {
        await apiClient.deletePasswordEntry(id);
        await loadPasswords();
      } catch (error) {
        console.error('Error deleting password:', error);
        alert('Failed to delete password. Please try again.');
      }
    }
  };

  const handleViewPassword = (password: PasswordEntry) => {
    // Update last used timestamp
    setPasswords(prev => prev.map(p => 
      p.id === password.id 
        ? { ...p, lastUsed: new Date().toISOString() }
        : p
    ));
    setViewingPassword(password);
  };

  const toggleFavorite = (id: string) => {
    setPasswords(prev => prev.map(password => 
      password.id === id 
        ? { ...password, isFavorite: !password.isFavorite, updatedAt: new Date().toISOString() }
        : password
    ));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert(`${label} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const views = [
    { id: 'all', name: 'All Items', count: passwords.length, icon: Key },
    { id: 'favorites', name: 'Favorites', count: passwords.filter(p => p.isFavorite).length, icon: Star },
    { id: 'weak', name: 'Weak Passwords', count: passwords.filter(p => analyzePasswordStrength(p.password).score < 2).length, icon: AlertTriangle },
    { id: 'compromised', name: 'Compromised', count: passwords.filter(p => p.isCompromised).length, icon: XCircle },
    { id: 'notes', name: 'Secure Notes', count: secureNotes.length, icon: FileText },
  ];

  const allTags = [...new Set(passwords.flatMap(p => p.tags))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Key className="w-8 h-8 mr-3 text-blue-600" />
            Password Manager
          </h2>
          <p className="text-gray-600 mt-1">
            Secure password storage and management ({passwords.length} passwords stored)
          </p>
        </div>
        {canManage && (
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowGenerator(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all flex items-center space-x-2 font-medium text-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Generate Password</span>
            </button>
            <button 
              onClick={() => {
                setShowAddModal(true);
                setEditingPassword(null);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all flex items-center space-x-2 font-medium text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Password</span>
            </button>
          </div>
        )}
      </div>

      {/* Vault Health Dashboard */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-3">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900">Vault Health Score</h3>
              <p className="text-blue-700 text-sm">Overall security assessment of your passwords</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${
              stats.vaultHealth >= 80 ? 'text-green-600' :
              stats.vaultHealth >= 60 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {stats.vaultHealth}%
            </div>
            <p className="text-sm text-blue-700">Health Score</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Passwords</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalPasswords}</p>
              </div>
              <Key className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Weak Passwords</p>
                <p className="text-2xl font-bold text-red-900">{stats.weakPasswords}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-600 text-sm font-medium">Reused Passwords</p>
                <p className="text-2xl font-bold text-orange-900">{stats.reusedPasswords}</p>
              </div>
              <Copy className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Compromised</p>
                <p className="text-2xl font-bold text-purple-900">{stats.compromisedPasswords}</p>
              </div>
              <XCircle className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Security Recommendations */}
        {(stats.weakPasswords > 0 || stats.compromisedPasswords > 0 || stats.reusedPasswords > 0) && (
          <div className="mt-6 bg-white rounded-lg p-4 border border-orange-200">
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Security Recommendations
            </h4>
            <div className="space-y-1 text-sm text-orange-800">
              {stats.weakPasswords > 0 && (
                <p>• Update {stats.weakPasswords} weak password{stats.weakPasswords > 1 ? 's' : ''}</p>
              )}
              {stats.compromisedPasswords > 0 && (
                <p>• Change {stats.compromisedPasswords} compromised password{stats.compromisedPasswords > 1 ? 's' : ''} immediately</p>
              )}
              {stats.reusedPasswords > 0 && (
                <p>• Create unique passwords for {stats.reusedPasswords} reused password{stats.reusedPasswords > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
            {/* Views */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Views</h3>
              <div className="space-y-1">
                {views.map(view => {
                  const IconComponent = view.icon;
                  return (
                    <button
                      key={view.id}
                      onClick={() => setSelectedView(view.id as any)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedView === view.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <span className="text-sm">{view.name}</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedView === view.id
                          ? 'bg-blue-200 text-blue-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {view.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm">All Categories</span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                    {passwords.length}
                  </span>
                </button>
                {DEFAULT_CATEGORIES.map(category => {
                  const count = passwords.filter(p => p.category && p.category.id === category.id).length;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setCategoryFilter(category.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        categoryFilter === category.id
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search passwords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
              
              <select
                value={securityFilter}
                onChange={(e) => setSecurityFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Security</option>
                <option value="strong">Strong Passwords</option>
                <option value="weak">Weak Passwords</option>
                <option value="compromised">Compromised</option>
              </select>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>{filteredPasswords.length} items</span>
              </div>
            </div>
          </div>

          {/* Password List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {filteredPasswords.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium">No passwords found</p>
                <p className="text-sm">Try adjusting your filters or add your first password</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPasswords.map((password) => {
                  const strength = analyzePasswordStrength(password.password);
                  return (
                    <div
                      key={password.id}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className={`w-12 h-12 rounded-full ${password.category?.color || 'bg-gray-400'} flex items-center justify-center text-white font-bold text-lg`}>  
                            {password.title?.charAt(0).toUpperCase() || '?'}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {password.title}
                              </h3>
                              {password.isFavorite && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                              )}
                              {password.isCompromised && (
                                <div className="flex items-center space-x-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                                  <XCircle className="w-3 h-3" />
                                  <span>Compromised</span>
                                </div>
                              )}
                              {strength.score < 2 && (
                                <div className="flex items-center space-x-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Weak</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              {password.website && (
                                <div className="flex items-center space-x-1">
                                  <Globe className="w-4 h-4" />
                                  <span className="truncate">{password.website}</span>
                                </div>
                              )}
                              {password.username && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-4 h-4" />
                                  <span className="truncate">{password.username}</span>
                                </div>
                              )}
                              {password.lastUsed && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>Used {new Date(password.lastUsed).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                            
                            {password.tags.length > 0 && (
                              <div className="flex items-center space-x-2 mt-2">
                                {password.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {password.tags.length > 3 && (
                                  <span className="text-xs text-gray-500">+{password.tags.length - 3} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toggleFavorite(password.id)}
                            className={`p-2 rounded-lg transition-all ${
                              password.isFavorite 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title="Toggle Favorite"
                          >
                            <Star className={`w-4 h-4 ${password.isFavorite ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => copyToClipboard(password.password, 'Password')}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                            title="Copy Password"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewPassword(password)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditPassword(password)}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all"
                            title="Edit Password"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePassword(password.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Password"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {(showAddModal || editingPassword) && (
        <AddEditPasswordModal
          entry={editingPassword}
          onClose={() => {
            setShowAddModal(false);
            setEditingPassword(null);
          }}
          onSave={handleSavePassword}
        />
      )}

      {viewingPassword && (
        <ViewPasswordModal
          entry={viewingPassword}
          onClose={() => setViewingPassword(null)}
          onEdit={handleEditPassword}
        />
      )}

      {showGenerator && (
        <PasswordGeneratorModal
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  );
}