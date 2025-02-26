'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  pendingApplications: number;
  activeUsers: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTasks: 0,
    pendingApplications: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stats');
        }

        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Projects',
      value: stats.totalProjects,
      link: '/admin/dashboard/projects',
      color: 'bg-blue-500/10 border-blue-500/20 text-blue-500'
    },
    {
      title: 'Total Tasks',
      value: stats.totalTasks,
      link: '/admin/dashboard/tasks',
      color: 'bg-green-500/10 border-green-500/20 text-green-500'
    },
    {
      title: 'Pending Applications',
      value: stats.pendingApplications,
      link: '/admin/dashboard/applications',
      color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      link: '/admin/dashboard/users',
      color: 'bg-purple-500/10 border-purple-500/20 text-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display text-[#f5efdb]">Dashboard Overview</h1>
      </div>

      {error && (
        <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          // Loading skeletons
          Array(4).fill(0).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6 h-[120px]"
            />
          ))
        ) : (
          // Stat cards
          statCards.map((stat) => (
            <Link
              key={stat.title}
              href={stat.link}
              className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6 transition-all hover:bg-[#2a2a2855]"
            >
              <div className="text-sm text-[#f5efdb99] mb-2">{stat.title}</div>
              <div className="text-3xl font-display text-[#f5efdb]">{stat.value}</div>
            </Link>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
        <h2 className="text-xl font-display text-[#f5efdb] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/dashboard/projects/new"
            className="px-4 py-3 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a] transition-all text-center"
          >
            Create New Project
          </Link>
          <Link
            href="/admin/dashboard/tasks/new"
            className="px-4 py-3 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a] transition-all text-center"
          >
            Create New Task
          </Link>
          <Link
            href="/admin/dashboard/applications"
            className="px-4 py-3 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a] transition-all text-center"
          >
            Review Applications
          </Link>
        </div>
      </div>
    </div>
  );
} 