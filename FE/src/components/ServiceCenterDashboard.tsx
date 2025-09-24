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
  LogOut
} from "lucide-react";

const ServiceCenterDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showRegisterVehicle, setShowRegisterVehicle] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAttachParts, setShowAttachParts] = useState(false);
  const [showClaimDetails, setShowClaimDetails] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [selectedClaimStatus, setSelectedClaimStatus] = useState<string>('');
  const { user, logout } = useAuth();

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

  const recentClaims = [
    {
      id: "WC-2024-001",
      vin: "1HGBH41JXMN109186",
      customer: "Nguyễn Văn A",
      issue: "Battery Performance Issue",
      status: "pending",
      technician: "Trần Minh B",
      date: "2024-01-15"
    },
    {
      id: "WC-2024-002", 
      vin: "WVWZZZ1JZ3W386752",
      customer: "Lê Thị C", 
      issue: "Motor Controller Fault",
      status: "approved",
      technician: "Phạm Văn D",
      date: "2024-01-14"
    },
    {
      id: "WC-2024-003",
      vin: "1N4AL11D75C109151",
      customer: "Hoàng Minh E",
      issue: "Charging System Error",
      status: "in-progress",
      technician: "Võ Thị F",
      date: "2024-01-13"
    }
  ];

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
                Đăng xuất
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
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by VIN or Customer ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
    </div>
  );
};

export default ServiceCenterDashboard;