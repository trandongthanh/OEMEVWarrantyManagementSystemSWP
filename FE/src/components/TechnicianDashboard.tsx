import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Package,
  User,
  Search,
  LogOut,
  Camera,
  Plus,
  Eye,
  PlayCircle,
  Settings,
  Filter,
  RefreshCw,
  Car,
  Users,
  TrendingUp,
  Zap,
  Palette,
  Gauge,
  X,
  Shield
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
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [showComponentSearch, setShowComponentSearch] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [assignedStaff, setAssignedStaff] = useState<Staff[]>([]);
  const [caseNotes, setCaseNotes] = useState("");
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

  // Helper functions
  const checkWarrantyValidity = (vehicle: Vehicle, component: Component): boolean => {
    // Pin, ắc quy, sơn không phụ thuộc vào xe
    if (!component.requiresVehicleCheck) {
      const purchaseDate = new Date(vehicle.purchaseDate);
      const currentDate = new Date();
      const monthsDiff = (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                        (currentDate.getMonth() - purchaseDate.getMonth());
      
      return component.warrantyMonths ? monthsDiff <= component.warrantyMonths : true;
    }
    
    // Các linh kiện khác yêu cầu kiểm tra cả km và thời gian
    const purchaseDate = new Date(vehicle.purchaseDate);
    const currentDate = new Date();
    const monthsDiff = (currentDate.getFullYear() - purchaseDate.getFullYear()) * 12 + 
                      (currentDate.getMonth() - purchaseDate.getMonth());
    
    const kmValid = component.warrantyKm ? vehicle.currentKm <= component.warrantyKm : true;
    const timeValid = component.warrantyMonths ? monthsDiff <= component.warrantyMonths : true;
    
    return kmValid && timeValid;
  };

  const getAvailableStaff = (): Staff[] => {
    return staffMembers
      .filter(staff => staff.isAvailable)
      .sort((a, b) => a.currentWorkload - b.currentWorkload);
  };

  const canCreateCaseForVehicle = (vin: string): boolean => {
    const vehicle = vehicles.find(v => v.vin === vin);
    return vehicle ? !vehicle.hasActiveCase : false;
  };

  const handleCreateCase = () => {
    if (!selectedVehicle || !selectedComponent || assignedStaff.length === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn đầy đủ thông tin",
        variant: "destructive"
      });
      return;
    }

    if (!canCreateCaseForVehicle(selectedVehicle.vin)) {
      toast({
        title: "Lỗi",
        description: "Xe này đã có case đang xử lý",
        variant: "destructive"
      });
      return;
    }

    const warrantyValid = checkWarrantyValidity(selectedVehicle, selectedComponent);
    
    if (!warrantyValid) {
      toast({
        title: "Cảnh báo",
        description: "Linh kiện này không còn trong thời hạn bảo hành",
        variant: "destructive"
      });
      return;
    }

    // Tạo case mới
    const newTask: Task = {
      id: `task-${Date.now()}`,
      vehicleVin: selectedVehicle.vin,
      vehicleModel: selectedVehicle.model,
      customer: "Khách hàng mới", // Thực tế sẽ lấy từ API
      component: selectedComponent,
      assignedStaff: assignedStaff,
      status: "pending",
      priority: "medium",
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      warrantyValid: true,
      notes: caseNotes
    };

    toast({
      title: "Thành công",
      description: `Đã tạo case ${newTask.id} và phân công cho ${assignedStaff.map(s => s.name).join(', ')}`
    });

    // Reset form
    setSelectedVehicle(null);
    setSelectedComponent(null);
    setAssignedStaff([]);
    setCaseNotes("");
    setShowCreateCase(false);
  };

  const filteredComponents = availableComponents.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(componentSearch.toLowerCase()) ||
                         comp.partNumber.toLowerCase().includes(componentSearch.toLowerCase());
    
    const matchesCategory = componentCategoryFilter === "all" || comp.category === componentCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const filteredTasks = myTasks.filter(task => {
    const matchesSearch = task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.vehicleVin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.component.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || task.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getComponentIcon = (category: string) => {
    switch (category) {
      case 'battery': return Zap;
      case 'motor': return Settings;
      case 'paint': return Palette;
      default: return Wrench;
    }
  };

  const stats = [
    {
      title: "Pending Tasks", 
      value: myTasks.filter(t => t.status === "pending").length.toString(),
      change: "+2 today",
      icon: Clock,
      color: "text-orange-500"
    },
    {
      title: "In Progress",
      value: myTasks.filter(t => t.status === "in-progress").length.toString(),
      change: "Active work",
      icon: Wrench,
      color: "text-blue-500"
    },
    {
      title: "Completed",
      value: myTasks.filter(t => t.status === "completed").length.toString(),
      change: "This week",
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      title: "Blocked",
      value: myTasks.filter(t => t.status === "blocked").length.toString(),
      change: "Need attention",
      icon: AlertCircle,
      color: "text-red-500"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, text: "Pending", icon: Clock },
      "in-progress": { variant: "default" as const, text: "In Progress", icon: Wrench },
      blocked: { variant: "destructive" as const, text: "Blocked", icon: AlertCircle },
      completed: { variant: "outline" as const, text: "Completed", icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon className="mr-1 h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { variant: "destructive" as const, text: "High" },
      medium: { variant: "default" as const, text: "Medium" },
      low: { variant: "outline" as const, text: "Low" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;

    return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>;
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
                <h1 className="text-xl font-bold text-foreground">Component Warranty Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.name} - Technician Supervisor
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-xs">
                Component Specialist
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
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="create-case">Create Case</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks, VIN, customer, or component..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Search hints */}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>🔍 Search by:</span>
                <Badge variant="outline" className="text-xs">Task ID</Badge>
                <Badge variant="outline" className="text-xs">VIN</Badge>
                <Badge variant="outline" className="text-xs">Customer</Badge>
                <Badge variant="outline" className="text-xs">Vehicle Model</Badge>
                <Badge variant="outline" className="text-xs">Component Name</Badge>
                <Badge variant="outline" className="text-xs">Part Number</Badge>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-4">
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

            {/* Tasks Table */}
            <Card>
              <CardHeader>
                <CardTitle>Component Warranty Tasks</CardTitle>
                <CardDescription>
                  Track progress on component warranty cases and staff assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task ID</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Assigned Staff</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-mono text-sm">{task.id}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.vehicleModel}</p>
                            <p className="text-xs text-muted-foreground">{task.vehicleVin}</p>
                            <p className="text-xs text-muted-foreground">{task.customer}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {React.createElement(getComponentIcon(task.component.category), { className: "h-4 w-4" })}
                            <div>
                              <p className="font-medium text-sm">{task.component.name}</p>
                              <p className="text-xs text-muted-foreground">{task.component.partNumber}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {task.assignedStaff.map((staff) => (
                              <Badge key={staff.id} variant="outline" className="text-xs">
                                {staff.name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-primary transition-all"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                            <span className="text-xs">{task.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{task.dueDate}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => onViewCase?.(task.id)}>
                              <Eye className="h-3 w-3" />
                            </Button>
                            {task.status === "in-progress" && (
                              <Button variant="default" size="sm" onClick={() => onAddReport?.(task.id)}>
                                <FileText className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Case Tab */}
          <TabsContent value="create-case" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Component Warranty Case</CardTitle>
                <CardDescription>
                  Create a new case for component warranty inspection and assign staff members
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vehicle Selection */}
                <div className="space-y-3">
                  <Label>Select Vehicle</Label>
                  <Select value={selectedVehicle?.id || ""} onValueChange={(value) => {
                    const vehicle = vehicles.find(v => v.id === value);
                    setSelectedVehicle(vehicle || null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose vehicle..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((vehicle) => (
                        <SelectItem 
                          key={vehicle.id} 
                          value={vehicle.id}
                          disabled={vehicle.hasActiveCase}
                        >
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            <div>
                              <p className="font-medium">{vehicle.model} - {vehicle.year}</p>
                              <p className="text-xs text-muted-foreground">
                                VIN: {vehicle.vin} | {vehicle.currentKm.toLocaleString()} km
                              </p>
                              {vehicle.hasActiveCase && (
                                <Badge variant="destructive" className="text-xs">
                                  Has Active Case
                                </Badge>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Component Selection */}
                <div className="space-y-3">
                  <Label>Select Component</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Search components..."
                      value={componentSearch}
                      onChange={(e) => setComponentSearch(e.target.value)}
                    />
                    <Select value={selectedComponent?.id || ""} onValueChange={(value) => {
                      const component = availableComponents.find(c => c.id === value);
                      setSelectedComponent(component || null);
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose component..." />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredComponents.map((component) => (
                          <SelectItem key={component.id} value={component.id}>
                            <div className="flex items-center gap-2">
                              {React.createElement(getComponentIcon(component.category), { className: "h-4 w-4" })}
                              <div>
                                <p className="font-medium">{component.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {component.partNumber} | SC: {component.inStockServiceCenter} | MFG: {component.inStockManufacturer}
                                </p>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Warranty Check Display */}
                {selectedVehicle && selectedComponent && (
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">Warranty Validation</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        {checkWarrantyValidity(selectedVehicle, selectedComponent) ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>Component is under warranty</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-600">
                            <X className="h-4 w-4" />
                            <span>Component warranty expired</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                          <div>Vehicle KM: {selectedVehicle.currentKm.toLocaleString()}</div>
                          <div>Purchase Date: {selectedVehicle.purchaseDate}</div>
                          {selectedComponent.warrantyKm && (
                            <div>Warranty KM: {selectedComponent.warrantyKm.toLocaleString()}</div>
                          )}
                          {selectedComponent.warrantyMonths && (
                            <div>Warranty Period: {selectedComponent.warrantyMonths} months</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Staff Assignment */}
                <div className="space-y-3">
                  <Label>Assign Staff (Select at least 1)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getAvailableStaff().map((staff) => (
                      <Card 
                        key={staff.id} 
                        className={`cursor-pointer border-2 transition-colors ${
                          assignedStaff.some(s => s.id === staff.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                        onClick={() => {
                          if (assignedStaff.some(s => s.id === staff.id)) {
                            setAssignedStaff(assignedStaff.filter(s => s.id !== staff.id));
                          } else {
                            setAssignedStaff([...assignedStaff, staff]);
                          }
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <User className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{staff.name}</p>
                              <p className="text-xs text-muted-foreground">{staff.specialty}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  Workload: {staff.currentWorkload}
                                </Badge>
                                {staff.isAvailable && (
                                  <Badge variant="outline" className="text-xs text-green-600">
                                    Available
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Case Notes */}
                <div className="space-y-3">
                  <Label>Case Notes</Label>
                  <Textarea
                    placeholder="Enter initial observations or specific instructions..."
                    value={caseNotes}
                    onChange={(e) => setCaseNotes(e.target.value)}
                    className="min-h-20"
                  />
                </div>

                {/* Create Button */}
                <Button 
                  onClick={handleCreateCase}
                  className="w-full"
                  disabled={!selectedVehicle || !selectedComponent || assignedStaff.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Component Warranty Case
                </Button>
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
  );
};

export default TechnicianDashboard;