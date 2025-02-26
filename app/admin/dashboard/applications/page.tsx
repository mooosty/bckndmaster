'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface Application {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  projectImage?: string;
  status: 'pending' | 'approved' | 'rejected';
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const fetchApplications = async () => {
    if (!user?.email) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/applications', {
        headers: {
          'Authorization': `Bearer ${user.email}`
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
      console.error('Error fetching applications:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (applicationId: string, action: 'approve' | 'reject') => {
    if (!user?.email) return;

    try {
      setProcessingId(applicationId);
      
      const response = await fetch('/api/admin/applications', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.email}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: applicationId, action })
      });

      if (!response.ok) {
        throw new Error('Failed to update application');
      }

      const data = await response.json();
      if (data.success) {
        // Update local state
        setApplications(apps => apps.map(app => 
          app.id === applicationId 
            ? { ...app, status: action === 'approve' ? 'approved' : 'rejected' }
            : app
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

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true;
    return app.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-[#f5efdb] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5efdb] mx-auto mb-4"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => fetchApplications()}
            className="inline-block px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a18] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display text-[#f5efdb] mb-2">
            Collaboration Applications
          </h1>
          <p className="text-[#f5efdb99]">
            Review and manage collaboration requests from users
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === status
                  ? 'bg-[#f5efdb] text-[#2a2a28]'
                  : 'text-[#f5efdb] hover:bg-[#f5efdb1a]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="bg-[#2a2a28] rounded-lg border border-[#f5efdb1a] divide-y divide-[#f5efdb1a]">
          {filteredApplications.length === 0 ? (
            <div className="p-6 text-center text-[#f5efdb99]">
              No {filter === 'all' ? '' : filter} applications found
            </div>
          ) : (
            filteredApplications.map((application) => (
              <div
                key={application.id}
                className="p-6 hover:bg-[#2a2a2899] transition-colors"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Project Image */}
                  {application.projectImage && (
                    <div className="relative w-full lg:w-48 h-32 rounded-lg overflow-hidden">
                      <Image
                        src={application.projectImage}
                        alt={application.projectName}
                        fill
                        style={{ objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Application Details */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div>
                        <Link
                          href={`/admin/dashboard/projects/${application.projectId}`}
                          className="text-xl font-display text-[#f5efdb] hover:opacity-80 transition-opacity"
                        >
                          {application.projectName}
                        </Link>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                            application.status === 'approved'
                              ? 'bg-green-500/10 text-green-400'
                              : application.status === 'rejected'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </span>
                          <span className="inline-block px-3 py-1 rounded-full text-sm bg-[#f5efdb1a] text-[#f5efdb99]">
                            {application.userId}
                          </span>
                        </div>
                      </div>
                      <div className="text-[#f5efdb66] text-sm">
                        Submitted {new Date(application.submittedAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-[#f5efdb99] text-sm mb-1">About</h3>
                        <p className="text-[#f5efdb]">{application.about}</p>
                      </div>
                      <div>
                        <h3 className="text-[#f5efdb99] text-sm mb-1">Collaboration Proposal</h3>
                        <p className="text-[#f5efdb]">{application.collaboration}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {application.status === 'pending' && (
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleAction(application.id, 'approve')}
                          disabled={!!processingId}
                          className={`px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            processingId === application.id ? 'animate-pulse' : ''
                          }`}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(application.id, 'reject')}
                          disabled={!!processingId}
                          className={`px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            processingId === application.id ? 'animate-pulse' : ''
                          }`}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 