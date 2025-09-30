import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'service_center_staff' | 'service_center_technician' | 'evm_admin' | 'evm_staff' | 'emv_staff';
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if token exists to determine if user is logged in
    const token = localStorage.getItem('ev_warranty_token');
    const savedUser = localStorage.getItem('ev_warranty_user');
    
    if (token && savedUser) {
      try {
        // Restore user data from localStorage
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        // Clear invalid data
        localStorage.removeItem('ev_warranty_token');
        localStorage.removeItem('ev_warranty_user');
      }
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
          // Store token and user data in localStorage
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
            // Fallback based on username to determine appropriate role
            let fallbackRole: User['role'] = 'service_center_staff';
            
            // Check specific usernames first
            if (username.toLowerCase() === 'admin01') {
              fallbackRole = 'evm_admin';
            }
            else if (username.toLowerCase() === 'emvstaff01') {
              fallbackRole = 'emv_staff';
            }
            // Check if username indicates technician role
            else if (username.toLowerCase().includes('technician') || 
                     username.toLowerCase().includes('tech')) {
              fallbackRole = 'service_center_technician';
            }
            // Check if username indicates EVM admin role
            else if (username.toLowerCase().includes('admin') && 
                     username.toLowerCase().includes('evm')) {
              fallbackRole = 'evm_admin';
            }
            // Check if username indicates EVM staff role
            else if (username.toLowerCase().includes('evm')) {
              fallbackRole = 'evm_staff';
            }
            
            userData = {
              id: username,
              email: username,
              name: username,
              role: fallbackRole
            };
          }
          
          // Store user data in localStorage for persistence
          localStorage.setItem('ev_warranty_user', JSON.stringify(userData));
          
          // Debug log to check user data
          console.log('Login successful - User data:', userData);
          console.log('Username:', username, 'Role:', userData.role);
          
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
    localStorage.removeItem('ev_warranty_user');
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