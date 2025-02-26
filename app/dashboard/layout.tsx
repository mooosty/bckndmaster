'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface UserStats {
  goodwill_points: number;
  collab_points: number;
  winwin_balance: number;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useDynamicContext();
  const [mounted, setMounted] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    goodwill_points: 0,
    collab_points: 0,
    winwin_balance: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/');
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    const fetchUserStats = async () => {
      if (user?.email) {
        try {
          const response = await fetch(`/api/user?email=${user.email}`);
          const userData = await response.json();
          if (response.ok) {
            setUserStats({
              goodwill_points: userData.goodwill_points || 0,
              collab_points: userData.collab_points || 0,
              winwin_balance: userData.winwin_balance || 0
            });
          }
        } catch (error) {
          console.error('Error fetching user stats:', error);
        }
      }
    };

    if (mounted && isAuthenticated) {
      fetchUserStats();
    }
  }, [mounted, isAuthenticated, user?.email]);

  // Don't render anything until we've checked authentication
  if (!mounted || !isAuthenticated) {
    return null;
  }

  const navItems = [
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      name: 'Projects',
      href: '/dashboard/projects',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Tasks',
      href: '/dashboard/tasks',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      name: 'Applications',
      href: '/dashboard/applications',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Referrals',
      href: '/dashboard/referrals',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
        </svg>
      ),
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a18] via-[#2a2a28] to-[#1a1a18]">
      {/* Sidebar - always expanded */}
      <div
        className="fixed top-0 left-0 h-full w-64 bg-[#1a1a18] border-r border-[#f5efdb1a] z-50"
      >
        {/* Logo */}
        <div className="p-6">
          <img 
            src="/DLlogo.png" 
            alt="Darknight Labs Logo" 
            className="w-32"
          />
        </div>

        {/* Points and Balance Section */}
        <div className="px-4 mb-6 space-y-3">
          <div className="backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#f5efdb1a] flex items-center justify-center">
                  <span className="text-xs font-bold text-[#f5efdb]">CR</span>
                </div>
                <span className="text-xs text-[#f5efdb99]">Collab Rep</span>
              </div>
              <span className="text-sm font-medium text-[#f5efdb]">{userStats.collab_points}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#f5efdb1a] flex items-center justify-center">
                  <span className="text-xs font-bold text-[#f5efdb]">GW</span>
                </div>
                <span className="text-xs text-[#f5efdb99]">Goodwill</span>
              </div>
              <span className="text-sm font-medium text-[#f5efdb]">{userStats.goodwill_points}</span>
            </div>
          </div>

          <div className="backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-[#f5efdb1a] flex items-center justify-center">
                <span className="text-xs font-bold text-[#f5efdb]">$</span>
              </div>
              <span className="text-xs text-[#f5efdb99]">$WINWIN</span>
            </div>
            <div className="text-center">
              <span className="text-sm font-medium text-[#f5efdb]">{userStats.winwin_balance}</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-6 py-4 text-sm font-medium transition-colors
                  ${isActive 
                    ? 'text-[#f5efdb] bg-[#f5efdb1a]' 
                    : 'text-[#f5efdb99] hover:text-[#f5efdb] hover:bg-[#f5efdb0d]'
                  }`}
              >
                {item.icon}
                <span className="ml-3">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content - always adjusted for expanded sidebar */}
      <div className="ml-64">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </div>
  );
} 