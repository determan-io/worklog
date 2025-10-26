import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth-token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Organizations
  async getOrganizations() {
    const response: AxiosResponse = await this.client.get('/organizations');
    return response.data;
  }

  async getOrganization(id: string) {
    const response: AxiosResponse = await this.client.get(`/organizations/${id}`);
    return response.data;
  }

  async updateOrganization(id: string, data: any) {
    const response: AxiosResponse = await this.client.put(`/organizations/${id}`, data);
    return response.data;
  }

  // Projects
  async getProjects(params?: any) {
    const response: AxiosResponse = await this.client.get('/projects', { params });
    return response.data;
  }

  async getProject(id: string) {
    const response: AxiosResponse = await this.client.get(`/projects/${id}`);
    return response.data;
  }

  async createProject(data: any) {
    const response: AxiosResponse = await this.client.post('/projects', data);
    return response.data;
  }

  async updateProject(id: string, data: any) {
    const response: AxiosResponse = await this.client.put(`/projects/${id}`, data);
    return response.data;
  }

  // Time Entries
  async getTimeEntries(params?: any) {
    const response: AxiosResponse = await this.client.get('/time-entries', { params });
    return response.data;
  }

  async createTimeEntry(data: any) {
    const response: AxiosResponse = await this.client.post('/time-entries', data);
    return response.data;
  }

  async updateTimeEntry(id: number, data: any) {
    const response: AxiosResponse = await this.client.put(`/time-entries/${id}`, data);
    return response.data;
  }

  async deleteTimeEntry(id: number) {
    const response: AxiosResponse = await this.client.delete(`/time-entries/${id}`);
    return response.data;
  }

  // Customers
  async getCustomers(params?: any) {
    const response: AxiosResponse = await this.client.get('/customers', { params });
    return response.data;
  }

  async getCustomer(id: string) {
    const response: AxiosResponse = await this.client.get(`/customers/${id}`);
    return response.data;
  }

  async createCustomer(data: any) {
    const response: AxiosResponse = await this.client.post('/customers', data);
    return response.data;
  }

  async updateCustomer(id: string, data: any) {
    const response: AxiosResponse = await this.client.put(`/customers/${id}`, data);
    return response.data;
  }

  // Users
  async getUsers() {
    const response: AxiosResponse = await this.client.get('/users');
    return response.data;
  }

  async getUserById(uuid: string) {
    const response: AxiosResponse = await this.client.get(`/users/${uuid}`);
    return response.data;
  }

  async createUser(data: any) {
    const response: AxiosResponse = await this.client.post('/users', data);
    return response.data;
  }

  async updateUserByUuid(uuid: string, data: any) {
    const response: AxiosResponse = await this.client.put(`/users/${uuid}`, data);
    return response.data;
  }

  // Project Memberships
  async addProjectMember(projectId: string, userId: string, role: string = 'member', hourlyRate?: number) {
    const response: AxiosResponse = await this.client.post(`/projects/${projectId}/members`, {
      user_id: userId,
      role,
      hourly_rate: hourlyRate
    });
    return response.data;
  }

  async updateProjectMember(membershipId: string, data: { role?: string; hourly_rate?: number; is_active?: boolean }) {
    const response: AxiosResponse = await this.client.put(`/memberships/${membershipId}`, data);
    return response.data;
  }

  async removeProjectMember(membershipId: string) {
    const response: AxiosResponse = await this.client.delete(`/memberships/${membershipId}`);
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response: AxiosResponse = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
