import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [expandedCustomers, setExpandedCustomers] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage, setCustomersPerPage] = useState(10);

  const { data: customersData, isLoading: customersLoading } = useCustomers();

  const customers = customersData?.data || [];

  // Filter customers based on search term and status
  const filteredCustomers = customers.filter((customer: any) => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && customer.is_active) ||
      (statusFilter === 'inactive' && !customer.is_active);
    
    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handleEditCustomer = (customer: any) => {
    navigate(`/customers/edit/${customer.id}`);
  };

  const toggleCustomer = (customerId: number) => {
    setExpandedCustomers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) {
        newSet.delete(customerId);
      } else {
        newSet.add(customerId);
      }
      return newSet;
    });
  };

  // Reset to page 1 when filters or page size change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, customersPerPage]);

  const isLoading = customersLoading;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="mt-2 text-gray-600">
            Manage your customers and their projects
          </p>
        </div>
        <button
          className="btn-primary btn-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
          onClick={() => navigate('/customers/create')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          New Customer
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
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">{customers.length}</p>
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
              <p className="text-sm font-medium text-gray-500">Active Customers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.filter((c: any) => c.is_active).length}
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
              <p className="text-sm font-medium text-gray-500">Inactive Customers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {customers.filter((c: any) => !c.is_active).length}
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
              placeholder="Search customers by name, email, or phone..."
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
              <option value="all">All Customers</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">All Customers</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : paginatedCustomers.length > 0 ? (
          <div className="space-y-4">
            {paginatedCustomers.map((customer: any) => {
              const isExpanded = expandedCustomers.has(customer.id);
              
              return (
                <div key={customer.id} className="border rounded-lg hover:bg-gray-50">
                  {/* Collapsed Summary */}
                  <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => toggleCustomer(customer.id)}>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <svg 
                              className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/customers/detail/${customer.id}`);
                              }}
                              className="text-lg font-medium text-gray-900 hover:text-blue-600 hover:underline transition-colors duration-200"
                            >
                              {customer.name}
                            </button>
                            {customer.email && (
                              <span className="text-sm text-gray-600">📧 {customer.email}</span>
                            )}
                            <span className="text-sm text-gray-500">📋 {customer.projects?.length || 0} Projects</span>
                          </div>
                        </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex space-x-2">
                        <button 
                          className="btn-outline btn-sm flex items-center gap-1 hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/create?customer=${customer.id}`);
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Project
                        </button>
                        <button 
                          className="btn-outline btn-sm flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCustomer(customer);
                          }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                
                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t bg-gray-50">
                      <div className="mt-4 space-y-2">
                        {customer.phone && (
                          <p className="text-sm text-gray-600">📞 {customer.phone}</p>
                        )}
                        {customer.address && customer.address.street && (
                          <p className="text-sm text-gray-600">📍 {customer.address.street}, {customer.address.city}, {customer.address.state} {customer.address.zip}</p>
                        )}
                      </div>
                      
                      {/* Projects */}
                      {customer.projects && customer.projects.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Projects:</h5>
                          <div className="space-y-1">
                            {customer.projects.slice(0, 3).map((project: any) => (
                              <div key={project.id} className="flex justify-between items-center text-sm">
                                <button
                                  onClick={() => navigate('/projects')}
                                  className="text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors duration-200"
                                >
                                  {project.name}
                                </button>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  project.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {project.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            ))}
                            {customer.projects.length > 3 && (
                              <div className="flex justify-between items-center">
                                <button
                                  onClick={() => navigate('/projects')}
                                  className="text-xs text-blue-500 hover:text-blue-700 hover:underline transition-colors duration-200"
                                >
                                  +{customer.projects.length - 3} more projects
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No customers yet</p>
            <p className="text-sm mt-1">Create your first customer to get started</p>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length} customers
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={customersPerPage}
                onChange={(e) => setCustomersPerPage(Number(e.target.value))}
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
