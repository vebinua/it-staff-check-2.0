import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Link, Copy, Send, User, Building, CheckCircle, 
  Star, BarChart3, Calendar, Download, X 
} from 'lucide-react';
import { apiClient } from '../../lib/api';

interface FeedbackLink {
  id: string;
  staffName: string;
  customerName: string;
  client: 'CG' | 'GIL' | 'Coach' | 'Student' | 'External' | 'NVDA' | 'Others';
  taskName: string;
  generatedLink: string;
  createdAt: string;
  createdBy: string;
  responses: number;
  averageRating: number;
  isUsed: boolean;
  usedAt?: string;
}

interface FeedbackResponse {
  id: string;
  linkId: string;
  rating: number;
  comments: string;
  submittedAt: string;
  clientInfo: {
    name?: string;
    email?: string;
    company?: string;
  };
}

export function CustomerServiceFeedbackModule() {
  const [feedbackLinks, setFeedbackLinks] = useState<FeedbackLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeedbackLinks();
  }, []);

  const loadFeedbackLinks = async () => {
    try {
      setLoading(true);
      const links = await apiClient.getFeedbackLinks();
      setFeedbackLinks(links);
    } catch (error) {
      console.error('Error loading feedback links:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const [feedbackResponses, setFeedbackResponses] = useState<FeedbackResponse[]>([]);
  const [showFeedbackResults, setShowFeedbackResults] = useState(false);
  const [selectedLinkForResults, setSelectedLinkForResults] = useState<string | null>(null);


  const [formData, setFormData] = useState({
    staffName: '',
    customerName: '',
    client: '' as 'CG' | 'GIL' | 'Coach' | 'Student' | 'External' | 'NVDA' | 'Others' | '',
    taskName: ''
  });

  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Staff names - in a real app, this would come from your user database
  const staffNames = [
    'John Smith',
    'Sarah Johnson',
    'Mike Davis',
    'Emily Chen',
    'David Wilson',
    'Lisa Anderson',
    'Tom Brown',
    'Anna Garcia'
  ];

  const clientOptions = [
    { value: 'CG', label: 'CG' },
    { value: 'GIL', label: 'GIL' },
    { value: 'Coach', label: 'Coach' },
    { value: 'Student', label: 'Student' },
    { value: 'External', label: 'External' },
    { value: 'NVDA', label: 'NVDA' },
    { value: 'Others', label: 'Others' }
  ];

  const generateFeedbackLink = async () => {
    if (!formData.staffName || !formData.customerName || !formData.client || !formData.taskName) {
      alert('Please fill in all required fields');
      return;
    }

    // Generate a unique link ID
    const linkId = Math.random().toString(36).substring(2, 15);
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/feedback?id=${linkId}`;

    try {
      await apiClient.createFeedbackLink({
        staffName: formData.staffName,
        customerName: formData.customerName,
        client: formData.client as 'CG' | 'GIL' | 'Coach' | 'Student' | 'External' | 'NVDA' | 'Others',
        taskName: formData.taskName,
        generatedLink: link
      });

      await loadFeedbackLinks();
      setGeneratedLink(link);
      setShowSuccess(true);

      // Reset form
      setFormData({
        staffName: '',
        customerName: '',
        client: '',
        taskName: ''
      });
    } catch (error) {
      console.error('Error creating feedback link:', error);
      alert('Failed to create feedback link. Please try again.');
    }

    // Hide success message after 5 seconds
    setTimeout(() => {
      setShowSuccess(false);
      setGeneratedLink('');
    }, 5000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const viewFeedbackResults = async (linkId: string) => {
    setSelectedLinkForResults(linkId);
    setShowFeedbackResults(true);
 
    try {
      const responses = await apiClient.getFeedbackResponses(linkId);
      setFeedbackResponses(responses);
    } catch (error) {
      console.error('Error loading feedback responses:', error);
    }
  };

  const getResponsesForLink = (linkId: string) => {
    return feedbackResponses.filter(response => response.linkId === linkId);
  };

  // Calculate stats
  const totalLinks = feedbackLinks.length;
  const totalResponses = feedbackResponses.length;
  const averageRating = totalResponses > 0 
    ? feedbackResponses.reduce((sum, response) => sum + response.rating, 0) / totalResponses
    : 0;
  const responseRate = totalLinks > 0 ? (totalResponses / totalLinks) * 100 : 0;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-indigo-600" />
            Customer Service Feedback
          </h2>
          <p className="text-gray-600 mt-1">
            Generate feedback links and manage customer service evaluations ({totalLinks} total links)
          </p>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && generatedLink && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="bg-green-100 rounded-full p-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">Feedback Link Generated Successfully!</h3>
              <div className="bg-white border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-gray-800 font-mono break-all">{generatedLink}</code>
                  <button
                    onClick={() => copyToClipboard(generatedLink)}
                    className="ml-3 flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-green-800 mt-2">
                Share this link with your client to collect their feedback on the service provided.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100">
              <Link className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Links</p>
              <p className="text-2xl font-semibold text-gray-900">{totalLinks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Responses</p>
              <p className="text-2xl font-semibold text-gray-900">{totalResponses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900">{averageRating.toFixed(1)}</p>
              <div className="flex items-center mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= averageRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Response Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{responseRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Link Generator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Link className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Feedback Link Generator</h3>
              <p className="text-indigo-100 text-sm">Create personalized feedback links for your clients</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Staff Name (Your Name): *
              </label>
              <select
                value={formData.staffName}
                onChange={(e) => handleInputChange('staffName', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
              >
                <option value="">-- Select staff name --</option>
                {staffNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name: *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => handleInputChange('customerName', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                placeholder="Enter customer's full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client: *
              </label>
              <select
                value={formData.client}
                onChange={(e) => handleInputChange('client', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                required
              >
                <option value="">-- Select client --</option>
                {clientOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Name: *
              </label>
              <input
                type="text"
                value={formData.taskName}
                onChange={(e) => handleInputChange('taskName', e.target.value)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                placeholder="Enter the task or service provided"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={generateFeedbackLink}
              className="bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-3"
            >
              <Link className="w-5 h-5" />
              <span>Generate Feedback Link</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated Links History */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Generated Feedback Links ({feedbackLinks.length})</h3>
            </div>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all flex items-center space-x-2 font-medium text-sm">
              <Download className="w-4 h-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated Link
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Link Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbackLinks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-lg font-medium">No feedback links generated</p>
                      <p className="text-sm">Start by generating your first feedback link</p>
                    </div>
                  </td>
                </tr>
              ) : (
                feedbackLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-indigo-100 rounded-full p-2 mr-3">
                          <User className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="font-medium text-gray-900">{link.staffName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{link.customerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        link.client === 'CG' ? 'bg-blue-100 text-blue-800' :
                        link.client === 'GIL' ? 'bg-green-100 text-green-800' :
                        link.client === 'Coach' ? 'bg-purple-100 text-purple-800' :
                        link.client === 'Student' ? 'bg-yellow-100 text-yellow-800' :
                        link.client === 'External' ? 'bg-orange-100 text-orange-800' :
                        link.client === 'NVDA' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <Building className="w-3 h-3 mr-1" />
                        {link.client}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{link.taskName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded max-w-xs truncate">
                          {link.generatedLink.replace('http://localhost:5173', 'https://techassetmanagement.abledonline.com')}
                        </code>
                        {!link.isUsed && (
                          <button
                            onClick={() => copyToClipboard(link.generatedLink.replace('http://localhost:5173', 'https://techassetmanagement.abledonline.com'))}
                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors"
                            title="Copy Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        link.isUsed 
                          ? 'bg-gray-100 text-gray-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {link.isUsed ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Used
                          </>
                        ) : (
                          <>
                            <Link className="w-3 h-3 mr-1" />
                            Active
                          </>
                        )}
                      </span>
                      {link.isUsed && link.usedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(link.usedAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{link.responses}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {link.responses > 0 ? (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= link.averageRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {link.averageRating.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No responses</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <div>
                          <div>{new Date(link.createdAt).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(link.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewFeedbackResults(link.id)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="View Feedback Results"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {!link.isUsed ? (
                          <>
                            <button
                              onClick={() => copyToClipboard(link.generatedLink)}
                              className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="Copy Link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => window.open(link.generatedLink, '_blank')}
                              className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
                              title="Open Link"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">Link used</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2 text-indigo-600" />
            Feedback by Client
          </h3>
          <div className="space-y-3">
            {clientOptions.map(client => {
              const clientLinks = feedbackLinks.filter(link => link.client === client.value);
              const clientResponses = clientLinks.reduce((sum, link) => sum + link.responses, 0);
              const clientAvgRating = clientLinks.length > 0 
                ? clientLinks.reduce((sum, link) => sum + (link.averageRating * link.responses), 0) / clientResponses || 0
                : 0;

              return (
                <div key={client.value} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      client.value === 'CG' ? 'bg-blue-100 text-blue-800' :
                      client.value === 'GIL' ? 'bg-green-100 text-green-800' :
                      client.value === 'Coach' ? 'bg-purple-100 text-purple-800' :
                      client.value === 'Student' ? 'bg-yellow-100 text-yellow-800' :
                      client.value === 'External' ? 'bg-orange-100 text-orange-800' :
                      client.value === 'NVDA' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {client.label}
                    </span>
                    <span className="text-sm text-gray-600">{clientLinks.length} links</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-900">{clientResponses} responses</span>
                    {clientResponses > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{clientAvgRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {feedbackLinks.slice(0, 5).map((link) => (
              <div key={link.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-indigo-100 rounded-full p-2">
                  <Link className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {link.staffName} → {link.customerName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {link.client} • {link.taskName} • {new Date(link.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {link.isUsed ? (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-xs font-medium text-gray-900">{link.averageRating.toFixed(1)}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">Active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-indigo-900 mb-4">Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Overall Satisfaction</h4>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= averageRating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xl font-bold text-indigo-600">{averageRating.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-600">Based on {totalResponses} responses</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Response Rate</h4>
            <p className="text-2xl font-bold text-purple-600">{responseRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">{totalResponses} of {totalLinks} links responded</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Active Links</h4>
            <p className="text-2xl font-bold text-green-600">{totalLinks}</p>
            <p className="text-sm text-gray-600">Generated this month</p>
          </div>
        </div>
      </div>

      {/* Feedback Results Modal */}
      {showFeedbackResults && selectedLinkForResults && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="bg-white/20 rounded-full p-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Feedback Results</h2>
                    <p className="text-green-100 text-sm">View submitted feedback responses</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowFeedbackResults(false);
                    setSelectedLinkForResults(null);
                  }}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 min-h-0">
              {(() => {
                const selectedLink = feedbackLinks.find(link => link.id === selectedLinkForResults);
                const responses = getResponsesForLink(selectedLinkForResults);
                
                if (!selectedLink) {
                  return (
                    <div className="text-center py-12">
                      <p className="text-gray-500">Link not found</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6">
                    {/* Link Information */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-4">Service Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-green-700">Staff Member</label>
                          <p className="font-semibold text-green-900">{selectedLink.staffName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-green-700">Customer</label>
                          <p className="font-semibold text-green-900">{selectedLink.customerName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-green-700">Client</label>
                          <p className="font-semibold text-green-900">{selectedLink.client}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-green-700">Task</label>
                          <p className="font-semibold text-green-900">{selectedLink.taskName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Feedback Summary */}
                    {responses.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <div className="bg-blue-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-blue-600 font-medium">Total Responses</p>
                            <p className="text-2xl font-bold text-blue-900">{responses.length}</p>
                          </div>
                          <div className="bg-yellow-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-yellow-600 font-medium">Average Rating</p>
                            <div className="flex items-center justify-center space-x-2">
                              <p className="text-2xl font-bold text-yellow-900">
                                {(responses.reduce((sum, r) => sum + r.rating, 0) / responses.length).toFixed(1)}
                              </p>
                              <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= (responses.reduce((sum, r) => sum + r.rating, 0) / responses.length) 
                                        ? 'text-yellow-400 fill-current' 
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4 text-center">
                            <p className="text-sm text-green-600 font-medium">Response Rate</p>
                            <p className="text-2xl font-bold text-green-900">100%</p>
                            <p className="text-xs text-green-600">Link used</p>
                          </div>
                        </div>

                        {/* Individual Responses */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">Individual Responses</h4>
                          {responses.map((response, index) => (
                            <div key={response.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-blue-100 rounded-full p-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {response.clientInfo?.name || `Anonymous Customer ${index + 1}`}
                                    </p>
                                    {response.clientInfo?.company && (
                                      <p className="text-sm text-gray-600">{response.clientInfo.company}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center space-x-2">
                                    <div className="flex items-center">
                                      {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= response.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <span className="font-semibold text-gray-900">{response.rating}/5</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(response.submittedAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              
                              {response.comments && (
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <label className="block text-sm font-medium text-gray-600 mb-1">Comments</label>
                                  <p className="text-gray-900 text-sm whitespace-pre-wrap">{response.comments}</p>
                                </div>
                              )}
                              
                              {response.clientInfo?.email && (
                                <div className="mt-3">
                                  <label className="block text-sm font-medium text-gray-600">Contact Email</label>
                                  <p className="text-gray-900 text-sm">{response.clientInfo.email}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {responses.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-lg font-medium">No feedback responses yet</p>
                        <p className="text-sm">Responses will appear here once customers submit feedback</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowFeedbackResults(false);
                    setSelectedLinkForResults(null);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}