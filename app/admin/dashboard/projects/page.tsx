'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Project {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  status: 'COMING_SOON' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  name: string;
  overview?: {
    description: string;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer admin@darknightlabs.com`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        
        if (data.success) {
          setProjects(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch projects');
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects
    .filter(project => {
      const searchTermLower = searchTerm.toLowerCase();
      const name = project?.name || '';
      const description = project?.overview?.description || '';
      
      return name.toLowerCase().includes(searchTermLower) ||
             description.toLowerCase().includes(searchTermLower);
    })
    .filter(project => 
      statusFilter === 'all' ? true : project?.status === statusFilter
    );

  const statusColors = {
    'COMING_SOON': 'text-[#f5efdb] bg-[#f5efdb1a]',
    'OPEN': 'text-green-400 bg-green-400/10',
    'IN_PROGRESS': 'text-blue-400 bg-blue-400/10',
    'COMPLETED': 'text-gray-400 bg-gray-400/10'
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display text-[#f5efdb]">Projects</h1>
        <Link
          href="/admin/dashboard/projects/new"
          className="px-4 py-2 rounded-lg bg-[#f5efdb] text-[#2a2a28] hover:opacity-90 transition-all"
        >
          Create New Project
        </Link>
      </div>

      {/* Filters Section */}
      <div className="rounded-xl p-4 backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a]">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-wrap gap-2">
            {['all', 'COMING_SOON', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  statusFilter === status
                    ? 'bg-[#f5efdb] text-[#2a2a28]'
                    : 'border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]'
                }`}
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6 h-[300px]" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#f5efdb99]">No projects available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="group rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6 transition-all hover:bg-[#2a2a2855]"
            >
              {/* Project Image */}
              <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                <img
                  src={project.imageUrl}
                  alt={project.title}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                />
              </div>

              {/* Project Info */}
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-display text-[#f5efdb]">{project.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm ${statusColors[project.status]}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-[#f5efdb99] line-clamp-2">{project.description}</p>

                {/* Action Button */}
                <Link 
                  href={`/admin/dashboard/projects/${project.id}`}
                  className="block w-full px-4 py-2 rounded-lg bg-[#f5efdb] text-[#2a2a28] font-medium hover:opacity-90 transition-all text-center"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 