import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Wrench,
  FileText,
  User,
  Search,
  LogOut,
  Camera,
  Eye,
  Settings,
  Zap,
  Palette,
  X
} from "lucide-react";

interface Component {
  id: string;
  name: string;
  partNumber: string;
  category: 'battery' | 'motor' | 'paint' | 'general';
  inStockServiceCenter: number;
  inStockManufacturer: number;
  warrantyKm?: number;
  warrantyMonths?: number;
  requiresVehicleCheck: boolean;
  description: string;
}

interface Vehicle {
  id: string;
  vin: string;
  model: string;
  year: number;
  currentKm: number;
  purchaseDate: string;
  hasActiveCase: boolean;
}

interface Staff {
  id: string;
  name: string;
  specialty: string;
  currentWorkload: number;
  isAvailable: boolean;
}

interface Task {
  id: string;
  vehicleVin: string;
  vehicleModel: string;
  customer: string;
  component: Component;
  assignedStaff: Staff[];
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  createdDate: string;
  dueDate: string;
  progress: number;
  warrantyValid: boolean;
  notes: string;
}

interface TechnicianDashboardProps {
  onViewCase?: (caseId: string) => void;
  onAddReport?: (caseId: string) => void;
  onLogProgress?: (caseId: string) => void;
  onRecordInstallation?: (caseId: string) => void;
}

