"use client";

import { useState, useEffect } from 'react';
import ReferralLink from '@/components/ReferralLink';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface ReferralStats {
  totalReferrals: number;
  pointsEarned: number;
  activeReferrals: number;
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    pointsEarned: 0,
    activeReferrals: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useDynamicContext() as any;

  useEffect(() => {
    const fetchReferralStats = async () => {
      if (user?.email) {
        try {
          setLoading(true);
          const response = await fetch(`/api/user?email=${user.email}`);
          const userData = await response.json();
          
          if (response.ok && userData) {
            // Get invite count from a separate API call if available
            // For now, we'll just use the points to estimate referrals
            const points = userData.points || 0;
            const winwinBalance = userData.winwin_balance || 0;
            const estimatedReferrals = Math.floor(points / 100); // Assuming 100 points per referral
            
            setStats({
              totalReferrals: estimatedReferrals,
              pointsEarned: points,
              activeReferrals: estimatedReferrals // For now, assume all referrals are active
            });
            
            console.log('User data from API:', {
              points: userData.points,
              winwin_balance: userData.winwin_balance,
              estimatedReferrals
            });
          }
        } catch (error) {
          console.error('Error fetching referral stats:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchReferralStats();
  }, [user]);

  return (
    <div className="container p-6">
      <h1 className="text-2xl font-bold mb-6 text-[#f5efdb]">Referral Program</h1>
      
      <div className="grid gap-6">
        <div className="bg-[#2a2a28] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#f5efdb]">Your Referral Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#1a1a18] rounded-lg">
              <p className="text-sm text-[#f5efdb99]">Total Referrals</p>
              {loading ? (
                <p className="text-2xl font-bold text-[#f5efdb] animate-pulse">Loading...</p>
              ) : (
                <p className="text-2xl font-bold text-[#f5efdb]">{stats.totalReferrals}</p>
              )}
            </div>
            <div className="p-4 bg-[#1a1a18] rounded-lg">
              <p className="text-sm text-[#f5efdb99]">Points Earned</p>
              {loading ? (
                <p className="text-2xl font-bold text-[#f5efdb] animate-pulse">Loading...</p>
              ) : (
                <div>
                  <p className="text-2xl font-bold text-[#f5efdb]">{user?.winwin_balance || 0}</p>
                  <p className="text-xs text-[#f5efdb99]">Total Points: {stats.pointsEarned}</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-[#1a1a18] rounded-lg">
              <p className="text-sm text-[#f5efdb99]">Active Referrals</p>
              {loading ? (
                <p className="text-2xl font-bold text-[#f5efdb] animate-pulse">Loading...</p>
              ) : (
                <p className="text-2xl font-bold text-[#f5efdb]">{stats.activeReferrals}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#2a2a28] rounded-lg">
          <ReferralLink />
        </div>

        <div className="bg-[#2a2a28] rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-[#f5efdb]">How It Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#1a1a18] rounded-full flex items-center justify-center text-[#f5efdb] font-bold">1</div>
              <div>
                <h3 className="font-semibold text-[#f5efdb]">Generate Your Link</h3>
                <p className="text-[#f5efdb99]">Create your unique referral link using the generator above.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#1a1a18] rounded-full flex items-center justify-center text-[#f5efdb] font-bold">2</div>
              <div>
                <h3 className="font-semibold text-[#f5efdb]">Share With Friends</h3>
                <p className="text-[#f5efdb99]">Share your link with friends through social media, email, or messaging.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#1a1a18] rounded-full flex items-center justify-center text-[#f5efdb] font-bold">3</div>
              <div>
                <h3 className="font-semibold text-[#f5efdb]">Earn Points</h3>
                <p className="text-[#f5efdb99]">Earn 100 points for direct referrals, 20 for second-level, and 10 for third-level referrals.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 