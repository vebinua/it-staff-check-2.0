import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { apiClient } from './lib/api';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { FeedbackForm } from './components/FeedbackForm';
import { UsersPage } from './pages/UsersPage';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { AddEditEntryModal } from './components/AddEditEntryModal';
import { EmailModal } from './components/EmailModal';
import { ViewDetailsModal } from './components/ViewDetailsModal';
import { ITCheckEntry } from './types';

type PageType = 'dashboard' | 'users' | 'activity';

function AppContent() {
  const { state } = useApp();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  // Lifted modal states from Dashboard
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ITCheckEntry | null>(null);
  const [emailEntry, setEmailEntry] = useState<ITCheckEntry | null>(null);
  const [viewingEntry, setViewingEntry] = useState<ITCheckEntry | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Check if this is a feedback form URL
  const urlParams = new URLSearchParams(window.location.search);
  const feedbackId = urlParams.get('id');

  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

  useEffect(() => {
    if (feedbackId) {
      loadFeedbackLink();
    } else {
      setFeedbackLoading(false);
    }
  }, [feedbackId]);

  const loadFeedbackLink = async () => {
    try {
      const data = await apiClient.getFeedbackLink(feedbackId!);
      setFeedbackData(data);
    } catch (error) {
      console.error('Error loading feedback link:', error);
      setFeedbackData(null);
    } finally {
      setFeedbackLoading(false);
    }
  };

  if (feedbackId) {
    if (feedbackLoading) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">Loading feedback form...</p>
          </div>
        </div>
      );
    }

    if (feedbackData) {
      const handleFeedbackSubmit = async (feedback: {
        rating: number;
        comments: string;
      }) => {
        try {
          await apiClient.submitFeedback(feedbackId, feedback);
          console.log('Feedback submitted successfully');
        } catch (error) {
          console.error('Error submitting feedback:', error);
          alert('Failed to submit feedback. Please try again.');
        }
      };

      return (
        <FeedbackForm
          linkId={feedbackId}
          staffName={feedbackData.staffName}
          customerName={feedbackData.customerName}
          client={feedbackData.client}
          taskName={feedbackData.taskName}
          onSubmit={handleFeedbackSubmit}
        />
      );
    } else {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Feedback Link Not Found</h1>
            <p className="text-gray-600">The feedback link you're trying to access is invalid or has expired.</p>
          </div>
        </div>
      );
    }
  }

  if (!state.currentUser) {
    return <LoginForm />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'users':
        return <UsersPage onBack={() => setCurrentPage('dashboard')} />;
      case 'activity':
        return <ActivityLogPage onBack={() => setCurrentPage('dashboard')} />;
      case 'dashboard':
      default:
        return (
          <Dashboard
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            editingEntry={editingEntry}
            setEditingEntry={setEditingEntry}
            emailEntry={emailEntry}
            setEmailEntry={setEmailEntry}
            viewingEntry={viewingEntry}
            setViewingEntry={setViewingEntry}
            selectedModule={selectedModule}
            setSelectedModule={setSelectedModule}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onNavigate={setCurrentPage} currentPage={currentPage} />
      <main className={currentPage === 'dashboard' ? '' : 'h-[calc(100vh-4rem)]'}>
        {renderPage()}
      </main>

      {/* Persistent modals that remain visible across page navigation */}
      {(showAddModal || editingEntry) && (
        <AddEditEntryModal
          entry={editingEntry || undefined}
          onClose={() => {
            setShowAddModal(false);
            setEditingEntry(null);
          }}
        />
      )}

      {emailEntry && (
        <EmailModal
          entry={emailEntry}
          onClose={() => setEmailEntry(null)}
        />
      )}

      {viewingEntry && (
        <ViewDetailsModal
          entry={viewingEntry}
          onClose={() => setViewingEntry(null)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;