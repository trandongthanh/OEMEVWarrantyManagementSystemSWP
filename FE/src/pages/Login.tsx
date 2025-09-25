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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const demoAccounts = [
    {
      role: 'Service Center Staff',
      email: 'staff@evservice.com',
      password: 'staff123',
      description: 'Tạo hồ sơ xe, xử lý khách hàng',
      color: 'bg-primary'
    },
    {
      role: 'Technician', 
      email: 'tech@evservice.com',
      password: 'tech123',
      description: 'Chẩn đoán, sửa chữa, cập nhật tiến độ',
      color: 'bg-success'
    },
    {
      role: 'EVM Admin',
      email: 'admin@evm.com', 
      password: 'admin123',
      description: 'Quản lý toàn bộ hệ thống',
      color: 'bg-destructive'
    },
    {
      role: 'EVM Staff',
      email: 'evmstaff@evm.com',
      password: 'evm123', 
      description: 'Duyệt warranty claims, quản lý parts',
      color: 'bg-warning'
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    const success = await login(email, password);
    if (success) {
      toast({
        title: "Đăng nhập thành công!",
        description: "Chào mừng bạn đến với hệ thống EV Warranty Management",
      });
      navigate('/dashboard');
    } else {
      setError('Email hoặc mật khẩu không chính xác');
    }
  };

  const quickLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
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
              Đăng Xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-6">
        <div className="w-full max-w-6xl grid gap-8 lg:grid-cols-2">
          
          {/* Login Form */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md shadow-glow">
              <CardHeader className="text-center bg-gradient-primary text-white rounded-t-lg">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                  <LogIn className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-white">Đăng Nhập Hệ Thống</CardTitle>
                <CardDescription className="text-primary-foreground/80">
                  Truy cập vào nền tảng quản lý bảo hành xe điện
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
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Nhập địa chỉ email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        placeholder="Nhập mật khẩu"
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
                        <span>Đang đăng nhập...</span>
                      </div>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Đăng Nhập
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Demo Accounts - Commented out */}
          {/* 
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 rounded-full bg-accent px-4 py-2">
                <Users className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm font-medium text-accent-foreground">Demo Accounts</span>
              </div>
              <h2 className="mt-4 text-2xl font-bold text-foreground">Tài Khoản Demo</h2>
              <p className="text-muted-foreground">Click vào tài khoản để đăng nhập nhanh</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {demoAccounts.map((account, index) => (
                <Card 
                  key={index}
                  className="cursor-pointer transition-all hover:shadow-glow hover:scale-105"
                  onClick={() => quickLogin(account.email, account.password)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${account.color}`}>
                        <Car className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{account.role}</CardTitle>
                        <CardDescription className="text-xs">
                          {account.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-2 pt-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <Badge variant="outline" className="text-xs">
                        {account.email}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Password:</span>
                      <Badge variant="secondary" className="text-xs">
                        {account.password}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-accent/50 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground">Lưu ý về Demo</h3>
                    <p className="text-sm text-muted-foreground">
                      Đây là phiên bản demo với dữ liệu mẫu. Trong môi trường thực tế, 
                      hệ thống sẽ kết nối với database và có bảo mật cao hơn.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          */}

          {/* Car Image */}
          <div className="flex items-center justify-center">
            <img 
              src="/CAR.png" 
              alt="Electric Vehicle" 
              className="w-full h-auto object-contain mix-blend-multiply"
              style={{ 
                maxWidth: '2000px',
                filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))',
                background: 'transparent'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;