const TechnicianDashboard = ({
  onViewCase,
  onAddReport,
  onLogProgress,
  onRecordInstallation
}: TechnicianDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [componentSearch, setComponentSearch] = useState("");
  const [componentCategoryFilter, setComponentCategoryFilter] = useState<string>("all");
  const { user, logout } = useAuth();

  // Mock data - thay thế bằng API calls trong thực tế
  const availableComponents: Component[] = [
    {
      id: "comp-001",
      name: "Pin Lithium-ion VF8",
      partNumber: "BAT-VF8-2024",
      category: "battery",
      inStockServiceCenter: 5,
      inStockManufacturer: 15,
      warrantyMonths: 96,
      requiresVehicleCheck: false,
      description: "Pin chính cho VF8, bảo hành riêng 8 năm"
    },
    {
      id: "comp-002",
      name: "Motor điện trước",
      partNumber: "MOT-VF8-FRT",
      category: "motor",
      inStockServiceCenter: 2,
      inStockManufacturer: 8,
      warrantyKm: 100000,
      warrantyMonths: 60,
      requiresVehicleCheck: true,
      description: "Motor điện bánh trước, yêu cầu kiểm tra km và thời gian"
    },
    {
      id: "comp-003",
      name: "Sơn ngoại thất",
      partNumber: "PAINT-001",
      category: "paint",
      inStockServiceCenter: 0,
      inStockManufacturer: 20,
      warrantyMonths: 24,
      requiresVehicleCheck: false,
      description: "Sơn ngoại thất, bảo hành riêng 2 năm"
    },
    {
      id: "comp-004",
      name: "Cụm phanh trước",
      partNumber: "BRK-FRT-001",
      category: "general",
      inStockServiceCenter: 8,
      inStockManufacturer: 25,
      warrantyKm: 50000,
      warrantyMonths: 36,
      requiresVehicleCheck: true,
      description: "Cụm phanh trước, yêu cầu kiểm tra km và thời gian xe"
    }
  ];

  const vehicles: Vehicle[] = [
    {
      id: "veh-001",
      vin: "VF8ABC123456789",
      model: "VF8 Plus",
      year: 2024,
      currentKm: 15000,
      purchaseDate: "2024-01-15",
      hasActiveCase: false
    },
    {
      id: "veh-002",
      vin: "VF9DEF987654321",
      model: "VF9 Premium",
      year: 2024,
      currentKm: 8500,
      purchaseDate: "2024-03-10",
      hasActiveCase: true
    }
  ];

  const staffMembers: Staff[] = [
    {
      id: "staff-001",
      name: "Nguyễn Văn An",
      specialty: "Battery Systems",
      currentWorkload: 2,
      isAvailable: true
    },
    {
      id: "staff-002",
      name: "Trần Minh Bảo",
      specialty: "Motor & Drivetrain",
      currentWorkload: 3,
      isAvailable: true
    },
    {
      id: "staff-003",
      name: "Lê Thu Hương",
      specialty: "Body & Paint",
      currentWorkload: 1,
      isAvailable: true
    },
    {
      id: "staff-004",
      name: "Phạm Đức Minh",
      specialty: "General Maintenance",
      currentWorkload: 4,
      isAvailable: false
    }
  ];

  const myTasks: Task[] = [
    {
      id: "task-001",
      vehicleVin: "VF8ABC123456789",
      vehicleModel: "VF8 Plus",
      customer: "Nguyễn Văn Hùng",
      component: availableComponents[0],
      assignedStaff: [staffMembers[0]],
      status: "in-progress",
      priority: "high",
      createdDate: "2025-09-28",
      dueDate: "2025-10-05",
      progress: 60,
      warrantyValid: true,
      notes: "Pin suy giảm dung lượng"
    },
    {
      id: "task-002",
      vehicleVin: "VF9DEF987654321",
      vehicleModel: "VF9 Premium",
      customer: "Trần Quốc Bảo",
      component: availableComponents[1],
      assignedStaff: [staffMembers[1]],
      status: "pending",
      priority: "medium",
      createdDate: "2025-09-30",
      dueDate: "2025-10-07",
      progress: 0,
      warrantyValid: true,
      notes: "Motor có tiếng động lạ"
    }
  ];

  const filteredComponents = availableComponents.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(componentSearch.toLowerCase()) ||
                         comp.partNumber.toLowerCase().includes(componentSearch.toLowerCase());
    
    const matchesCategory = componentCategoryFilter === "all" || comp.category === componentCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const filteredTasks = myTasks.filter(task => {
    const matchesSearch = task.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.vehicleVin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getComponentIcon = (category: string) => {
    switch (category) {
      case 'battery': return Zap;
      case 'motor': return Settings;
      case 'paint': return Palette;
      default: return Wrench;
    }
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Radial Gradient Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)",
        }}
      />
      
      {/* Your Content/Components */}
      <div className="min-h-screen bg-transparent relative z-10">
      {/* Header */}
      <header className="border-b bg-card shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Wrench className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Technician Warranty Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.name} - Technician
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-xs">
                Technician
              </Badge>
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="warranty-reports" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="warranty-reports">Warranty Reports</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
          </TabsList>

          {/* Warranty Reports Tab */}
          <TabsContent value="warranty-reports" className="space-y-6">
            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search VIN or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
              
              {/* Search hints */}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>🔍 Search by:</span>
                <Badge variant="outline" className="text-xs">VIN</Badge>
                <Badge variant="outline" className="text-xs">Customer</Badge>
                <Badge variant="outline" className="text-xs">Vehicle Model</Badge>
              </div>
            </div>

            {/* Create New Warranty Report */}
            <Card>
              <CardHeader>
                <CardTitle>Create Warranty Report</CardTitle>
                <CardDescription>
                  Submit warranty claim with photos and component details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vehicle VIN</Label>
                    <Input placeholder="Enter vehicle VIN..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input placeholder="Enter customer name..." />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Warranty Issue Description</Label>
                  <Textarea 
                    placeholder="Describe the warranty issue in detail..."
                    className="min-h-20"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Upload Photos</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload photos of the warranty issue
                    </p>
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Choose Photos
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Submit to Manufacturer
                  </Button>
                  <Button variant="outline">
                    Save Draft
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* My Warranty Reports */}
            <Card>
              <CardHeader>
                <CardTitle>My Warranty Reports</CardTitle>
                <CardDescription>
                  Track your submitted warranty reports and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Submitted Date</TableHead>
                      <TableHead>Manufacturer Response</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.vehicleModel}</p>
                            <p className="text-xs text-muted-foreground font-mono">{task.vehicleVin}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{task.customer}</p>
                        </TableCell>
                        <TableCell className="text-sm">{task.createdDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            Pending Review
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <FileText className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-6">
            {/* Component Search */}
            <div className="space-y-2">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search components by name or part number..."
                    value={componentSearch}
                    onChange={(e) => setComponentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={componentCategoryFilter} onValueChange={setComponentCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="battery">🔋 Battery</SelectItem>
                    <SelectItem value="motor">⚙️ Motor</SelectItem>
                    <SelectItem value="paint">🎨 Paint</SelectItem>
                    <SelectItem value="general">🔧 General</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  setComponentSearch("");
                  setComponentCategoryFilter("all");
                }}>
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
              
              {/* Component search hints */}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>🔍 Search examples:</span>
                <Badge variant="outline" className="text-xs">Pin Lithium</Badge>
                <Badge variant="outline" className="text-xs">BAT-VF8-2024</Badge>
                <Badge variant="outline" className="text-xs">Motor</Badge>
                <Badge variant="outline" className="text-xs">Sơn ngoại thất</Badge>
              </div>
              
              {(componentSearch || componentCategoryFilter !== "all") && (
                <div className="text-sm text-muted-foreground">
                  Found {filteredComponents.length} component(s)
                  {componentSearch && ` matching "${componentSearch}"`}
                  {componentCategoryFilter !== "all" && ` in category "${componentCategoryFilter}"`}
                </div>
              )}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Component Inventory & Warranty Info</CardTitle>
                <CardDescription>
                  View available components and their warranty policies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Service Center Stock</TableHead>
                      <TableHead>Manufacturer Stock</TableHead>
                      <TableHead>Warranty Policy</TableHead>
                      <TableHead>Requires Vehicle Check</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComponents.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {React.createElement(getComponentIcon(component.category), { className: "h-4 w-4" })}
                            <div>
                              <p className="font-medium">{component.name}</p>
                              <p className="text-xs text-muted-foreground">{component.partNumber}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {component.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={component.inStockServiceCenter > 0 ? "default" : "destructive"}>
                            {component.inStockServiceCenter} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={component.inStockManufacturer > 0 ? "default" : "destructive"}>
                            {component.inStockManufacturer} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {component.warrantyMonths && (
                              <div>{component.warrantyMonths} months</div>
                            )}
                            {component.warrantyKm && (
                              <div>{component.warrantyKm.toLocaleString()} km</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {component.requiresVehicleCheck ? (
                            <Badge variant="outline" className="text-red-600">Yes</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600">No</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Staff Workload & Availability</CardTitle>
                <CardDescription>
                  Monitor staff assignments and distribute workload efficiently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {staffMembers.map((staff) => (
                    <Card key={staff.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{staff.name}</p>
                            <p className="text-sm text-muted-foreground">{staff.specialty}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Current Workload:</span>
                            <Badge variant={staff.currentWorkload > 3 ? "destructive" : "default"}>
                              {staff.currentWorkload} tasks
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Availability:</span>
                            <Badge variant={staff.isAvailable ? "default" : "destructive"}>
                              {staff.isAvailable ? "Available" : "Busy"}
                            </Badge>
                          </div>
                          
                          <div className="w-full bg-muted rounded-full h-2 mt-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                staff.currentWorkload > 3 ? 'bg-red-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(staff.currentWorkload * 25, 100)}%` }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </div>
  );
};

export default TechnicianDashboard;