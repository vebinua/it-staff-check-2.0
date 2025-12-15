import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { FeedbackForm } from './FeedbackForm';

interface FeedbackLink {
  id: string;
  staffName: string;
  customerName: string;
  client: string;
  taskName: string;
  generatedLink: string;
  createdAt: string;
  createdBy: string;
  responses: number;
  averageRating: number;
}

export function FeedbackRouter() {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('id');
  
  // In a real application, you would fetch the feedback link data from your database
  // Feedback links validated via MySQL API
  const getFeedbackLinkData = (id: string): FeedbackLink | null => {
    // This would be replaced with an actual API call
    const mockData: FeedbackLink = {
      id: id,
      staffName: 'John Smith',
      customerName: 'Sample Customer',
      client: 'CG',
      taskName: 'System Setup and Configuration',
      generatedLink: `https://feedback.company.com/survey/${id}`,
      createdAt: new Date().toISOString(),
      createdBy: 'Admin User',
      responses: 0,
      averageRating: 0
    };
    return mockData;
  };

  const handleFeedbackSubmit = (feedback: {
    rating: number;
    comments: string;
    clientInfo: {
      name?: string;
      email?: string;
      company?: string;
    };
  }) => {
    // In a real application, this would save to your database
    console.log('Feedback submitted:', {
      linkId,
      ...feedback,
      submittedAt: new Date().toISOString()
    });
    
    // You could also update the feedback link's response count and average rating
  };

  if (!linkId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Feedback Link</h1>
          <p className="text-gray-600">The feedback link you're trying to access is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const feedbackData = getFeedbackLinkData(linkId);
  
  if (!feedbackData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Feedback Link Not Found</h1>
          <p className="text-gray-600">The feedback link you're looking for could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <FeedbackForm
      linkId={linkId}
      staffName={feedbackData.staffName}
      customerName={feedbackData.customerName}
      client={feedbackData.client}
      taskName={feedbackData.taskName}
      onSubmit={handleFeedbackSubmit}
    />
  );
}