import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import React from 'react';

// ... existing code ...

// Add this at the end of the onboarding completion function
// This should be in the function that marks onboarding as complete
// Look for something like handleComplete, finishOnboarding, etc.

const OnboardingPopup = () => {
  const { user } = useDynamicContext();

  // Function to process referral after onboarding completion
  const processReferral = async () => {
    const referralId = localStorage.getItem('referralId');
    if (referralId && user?.email) {
      console.log('Processing referral after onboarding completion:', { email: user.email, referralId });
      try {
        const response = await fetch('/api/auth/signup/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: user.email,
            referralId: referralId
          })
        });
        
        const data = await response.json();
        if (data.success) {
          localStorage.removeItem('referralId');
          console.log('Referral processed successfully after onboarding completion');
        } else {
          console.error('Error processing referral after onboarding:', data.error);
        }
      } catch (error) {
        console.error('Error calling referral API after onboarding:', error);
      }
    }
  };

  // Call this function when onboarding is completed
  const handleOnboardingComplete = () => {
    // Your existing onboarding completion code...
    
    // Process any pending referral
    processReferral();
  };

  return (
    <div>
      {/* Your onboarding UI here */}
    </div>
  );
};

export default OnboardingPopup; 