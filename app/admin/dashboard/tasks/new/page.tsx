'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
  overview: {
    description: string;
  };
  coverImage: string;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  name?: string;
}

interface TaskFormData {
  title: string;
  description: string;
  projectId: string;
  assignedTo: string;
  deadline: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  platform: 'Twitter' | 'Discord' | 'Telegram' | 'Other';
}

export default function NewTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    projectId: '',
    assignedTo: '',
    deadline: '',
    priority: 'MEDIUM',
    status: 'PENDING',
    platform: 'Twitter'
  });

  // Fetch projects and users for the dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects
        const projectsResponse = await fetch('/api/admin/projects', {
          headers: {
            'Authorization': `Bearer admin@darknightlabs.com`
          }
        });
        const projectsData = await projectsResponse.json();
        
        if (projectsData.success) {
          setProjects(projectsData.data);
          if (projectsData.data.length > 0) {
            setFormData(prev => ({ ...prev, projectId: projectsData.data[0].id }));
          }
        }

        // Fetch users
        const usersResponse = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer admin@darknightlabs.com`
          }
        });
        const usersData = await usersResponse.json();
        
        if (usersData.success) {
          setUsers(usersData.data);
          if (usersData.data.length > 0) {
            setFormData(prev => ({ ...prev, assignedTo: usersData.data[0].email }));
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data');
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer admin@darknightlabs.com`,
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          userId: formData.assignedTo,
          submission: {
            link: '',
            description: '',
            status: 'pending',
            submittedAt: null,
            feedback: '',
            lastUpdated: null
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }

      // Redirect to tasks list
      router.push('/admin/dashboard/tasks');
    } catch (err) {
      console.error('Task creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-display text-[#f5efdb]">Create New Task</h1>
        <Link
          href="/admin/dashboard/tasks"
          className="px-4 py-2 rounded-lg border border-[#f5efdb1a] text-[#f5efdb] hover:bg-[#f5efdb1a] transition-all"
        >
          Back to Tasks
        </Link>
      </div>

      {/* Form */}
      <div className="rounded-xl backdrop-blur-md bg-[#2a2a2833] border border-[#f5efdb1a] p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Project Selection */}
            <div>
              <label htmlFor="projectId" className="block text-sm text-[#f5efdb] mb-2">
                Project
              </label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] focus:outline-none focus:border-[#f5efdb33]"
                required
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* User Assignment */}
            <div>
              <label htmlFor="assignedTo" className="block text-sm text-[#f5efdb] mb-2">
                Assign To
              </label>
              <select
                id="assignedTo"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] focus:outline-none focus:border-[#f5efdb33]"
                required
              >
                <option value="">Select a user</option>
                {users.map(user => (
                  <option key={user.id} value={user.email}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm text-[#f5efdb] mb-2">
                Task Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33]"
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm text-[#f5efdb] mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66] focus:outline-none focus:border-[#f5efdb33] min-h-[150px] resize-none"
                placeholder="Enter task description"
                required
              />
            </div>

            {/* Deadline */}
            <div>
              <label htmlFor="deadline" className="block text-sm text-[#f5efdb] mb-2">
                Deadline
              </label>
              <input
                id="deadline"
                name="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] focus:outline-none focus:border-[#f5efdb33]"
                required
              />
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm text-[#f5efdb] mb-2">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] focus:outline-none focus:border-[#f5efdb33]"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Platform */}
            <div>
              <label htmlFor="platform" className="block text-sm text-[#f5efdb] mb-2">
                Platform
              </label>
              <select
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg bg-[#1e1e1c] border border-[#f5efdb1a] text-[#f5efdb] focus:outline-none focus:border-[#f5efdb33]"
                required
              >
                <option value="Twitter">Twitter</option>
                <option value="Discord">Discord</option>
                <option value="Telegram">Telegram</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Status */}
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
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-all ${
              loading
                ? 'bg-[#f5efdb33] text-[#f5efdb99] cursor-not-allowed'
                : 'bg-[#f5efdb] text-[#2a2a28] hover:opacity-90'
            }`}
          >
            {loading ? 'Creating Task...' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
} 