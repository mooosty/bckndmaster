'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ProjectFormData {
  name: string;
  coverImage: string;
  status: string;
  tags: string[];
  overview: {
    description: string;
  };
  nftDetails: {
    title: string;
    description: string;
    features: string[];
  };
  mintDetails: {
    chain: string;
    supply: string;
    mintDate: string;
    phases: {
      name: string;
      duration: string;
      time: string;
    }[];
  };
  howToMint: {
    steps: string[];
  };
  importantLinks: {
    title: string;
    url: string;
    icon: string;
  }[];
  collaboration: {
    enabled: boolean;
    title: string;
    description: string;
    disabledMessage: string;
  };
  tasks: {
    discord: {
      title: string;
      description: string;
      tasks: {
        id: string;
        title: string;
        description: string;
        points: number;
        dueDate: string;
        subtasks?: {
          id: string;
          title: string;
          required: boolean;
        }[];
      }[];
    };
    social: {
      title: string;
      description: string;
      tasks: {
        id: string;
        title: string;
        description: string;
        points: number;
        dueDate: string;
      }[];
    };
  };
}

type SectionPath = 
  | 'overview'
  | 'nftDetails'
  | 'mintDetails'
  | 'howToMint'
  | 'importantLinks'
  | 'collaboration'
  | 'tasks';

