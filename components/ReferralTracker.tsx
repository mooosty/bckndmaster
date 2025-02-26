"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
    const searchParams = useSearchParams();
    
    useEffect(() => {
        if (!searchParams) return;
        
        // Check for 'ref', 'referral', and direct parameter without a key
        const refId = searchParams.get('ref') || searchParams.get('referral');
        
        if (refId) {
            console.log('Referral parameter detected:', refId);
            
            // Store referral ID in localStorage
            localStorage.setItem('referralId', refId);
            console.log('Referral ID stored in localStorage:', refId);
            
            // Make an API call to track the referral click
            const trackReferralClick = async () => {
                try {
                    const response = await fetch('/api/referral/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refId })
                    });
                    
                    const data = await response.json();
                    console.log('Referral click tracking response:', data);
                    
                    if (data.success) {
                        console.log('Referral click tracked successfully');
                    } else {
                        console.error('Error tracking referral click:', data.error);
                    }
                } catch (error) {
                    console.error('Error tracking referral:', error);
                }
            };
            
            trackReferralClick();
        } else {
            // Check if the URL has a direct referral ID without a parameter name
            // Example: http://localhost:3000/?40262288-07e0-45f3-ad6e-f26de6dc0404
            const urlParams = new URLSearchParams(window.location.search);
            const firstParam = urlParams.keys().next().value;
            
            // If the first parameter has no value, it might be a direct referral ID
            if (firstParam && !urlParams.get(firstParam)) {
                console.log('Direct referral ID detected:', firstParam);
                
                // Store the direct referral ID in localStorage
                localStorage.setItem('referralId', firstParam);
                console.log('Direct referral ID stored in localStorage:', firstParam);
                
                // Track the referral click
                const trackDirectReferral = async () => {
                    try {
                        const response = await fetch('/api/referral/track', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refId: firstParam })
                        });
                        
                        const data = await response.json();
                        console.log('Direct referral click tracking response:', data);
                        
                        if (data.success) {
                            console.log('Direct referral click tracked successfully');
                        } else {
                            console.error('Error tracking direct referral click:', data.error);
                        }
                    } catch (error) {
                        console.error('Error tracking direct referral:', error);
                    }
                };
                
                trackDirectReferral();
            } else {
                console.log('No referral parameter found in URL');
            }
        }
    }, [searchParams]);

    return null; // This is a utility component, doesn't render anything
} 