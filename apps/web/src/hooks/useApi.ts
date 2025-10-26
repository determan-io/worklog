import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

// Organizations
export const useOrganizations = () => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => apiClient.getOrganizations(),
  });
};

export const useOrganization = (id: string) => {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => apiClient.getOrganization(id),
    enabled: !!id,
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiClient.updateOrganization(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', id] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
};

// Projects
export const useProjects = (params?: any) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => apiClient.getProjects(params),
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => apiClient.getProject(id),
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiClient.updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// Time Entries
export const useTimeEntries = (params?: any) => {
  return useQuery({
    queryKey: ['time-entries', params],
    queryFn: () => apiClient.getTimeEntries(params),
  });
};

export const useCreateTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createTimeEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
};

export const useUpdateTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiClient.updateTimeEntry(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['time-entries', id] });
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
};

export const useDeleteTimeEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => apiClient.deleteTimeEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
};

// Customers
export const useCustomers = (params?: any) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => apiClient.getCustomers(params),
  });
};

export const useCustomer = (id: string) => {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => apiClient.getCustomer(id),
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => apiClient.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiClient.updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

// Users
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });
};

export const useUser = (id: string) => {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => apiClient.getUserById(id),
    enabled: !!id,
  });
};

// Health check
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000, // Check every 30 seconds
  });
};
