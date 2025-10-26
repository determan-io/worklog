import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCreateProject, useUpdateProject, useProjects, useCustomers } from '../hooks/useApi';
import { validateProject } from '../schemas/projectSchema';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  
  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const { data: projectsData, isLoading: projectsLoading } = useProjects({});
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  
  const [project, setProject] = useState({
    name: '',
    description: '',
    customer_id: '',
    billing_model: '',
    hourly_rate: '',
    is_active: true
  });
  
  const [errors, setErrors] = useState<any>({});

  // Load project data in edit mode or pre-populate customer from query param
  useEffect(() => {
    if (isEditMode && projectsData?.data && id) {
      const foundProject = projectsData.data.find((p: any) => p.id === id);
      if (foundProject) {
        setProject({
          name: foundProject.name,
          description: foundProject.description || '',
          customer_id: foundProject.customer_id,
          billing_model: foundProject.billing_model || 'task-based',
          hourly_rate: foundProject.hourly_rate?.toString() || '',
          is_active: foundProject.is_active ?? true
        });
      }
    } else if (!isEditMode) {
      // Pre-populate customer if coming from customer page
      const customerParam = searchParams.get('customer');
      if (customerParam) {
        setProject(prev => ({ ...prev, customer_id: customerParam }));
      }
    }
  }, [projectsData, id, isEditMode, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateProject(project);
    
    if (!validation.success) {
      setErrors(validation.errors);
      return;
    }
    
    try {
      if (isEditMode) {
        await updateProjectMutation.mutateAsync({
          id: id!,
          ...validation.data
        });
      } else {
        await createProjectMutation.mutateAsync(validation.data);
      }
      navigate('/projects');
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} project:`, error);
      alert(`Failed to ${isEditMode ? 'update' : 'create'} project.`);
    }
  };

  if (isEditMode && (customersLoading || projectsLoading)) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  const customers = customersData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? 'Edit Project' : 'Create Project'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditMode ? 'Update project information' : 'Add a new project to your organization'}
          </p>
        </div>
        <button
          className="btn-secondary btn-md"
          onClick={() => navigate('/projects')}
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label htmlFor="name" className="label mb-1">Project Name *</label>
          <input
            type="text"
            id="name"
            className={`input ${errors['name'] ? 'border-red-500' : ''}`}
            value={project.name}
            onChange={(e) => {
              setProject({...project, name: e.target.value});
              if (errors['name']) setErrors({...errors, name: ''});
            }}
            required
          />
          {errors['name'] && <p className="text-red-500 text-sm mt-1">{errors['name']}</p>}
        </div>

        <div>
          <label htmlFor="customer_id" className="label mb-1">Customer *</label>
          <select
            id="customer_id"
            className={`input ${errors['customer_id'] ? 'border-red-500' : ''}`}
            value={project.customer_id}
            onChange={(e) => {
              setProject({...project, customer_id: e.target.value});
              if (errors['customer_id']) setErrors({...errors, customer_id: ''});
            }}
            required
            disabled={isEditMode}
          >
            <option value="">Select a customer</option>
            {customers.map((customer: any) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
          {errors['customer_id'] && <p className="text-red-500 text-sm mt-1">{errors['customer_id']}</p>}
        </div>

        <div>
          <label htmlFor="billing_model" className="label mb-1">Billing Model *</label>
          <select
            id="billing_model"
            className={`input ${errors['billing_model'] ? 'border-red-500' : ''}`}
            value={project.billing_model}
            onChange={(e) => {
              setProject({...project, billing_model: e.target.value});
              if (errors['billing_model']) setErrors({...errors, billing_model: ''});
            }}
            required
          >
            <option value="">Please select...</option>
            <option value="task-based">Task-Based</option>
            <option value="timesheet">Weekly Timesheet</option>
          </select>
          {errors['billing_model'] && <p className="text-red-500 text-sm mt-1">{errors['billing_model']}</p>}
          {project.billing_model && (
            <p className="text-xs text-gray-500 mt-1">
              {project.billing_model === 'timesheet' 
                ? '📅 Weekly timecard - creates entries for the entire week' 
                : '🎯 Task-based - can add multiple entries per day'}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="label mb-1">Description</label>
          <textarea
            id="description"
            className={`input ${errors['description'] ? 'border-red-500' : ''}`}
            rows={3}
            value={project.description}
            onChange={(e) => {
              setProject({...project, description: e.target.value});
              if (errors['description']) setErrors({...errors, description: ''});
            }}
          />
          {errors['description'] && <p className="text-red-500 text-sm mt-1">{errors['description']}</p>}
        </div>

        <div>
          <label htmlFor="hourly_rate" className="label mb-1">Hourly Rate</label>
          <input
            type="number"
            id="hourly_rate"
            className={`input ${errors['hourly_rate'] ? 'border-red-500' : ''}`}
            value={project.hourly_rate}
            onChange={(e) => {
              setProject({...project, hourly_rate: e.target.value});
              if (errors['hourly_rate']) setErrors({...errors, hourly_rate: ''});
            }}
            step="0.01"
            min="0"
            placeholder="e.g., 150.00"
          />
          {errors['hourly_rate'] && <p className="text-red-500 text-sm mt-1">{errors['hourly_rate']}</p>}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={project.is_active}
              onChange={(e) => {
                setProject({...project, is_active: e.target.checked});
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Active Project
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            className="btn-secondary btn-md"
            onClick={() => navigate('/projects')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary btn-md flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isEditMode ? updateProjectMutation.isPending : createProjectMutation.isPending}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditMode ? "M5 13l4 4L19 7" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
            </svg>
            {isEditMode 
              ? (updateProjectMutation.isPending ? 'Updating...' : 'Update Project')
              : (createProjectMutation.isPending ? 'Creating...' : 'Create Project')
            }
          </button>
        </div>
      </form>
    </div>
  );
}

