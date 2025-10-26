import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUsers } from '../hooks/useApi';
import { apiClient } from '../services/apiClient';

function AddUserToProjectPage() {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  
  const { data: usersData } = useUsers();
  const { data: projectData } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => apiClient.getProject(projectId || ''),
    enabled: !!projectId
  });
  
  const project = projectData?.data;
  const memberships = project?.memberships || [];
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter users to show only active, unassigned users
  const availableUsers = usersData?.data?.filter((user: any) => {
    if (!user.is_active) return false;
    const isAlreadyAssigned = memberships.some((membership: any) => {
      const membershipUserId = typeof membership.user?.id === 'number' ? membership.user.id : parseInt(membership.user?.id);
      const userId = typeof user.id === 'number' ? user.id : parseInt(user.id);
      return membershipUserId === userId;
    });
    return !isAlreadyAssigned;
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const rate = hourlyRate ? parseFloat(hourlyRate) : undefined;
      await apiClient.addProjectMember(projectId || '', selectedUserId, 'member', rate);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      navigate(`/projects/detail/${projectId}`);
    } catch (error) {
      console.error('Error assigning user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <button
        onClick={() => navigate(`/projects/detail/${projectId}`)}
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Project
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Add User to Project</h1>
      {project && (
        <p className="text-gray-600 mb-6">
          Project: <span className="font-medium">{project.name}</span>
        </p>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
              Select User *
            </label>
            <select
              id="user"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Please select a user --</option>
              {availableUsers.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} - {user.email} {user.role && `(${user.role})`}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate (Optional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <input
                id="hourlyRate"
                type="number"
                step="0.01"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Leave empty if no hourly rate applies</p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(`/projects/detail/${projectId}`)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedUserId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUserToProjectPage;
