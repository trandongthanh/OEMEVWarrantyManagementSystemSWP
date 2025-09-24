import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  X,
  IdCard,
  Calendar,
  Building,
  Car,
  Key,
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Shield,
  Facebook,
  Chrome
} from 'lucide-react';

interface CustomerData {
  // Account Information
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  
  // Vehicle Information
  vinNumber: string;
  vehicleModel: string;
  manufacturingYear: string;
  purchaseDate: string;
  
  // Contact Information
  address: string;
  province: string;
  district: string;
  ward: string;
  preferredContact: string;
  
  // Optional fields
  idNumber: string;
  idType: string;
  dateOfBirth: string;
  gender: string;
  company: string;
  jobTitle: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
}

const AddCustomer = ({ onClose }: { onClose: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, feedback: '', level: 'Weak' });
  const { user } = useAuth();
  const { toast } = useToast();

  const [customerData, setCustomerData] = useState<CustomerData>({
    // Account Information
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Vehicle Information
    vinNumber: '',
    vehicleModel: '',
    manufacturingYear: '',
    purchaseDate: '',
    
    // Contact Information
    address: '',
    province: '',
    district: '',
    ward: '',
    preferredContact: 'email',
    
    // Optional fields
    idNumber: '',
    idType: '',
    dateOfBirth: '',
    gender: '',
    company: '',
    jobTitle: '',
    emergencyContact: '',
    emergencyPhone: '',
    notes: ''
  });

  const provinces = [
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'An Giang',
    'Bà Rịa - Vũng Tàu',
    'Bạc Liêu',
    'Bắc Giang',
    'Bắc Kạn',
    'Bắc Ninh',
    'Bến Tre',
    'Bình Định',
    'Bình Dương',
    'Bình Phước',
    'Bình Thuận',
    'Cà Mau',
    'Cao Bằng',
    'Đắk Lắk',
    'Đắk Nông',
    'Điện Biên',
    'Đồng Nai',
    'Đồng Tháp',
    'Gia Lai',
    'Hà Giang',
    'Hà Nam',
    'Hà Tĩnh',
    'Hải Dương',
    'Hậu Giang',
    'Hòa Bình',
    'Hưng Yên',
    'Khánh Hòa',
    'Kiên Giang',
    'Kon Tum',
    'Lai Châu',
    'Lâm Đồng',
    'Lạng Sơn',
    'Lào Cai',
    'Long An',
    'Nam Định',
    'Nghệ An',
    'Ninh Bình',
    'Ninh Thuận',
    'Phú Thọ',
    'Phú Yên',
    'Quảng Bình',
    'Quảng Nam',
    'Quảng Ngãi',
    'Quảng Ninh',
    'Quảng Trị',
    'Sóc Trăng',
    'Sơn La',
    'Tây Ninh',
    'Thái Bình',
    'Thái Nguyên',
    'Thanh Hóa',
    'Thừa Thiên Huế',
    'Tiền Giang',
    'Trà Vinh',
    'Tuyên Quang',
    'Vĩnh Long',
    'Vĩnh Phúc',
    'Yên Bái'
  ];

  const vehicleModels = [
    'VinFast VF3',
    'VinFast VF5',
    'VinFast VF6',
    'VinFast VF7',
    'VinFast VF8',
    'VinFast VF9',
    'VinFast VF e34',
    'VinFast Klara S',
    'VinFast Lux A2.0',
    'VinFast Lux SA2.0',
    'VinFast Fadil',
    'Hyundai Kona Electric',
    'Tesla Model 3',
    'Tesla Model Y',
    'BMW i3',
    'BMW iX3',
    'Nissan Leaf',
    'Mitsubishi Outlander PHEV',
    'MG ZS EV',
    'Other'
  ];

  const preferredContactOptions = [
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'both', label: 'Both' }
  ];

  const currentYear = new Date().getFullYear();
  const manufacturingYears = Array.from(
    { length: 30 }, 
    (_, i) => (currentYear - i).toString()
  );

  const idTypes = [
    { value: 'cccd', label: 'Căn cước công dân' },
    { value: 'cmnd', label: 'Chứng minh nhân dân' },
    { value: 'passport', label: 'Hộ chiếu' },
    { value: 'other', label: 'Khác' }
  ];

  const handleInputChange = (field: keyof CustomerData, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }));
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(phone);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let score = 0;
    const feedback = [];
    
    if (password.length >= minLength) score++;
    else feedback.push('at least 8 characters');
    
    if (hasUpperCase) score++;
    else feedback.push('uppercase letter');
    
    if (hasLowerCase) score++;
    else feedback.push('lowercase letter');
    
    if (hasNumbers) score++;
    else feedback.push('number');
    
    if (hasSpecialChar) score++;
    else feedback.push('special character');
    
    const strengthLevel = score < 2 ? 'Weak' : score < 4 ? 'Medium' : 'Strong';
    const feedbackText = feedback.length > 0 ? `Need: ${feedback.join(', ')}` : 'Strong password!';
    
    return { isValid: score >= 2, score, feedback: feedbackText, level: strengthLevel };
  };

  const validateVIN = (vin: string) => {
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return {
      isValid: vinRegex.test(vin),
      message: vin.length !== 17 ? 'VIN must be exactly 17 characters' : 
               !vinRegex.test(vin) ? 'VIN contains invalid characters (no I, O, Q)' : ''
    };
  };

  const validateEmailRealtime = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      isValid: emailRegex.test(email),
      message: !emailRegex.test(email) && email.length > 0 ? 'Please enter a valid email address' : ''
    };
  };

  const mockVINLookup = (vin: string) => {
    // Mock VIN database lookup
    const mockDatabase: Record<string, { model: string; year: string; manufacturer: string }> = {
      '1HGCM82633A123456': { model: 'VinFast VF8', year: '2023', manufacturer: 'VinFast' },
      '2T1BURHE0JC123456': { model: 'VinFast VF7', year: '2024', manufacturer: 'VinFast' },
      '3VW2K7AJ9EM123456': { model: 'VinFast VF9', year: '2024', manufacturer: 'VinFast' },
    };
    
    return mockDatabase[vin] || null;
  };

  const handleVINChange = (vin: string) => {
    const upperVin = vin.toUpperCase();
    handleInputChange('vinNumber', upperVin);
    
    const validation = validateVIN(upperVin);
    setFieldErrors(prev => ({
      ...prev,
      vinNumber: validation.message
    }));
    
    // Auto-fill vehicle info if VIN is valid
    if (validation.isValid) {
      const vehicleInfo = mockVINLookup(upperVin);
      if (vehicleInfo) {
        handleInputChange('vehicleModel', vehicleInfo.model);
        handleInputChange('manufacturingYear', vehicleInfo.year);
        toast({
          title: "Vehicle Information Auto-filled",
          description: `Found ${vehicleInfo.model} (${vehicleInfo.year})`,
        });
      }
    }
  };

  const handlePasswordChange = (password: string) => {
    handleInputChange('password', password);
    const validation = validatePassword(password);
    setPasswordStrength(validation);
    setFieldErrors(prev => ({
      ...prev,
      password: !validation.isValid ? validation.feedback : ''
    }));
  };

  const handleEmailChange = (email: string) => {
    handleInputChange('email', email);
    const validation = validateEmailRealtime(email);
    setFieldErrors(prev => ({
      ...prev,
      email: validation.message
    }));
  };

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    toast({
      title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Login`,
      description: "Social login integration would be implemented here",
    });
  };

  const handleCaptchaVerify = () => {
    // Mock captcha verification
    setCaptchaVerified(true);
    toast({
      title: "Captcha Verified",
      description: "You have been verified as human",
    });
  };

  const handleSearchCustomer = () => {
    setShowSearchModal(true);
  };

  const searchCustomers = () => {
    // Mock search functionality
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter search information",
        description: "Enter customer name, email or phone number",
        variant: "destructive"
      });
      return;
    }

    // Simulate search results
    setTimeout(() => {
      toast({
        title: "Customer not found",
        description: `No customer matches "${searchQuery}"`,
      });
    }, 1000);
  };

  const handleSubmit = () => {
    // Terms and Captcha validation
    if (!agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the Terms & Privacy Policy",
        variant: "destructive"
      });
      return;
    }

    if (!captchaVerified) {
      toast({
        title: "Captcha Required",
        description: "Please complete the captcha verification",
        variant: "destructive"
      });
      return;
    }

    // Account Information Validation
    if (!customerData.fullName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter full name",
        variant: "destructive"
      });
      return;
    }

    const emailValidation = validateEmailRealtime(customerData.email);
    if (!emailValidation.isValid) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhone(customerData.phone)) {
      toast({
        title: "Validation Error", 
        description: "Please enter a valid phone number (10-11 digits)",
        variant: "destructive"
      });
      return;
    }

    const passwordValidation = validatePassword(customerData.password);
    if (!passwordValidation.isValid) {
      toast({
        title: "Validation Error",
        description: "Password does not meet security requirements",
        variant: "destructive"
      });
      return;
    }

    if (customerData.password !== customerData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Password confirmation does not match",
        variant: "destructive"
      });
      return;
    }

    // Vehicle Information Validation
    const vinValidation = validateVIN(customerData.vinNumber);
    if (!vinValidation.isValid) {
      toast({
        title: "Validation Error",
        description: vinValidation.message || "Please enter a valid VIN number",
        variant: "destructive"
      });
      return;
    }

    if (!customerData.vehicleModel) {
      toast({
        title: "Validation Error",
        description: "Please select vehicle model",
        variant: "destructive"
      });
      return;
    }

    if (!customerData.manufacturingYear) {
      toast({
        title: "Validation Error",
        description: "Please select manufacturing year",
        variant: "destructive"
      });
      return;
    }

    if (!customerData.purchaseDate) {
      toast({
        title: "Validation Error",
        description: "Please enter purchase date",
        variant: "destructive"
      });
      return;
    }

    // Contact Information Validation
    if (!customerData.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter address",
        variant: "destructive"
      });
      return;
    }

    if (!customerData.province) {
      toast({
        title: "Validation Error",
        description: "Please select province/city",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const customerId = `CUST-${Date.now()}`;
      toast({
        title: "Registration Successful!",
        description: "You have successfully registered! Please check your email to verify your account.",
        duration: 5000,
      });
      setIsLoading(false);
      onClose();
    }, 2000);
  };

  const isValid = customerData.fullName && 
                  customerData.email && 
                  customerData.phone && 
                  customerData.password && 
                  customerData.confirmPassword &&
                  customerData.vinNumber && 
                  customerData.vehicleModel && 
                  customerData.manufacturingYear && 
                  customerData.purchaseDate &&
                  customerData.address &&
                  customerData.province &&
                  agreeToTerms &&
                  captchaVerified &&
                  Object.keys(fieldErrors).every(key => !fieldErrors[key]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <span>Register New Customer</span>
              </CardTitle>
              <CardDescription>
                Register account and warranty information for customer
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleSearchCustomer}>
                <Search className="h-4 w-4 mr-2" />
                Search Customer
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-8">
            {/* Social Login Options */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <p className="text-sm text-center mb-4 font-medium">Quick Registration with Social Login</p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center space-x-2"
                  >
                    <Chrome className="h-4 w-4" />
                    <span>Google</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSocialLogin('facebook')}
                    className="flex items-center space-x-2"
                  >
                    <Facebook className="h-4 w-4" />
                    <span>Facebook</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleSocialLogin('apple')}
                    className="flex items-center space-x-2"
                  >
                    <span className="text-base">🍎</span>
                    <span>Apple</span>
                  </Button>
                </div>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or register manually</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* 1. Thông tin tài khoản */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Key className="h-4 w-4" />
                  <span>1. Account Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Customer Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter full name"
                      value={customerData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Enter your full legal name as it appears on official documents</p>
                  </div>

                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="customer@email.com"
                        value={customerData.email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        className={fieldErrors.email ? 'border-red-500' : 'border-input'}
                      />
                      {customerData.email && !fieldErrors.email && (
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                      )}
                      {fieldErrors.email && (
                        <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {fieldErrors.email ? (
                      <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">For notifications and password reset</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="0901234567"
                      value={customerData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">For direct contact and SMS verification (10-11 digits)</p>
                  </div>

                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password (minimum 8 characters)"
                        value={customerData.password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
                        className={fieldErrors.password ? 'border-red-500' : 'border-input'}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {customerData.password && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Password Strength:</span>
                          <span className={
                            passwordStrength.score < 2 ? 'text-red-500' :
                            passwordStrength.score < 4 ? 'text-yellow-500' : 'text-green-500'
                          }>
                            {passwordStrength.level}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.score < 2 ? 'bg-red-500 w-1/4' :
                              passwordStrength.score < 4 ? 'bg-yellow-500 w-3/4' : 'bg-green-500 w-full'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">{passwordStrength.feedback}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">Include uppercase, lowercase, number, and special character for strong security</p>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={customerData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={
                          customerData.confirmPassword && customerData.password !== customerData.confirmPassword 
                            ? 'border-red-500' : 'border-input'
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      {customerData.confirmPassword && customerData.password === customerData.confirmPassword && (
                        <CheckCircle className="absolute right-10 top-3 h-4 w-4 text-green-500" />
                      )}
                    </div>
                    {customerData.confirmPassword && customerData.password !== customerData.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Thông tin xe */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Car className="h-4 w-4" />
                  <span>2. Vehicle Information (Core warranty system)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vinNumber">VIN Number *</Label>
                    <div className="relative">
                      <Input
                        id="vinNumber"
                        placeholder="Enter VIN code (17 characters)"
                        value={customerData.vinNumber}
                        onChange={(e) => handleVINChange(e.target.value)}
                        maxLength={17}
                        className={fieldErrors.vinNumber ? 'border-red-500' : 'border-input'}
                      />
                      {customerData.vinNumber.length === 17 && !fieldErrors.vinNumber && (
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                      )}
                      {fieldErrors.vinNumber && (
                        <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={fieldErrors.vinNumber ? 'text-red-500' : 'text-muted-foreground'}>
                        {fieldErrors.vinNumber || 'VIN includes 17 characters, printed on vehicle registration'}
                      </span>
                      <span className={`${customerData.vinNumber.length === 17 ? 'text-green-500' : 'text-muted-foreground'}`}>
                        {customerData.vinNumber.length}/17
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label>Vehicle Model *</Label>
                    <Select value={customerData.vehicleModel} onValueChange={(value) => handleInputChange('vehicleModel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle model" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleModels.map((model) => (
                          <SelectItem key={model} value={model}>{model}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Model may auto-fill when valid VIN is entered</p>
                  </div>

                  <div>
                    <Label>Manufacturing Year *</Label>
                    <Select value={customerData.manufacturingYear} onValueChange={(value) => handleInputChange('manufacturingYear', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manufacturing year" />
                      </SelectTrigger>
                      <SelectContent>
                        {manufacturingYears.map((year) => (
                          <SelectItem key={year} value={year}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Year the vehicle was manufactured</p>
                  </div>

                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date *</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={customerData.purchaseDate}
                      onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Date of purchase or warranty activation (cannot be future date)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Thông tin liên hệ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <MapPin className="h-4 w-4" />
                  <span>3. Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Detailed Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter house number, street name"
                    value={customerData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Include apartment/unit number if applicable</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ward">Ward</Label>
                    <Input
                      id="ward"
                      placeholder="Enter ward"
                      value={customerData.ward}
                      onChange={(e) => handleInputChange('ward', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      placeholder="Enter district"
                      value={customerData.district}
                      onChange={(e) => handleInputChange('district', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Province/City *</Label>
                    <Select value={customerData.province} onValueChange={(value) => handleInputChange('province', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select province/city" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province} value={province}>{province}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Preferred Contact Method</Label>
                  <Select value={customerData.preferredContact} onValueChange={(value) => handleInputChange('preferredContact', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select contact method" />
                    </SelectTrigger>
                    <SelectContent>
                      {preferredContactOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information (Optional) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <IdCard className="h-4 w-4" />
                  <span>Additional Information (Optional)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={customerData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Gender</Label>
                    <Select value={customerData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>ID Type</Label>
                    <Select value={customerData.idType} onValueChange={(value) => handleInputChange('idType', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        {idTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="idNumber">ID Number</Label>
                    <Input
                      id="idNumber"
                      placeholder="Enter ID number"
                      value={customerData.idNumber}
                      onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="Company name"
                      value={customerData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      placeholder="Job title/Occupation"
                      value={customerData.jobTitle}
                      onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional information about customer..."
                    value={customerData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Captcha & Terms */}
            <Card className="border-orange-200 bg-orange-50/30">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Shield className="h-4 w-4" />
                  <span>Security & Terms Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Mock Captcha */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="captcha"
                        checked={captchaVerified}
                        onCheckedChange={(checked) => {
                          if (checked) handleCaptchaVerify();
                          else setCaptchaVerified(false);
                        }}
                      />
                      <label htmlFor="captcha" className="text-sm font-medium">
                        I'm not a robot
                      </label>
                    </div>
                    <div className="ml-auto">
                      <div className="text-xs text-gray-500 flex flex-col items-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-sm mb-1 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">reCAPTCHA</span>
                        </div>
                        <span>Protected</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 underline hover:text-blue-800">Terms of Service</a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 underline hover:text-blue-800">Privacy Policy</a>
                    . I understand that my information will be used for warranty management and customer service purposes.
                  </label>
                </div>
                
                {(!captchaVerified || !agreeToTerms) && (
                  <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">
                      Please complete captcha verification and agree to terms to proceed
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Preview */}
            <Card className="bg-accent/20">
              <CardHeader>
                <CardTitle className="text-base">Customer Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Name:</strong> {customerData.fullName || 'Not entered'}</p>
                    <p><strong>Email:</strong> {customerData.email || 'Not entered'}</p>
                    <p><strong>Phone:</strong> {customerData.phone || 'Not entered'}</p>
                    <p><strong>VIN:</strong> {customerData.vinNumber || 'Not entered'}</p>
                    <p><strong>Vehicle Model:</strong> {customerData.vehicleModel || 'Not selected'}</p>
                  </div>
                  <div>
                    <p><strong>Manufacturing Year:</strong> {customerData.manufacturingYear || 'Not selected'}</p>
                    <p><strong>Purchase Date:</strong> {customerData.purchaseDate || 'Not entered'}</p>
                    <p><strong>Address:</strong> {customerData.address || 'Not entered'}</p>
                    <p><strong>Province:</strong> {customerData.province || 'Not selected'}</p>
                    <p><strong>Registered by:</strong> {user?.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t bg-gradient-to-r from-gray-50 to-blue-50 p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">* Required fields</p>
              <p className="text-xs text-muted-foreground mt-1">
                All information is encrypted and secured
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-8 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={handleSubmit}
                disabled={!isValid || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Register Customer Account
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-60">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Search Customer</span>
              </CardTitle>
              <CardDescription>
                Enter name, email or phone number to find existing customer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="searchQuery">Search Information</Label>
                <Input
                  id="searchQuery"
                  placeholder="Enter name, email or phone number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
            <div className="border-t p-4">
              <div className="flex space-x-3 justify-end">
                <Button variant="outline" onClick={() => setShowSearchModal(false)}>
                  Cancel
                </Button>
                <Button onClick={searchCustomers}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AddCustomer;