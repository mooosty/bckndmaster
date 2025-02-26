'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useRouter } from 'next/navigation';
import styles from './OnboardingPopup.module.css';

// Constants for predefined options
const predefinedRoles = [
  "Founder", "C-level", "BD", "Community Manager", "Collab Manager",
  "Outreach Team", "KOL", "Ambassador", "Content Creator", "Alpha Caller",
  "Venture Capital", "Developer", "Designer", "Advisor"
];

const predefinedNiches = [
  "DeFi", "Gaming", "NFT", "Social", "Infrastructure", "DAO", "AI",
  "RWA", "DePin", "L1/L2/L3", "Data", "IP", "Web2 Brand entering Web3",
  "Exchange", "Market Maker"
];

const contentTypes = ["Thread Writing", "Video Content", "Technical Content", "Educational Content"];
const contentPlatforms = ["Twitter", "YouTube", "LinkedIn", "Medium", "TikTok", "Instagram"];
const roundTypes = ["Pre-seed", "Seed", "Private", "Strategic", "Public"];
const ticketSizes = [">$5k", "5k-10k", "10k-25k", "25k-100k", "100k-250k", "250k-500k", "1mil+"];
const FDV = ["<$5mil", "$5mil-$10mil", "$10mil-$20mil", "$20mil-$50mil", "$50mil-$100mil", "$100mil-$200mil", "$200mil+"];

interface FormData {
  firstname: string;
  lastname: string;
  email: string;
  primary_city: string;
  secondary_city: string[];
  roles: string[];
  projects: {
    name: string;
    role: string;
    twitter: string;
    website: string;
    niches: string[];
    image: any;
  }[];
  isContentCreator: boolean | number;
  contentCreatorDescription: string;
  contentPlatforms: string[];
  contentTypes: string[];
  platformLinks: Record<string, string>;
  FDV: string[];
  criterias: string[];
  equityOrToken: string;
  investmentProfile: {
    isInvestor: string;
    roundTypes: string[];
    ticketSize: string[];
  };
  bio: string;
  short_bio: string;
  extensive_bio: string;
  onboarding_steps: number;
  onboarding_completed?: boolean;
  twitter_connected: boolean;
  profile_image?: string;
}

interface FormErrors {
  firstname?: string;
  lastname?: string;
  email?: string;
  primary_city?: string;
}

interface DynamicUser {
  id?: string;
  email?: string;
  verifiedCredentials?: any[];
}

