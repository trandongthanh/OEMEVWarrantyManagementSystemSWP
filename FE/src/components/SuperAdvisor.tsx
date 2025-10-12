

import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  LogOut,
  Plus,
  Edit,
  Wrench,
  CheckCircle,
  Car,
  Trash2,
  User
} from 'lucide-react';

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

interface CaseNote {
  id: string;
  text: string;
  createdAt: string;
}

interface WarrantyRecord {
  id: string;
  vinNumber: string;
  customerName: string;
  mileage: number;
  cases?: CaseNote[];
  purchaseDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

interface VinDataState {
  vinNumber: string;
  purchaseDate: string;
  warrantyStatus: string;
}

interface VehicleSearchResult {
  vin: string;
  dateOfManufacture: string;
  placeOfManufacture?: string;
  licensePlate?: string;
  purchaseDate?: string;
  owner?: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    address: string;
  };
}

interface OwnerForm {
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

const SuperAdvisor = () => {
  const { user, logout, getToken } = useAuth();
  const { toast } = useToast();
  
  const [searchVin, setSearchVin] = useState('');
  const [searchMode, setSearchMode] = useState<'warranty' | 'customer'>('warranty');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WarrantyRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddNewcaseOpen, setIsAddNewcaseOpen] = useState(false);
  const [currentCaseText, setCurrentCaseText] = useState('');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [isDialogSearch, setIsDialogSearch] = useState(false);
  // Form state for new record
  const [newRecord, setNewRecord] = useState({
    vinNumber: '',
    mileage: '',
    customerName: '',
    cases: [] as CaseNote[],
    purchaseDate: ''
  });

  const [vinData, setVinData] = useState<VinDataState>({
    vinNumber: "",
    purchaseDate: "",
    warrantyStatus: ""
  });

  // Vehicle registration states
  const [vehicleSearchResult, setVehicleSearchResult] = useState<VehicleSearchResult | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [ownerForm, setOwnerForm] = useState<OwnerForm>({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  });

  // Form state for editing record
  const [editRecord, setEditRecord] = useState({
    vinNumber: '',
    mileage: '',
    customerName: '',
    cases: [] as CaseNote[],
    purchaseDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed'
  });

  const [records, setRecords] = useState<WarrantyRecord[]>([]);

  // Helper: Validate record data
  const validateRecord = (record: { vinNumber: string; customerName: string; mileage: string; cases: CaseNote[]; purchaseDate: string }) => {
    return record.vinNumber && record.customerName && record.mileage && record.cases.length > 0 && record.purchaseDate;
  };

  // Helper: Calculate warranty status
  const calculateWarrantyStatus = (durationStatus?: string, mileageStatus?: string) => {
    if (durationStatus === 'ACTIVE' && mileageStatus === 'ACTIVE') return 'Active';
    if (durationStatus === 'INACTIVE' && mileageStatus === 'INACTIVE') return 'Expired (Time & Mileage)';
    if (durationStatus === 'INACTIVE') return 'Expired (Time)';
    if (mileageStatus === 'INACTIVE') return 'Expired (Mileage)';
    return 'N/A';
  };

  const handleSearchWarranty = async () => {
  try {
    if (!searchVin.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter VIN',
        variant: 'destructive'
      });
      return;
    }

