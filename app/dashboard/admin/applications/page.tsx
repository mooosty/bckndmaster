'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

interface Application {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  projectImage?: string;
  status: 'pending' | 'accepted' | 'rejected';
  about: string;
  collaboration: string;
  submittedAt: string;
  updatedAt: string;
}

export default function AdminApplicationsPage() {
  const { user } = useDynamicContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/admin/applications', {
          headers: {
            'Authorization': `Bearer ${user?.email ?? 'admin@darknightlabs.com'}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }

        const data = await response.json();
        if (data.success) {
          setApplications(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch applications');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user?.email]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user?.email ?? 'admin@darknightlabs.com'}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, action })
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      const data = await response.json();
      if (data.success) {
        // Update the application status in the local state
        setApplications(apps => apps.map(app => 
          app.id === id ? { ...app, status: action === 'approve' ? 'accepted' : 'rejected' } : app
        ));
      } else {
        throw new Error(data.error || 'Failed to update application');
      }
    } catch (err) {
      console.error('Error updating application:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Image
          src="/empty-state.svg"
          alt="No applications"
          width={200}
          height={200}
          className="mb-8"
        />
        <h2 className="text-2xl font-semibold mb-4">No Applications Yet</h2>
        <p className="text-gray-600 mb-8">There are no collaboration requests to review at this time.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Collaboration Requests</h1>
      <div className="grid gap-6">
        {applications.map((application) => (
          <div key={application.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">{application.projectName}</h3>
                <p className="text-gray-600 mb-4">
                  Submitted {format(new Date(application.submittedAt), 'PPP')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {application.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleAction(application.id, 'approve')}
                      disabled={!!processingId}
                      className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ${
                        processingId === application.id ? 'cursor-wait' : ''
                      }`}
                    >
                      {processingId === application.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(application.id, 'reject')}
                      disabled={!!processingId}
                      className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 ${
                        processingId === application.id ? 'cursor-wait' : ''
                      }`}
                    >
                      {processingId === application.id ? 'Processing...' : 'Reject'}
                    </button>
                  </>
                ) : (
                  <span className={`px-3 py-1 rounded ${
                    application.status === 'accepted' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">About</h4>
              <p className="text-gray-700 mb-4">{application.about}</p>
              <h4 className="font-semibold mb-2">Collaboration Proposal</h4>
              <p className="text-gray-700">{application.collaboration}</p>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link 
                href={`/projects/${application.projectId}`}
                className="text-blue-500 hover:text-blue-600"
              >
                View Project Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 