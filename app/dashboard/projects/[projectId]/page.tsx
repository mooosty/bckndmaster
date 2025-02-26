'use client';
 
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Dialog } from '@headlessui/react';
import Link from 'next/link';
import AmbassadorFormPopup from '@/app/components/AmbassadorFormPopup';
import TwitterAuthModal from '@/app/components/TwitterAuthModal';

interface Project {
  id: string;
  name: string;
  coverImage: string;
  status: 'COMING_SOON' | 'LIVE' | 'ENDED';
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
      progress: number;
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
      progress: number;
    };
  };
}

interface TaskProgress {
  userId: string;
  projectId: string;
  tasks: {
    taskId: string;
    type: 'discord' | 'social';
    status: 'pending' | 'pending_approval' | 'completed';
    completedAt?: string;
    submission?: string;
    subtasks?: {
      subtaskId: string;
      completed: boolean;
      completedAt?: string;
    }[];
  }[];
  totalPoints: number;
  completedTasks: number;
}

interface TaskProgressResponse {
  discord?: {
    tasks: Array<{
      id: string;
      progress?: {
        status: 'pending' | 'completed';
        completedAt?: string;
        submission?: string;
        subtasks?: Array<{
          subtaskId: string;
          completed: boolean;
          completedAt?: string;
        }>;
      };
      subtasks?: Array<{
        id: string;
      }>;
    }>;
  };
  social?: {
    tasks: Array<{
      id: string;
      progress?: {
        status: 'pending' | 'completed';
        completedAt?: string;
        submission?: string;
      };
    }>;
  };
  totalPoints: number;
  completedTasks: number;
}

interface TaskType {
  id: string;
  title: string;
  type: 'discord' | 'social' | 'assigned';
  points: number;
}

interface TaskSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskType;
  onTaskSubmitted: (updatedProgress: TaskProgress | null) => void;
}

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

