import { useState } from 'react';import { useState } from 'react';

import { useNavigate } from 'react-router-dom';import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';import { Input } from '@/components/ui/input';

import { Label } from '@/components/ui/label';import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';import { Badge } from '@/components/ui/badge';

import { Alert, AlertDescription } from '@/components/ui/alert';import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAuth } from '@/contexts/AuthContext';import { useAuth } from '@/contexts/AuthContext';

import { Shield, Car, Eye, EyeOff, LogIn, AlertCircle, Users } from 'lucide-react';import { Shield, Car, Eye, EyeOff, LogIn, AlertCircle, Users } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';

const Login = () => {

  const [email, setEmail] = useState('');const Login = () => {

  const [password, setPassword] = useState('');  const [email, setEmail] = useState('');

  const [showPassword, setShowPassword] = useState(false);  const [password, setPassword] = useState('');

  const [error, setError] = useState('');  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);  const [error, setError] = useState('');

  const navigate = useNavigate();  const { login, isLoading } = useAuth();

  const { login } = useAuth();  const navigate = useNavigate();

  const { toast } = useToast();

  // Demo accounts for testing

  const demoAccounts = [  // const demoAccounts = [

    {  //   {

      email: 'manufacturer@demo.com',  //     role: 'Service Center Staff',

      password: 'demo123',  //     email: 'staff@evservice.com',

      role: 'manufacturer',  //     password: 'staff123',

      name: 'Manufacturer Dashboard'  //     description: 'Tạo hồ sơ xe, xử lý khách hàng',

    },  //     color: 'bg-primary'

    {  //   },

      email: 'service@demo.com',  //   {

      password: 'demo123',  //     role: 'Technician', 

      role: 'service_center',  //     email: 'tech@evservice.com',

      name: 'Service Center Dashboard'  //     password: 'tech123',

    },  //     description: 'Chẩn đoán, sửa chữa, cập nhật tiến độ',

    {  //     color: 'bg-success'

      email: 'technician@demo.com',  //   },

      password: 'demo123',  //   {

      role: 'technician',  //     role: 'EVM Admin',

      name: 'Technician Dashboard'  //     email: 'admin@evm.com', 

    },  //     password: 'admin123',

    {  //     description: 'Quản lý toàn bộ hệ thống',

      email: 'admin@demo.com',  //     color: 'bg-destructive'

      password: 'demo123',  //   },

      role: 'admin',  //   {

      name: 'Admin Dashboard'  //     role: 'EVM Staff',

    }  //     email: 'evmstaff@evm.com',

  ];  //     password: 'evm123', 

  //     description: 'Duyệt warranty claims, quản lý parts',

  const handleLogin = async (e: React.FormEvent) => {  //     color: 'bg-warning'

    e.preventDefault();  //   }

    setError('');  // ];

    setIsLoading(true);

  const handleLogin = async (e: React.FormEvent) => {

    if (!email || !password) {    e.preventDefault();

      setError('Vui lòng nhập đầy đủ email và mật khẩu');    setError('');

      setIsLoading(false);

      return;    if (!email || !password) {

    }      setError('Vui lòng nhập đầy đủ email và mật khẩu');

      return;

    // Check demo accounts    }

    const demoAccount = demoAccounts.find(account => account.email === email && account.password === password);

    if (demoAccount) {    const success = await login(email, password);

      login({    if (success) {

        email: demoAccount.email,      toast({

        role: demoAccount.role,        title: "Đăng nhập thành công!",

        name: demoAccount.name        description: "Chào mừng bạn đến với hệ thống EV Warranty Management",

      });      });

      navigate('/dashboard');      navigate('/dashboard');

    } else {    } else {

      setError('Email hoặc mật khẩu không chính xác');      setError('Email hoặc mật khẩu không chính xác');

    }    }

    setIsLoading(false);  };

  };

  const quickLogin = (demoEmail: string, demoPassword: string) => {

  const quickLogin = (demoEmail: string, demoPassword: string) => {    setEmail(demoEmail);

    setEmail(demoEmail);    setPassword(demoPassword);

    setPassword(demoPassword);  };

  };

  return (

  return (    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">

    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">      <div className="flex min-h-screen">

      <div className="flex min-h-screen">        {/* Left Side - Login Form */}

        {/* Left Side - Login Form */}        <div className="flex-1 flex items-center justify-center p-8 relative">

        <div className="flex-1 flex items-center justify-center p-8 relative">          {/* Background Pattern */}

          {/* Background Pattern */}          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>

          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20"></div>          

                    <div className="w-full max-w-md relative z-10">

          <div className="w-full max-w-md relative z-10">            <Card className="bg-gray-900/90 border-gray-700 backdrop-blur">

            <Card className="bg-gray-900/90 border-gray-700 backdrop-blur">              <CardHeader className="space-y-1 text-center pb-6">

              <CardHeader className="space-y-1 text-center pb-6">                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">

                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">                  <Shield className="h-6 w-6 text-white" />

                  <Shield className="h-6 w-6 text-white" />                </div>

                </div>                <CardTitle className="text-2xl text-white">Welcome back</CardTitle>

                <CardTitle className="text-2xl text-white">Welcome back</CardTitle>                <CardDescription className="text-gray-400">

                <CardDescription className="text-gray-400">                  Enter your credentials to access your account

                  Enter your credentials to access your account                </CardDescription>

                </CardDescription>              </CardHeader>

              </CardHeader>              <CardContent className="space-y-4">

              <CardContent className="space-y-4">                <form onSubmit={handleLogin} className="space-y-4">

                <form onSubmit={handleLogin} className="space-y-4">              {error && (

                  {error && (                <Alert variant="destructive" className="mb-4">

                    <Alert variant="destructive" className="mb-4">                  <AlertCircle className="h-4 w-4" />

                      <AlertCircle className="h-4 w-4" />                  <AlertDescription>{error}</AlertDescription>

                      <AlertDescription>{error}</AlertDescription>                </Alert>

                    </Alert>              )}

                  )}

              <div className="space-y-4">

                  <div className="space-y-2">                <div className="relative">

                    <Label htmlFor="email" className="text-gray-300">Email</Label>                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                    <Input                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      id="email"                      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />

                      type="email"                    </svg>

                      placeholder="Enter your email"                  </div>

                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"                  <Input

                      value={email}                    id="email"

                      onChange={(e) => setEmail(e.target.value)}                    type="email"

                      disabled={isLoading}                    placeholder="Email"

                    />                    value={email}

                  </div>                    onChange={(e) => setEmail(e.target.value)}

                  <div className="space-y-2">                    disabled={isLoading}

                    <Label htmlFor="password" className="text-gray-300">Password</Label>                    className="pl-10 h-14 text-lg bg-gray-900 text-white border-gray-700 placeholder-gray-400"

                    <div className="relative">                  />

                      <Input                </div>

                        id="password"

                        type={showPassword ? 'text' : 'password'}                <div className="relative">

                        placeholder="Enter your password"                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 pr-10"                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        value={password}                      <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />

                        onChange={(e) => setPassword(e.target.value)}                    </svg>

                        disabled={isLoading}                  </div>

                      />                  <Input

                      <Button                    id="password"

                        type="button"                    type={showPassword ? 'text' : 'password'}

                        variant="ghost"                    placeholder="Password"

                        size="sm"                    value={password}

                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"                    onChange={(e) => setPassword(e.target.value)}

                        onClick={() => setShowPassword(!showPassword)}                    disabled={isLoading}

                      >                    className="pl-10 pr-10 h-14 text-lg bg-gray-900 text-white border-gray-700 placeholder-gray-400"

                        {showPassword ? (                  />

                          <EyeOff className="h-4 w-4 text-gray-400" />                  <Button

                        ) : (                    type="button"

                          <Eye className="h-4 w-4 text-gray-400" />                    variant="ghost"

                        )}                    size="sm"

                      </Button>                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"

                    </div>                    onClick={() => setShowPassword(!showPassword)}

                  </div>                    disabled={isLoading}

                  >

                  <Button                    {showPassword ? (

                    type="submit"                      <EyeOff className="h-4 w-4 text-gray-400" />

                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"                    ) : (

                    disabled={isLoading}                      <Eye className="h-4 w-4 text-gray-400" />

                  >                    )}

                    {isLoading ? (                  </Button>

                      <div className="flex items-center space-x-2">                </div>

                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>              </div>

                        <span>Signing in...</span>

                      </div>              <div className="flex justify-end">

                    ) : (                <button type="button" className="text-sm text-gray-400 hover:text-gray-300">

                      <div className="flex items-center space-x-2">                  Forgot password?

                        <LogIn className="w-4 h-4" />                </button>

                        <span>Sign In</span>              </div>

                      </div>

                    )}              <Button 

                  </Button>                type="submit" 

                </form>                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md" 

                disabled={isLoading}

                {/* Demo Accounts Section */}              >

                <div className="mt-6 pt-6 border-t border-gray-700">                {isLoading ? (

                  <div className="text-center mb-4">                  <div className="flex items-center space-x-2">

                    <Badge variant="secondary" className="bg-blue-600/20 text-blue-400 border-blue-600/30">                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />

                      <Users className="w-3 h-3 mr-1" />                    <span>Logging in...</span>

                      Demo Accounts                  </div>

                    </Badge>                ) : (

                  </div>                  "Log in"

                  <div className="grid gap-2">                )}

                    <Button              </Button>

                      variant="outline"            </form>

                      size="sm"

                      className="text-xs bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700"            <div className="text-center mt-6">

                      onClick={() => quickLogin('manufacturer@demo.com', 'demo123')}              <span className="text-gray-500">Don't have an account? </span>

                    >              <button className="text-blue-600 hover:text-blue-700 font-medium">

                      Manufacturer Dashboard                Sign up

                    </Button>              </button>

                    <Button            </div>

                      variant="outline"              </div>

                      size="sm"            </div>

                      className="text-xs bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700"          </div>

                      onClick={() => quickLogin('service@demo.com', 'demo123')}        </div>

                    >          </div>

                      Service Center Dashboard        </div>

                    </Button>      </div>

                    <Button    </div>

                      variant="outline"    </div>

                      size="sm"  );

                      className="text-xs bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700"};

                      onClick={() => quickLogin('technician@demo.com', 'demo123')}

                    >export default Login;
                      Technician Dashboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700"
                      onClick={() => quickLogin('admin@demo.com', 'demo123')}
                    >
                      Admin Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Side - Car Image */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 p-8">
          <div className="text-center">
            <Car className="w-32 h-32 text-white/80 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">
              EV Warranty Management
            </h2>
            <p className="text-blue-100 text-lg max-w-md">
              Streamline your electric vehicle warranty processes with our comprehensive management system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;