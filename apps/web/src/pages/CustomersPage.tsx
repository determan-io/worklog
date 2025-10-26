import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomers } from '../hooks/useApi';
import LoadingSpinner from '../components/LoadingSpinner';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

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

  const handleEditCustomer = (customer: any) => {
    navigate(`/customers/edit/${customer.id}`);
  };

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
        ) : filteredCustomers.length > 0 ? (
          <div className="space-y-4">
            {filteredCustomers.map((customer: any) => (
              <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-gray-900">{customer.name}</h4>
                    <div className="mt-1 text-sm text-gray-600">
                      {customer.email && (
                        <p>📧 {customer.email}</p>
                      )}
                      {customer.phone && (
                        <p>📞 {customer.phone}</p>
                      )}
                      {customer.address && customer.address.street && (
                        <p>📍 {customer.address.street}, {customer.address.city}, {customer.address.state} {customer.address.zip}</p>
                      )}
                    </div>
                    <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                      <span>📋 {customer.projects?.length || 0} Projects</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      className="btn-outline btn-sm flex items-center gap-1 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      onClick={() => handleEditCustomer(customer)}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
                
                {/* Projects Preview */}
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
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No customers yet</p>
            <p className="text-sm mt-1">Create your first customer to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
