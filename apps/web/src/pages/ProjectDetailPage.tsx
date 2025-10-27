import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProject, useUsers } from '../hooks/useApi';
import { apiClient } from '../services/apiClient';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuthStore } from '../stores/authStore';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [userStatusFilter, setUserStatusFilter] = useState<'active' | 'inactive'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  const { user } = useAuthStore();
  const isEmployee = user?.role === 'employee';

  const queryClient = useQueryClient();
  const { data: projectData, isLoading: projectsLoading } = useProject(id || '');
  const project = projectData?.data;

  // Get time entries for this project
  const timeEntries = project?.time_entries || [];
  
  // Get project memberships
  const memberships = project?.memberships || [];

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

  // Get members from memberships
  const getUsersFromMemberships = () => {
    return memberships.map((membership: any) => membership.user);
  };

  const usersFromMemberships = getUsersFromMemberships();

  // Calculate statistics for the selected period
  const getEntryHours = (entry: any) => {
    return typeof entry.duration_hours === 'string' ? parseFloat(entry.duration_hours) : (entry.duration_hours || 0);
  };

  const totalHours = filteredEntries.reduce((sum: number, entry: any) => sum + getEntryHours(entry), 0);
  const billableHours = filteredEntries.filter((e: any) => e.is_billable).reduce((sum: number, entry: any) => sum + getEntryHours(entry), 0);
  const nonBillableHours = totalHours - billableHours;
  const avgHoursPerWeek = selectedPeriod === 'week' ? totalHours : selectedPeriod === 'month' ? totalHours / 4 : totalHours / 52;

  // Group by user for the period (from memberships and time entries)
  const userBreakdown = memberships
    .map((membership: any) => {
      const user = membership.user;
      const userEntries = filteredEntries.filter((e: any) => e.user?.uuid === user.uuid);
      const hours = userEntries.reduce((sum: number, entry: any) => sum + getEntryHours(entry), 0);
      const billableHours = userEntries.filter((e: any) => e.is_billable).reduce((sum: number, entry: any) => sum + getEntryHours(entry), 0);
      return { 
        user, 
        hours, 
        billableHours, 
        entryCount: userEntries.length,
        hourlyRate: membership.hourly_rate ? parseFloat(membership.hourly_rate) : null
      };
    })
    .sort((a, b) => b.hours - a.hours);

  // Status breakdown
  const statusCounts = filteredEntries.reduce((acc: any, entry: any) => {
    acc[entry.status] = (acc[entry.status] || 0) + 1;
    return acc;
  }, {});

  // Reset to page 1 when filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [userStatusFilter, usersPerPage]);

  const isLoading = projectsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <button onClick={() => navigate('/projects')} className="btn-secondary">
            Back to Projects
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
            onClick={() => navigate('/projects')}
            className="text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Projects
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-gray-600 mt-1">{project.description}</p>
          )}
          {project.customer && (
            <button
              onClick={() => navigate(`/customers/detail/${project.customer.id}`)}
              className="text-blue-600 hover:text-blue-800 hover:underline mt-1"
            >
              👤 {project.customer.name}
            </button>
          )}
        </div>
        {!isEmployee && (
          <button
            onClick={() => navigate(`/projects/edit/${project.id}`)}
            className="btn-outline btn-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Project
          </button>
        )}
      </div>

      {/* Period Selector */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Summary</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedPeriod('week')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedPeriod === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setSelectedPeriod('month')}
              className={`px-4 py-2 rounded-md font-medium ${
                selectedPeriod === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setSelectedPeriod('year')}
              className={`px-4 py-2 rounded-md font-medium ${
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
              <p className="text-2xl font-bold text-gray-900">{statusCounts.draft || 0}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-600">Submitted</p>
              <p className="text-2xl font-bold text-blue-600">{statusCounts.submitted || 0}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">{statusCounts.approved || 0}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{statusCounts.rejected || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employees - Hidden for employees */}
      {!isEmployee && (
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Employees</h3>
          <button
            onClick={() => navigate(`/projects/${id}/add-user`)}
            className="btn-primary btn-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add User
          </button>
        </div>

        {/* Filter */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setUserStatusFilter('active')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                userStatusFilter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setUserStatusFilter('inactive')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                userStatusFilter === 'inactive' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Filtered and paginated users */}
        {(() => {
          // Filter users by status
          const filteredUsers = userBreakdown.filter((data: any) => 
            data.user.is_active === (userStatusFilter === 'active')
          );

          // Calculate pagination
          const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
          const startIndex = (currentPage - 1) * usersPerPage;
          const endIndex = startIndex + usersPerPage;
          const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

          return (
            <>
              {paginatedUsers.length > 0 ? (
                <div className="space-y-3">
                  {paginatedUsers.map((data: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <button
                            onClick={() => navigate(`/users/detail/${data.user.uuid}`)}
                            className="text-lg font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors duration-200"
                          >
                            {data.user.first_name} {data.user.last_name}
                          </button>
                          <p className="text-sm text-gray-600 mt-1">📧 {data.user.email}</p>
                          {data.hourlyRate && (
                            <p className="text-sm font-medium text-green-600 mt-1">
                              💰 ${data.hourlyRate.toFixed(2)}/hour
                            </p>
                          )}
                          <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                            <span>Total: {data.hours.toFixed(2)}h</span>
                            <span>Billable: {data.billableHours.toFixed(2)}h</span>
                            <span>Entries: {data.entryCount}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Find the membership for this user
                              const membership = memberships.find((m: any) => m.user?.uuid === data.user.uuid);
                              if (membership) {
                                const membershipId = membership.uuid;
                                navigate(`/projects/${id}/edit-membership/${membershipId}`);
                              }
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
                <p className="text-gray-500 text-center py-8">No {userStatusFilter} employees with time entries in this period</p>
              )}

              {/* Pagination Controls */}
              {filteredUsers.length > 0 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} employees
                  </div>
                  <div className="flex items-center space-x-3">
                    <select
                      value={usersPerPage}
                      onChange={(e) => setUsersPerPage(Number(e.target.value))}
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
            </>
          );
        })()}
      </div>
      )}
    </div>
  );
}

