import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomers } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [projectStatusFilter, setProjectStatusFilter] = useState<'active' | 'inactive'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage, setProjectsPerPage] = useState(10);

  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const customer = customersData?.data?.find((c: any) => c.id === id);

  // Get projects and time entries for this customer
  const projects = customer?.projects || [];
  const timeEntries = customer?.projects?.flatMap((project: any) => project.time_entries || []) || [];

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

  // Reset to page 1 when filter or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [projectStatusFilter, projectsPerPage]);

  const isLoading = customersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="card p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer not found</h2>
          <button onClick={() => navigate('/customers')} className="btn-secondary">
            Back to Customers
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
            onClick={() => navigate('/customers')}
            className="text-gray-600 hover:text-gray-900 mb-2"
          >
            ← Back to Customers
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
          {customer.email && (
            <p className="text-gray-600 mt-1">📧 {customer.email}</p>
          )}
        </div>
        <button
          onClick={() => navigate(`/customers/edit/${customer.id}`)}
          className="btn-outline btn-md flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Customer
        </button>
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

      {/* All Projects */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">All Projects</h3>
          <button
            onClick={() => navigate(`/projects/create?customer=${customer.id}`)}
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
        {(() => {
          // Filter projects by status
          const filteredProjects = projects.filter((project: any) => 
            project.is_active === (projectStatusFilter === 'active')
          );

          // Calculate pagination
          const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
          const startIndex = (currentPage - 1) * projectsPerPage;
          const endIndex = startIndex + projectsPerPage;
          const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

          return (
            <>
              {paginatedProjects.length > 0 ? (
                <div className="space-y-3">
                  {paginatedProjects.map((project: any) => (
                    <div key={project.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <button
                            onClick={() => navigate(`/projects/edit/${project.id}`)}
                            className="text-lg font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors duration-200"
                          >
                            {project.name}
                          </button>
                          {project.description && (
                            <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            project.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {project.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => navigate(`/projects/edit/${project.id}`)}
                            className="btn-outline btn-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No {projectStatusFilter} projects yet</p>
              )}

              {/* Pagination Controls */}
              {filteredProjects.length > 0 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredProjects.length)} of {filteredProjects.length} projects
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
            </>
          );
        })()}
      </div>
    </div>
  );
}
