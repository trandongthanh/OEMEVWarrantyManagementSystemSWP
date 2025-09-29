import { useState } from "react";
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
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showRegisterVehicle, setShowRegisterVehicle] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAttachParts, setShowAttachParts] = useState(false);
  const [showClaimDetails, setShowClaimDetails] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [selectedClaimStatus, setSelectedClaimStatus] = useState<string>('');
  const [ownerForm, setOwnerForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const { user, logout } = useAuth();

  // Mock vehicle data for VIN search
  const mockVehicles = [
    {
      vin: "1HGBH41JXMN109186",
      model: "EV Model X Pro",
      year: "2023",
      color: "Pearl White",
      batteryCapacity: "85 kWh",
      motorType: "Dual Motor AWD",
      purchaseDate: "2023-06-15",
      warrantyStartDate: "2023-06-15",
      warrantyEndDate: "2031-06-15",
      dealerInfo: "EV Center Hanoi",
      owner: {
        name: "Nguyễn Văn Minh",
        phone: "0901234567",
        email: "minh.nguyen@email.com",
        address: "123 Đường ABC, Quận 1, TP.HCM"
      }
    },
    {
      vin: "WVWZZZ1JZ3W386752",
      model: "EV Compact Plus",
      year: "2024",
      color: "Obsidian Black",
      batteryCapacity: "60 kWh",
      motorType: "Single Motor RWD",
      purchaseDate: "2024-02-20",
      warrantyStartDate: "2024-02-20",
      warrantyEndDate: "2032-02-20",
      dealerInfo: "EV Center HCMC",
      owner: null
    },
    {
      vin: "1N4AL11D75C109151",
      model: "EV SUV Premium",
      year: "2023",
      color: "Metallic Silver",
      batteryCapacity: "100 kWh",
      motorType: "Triple Motor AWD",
      purchaseDate: "2023-09-10",
      warrantyStartDate: "2023-09-10",
      warrantyEndDate: "2031-09-10",
      dealerInfo: "EV Center Da Nang",
      owner: {
        name: "Trần Thị Lan",
        phone: "0987654321",
        email: "lan.tran@email.com",
        address: "456 Đường XYZ, Quận 2, TP.HCM"
      }
    }
  ];

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

  const handleVinSearch = () => {
    if (!searchTerm.trim()) return;
    
    const vehicle = mockVehicles.find(v => 
      v.vin.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (vehicle) {
      setSearchResult(vehicle);
      setShowVehicleForm(true);
    } else {
      setSearchResult(null);
      setShowVehicleForm(false);
      // Could show a "Vehicle not found" message here
    }
  };

  const handleRegisterOwner = () => {
    if (searchResult && ownerForm.name && ownerForm.phone) {
      // In real app, would make API call to register owner
      const updatedVehicle = {
        ...searchResult,
        owner: { ...ownerForm }
      };
      
      // Update the mock data
      const vehicleIndex = mockVehicles.findIndex(v => v.vin === searchResult.vin);
      if (vehicleIndex !== -1) {
        mockVehicles[vehicleIndex] = updatedVehicle;
      }
      
      setSearchResult(updatedVehicle);
      setOwnerForm({ name: '', phone: '', email: '', address: '' });
      
      console.log('Owner registered successfully:', updatedVehicle);
    }
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
                            {user?.role === 'technician' ? 'Update Progress' : 'Update Status'}
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
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">VIN Number</label>
                    <Input 
                      value={searchResult.vin}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <Input 
                      value={searchResult.model}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year</label>
                    <Input 
                      value={searchResult.year}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Color</label>
                    <Input 
                      value={searchResult.color}
                      onChange={(e) => setSearchResult(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="Enter vehicle color"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Battery Capacity</label>
                    <Input 
                      value={searchResult.batteryCapacity}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Motor Type</label>
                    <Input 
                      value={searchResult.motorType}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Purchase Date</label>
                    <Input 
                      type="date"
                      value={searchResult.purchaseDate}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Dealer Information</label>
                    <Input 
                      value={searchResult.dealerInfo}
                      disabled
                      className="bg-muted"
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
                        <label className="block text-sm font-medium mb-1">Owner Name</label>
                        <Input 
                          value={searchResult.owner.name}
                          onChange={(e) => setSearchResult(prev => ({ 
                            ...prev, 
                            owner: { ...prev.owner, name: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <Input 
                          value={searchResult.owner.phone}
                          onChange={(e) => setSearchResult(prev => ({ 
                            ...prev, 
                            owner: { ...prev.owner, phone: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input 
                          type="email"
                          value={searchResult.owner.email}
                          onChange={(e) => setSearchResult(prev => ({ 
                            ...prev, 
                            owner: { ...prev.owner, email: e.target.value }
                          }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <Input 
                          value={searchResult.owner.address}
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
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Owner Name *</label>
                        <Input
                          placeholder="Enter owner name"
                          value={ownerForm.name}
                          onChange={(e) => setOwnerForm(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number *</label>
                        <Input
                          placeholder="Enter phone number"
                          value={ownerForm.phone}
                          onChange={(e) => setOwnerForm(prev => ({ ...prev, phone: e.target.value }))}
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
                    
                    <div className="flex justify-end">
                      <Button 
                        variant="gradient" 
                        onClick={handleRegisterOwner}
                        disabled={!ownerForm.name || !ownerForm.phone}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Register Owner
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            
            {/* Modal Footer */}
            <div className="border-t p-6">
              <div className="flex justify-between">
                <Button variant="outline">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => {
                    setShowVehicleForm(false);
                    setSearchResult(null);
                    setSearchTerm('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ServiceCenterDashboard;