interface AssignedTask {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  submission?: {
    link: string;
    description: string;
    status: string;
    submittedAt: string | null;
    feedback: string;
    lastUpdated: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`rounded-lg px-6 py-4 shadow-lg backdrop-blur-md border ${
        type === 'success' 
          ? 'bg-green-500/10 border-green-500/20 text-green-400' 
          : 'bg-red-500/10 border-red-500/20 text-red-400'
      }`}>
        <div className="flex items-center gap-3">
          <span className={type === 'success' ? 'text-green-400' : 'text-red-400'}>
            {type === 'success' ? '✓' : '✕'}
          </span>
          <p>{message}</p>
          <button 
            onClick={onClose}
            className="ml-4 opacity-60 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskSubmissionModal = ({ isOpen, onClose, task, onTaskSubmitted }: TaskSubmissionModalProps) => {
  const [submission, setSubmission] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { user } = useDynamicContext();
  const params = useParams();
  const projectId = params?.projectId as string;
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      if (task.type === 'assigned') {
        // Handle assigned task submission
        const response = await fetch(`/api/tasks/${task.id}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.email}`
          },
          body: JSON.stringify({
            link: submission,
            description: description,
            status: 'pending_approval'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit task');
        }

        const data = await response.json();
        if (data.success) {
          setToast({
            message: 'Task submitted successfully!',
            type: 'success'
          });
          onTaskSubmitted(null); // Pass null since this is not a progress update
          onClose();
        } else {
          throw new Error(data.error || 'Failed to submit task');
        }
      } else {
        // Handle discord/social task submission
        const response = await fetch(`/api/projects/${projectId}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.email}`
          },
          body: JSON.stringify({
            taskId: task.id,
            type: task.type as 'discord' | 'social',
            submission: submission
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit task');
        }

        const data = await response.json();
        if (data.success) {
          onTaskSubmitted(data.data);
          onClose();
        } else {
          throw new Error(data.error || 'Failed to submit task');
        }
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit task');
    } finally {
      setSubmitting(false);
    }
  };
 
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
          <Dialog.Title className="text-xl font-display text-[#f5efdb] mb-4">
            Submit Task: {task.title}
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#f5efdb99] text-sm mb-2">
                {task.type === 'discord' ? 'Discord Username' : 'Link'}
              </label>
              <input
                type="text"
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                placeholder={task.type === 'discord' ? 'Enter your Discord username' : 'Paste your link'}
                required
                disabled={submitting}
              />
            </div>
            {task.type === 'assigned' && (
              <div>
                <label className="block text-[#f5efdb99] text-sm mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-[#2a2a2866] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33] resize-none h-24"
                  placeholder="Describe your work..."
                  required
                  disabled={submitting}
                />
              </div>
            )}
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <div className="flex justify-between items-center">
              {task.points > 0 && (
                <span className="text-yellow-400 text-sm">+{task.points} pts</span>
              )}
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#f5efdb] text-[#2a2a28] hover:opacity-90 disabled:opacity-50"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default function ProjectDetailsPage() {
  const { user } = useDynamicContext();
  const params = useParams();
  const projectId = params?.projectId as string;
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [submittingCollaboration, setSubmittingCollaboration] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [existingCollaboration, setExistingCollaboration] = useState<{
    status: 'pending' | 'approved' | 'rejected';
    about: string;
    collaboration: string;
  } | null>(null);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
  const [showTwitterAuthModal, setShowTwitterAuthModal] = useState(false);
  const [userTwitterStatus, setUserTwitterStatus] = useState<{
    verified: boolean;
    username?: string;
  } | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | undefined>(undefined);
 
  useEffect(() => {
    if (!user?.email) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch project details, assigned tasks, task progress, collaboration status, and Twitter status in parallel
        const [projectResponse, tasksResponse, progressResponse, collaborationResponse, userResponse] = await Promise.all([
          fetch(`/api/projects/${projectId}`, {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          }),
          fetch(`/api/projects/${projectId}/assigned-tasks`, {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          }),
          fetch(`/api/projects/${projectId}/progress`, {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          }),
          fetch(`/api/projects/${projectId}/collaborate`, {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          }),
          fetch(`/api/users/me`, {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          })
        ]);

        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project details');
        }

        const projectData = await projectResponse.json();
        if (projectData.success) {
          setProject(projectData.data);
        }

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          if (tasksData.success) {
            setAssignedTasks(tasksData.data);
          }
        }

        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          if (progressData.success) {
            setTaskProgress(progressData.data);
          }
        }

