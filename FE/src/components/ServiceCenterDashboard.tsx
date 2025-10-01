import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/utils/permissions";
import NewClaim from "./NewClaim";
import RegisterVehicle from "./RegisterVehicle";
import AddCustomer from "./AddCustomer";
import AttachParts from "./AttachParts";
import ClaimDetails from "./ClaimDetails";
import UpdateClaimStatus from "./UpdateClaimStatus";
import {
  Car,
  User,
  Wrench,
  FileText,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  Users,
  LogOut,
  Save
} from "lucide-react";

const ServiceCenterDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showNotFoundToast, setShowNotFoundToast] = useState(false);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showRegisterVehicle, setShowRegisterVehicle] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAttachParts, setShowAttachParts] = useState(false);
  const [showClaimDetails, setShowClaimDetails] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [selectedClaimStatus, setSelectedClaimStatus] = useState<string>('');
  const [ownerForm, setOwnerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  });
  const [customerSearchPhone, setCustomerSearchPhone] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [hasSearchedCustomer, setHasSearchedCustomer] = useState(false);
  const { user, logout } = useAuth();

  // Helper function to handle phone number input (numbers only)
  const handlePhoneChange = (value: string, setter: (value: string) => void) => {
    // Only allow numbers and remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "None";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return "None";
    }
  };

  // Helper function to display value or "None" for null
  const displayValue = (value: string | null) => {
    return value || "None";
  };





  const stats = [
    {
      title: "Active Claims",
      value: "24",
      change: "+3 from yesterday",
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Pending Repairs",
      value: "12",
      change: "5 awaiting parts",
      icon: Wrench,
      color: "text-warning"
    },
    {
      title: "Completed Today",
      value: "8",
      change: "+2 from yesterday",
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Technicians",
      value: "6",
      change: "2 available",
      icon: Users,
      color: "text-automotive-steel"
    }
  ];

  // In real app, data would be fetched from API
  const recentClaims: any[] = [];

  const handleViewDetails = (claimId: string) => {
    setSelectedClaimId(claimId);
    setShowClaimDetails(true);
  };

  const handleUpdateStatus = (claimId: string, currentStatus: string) => {
    setSelectedClaimId(claimId);
    setSelectedClaimStatus(currentStatus);
    setShowUpdateStatus(true);
  };

  const handleStatusUpdated = () => {
    // In real app, would refresh the claims list
    setShowUpdateStatus(false);
    setShowClaimDetails(false);
  };

  const handleVinSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      // Get token from AuthContext
      const token = user?.id ? localStorage.getItem('ev_warranty_token') : null;
      
      if (!token) {
        alert('Please login first');
        return;
      }

      // Call backend API to search for vehicle by VIN
      const response = await axios.get(`http://localhost:3000/api/v1/vehicle/find-vehicle-by-vin`, {
        params: {
          vin: searchTerm.trim()
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.status === 'success') {
        const vehicleData = response.data.data.vehicle;
        console.log('Vehicle data received:', vehicleData);
        setSearchResult(vehicleData);
        setShowVehicleForm(true);
        setShowNotFoundToast(false);
      }
    } catch (error) {
      console.error('Error searching vehicle:', error);
      
      if (error.response) {
        console.error('Backend error:', error.response.data);
        // Handle specific error messages
        if (error.response.status === 404) {
          console.log('Vehicle not found in system');
        }
      }
      
      // If vehicle not found (404) or other error, show not found toast
      setSearchResult(null);
      setShowVehicleForm(false);
      setShowNotFoundToast(true);
      
      // Tự động ẩn toast sau 3 giây
      setTimeout(() => {
        setShowNotFoundToast(false);
      }, 3000);
    }
  };

  const handleSearchCustomer = async () => {
    if (!customerSearchPhone.trim()) return;
    
    setIsSearchingCustomer(true);
    setHasSearchedCustomer(false);
    
    try {
      // Get token from AuthContext
      const token = localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        alert('Please login first');
        setIsSearchingCustomer(false);
        return;
      }

      // Call backend API to search for customer by phone
      const response = await axios.get(`http://localhost:3000/api/v1/customer/find-customer-with-phone-or-email`, {
        params: {
          phone: customerSearchPhone.trim()
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.status === 'success') {
        const customerData = response.data.data.customer;
        console.log('Customer data received:', customerData);
        
        // Customer found, populate form with customer data
        setOwnerForm({
          fullName: customerData.fullName || customerData.fullname || '',
          phone: customerData.phone || '',
          email: customerData.email || '',
          address: customerData.address || ''
        });
      }
      
      setIsSearchingCustomer(false);
      setHasSearchedCustomer(true);
    } catch (error) {
      console.error('Error searching customer:', error);
      
      if (error.response) {
        console.error('Backend error:', error.response.data);
        // Handle specific error messages
        if (error.response.status === 404) {
          console.log('Customer not found in system');
        }
      }
      
      // Customer not found, clear form but keep phone number
      setOwnerForm({
        fullName: '',
        phone: customerSearchPhone.trim(),
        email: '',
        address: ''
      });
      
      setIsSearchingCustomer(false);
      setHasSearchedCustomer(true);
    }
  };

  const handleRegisterOwner = async () => {
    // Validate all 8 required fields (4 customer + 4 vehicle)
    
    // Customer fields validation
    if (!ownerForm.fullName?.trim()) {
      alert('Please fill in Customer Full Name.');
      return;
    }
    if (!ownerForm.email?.trim()) {
      alert('Please fill in Customer Email.');
      return;
    }
    if (!ownerForm.phone?.trim()) {
      alert('Please fill in Customer Phone.');
      return;
    }
    if (!ownerForm.address?.trim()) {
      alert('Please fill in Customer Address.');
      return;
    }

    // Vehicle form fields validation
    const licensePlate = searchResult.licensePlate || searchResult.licenseplate;
    const purchaseDate = searchResult.purchaseDate || searchResult.purchasedate;
    const dateOfManufacture = searchResult.dateOfManufacture || searchResult.dateofmanufacture;

    if (!searchResult.vin?.trim()) {
      alert('VIN Number is required.');
      return;
    }

    if (!dateOfManufacture) {
      alert('Please set Date of Manufacture.');
      return;
    }

    if (!licensePlate || !licensePlate.trim()) {
      alert('Please fill in License Plate.');
      return;
    }

    if (!purchaseDate) {
      alert('Please select Purchase Date.');
      return;
    }

    try {
      // Get token from AuthContext
      const token = localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        alert('Please login first');
        return;
      }

      // Step 1: Check if customer already exists
      console.log('Checking if customer exists with phone:', ownerForm.phone.trim());
      
      let requestBody;
      try {
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
          // Customer exists - use customerId approach
          const existingCustomer = searchResponse.data.data.customer;
          console.log('Customer already exists:', existingCustomer);
          
          requestBody = {
            customerId: existingCustomer.id,     // Use existing customer ID
            dateOfManufacture: dateOfManufacture,
            licensePlate: licensePlate,
            purchaseDate: purchaseDate
          };
          
          console.log('Using existing customer ID:', existingCustomer.id);
          console.log('Vehicle fields - Date of Manufacture:', dateOfManufacture);
          console.log('Vehicle fields - License Plate:', licensePlate);
          console.log('Vehicle fields - Purchase Date:', purchaseDate);
          console.log('Vehicle fields - VIN (in URL):', searchResult.vin);
          
        } else {
          // Customer doesn't exist - use customer object approach
          console.log('Customer not found, will create new customer');
          
          requestBody = {
            customer: {
              fullName: ownerForm.fullName.trim(),   // Field 1
              email: ownerForm.email.trim(),         // Field 2  
              phone: ownerForm.phone.trim(),         // Field 3
              address: ownerForm.address.trim()      // Field 4
            },
            dateOfManufacture: dateOfManufacture,    // Field 5
            licensePlate: licensePlate,              // Field 6
            purchaseDate: purchaseDate               // Field 7
            // Field 8: VIN is in URL path: ${searchResult.vin}
          };
          
          console.log('Creating new customer with all 8 fields:');
          console.log('1. Customer Full Name:', ownerForm.fullName.trim());
          console.log('2. Customer Email:', ownerForm.email.trim());
          console.log('3. Customer Phone:', ownerForm.phone.trim());
          console.log('4. Customer Address:', ownerForm.address.trim());
          console.log('5. Date of Manufacture:', dateOfManufacture);
          console.log('6. License Plate:', licensePlate);
          console.log('7. Purchase Date:', purchaseDate);
          console.log('8. VIN (in URL):', searchResult.vin);
        }
      } catch (searchError) {
        // If search fails, assume customer doesn't exist and create new one
        console.log('Customer search failed, will create new customer:', searchError.message);
        
        requestBody = {
          customer: {
            fullName: ownerForm.fullName.trim(),
            email: ownerForm.email.trim(),
            phone: ownerForm.phone.trim(),
            address: ownerForm.address.trim()
          },
          dateOfManufacture: dateOfManufacture,
          licensePlate: licensePlate,
          purchaseDate: purchaseDate
        };
      }

      console.log('Final request body:', requestBody);

      // Step 2: Register vehicle with customer (existing or new)
      const response = await axios.patch(`http://localhost:3000/api/v1/vehicle/${searchResult.vin}/update-owner`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success') {
        console.log('Vehicle and owner registered successfully:', response.data);
        
        // Update searchResult with the complete vehicle data from response
        const updatedVehicle = response.data.data.vehicle;
        setSearchResult(updatedVehicle);
        
        // Update form with backend data
        setOwnerForm({
          fullName: updatedVehicle.owner.fullName || '',
          phone: updatedVehicle.owner.phone || '',
          email: updatedVehicle.owner.email || '',
          address: updatedVehicle.owner.address || ''
        });
        
        // Determine success message based on whether customer was existing or new
        const successMessage = requestBody.customerId 
          ? 'Vehicle registered successfully with existing customer!' 
          : 'Vehicle owner registered successfully! New customer created and vehicle assigned.';
        
        alert(successMessage + ' All information has been saved to the backend.');
        
        // Close modal and reset states
        setShowVehicleForm(false);
        setSearchResult(null);
        setSearchTerm('');
        setCustomerSearchPhone('');
        setHasSearchedCustomer(false);
        setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
        
      } else {
        console.error('Unexpected response format:', response.data);
        alert('Unexpected response from server. Please try again.');
      }
      
    } catch (error) {
      console.error('Error registering owner:', error);
      if (error.response?.data?.message) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes('This vehicle has owner')) {
          alert('This vehicle already has an owner registered.');
        } else if (errorMessage.includes('duplicate')) {
          alert('A customer with this phone number or email already exists. Please use different contact information.');
        } else {
          alert(`Failed to register owner: ${errorMessage}`);
        }
      } else {
        alert('Failed to register owner. Please try again.');
      }
    }
  };

  const handleUpdateOwnerInBackend = async () => {
    // Validate owner form
    if (!ownerForm.fullName?.trim() || !ownerForm.phone?.trim() || !ownerForm.email?.trim() || !ownerForm.address?.trim()) {
      alert('Please fill in all owner information (Full Name, Phone, Email, Address).');
      return;
    }

    if (!searchResult?.owner?.id) {
      alert('No owner information found. Please register owner first.');
      return;
    }

    try {
      const token = localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        alert('Please login first');
        return;
      }

      // First, update or create customer with new information
      let customerId = searchResult.owner.id;
      
      // Check if phone number changed - if so, search for existing customer or create new
      if (ownerForm.phone.trim() !== searchResult.owner.phone) {
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
          // Customer with new phone exists
          customerId = searchResponse.data.data.customer.id;
        } else {
          // Create new customer with new phone
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
            customerId = createResponse.data.data.customer.id;
          } else {
            throw new Error('Failed to create new customer');
          }
        }
      }

      // Prepare request body for update-owner endpoint
      const requestBody = {
        customerId: customerId,
        licensePlate: searchResult.licensePlate || searchResult.licenseplate,
        purchaseDate: searchResult.purchaseDate || searchResult.purchasedate,
        dateOfManufacture: searchResult.dateOfManufacture || searchResult.dateofmanufacture
      };

      console.log('Updating vehicle owner in backend:', requestBody);

      // API call to backend using HTTP PATCH
      const response = await axios.patch(`http://localhost:3000/api/v1/vehicle/${searchResult.vin}/update-owner`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success') {
        console.log('Vehicle owner updated successfully:', response.data);
        alert('Vehicle owner information updated successfully!');
        
        // Update local state with new owner info
        const updatedVehicle = {
          ...searchResult,
          owner: {
            id: customerId,
            fullName: ownerForm.fullName,
            phone: ownerForm.phone,
            email: ownerForm.email,
            address: ownerForm.address
          }
        };
        setSearchResult(updatedVehicle);
        
      } else {
        console.error('Unexpected response format:', response.data);
        alert('Unexpected response from server. Please try again.');
      }
      
    } catch (error) {
      console.error('Error updating vehicle owner:', error);
      if (error.response) {
        console.error('Backend error:', error.response.data);
        const errorMessage = error.response.data.message || 'Server error';
        
        if (errorMessage.includes('This vehicle has owner')) {
          alert('This vehicle already has an owner registered. The backend currently does not support updating existing owner information. Please contact the administrator for assistance.');
        } else {
          alert(`Failed to update vehicle owner: ${errorMessage}`);
        }
      } else if (error.request) {
        console.error('No response from server:', error.request);
        alert('No response from server. Please check if backend is running.');
      } else {
        console.error('Request error:', error.message);
        alert('An error occurred while updating. Please try again.');
      }
    }
  };

  const handleSaveVehicleData = async () => {
    alert('Vehicle data has already been saved when registering the owner. No additional action needed.');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "pending" as const, icon: Clock, text: "Chờ duyệt" },
      approved: { variant: "approved" as const, icon: CheckCircle, text: "Đã duyệt" },
      rejected: { variant: "rejected" as const, icon: XCircle, text: "Từ chối" },
      "in-progress": { variant: "warning" as const, icon: Wrench, text: "Đang sửa" },
      completed: { variant: "success" as const, icon: CheckCircle, text: "Hoàn thành" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Wrench className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Service Center Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Xin chào, {user?.name} ({user?.role === 'service_center_staff' ? 'Staff' : 'Technician'})
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline">{user?.serviceCenter}</Badge>
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
              {hasPermission(user, 'manage_campaigns') && (
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule
                </Button>
              )}
              {hasPermission(user, 'create_claim') && (
                <Button variant="gradient" onClick={() => setShowNewClaim(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Claim
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Quick Search */}
        <div className="mb-6">
          <div className="flex w-full space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by VIN"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant="gradient"
              onClick={handleVinSearch}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>



        {/* Statistics Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.change}
                      </p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="claims" className="space-y-6">
          <TabsList className={`grid w-full ${hasPermission(user, 'manage_campaigns') ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="claims">Warranty Claims</TabsTrigger>
            {hasPermission(user, 'register_vehicle') && (
              <TabsTrigger value="vehicles">Vehicle Management</TabsTrigger>
            )}
            <TabsTrigger value="repairs">Active Repairs</TabsTrigger>
            {hasPermission(user, 'manage_campaigns') && (
              <TabsTrigger value="campaigns">Service Campaigns</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="claims" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Recent Warranty Claims</CardTitle>
                <CardDescription>
                  Manage warranty claims and track their progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentClaims.map((claim) => (
                    <div
                      key={claim.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                          <FileText className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold">{claim.id}</p>
                            {getStatusBadge(claim.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            VIN: {claim.vin}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Customer: {claim.customer}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{claim.issue}</p>
                        <p className="text-sm text-muted-foreground">
                          Tech: {claim.technician}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {claim.date}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(claim.id)}>
                          View Details
                        </Button>
                        {(hasPermission(user, 'approve_reject_claims') || hasPermission(user, 'update_technical_status')) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUpdateStatus(claim.id, claim.status)}
                          >
                            {user?.role === 'service_center_technician' ? 'Update Progress' : 'Update Status'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {hasPermission(user, 'view_all_claims') && (
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline" onClick={() => window.location.href = '/all-claims'}>
                      View All Claims
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Vehicle & Customer Management</CardTitle>
                <CardDescription>
                  Register vehicles, manage customer profiles and service history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-4">
                  {hasPermission(user, 'register_vehicle') && (
                    <Button variant="gradient" onClick={() => setShowRegisterVehicle(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Register New Vehicle
                    </Button>
                  )}
                  {hasPermission(user, 'add_customer') && (
                    <Button variant="outline" onClick={() => setShowAddCustomer(true)}>
                      <User className="mr-2 h-4 w-4" />
                      Add Customer
                    </Button>
                  )}
                  {hasPermission(user, 'attach_parts') && (
                    <Button variant="secondary" onClick={() => setShowAttachParts(true)}>
                      <Car className="mr-2 h-4 w-4" />
                      Attach Parts
                    </Button>
                  )}
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Vehicle Info</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        VIN registration, model details, warranty dates
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Personal information, contact details, history
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Service History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Timeline of services, repairs, and maintenance
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="repairs" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Active Repairs</CardTitle>
                <CardDescription>
                  Track repair progress and technician assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-warning">
                    <CardHeader>
                      <CardTitle className="text-base text-warning">Pending Parts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">5 repairs waiting for parts delivery</p>
                    </CardContent>
                  </Card>
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-base text-primary">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">7 vehicles currently being repaired</p>
                    </CardContent>
                  </Card>
                  <Card className="border-success">
                    <CardHeader>
                      <CardTitle className="text-base text-success">Ready for Handover</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">3 repairs completed and ready</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Service Campaigns</CardTitle>
                <CardDescription>
                  Manage recall campaigns and customer notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <h3 className="font-semibold">Battery Software Update Campaign</h3>
                      <p className="text-sm text-muted-foreground">
                        Affects 2022-2023 EV models - Critical safety update
                      </p>
                    </div>
                    {hasPermission(user, 'manage_campaigns') && (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">Send Notifications</Button>
                        <Button variant="default" size="sm">Manage Schedule</Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showNewClaim && (
        <NewClaim onClose={() => setShowNewClaim(false)} />
      )}
      {showRegisterVehicle && (
        <RegisterVehicle onClose={() => setShowRegisterVehicle(false)} />
      )}
      {showAddCustomer && (
        <AddCustomer onClose={() => setShowAddCustomer(false)} />
      )}
      {showAttachParts && (
        <AttachParts onClose={() => setShowAttachParts(false)} />
      )}
      {showClaimDetails && (
        <ClaimDetails
          claimId={selectedClaimId}
          onClose={() => setShowClaimDetails(false)}
          onUpdateStatus={() => {
            setShowClaimDetails(false);
            setShowUpdateStatus(true);
          }}
        />
      )}
      {showUpdateStatus && (
        <UpdateClaimStatus
          claimId={selectedClaimId}
          currentStatus={selectedClaimStatus}
          onClose={() => setShowUpdateStatus(false)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}

      {/* Vehicle Information Modal */}
      {showVehicleForm && searchResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="h-5 w-5 text-primary" />
                    <span>Vehicle Information</span>
                  </CardTitle>
                  <CardDescription>
                    Edit vehicle details and owner information
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowVehicleForm(false);
                    setSearchResult(null);
                    setSearchTerm('');
                    // Reset customer search states when closing modal
                    setCustomerSearchPhone('');
                    setHasSearchedCustomer(false);
                    setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
                  }}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
              {/* Vehicle Details Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Vehicle Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">VIN Number</label>
                    <Input 
                      value={searchResult.vin}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Manufacture</label>
                    <Input 
                      value={formatDate(searchResult.dateOfManufacture)}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Place of Manufacture</label>
                    <Input 
                      value={searchResult.placeOfManufacture || searchResult.placeofmanufacture || ""}
                      onChange={(e) => setSearchResult(prev => ({ 
                        ...prev, 
                        placeOfManufacture: e.target.value,
                        placeofmanufacture: e.target.value
                      }))}
                      placeholder="Enter place of manufacture"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">License Plate</label>
                    <Input 
                      value={searchResult.licensePlate || searchResult.licenseplate || ""}
                      onChange={(e) => setSearchResult(prev => ({ 
                        ...prev, 
                        licensePlate: e.target.value,
                        licenseplate: e.target.value
                      }))}
                      placeholder="Enter license plate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Purchase Date</label>
                    <Input 
                      type="date"
                      value={searchResult.purchaseDate || searchResult.purchasedate ? 
                        new Date(searchResult.purchaseDate || searchResult.purchasedate).toISOString().split('T')[0] : ""}
                      onChange={(e) => setSearchResult(prev => ({ 
                        ...prev, 
                        purchaseDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                        purchasedate: e.target.value ? new Date(e.target.value).toISOString() : null
                      }))}
                      placeholder="Select purchase date"
                    />
                  </div>
                </div>
              </div>

              {/* Owner Information Form */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Owner Information</h3>
                {searchResult.owner ? (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge variant="success">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Registered Owner
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <Input 
                          value={searchResult.owner?.fullName || searchResult.owner?.fullname || ''}
                          onChange={(e) => setSearchResult(prev => ({ 
                            ...prev, 
                            owner: { ...prev.owner, fullName: e.target.value, fullname: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <Input 
                          value={searchResult.owner?.phone || ''}
                          onChange={(e) => handlePhoneChange(e.target.value, (phone) => setSearchResult(prev => ({ 
                            ...prev, 
                            owner: { ...prev.owner, phone }
                          })))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input 
                          type="email"
                          value={searchResult.owner?.email || ''}
                          onChange={(e) => setSearchResult(prev => ({ 
                            ...prev, 
                            owner: { ...prev.owner, email: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <Input 
                          value={searchResult.owner?.address || ''}
                          onChange={(e) => setSearchResult(prev => ({ 
                            ...prev, 
                            owner: { ...prev.owner, address: e.target.value }
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      <p className="text-warning font-medium">This car is unowned</p>
                    </div>
                    
                    {/* Customer Search Section */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Search Existing Customer</label>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Enter customer phone number"
                            value={customerSearchPhone}
                            onChange={(e) => handlePhoneChange(e.target.value, setCustomerSearchPhone)}
                            className="flex-1"
                          />
                          <Button 
                            variant="outline" 
                            onClick={handleSearchCustomer}
                            disabled={isSearchingCustomer || !customerSearchPhone.trim()}
                            className="px-6"
                          >
                            {isSearchingCustomer ? (
                              <><Clock className="mr-2 h-4 w-4 animate-spin" />Searching...</>
                            ) : (
                              <><Search className="mr-2 h-4 w-4" />Search</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Owner Form Fields - Only show after search button is clicked */}
                    {hasSearchedCustomer && (
                      <>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Full Name *</label>
                            <Input
                              placeholder="Enter owner full name"
                              value={ownerForm.fullName}
                              onChange={(e) => setOwnerForm(prev => ({ ...prev, fullName: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Phone Number *</label>
                            <Input
                              placeholder="Enter phone number"
                              value={ownerForm.phone}
                              onChange={(e) => handlePhoneChange(e.target.value, (phone) => setOwnerForm(prev => ({ ...prev, phone })))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <Input
                              placeholder="Enter email address"
                              type="email"
                              value={ownerForm.email}
                              onChange={(e) => setOwnerForm(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <Input
                              placeholder="Enter address"
                              value={ownerForm.address}
                              onChange={(e) => setOwnerForm(prev => ({ ...prev, address: e.target.value }))}
                            />
                          </div>
                        </div>
                        
                        {/* Register Owner button removed - owner registration now integrated with Save Changes */}
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
            
            {/* Modal Footer */}
            <div className="border-t p-6">
              <div className="flex justify-between">
                <Button 
                  variant="outline"
                  onClick={handleRegisterOwner}
                  disabled={
                    !searchResult || 
                    // Customer fields validation (4 fields)
                    !ownerForm.fullName?.trim() ||
                    !ownerForm.phone?.trim() ||
                    !ownerForm.email?.trim() ||
                    !ownerForm.address?.trim() ||
                    // Vehicle fields validation (4 fields: VIN, dateOfManufacture, licensePlate, purchaseDate)
                    !searchResult.vin?.trim() ||
                    !(searchResult.dateOfManufacture || searchResult.dateofmanufacture) ||
                    !(searchResult.licensePlate || searchResult.licenseplate)?.trim() ||
                    !(searchResult.purchaseDate || searchResult.purchasedate)
                  }
                >
                  <Save className="mr-2 h-4 w-4" />
                  Register & Save
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    setShowVehicleForm(false);
                    setSearchResult(null);
                    setSearchTerm('');
                    // Reset customer search states when closing modal
                    setCustomerSearchPhone('');
                    setHasSearchedCustomer(false);
                    setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Toast Notification for Vehicle Not Found */}
      {showNotFoundToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right duration-300">
          <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg border border-destructive/20 flex items-center space-x-2 min-w-[300px]">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-sm">Vehicle not found</p>
              <p className="text-xs opacity-90">VIN "{searchTerm}" does not exist in the system</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-6 p-0 text-destructive-foreground hover:bg-destructive-foreground/20"
              onClick={() => setShowNotFoundToast(false)}
            >
              <XCircle className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCenterDashboard;