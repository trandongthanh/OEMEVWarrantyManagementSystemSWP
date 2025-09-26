import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Car, Eye, EyeOff, LogIn, LogOut, AlertCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading, getToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // const demoAccounts = [
  //   {
  //     role: 'Service Center Staff',
  //     email: 'staff@evservice.com',
  //     password: 'staff123',
  //     description: 'Tạo hồ sơ xe, xử lý khách hàng',
  //     color: 'bg-primary'
  //   },
  //   {
  //     role: 'Technician', 
  //     email: 'tech@evservice.com',
  //     password: 'tech123',
  //     description: 'Chẩn đoán, sửa chữa, cập nhật tiến độ',
  //     color: 'bg-success'
  //   },
  //   {
  //     role: 'EVM Admin',
  //     email: 'admin@evm.com', 
  //     password: 'admin123',
  //     description: 'Quản lý toàn bộ hệ thống',
  //     color: 'bg-destructive'
  //   },
  //   {
  //     role: 'EVM Staff',
  //     email: 'evmstaff@evm.com',
  //     password: 'evm123', 
  //     description: 'Duyệt warranty claims, quản lý parts',
  //     color: 'bg-warning'
  //   }
  // ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    const success = await login(username, password);
    if (success) {
      toast({
        title: "Login Successful!",
        description: "Welcome to EV Warranty Management System",
      });
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  const quickLogin = (demoUsername: string, demoPassword: string) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/20">
      {/* Header */}
      <header className="border-b bg-gradient-primary backdrop-blur-sm shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">EV Warranty Management</h1>
                <p className="text-sm text-primary-foreground/80">Professional Service Platform</p>
              </div>
            </div>
            
            {/* Logout Button */}
            <Button 
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/20 hover:text-white"
              onClick={() => {
                // Clear any stored auth data and navigate to login
                localStorage.clear();
                sessionStorage.clear();
                navigate('/');
              }}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6 relative">
        {/* Car Image Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <img 
            src="/CAR2.png" 
            alt="Electric Vehicle" 
            className="w-full h-auto object-contain mix-blend-multiply opacity-70"
            style={{ 
              maxWidth: '1500px',
              filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.7))',
              background: 'transparent'
            }}
          />
        </div>

        {/* Login Form */}
        <div className="relative z-10 flex items-center justify-center">
          <Card className="w-full max-w-md shadow-glow backdrop-blur-sm">
              <CardHeader className="text-center bg-gradient-primary text-white rounded-t-lg">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <LogIn className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">System Login</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Access to EV Warranty Management Platform
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11" 
                    variant="gradient"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;