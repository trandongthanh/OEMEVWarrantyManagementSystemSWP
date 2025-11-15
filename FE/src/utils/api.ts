import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// JWT token decoder (simple, without heavy library)
const decodeJWT = (token: string): { exp?: number } | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Check if token is expired
const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  // Check if token expired (with 30 second buffer)
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < (currentTime + 10); // 10 second buffer for testing
};

// Function to handle auth expiration (shared between instances)
const handleAuthExpiration = (status: number) => {
  console.error(`${status === 401 ? 'Unauthorized' : 'Forbidden'}: Token expired or invalid`);
  
  // Only handle auth expiration if we have a token (prevents redirect loop on login page)
  const hasToken = localStorage.getItem('ev_warranty_token');
  if (hasToken) {
    // Clear all auth related data
    localStorage.removeItem('ev_warranty_token');
    localStorage.removeItem('ev_warranty_user');
    localStorage.removeItem('ev_warranty_role');
    
    // Show toast notification if available
    try {
      const event = new CustomEvent('auth:expired', {
        detail: { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' }
      });
      window.dispatchEvent(event);
    } catch (_) {
      // ignore if custom event not supported
    }
    
    // Redirect to login immediately (only if not already on login page)
    const currentPath = window.location.pathname;
    if (currentPath !== '/login') {
      // Clear first, then redirect immediately
      console.log('🔄 Redirecting to login due to token expiration...');
      setTimeout(() => {
        const redirectParam = currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : '';
        window.location.href = `/login${redirectParam}`;
      }, 300);
    }
  }
};

// Auto check token expiration on visibility change and periodically
let tokenCheckInterval: number | null = null;

const startTokenExpirationCheck = () => {
  // Check immediately
  const checkToken = () => {
    const token = localStorage.getItem('ev_warranty_token');
    const currentPath = window.location.pathname;
    
    // Only check if not on login page
    if (currentPath !== '/login') {
      if (token && isTokenExpired(token)) {
        console.log('⏰ Token expired - auto logout');
        handleAuthExpiration(401);
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval);
          tokenCheckInterval = null;
        }
      } else if (!token) {
        // No token and not on login page - redirect to login
        console.log('🚫 No token found - redirecting to login');
        window.location.href = '/login';
        if (tokenCheckInterval) {
          clearInterval(tokenCheckInterval);
          tokenCheckInterval = null;
        }
      }
    }
  };

  // Check every 1 minute
  if (!tokenCheckInterval) {
    tokenCheckInterval = window.setInterval(checkToken, 10000); // Check every 10 seconds for faster detection
  }
  
  // Check when page becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkToken();
    }
  });
  
  // Initial check
  checkToken();
};

// Start token check when module loads
if (typeof window !== 'undefined') {
  startTokenExpirationCheck();
}

// Add global axios interceptor for all axios instances (including direct imports)
axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (err: unknown) => {
    if (axios.isAxiosError(err)) {
      const error = err as AxiosError<unknown>;
      const status = error.response?.status;
      
      if (status === 401 || status === 403) {
        handleAuthExpiration(status);
      }
    }
    return Promise.reject(err);
  }
);

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
  (response: AxiosResponse) => response,
  (err: unknown) => {
    // Use axios.isAxiosError to get typed error info
    if (axios.isAxiosError(err)) {
      const error = err as AxiosError<unknown>;
      const status = error.response?.status;
      const data = error.response?.data;

      switch (status) {
        case 401:
        case 403:
          // Already handled by global interceptor
          break;
        case 404:
          console.error('Resource not found');
          break;
        case 500:
          console.error('Internal server error');
          break;
        default:
          console.error(`API Error ${status ?? 'unknown'}:`, data ?? error.message);
      }
    } else if (err instanceof Error) {
      // Non-Axios error
      console.error('API Error:', err.message);
    } else {
      console.error('Unknown API error:', err);
    }

    return Promise.reject(err);
  }
);

// API methods
export const apiService = {
  // GET request
  get: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => api.get<T>(url, config),

  // POST request
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => api.post<T>(url, data, config),

  // PUT request
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => api.put<T>(url, data, config),

  // PATCH request
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => api.patch<T>(url, data, config),

  // DELETE request
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => api.delete<T>(url, config),
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
  createClaim: (claimData: unknown) => {
    return apiService.post('/claims', claimData);
  },

  // Update claim
  updateClaim: (id: string, claimData: unknown) => {
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
  registerVehicle: (vehicleData: unknown) => {
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
  addCustomer: (customerData: unknown) => {
    return apiService.post('/customers', customerData);
  },

  // Get customer by ID
  getCustomerById: (id: string) => {
    return apiService.get(`/customers/${id}`);
  },
};

// Export default api instance for custom usage
export default api;