type ArrayFieldPath = 
  | 'features'
  | 'phases'
  | 'steps'
  | 'links';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    coverImage: '',
    status: 'COMING_SOON',
    tags: [],
    overview: {
      description: '',
    },
    nftDetails: {
      title: '',
      description: '',
      features: [''],
    },
    mintDetails: {
      chain: '',
      supply: '',
      mintDate: '',
      phases: [
        {
          name: '',
          duration: '',
          time: '',
        },
      ],
    },
    howToMint: {
      steps: [''],
    },
    importantLinks: [
      {
        title: '',
        url: '',
        icon: '',
      },
    ],
    collaboration: {
      enabled: false,
      title: 'Want to collaborate?',
      description: 'Submit your application to become a partner',
      disabledMessage: 'You can\'t collaborate until project is live',
    },
    tasks: {
      discord: {
        title: 'Discord Tasks',
        description: 'Complete Discord community tasks',
        tasks: []
      },
      social: {
        title: 'Social Media Tasks',
        description: 'Complete social media engagement tasks',
        tasks: []
      }
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const adminEmail = 'admin@darknightlabs.com';

      // Log the form data being sent
      console.log('Submitting form data:', JSON.stringify(formData, null, 2));

      // Validate required fields
      const requiredValidations: [string, boolean][] = [
        ['name', !formData.name],
        ['coverImage', !formData.coverImage],
        ['overview description', !formData.overview.description],
        ['NFT title', !formData.nftDetails.title],
        ['NFT description', !formData.nftDetails.description],
        ['mint chain', !formData.mintDetails.chain],
        ['mint supply', !formData.mintDetails.supply],
        ['mint date', !formData.mintDetails.mintDate]
      ];

      for (const [fieldName, isInvalid] of requiredValidations) {
        if (isInvalid) {
          setError(`${fieldName} is required`);
          setLoading(false);
          return;
        }
      }

      // Ensure all array fields are initialized and tasks are properly formatted
      const dataToSend = {
        ...formData,
        tags: formData.tags || [],
        nftDetails: {
          ...formData.nftDetails,
          features: formData.nftDetails.features.filter(f => f.trim() !== '')
        },
        mintDetails: {
          ...formData.mintDetails,
          phases: formData.mintDetails.phases.filter(p => p.name.trim() !== '' || p.duration.trim() !== '' || p.time.trim() !== '')
        },
        howToMint: {
          steps: formData.howToMint.steps.filter(s => s.trim() !== '')
        },
        importantLinks: formData.importantLinks.filter(l => l.title.trim() !== '' || l.url.trim() !== '' || l.icon.trim() !== ''),
        tasks: {
          discord: {
            ...formData.tasks.discord,
            tasks: formData.tasks.discord.tasks.filter(task => 
              task.title.trim() !== '' && task.description.trim() !== ''
            ).map(task => ({
              ...task,
              subtasks: task.subtasks?.filter(subtask => 
                subtask.title.trim() !== ''
              ) || []
            }))
          },
          social: {
            ...formData.tasks.social,
            tasks: formData.tasks.social.tasks.filter(task => 
              task.title.trim() !== '' && task.description.trim() !== ''
            )
          }
        }
      };

      console.log('Sending data to server:', JSON.stringify(dataToSend, null, 2));

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminEmail}`,
          'Cookie': 'adminAccess=true'
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend),
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (!response.ok) {
        if (data.error === 'Validation error' && data.details) {
          // Format validation errors for display
          const errorMessages = Object.entries(data.details)
            .map(([field, error]: [string, any]) => `${field}: ${error.message || error}`)
            .join('\n');
          throw new Error(`Validation errors:\n${errorMessages}`);
        }
        throw new Error(data.error || 'Failed to create project');
      }

      router.push('/admin/dashboard/projects');
    } catch (err) {
      console.error('Project creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    section?: SectionPath,
    index?: number,
    field?: string | ArrayFieldPath
  ) => {
    const { name, value } = e.target;

    if (section === 'nftDetails' && typeof index === 'number' && field === 'features') {
      // Handle nftDetails.features array
      setFormData(prev => ({
        ...prev,
        nftDetails: {
          ...prev.nftDetails,
          features: prev.nftDetails.features.map((item, i) => i === index ? value : item)
        }
      }));
    } else if (section === 'mintDetails' && typeof index === 'number' && field) {
      // Handle mintDetails.phases array
      setFormData(prev => ({
        ...prev,
        mintDetails: {
          ...prev.mintDetails,
          phases: prev.mintDetails.phases.map((phase, i) => 
            i === index ? { ...phase, [field]: value } : phase
          )
        }
      }));
    } else if (section === 'howToMint' && typeof index === 'number' && field === 'steps') {
      // Handle howToMint.steps array
      setFormData(prev => ({
        ...prev,
        howToMint: {
          ...prev.howToMint,
          steps: prev.howToMint.steps.map((step, i) => i === index ? value : step)
        }
      }));
    } else if (section === 'importantLinks' && typeof index === 'number' && field) {
      // Handle importantLinks array
      setFormData(prev => ({
        ...prev,
        importantLinks: prev.importantLinks.map((link, i) => 
          i === index ? { ...link, [field]: value } : link
        )
      }));
    } else if (section) {
      // Handle nested objects
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [name]: value
        }
      }));
    } else {
      // Handle top-level fields
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addArrayItem = (section: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (section === 'nftDetails.features') {
        newData.nftDetails.features.push('');
      } else if (section === 'mintDetails.phases') {
        newData.mintDetails.phases.push({ name: '', duration: '', time: '' });
      } else if (section === 'howToMint.steps') {
        newData.howToMint.steps.push('');
      } else if (section === 'importantLinks') {
        newData.importantLinks.push({ title: '', url: '', icon: '' });
      }
      return newData;
    });
  };

  const removeArrayItem = (section: string, index: number) => {
    setFormData(prev => {
      const newData = { ...prev };
      if (section === 'nftDetails.features') {
        newData.nftDetails.features.splice(index, 1);
      } else if (section === 'mintDetails.phases') {
        newData.mintDetails.phases.splice(index, 1);
      } else if (section === 'howToMint.steps') {
        newData.howToMint.steps.splice(index, 1);
      } else if (section === 'importantLinks') {
        newData.importantLinks.splice(index, 1);
      }
      return newData;
    });
  };

  // Add new functions to handle task management
  const addDiscordTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        discord: {
          ...prev.tasks.discord,
          tasks: [
            ...prev.tasks.discord.tasks,
            {
              id: `discord-${Date.now()}`,
              title: '',
              description: '',
              points: 0,
              dueDate: '',
              subtasks: []
            }
          ]
        }
      }
    }));
  };

  const addSocialTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        social: {
          ...prev.tasks.social,
          tasks: [
            ...prev.tasks.social.tasks,
            {
              id: `social-${Date.now()}`,
              title: '',
              description: '',
              points: 0,
              dueDate: ''
            }
          ]
        }
      }
    }));
  };

  const addSubtask = (taskIndex: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        discord: {
          ...prev.tasks.discord,
          tasks: prev.tasks.discord.tasks.map((task, index) => {
            if (index === taskIndex) {
              return {
                ...task,
                subtasks: [
                  ...(task.subtasks || []),
                  {
                    id: `subtask-${Date.now()}`,
                    title: '',
                    required: true
                  }
                ]
              };
            }
            return task;
          })
        }
      }
    }));
  };

  const handleTaskChange = (
    taskType: 'discord' | 'social',
    taskIndex: number,
    field: string,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskType]: {
          ...prev.tasks[taskType],
          tasks: prev.tasks[taskType].tasks.map((task, index) => {
            if (index === taskIndex) {
              return { ...task, [field]: value };
            }
            return task;
          })
        }
      }
    }));
  };

  const handleSubtaskChange = (
    taskIndex: number,
    subtaskIndex: number,
    field: string,
    value: string | boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        discord: {
          ...prev.tasks.discord,
          tasks: prev.tasks.discord.tasks.map((task, tIndex) => {
            if (tIndex === taskIndex && task.subtasks) {
              return {
                ...task,
                subtasks: task.subtasks.map((subtask, sIndex) => {
                  if (sIndex === subtaskIndex) {
                    return { ...subtask, [field]: value };
                  }
                  return subtask;
                })
              };
            }
            return task;
          })
        }
      }
    }));
  };

  const removeTask = (taskType: 'discord' | 'social', taskIndex: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        [taskType]: {
          ...prev.tasks[taskType],
          tasks: prev.tasks[taskType].tasks.filter((_, index) => index !== taskIndex)
        }
      }
    }));
  };

  const removeSubtask = (taskIndex: number, subtaskIndex: number) => {
    setFormData(prev => ({
      ...prev,
      tasks: {
        ...prev.tasks,
        discord: {
          ...prev.tasks.discord,
          tasks: prev.tasks.discord.tasks.map((task, tIndex) => {
            if (tIndex === taskIndex && task.subtasks) {
              return {
                ...task,
                subtasks: task.subtasks.filter((_, sIndex) => sIndex !== subtaskIndex)
              };
            }
            return task;
          })
        }
      }
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display text-[#f5efdb]">Create New Project</h1>
        <Link
          href="/admin/dashboard/projects"
          className="px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a] transition-all"
        >
          Back to Projects
        </Link>
      </div>

      <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Basic Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-display text-[#f5efdb]">Basic Details</h2>
              
              <div>
                <label htmlFor="name" className="block text-sm text-[#f5efdb] mb-2">
                  Project Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                  required
                />
              </div>

              <div>
                <label htmlFor="coverImage" className="block text-sm text-[#f5efdb] mb-2">
                  Cover Image URL
                </label>
                <input
                  id="coverImage"
                  name="coverImage"
                  type="url"
                  value={formData.coverImage}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm text-[#f5efdb] mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] focus:outline-none focus:border-[#f5efdb33]"
                  required
                >
                  <option value="COMING_SOON">Coming Soon</option>
                  <option value="LIVE">Live</option>
                  <option value="ENDED">Ended</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-[#f5efdb] mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()) }))}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                  placeholder="Enter tags separated by commas"
                />
              </div>
            </div>

            {/* Overview */}
            <div className="space-y-4">
              <h2 className="text-xl font-display text-[#f5efdb]">Overview</h2>
              
              <div>
                <label htmlFor="overview.description" className="block text-sm text-[#f5efdb] mb-2">
                  Description
                </label>
                <textarea
                  id="overview.description"
                  name="description"
                  value={formData.overview.description}
                  onChange={(e) => handleChange(e, 'overview')}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33] min-h-[100px]"
                  required
                />
              </div>
            </div>

            {/* NFT Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-display text-[#f5efdb]">NFT Details</h2>
              
              <div>
                <label htmlFor="nftDetails.title" className="block text-sm text-[#f5efdb] mb-2">
                  Title
                </label>
                <input
                  id="nftDetails.title"
                  name="title"
                  type="text"
                  value={formData.nftDetails.title}
                  onChange={(e) => handleChange(e, 'nftDetails')}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                  required
                />
              </div>

              <div>
                <label htmlFor="nftDetails.description" className="block text-sm text-[#f5efdb] mb-2">
                  Description
                </label>
                <textarea
                  id="nftDetails.description"
                  name="description"
                  value={formData.nftDetails.description}
                  onChange={(e) => handleChange(e, 'nftDetails')}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33] min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-[#f5efdb]">Features</label>
                  <button
                    type="button"
                    onClick={() => addArrayItem('nftDetails.features')}
                    className="text-sm text-[#f5efdb] hover:text-[#f5efdb99]"
                  >
                    + Add Feature
                  </button>
                </div>
                {formData.nftDetails.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleChange(e, 'nftDetails', index, 'features')}
                      className="flex-1 px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                      placeholder="Enter feature"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('nftDetails.features', index)}
                      className="px-3 py-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Mint Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-display text-[#f5efdb]">Mint Details</h2>
              
              <div>
                <label htmlFor="mintDetails.chain" className="block text-sm text-[#f5efdb] mb-2">
                  Chain
                </label>
                <input
                  id="mintDetails.chain"
                  name="chain"
                  type="text"
                  value={formData.mintDetails.chain}
                  onChange={(e) => handleChange(e, 'mintDetails')}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                  required
                />
              </div>

              <div>
                <label htmlFor="mintDetails.supply" className="block text-sm text-[#f5efdb] mb-2">
                  Supply
                </label>
                <input
                  id="mintDetails.supply"
                  name="supply"
                  type="text"
                  value={formData.mintDetails.supply}
                  onChange={(e) => handleChange(e, 'mintDetails')}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                  required
                />
              </div>

              <div>
                <label htmlFor="mintDetails.mintDate" className="block text-sm text-[#f5efdb] mb-2">
                  Mint Date
                </label>
                <input
                  id="mintDetails.mintDate"
                  name="mintDate"
                  type="date"
                  value={formData.mintDetails.mintDate}
                  onChange={(e) => handleChange(e, 'mintDetails')}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-[#f5efdb]">Mint Phases</label>
                  <button
                    type="button"
                    onClick={() => addArrayItem('mintDetails.phases')}
                    className="text-sm text-[#f5efdb] hover:text-[#f5efdb99]"
                  >
                    + Add Phase
                  </button>
                </div>
                {formData.mintDetails.phases.map((phase, index) => (
                  <div key={index} className="space-y-2 p-4 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a]">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-[#f5efdb]">Phase {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('mintDetails.phases', index)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={phase.name}
                      onChange={(e) => handleChange(e, 'mintDetails', index, 'name')}
                      className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                      placeholder="Phase Name"
                    />
                    <input
                      type="text"
                      value={phase.duration}
                      onChange={(e) => handleChange(e, 'mintDetails', index, 'duration')}
                      className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                      placeholder="Duration (e.g., 4 hours)"
                    />
                    <input
                      type="text"
                      value={phase.time}
                      onChange={(e) => handleChange(e, 'mintDetails', index, 'time')}
                      className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                      placeholder="Time (e.g., 5pm US EST)"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* How to Mint */}
            <div className="space-y-4">
              <h2 className="text-xl font-display text-[#f5efdb]">How to Mint</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-[#f5efdb]">Steps</label>
                  <button
                    type="button"
                    onClick={() => addArrayItem('howToMint.steps')}
                    className="text-sm text-[#f5efdb] hover:text-[#f5efdb99]"
                  >
                    + Add Step
                  </button>
                </div>
                {formData.howToMint.steps.map((step, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={step}
                      onChange={(e) => handleChange(e, 'howToMint', index, 'steps')}
                      className="flex-1 px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                      placeholder="Enter step"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('howToMint.steps', index)}
                      className="px-3 py-2 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Links */}
            <div className="space-y-4">
              <h2 className="text-xl font-display text-[#f5efdb]">Important Links</h2>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-[#f5efdb]">Links</label>
                  <button
                    type="button"
                    onClick={() => addArrayItem('importantLinks')}
                    className="text-sm text-[#f5efdb] hover:text-[#f5efdb99]"
                  >
                    + Add Link
                  </button>
                </div>
                {formData.importantLinks.map((link, index) => (
                  <div key={index} className="space-y-2 p-4 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a]">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-[#f5efdb]">Link {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('importantLinks', index)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleChange(e, 'importantLinks', index, 'title')}
                      className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                      placeholder="Link Title"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleChange(e, 'importantLinks', index, 'url')}
                      className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                      placeholder="URL"
                    />
                    <input
                      type="text"
                      value={link.icon}
                      onChange={(e) => handleChange(e, 'importantLinks', index, 'icon')}
                      className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                      placeholder="Icon (e.g., 📖)"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Collaboration */}
            <div className="space-y-4">
              <h2 className="text-xl font-display text-[#f5efdb]">Collaboration Settings</h2>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="collaboration.enabled"
                  checked={formData.collaboration.enabled}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    collaboration: {
                      ...prev.collaboration,
                      enabled: e.target.checked
                    }
                  }))}
                  className="rounded border-[#f5efdb1a] bg-[#1e1e1c] text-[#f5efdb]"
                />
                <label htmlFor="collaboration.enabled" className="text-sm text-[#f5efdb]">
                  Enable Collaboration
                </label>
              </div>

              <div>
                <label htmlFor="collaboration.title" className="block text-sm text-[#f5efdb] mb-2">
                  Collaboration Title
                </label>
                <input
                  id="collaboration.title"
                  name="title"
                  type="text"
                  value={formData.collaboration.title}
                  onChange={(e) => handleChange(e, 'collaboration')}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                />
              </div>

              <div>
                <label htmlFor="collaboration.description" className="block text-sm text-[#f5efdb] mb-2">
                  Collaboration Description
                </label>
                <input
                  id="collaboration.description"
                  name="description"
                  type="text"
                  value={formData.collaboration.description}
                  onChange={(e) => handleChange(e, 'collaboration')}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                />
              </div>

              <div>
                <label htmlFor="collaboration.disabledMessage" className="block text-sm text-[#f5efdb] mb-2">
                  Disabled Message
                </label>
                <input
                  id="collaboration.disabledMessage"
                  name="disabledMessage"
                  type="text"
                  value={formData.collaboration.disabledMessage}
                  onChange={(e) => handleChange(e, 'collaboration')}
                  className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                />
              </div>
            </div>

            {/* Tasks Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-display text-[#f5efdb]">Tasks</h2>

              {/* Discord Tasks */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-display text-[#f5efdb]">Discord Tasks</h3>
                  <button
                    type="button"
                    onClick={addDiscordTask}
                    className="text-sm text-[#f5efdb] hover:text-[#f5efdb99]"
                  >
                    + Add Discord Task
                  </button>
                </div>

                {formData.tasks.discord.tasks.map((task, taskIndex) => (
                  <div key={task.id} className="space-y-4 p-4 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a]">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-[#f5efdb]">Task {taskIndex + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeTask('discord', taskIndex)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleTaskChange('discord', taskIndex, 'title', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66]"
                        placeholder="Task Title"
                      />
                      <textarea
                        value={task.description}
                        onChange={(e) => handleTaskChange('discord', taskIndex, 'description', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66]"
                        placeholder="Task Description"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={task.points}
                          onChange={(e) => handleTaskChange('discord', taskIndex, 'points', parseInt(e.target.value))}
                          className="w-24 px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                          placeholder="Points"
                        />
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(e) => handleTaskChange('discord', taskIndex, 'dueDate', e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                        />
                      </div>
                    </div>

                    {/* Subtasks */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h5 className="text-sm text-[#f5efdb]">Subtasks</h5>
                        <button
                          type="button"
                          onClick={() => addSubtask(taskIndex)}
                          className="text-sm text-[#f5efdb] hover:text-[#f5efdb99]"
                        >
                          + Add Subtask
                        </button>
                      </div>

                      {task.subtasks?.map((subtask, subtaskIndex) => (
                        <div key={subtask.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={subtask.title}
                            onChange={(e) => handleSubtaskChange(taskIndex, subtaskIndex, 'title', e.target.value)}
                            className="flex-1 px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                            placeholder="Subtask Title"
                          />
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-[#f5efdb]">
                              <input
                                type="checkbox"
                                checked={subtask.required}
                                onChange={(e) => handleSubtaskChange(taskIndex, subtaskIndex, 'required', e.target.checked)}
                                className="mr-2"
                              />
                              Required
                            </label>
                            <button
                              type="button"
                              onClick={() => removeSubtask(taskIndex, subtaskIndex)}
                              className="px-2 py-1 rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Media Tasks */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-display text-[#f5efdb]">Social Media Tasks</h3>
                  <button
                    type="button"
                    onClick={addSocialTask}
                    className="text-sm text-[#f5efdb] hover:text-[#f5efdb99]"
                  >
                    + Add Social Task
                  </button>
                </div>

                {formData.tasks.social.tasks.map((task, taskIndex) => (
                  <div key={task.id} className="space-y-4 p-4 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a]">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-[#f5efdb]">Task {taskIndex + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeTask('social', taskIndex)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleTaskChange('social', taskIndex, 'title', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66]"
                        placeholder="Task Title"
                      />
                      <textarea
                        value={task.description}
                        onChange={(e) => handleTaskChange('social', taskIndex, 'description', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66]"
                        placeholder="Task Description"
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={task.points}
                          onChange={(e) => handleTaskChange('social', taskIndex, 'points', parseInt(e.target.value))}
                          className="w-24 px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                          placeholder="Points"
                        />
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(e) => handleTaskChange('social', taskIndex, 'dueDate', e.target.value)}
                          className="flex-1 px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
              loading
                ? 'bg-[#f5efdb33] text-[#f5efdb99] cursor-not-allowed'
                : 'bg-[#f5efdb] text-[#2a2a28] hover:opacity-90'
            }`}
          >
            {loading ? 'Creating Project...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
} 