        if (collaborationResponse.ok) {
          const collaborationData = await collaborationResponse.json();
          if (collaborationData.success && collaborationData.data) {
            setExistingCollaboration({
              status: collaborationData.data.status,
              about: collaborationData.data.about || '',
              collaboration: collaborationData.data.collaboration || ''
            });
          }
        }

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success) {
            setUserTwitterStatus({
              verified: !!userData.data.twitter?.verified,
              username: userData.data.twitter?.username
            });
          }
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, user?.email]);

  const handleTaskClick = (task: { 
    id: string;
    title: string; 
    type: 'discord' | 'social'; 
    points: number; 
  }) => {
    // Store the task selection action
    const taskAction = () => {
      setSelectedTask({
        ...task,
        type: task.type
      });
    };

    // Check Twitter verification for social tasks
    if (task.type === 'social' && !userTwitterStatus?.verified) {
      setPendingAction(() => taskAction);
      setShowTwitterAuthModal(true);
      return;
    }

    // Only allow clicking if task is in pending status
    const taskStatus = getTaskStatus(task.id);
    if (taskStatus === 'pending') {
      taskAction();
    }
  };

  const getTaskStatus = (taskId: string) => {
    if (!taskProgress?.tasks) return 'pending';
    const task = taskProgress.tasks.find(t => t.taskId === taskId);
    return task?.status || 'pending';
  };

  const getSubtaskStatus = (taskId: string, subtaskId: string) => {
    if (!taskProgress) return false;
    const task = taskProgress.tasks?.find(t => t.taskId === taskId);
    return task?.subtasks?.find(st => st.subtaskId === subtaskId)?.completed || false;
  };

  const getTaskStatusDisplay = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-500',
          size: 'w-3 h-3',
          tooltip: 'Completed'
        };
      case 'pending_approval':
        return {
          color: 'bg-yellow-500',
          size: 'w-3 h-3',
          tooltip: 'Pending Admin Approval'
        };
      case 'pending':
      default:
        return {
          color: 'bg-[#f5efdb33]',
          size: 'w-2 h-2',
          tooltip: 'Not Started'
        };
    }
  };

  const handleTaskSubmitted = (updatedProgress: TaskProgress | null) => {
    if (updatedProgress) {
      setTaskProgress(updatedProgress);
      // Update project progress percentages
      if (project && updatedProgress?.tasks) {
        const discordTasks = project.tasks.discord.tasks || [];
        const socialTasks = project.tasks.social.tasks || [];
        
        const discordCompleted = discordTasks.filter(task => 
          updatedProgress.tasks.some(t => t.taskId === task.id && t.status === 'completed')
        ).length;
        
        const socialCompleted = socialTasks.filter(task => 
          updatedProgress.tasks.some(t => t.taskId === task.id && t.status === 'completed')
        ).length;

        setProject({
          ...project,
          tasks: {
            ...project.tasks,
            discord: {
              ...project.tasks.discord,
              progress: discordTasks.length > 0 ? Math.round((discordCompleted / discordTasks.length) * 100) : 0
            },
            social: {
              ...project.tasks.social,
              progress: socialTasks.length > 0 ? Math.round((socialCompleted / socialTasks.length) * 100) : 0
            }
          }
        });
      }
    } else {
      // Refresh assigned tasks after submission
      if (user?.email) {
        fetch(`/api/projects/${projectId}/assigned-tasks`, {
          headers: {
            'Authorization': `Bearer ${user.email}`
          }
        }).then(res => res.json())
          .then(data => {
            if (data.success) {
              setAssignedTasks(data.data);
            }
          });
      }
    }
  };

  const handleCollaborationSubmit = async (data: any) => {
    try {
      if (!user?.email) {
        console.log('No user email found');
        setToast({
          message: 'Please sign in to submit a collaboration request',
          type: 'error'
        });
        return;
      }

      setSubmittingCollaboration(true);
      
      const response = await fetch(`/api/projects/${projectId}/collaborate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.email}`
        },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();
      console.log('Server response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to submit collaboration request');
      }

      if (responseData.success) {
        console.log('Collaboration request successful:', responseData.data);
        setToast({
          message: 'Collaboration request submitted successfully! We will review your request and get back to you soon.',
          type: 'success'
        });
        setShowCollaborationModal(false);
        // Update the existing collaboration state
        setExistingCollaboration({
          status: responseData.data.status,
          about: responseData.data.about || '',
          collaboration: responseData.data.collaboration || ''
        });
      } else {
        throw new Error(responseData.error || 'Failed to submit collaboration request');
      }
    } catch (error) {
      console.error('Error submitting collaboration request:', error);
      setToast({
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again later.',
        type: 'error'
      });
    } finally {
      setSubmittingCollaboration(false);
    }
  };

  const handleTaskSubmit = async (task: AssignedTask) => {
    try {
      if (!user?.email) return;

      setSelectedTask({
        id: task.id,
        title: task.title,
        type: 'assigned',
        points: 0
      });
      setSubmissionModalOpen(true);
    } catch (error) {
      console.error('Error handling task:', error);
      setToast({
        message: error instanceof Error ? error.message : 'Failed to handle task',
        type: 'error'
      });
    }
  };

  const handleSubmissionComplete = () => {
    setSubmissionModalOpen(false);
    // Refresh assigned tasks
    if (user?.email) {
      fetch(`/api/projects/${projectId}/assigned-tasks`, {
        headers: {
          'Authorization': `Bearer ${user.email}`
        }
      }).then(res => res.json())
        .then(data => {
          if (data.success) {
            setAssignedTasks(data.data);
          }
        });
    }
  };

  const handleCollaborationClick = () => {
    // Store the collaboration action
    const collaborationAction = () => setShowCollaborationModal(true);

    if (!userTwitterStatus?.verified) {
      setPendingAction(() => collaborationAction);
      setShowTwitterAuthModal(true);
      return;
    }
    collaborationAction();
  };

  const handleTwitterAuthSuccess = () => {
    // Refresh user data to get updated Twitter status
    if (user?.email) {
      fetch(`/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${user.email}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUserTwitterStatus({
              verified: !!data.data.twitter?.verified,
              username: data.data.twitter?.username
            });
          }
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-[#f5efdb] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5efdb] mx-auto mb-4"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 mb-4">{error}</div>
          <Link
            href="/dashboard/projects"
            className="inline-block px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#1a1a18] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-[#f5efdb] mb-4">Project not found</div>
          <Link
            href="/dashboard/projects"
            className="inline-block px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-[#1a1a18] text-[#f5efdb] pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
        {/* Project Header */}
        <div className="relative w-full h-[300px] rounded-xl overflow-hidden mb-8">
          <Image
            src={project.coverImage}
            alt={project.name}
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8">
            <h1 className="text-4xl font-display text-[#f5efdb] mb-2">{project.name}</h1>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full text-sm text-[#f5efdb] bg-[#f5efdb1a] border border-[#f5efdb33]">
                {project.status.replace('_', ' ')}
              </span>
              {project.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 rounded-full text-sm text-purple-400 bg-purple-400/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
 
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Overview */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h2 className="text-2xl font-display text-[#f5efdb] mb-4">Overview</h2>
              <p className="text-[#f5efdb99] leading-relaxed">
                {project.overview.description}
              </p>
            </div>
 
            {/* NFT Details */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h2 className="text-2xl font-display text-[#f5efdb] mb-4">{project.nftDetails.title}</h2>
              <p className="text-[#f5efdb99] mb-4">
                {project.nftDetails.description}
              </p>
              <ul className="list-disc list-inside space-y-2 text-[#f5efdb99]">
                {project.nftDetails.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
 
            {/* How to Mint */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h2 className="text-2xl font-display text-[#f5efdb] mb-4">How to Mint</h2>
              <ol className="list-decimal list-inside space-y-2 text-[#f5efdb99]">
                {project.howToMint.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>

            {/* Tasks & Progress Section */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-display text-[#f5efdb]">Tasks & Progress</h2>
                <span className="text-[#f5efdb99]">
                  {taskProgress ? (
                    `${taskProgress.completedTasks || 0}/${(project.tasks?.discord?.tasks?.length || 0) + (project.tasks?.social?.tasks?.length || 0)} Tasks Completed`
                  ) : '0/0 Tasks Completed'}
                </span>
              </div>

              {/* Discord Tasks */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-400">👾</span>
                    <h3 className="text-lg font-display text-[#f5efdb]">{project.tasks.discord.title}</h3>
                  </div>
                  <span className="text-[#f5efdb99]">{project.tasks.discord.progress}%</span>
                </div>

                {project.tasks.discord.tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a] p-4 ${
                      getTaskStatus(task.id) === 'pending' 
                        ? 'cursor-pointer hover:bg-[#2a2a2877] transition-colors' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    onClick={() => handleTaskClick({
                      id: task.id,
                      title: task.title,
                      type: 'discord',
                      points: task.points
                    })}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border border-[#f5efdb33] flex items-center justify-center group relative">
                          {(() => {
                            const status = getTaskStatus(task.id);
                            const statusDisplay = getTaskStatusDisplay(status);
                            return (
                              <>
                                <div className={`rounded-full ${statusDisplay.color} ${statusDisplay.size}`}></div>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#2a2a28] text-xs text-[#f5efdb] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                  {statusDisplay.tooltip}
                                  {status !== 'pending' && (
                                    <div className="mt-1 text-[#f5efdb99]">
                                      {status === 'pending_approval' ? 'Waiting for admin approval' : 'Task already completed'}
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <h4 className="text-[#f5efdb] font-medium">{task.title}</h4>
                          <p className="text-[#f5efdb99] text-sm">{task.description}</p>
                          
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {task.subtasks.map((subtask) => (
                                <div key={subtask.id} className="flex items-center gap-2 text-sm">
                                  <div className="w-3 h-3 rounded-full border border-[#f5efdb33] flex items-center justify-center">
                                    {getSubtaskStatus(task.id, subtask.id) ? (
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                    ) : (
                                      <div className="w-1 h-1 rounded-full bg-[#f5efdb33]"></div>
                                    )}
                                  </div>
                                  <span className={`${getSubtaskStatus(task.id, subtask.id) ? 'text-[#f5efdb99] line-through' : 'text-[#f5efdb]'}`}>
                                    {subtask.title}
                                  </span>
                                  {subtask.required && (
                                    <span className="text-[#f5efdb66]">(Required)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-yellow-400 text-sm">+{task.points} pts</span>
                        <span className="text-[#f5efdb66] text-sm">{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Social Media Tasks */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400">🐦</span>
                    <h3 className="text-lg font-display text-[#f5efdb]">{project.tasks.social.title}</h3>
                  </div>
                  <span className="text-[#f5efdb99]">{project.tasks.social.progress}%</span>
                </div>

                {project.tasks.social.tasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a] p-4 ${
                      getTaskStatus(task.id) === 'pending' 
                        ? 'cursor-pointer hover:bg-[#2a2a2877] transition-colors' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    onClick={() => handleTaskClick({
                      id: task.id,
                      title: task.title,
                      type: 'social',
                      points: task.points
                    })}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border border-[#f5efdb33] flex items-center justify-center group relative">
                          {(() => {
                            const status = getTaskStatus(task.id);
                            const statusDisplay = getTaskStatusDisplay(status);
                            return (
                              <>
                                <div className={`rounded-full ${statusDisplay.color} ${statusDisplay.size}`}></div>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#2a2a28] text-xs text-[#f5efdb] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                  {statusDisplay.tooltip}
                                  {status !== 'pending' && (
                                    <div className="mt-1 text-[#f5efdb99]">
                                      {status === 'pending_approval' ? 'Waiting for admin approval' : 'Task already completed'}
                                    </div>
                                  )}
                                </div>
                              </>
                            );
                          })()}
                        </div>
                        <div>
                          <h4 className="text-[#f5efdb] font-medium">{task.title}</h4>
                          <p className="text-[#f5efdb99] text-sm">{task.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-yellow-400 text-sm">+{task.points} pts</span>
                        <span className="text-[#f5efdb66] text-sm">{task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Your Assigned Tasks */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[#f5efdb]">📋</span>
                    <h3 className="text-lg font-display text-[#f5efdb]">Your Assigned Tasks</h3>
                  </div>
                  <span className="text-[#f5efdb99]">
                    {assignedTasks.filter(task => task.submission?.status === 'completed').length}/{assignedTasks.length} Tasks Completed
                  </span>
                </div>

                {assignedTasks.length === 0 ? (
                  <div className="text-[#f5efdb66] text-center py-4 bg-[#2a2a2855] rounded-lg border border-[#f5efdb1a]">
                    No tasks assigned yet
                  </div>
                ) : (
                  assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a] p-6 hover:bg-[#2a2a2877] transition-colors cursor-pointer"
                      onClick={() => handleTaskSubmit(task)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-[#f5efdb33] flex items-center justify-center">
                            {task.submission ? (
                              <div className={`w-2 h-2 rounded-full ${
                                task.submission.status === 'completed' ? 'bg-green-500' :
                                task.submission.status === 'pending_approval' ? 'bg-yellow-500' :
                                'bg-[#f5efdb33]'
                              }`}></div>
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#f5efdb33]"></div>
                            )}
                          </div>
                          <span className="text-[#f5efdb]">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                            task.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-green-500/10 text-green-400'
                          }`}>
                            {task.priority}
                          </span>
                          <span className="text-[#f5efdb66] text-sm">Due: {new Date(task.deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {task.description && (
                        <p className="mt-2 text-[#f5efdb99] text-sm">{task.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
 
          {/* Sidebar with Key Details */}
          <div className="lg:w-80 space-y-4">
            {/* Mint Details Card */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h3 className="text-lg font-display text-[#f5efdb] mb-4">Mint Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[#f5efdb99] text-sm">Chain</p>
                  <p className="text-[#f5efdb]">{project.mintDetails.chain}</p>
                </div>
                <div>
                  <p className="text-[#f5efdb99] text-sm">Supply</p>
                  <p className="text-[#f5efdb]">{project.mintDetails.supply}</p>
                </div>
                <div>
                  <p className="text-[#f5efdb99] text-sm">Mint Date</p>
                  <p className="text-[#f5efdb]">{project.mintDetails.mintDate}</p>
                </div>
              </div>
            </div>
 
            {/* Mint Phases Card */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h3 className="text-lg font-display text-[#f5efdb] mb-4">Mint Phases</h3>
              <div className="space-y-3">
                {project.mintDetails.phases.map((phase, index) => (
                  <div key={index}>
                    <p className="text-[#f5efdb99] text-sm">{phase.name}</p>
                    <p className="text-[#f5efdb]">{phase.duration} - {phase.time}</p>
                  </div>
                ))}
              </div>
            </div>
 
            {/* Links Card */}
            <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-6">
              <h3 className="text-lg font-display text-[#f5efdb] mb-4">Important Links</h3>
              <div className="space-y-2">
                {project.importantLinks.map((link, index) => (
                  <a 
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[#f5efdb] hover:opacity-80"
                  >
                    {link.icon} {link.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Apply Button - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a18]/80 backdrop-blur-md border-t border-[#f5efdb1a] p-4 z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div>
            <h3 className="text-[#f5efdb] font-display text-center sm:text-left">{project.collaboration.title}</h3>
            <p className="text-[#f5efdb99] text-center sm:text-left">{project.collaboration.description}</p>
          </div>
          <div className="relative group">
            <button 
              disabled={!project.collaboration.enabled || existingCollaboration !== null}
              onClick={handleCollaborationClick}
              className={`w-full sm:w-auto px-8 py-3 rounded-lg transition-all font-medium ${
                project.collaboration.enabled && !existingCollaboration
                  ? 'bg-[#f5efdb] text-[#2a2a28] hover:opacity-90'
                  : existingCollaboration?.status === 'approved'
                  ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                  : existingCollaboration?.status === 'rejected'
                  ? 'bg-red-500/20 text-red-400 cursor-not-allowed'
                  : existingCollaboration?.status === 'pending'
                  ? 'bg-yellow-500/20 text-yellow-400 cursor-not-allowed'
                  : 'bg-[#f5efdb33] text-[#f5efdb66] cursor-not-allowed'
              }`}
            >
              {existingCollaboration 
                ? existingCollaboration.status === 'approved'
                  ? 'Application Approved'
                  : existingCollaboration.status === 'rejected'
                  ? 'Application Rejected'
                  : 'Application Pending'
                : 'Collaborate Now'
              }
            </button>
            {(!project.collaboration.enabled || existingCollaboration) && (
              <div className="absolute bottom-full mb-2 w-48 p-2 bg-[#2a2a28] border border-[#f5efdb1a] rounded-lg text-[#f5efdb99] text-sm text-center
                opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {existingCollaboration
                  ? existingCollaboration.status === 'approved'
                    ? 'Your application has been approved!'
                    : existingCollaboration.status === 'rejected'
                    ? 'Your application has been rejected'
                    : 'Your application is being reviewed'
                  : project.collaboration.disabledMessage
                }
              </div>
            )}
          </div>
        </div>
      </div>
 
      {/* Task Submission Modal */}
      {selectedTask && (
        <TaskSubmissionModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onTaskSubmitted={handleTaskSubmitted}
        />
      )}

      {/* Replace CollaborationModal with AmbassadorFormPopup */}
      {showCollaborationModal && (
        <AmbassadorFormPopup
          onClose={() => setShowCollaborationModal(false)}
          onSubmit={handleCollaborationSubmit}
          uid={user?.email || ''}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Twitter Auth Modal */}
      <TwitterAuthModal
        isOpen={showTwitterAuthModal}
        onClose={() => {
          setShowTwitterAuthModal(false);
          setPendingAction(undefined);
        }}
        onSuccess={handleTwitterAuthSuccess}
        pendingAction={pendingAction}
      />
    </div>
  );
} 