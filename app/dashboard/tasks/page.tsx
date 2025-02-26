'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface Task {
  taskId: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string;
  type: 'discord' | 'social' | 'assigned';
  status: 'pending' | 'pending_approval' | 'completed' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  points?: number;
  dueDate?: string;
  deadline?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  submission?: {
    link: string;
    description: string;
    status?: string;
    submittedAt?: string;
    feedback?: string;
    lastUpdated?: string;
  };
  completedAt?: string;
  subtasks?: {
    subtaskId: string;
    title: string;
    completed: boolean;
    required: boolean;
  }[];
}

export default function TasksPage() {
  const { user } = useDynamicContext();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending_approval' | 'completed'>('all');

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);
        
        // Fetch both regular tasks and assigned tasks in parallel
        const [tasksResponse, assignedTasksResponse] = await Promise.all([
          fetch('/api/tasks', {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          }),
          fetch('/api/tasks/assigned', {
            headers: {
              'Authorization': `Bearer ${user.email}`
            }
          })
        ]);

        if (!tasksResponse.ok || !assignedTasksResponse.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const [tasksData, assignedTasksData] = await Promise.all([
          tasksResponse.json(),
          assignedTasksResponse.json()
        ]);

        // Transform assigned tasks to match the Task interface
        const transformedAssignedTasks = (assignedTasksData.data || []).map((task: any) => ({
          taskId: task.id,
          projectId: task.projectId,
          projectName: task.projectName,
          title: task.title,
          description: task.description,
          type: 'assigned' as const,
          status: task.status,
          deadline: task.deadline,
          priority: task.priority,
          submission: task.submission,
          completedAt: task.submission?.submittedAt
        }));

        // Combine both types of tasks
        const allTasks = [
          ...(tasksData.success ? tasksData.data : []),
          ...transformedAssignedTasks
        ];

        setTasks(allTasks);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user]);

  const filteredTasks = tasks.filter(task => {
    if (task.type === 'assigned') {
      // For assigned tasks, show all except completed ones when filter is not 'completed'
      if (filter === 'completed') return task.status === 'COMPLETED';
      if (filter === 'pending_approval') return task.submission?.status === 'pending_approval';
      return true;
    } else {
      // For regular tasks (discord/social)
      if (task.status === 'pending') return false;
      if (filter === 'all') return true;
      return task.status === filter;
    }
  });

  const getStatusDisplay = (task: Task) => {
    if (task.type === 'assigned') {
      switch (task.status) {
        case 'COMPLETED':
          return {
            color: 'bg-green-500',
            text: 'Completed',
            textColor: 'text-green-500',
            bgColor: 'bg-green-500/10'
          };
        case 'IN_PROGRESS':
          return {
            color: 'bg-blue-500',
            text: 'In Progress',
            textColor: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
          };
        default:
          return {
            color: 'bg-[#f5efdb33]',
            text: 'Pending',
            textColor: 'text-[#f5efdb66]',
            bgColor: 'bg-[#f5efdb]/10'
          };
      }
    }

    // For regular tasks (discord/social)
    switch (task.status) {
      case 'completed':
        return {
          color: 'bg-green-500',
          text: 'Completed',
          textColor: 'text-green-500',
          bgColor: 'bg-green-500/10'
        };
      case 'pending_approval':
        return {
          color: 'bg-yellow-500',
          text: 'Pending Approval',
          textColor: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10'
        };
      default:
        return {
          color: 'bg-[#f5efdb33]',
          text: 'Not Started',
          textColor: 'text-[#f5efdb66]',
          bgColor: 'bg-[#f5efdb]/10'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-[#f5efdb] text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f5efdb] mx-auto mb-4"></div>
          <p>Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="inline-block px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-[#f5efdb1a] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#f5efdb]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-display text-[#f5efdb]">No Tasks Yet</h2>
            <p className="text-[#f5efdb99]">
              You don't have any tasks yet. Apply to a project first to start completing tasks and earning rewards.
            </p>
          </div>

          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#f5efdb] text-[#2a2a28] hover:opacity-90 transition-all font-medium"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Browse Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display text-[#f5efdb] mb-2">My Tasks</h1>
          <p className="text-[#f5efdb99]">
            Track and manage your tasks across all projects
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(['all', 'pending_approval', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === status
                  ? 'bg-[#f5efdb] text-[#2a2a28]'
                  : 'text-[#f5efdb] hover:bg-[#f5efdb1a]'
              }`}
            >
              {status === 'all' ? 'All' : status === 'pending_approval' ? 'Pending Approval' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid gap-4">
        {filteredTasks.map((task) => {
          const statusDisplay = getStatusDisplay(task);
          return (
            <div
              key={`${task.projectId}-${task.taskId}`}
              className="rounded-lg bg-[#2a2a2855] border border-[#f5efdb1a] p-6 hover:bg-[#2a2a2877] transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <Link
                    href={`/dashboard/projects/${task.projectId}`}
                    className="text-sm font-medium text-[#f5efdb66] hover:text-[#f5efdb] transition-colors"
                  >
                    {task.projectName}
                  </Link>
                  <h3 className="text-lg font-medium text-[#f5efdb]">{task.title}</h3>
                  <p className="text-[#f5efdb99]">{task.description}</p>

                  {task.type === 'assigned' && task.priority && (
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${
                        task.priority === 'HIGH' ? 'bg-red-500/10 text-red-400' :
                        task.priority === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-green-500/10 text-green-400'
                      }`}>
                        {task.priority} Priority
                      </span>
                    </div>
                  )}

                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {task.subtasks.map((subtask) => (
                        <div key={subtask.subtaskId} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full border border-[#f5efdb33] flex items-center justify-center">
                            {subtask.completed ? (
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            ) : (
                              <div className="w-1.5 h-1.5 rounded-full bg-[#f5efdb33]"></div>
                            )}
                          </div>
                          <span className={`text-sm ${
                            subtask.completed ? 'text-[#f5efdb66] line-through' : 'text-[#f5efdb99]'
                          }`}>
                            {subtask.title}
                          </span>
                          {subtask.required && (
                            <span className="text-[#f5efdb66] text-xs">(Required)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={`px-3 py-1 rounded-full text-sm ${statusDisplay.textColor} ${statusDisplay.bgColor}`}>
                    {statusDisplay.text}
                  </div>
                  {task.points && (
                    <div className="text-yellow-400">+{task.points} pts</div>
                  )}
                  <div className="text-[#f5efdb66] text-sm">
                    {task.type === 'assigned' ? task.deadline : task.dueDate}
                  </div>
                  {task.submission && (
                    <div className="text-[#f5efdb99] text-sm truncate max-w-[200px]">
                      <a 
                        href={task.submission.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#f5efdb] hover:underline"
                      >
                        {task.submission.description || 'View Submission'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 