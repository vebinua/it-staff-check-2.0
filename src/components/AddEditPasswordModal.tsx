import React, { useState, useEffect } from 'react';
import { X, Key, Eye, EyeOff, Globe, User, Mail, FileText, Tag, Star, Plus, Trash2, Zap } from 'lucide-react';
import { PasswordEntry, CustomField, DEFAULT_CATEGORIES, COMMON_TAGS } from '../types/password';
import { analyzePasswordStrength } from '../utils/passwordUtils';
import { PasswordGeneratorModal } from './PasswordGeneratorModal';

interface AddEditPasswordModalProps {
  entry: PasswordEntry | null;
  onClose: () => void;
  onSave: (entry: Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => void;
}

export function AddEditPasswordModal({ entry, onClose, onSave }: AddEditPasswordModalProps) {
  const isEditing = !!entry;
  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const [formData, setFormData] = useState<Omit<PasswordEntry, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & { category: string | null }>({
    title: '',
    website: '',
    username: '',
    email: '',
    password: '',
    notes: '',
    category: DEFAULT_CATEGORIES[0].id,  // ← store ID only
    isFavorite: false,
    isCompromised: false,
    tags: [] as string[],
    customFields: [] as CustomField[],
  });

  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        website: entry.website,
        username: entry.username,
        email: entry.email,
        password: entry.password,
        notes: entry.notes,
        category: entry.category?.id ?? null,  // ← save only ID or null
        isFavorite: entry.isFavorite,
        isCompromised: entry.isCompromised,
        tags: entry.tags,
        customFields: entry.customFields,
      });
    }
  }, [entry]);

  const passwordStrength = formData.password ? analyzePasswordStrength(formData.password) : null;

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!formData.title || !formData.password) {
  //     alert('Please fill in the title and password fields');
  //     return;
  //   }

  //   onSave(formData);
  // };

  const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.password) {
          alert('Please fill in the title and password fields');
          return;
        }

        // Convert `category` → `categoryId` so backend understands it
        const dataToSave = {
          ...formData,
          categoryId: formData.category,   // ← this is the fix
          category: undefined,             // optional: remove the old key
        };

        // @ts-ignore – TypeScript might complain, but it's fine
        delete dataToSave.category;

        onSave(dataToSave);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      label: '',
      value: '',
      type: 'text',
      isHidden: false,
    };
    setFormData(prev => ({
      ...prev,
      customFields: [...prev.customFields, newField],
    }));
  };

  const updateCustomField = (index: number, field: keyof CustomField, value: any) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map((cf, i) => 
        i === index ? { ...cf, [field]: value } : cf
      ),
    }));
  };

  const removeCustomField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index),
    }));
  };

  const handleUseGeneratedPassword = (password: string) => {
    setFormData(prev => ({ ...prev, password }));
    setShowGenerator(false);
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
                <h2 className="text-xl font-semibold">
                  {isEditing ? 'Edit Password' : 'Add New Password'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {isEditing ? 'Update password information' : 'Store a new password securely'}
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
          <form id="password-form" onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 shadow-md">1</span>
                <span className="text-gray-900">Basic Information</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Key className="w-4 h-4 inline mr-1" />
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                      placeholder="e.g., Gmail Account, Company Portal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Website/URL
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Password Section */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 shadow-md">2</span>
                <span className="text-gray-900">Password</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowGenerator(true)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1 rounded-lg transition-all text-sm"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm font-mono"
                      placeholder="Enter or generate a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength */}
                {passwordStrength && (
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
                      {passwordStrength.feedback.length > 0 && passwordStrength.score < 4 && (
                        <div className="mt-2">
                          <p className="font-medium">Suggestions:</p>
                          <ul className="list-disc list-inside space-y-1 text-xs">
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
            </section>

            {/* Category and Organization */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 shadow-md">3</span>
                <span className="text-gray-900">Category & Organization</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {DEFAULT_CATEGORIES.map((category) => (
                        <label
                          key={category.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                            formData.category === category.id
                              ? `${category.color} text-white border-current`
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="category"
                            value={category.id}
                            checked={formData.category === category.id}
                            onChange={() => handleInputChange('category', category.id)}  // ← save ID only
                            className="sr-only"
                          />
                          <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                          <span className="text-sm font-medium">{category.name}</span>
                        </label>
                      ))}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFavorite}
                      onChange={(e) => handleInputChange('isFavorite', e.target.checked)}
                      className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <Star className={`w-4 h-4 ${formData.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-700">Mark as favorite</span>
                  </label>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Tag className="w-4 h-4 inline mr-1" />
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COMMON_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                          formData.tags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Custom Fields */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 shadow-md">4</span>
                <span className="text-gray-900">Custom Fields</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 space-y-4">
                {formData.customFields.map((field, index) => (
                  <div key={field.id} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">Custom Field {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeCustomField(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Label</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm"
                          placeholder="Field name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateCustomField(index, 'type', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="password">Password</option>
                          <option value="url">URL</option>
                          <option value="email">Email</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                        <input
                          type={field.type === 'password' && !field.isHidden ? 'password' : 'text'}
                          value={field.value}
                          onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-sm"
                          placeholder="Field value"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addCustomField}
                  className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-4 py-3 rounded-xl font-medium transition-all duration-200 border-2 border-dashed border-blue-300 hover:border-blue-400"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Custom Field</span>
                </button>
              </div>
            </section>

            {/* Notes */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 shadow-md">5</span>
                <span className="text-gray-900">Additional Notes</span>
              </h3>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 bg-white text-sm resize-none"
                    placeholder="Additional notes, recovery information, or special instructions..."
                  />
                </div>
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
              form="password-form"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-xl hover:from-blue-700 hover:to-purple-800 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isEditing ? 'Update Password' : 'Save Password'}
            </button>
          </div>
        </div>

        {/* Password Generator Modal */}
        {showGenerator && (
          <PasswordGeneratorModal
            onClose={() => setShowGenerator(false)}
            onUsePassword={handleUseGeneratedPassword}
          />
        )}
      </div>
    </div>
  );
}