import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

function EditMembershipPage() {
  const navigate = useNavigate();
  const params = useParams<{ membershipId: string; projectId?: string; userId?: string }>();
  const { membershipId, projectId, userId } = params;
  
  // Debug logging
  console.log('EditMembershipPage params:', params);
  
  const queryClient = useQueryClient();
  
  const [hourlyRate, setHourlyRate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState<'project' | 'user'>('project');

  // Fetch membership data
  const { data: membershipData, isLoading } = useQuery({
    queryKey: ['membership', membershipId],
    queryFn: async () => {
      if (projectId) {
        const project = await apiClient.getProject(projectId);
        const membership = project.data?.memberships?.find((m: any) => 
          m.id.toString() === membershipId || m.uuid === membershipId
        );
        return membership;
      } else if (userId) {
        const user = await apiClient.getUserById(userId);
        const membership = user.data?.project_memberships?.find((m: any) => 
          m.id.toString() === membershipId || m.uuid === membershipId
        );
        return membership;
      }
      return null;
    },
    enabled: !!membershipId && (!!projectId || !!userId),
    staleTime: 0,
    gcTime: 0
  });

  const membership = membershipData as any; // Type assertion since membership type varies

  // Fetch user data separately if we're coming from user detail page
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => apiClient.getUserById(userId || ''),
    enabled: !!userId
  });

  const user = userData?.data;

  useEffect(() => {
    if (membership) {
      setHourlyRate(membership.hourly_rate ? membership.hourly_rate.toString() : '');
      setIsActive(membership.is_active);
      setType(projectId ? 'project' : 'user');
    }
  }, [membership, projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const rate = hourlyRate ? parseFloat(hourlyRate) : undefined;
      await apiClient.updateProjectMember(membershipId || '', {
        hourly_rate: rate,
        is_active: isActive
      });
      
      // Invalidate queries to refresh data
      if (projectId) {
        await queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      }
      if (userId) {
        await queryClient.invalidateQueries({ queryKey: ['users', userId] });
      }
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      
      navigate(type === 'project' ? `/projects/detail/${projectId}` : `/users/detail/${userId}`);
    } catch (error) {
      console.error('Error updating membership:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || (userId && isUserLoading)) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!membership) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-600">Membership not found</p>
      </div>
    );
  }

  // Use membership.user if available (from project detail), otherwise use fetched user data (from user detail)
  const membershipUser = membership.user;
  const displayUser = userId && user ? user : membershipUser;
  const project = membership.project;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <button
        onClick={() => navigate(type === 'project' ? `/projects/detail/${projectId}` : `/users/detail/${userId}`)}
        className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Edit Membership
      </h1>

      <div className="card p-6">
        <form onSubmit={handleSubmit}>
          {/* Always show both User and Project */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User
            </label>
            <div className="px-4 py-2 bg-gray-100 rounded-md text-gray-900">
              {displayUser?.first_name} {displayUser?.last_name} ({displayUser?.email})
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project
            </label>
            <div className="px-4 py-2 bg-gray-100 rounded-md text-gray-900">
              {project?.name} {project?.customer?.name && `(${project.customer.name})`}
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate
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

          <div className="mb-6">
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700 mb-2">
              Membership Status
            </label>
            <label className="flex items-center p-4 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-3">
                <span className="text-sm font-medium text-gray-900">
                  {isActive ? 'Active' : 'Inactive'}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {isActive 
                    ? 'Member can create new time entries for this project'
                    : 'Member cannot create new time entries for this project'
                  }
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(type === 'project' ? `/projects/detail/${projectId}` : `/users/detail/${userId}`)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditMembershipPage;
