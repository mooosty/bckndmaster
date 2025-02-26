'use client';

import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import Image from 'next/image';

interface UserProfile {
  email: string;
  firstname: string;
  lastname: string;
  primary_city: string;
  secondary_city: string[];
  roles: string[];
  projects: {
    name: string;
    role: string;
    twitter: string;
    website: string;
    niches: string[];
    image: string;
  }[];
  isContentCreator: boolean;
  contentCreatorDescription: string;
  contentPlatforms: string[];
  contentTypes: string[];
  platformLinks: { [key: string]: string };
  bio: string;
  short_bio: string;
  extensive_bio: string;
  profile_image?: string;
  twitter?: {
    username: string;
    verified: boolean;
    lastVerified: string;
    profileImageUrl?: string;
    bio?: string;
  };
  investmentProfile?: {
    isInvestor: boolean;
    roundTypes?: string[];
    ticketSize?: string[];
  };
  FDV?: string[];
  criterias?: string[];
  equityOrToken?: string;
}

export default function ProfilePage() {
  const { user } = useDynamicContext();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user?.email) return;

    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/me?email=${user.email}`);

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
          setEditedProfile(data.data);
        } else {
          throw new Error(data.error || 'Failed to fetch profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.email]);

  const handleSave = async () => {
    if (!editedProfile || !user?.email) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/users/me?email=${user.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedProfile)
      });

      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
        setIsEditing(false);
        setToast({
          message: 'Profile updated successfully!',
          type: 'success'
        });
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setToast({
        message: err instanceof Error ? err.message : 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    if (!editedProfile) return;
    setEditedProfile({
      ...editedProfile,
      [field]: value
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-[#f5efdb] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5efdb] mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 mb-4">{error}</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-[#f5efdb] text-center">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Edit Mode Toggle */}
      <div className="flex justify-end">
        {isEditing ? (
          <div className="space-x-4">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#f5efdb] text-[#2a2a28] hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Header Section */}
      <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-8">
        <div className="flex items-start gap-8">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#f5efdb33]">
            {profile?.profile_image ? (
              <Image 
                src={profile.profile_image} 
                alt={`${profile.firstname} ${profile.lastname}`}
                fill
                className="object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500" />
                <div className="absolute inset-0 flex items-center justify-center text-4xl text-white font-bold">
                  {profile?.firstname?.[0]}{profile?.lastname?.[0]}
                </div>
              </>
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#f5efdb99] text-sm mb-2">First Name</label>
                    <input
                      type="text"
                      value={editedProfile?.firstname || ''}
                      onChange={(e) => handleInputChange('firstname', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#f5efdb99] text-sm mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editedProfile?.lastname || ''}
                      onChange={(e) => handleInputChange('lastname', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[#f5efdb99] text-sm mb-2">Short Bio</label>
                  <textarea
                    value={editedProfile?.short_bio || ''}
                    onChange={(e) => handleInputChange('short_bio', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] resize-none h-20"
                  />
                </div>
                <div>
                  <label className="block text-[#f5efdb99] text-sm mb-2">Roles</label>
                  <input
                    type="text"
                    value={editedProfile?.roles?.join(', ') || ''}
                    onChange={(e) => handleInputChange('roles', e.target.value.split(',').map(r => r.trim()))}
                    className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                    placeholder="Enter roles separated by commas"
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-display text-[#f5efdb] mb-2">
                  {profile?.firstname} {profile?.lastname}
                </h1>
                <p className="text-[#f5efdb99] mb-4">{profile?.short_bio || 'No bio added yet'}</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.roles?.map((role, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full text-sm bg-[#f5efdb1a] text-[#f5efdb]"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg ${
          toast.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-current opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Location */}
          <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
            <h2 className="text-lg font-display text-[#f5efdb] mb-4">Location</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[#f5efdb99] text-sm mb-2">Primary City</label>
                  <input
                    type="text"
                    value={editedProfile?.primary_city || ''}
                    onChange={(e) => handleInputChange('primary_city', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                  />
                </div>
                <div>
                  <label className="block text-[#f5efdb99] text-sm mb-2">Secondary Cities</label>
                  <input
                    type="text"
                    value={editedProfile?.secondary_city?.join(', ') || ''}
                    onChange={(e) => handleInputChange('secondary_city', e.target.value.split(',').map(c => c.trim()))}
                    className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                    placeholder="Enter cities separated by commas"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[#f5efdb]">
                  <span className="text-[#f5efdb99]">Primary: </span>
                  {profile?.primary_city || 'Not set'}
                </p>
                {profile?.secondary_city?.length > 0 && (
                  <p className="text-[#f5efdb]">
                    <span className="text-[#f5efdb99]">Secondary: </span>
                    {profile.secondary_city.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Social Links */}
          <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
            <h2 className="text-lg font-display text-[#f5efdb] mb-4">Social Links</h2>
            <div className="space-y-3">
              {profile.twitter && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-[#f5efdb]">
                    {profile.twitter.profileImageUrl && (
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        <Image 
                          src={profile.twitter.profileImageUrl} 
                          alt={`@${profile.twitter.username}`}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                        <span>@{profile.twitter.username}</span>
                        {profile.twitter.verified && (
                          <span className="text-green-400 text-sm">(Verified)</span>
                        )}
                      </div>
                      {profile.twitter.bio && (
                        <p className="text-[#f5efdb99] text-sm mt-1">{profile.twitter.bio}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {profile.platformLinks && Object.entries(profile.platformLinks).map(([platform, link]) => (
                <a
                  key={platform}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#f5efdb] hover:opacity-80"
                >
                  <span>{platform}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
              {(!profile.platformLinks || Object.keys(profile.platformLinks).length === 0) && !profile.twitter && (
                <p className="text-[#f5efdb99]">No social links added yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Center and Right Columns */}
        <div className="md:col-span-2 space-y-8">
          {/* About */}
          <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
            <h2 className="text-lg font-display text-[#f5efdb] mb-4">About</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-[#f5efdb99] text-sm mb-2">Bio</label>
                  <textarea
                    value={editedProfile?.bio || ''}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] resize-none h-32"
                  />
                </div>
                <div>
                  <label className="block text-[#f5efdb99] text-sm mb-2">Extensive Bio</label>
                  <textarea
                    value={editedProfile?.extensive_bio || ''}
                    onChange={(e) => handleInputChange('extensive_bio', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] resize-none h-48"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[#f5efdb99] whitespace-pre-wrap">
                {profile?.extensive_bio || profile?.bio || 'No bio available'}
              </p>
            )}
          </div>

          {/* Projects */}
          <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
            <h2 className="text-lg font-display text-[#f5efdb] mb-4">Projects</h2>
            {isEditing ? (
              <div className="space-y-4">
                {editedProfile?.projects?.map((project, index) => (
                  <div key={index} className="space-y-4 p-4 rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a]">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#f5efdb99] text-sm mb-2">Project Name</label>
                        <input
                          type="text"
                          value={project.name || ''}
                          onChange={(e) => {
                            const updatedProjects = [...(editedProfile?.projects || [])];
                            updatedProjects[index] = { ...project, name: e.target.value };
                            handleInputChange('projects', updatedProjects);
                          }}
                          className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#f5efdb99] text-sm mb-2">Role</label>
                        <input
                          type="text"
                          value={project.role || ''}
                          onChange={(e) => {
                            const updatedProjects = [...(editedProfile?.projects || [])];
                            updatedProjects[index] = { ...project, role: e.target.value };
                            handleInputChange('projects', updatedProjects);
                          }}
                          className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[#f5efdb99] text-sm mb-2">Website</label>
                      <input
                        type="text"
                        value={project.website || ''}
                        onChange={(e) => {
                          const updatedProjects = [...(editedProfile?.projects || [])];
                          updatedProjects[index] = { ...project, website: e.target.value };
                          handleInputChange('projects', updatedProjects);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#f5efdb99] text-sm mb-2">Niches</label>
                      <input
                        type="text"
                        value={project.niches?.join(', ') || ''}
                        onChange={(e) => {
                          const updatedProjects = [...(editedProfile?.projects || [])];
                          updatedProjects[index] = { 
                            ...project, 
                            niches: e.target.value.split(',').map(n => n.trim())
                          };
                          handleInputChange('projects', updatedProjects);
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                        placeholder="Enter niches separated by commas"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const updatedProjects = editedProfile?.projects?.filter((_, i) => i !== index) || [];
                        handleInputChange('projects', updatedProjects);
                      }}
                      className="px-3 py-1 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10"
                    >
                      Remove Project
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newProject = {
                      name: '',
                      role: '',
                      twitter: '',
                      website: '',
                      niches: [],
                      image: ''
                    };
                    handleInputChange('projects', [...(editedProfile?.projects || []), newProject]);
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
                >
                  Add Project
                </button>
              </div>
            ) : (
              <>
                {profile?.projects?.some(project => project.name) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {profile.projects
                      .filter(project => project.name)
                      .map((project, index) => (
                        <div
                          key={index}
                          className="rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a] p-4"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            {project.image ? (
                              <Image
                                src={project.image}
                                alt={project.name}
                                width={40}
                                height={40}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                            )}
                            <div>
                              <h3 className="text-[#f5efdb] font-medium">{project.name}</h3>
                              <p className="text-[#f5efdb99] text-sm">{project.role}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {project.niches?.map((niche, nicheIndex) => (
                              <span
                                key={nicheIndex}
                                className="px-2 py-1 rounded-full text-xs bg-[#f5efdb1a] text-[#f5efdb99]"
                              >
                                {niche}
                              </span>
                            ))}
                          </div>
                          {project.website && (
                            <a
                              href={project.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 flex items-center gap-1 text-sm text-[#f5efdb99] hover:text-[#f5efdb]"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              Website
                            </a>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-[#f5efdb99] text-center py-4">
                    No projects added yet
                  </div>
                )}
              </>
            )}
          </div>

          {/* Investment Profile */}
          {(isEditing || profile?.investmentProfile?.isInvestor) && (
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-display text-[#f5efdb]">Investment Profile</h2>
                {isEditing && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editedProfile?.investmentProfile?.isInvestor || false}
                      onChange={(e) => handleInputChange('investmentProfile', {
                        ...editedProfile?.investmentProfile,
                        isInvestor: e.target.checked
                      })}
                      className="rounded border-[#f5efdb1a] bg-[#2a2a2866] text-[#f5efdb]"
                    />
                    <span className="text-[#f5efdb99] text-sm">I am an investor</span>
                  </label>
                )}
              </div>
              {(isEditing || editedProfile?.investmentProfile?.isInvestor) && (
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-[#f5efdb99] text-sm mb-2">Round Types</label>
                        <input
                          type="text"
                          value={editedProfile?.investmentProfile?.roundTypes?.join(', ') || ''}
                          onChange={(e) => handleInputChange('investmentProfile', {
                            ...editedProfile?.investmentProfile,
                            roundTypes: e.target.value.split(',').map(t => t.trim())
                          })}
                          className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                          placeholder="Enter round types separated by commas"
                        />
                      </div>
                      <div>
                        <label className="block text-[#f5efdb99] text-sm mb-2">Ticket Size</label>
                        <input
                          type="text"
                          value={editedProfile?.investmentProfile?.ticketSize?.join(', ') || ''}
                          onChange={(e) => handleInputChange('investmentProfile', {
                            ...editedProfile?.investmentProfile,
                            ticketSize: e.target.value.split(',').map(t => t.trim())
                          })}
                          className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                          placeholder="Enter ticket sizes separated by commas"
                        />
                      </div>
                      <div>
                        <label className="block text-[#f5efdb99] text-sm mb-2">Investment Preference</label>
                        <select
                          value={editedProfile?.equityOrToken || ''}
                          onChange={(e) => handleInputChange('equityOrToken', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                        >
                          <option value="">Select preference</option>
                          <option value="Equity">Equity</option>
                          <option value="Token">Token</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                    </>
                  ) : (
                    <>
                      {(profile?.investmentProfile?.roundTypes ?? []).length > 0 && (
                        <div>
                          <h3 className="text-[#f5efdb] font-medium mb-2">Round Types</h3>
                          <div className="flex flex-wrap gap-2">
                            {(profile?.investmentProfile?.roundTypes ?? []).map((type, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-full text-sm bg-blue-500/10 text-blue-400"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {(profile?.investmentProfile?.ticketSize ?? []).length > 0 && (
                        <div>
                          <h3 className="text-[#f5efdb] font-medium mb-2">Ticket Size</h3>
                          <div className="flex flex-wrap gap-2">
                            {(profile?.investmentProfile?.ticketSize ?? []).map((size, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 rounded-full text-sm bg-green-500/10 text-green-400"
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile?.equityOrToken && (
                        <div>
                          <h3 className="text-[#f5efdb] font-medium mb-2">Investment Preference</h3>
                          <span className="px-3 py-1 rounded-full text-sm bg-purple-500/10 text-purple-400">
                            {profile.equityOrToken}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* FDV & Criteria */}
          {(profile?.FDV ?? []).length > 0 || (profile?.criterias ?? []).length > 0 && (
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h2 className="text-lg font-display text-[#f5efdb] mb-4">Investment Criteria</h2>
              <div className="space-y-4">
                {(profile?.FDV ?? []).length > 0 && (
                  <div>
                    <h3 className="text-[#f5efdb] font-medium mb-2">FDV Preferences</h3>
                    <div className="flex flex-wrap gap-2">
                      {(profile?.FDV ?? []).map((fdv, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm bg-yellow-500/10 text-yellow-400"
                        >
                          {fdv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(profile?.criterias ?? []).length > 0 && (
                  <div>
                    <h3 className="text-[#f5efdb] font-medium mb-2">Other Criteria</h3>
                    <div className="flex flex-wrap gap-2">
                      {(profile?.criterias ?? []).map((criteria, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 rounded-full text-sm bg-pink-500/10 text-pink-400"
                        >
                          {criteria}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content Creator Info */}
          <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display text-[#f5efdb]">Content Creation</h2>
              {isEditing && (
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editedProfile?.isContentCreator || false}
                    onChange={(e) => handleInputChange('isContentCreator', e.target.checked)}
                    className="rounded border-[#f5efdb1a] bg-[#2a2a2866] text-[#f5efdb]"
                  />
                  <span className="text-[#f5efdb99] text-sm">I am a content creator</span>
                </label>
              )}
            </div>
            {(isEditing || profile?.isContentCreator) && (
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="block text-[#f5efdb99] text-sm mb-2">Description</label>
                      <textarea
                        value={editedProfile?.contentCreatorDescription || ''}
                        onChange={(e) => handleInputChange('contentCreatorDescription', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] resize-none h-32"
                      />
                    </div>
                    <div>
                      <label className="block text-[#f5efdb99] text-sm mb-2">Platforms</label>
                      <input
                        type="text"
                        value={editedProfile?.contentPlatforms?.join(', ') || ''}
                        onChange={(e) => handleInputChange('contentPlatforms', e.target.value.split(',').map(p => p.trim()))}
                        className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                        placeholder="Enter platforms separated by commas"
                      />
                    </div>
                    <div>
                      <label className="block text-[#f5efdb99] text-sm mb-2">Content Types</label>
                      <input
                        type="text"
                        value={editedProfile?.contentTypes?.join(', ') || ''}
                        onChange={(e) => handleInputChange('contentTypes', e.target.value.split(',').map(t => t.trim()))}
                        className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                        placeholder="Enter content types separated by commas"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[#f5efdb99]">
                      {profile?.contentCreatorDescription || 'No description available'}
                    </p>
                    
                    {profile?.contentPlatforms?.length > 0 && (
                      <div>
                        <h3 className="text-[#f5efdb] font-medium mb-2">Platforms</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.contentPlatforms.map((platform, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 rounded-full text-sm bg-blue-500/10 text-blue-400"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile?.contentTypes?.length > 0 && (
                      <div>
                        <h3 className="text-[#f5efdb] font-medium mb-2">Content Types</h3>
                        <div className="flex flex-wrap gap-2">
                          {profile.contentTypes.map((type, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 rounded-full text-sm bg-purple-500/10 text-purple-400"
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 