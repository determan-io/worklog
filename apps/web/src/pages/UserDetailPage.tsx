import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser, useProjects } from '../hooks/useApi';
import { apiClient } from '../services/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'active' | 'inactive'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage, setProjectsPerPage] = useState(10);
  const queryClient = useQueryClient();
  const { data: userData, isLoading: userLoading } = useUser(id || '');
  const user = userData?.data;

  // Get project memberships for this user
  const projectMemberships = user?.project_memberships || [];

  // Get all time entries for this user across all projects
  const { data: projectsData } = useProjects({});
  const projects = projectsData?.data || [];
  
  // Get all time entries for this user
  const getAllTimeEntries = () => {
    const allEntries: any[] = [];
    projects.forEach((project: any) => {
      if (project.time_entries) {
        project.time_entries.forEach((entry: any) => {
          if (entry.user?.uuid === user?.uuid) {
            allEntries.push(entry);
          }
        });
      }
    });
    return allEntries;
  };

  const timeEntries = getAllTimeEntries();

  // Filter entries for the selected period
  const getFilteredEntries = () => {
    const now = new Date();
    let startDate = new Date();
    
    if (selectedPeriod === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    return timeEntries.filter((entry: any) => {
      const entryDate = new Date(entry.entry_date);
      return entryDate >= startDate && entryDate <= now;
    });
  };

  const filteredEntries = getFilteredEntries();

  // Calculate statistics for the selected period
  const getEntryHours = (entry: any) => {
    return typeof entry.duration_hours === 'string' ? parseFloat(entry.duration_hours) : (entry.duration_hours || 0);
  };

  const totalHours = filteredEntries.reduce((sum: number, entry: any) => sum + getEntryHours(entry), 0);
  const billableHours = filteredEntries.filter((e: any) => e.is_billable).reduce((sum: number, entry: any) => sum + getEntryHours(entry), 0);
  const nonBillableHours = totalHours - billableHours;
  const avgHoursPerWeek = selectedPeriod === 'week' ? totalHours : selectedPeriod === 'month' ? totalHours / 4 : totalHours / 52;

  // Status breakdown
  const statusCounts = filteredEntries.reduce((acc: any, entry: any) => {
    acc[entry.status] = (acc[entry.status] || 0) + 1;
    return acc;
  }, {});

  // Filter project memberships by membership status (not project status)
  const filteredMemberships = projectMemberships.filter((membership: any) => 
    membership.is_active === (projectStatusFilter === 'active')
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredMemberships.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const endIndex = startIndex + projectsPerPage;
  const paginatedMemberships = filteredMemberships.slice(startIndex, endIndex);

  // Reset to page 1 when filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [projectStatusFilter, projectsPerPage]);

  const isLoading = userLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">User not found</h2>
          <button onClick={() => navigate('/users')} className="btn-secondary">
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <button
            onClick={() => navigate('/users')}
            className="text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Users
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.first_name} {user.last_name}
          </h1>
          <div className="mt-1 flex items-center space-x-4 text-gray-600">
            <span>📧 {user.email}</span>
            <span className={`px-2 py-1 rounded-full text-xs ${
              user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
              {user.role}
            </span>
          </div>
        </div>
        <button
          onClick={() => navigate(`/users/edit/${user.uuid}`)}
          className="btn-outline btn-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit User
        </button>
      </div>

      {/* Summary Section */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Summary</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedPeriod === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedPeriod === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                selectedPeriod === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Year
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600 mb-1">Total Hours</p>
            <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(2)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600 mb-1">Billable</p>
            <p className="text-3xl font-bold text-gray-900">{billableHours.toFixed(2)}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-600 mb-1">Non-Billable</p>
            <p className="text-3xl font-bold text-gray-900">{nonBillableHours.toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-600 mb-1">Avg/Week</p>
            <p className="text-3xl font-bold text-gray-900">{avgHoursPerWeek.toFixed(2)}</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Entry Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-600">Draft</p>
              <p className="text-2xl font-semibold text-gray-900">{statusCounts.draft || 0}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-semibold text-blue-600">{statusCounts.submitted || 0}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-semibold text-green-600">{statusCounts.approved || 0}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-semibold text-red-600">{statusCounts.rejected || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Projects */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Assigned Projects</h3>
          <button
            onClick={() => navigate(`/users/${user?.id}/add-project`)}
            className="btn-primary btn-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Project
          </button>
        </div>

        {/* Filter */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setProjectStatusFilter('active')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                projectStatusFilter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setProjectStatusFilter('inactive')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                projectStatusFilter === 'inactive' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Filtered and paginated projects */}
        {paginatedMemberships.length > 0 ? (
          <div className="space-y-3">
            {paginatedMemberships.map((membership: any) => (
              <div key={membership.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <button
                      onClick={() => navigate(`/projects/detail/${membership.project.id}`)}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors duration-200"
                    >
                      {membership.project.name}
                    </button>
                    {membership.project.description && (
                      <p className="text-sm text-gray-600 mt-1">{membership.project.description}</p>
                    )}
                    <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                      {membership.project.customer && (
                        <span>👤 {membership.project.customer.name}</span>
                      )}
                      <span>{membership.project.billing_model === 'task-based' ? '📋 Task-Based' : '📅 Weekly Timesheet'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      membership.is_active ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {membership.is_active ? 'Member Active' : 'Member Inactive'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use uuid if available, fallback to id for backwards compatibility
                        const membershipId = membership.uuid || membership.id;
                        navigate(`/users/${id}/edit-membership/${membershipId}`);
                      }}
                      className="btn-outline btn-sm flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No {projectStatusFilter} assigned projects yet</p>
        )}

        {/* Pagination Controls */}
        {filteredMemberships.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredMemberships.length)} of {filteredMemberships.length} projects
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={projectsPerPage}
                onChange={(e) => setProjectsPerPage(Number(e.target.value))}
                className="input text-sm w-24"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

