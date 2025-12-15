import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { apiClient } from './lib/api';
import { LoginForm } from './components/LoginForm';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { FeedbackForm } from './components/FeedbackForm';

function AppContent() {
  const { state } = useApp();
  
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <Dashboard />
      </main>
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