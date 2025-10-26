import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function UsersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);

  const { data: usersData, isLoading: usersLoading } = useUsers();

  const users = usersData?.data || [];

  // Filter users based on search term and status
  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const isLoading = usersLoading;

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, usersPerPage]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'employee':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">
            Manage your organization's users
          </p>
        </div>
        <button
          className="btn-primary btn-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => navigate('/users/create')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New User
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`card p-6 hover:shadow-lg transition-all duration-200 text-left ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`card p-6 hover:shadow-lg transition-all duration-200 text-left ${statusFilter === 'active' ? 'ring-2 ring-green-500' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter((u: any) => u.is_active).length}
              </p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setStatusFilter('inactive')}
          className={`card p-6 hover:shadow-lg transition-all duration-200 text-left ${statusFilter === 'inactive' ? 'ring-2 ring-yellow-500' : ''}`}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-yellow-500 text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Inactive Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter((u: any) => !u.is_active).length}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="input pl-10 w-full"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="sm:w-48">
            <select
              className="input w-full"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Users</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : paginatedUsers.length > 0 ? (
          <div className="space-y-4">
            {paginatedUsers.map((user: any) => (
              <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate(`/users/detail/${user.uuid}`)}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors duration-200"
                      >
                        {user.first_name} {user.last_name}
                      </button>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <p>📧 {user.email}</p>
                      <p>🆔 Keycloak ID: {user.keycloak_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!user.is_active && (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                    <div className="flex space-x-2">
                      <button 
                        className="btn-outline btn-sm flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                        onClick={() => navigate(`/users/edit/${user.uuid}`)}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No users found</p>
            <p className="text-sm mt-1">
              {searchTerm ? 'Try adjusting your search' : 'No users in your organization'}
            </p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} users
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
      </div>
    </div>
  );
}

