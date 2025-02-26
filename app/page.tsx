'use client';

import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';
import OnboardingPopup from './components/OnboardingPopup';
import DashboardLayout from './dashboard/layout';
import DashboardPage from './dashboard/page';
import Link from 'next/link';
import ReferralTracker from '@/components/ReferralTracker';

interface DynamicUser {
  id?: string;
  email?: string;
}

interface DynamicContext {
  user: DynamicUser | null;
  isAuthenticated: boolean;
  handleLogOut: () => void;
}

export default function Home() {
  const { user, handleLogOut, isAuthenticated } = useDynamicContext() as DynamicContext;
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkUserStatus = async () => {
      if (mounted && isAuthenticated && user?.email) {
        try {
          const response = await fetch(`/api/user?email=${user.email}`);
          const userData = await response.json();

          if (!response.ok || !userData || !userData.onboarding_completed) {
            setOnboardingCompleted(false);
            setShowOnboarding(true);
          } else {
            setOnboardingCompleted(true);
            setShowOnboarding(false);
          }
          
          // Process referral if this is a new user
          const referralId = localStorage.getItem('referralId');
          if (isAuthenticated && referralId) {
            console.log('Found referral ID in localStorage:', referralId);
            
            // Call the signup API to process the referral
            try {
              console.log('Sending referral data to signup API:', { 
                email: user.email, 
                referralId,
                dynamicId: user.id // Send the Dynamic ID
              });
              const referralResponse = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  email: user.email,
                  referralId: referralId,
                  dynamicId: user.id // Include the Dynamic ID
                })
              });
              
              const referralData = await referralResponse.json();
              console.log('Referral processing response:', referralData);
              
              if (referralData.success) {
                // Clear the referral ID from localStorage after processing
                localStorage.removeItem('referralId');
                console.log('Referral processed successfully and cleared from localStorage');
              } else {
                console.error('Error processing referral:', referralData.error);
              }
            } catch (error) {
              console.error('Error processing referral:', error);
            }
          } else if (!referralId) {
            console.log('No referral ID found in localStorage');
            
            // Still store the Dynamic ID even if there's no referral
            if (user.id) {
              try {
                console.log('Storing Dynamic ID for user:', { 
                  email: user.email, 
                  dynamicId: user.id
                });
                await fetch('/api/auth/signup', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    email: user.email,
                    dynamicId: user.id
                  })
                });
              } catch (error) {
                console.error('Error storing Dynamic ID:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error checking user status:', error);
          setOnboardingCompleted(false);
          setShowOnboarding(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setShowOnboarding(false);
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [isAuthenticated, user, mounted]);

  // Don't render anything until mounted to prevent hydration errors
  if (!mounted) {
    return null;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#1a1a18] via-[#2a2a28] to-[#1a1a18] flex items-center justify-center">
        <div className="text-[#f5efdb] text-lg">Loading...</div>
      </div>
    );
  }

  // If authenticated and onboarding completed, show dashboard
  if (isAuthenticated && (onboardingCompleted || !showOnboarding)) {
    return (
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    );
  }

  // Otherwise show clean login page
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#1a1a18] via-[#2a2a28] to-[#1a1a18] overflow-y-auto">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

      {/* Referral Tracker - invisible component to handle referral parameters */}
      <ReferralTracker />

      {/* Content Container */}
      <div className="relative z-10 min-h-full flex flex-col items-center p-8">
        {/* Logo Section */}
        <div className="mb-12 mt-8">
          <img 
            src="/DLlogo.png" 
            alt="Darknight Labs Logo" 
            className="w-48 md:w-56 lg:w-64 h-auto"
          />
        </div>

        {/* Hero Section */}
        <div className="max-w-4xl text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#f5efdb] mb-6">
            Welcome to Darknight Labs Collabs
          </h1>
          <p className="text-xl text-[#f5efdb99]">
            Join the most exclusive collaboration network in Web3
          </p>
        </div>

        {isAuthenticated ? (
          <div className="w-full max-w-md mb-16 flex flex-col gap-4">
            <div className="backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col gap-4 items-center">
              <p className="text-[#f5efdb] text-lg">
                {onboardingCompleted ? 'Welcome back!' : 'Welcome! Please complete onboarding'}
              </p>
              {onboardingCompleted ? (
                <Link 
                  href="/dashboard" 
                  className="w-full px-6 py-3 bg-[#f5efdb] text-[#1a1a18] rounded-xl font-semibold text-center hover:bg-[#f5efdb99] transition-all duration-200"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <button
                  onClick={() => setShowOnboarding(true)}
                  className="w-full px-6 py-3 bg-[#f5efdb] text-[#1a1a18] rounded-xl font-semibold text-center hover:bg-[#f5efdb99] transition-all duration-200"
                >
                  Complete Onboarding
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md mb-16">
            <div className="backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] rounded-2xl p-6 md:p-8 shadow-2xl flex justify-center items-center">
              <DynamicWidget />
            </div>
          </div>
        )}

        {/* How it Works Section */}
        <div className="max-w-6xl w-full">
          <h2 className="text-3xl font-bold text-[#f5efdb] mb-8 text-center">How Darknight Labs Collabs Works</h2>

          {/* Ecosystem Partners */}
          <div className="backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] rounded-2xl p-8 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-[#f5efdb] mb-6">Our Ecosystem Partners</h3>
              <p className="text-[#f5efdb] text-lg mb-8">
                Collaborate with the best projects in the space
              </p>

              {/* Partner Logos Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 items-center justify-items-center">
                {[
                  { name: 'Chronoforge', img: '/chrfrg.png' },
                  { name: 'EstateX', img: '/esx.png' },
                  { name: 'Fitchin', img: '/fitchin.png' },
                  { name: 'Forbes Web3', img: '/frbs.png' },
                  { name: "L'Oréal", img: '/loreal.png' },
                  { name: 'Samsung NFT', img: '/smsng.png' }
                ].map((partner, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <div className="w-32 h-32 bg-[#f5efdb1a] rounded-xl flex flex-col items-center justify-center backdrop-blur-sm border border-[#f5efdb33] hover:border-[#f5efdb66] transition-all duration-300">
                      <div className="w-full h-full p-4">
                        <img 
                          src={partner.img} 
                          alt={`${partner.name} logo`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="text-[#f5efdb] text-sm font-medium">{partner.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Key Benefits Section */}
          <div className="relative mb-16">
            <div className="absolute inset-0 bg-gradient-to-r from-[#f5efdb0d] to-transparent skew-y-3"></div>
            <div className="relative z-10 py-12">
              <h3 className="text-2xl font-bold text-[#f5efdb] mb-8 text-center">Key Benefits</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] rounded-2xl p-6 transform hover:scale-105 hover:border-[#f5efdb80] transition-all duration-300">
                  <h4 className="text-xl font-bold text-[#f5efdb] mb-4">Stack Up $WINWIN</h4>
                  <p className="text-[#f5efdb99]">
                    Earn tokens by supporting partners and completing tasks.
                  </p>
                </div>
                <div className="backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] rounded-2xl p-6 transform hover:scale-105 hover:border-[#f5efdb80] transition-all duration-300 md:translate-y-4">
                  <h4 className="text-xl font-bold text-[#f5efdb] mb-4">Access Premium Projects</h4>
                  <p className="text-[#f5efdb99]">
                    Get early access to partnered NFTs and tokens.
                  </p>
                </div>
                <div className="backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] rounded-2xl p-6 transform hover:scale-105 hover:border-[#f5efdb80] transition-all duration-300">
                  <h4 className="text-xl font-bold text-[#f5efdb] mb-4">Build Your Reputation</h4>
                  <p className="text-[#f5efdb99]">
                    Increase your ecosystem standing by accumulating points.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showOnboarding && mounted && !onboardingCompleted && (
          <OnboardingPopup 
            onClose={() => setShowOnboarding(false)} 
          />
        )}
      </div>
    </div>
  );
} 