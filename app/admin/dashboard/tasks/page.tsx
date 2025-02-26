'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, message, Space, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, LinkOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface TaskProgress {
  taskId: string;
  projectId: string;
  projectName: string;
  userId: string;
  userEmail: string;
  title: string;
  description: string;
  type: string;
  status: string;
  points: number;
  dueDate: string;
  submission?: string | {
    link: string;
    description: string;
    submittedAt: string;
    content: string;
    files?: {
      name: string;
      url: string;
      type: string;
    }[];
  };
  completedAt?: Date;
  subtasks?: {
    subtaskId: string;
    title: string;
    completed: boolean;
    required: boolean;
  }[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectTitle: string;
  deadline: string;
  priority: string;
  status: string;
  points: number;
}

const TasksPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('1');
  const [selectedSubmission, setSelectedSubmission] = useState<TaskProgress | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, progressResponse] = await Promise.all([
        fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer admin@darknightlabs.com`
          }
        }),
        fetch('/api/admin/task-progress', {
          headers: {
            'Authorization': `Bearer admin@darknightlabs.com`
          }
        })
      ]);

      if (!tasksResponse.ok || !progressResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const tasksData = await tasksResponse.json();
      const progressData = await progressResponse.json();

      setTasks(tasksData.data || []);
      setTaskProgress(progressData.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      message.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const handleApproveReject = async (taskId: string, projectId: string, userId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/task-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer admin@darknightlabs.com`
        },
        body: JSON.stringify({
          taskId,
          projectId,
          userId,
          action
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      message.success(`Task ${action}d successfully`);
      fetchData(); // Refresh data
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to update task status');
    }
  };

  const handleViewSubmission = (task: TaskProgress) => {
    setSelectedSubmission(task);
  };

  const closeSubmissionModal = () => {
    setSelectedSubmission(null);
  };

  const SubmissionModal = ({ task, onClose }: { task: TaskProgress; onClose: () => void }) => {
    if (!task.submission) return null;

    // Handle both string and object submission types
    const submissionContent = typeof task.submission === 'string' ? task.submission : task.submission.content;
    const submissionDate = typeof task.submission === 'string' ? 
      (task.completedAt ? new Date(task.completedAt).toLocaleDateString() : new Date().toLocaleDateString()) :
      new Date(task.submission.submittedAt).toLocaleDateString();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#2a2a28] rounded-xl border border-[#f5efdb1a] p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-medium text-[#f5efdb] mb-1">{task.title}</h3>
              <p className="text-[#f5efdb99] text-sm">
                Submitted by {task.userEmail} • {submissionDate}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#f5efdb99] hover:text-[#f5efdb] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-[#1a1a18] rounded-lg p-4 border border-[#f5efdb1a]">
              <div className="mb-2">
                <span className="text-[#f5efdb99] text-sm">Submission Content</span>
              </div>
              <div className="text-[#f5efdb] whitespace-pre-wrap">
                {submissionContent}
              </div>
            </div>

            {typeof task.submission === 'object' && (
              <>
                {task.submission.files && task.submission.files.length > 0 && (
                  <div className="bg-[#1a1a18] rounded-lg p-4 border border-[#f5efdb1a]">
                    <div className="mb-2">
                      <span className="text-[#f5efdb99] text-sm">Attached Files</span>
                    </div>
                    <div className="space-y-2">
                      {task.submission.files.map((file, index) => (
                        <a
                          key={index}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <LinkOutlined />
                          {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {task.submission.link && (
                  <div className="bg-[#1a1a18] rounded-lg p-4 border border-[#f5efdb1a]">
                    <div className="flex items-center gap-2 mb-2">
                      <LinkOutlined className="text-[#f5efdb99]" />
                      <span className="text-[#f5efdb99] text-sm">External Link</span>
                    </div>
                    <a
                      href={task.submission.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 transition-colors break-all"
                    >
                      {task.submission.link}
                    </a>
                  </div>
                )}

                {task.submission.description && (
                  <div className="bg-[#1a1a18] rounded-lg p-4 border border-[#f5efdb1a]">
                    <div className="mb-2">
                      <span className="text-[#f5efdb99] text-sm">Additional Notes</span>
                    </div>
                    <p className="text-[#f5efdb] whitespace-pre-wrap">{task.submission.description}</p>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center gap-2 mt-6">
              <div className={`px-3 py-1 rounded-full text-sm inline-block ${
                task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                task.status === 'pending_approval' ? 'bg-yellow-500/10 text-yellow-400' :
                'bg-[#f5efdb10] text-[#f5efdb99]'
              }`}>
                {task.status.toUpperCase()}
              </div>
              <div className="text-yellow-400 font-medium">
                {task.points} pts
              </div>
            </div>

            {task.status !== 'completed' && (
              <div className="flex gap-2 mt-6 pt-6 border-t border-[#f5efdb1a]">
                <button
                  onClick={() => {
                    handleApproveReject(task.taskId, task.projectId, task.userId, 'approve');
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
                >
                  <CheckCircleOutlined className="mr-1" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    handleApproveReject(task.taskId, task.projectId, task.userId, 'reject');
                    onClose();
                  }}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  <CloseCircleOutlined className="mr-1" />
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredProgress = taskProgress.filter(progress => {
    const matchesSearch = 
      progress.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isRelevantStatus = progress.status === 'completed' || progress.status === 'pending_approval';
    const matchesStatus = statusFilter === 'all' ? isRelevantStatus : (progress.status === statusFilter && isRelevantStatus);
    
    return matchesSearch && matchesStatus;
  });

  const progressColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <span className="font-medium text-[#f5efdb]">{text}</span>
      ),
    },
    {
      title: 'User',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (email: string) => (
        <div className="px-3 py-1 bg-[#f5efdb10] rounded-full text-[#f5efdb99] text-sm inline-block">
          {email}
        </div>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string) => (
        <div className="px-3 py-1 bg-[#2a2a28] rounded-full text-[#f5efdb] text-sm inline-block border border-[#f5efdb1a]">
          {text}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          completed: {
            color: 'bg-green-500/10',
            text: 'text-green-400',
            label: 'COMPLETED'
          },
          pending_approval: {
            color: 'bg-yellow-500/10',
            text: 'text-yellow-400',
            label: 'PENDING_APPROVAL'
          },
          default: {
            color: 'bg-[#f5efdb10]',
            text: 'text-[#f5efdb99]',
            label: status.toUpperCase()
          }
        };

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.default;

        return (
          <div className={`px-3 py-1 ${config.color} rounded-full ${config.text} text-sm inline-block`}>
            {config.label}
          </div>
        );
      }
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      render: (points: number) => (
        <div className="text-yellow-400 font-medium">
          {points} pts
        </div>
      ),
    },
    {
      title: 'Submission',
      dataIndex: 'submission',
      key: 'submission',
      render: (_: unknown, record: TaskProgress) => record.submission ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            handleViewSubmission(record);
          }}
          className="text-blue-400 hover:text-blue-300 transition-colors"
        >
          View Submission
        </button>
      ) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: TaskProgress) => (
        <Space>
          {record.status !== 'completed' && (
            <>
              <button
                onClick={() => handleApproveReject(record.taskId, record.projectId, record.userId, 'approve')}
                className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
              >
                <CheckCircleOutlined className="mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleApproveReject(record.taskId, record.projectId, record.userId, 'reject')}
                className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
              >
                <CloseCircleOutlined className="mr-1" />
                Reject
              </button>
            </>
          )}
        </Space>
      ),
    }
  ];

  const items = [
    {
      key: '2',
      label: 'Task Progress',
      children: (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f5efdb1a]">
                <th className="text-left py-4 px-6 text-[#f5efdb99] font-medium">Title</th>
                <th className="text-left py-4 px-6 text-[#f5efdb99] font-medium">User</th>
                <th className="text-left py-4 px-6 text-[#f5efdb99] font-medium">Project</th>
                <th className="text-left py-4 px-6 text-[#f5efdb99] font-medium">Status</th>
                <th className="text-left py-4 px-6 text-[#f5efdb99] font-medium">Points</th>
                <th className="text-left py-4 px-6 text-[#f5efdb99] font-medium">Submission</th>
                <th className="text-left py-4 px-6 text-[#f5efdb99] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProgress.map((task) => (
                <tr key={task.taskId} className="border-b border-[#f5efdb1a] hover:bg-[#2a2a28]">
                  <td className="py-4 px-6">
                    <span className="font-medium text-[#f5efdb]">{task.title}</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="px-3 py-1 bg-[#f5efdb10] rounded-full text-[#f5efdb99] text-sm inline-block">
                      {task.userEmail}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="px-3 py-1 bg-[#2a2a28] rounded-full text-[#f5efdb] text-sm inline-block border border-[#f5efdb1a]">
                      {task.projectName}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`px-3 py-1 rounded-full text-sm inline-block ${
                      task.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      task.status === 'pending_approval' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-[#f5efdb10] text-[#f5efdb99]'
                    }`}>
                      {task.status.toUpperCase()}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-yellow-400 font-medium">
                      {task.points} pts
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {task.submission ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleViewSubmission(task);
                        }}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Submission
                      </button>
                    ) : '-'}
                  </td>
                  <td className="py-4 px-6">
                    {task.status !== 'completed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveReject(task.taskId, task.projectId, task.userId, 'approve')}
                          className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
                        >
                          <CheckCircleOutlined className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleApproveReject(task.taskId, task.projectId, task.userId, 'reject')}
                          className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                          <CloseCircleOutlined className="mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a18] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} className="!text-[#f5efdb] !mb-1">
              Tasks Management
            </Title>
            <p className="text-[#f5efdb99]">
              Manage and monitor all tasks and submissions
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => router.push('/admin/dashboard/tasks/new')}
            className="bg-[#f5efdb] hover:bg-[#f5efdb]/90 text-[#1a1a18]"
          >
            Create New Task
          </Button>
        </div>

        <div className="bg-[#2a2a28] p-6 rounded-lg shadow-lg border border-[#f5efdb1a] space-y-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search tasks..."
              prefix={<SearchOutlined className="text-[#f5efdb99]" />}
              onChange={e => handleSearch(e.target.value)}
              className="max-w-md bg-[#1a1a18] border-[#f5efdb1a] text-[#f5efdb] placeholder-[#f5efdb66]"
              size="large"
            />
            <Select
              defaultValue="all"
              style={{ width: 200 }}
              onChange={handleStatusFilter}
              size="large"
              className="!bg-[#1a1a18] !border-[#f5efdb1a]"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'completed', label: 'Completed' },
                { value: 'pending_approval', label: 'Pending Approval' }
              ]}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded">
              <p className="flex items-center">
                <CloseCircleOutlined className="mr-2" />
                {error}
              </p>
            </div>
          )}

          <div className="border-b border-[#f5efdb1a] mb-6">
            <button
              className={`px-6 py-3 text-[#f5efdb] border-b-2 ${
                activeTab === '2' ? 'border-[#f5efdb] font-medium' : 'border-transparent text-[#f5efdb99]'
              }`}
              onClick={() => setActiveTab('2')}
            >
              Task Progress
            </button>
          </div>

          {items.find(item => item.key === activeTab)?.children}

          {selectedSubmission && (
            <SubmissionModal
              task={selectedSubmission}
              onClose={closeSubmissionModal}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;