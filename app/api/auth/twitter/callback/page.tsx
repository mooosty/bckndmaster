'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

function TwitterCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams) return;
    
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const isOnboarding = searchParams.get('onboarding') === 'true';

    // Log all parameters for debugging
    console.log('Twitter callback received:', { 
      code: !!code, 
      state: !!state, 
      error, 
      isOnboarding,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (error) {
      console.error('Twitter auth error from callback:', error);
      window.opener.postMessage({
        type: 'TWITTER_AUTH_ERROR',
        error,
        isOnboarding
      }, window.location.origin);
      window.close();
      return;
    }

    if (code && state) {
      console.log('Sending successful auth message to opener with isOnboarding:', isOnboarding);
      window.opener.postMessage({
        type: 'TWITTER_AUTH_SUCCESS',
        code,
        state,
        isOnboarding
      }, window.location.origin);
      
      // Close the window after a short delay to ensure the message is sent
      setTimeout(() => window.close(), 500);
    } else {
      console.error('Missing code or state in callback');
      window.opener.postMessage({
        type: 'TWITTER_AUTH_ERROR',
        error: 'Missing authorization code or state',
        isOnboarding
      }, window.location.origin);
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
      <div className="text-[#f5efdb] text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5efdb] mx-auto mb-4"></div>
        <p>Completing Twitter authentication...</p>
        <p className="text-sm mt-2">This window will close automatically.</p>
      </div>
    </div>
  );
}

export default function TwitterCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-[#f5efdb] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5efdb] mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    }>
      <TwitterCallbackContent />
    </Suspense>
  );
} 