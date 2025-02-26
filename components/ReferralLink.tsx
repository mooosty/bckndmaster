"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export default function ReferralLink() {
    const [referralLink, setReferralLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const { user, primaryWallet } = useDynamicContext();
    
    // Debug user object when component mounts
    useEffect(() => {
        if (user) {
            console.log('User object from Dynamic SDK:', user);
            console.log('Available user properties:', Object.keys(user));
        } else {
            console.log('User object is null or undefined');
        }
        
        if (primaryWallet) {
            console.log('Primary wallet:', primaryWallet);
            console.log('Wallet address:', primaryWallet?.address);
        }
    }, [user, primaryWallet]);

    const generateLink = async () => {
        setError('');
        
        // Log the user object again when generating link
        console.log('User object when generating link:', user);
        console.log('Primary wallet when generating link:', primaryWallet);
        
        // Try to get a valid ID from various possible sources
        const userId = 
            // Try wallet address first (most reliable in Dynamic)
            primaryWallet?.address || 
            // Then try various user properties
            user?.verifiedCredentials?.[0]?.address ||
            user?.email;
        
        if (!userId) {
            setError('User ID not found');
            return;
        }

        try {
            setLoading(true);
            console.log('Generating link for user with ID:', userId);
            
            const response = await axios.post('/api/invites', {}, {
                headers: {
                    'Authorization': `Bearer ${userId}`
                }
            });
            
            setReferralLink(response.data.referralUrl);
        } catch (error: any) {
            console.error('Error details:', {
                error,
                response: error.response?.data,
                status: error.response?.status
            });
            setError(error.response?.data?.error || 'Failed to generate referral link');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-[#f5efdb]">Invite Friends</h3>
            
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500">
                    {error}
                </div>
            )}
            
            {!referralLink ? (
                <button
                    onClick={generateLink}
                    disabled={loading}
                    className="bg-[#f5efdb1a] text-[#f5efdb] px-4 py-2 rounded hover:bg-[#f5efdb33] disabled:opacity-50 transition-colors"
                >
                    {loading ? 'Generating...' : 'Generate Referral Link'}
                </button>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={referralLink}
                            readOnly
                            className="flex-1 p-2 bg-[#1a1a18] border border-[#f5efdb1a] rounded text-[#f5efdb]"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="bg-[#f5efdb1a] px-4 py-2 rounded text-[#f5efdb] hover:bg-[#f5efdb33] transition-colors"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-sm text-[#f5efdb99]">
                        Share this link with your friends to earn points!
                    </p>
                </div>
            )}
        </div>
    );
} 