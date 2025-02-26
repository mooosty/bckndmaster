'use client';

import { useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { isAuthenticated } = useDynamicContext();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[#2a2a28] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-8">
          <h1 className="text-3xl font-display text-[#f5efdb] mb-8 text-center">Login</h1>
          
          {/* Dynamic Labs will inject its authentication UI here */}
          <div id="dynamic-labs-login"></div>

          <div className="mt-6 text-center">
            <Link href="/admin" className="text-[#f5efdb66] hover:text-[#f5efdb] text-sm">
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 