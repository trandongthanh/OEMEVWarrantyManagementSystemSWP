import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Car,
  Calendar,
  Shield,
  X,
  Save,
  Search,
  User,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface VehicleData {
  vin: string;
  model: string;
  year: string;
  color: string;
  batteryCapacity: string;
  motorType: string;
  purchaseDate: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  customerId: string;
  dealerInfo: string;
}

const RegisterVehicle = ({ onClose }: { onClose: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const { toast } = useToast();

  const [vehicleData, setVehicleData] = useState<VehicleData>({
    vin: '',
    model: '',
    year: '',
    color: '',
    batteryCapacity: '',
    motorType: '',
    purchaseDate: '',
    warrantyStartDate: '',
    warrantyEndDate: '',
    customerId: '',
    dealerInfo: ''
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Mock customers
  const mockCustomers = [
    {
      id: 'cust-001',
      name: 'Nguyễn Văn Minh',
      phone: '0901234567',
      email: 'minh.nguyen@email.com',
      address: '123 Đường ABC, Quận 1, TP.HCM'
    },
    {
      id: 'cust-002', 
      name: 'Trần Thị Lan',
      phone: '0987654321',
      email: 'lan.tran@email.com',
      address: '456 Đường XYZ, Quận 2, TP.HCM'
    },
    {
      id: 'cust-003',
      name: 'Lê Hoàng Nam',
      phone: '0976543210',
      email: 'nam.le@email.com', 
      address: '789 Đường DEF, Quận 3, TP.HCM'
    }
  ];

  const evModels = [
    'EV Model X Pro',
    'EV Compact Plus',
    'EV SUV Premium',
    'EV Sedan Elite',
    'EV Crossover'
  ];

  const colors = [
    'Pearl White',
    'Obsidian Black', 
    'Navy Blue',
    'Metallic Silver',
    'Cherry Red',
    'Titan Gray'
  ];

  const batteryOptions = [
    '60 kWh',
    '75 kWh', 
    '85 kWh',
    '100 kWh',
    '120 kWh'
  ];

  const motorTypes = [
    'Single Motor RWD',
    'Dual Motor AWD',
    'Triple Motor AWD',
    'Performance Motor'
  ];

  const searchCustomer = () => {
    const customer = mockCustomers.find(c => 
      c.phone === customerSearch || 
      c.email === customerSearch ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase())
    );
    
    if (customer) {
      setSelectedCustomer(customer);
      setVehicleData(prev => ({ ...prev, customerId: customer.id }));
      toast({
        title: "Customer Found!",
        description: `Found ${customer.name}`,
      });
    } else {
      toast({
        title: "Customer Not Found",
        description: "Please check the information or add a new customer",
        variant: "destructive"
      });
    }
  };

  
  

  const calculateWarrantyDates = (purchaseDate: string) => {
    if (!purchaseDate) return;
    
    const purchase = new Date(purchaseDate);
    const warrantyStart = new Date(purchase);
    const warrantyEnd = new Date(purchase);
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 8); // 8 year warranty

    setVehicleData(prev => ({
      ...prev,
      warrantyStartDate: warrantyStart.toISOString().split('T')[0],
      warrantyEndDate: warrantyEnd.toISOString().split('T')[0]
    }));
  };

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      toast({
        title: "Vehicle Registered Successfully!",
        description: `VIN ${vehicleData.vin} has been registered for ${selectedCustomer?.name}`,
      });
      setIsLoading(false);
      onClose();
    }, 2000);
  };

  const isStep1Valid = vehicleData.vin && vehicleData.model && vehicleData.year && selectedCustomer;
  const isStep2Valid = vehicleData.color && vehicleData.batteryCapacity && vehicleData.motorType;
  const isStep3Valid = vehicleData.purchaseDate && vehicleData.warrantyStartDate;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-primary" />
                <span>Register New Vehicle</span>
              </CardTitle>
              <CardDescription className="mt-1 ml-3">
                Register a new electric vehicle and link to customer
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-6">
            {[
              { number: 1, title: 'Vehicle Info' },
              { number: 2, title: 'Specifications' },
              { number: 3, title: 'Warranty' }
            ].map((step) => (
              <div key={step.number} className="flex items-center space-x-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium ${
                  currentStep >= step.number 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className="text-sm font-medium">{step.title}</span>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Basic Vehicle Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vin">VIN Number</Label>
                  <Input
                    id="vin"
                    placeholder="Enter 17-character VIN"
                    value={vehicleData.vin}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, vin: e.target.value.toUpperCase() }))}
                    maxLength={17}
                  />
                  <p className="text-xs text-muted-foreground mt-1 ml-2">
                    Vehicle Identification Number (17 characters)
                  </p>
                </div>

                <div>
                  <Label>Model</Label>
                  <Select value={vehicleData.model} onValueChange={(value) => setVehicleData(prev => ({ ...prev, model: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle model" />
                    </SelectTrigger>
                    <SelectContent>
                      {evModels.map((model) => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Manufacturing Year</Label>
                  <Select value={vehicleData.year} onValueChange={(value) => setVehicleData(prev => ({ ...prev, year: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2023, 2022, 2021, 2020].map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Link to Customer</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Search by name, phone, or email"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={searchCustomer} disabled={!customerSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>

                {selectedCustomer && (
                  <Card className="border-success">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>{selectedCustomer.name}</span>
                          </h3>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                          <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                        </div>
                        <Badge variant="success">Linked</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Specifications */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Color</Label>
                  <Select value={vehicleData.color} onValueChange={(value) => setVehicleData(prev => ({ ...prev, color: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Battery Capacity</Label>
                  <Select value={vehicleData.batteryCapacity} onValueChange={(value) => setVehicleData(prev => ({ ...prev, batteryCapacity: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select battery capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      {batteryOptions.map((battery) => (
                        <SelectItem key={battery} value={battery}>{battery}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Motor Type</Label>
                  <Select value={vehicleData.motorType} onValueChange={(value) => setVehicleData(prev => ({ ...prev, motorType: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select motor configuration" />
                    </SelectTrigger>
                    <SelectContent>
                      {motorTypes.map((motor) => (
                        <SelectItem key={motor} value={motor}>{motor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="dealer">Dealer Information</Label>
                  <Input
                    id="dealer"
                    placeholder="Dealer name or code"
                    value={vehicleData.dealerInfo}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, dealerInfo: e.target.value }))}
                  />
                </div>
              </div>

              {/* Specifications Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Vehicle Specifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Model:</strong> {vehicleData.model || 'Not selected'}</p>
                      <p><strong>Year:</strong> {vehicleData.year || 'Not selected'}</p>
                      <p><strong>Color:</strong> {vehicleData.color || 'Not selected'}</p>
                    </div>
                    <div>
                      <p><strong>Battery:</strong> {vehicleData.batteryCapacity || 'Not selected'}</p>
                      <p><strong>Motor:</strong> {vehicleData.motorType || 'Not selected'}</p>
                      <p><strong>Customer:</strong> {selectedCustomer?.name || 'Not linked'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Warranty Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchase-date">Purchase Date</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={vehicleData.purchaseDate}
                    onChange={(e) => {
                      setVehicleData(prev => ({ ...prev, purchaseDate: e.target.value }));
                      calculateWarrantyDates(e.target.value);
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="warranty-start">Warranty Start Date</Label>
                  <Input
                    id="warranty-start"
                    type="date"
                    value={vehicleData.warrantyStartDate}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, warrantyStartDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="warranty-end">Warranty End Date</Label>
                  <Input
                    id="warranty-end"
                    type="date"
                    value={vehicleData.warrantyEndDate}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, warrantyEndDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Warranty Summary */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-primary">
                    <Shield className="h-5 w-5" />
                    <span>Warranty Coverage</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Battery System:</span>
                      <Badge variant="success">8 years / 160,000 km</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Motor & Drivetrain:</span>
                      <Badge variant="success">5 years / 100,000 km</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Electronics:</span>
                      <Badge variant="success">3 years / 60,000 km</Badge>
                    </div>
                    {vehicleData.warrantyEndDate && (
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Coverage until:</span>
                        <span className="font-medium text-primary">
                          {new Date(vehicleData.warrantyEndDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Registration Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Registration Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>VIN:</strong> {vehicleData.vin}</p>
                      <p><strong>Model:</strong> {vehicleData.model} ({vehicleData.year})</p>
                      <p><strong>Color:</strong> {vehicleData.color}</p>
                      <p><strong>Battery:</strong> {vehicleData.batteryCapacity}</p>
                    </div>
                    <div>
                      <p><strong>Customer:</strong> {selectedCustomer?.name}</p>
                      <p><strong>Phone:</strong> {selectedCustomer?.phone}</p>
                      <p><strong>Purchase:</strong> {vehicleData.purchaseDate ? new Date(vehicleData.purchaseDate).toLocaleDateString('vi-VN') : 'Not set'}</p>
                      <p><strong>Registered by:</strong> {user?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>

        {/* Footer Navigation */}
        <div className="border-t p-6">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid)
                }
              >
                Next
              </Button>
            ) : (
              <Button 
                variant="gradient"
                onClick={handleSubmit}
                disabled={!isStep3Valid || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    <span>Registering...</span>
                  </div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Register Vehicle
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RegisterVehicle;