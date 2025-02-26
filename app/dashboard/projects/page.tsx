'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  coverImage: string;
  status: 'COMING_SOON' | 'LIVE' | 'ENDED';
  overview: {
    description: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Static featured projects
const FEATURED_PROJECTS = [
  {
    id: 'fitchin',
    name: 'Fitchin',
    coverImage: '/FITCHIN.jpg',
    status: 'COMING_SOON' as const,
    overview: {
      description: 'The biggest eSports organization in Latin American. Co-founded by Kun Aguero. Incubated by Swissborg',
    },
    tags: ['NFT', 'Free Airdrop'],
    isStatic: true,
  },
  {
    id: 'estatex',
    name: 'EstateX',
    coverImage: '/ESTATX.png',
    status: 'COMING_SOON' as const,
    overview: {
      description: 'EstateX is revolutionizing the $300 Trillion property market, offering a comprehensive suite of Real Estate Web3 (RWA) solutions, simplifying real estate investing, lending, and ownership. Partnered with ReMax. Investor: Brock Pierce (co-founder USDT). Launching on Seedify and Swissborg',
    },
    tags: ['Free Airdrop'],
    isStatic: true,
  },
  {
    id: 'karate-combat',
    name: 'Karate Combat',
    coverImage: '/KC.png',
    status: 'COMING_SOON' as const,
    overview: {
      description: "Crypto's first sport. Coming soon",
    },
    tags: ['NFT', 'Free Airdrop'],
    isStatic: true,
  },
  {
    id: 'samsung-nft',
    name: 'Samsung NFT',
    coverImage: '/SAMSUNG.jpg',
    status: 'COMING_SOON' as const,
    overview: {
      description: 'Samsung, the leading tech brand is launching their official NFT soon... Want some whitelists? Stay tuned',
    },
    tags: ['NFT', 'Coming Soon'],
    isStatic: true,
  },
];

export default function ProjectsPage() {
  const { user } = useDynamicContext();
  const [mounted, setMounted] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/projects', {
          headers: {
            'Authorization': `Bearer ${user.email}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }

        const data = await response.json();
        console.log('API Response:', data);
        
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

    if (mounted) {
      fetchProjects();
    }
  }, [user, mounted]);

  if (!mounted) {
    return null;
  }

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
    'COMING_SOON': 'text-[#f5efdb] bg-[#f5efdb1a] border-[#f5efdb33]',
    'LIVE': 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    'ENDED': 'text-gray-400 bg-gray-400/10 border-gray-400/20'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a18] via-[#2a2a28] to-[#1a1a18]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section with Gradient Text */}
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-display font-bold">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5efdb] to-[#a39b7d]">
              Explore Projects
            </span>
          </h1>
          <p className="mt-2 text-[#f5efdb99] max-w-2xl">
            Discover and join innovative blockchain projects. Apply your skills and be part of the future.
          </p>
        </div>

        {/* Enhanced Filters Section */}
        <div className="rounded-2xl backdrop-blur-xl bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Search Input with Icon */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-[#f5efdb66]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] 
                  placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33] focus:ring-1 focus:ring-[#f5efdb33]
                  transition-all duration-200"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {['all', 'COMING_SOON', 'LIVE', 'ENDED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                    statusFilter === status
                      ? 'bg-[#f5efdb] text-[#2a2a28] shadow-lg shadow-[#f5efdb]/10'
                      : 'border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]'
                  }`}
                >
                  {status === 'all' ? 'All Projects' : status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl p-6 bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* Projects Grid with Enhanced Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse rounded-2xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6 h-[400px]">
                <div className="h-48 bg-[#f5efdb1a] rounded-xl mb-4" />
                <div className="h-6 bg-[#f5efdb1a] rounded w-3/4 mb-3" />
                <div className="h-4 bg-[#f5efdb1a] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#f5efdb1a] mb-4">
              <svg className="h-8 w-8 text-[#f5efdb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-xl font-display text-[#f5efdb] mb-2">No Projects Available</h3>
            <p className="text-[#f5efdb99]">Check back soon for new opportunities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dynamic Projects First */}
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="group rounded-2xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6 
                  transition-all duration-200 hover:bg-[#2a2a2855] hover:border-[#f5efdb33]"
              >
                {/* Project Image with Overlay */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
                  <img
                    src={project.coverImage}
                    alt={project.name}
                    className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Project Info */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-display text-[#f5efdb] group-hover:text-white transition-colors">
                      {project.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[project.status]}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-[#f5efdb99] line-clamp-2 group-hover:text-[#f5efdb] transition-colors">
                    {project.overview.description}
                  </p>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded-full text-xs bg-[#f5efdb1a] text-[#f5efdb99]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* View Details Button */}
                  <div className="pt-4 flex items-center justify-between">
                    <span className="text-[#f5efdb] font-medium group-hover:text-white transition-colors">
                      View Details
                    </span>
                    <svg 
                      className="w-5 h-5 text-[#f5efdb] transform transition-transform group-hover:translate-x-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}

            {/* Featured Static Projects */}
            {FEATURED_PROJECTS.map((project) => (
              <div
                key={project.id}
                className="group rounded-2xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6 
                  transition-all duration-200 hover:bg-[#2a2a2855] hover:border-[#f5efdb33] cursor-not-allowed"
              >
                {/* Project Image with Overlay */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
                  <img
                    src={project.coverImage}
                    alt={project.name}
                    className="object-cover w-full h-full transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>

                {/* Project Info */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-display text-[#f5efdb] transition-colors">
                      {project.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm border ${statusColors[project.status]}`}>
                      COMING SOON
                    </span>
                  </div>

                  <p className="text-[#f5efdb99] line-clamp-3 transition-colors">
                    {project.overview.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 rounded-full text-xs bg-[#f5efdb1a] text-[#f5efdb99]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 