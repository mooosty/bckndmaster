'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import Link from 'next/link';

interface Stats {
  totalProjects: number;
  openProjects: number;
  activeApplications: number;
  completedTasks: number;
}

export default function DashboardPage() {
  const { user } = useDynamicContext();
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    openProjects: 0,
    activeApplications: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.email) return;

      try {
        const response = await fetch('/api/stats', {
          headers: {
            'Authorization': `Bearer ${user.email}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
      href: '/dashboard/projects'
    },
    {
      title: 'Open Projects',
      value: stats.openProjects,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: '/dashboard/projects?status=OPEN'
    },
    {
      title: 'Active Applications',
      value: stats.activeApplications,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/dashboard/applications'
    },
    {
      title: 'Completed Tasks',
      value: stats.completedTasks,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      href: '/dashboard/tasks'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-display font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f5efdb] to-[#a39b7d]">
            Welcome Back
          </span>
        </h1>
        <p className="mt-2 text-[#f5efdb99]">
          Here's an overview of your activity and available opportunities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="rounded-2xl backdrop-blur-xl bg-[#2a2a2833] border border-[#f5efdb1a] p-6 
              transition-all duration-200 hover:bg-[#2a2a2855] hover:border-[#f5efdb33]"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-[#f5efdb1a] text-[#f5efdb]">
                {stat.icon}
              </div>
              <div>
                <div className="text-sm text-[#f5efdb99]">{stat.title}</div>
                <div className="text-2xl font-display text-[#f5efdb]">
                  {loading ? '-' : stat.value}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl backdrop-blur-xl bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
        <h2 className="text-xl font-display text-[#f5efdb] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#f5efdb1a] 
              text-[#f5efdb99] hover:text-[#f5efdb] hover:bg-[#f5efdb0d] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Browse Projects
          </Link>
          <Link
            href="/dashboard/tasks"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#f5efdb1a] 
              text-[#f5efdb99] hover:text-[#f5efdb] hover:bg-[#f5efdb0d] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            View Tasks
          </Link>
          <Link
            href="/dashboard/applications"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#f5efdb1a] 
              text-[#f5efdb99] hover:text-[#f5efdb] hover:bg-[#f5efdb0d] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Check Applications
          </Link>
        </div>
      </div>
    </div>
  );
} 