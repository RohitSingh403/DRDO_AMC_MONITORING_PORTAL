import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { tasksAPI } from '../services/api';
import LoadingSpinner from './ui/LoadingSpinner';
import TaskUpdateForm from './TaskUpdateForm';
import Alert from './ui/Alert';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [userRole, setUserRole] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  // Get user role on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      const decoded = jwtDecode(token);
      setUserRole(decoded.role);
    } catch (err) {
      console.error('Error decoding token:', err);
      navigate('/login');
    }
  }, [navigate]);

  // Fetch tasks based on user role and active tab
  useEffect(() => {
    const fetchTasks = async () => {
      if (!userRole) return;
      
      try {
        setLoading(true);
        setError('');
        
        let response;
        
        if (userRole === 'admin') {
          response = activeTab === 'all' 
            ? await tasksAPI.getAll()
            : await tasksAPI.getByCategory(activeTab);
        } else {
          const userId = jwtDecode(localStorage.getItem('token')).userId;
          response = await tasksAPI.getUserTasks(userId);
        }
        
        setTasks(Array.isArray(response.tasks) ? response.tasks : []);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError(err.message || 'Failed to load tasks. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchTasks();
  }, [userRole, activeTab]);

  // Handle task status update
  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      setIsUpdating(true);
      setError('');
      
      // Optimistic UI update
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status: newStatus } : task
      ));
      
      // Make API call to update status
      await tasksAPI.updateStatus(taskId, newStatus);
      
    } catch (err) {
      console.error('Error updating task status:', err);
      setError(err.message || 'Failed to update task status. Please try again.');
      
      // Revert optimistic update on error
      setTasks(tasks);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Admin tabs
  const adminTabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          {userRole === 'admin' ? 'Task Management' : 'My Tasks'}
        </h2>
      </div>

      {/* Tabs - Only show for admin */}
      {userRole === 'admin' && (
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {adminTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors duration-200`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Task Update Form Modal */}
      {showUpdateForm && selectedTask && (
        <TaskUpdateForm 
          task={selectedTask}
          onClose={() => setShowUpdateForm(false)}
          onUpdate={() => {
            fetchTasks();
            setShowUpdateForm(false);
            // Dispatch event to notify parent components
            window.dispatchEvent(new Event('tasksUpdated'));
          }}
        />
      )}
      {/* Task table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              {userRole === 'admin' && (
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned To
                </th>
              )}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={userRole === 'admin' ? 6 : 5} className="px-6 py-8 text-center">
                  <div className="text-center py-8 text-gray-500">
                    <svg 
                      className="mx-auto h-12 w-12 text-gray-400" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {activeTab === 'all' 
                        ? 'Get started by creating a new task.' 
                        : `No ${activeTab} tasks found.`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr 
                  key={task.id} 
                  className="hover:bg-gray-50 transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-gray-500 mt-1">{task.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                      {task.category}
                    </span>
                  </td>
                  {userRole === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {task.assignedTo?.name || 'Unassigned'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.assignedTo?.email || ''}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(task.dueDate || task.benchmarkTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>
                      {task.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleStatusUpdate(task.id, 'in-progress')}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      disabled={task.status === 'in-progress'}
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(task.id, 'completed')}
                      className="text-green-600 hover:text-green-900 mr-2"
                      disabled={task.status === 'completed'}
                    >
                      Complete
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        setShowUpdateForm(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Update task"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Task Update Form Modal */}
      {showUpdateForm && selectedTask && (
        <TaskUpdateForm 
          task={selectedTask}
          onClose={() => setShowUpdateForm(false)}
          onUpdate={() => {
            fetchTasks();
            // Dispatch event to notify parent components
            window.dispatchEvent(new Event('tasksUpdated'));
          }}
        />
      )}
    </div>
  );
};

export default TaskList;
