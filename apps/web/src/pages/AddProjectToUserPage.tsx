import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProjects } from '../hooks/useApi';
import { apiClient } from '../services/apiClient';

function AddProjectToUserPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();
  
  const { data: projectsData } = useProjects();
  const { data: userData } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => apiClient.getUserById(userId || ''),
    enabled: !!userId
  });
  
  const user = userData?.data;
  const projectMemberships = user?.project_memberships || [];
  
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter projects to show only active, unassigned projects
  const availableProjects = projectsData?.data?.filter((project: any) => {
    if (!project.is_active) return false;
    const isAlreadyAssigned = projectMemberships.some((membership: any) => {
      const membershipProjectId = typeof membership.project_id === 'string' ? membership.project_id : membership.project_id?.toString();
      const projectId = typeof project.id === 'string' ? project.id : project.id?.toString();
      return membershipProjectId === projectId;
    });
    return !isAlreadyAssigned;
  }) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProjectId) {
      alert('Please select a project');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const rate = hourlyRate ? parseFloat(hourlyRate) : undefined;
      await apiClient.addProjectMember(selectedProjectId, userId || '', 'member', rate);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['users', userId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      
      navigate(`/users/detail/${userId}`);
    } catch (error) {
      console.error('Error assigning project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <button
        onClick={() => navigate(`/users/detail/${userId}`)}
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to User
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Project to User</h1>
      {user && (
        <p className="text-gray-600 mb-6">
          User: <span className="font-medium">{user.first_name} {user.last_name}</span>
        </p>
      )}

      <div className="card p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-2">
              Select Project *
            </label>
            <select
              id="project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">-- Please select a project --</option>
              {availableProjects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name} {project.customer?.name && `(${project.customer.name})`}
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
              onClick={() => navigate(`/users/detail/${userId}`)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedProjectId}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProjectToUserPage;
