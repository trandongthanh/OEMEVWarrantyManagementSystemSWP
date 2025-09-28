import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'service_center_staff' | 'technician' | 'evm_admin' | 'evm_staff';
  avatar?: string;
  serviceCenter?: string;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo accounts - hardcoded for frontend simulation
const DEMO_ACCOUNTS: Record<string, { password: string; user: User }> = {
  'staff@evservice.com': {
    password: 'staff123',
    user: {
      id: 'sc-staff-1',
      email: 'staff@evservice.com',
      name: 'Nguyễn Văn Minh',
      role: 'service_center_staff',
      serviceCenter: 'EV Service Hà Nội',
      department: 'Customer Service'
    }
  },
  'tech@evservice.com': {
    password: 'tech123',
    user: {
      id: 'tech-1',
      email: 'tech@evservice.com', 
      name: 'Trần Thị Hoa',
      role: 'technician',
      serviceCenter: 'EV Service Hà Nội',
      department: 'Technical Repair'
    }
  },
  'admin@evm.com': {
    password: 'admin123',
    user: {
      id: 'evm-admin-1',
      email: 'admin@evm.com',
      name: 'Lê Hoàng Nam',
      role: 'evm_admin',
      department: 'System Administration'
    }
  },
  'evmstaff@evm.com': {
    password: 'evm123',
    user: {
      id: 'evm-staff-1', 
      email: 'evmstaff@evm.com',
      name: 'Phạm Thị Linh',
      role: 'evm_staff',
      department: 'Warranty Management'
    }
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists to determine if user is logged in
    const token = localStorage.getItem('ev_warranty_token');
    if (token) {
      // Set a generic user object when token exists
      setUser({
        id: 'user',
        email: 'user',
        name: 'User',
        role: 'service_center_staff'
      });
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle different response structures
        let token = null;
        
        // Check if response has nested data structure
        if (data.data && data.data.token) {
          token = data.data.token;
        }
        // Try standard token field names
        else if (data.token) {
          token = data.token;
        }
        else if (data.accessToken) {
          token = data.accessToken;
        }
        else if (data.access_token) {
          token = data.access_token;
        }
        else if (data.authToken) {
          token = data.authToken;
        }
        // If entire response is a token string
        else if (typeof data === 'string') {
          token = data;
        }
        
        if (token) {
          // Store only token in localStorage
          localStorage.setItem('ev_warranty_token', token);
          
          // Extract user info from backend response
          let userData: User;
          
          if (data.data && data.data.user) {
            // Use user info from backend response
            const backendUser = data.data.user;
            userData = {
              id: backendUser.userId || backendUser.id || username,
              email: backendUser.email || username,
              name: backendUser.name || username,
              role: backendUser.role?.roleName || backendUser.role || 'service_center_staff',
              serviceCenter: backendUser.serviceCenter,
              department: backendUser.department
            };
          } else {
            // Fallback to minimal user object
            userData = {
              id: username,
              email: username,
              name: username,
              role: 'service_center_staff'
            };
          }
          
          setUser(userData);
          setIsLoading(false);
          return true;
        } else {
          console.error('No token received from server');
          setIsLoading(false);
          return false;
        }
      } else {
        // Response not ok - log the status and response
        console.error('Login failed - Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ev_warranty_token');
  };

  const getToken = (): string | null => {
    return localStorage.getItem('ev_warranty_token');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};