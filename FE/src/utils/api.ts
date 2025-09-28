import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem('ev_warranty_token');
};

// Simple function to create headers with token for backend
export const createAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

// Simple fetch wrapper with token in header
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const authHeaders = createAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...authHeaders,
      ...options.headers,
    },
  });
};

// Request interceptor to automatically add token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling common responses and errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Successfully response
    return response;
  },
  (error) => {
    // Handle common error scenarios
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          console.error('Unauthorized: Token expired or invalid');
          // Clear token from localStorage
          localStorage.removeItem('ev_warranty_token');
          // Redirect to login page
          window.location.href = '/login';
          break;
          
        case 403:
          // Forbidden - insufficient permissions
          console.error('Forbidden: Insufficient permissions');
          break;
          
        case 404:
          // Not found
          console.error('Resource not found');
          break;
          
        case 500:
          // Internal server error
          console.error('Internal server error');
          break;
          
        default:
          console.error(`API Error ${status}:`, data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    } else {
      // Other error
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return api.get<T>(url, config);
  },

  // POST request
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return api.post<T>(url, data, config);
  },

  // PUT request
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return api.put<T>(url, data, config);
  },

  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return api.patch<T>(url, data, config);
  },

  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return api.delete<T>(url, config);
  },
};

// Specific API endpoints
export const authAPI = {
  // Login (không cần token)
  login: (username: string, password: string) => {
    return apiService.post('/auth/login', { username, password });
  },

  // Get user profile (cần token)
  getProfile: () => {
    return apiService.get('/auth/profile');
  },

  // Logout (cần token)
  logout: () => {
    return apiService.post('/auth/logout');
  },
};

export const claimsAPI = {
  // Get all claims
  getAllClaims: () => {
    return apiService.get('/claims');
  },

  // Get claim by ID
  getClaimById: (id: string) => {
    return apiService.get(`/claims/${id}`);
  },

  // Create new claim
  createClaim: (claimData: any) => {
    return apiService.post('/claims', claimData);
  },

  // Update claim
  updateClaim: (id: string, claimData: any) => {
    return apiService.put(`/claims/${id}`, claimData);
  },

  // Delete claim
  deleteClaim: (id: string) => {
    return apiService.delete(`/claims/${id}`);
  },
};

export const vehicleAPI = {
  // Get all vehicles
  getAllVehicles: () => {
    return apiService.get('/vehicles');
  },

  // Register new vehicle
  registerVehicle: (vehicleData: any) => {
    return apiService.post('/vehicles', vehicleData);
  },

  // Get vehicle by VIN
  getVehicleByVIN: (vin: string) => {
    return apiService.get(`/vehicles/${vin}`);
  },
};

export const customerAPI = {
  // Get all customers
  getAllCustomers: () => {
    return apiService.get('/customers');
  },

  // Add new customer
  addCustomer: (customerData: any) => {
    return apiService.post('/customers', customerData);
  },

  // Get customer by ID
  getCustomerById: (id: string) => {
    return apiService.get(`/customers/${id}`);
  },
};

// Export default api instance for custom usage
export default api;