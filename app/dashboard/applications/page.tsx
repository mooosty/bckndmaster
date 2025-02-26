'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface Application {
  id: string;
  projectId: string;
  projectName: string;
  projectImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  details: {
    languages: { [key: string]: boolean };
    niches: { [key: string]: boolean | string };
    main_ecosystem: { [key: string]: boolean };
    audience_type: { [key: string]: boolean | string };
    main_socials: {
      [key: string]: {
        handle: string;
        audience_count: string;
      };
    };
    description: string;
  };
  submittedAt: string;
  updatedAt: string;
}

export default function ApplicationsPage() {
  const { user } = useDynamicContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplications = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/applications', {
          headers: {
            'Authorization': `Bearer ${user.email}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }

        const data = await response.json();
        if (data.success) {
          console.log('Raw API response:', data);
          console.log('Applications data:', data.data);
          console.log('First application details:', data.data[0]?.details);
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

    fetchApplications();
  }, [user]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    if (expandedId !== id) {
      const application = applications.find(app => app.id === id);
      console.log('Toggling application:', id);
      console.log('Application found:', application);
      console.log('Application details:', application?.details);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-[#f5efdb] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5efdb] mx-auto mb-4"></div>
          <p>Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#f5efdb1a] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#f5efdb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display text-[#f5efdb]">No Applications Yet</h2>
            <p className="text-[#f5efdb99]">
              You haven't applied to collaborate on any projects yet. Browse our available projects and submit your first collaboration request to get started.
            </p>
          </div>

          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#f5efdb] text-[#2a2a28] hover:opacity-90 transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Browse Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display text-[#f5efdb] mb-2">My Applications</h1>
        <p className="text-[#f5efdb99]">
          Track the status of your collaboration requests
        </p>
      </div>

      <div className="grid gap-6">
        {applications.map((application) => (
          <div
            key={application.id}
            className="rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a] p-6 hover:bg-[#2a2a2877] transition-colors"
          >
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Project Image */}
              {application.projectImage && (
                <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden">
                  <Image
                    src={application.projectImage}
                    alt={application.projectName}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Application Details */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <Link
                      href={`/dashboard/projects/${application.projectId}`}
                      className="text-xl font-display text-[#f5efdb] hover:opacity-80 transition-opacity"
                    >
                      {application.projectName}
                    </Link>
                    <div className="mt-1">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                        application.status === 'approved'
                          ? 'bg-green-500/10 text-green-400'
                          : application.status === 'rejected'
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[#f5efdb66] text-sm">
                    Submitted {new Date(application.submittedAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={() => toggleExpand(application.id)}
                  className="w-full text-left mb-4"
                >
                  <div className="flex items-center justify-between text-[#f5efdb] hover:opacity-80 transition-opacity">
                    <span className="font-medium">
                      {expandedId === application.id ? 'Hide Details' : 'Show Details'}
                    </span>
                    <svg
                      className={`w-5 h-5 transform transition-transform ${
                        expandedId === application.id ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedId === application.id && (
                  <div className="space-y-6 mt-4 pt-4 border-t border-[#f5efdb1a]">
                    {/* Languages */}
                    <div>
                      <h3 className="text-[#f5efdb99] text-sm mb-2">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {application.details?.languages && 
                          Object.entries(application.details.languages)
                            .filter(([_, value]) => value === true)
                            .map(([lang]) => (
                              <span key={lang} className="px-2 py-1 rounded-full bg-[#f5efdb1a] text-[#f5efdb] text-sm">
                                {lang}
                              </span>
                            ))}
                      </div>
                    </div>

                    {/* Niches */}
                    <div>
                      <h3 className="text-[#f5efdb99] text-sm mb-2">Niches</h3>
                      <div className="flex flex-wrap gap-2">
                        {application.details?.niches && 
                          Object.entries(application.details.niches)
                            .filter(([_, value]) => value === true || typeof value === 'string')
                            .map(([niche, value]) => (
                              <span key={niche} className="px-2 py-1 rounded-full bg-[#f5efdb1a] text-[#f5efdb] text-sm group relative">
                                {niche}
                                {typeof value === 'string' && value && (
                                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#2a2a28] text-[#f5efdb] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    {value}
                                  </span>
                                )}
                              </span>
                            ))}
                      </div>
                    </div>

                    {/* Main Ecosystem */}
                    <div>
                      <h3 className="text-[#f5efdb99] text-sm mb-2">Main Ecosystem</h3>
                      <div className="flex flex-wrap gap-2">
                        {application.details?.main_ecosystem && 
                          Object.entries(application.details.main_ecosystem)
                            .filter(([_, value]) => value === true)
                            .map(([ecosystem]) => (
                              <span key={ecosystem} className="px-2 py-1 rounded-full bg-[#f5efdb1a] text-[#f5efdb] text-sm">
                                {ecosystem}
                              </span>
                            ))}
                      </div>
                    </div>

                    {/* Audience Type */}
                    <div>
                      <h3 className="text-[#f5efdb99] text-sm mb-2">Audience Type</h3>
                      <div className="flex flex-wrap gap-2">
                        {application.details?.audience_type && 
                          Object.entries(application.details.audience_type)
                            .filter(([_, value]) => value === true || typeof value === 'string')
                            .map(([type, value]) => (
                              <span key={type} className="px-2 py-1 rounded-full bg-[#f5efdb1a] text-[#f5efdb] text-sm group relative">
                                {type}
                                {typeof value === 'string' && value && (
                                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-[#2a2a28] text-[#f5efdb] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    {value}
                                  </span>
                                )}
                              </span>
                            ))}
                      </div>
                    </div>

                    {/* Main Socials */}
                    <div>
                      <h3 className="text-[#f5efdb99] text-sm mb-2">Social Media Presence</h3>
                      <div className="grid gap-4">
                        {application.details?.main_socials && 
                          Object.entries(application.details.main_socials)
                            .filter(([_, data]) => data.handle)
                            .map(([platform, data]) => (
                              <div key={platform} className="flex items-center justify-between bg-[#f5efdb0d] rounded-lg p-3">
                                <div>
                                  <span className="text-[#f5efdb] font-medium capitalize">{platform}</span>
                                  <span className="text-[#f5efdb99] ml-2">@{data.handle}</span>
                                </div>
                                <span className="text-[#f5efdb99]">{data.audience_count} followers</span>
                              </div>
                            ))}
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <h3 className="text-[#f5efdb99] text-sm mb-2">Additional Information</h3>
                      <p className="text-[#f5efdb] whitespace-pre-wrap">{application.details?.description || 'No additional information provided.'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 