export default function OnboardingPopup({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { user, isAuthenticated } = useDynamicContext() as { user: DynamicUser | null, isAuthenticated: boolean };
  
  const [formData, setFormData] = useState<FormData>({
    firstname: '',
    lastname: '',
    email: user?.email || '',
    primary_city: '',
    secondary_city: [],
    roles: [],
    projects: [
      {
        name: '',
        role: '',
        twitter: '',
        website: '',
        niches: [],
        image: null,
      },
    ],
    isContentCreator: false,
    contentCreatorDescription: '',
    contentPlatforms: [],
    contentTypes: [],
    platformLinks: {},
    FDV: [],
    criterias: [],
    equityOrToken: '',
    investmentProfile: {
      isInvestor: 'never',
      roundTypes: [],
      ticketSize: [],
    },
    bio: '',
    short_bio: '',
    extensive_bio: '',
    onboarding_steps: 1,
    twitter_connected: false,
    profile_image: '',
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [twitterLoading, setTwitterLoading] = useState(false);
  const [twitterError, setTwitterError] = useState<string | null>(null);

  // Add logging for user context
  useEffect(() => {
    console.log('Dynamic user:', user);
    console.log('Is authenticated:', isAuthenticated);
  }, [user, isAuthenticated]);

  // Listen for Twitter auth messages from popup
  useEffect(() => {
    // Add a flag to track if we're already processing an auth code
    let isProcessingAuth = false;
    
    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
        const { code, state, isOnboarding } = event.data;
        
        // Prevent duplicate processing of the same auth code
        if (isProcessingAuth) {
          console.log('Already processing an auth code, ignoring duplicate message');
          return;
        }
        
        try {
          isProcessingAuth = true;
          setTwitterLoading(true);
          console.log('Received Twitter auth success message:', { 
            code: !!code, 
            state: !!state, 
            isOnboarding: !!isOnboarding,
            origin: event.origin
          });
          
          if (!code || !state) {
            throw new Error('Missing code or state in Twitter auth response');
          }
          
          // Exchange code for tokens
          console.log('Sending token exchange request to /api/auth/twitter');
          const response = await fetch('/api/auth/twitter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${user?.email}`
            },
            body: JSON.stringify({ 
              code, 
              state, 
              isOnboarding: true // Always set to true for onboarding flow
            })
          });

          // Log the response status for debugging
          console.log('Twitter auth API response status:', response.status);

          if (!response.ok) {
            let errorText;
            try {
              const errorData = await response.json();
              errorText = errorData.error || errorData.details || `API error: ${response.status}`;
              console.error('Twitter auth API error response:', errorData);
            } catch (e) {
              errorText = await response.text();
              console.error('Twitter auth API error (non-JSON):', { 
                status: response.status, 
                statusText: response.statusText,
                body: errorText 
              });
            }
            throw new Error(errorText);
          }

          const data = await response.json();
          console.log('Twitter auth API success response:', data);
          
          if (data.success) {
            console.log('Twitter connection successful, updating UI');
            setFormData(prev => ({ 
              ...prev, 
              twitter_connected: true,
              // If we have a Twitter bio, use it for the short bio
              short_bio: data.twitter.bio || prev.short_bio,
              profile_image: data.twitter.profileImageUrl,
            }));
            
            // If we have a profile image URL, store it
            if (data.twitter.profileImageUrl) {
              console.log('Setting Twitter profile image:', data.twitter.profileImageUrl);
              // You might want to save this to your user profile in the database
              // This is handled in the API endpoint already
            }
            
            // Move to the next step after successful Twitter connection
            setFormData(prev => ({ ...prev, onboarding_steps: prev.onboarding_steps + 1 }));
          } else {
            console.warn('Twitter auth warning:', data.error);
            setTwitterError(data.error || 'Failed to authenticate with Twitter');
          }
        } catch (err) {
          console.error('Twitter auth error:', err);
          setTwitterError(err instanceof Error ? err.message : 'Failed to authenticate with Twitter');
        } finally {
          setTwitterLoading(false);
          isProcessingAuth = false; // Reset the flag when done
        }
      } else if (event.data.type === 'TWITTER_AUTH_ERROR') {
        console.error('Twitter auth error from popup:', event.data.error);
        setTwitterError(event.data.error || 'Twitter authentication failed');
        setTwitterLoading(false);
      }
    };

    window.addEventListener('message', messageHandler);
    
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  }, [user]);

  // Load user data if exists
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.email) {
          const response = await fetch(`/api/user?email=${user.email}`);
          if (response.ok) {
            const userData = await response.json();
            setFormData(prev => ({
              ...prev,
              ...userData,
              email: user.email || userData.email || '',
              twitter_connected: userData.twitter?.verified || false,
              profile_image: userData.profile_image || '',
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [user]);

  // Save data to MongoDB
  const saveData = async (data: Partial<FormData>) => {
    try {
      if (!user?.email) {
        throw new Error('No email available');
      }

      console.log('Saving data to MongoDB:', {
        email: user.email,
        ...data,
        onboarding_step: formData.onboarding_steps,
        onboarding_completed: data.onboarding_completed || formData.onboarding_steps === 7
      });

      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          ...data,
          onboarding_step: formData.onboarding_steps,
          onboarding_completed: data.onboarding_completed || formData.onboarding_steps === 7,
        }),
      });

      const responseData = await response.json();
      console.log('Save response:', responseData);

      if (!response.ok) {
        throw new Error(`Failed to save data: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    
    if (!formData.firstname.trim()) {
      errors.firstname = 'First name is required';
    }
    
    if (!formData.lastname.trim()) {
      errors.lastname = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!formData.primary_city.trim()) {
      errors.primary_city = 'Primary city is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = async () => {
    if (formData.onboarding_steps === 1) {
      // Twitter connection step - just move to next step
      // If Twitter is not connected, we'll show the modal
      if (!formData.twitter_connected) {
        handleTwitterConnect();
        return;
      }
    } else if (formData.onboarding_steps === 2) {
      if (!validateForm()) {
        return;
      }
      // Save basic profile data
      await saveData({
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        primary_city: formData.primary_city,
        secondary_city: formData.secondary_city,
      });
    } else if (formData.onboarding_steps === 3) {
      // Save roles
      await saveData({
        roles: formData.roles,
      });
    } else if (formData.onboarding_steps === 4) {
      // Save projects
      await saveData({
        projects: formData.projects,
      });
    } else if (formData.onboarding_steps === 5) {
      // Save content creator info
      await saveData({
        isContentCreator: formData.isContentCreator,
        contentCreatorDescription: formData.contentCreatorDescription,
        contentPlatforms: formData.contentPlatforms,
        contentTypes: formData.contentTypes,
        platformLinks: formData.platformLinks,
      });
    } else if (formData.onboarding_steps === 6) {
      // Save investment profile
      await saveData({
        investmentProfile: formData.investmentProfile,
        FDV: formData.FDV,
        criterias: formData.criterias,
        equityOrToken: formData.equityOrToken,
      });
    }

    // Move to the next step
    setFormData(prev => ({ ...prev, onboarding_steps: prev.onboarding_steps + 1 }));
  };

  const handleSubmit = async () => {
    if (formData.onboarding_steps === 7) {
      try {
        // Save bio data first
        await saveData({
          short_bio: formData.short_bio,
          extensive_bio: formData.extensive_bio,
          onboarding_completed: true
        });
        
        // Optimistically update the UI
        onClose();
        
        console.log('Submitting onboarding completion data:', {
          email: user?.email,
          onboarding_completed: true
        });
        
        // Make the API call in the background
        const response = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user?.email,
            onboarding_completed: true
          }),
        });

        console.log('Onboarding API response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Onboarding API error:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          throw new Error(`Failed to update user data: ${response.status} ${response.statusText}`);
        }
        
        const responseData = await response.json();
        console.log('Onboarding API success response:', responseData);
        
        // Process referral after onboarding is completed
        const referralId = localStorage.getItem('referralId');
        if (referralId && user?.email) {
          console.log('Processing referral after onboarding completion:', { email: user.email, referralId });
          try {
            const referralResponse = await fetch('/api/auth/signup/complete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                email: user.email,
                referralId: referralId
              })
            });
            
            console.log('Referral API response status:', referralResponse.status);
            
            if (!referralResponse.ok) {
              const referralErrorData = await referralResponse.json().catch(() => ({}));
              console.error('Referral API error:', {
                status: referralResponse.status,
                statusText: referralResponse.statusText,
                data: referralErrorData
              });
              throw new Error(`Failed to process referral: ${referralResponse.status} ${referralResponse.statusText}`);
            }
            
            const referralData = await referralResponse.json();
            console.log('Referral API success response:', referralData);
            
            if (referralData.success) {
              localStorage.removeItem('referralId');
              console.log('Referral processed successfully after onboarding completion');
            } else {
              console.error('Error processing referral after onboarding:', referralData.error);
            }
          } catch (error) {
            console.error('Error calling referral API after onboarding:', error);
          }
        }
      } catch (error) {
        console.error('Error updating user data:', error);
        // You might want to show an error toast here
      }
    } else {
      setFormData(prev => ({ ...prev, onboarding_steps: prev.onboarding_steps + 1 }));
    }
  };

  const [customRole, setCustomRole] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [secondaryCity, setSecondaryCity] = useState('');

  const handleTwitterConnect = async () => {
    try {
      setTwitterLoading(true);
      setTwitterError(null);

      console.log('Initiating Twitter authentication...');

      // Open Twitter auth in a popup
      const width = 600;
      const height = 600;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;
      
      // Clear any existing cookies that might interfere with the auth flow
      document.cookie = 'twitter_oauth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'twitter_code_verifier=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      console.log('Opening Twitter auth popup with onboarding=true parameter');
      const popup = window.open(
        `/api/auth/twitter?onboarding=true`,
        'twitter-auth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        throw new Error('Failed to open popup window. Please check if popups are blocked by your browser.');
      }

      console.log('Twitter auth popup opened successfully');

      // Clean up
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          console.log('Twitter auth popup closed by user');
          clearInterval(checkClosed);
          setTwitterLoading(false);
        }
      }, 1000);

      // Set a timeout to close the popup and clean up if it takes too long
      setTimeout(() => {
        if (!popup.closed) {
          console.log('Twitter auth timeout reached, closing popup');
          popup.close();
          clearInterval(checkClosed);
          setTwitterLoading(false);
          setTwitterError('Authentication timed out. Please try again.');
        }
      }, 180000); // 3 minutes timeout

    } catch (err) {
      console.error('Twitter auth error:', err);
      setTwitterError(err instanceof Error ? err.message : 'Failed to authenticate with Twitter');
      setTwitterLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (formData.onboarding_steps) {
      case 1: {
        return (
          <div className={styles.step_content}>
            <h2>Connect Your Twitter Account</h2>
            <p>Connect your Twitter account to continue with the onboarding process.</p>
            
            <div className={styles.twitter_connect_container}>
              {formData.twitter_connected ? (
                <div className={styles.twitter_connected}>
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Twitter account connected successfully!</span>
                </div>
              ) : (
                <>
                  {twitterError && (
                    <div className={styles.error_message} style={{ marginBottom: '1rem', textAlign: 'center' }}>
                      {twitterError}
                    </div>
                  )}
                  <button
                    onClick={handleTwitterConnect}
                    className={styles.twitter_button}
                    disabled={twitterLoading}
                  >
                    {twitterLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        Connect Twitter
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        );
      }

      case 2: {
        return (
          <div className={styles.step_content}>
            <h2>Tell us about you</h2>
            <p>Basic profile information</p>
            <div className={styles.form_group}>
              <div className={styles.grid}>
                <div>
                  <input
                    type="text"
                    placeholder="First Name*"
                    value={formData.firstname}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, firstname: e.target.value}));
                      if (formErrors.firstname) {
                        setFormErrors(prev => ({ ...prev, firstname: undefined }));
                      }
                    }}
                    className={`${styles.form_input} ${formErrors.firstname ? styles.error : ''}`}
                  />
                  {formErrors.firstname && (
                    <div className={styles.error_message}>{formErrors.firstname}</div>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Last Name*"
                    value={formData.lastname}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, lastname: e.target.value}));
                      if (formErrors.lastname) {
                        setFormErrors(prev => ({ ...prev, lastname: undefined }));
                      }
                    }}
                    className={`${styles.form_input} ${formErrors.lastname ? styles.error : ''}`}
                  />
                  {formErrors.lastname && (
                    <div className={styles.error_message}>{formErrors.lastname}</div>
                  )}
                </div>
              </div>
              <div>
                <input
                  type="email"
                  placeholder="Email*"
                  value={formData.email}
                  disabled
                  className={`${styles.form_input} ${formErrors.email ? styles.error : ''}`}
                />
                {formErrors.email && (
                  <div className={styles.error_message}>{formErrors.email}</div>
                )}
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Primary City*"
                  value={formData.primary_city}
                  onChange={(e) => {
                    setFormData(prev => ({...prev, primary_city: e.target.value}));
                    if (formErrors.primary_city) {
                      setFormErrors(prev => ({ ...prev, primary_city: undefined }));
                    }
                  }}
                  className={`${styles.form_input} ${formErrors.primary_city ? styles.error : ''}`}
                />
                {formErrors.primary_city && (
                  <div className={styles.error_message}>{formErrors.primary_city}</div>
                )}
              </div>
              <div className={styles.secondary_input_group}>
                <input
                  type="text"
                  placeholder="Secondary City"
                  value={secondaryCity}
                  onChange={(e) => setSecondaryCity(e.target.value)}
                  className={styles.form_input}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && secondaryCity.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        secondary_city: [...prev.secondary_city, secondaryCity.trim()]
                      }));
                      setSecondaryCity('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (secondaryCity.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        secondary_city: [...prev.secondary_city, secondaryCity.trim()]
                      }));
                      setSecondaryCity('');
                    }
                  }}
                >
                  Add
                </button>
              </div>
              {formData.secondary_city.length > 0 && (
                <div className={styles.flex_wrap}>
                  {formData.secondary_city.map((city, index) => (
                    <div key={index} className={styles.city_tag}>
                      <span>{city}</span>
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            secondary_city: prev.secondary_city.filter((_, i) => i !== index)
                          }));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      case 3: {
        return (
          <div className={styles.step_content}>
            <h2>You are a...</h2>
            <div className={styles.space_y_6}>
              <div className={styles.flex_wrap}>
                {/* Predefined roles */}
                {predefinedRoles.map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        roles: prev.roles.includes(role)
                          ? prev.roles.filter(r => r !== role)
                          : [...prev.roles, role]
                      }));
                    }}
                    className={formData.roles.includes(role) ? styles.role_active : styles.role}
                  >
                    {role}
                  </button>
                ))}
                {/* Custom roles */}
                {formData.roles.filter(role => !predefinedRoles.includes(role)).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        roles: prev.roles.filter(r => r !== role)
                      }));
                    }}
                    className={styles.custom_role_active}
                  >
                    {role}
                  </button>
                ))}
              </div>

              <div className={styles.custom_input}>
                <input
                  type="text"
                  placeholder="Add custom role"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className={styles.form_input}
                />
                <button
                  onClick={() => {
                    if (customRole.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        roles: [...prev.roles, customRole.trim()]
                      }));
                      setCustomRole('');
                    }
                  }}
                  disabled={!customRole.trim()}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        );
      }

      case 4: {
        return (
          <div className={styles.step_content}>
            <h2>Which project do you represent?</h2>
            {formData.projects.map((project, index) => (
              <div key={index} className={styles.project_container}>
                <div className={styles.project_header}>
                  <h3>Project {index + 1}</h3>
                  {index > 0 && (
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          projects: prev.projects.filter((_, i) => i !== index)
                        }));
                      }}
                      className={styles.remove_button}
                    >
                      Remove Project
                    </button>
                  )}
                </div>

                <div className={styles.project_form}>
                  <input
                    type="text"
                    placeholder="Project Name*"
                    value={project.name}
                    onChange={(e) => {
                      const updatedProjects = [...formData.projects];
                      updatedProjects[index].name = e.target.value;
                      setFormData(prev => ({ ...prev, projects: updatedProjects }));
                    }}
                    className={styles.form_input}
                  />
                  <input
                    type="text"
                    placeholder="Your Role in Project*"
                    value={project.role}
                    onChange={(e) => {
                      const updatedProjects = [...formData.projects];
                      updatedProjects[index].role = e.target.value;
                      setFormData(prev => ({ ...prev, projects: updatedProjects }));
                    }}
                    className={styles.form_input}
                  />
                  <input
                    type="text"
                    placeholder="Twitter Link*"
                    value={project.twitter}
                    onChange={(e) => {
                      const updatedProjects = [...formData.projects];
                      updatedProjects[index].twitter = e.target.value;
                      setFormData(prev => ({ ...prev, projects: updatedProjects }));
                    }}
                    className={styles.form_input}
                  />
                  <input
                    type="text"
                    placeholder="Official Website*"
                    value={project.website}
                    onChange={(e) => {
                      const updatedProjects = [...formData.projects];
                      updatedProjects[index].website = e.target.value;
                      setFormData(prev => ({ ...prev, projects: updatedProjects }));
                    }}
                    className={styles.form_input}
                  />

                  <div className={styles.niches_section}>
                    <h4>Project Niches</h4>
                    <div className={styles.niches_grid}>
                      {predefinedNiches.map((niche) => (
                        <button
                          key={niche}
                          onClick={() => {
                            const updatedProjects = [...formData.projects];
                            updatedProjects[index].niches = project.niches.includes(niche)
                              ? project.niches.filter(n => n !== niche)
                              : [...project.niches, niche];
                            setFormData(prev => ({ ...prev, projects: updatedProjects }));
                          }}
                          className={project.niches.includes(niche) ? styles.niche_active : styles.niche}
                        >
                          {niche}
                        </button>
                      ))}
                    </div>

                    <div className={styles.custom_input}>
                      <input
                        type="text"
                        placeholder="Add custom niche"
                        value={customNiche}
                        onChange={(e) => setCustomNiche(e.target.value)}
                        className={styles.form_input}
                      />
                      <button
                        onClick={() => {
                          if (customNiche.trim()) {
                            const updatedProjects = [...formData.projects];
                            updatedProjects[index].niches = [...project.niches, customNiche.trim()];
                            setFormData(prev => ({ ...prev, projects: updatedProjects }));
                            setCustomNiche('');
                          }
                        }}
                        disabled={!customNiche.trim()}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                setFormData(prev => ({
                  ...prev,
                  projects: [...prev.projects, {
                    name: '',
                    role: '',
                    twitter: '',
                    website: '',
                    niches: [],
                    image: null,
                  }]
                }));
              }}
              className={styles.add_project_button}
            >
              + Add Another Project
            </button>
          </div>
        );
      }

      case 5: {
        return (
          <div className={styles.step_content}>
            <h2>Content Creation</h2>
            <p>Are you interested in being an Ambassador for projects you like?</p>

            <div className={styles.radio_group}>
              <label className={styles.radio_label}>
                <input
                  type="radio"
                  checked={formData.isContentCreator === 1}
                  onChange={() => setFormData(prev => ({ ...prev, isContentCreator: 1 }))}
                  className={styles.radio_input}
                />
                <span>Yes, I create content</span>
              </label>

              <label className={styles.radio_label}>
                <input
                  type="radio"
                  checked={formData.isContentCreator === 2}
                  onChange={() => setFormData(prev => ({ ...prev, isContentCreator: 2 }))}
                  className={styles.radio_input}
                />
                <span>It's not my main focus, but open to tweet about projects I really like</span>
              </label>

              <label className={styles.radio_label}>
                <input
                  type="radio"
                  checked={formData.isContentCreator === 3}
                  onChange={() => setFormData(prev => ({ ...prev, isContentCreator: 3 }))}
                  className={styles.radio_input}
                />
                <span>I never do any type of content (completely behind the scenes)</span>
              </label>
            </div>

            {[1, 2].includes(Number(formData.isContentCreator)) && (
              <div className={styles.content_options}>
                <div className={styles.section}>
                  <h3>Select Platforms</h3>
                  <div className={styles.platforms_grid}>
                    {contentPlatforms.map((platform) => (
                      <div key={platform} className={styles.platform_container}>
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              contentPlatforms: prev.contentPlatforms.includes(platform)
                                ? prev.contentPlatforms.filter(p => p !== platform)
                                : [...prev.contentPlatforms, platform],
                              platformLinks: {
                                ...prev.platformLinks,
                                [platform]: prev.platformLinks[platform] || ''
                              }
                            }));
                          }}
                          className={formData.contentPlatforms.includes(platform) 
                            ? styles.platform_active 
                            : styles.platform}
                        >
                          {platform}
                        </button>
                        {formData.contentPlatforms.includes(platform) && (
                          <input
                            type="text"
                            placeholder={`Enter your ${platform} profile URL`}
                            value={formData.platformLinks[platform] || ''}
                            onChange={(e) => {
                              setFormData(prev => ({
                                ...prev,
                                platformLinks: {
                                  ...prev.platformLinks,
                                  [platform]: e.target.value
                                }
                              }));
                            }}
                            className={styles.form_input}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Content Types</h3>
                  <div className={styles.content_types_grid}>
                    {contentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            contentTypes: prev.contentTypes.includes(type)
                              ? prev.contentTypes.filter(t => t !== type)
                              : [...prev.contentTypes, type]
                          }));
                        }}
                        className={formData.contentTypes.includes(type) 
                          ? styles.content_type_active 
                          : styles.content_type}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>About Your Content</h3>
                  <textarea
                    placeholder="Describe yourself as a content creator..."
                    value={formData.contentCreatorDescription}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      contentCreatorDescription: e.target.value 
                    }))}
                    className={styles.content_textarea}
                  />
                </div>
              </div>
            )}
          </div>
        );
      }

      case 6: {
        return (
          <div className={styles.step_content}>
            <h2>Investment Profile</h2>
            <p>Do you invest in projects?</p>

            <div className={styles.radio_group}>
              {["Yes", "Sometimes", "Never"].map((option) => (
                <label key={option} className={styles.radio_label}>
                  <input
                    type="radio"
                    checked={formData.investmentProfile.isInvestor === option.toLowerCase()}
                    onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        investmentProfile: {
                          ...prev.investmentProfile,
                          isInvestor: option.toLowerCase()
                        }
                      }));
                    }}
                    className={styles.radio_input}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>

            {formData.investmentProfile.isInvestor !== 'never' && (
              <div className={styles.investment_options}>
                <div className={styles.section}>
                  <h3>Preferred Round Types</h3>
                  <div className={styles.options_grid}>
                    {roundTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            investmentProfile: {
                              ...prev.investmentProfile,
                              roundTypes: prev.investmentProfile.roundTypes.includes(type)
                                ? prev.investmentProfile.roundTypes.filter(t => t !== type)
                                : [...prev.investmentProfile.roundTypes, type]
                            }
                          }));
                        }}
                        className={formData.investmentProfile.roundTypes.includes(type) 
                          ? styles.option_active 
                          : styles.option}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Average ticket size</h3>
                  <div className={styles.options_grid}>
                    {ticketSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            investmentProfile: {
                              ...prev.investmentProfile,
                              ticketSize: prev.investmentProfile.ticketSize.includes(size)
                                ? prev.investmentProfile.ticketSize.filter(s => s !== size)
                                : [...prev.investmentProfile.ticketSize, size]
                            }
                          }));
                        }}
                        className={formData.investmentProfile.ticketSize.includes(size) 
                          ? styles.option_active 
                          : styles.option}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.section}>
                  <h3>Preferred FDV</h3>
                  <div className={styles.options_grid}>
                    {FDV.map((value) => (
                      <button
                        key={value}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            FDV: prev.FDV.includes(value)
                              ? prev.FDV.filter(v => v !== value)
                              : [...prev.FDV, value]
                          }));
                        }}
                        className={formData.FDV.includes(value) 
                          ? styles.option_active 
                          : styles.option}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 7: {
        return (
          <div className={styles.step_content}>
            <h2 className={styles.text_2xl}>Tell us about yourself</h2>
            
            {/* Display profile image if available */}
            {formData.twitter_connected && (
              <div className={styles.profile_image_container}>
                <div className={styles.profile_image_wrapper}>
                  {formData.profile_image ? (
                    <img 
                      src={formData.profile_image} 
                      alt="Profile" 
                      className={styles.profile_image}
                    />
                  ) : (
                    <div className={styles.profile_image_placeholder}>
                      <span>{formData.firstname?.charAt(0) || ''}{formData.lastname?.charAt(0) || ''}</span>
                    </div>
                  )}
                </div>
                <p className={styles.profile_image_note}>
                  Your Twitter profile image has been set as your profile picture
                </p>
              </div>
            )}
            
            <div className={styles.space_y_6}>
              <div>
                <h3 className={styles.text_lg}>Short bio</h3>
                <textarea
                  placeholder="Describe yourself briefly..."
                  value={formData.short_bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, short_bio: e.target.value }))}
                  className={styles.bio_textarea}
                />
                {formData.twitter_connected && !formData.short_bio && (
                  <p className={styles.bio_note}>
                    You can use your Twitter bio as a starting point
                  </p>
                )}
              </div>

              <div>
                <h3 className={styles.text_lg}>Extensive bio</h3>
                <textarea
                  placeholder="Tell us more about you. Background, your current focus and interests..."
                  value={formData.extensive_bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, extensive_bio: e.target.value }))}
                  className={styles.bio_textarea_large}
                />
              </div>
            </div>
          </div>
        );
      }

      default: {
        return null;
      }
    }
  };

  return (
    <div className={styles.popup_overlay}>
      <div className={styles.onboarding_popup_content}>
        <div className={styles.step_indicator}>
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className={styles.step_wrapper}>
              <div 
                className={`${styles.step} ${
                  formData.onboarding_steps > i + 1 
                    ? styles.completed 
                    : formData.onboarding_steps === i + 1 
                    ? styles.active 
                    : ''
                }`}
              >
                {i + 1}
              </div>
              {i < 6 && (
                <div className={styles.step_line} />
              )}
            </div>
          ))}
        </div>

        <div className={styles.step_content}>
          {renderStepContent()}
        </div>

        <div className={styles.button_group}>
          {formData.onboarding_steps > 1 && (
            <button 
              onClick={() => setFormData(prev => ({...prev, onboarding_steps: prev.onboarding_steps - 1}))}
              className={styles.back_button}
            >
              Back
            </button>
          )}
          {formData.onboarding_steps < 7 ? (
            <button 
              onClick={handleNextStep}
              className={styles.next_button}
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              className={styles.submit_button}
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 