    const vin = searchVin.trim();
    const odometer = 0;

    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      console.error("No token found (checked AuthContext.getToken and localStorage 'ev_warranty_token')");
      toast({
        title: 'Error',
        description: 'Không tìm thấy token đăng nhập',
        variant: 'destructive'
      });
      return;
    }

    const url = `http://localhost:3000/api/v1/vehicles/${vin}/warranty?odometer=${odometer}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok || data.status !== 'success') {
      toast({
        title: 'Unable to find warranty',
        variant: 'destructive'
      });
      return;
    }    if (data && data.status === 'success' && data.data && data.data.vehicle) {
      const vehicle = data.data.vehicle;
      const warrantyStatus = vehicle.generalWarranty && vehicle.purchaseDate
        ? calculateWarrantyStatus(
            vehicle.generalWarranty.duration?.status,
            vehicle.generalWarranty.mileage?.status
          )
        : 'N/A';
      
      setVinData({
        vinNumber: vehicle.vin || '',
        purchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString('vi-VN') : '',
        warrantyStatus
      });

      setIsDialogSearch(true);

      toast({
        title: 'Thành công',
        description: 'Đã tải thông tin VIN',
      });
    } else {
      toast({
        title: 'Không có dữ liệu',
        description: 'Không tìm thấy thông tin xe',
        variant: 'destructive'
      });
    }

  } catch (error) {
    console.error("Failed to fetch VIN warranty info:", error);
    
  }
};

  const handleSearchCustomer = async () => {
    try {
      if (!searchVin.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter VIN to search vehicle',
          variant: 'destructive'
        });
        return;
      }

      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive'
        });
        return;
      }

      // Search vehicle by VIN
      const response = await axios.get(`http://localhost:3000/api/v1/vehicle/${searchVin.trim()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success' && response.data.data) {
        const vehicle = response.data.data;
        
        setVehicleSearchResult({
          vin: vehicle.vin,
          dateOfManufacture: vehicle.dateOfManufacture || vehicle.dateofmanufacture,
          placeOfManufacture: vehicle.placeOfManufacture || vehicle.placeofmanufacture,
          licensePlate: vehicle.licensePlate || vehicle.licenseplate,
          purchaseDate: vehicle.purchaseDate || vehicle.purchasedate,
          owner: vehicle.owner
        });

        if (vehicle.owner) {
          toast({
            title: 'Customer Found',
            description: `Vehicle is registered to ${vehicle.owner.fullName || vehicle.owner.fullname}`,
          });
        } else {
          toast({
            title: 'Vehicle Found - No Owner',
            description: 'Vehicle exists but no owner is registered. You can register an owner.',
          });
          setShowRegisterDialog(true);
        }
      } else {
        toast({
          title: 'Vehicle Not Found',
          description: 'No vehicle found with this VIN',
          variant: 'destructive'
        });
        setVehicleSearchResult(null);
      }

    } catch (error) {
      console.error("Failed to search vehicle:", error);
      toast({
        title: 'Error',
        description: 'An error occurred while searching for vehicle',
        variant: 'destructive'
      });
      setVehicleSearchResult(null);
    }
  };

  const handleRegisterOwner = async () => {
    if (!ownerForm.fullName?.trim() || !ownerForm.phone?.trim() || !ownerForm.email?.trim() || !ownerForm.address?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all owner information (Full Name, Phone, Email, Address)',
        variant: 'destructive'
      });
      return;
    }

    if (!vehicleSearchResult) {
      toast({
        title: 'Error',
        description: 'No vehicle selected for registration',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = localStorage.getItem('ev_warranty_token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please login first',
          variant: 'destructive'
        });
        return;
      }

      // First, find or create customer
      let customerData = null;

      const searchResponse = await axios.get(`http://localhost:3000/api/v1/customer/find-customer-with-phone-or-email`, {
        params: {
          phone: ownerForm.phone.trim()
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (searchResponse.data?.data?.customer) {
        customerData = searchResponse.data.data.customer;
      } else {
        // Create new customer
        const createResponse = await axios.post(`http://localhost:3000/api/v1/customer`, {
          fullName: ownerForm.fullName.trim(),
          email: ownerForm.email.trim(),
          phone: ownerForm.phone.trim(),
          address: ownerForm.address.trim()
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (createResponse.data?.status === 'success') {
          customerData = createResponse.data.data.customer;
        } else {
          throw new Error('Failed to create customer');
        }
      }

      // Prepare request body with 8 fields
      const requestBody = {
        customerId: customerData.id,
        licensePlate: vehicleSearchResult.licensePlate || '',
        purchaseDate: vehicleSearchResult.purchaseDate || new Date().toISOString(),
        dateOfManufacture: vehicleSearchResult.dateOfManufacture,
        placeOfManufacture: vehicleSearchResult.placeOfManufacture || '',
        fullName: customerData.fullName || customerData.fullname,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address
      };

      // Register owner to vehicle
      const response = await axios.patch(`http://localhost:3000/api/v1/vehicle/${vehicleSearchResult.vin}/update-owner`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success') {
        toast({
          title: 'Success',
          description: 'Vehicle owner registered successfully!',
        });

        // Update vehicle search result with owner info
        setVehicleSearchResult(prev => ({
          ...prev!,
          owner: {
            id: customerData.id,
            fullName: customerData.fullName || customerData.fullname,
            phone: customerData.phone,
            email: customerData.email,
            address: customerData.address
          }
        }));

        // Reset form and close dialog
        setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
        setShowRegisterDialog(false);
      } else {
        throw new Error('Failed to register owner');
      }

    } catch (error) {
      console.error('Error registering owner:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to register owner. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleAddRecord = () => {
    if (!validateRecord(newRecord)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and add at least one case',
        variant: 'destructive'
      });
      return;
    }

    const record: WarrantyRecord = {
      id: `CLM-${String(records.length + 1).padStart(3, '0')}`,
      vinNumber: newRecord.vinNumber.toUpperCase(),
      customerName: newRecord.customerName,
      mileage: parseInt(newRecord.mileage),
      cases: newRecord.cases,
      purchaseDate: newRecord.purchaseDate,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRecords([...records, record]);
    setIsAddDialogOpen(false);
    setNewRecord({ vinNumber: '', mileage: '', customerName: '', cases: [], purchaseDate: '' });

    toast({
      title: 'Record Created Successfully',
      description: `New warranty claim ${record.id} has been created`,
    });
  };

  const handleEditRecord = (record: WarrantyRecord) => {
    setSelectedRecord(record);
    setEditRecord({
      vinNumber: record.vinNumber,
      mileage: record.mileage.toString(),
      customerName: record.customerName,
      cases: record.cases || [],
      purchaseDate: record.purchaseDate,
      status: record.status
    });
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!validateRecord(editRecord)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and have at least one case',
        variant: 'destructive'
      });
      return;
    }

    const updatedRecords = records.map(record => {
      if (record.id === selectedRecord?.id) {
        return {
          ...record,
          vinNumber: editRecord.vinNumber.toUpperCase(),
          customerName: editRecord.customerName,
          mileage: parseInt(editRecord.mileage),
          cases: editRecord.cases,
          purchaseDate: editRecord.purchaseDate,
          status: editRecord.status
        };
      }
      return record;
    });

    setRecords(updatedRecords);
    setIsEditMode(false);

    toast({
      title: 'Record Updated Successfully',
      description: `Warranty claim ${selectedRecord?.id} has been updated`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'pending' as const, text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
      'in-progress': { variant: 'warning' as const, text: 'In Progress', class: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'success' as const, text: 'Completed', class: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className={config.class}>
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Super Advisor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, Super Advisor </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>

              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search Section */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Search</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Mode Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={searchMode === 'warranty' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('warranty')}
                className={searchMode === 'warranty' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <Search className="h-4 w-4 mr-2" />
                Check Warranty by VIN
              </Button>
              <Button
                variant={searchMode === 'customer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('customer')}
                className={searchMode === 'customer' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Car className="h-4 w-4 mr-2" />
                Find Customer by VIN
              </Button>
            </div>

            {/* Dynamic Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                {searchMode === 'warranty' ? (
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                ) : (
                  <Car className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                )}
                <Input
                  placeholder={
                    searchMode === 'warranty' 
                      ? "Enter VIN to check warranty information" 
                      : "Enter VIN to find customer records"
                  }
                  className="pl-10 h-11"
                  value={searchVin}
                  onChange={(e) => setSearchVin(e.target.value)}
                />
              </div>
              <Button 
                size="sm" 
                className={
                  searchMode === 'warranty' 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "bg-green-600 hover:bg-green-700"
                }
                onClick={searchMode === 'warranty' ? handleSearchWarranty : handleSearchCustomer}
              >
                {searchMode === 'warranty' ? 'Check Warranty' : 'Find Customer'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Records Section - Only show in warranty mode */}
        {searchMode === 'warranty' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Recent Warranty Records</CardTitle>
              <CardDescription>Manage warranty records and track their progress</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record ID</TableHead>
                    <TableHead>VIN Number</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No warranty records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.vinNumber}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{record.cases?.length || 0} cases</Badge>
                            {record.cases && record.cases.length > 0 && (
                              <span className="text-sm truncate">{record.cases[0].text}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                           
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRecord(record)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

              {records.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline">View All Records</Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Customer Search Results Section - Only show in customer mode */}
        {searchMode === 'customer' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Vehicle Search Results</CardTitle>
              <CardDescription>Search for vehicles and register owners if needed</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicleSearchResult ? (
                <div className="space-y-6">
                  {/* Vehicle Information */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">
                      🚗 Vehicle Found
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">VIN Number</label>
                        <p className="font-mono text-sm bg-white p-2 rounded border">{vehicleSearchResult.vin}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date of Manufacture</label>
                        <p className="text-sm bg-white p-2 rounded border">{formatDate(vehicleSearchResult.dateOfManufacture)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Place of Manufacture</label>
                        <p className="text-sm bg-white p-2 rounded border">{vehicleSearchResult.placeOfManufacture || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">License Plate</label>
                        <p className="text-sm bg-white p-2 rounded border">{vehicleSearchResult.licensePlate || 'Not set'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Owner Information */}
                  {vehicleSearchResult.owner ? (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        ✅ Owner Registered
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Full Name</label>
                          <p className="text-sm bg-white p-2 rounded border">{vehicleSearchResult.owner.fullName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="text-sm bg-white p-2 rounded border">{vehicleSearchResult.owner.phone}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="text-sm bg-white p-2 rounded border">{vehicleSearchResult.owner.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Address</label>
                          <p className="text-sm bg-white p-2 rounded border">{vehicleSearchResult.owner.address}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                        ⚠️ No Owner Registered
                      </h3>
                      <p className="text-yellow-700 mb-3">
                        This vehicle exists but no owner is registered. You can register an owner for this vehicle.
                      </p>
                      <Button 
                        onClick={() => setShowRegisterDialog(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Register Owner
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Vehicle Search Performed
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enter a VIN above and click "Find Customer" to search for vehicle and owner information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Create New Warranty Record</span>
            </DialogTitle>
            <DialogDescription>
              Enter vehicle and customer information to create a new warranty record
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vinNumber">VIN Number *</Label>
              <Input
                id="vinNumber"
                placeholder="Enter VIN (17 characters)"
                value={newRecord.vinNumber}
                onChange={(e) => setNewRecord({ ...newRecord, vinNumber: e.target.value })}
                maxLength={17}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer full name"
                value={newRecord.customerName}
                onChange={(e) => setNewRecord({ ...newRecord, customerName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mileage">Mileage (km) *</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="Enter current mileage"
                value={newRecord.mileage}
                onChange={(e) => setNewRecord({ ...newRecord, mileage: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="purchaseDate">Release Date *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={newRecord.purchaseDate}
                onChange={(e) => setNewRecord({ ...newRecord, purchaseDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Cases * ({newRecord.cases.length})</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCurrentCaseText('');
                    setEditingCaseId(null);
                    setIsAddNewcaseOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Case
                </Button>
              </div>
              {newRecord.cases.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newRecord.cases.map((caseNote, index) => (
                    <div key={caseNote.id} className="p-3 bg-muted/50 rounded-md border flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">Case {index + 1}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(caseNote.createdAt)}</span>
                        </div>
                        <p className="text-sm break-words">{caseNote.text}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCurrentCaseText(caseNote.text);
                            setEditingCaseId(caseNote.id);
                            setIsAddNewcaseOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewRecord({
                              ...newRecord,
                              cases: newRecord.cases.filter(c => c.id !== caseNote.id)
                            });
                            toast({ title: 'Case deleted' });
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-muted/20 rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground italic">No cases added yet. Click "New Case" to add one.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddRecord}>
              <Plus className="h-4 w-4 mr-2" />
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* dialog search */}
      <Dialog open={isDialogSearch} onOpenChange={setIsDialogSearch}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>VIN Warranty</span>
            </DialogTitle>
            <DialogDescription>
              Vehicle warranty information and coverage details
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4" >
            <div className="grid gap-2">
              <Label>VIN Number</Label>
              <Input
                id="vinNumber"
                placeholder="VIN" 
                value={vinData.vinNumber}
                readOnly              
              />
            </div>

            <div className="grid gap-2">
              <Label>Purchase Date</Label>
              <Input
                id="purchaseDate"
                placeholder="Purchase Date" 
                value={vinData.purchaseDate}
                readOnly             
              />
            </div>

            <div className="grid gap-2">
              <Label>Warranty Status</Label>
              <Input
                id="Status"
                placeholder="Warranty status"
                value={vinData.warrantyStatus}
                readOnly
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      

      {/* Nested New Case Dialog */}
      <Dialog open={isAddNewcaseOpen} onOpenChange={(open) => {
        setIsAddNewcaseOpen(open);
        if (!open) {
          setCurrentCaseText('');
          setEditingCaseId(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCaseId ? 'Edit Case' : 'New Case'}</DialogTitle>
            <DialogDescription>
              {editingCaseId ? 'Update the case details' : 'Enter case details for this warranty record'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="caseText">Case Description *</Label>
              <Textarea
                id="caseText"
                placeholder="Describe the case..."
                value={currentCaseText}
                onChange={(e) => setCurrentCaseText(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddNewcaseOpen(false);
              setCurrentCaseText('');
              setEditingCaseId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (!currentCaseText.trim()) {
                toast({
                  title: 'Validation Error',
                  description: 'Please enter case description',
                  variant: 'destructive'
                });
                return;
              }

              if (isEditMode) {
                // Working with edit dialog
                if (editingCaseId) {
                  // Edit existing case in edit mode
                  setEditRecord({
                    ...editRecord,
                    cases: editRecord.cases.map(c => 
                      c.id === editingCaseId 
                        ? { ...c, text: currentCaseText } 
                        : c
                    )
                  });
                  toast({ title: 'Case updated successfully' });
                } else {
                  // Add new case in edit mode
                  const newCase: CaseNote = {
                    id: Date.now().toString(),
                    text: currentCaseText,
                    createdAt: new Date().toISOString()
                  };
                  setEditRecord({
                    ...editRecord,
                    cases: [...editRecord.cases, newCase]
                  });
                  toast({ title: 'Case added successfully' });
                }
              } else {
                // Working with add dialog
                if (editingCaseId) {
                  // Edit existing case
                  setNewRecord({
                    ...newRecord,
                    cases: newRecord.cases.map(c => 
                      c.id === editingCaseId 
                        ? { ...c, text: currentCaseText } 
                        : c
                    )
                  });
                  toast({ title: 'Case updated successfully' });
                } else {
                  // Add new case
                  const newCase: CaseNote = {
                    id: Date.now().toString(),
                    text: currentCaseText,
                    createdAt: new Date().toISOString()
                  };
                  setNewRecord({
                    ...newRecord,
                    cases: [...newRecord.cases, newCase]
                  });
                  toast({ title: 'Case added successfully' });
                }
              }

              setIsAddNewcaseOpen(false);
              setCurrentCaseText('');
              setEditingCaseId(null);
            }}>
              {editingCaseId ? 'Update Case' : 'Add Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Record Dialog */}
      <Dialog open={isEditMode} onOpenChange={(open) => {
        if (!open) setIsEditMode(false);
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Edit Warranty</span>
            </DialogTitle>
            <DialogDescription>
              Update warranty claim information
            </DialogDescription>
          </DialogHeader>

          {isEditMode && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Record ID</Label>
                <p className="font-medium">{selectedRecord?.id}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-vinNumber">VIN Number *</Label>
                <Input
                  id="edit-vinNumber"
                  placeholder="Enter VIN (17 characters)"
                  value={editRecord.vinNumber}
                  onChange={(e) => setEditRecord({ ...editRecord, vinNumber: e.target.value })}
                  maxLength={17}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-customerName">Customer Name *</Label>
                <Input
                  id="edit-customerName"
                  placeholder="Enter customer full name"
                  value={editRecord.customerName}
                  onChange={(e) => setEditRecord({ ...editRecord, customerName: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-mileage">Mileage (km) *</Label>
                <Input
                  id="edit-mileage"
                  type="number"
                  placeholder="Enter current mileage"
                  value={editRecord.mileage}
                  onChange={(e) => setEditRecord({ ...editRecord, mileage: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-purchaseDate">Purchase Date *</Label>
                <Input
                  id="edit-purchaseDate"
                  type="date"
                  value={editRecord.purchaseDate}
                  onChange={(e) => setEditRecord({ ...editRecord, purchaseDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status *</Label>
                <select
                  id="edit-status"
                  value={editRecord.status}
                  onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value as 'pending' | 'in-progress' | 'completed' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Cases * ({editRecord.cases.length})</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentCaseText('');
                      setEditingCaseId(null);
                      setIsAddNewcaseOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Case
                  </Button>
                </div>
                {editRecord.cases.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {editRecord.cases.map((caseNote, index) => (
                      <div key={caseNote.id} className="p-3 bg-muted/50 rounded-md border flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">Case {index + 1}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(caseNote.createdAt)}</span>
                          </div>
                          <p className="text-sm break-words">{caseNote.text}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setCurrentCaseText(caseNote.text);
                              setEditingCaseId(caseNote.id);
                              setIsAddNewcaseOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditRecord({
                                ...editRecord,
                                cases: editRecord.cases.filter(c => c.id !== caseNote.id)
                              });
                              toast({ title: 'Case deleted' });
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/20 rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground italic">No cases added yet. Click "New Case" to add one.</p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-muted-foreground">Created Date</Label>
                <p className="text-sm">{selectedRecord && formatDate(selectedRecord.createdAt)}</p>
              </div>
            </div>
          )}

          <DialogFooter>
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Owner Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Register Vehicle Owner</span>
            </DialogTitle>
            <DialogDescription>
              Enter owner information to register this vehicle
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Enter full name"
                value={ownerForm.fullName}
                onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="Enter phone number"
                value={ownerForm.phone}
                onChange={(e) => setOwnerForm({ ...ownerForm, phone: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={ownerForm.email}
                onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={ownerForm.address}
                onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRegisterDialog(false);
              setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleRegisterOwner} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Register Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdvisor;