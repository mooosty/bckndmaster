'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          console.log('Auth check failed, redirecting to login');
          window.location.href = '/admin';
          return;
        }
        
        setMounted(true);
      } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/admin';
      }
    };

    checkAuth();
  }, []);

  if (!mounted) {
    return null;
  }

  const isActive = (path: string) => pathname === path;

  const navigation = [
    { name: 'Overview', path: '/admin/dashboard' },
    { name: 'Projects', path: '/admin/dashboard/projects' },
    { name: 'Tasks', path: '/admin/dashboard/tasks' },
    { name: 'Applications', path: '/admin/dashboard/applications' },
  ];

  const handleLogout = () => {
    // Clear the admin access cookie
    document.cookie = 'adminAccess=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    window.location.href = '/admin';
  };

  return (
    <div className="min-h-screen bg-[#2a2a28]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-[#f5efdb1a] backdrop-blur-md bg-[#2a2a2833]">
          <div className="flex flex-col h-full">
            <div className="p-6">
              <h1 className="text-[#f5efdb] text-xl font-display">Admin Dashboard</h1>
            </div>
            
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {navigation.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center px-4 py-2 text-[#f5efdb] rounded-lg transition-all ${
                        isActive(item.path)
                          ? 'bg-[#f5efdb1a]'
                          : 'hover:bg-[#f5efdb1a]'
                      }`}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="p-4 mt-auto">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-[#f5efdb] rounded-lg border border-[#f5efdb1a] hover:bg-[#f5efdb1a] transition-all"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 