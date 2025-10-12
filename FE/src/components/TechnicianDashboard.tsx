import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  X,
  SearchIcon,
  Plus,
  Car,
  Trash2
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

interface WarrantyCase {
  id: string;
  vehicleVin: string;
  vehicleModel: string;
  customerName: string;
  customerPhone?: string;
  diagnosis: string;
  components: {
    id: string;
    name: string;
    quantity: number;
    status: 'pending' | 'approved' | 'rejected' | 'shipped';
  }[];
  status: 'submitted' | 'approved' | 'rejected' | 'in-progress' | 'completed';
  createdDate: string;
  updatedDate?: string;
  technicianNotes?: string;
  manufacturerResponse?: string;
}

interface CaseLine {
  id: string;
  caseId: string;
  damageLevel: string;
  repairPossibility: string;
  warrantyDecision: string;
  technicianNotes: string;
  photos: string[];
  photoFiles?: File[]; // Store actual File objects for blob URLs
  createdDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
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
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [componentSearch, setComponentSearch] = useState("");
  const [componentCategoryFilter, setComponentCategoryFilter] = useState<string>("all");
  const [createCaseLineModalOpen, setCreateCaseLineModalOpen] = useState(false);
  const [viewCaseModalOpen, setViewCaseModalOpen] = useState(false);
  const [viewCaseLineModalOpen, setViewCaseLineModalOpen] = useState(false);
  const [selectedCaseLine, setSelectedCaseLine] = useState<CaseLine | null>(null);
  const [imagePreviewModalOpen, setImagePreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [confirmRemoveModalOpen, setConfirmRemoveModalOpen] = useState(false);
  const [caseLineToRemove, setCaseLineToRemove] = useState<string | null>(null);

  const [reportPreviewModalOpen, setReportPreviewModalOpen] = useState(false);
  const [updateDetailsModalOpen, setUpdateDetailsModalOpen] = useState(false);
  const [selectedWarrantyCase, setSelectedWarrantyCase] = useState<WarrantyCase | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [caseLines, setCaseLines] = useState<CaseLine[]>([]);
  const [caseLineForm, setCaseLineForm] = useState({
    damageLevel: '',
    repairPossibility: '',
    warrantyDecision: '',
    affectedComponent: '',
    technicianNotes: ''
  });

  // Component search state (for Affected Components field)
  const [componentQuery, setComponentQuery] = useState<string>("");

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid File Type",
        description: "Please select only image files (JPG, PNG, etc.)",
        variant: "destructive"
      });
    }
    
    // Convert files to base64 data URLs for better persistence
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUploadedFiles(prev => [...prev, file]);
        setUploadedFileUrls(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedFileUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Form state for update details
  const [updateForm, setUpdateForm] = useState({
    vehicleVin: "",
    vehicleModel: "",
    customerName: "",
    customerPhone: "",
    status: "",
    diagnosis: "",
    additionalNotes: ""
  });

  const { user, logout } = useAuth();

  // Warranty cases state with mock data
  const [warrantyDiagnosisCases, setWarrantyDiagnosisCases] = useState<WarrantyCase[]>([
    {
      id: "case-001",
      vehicleVin: "VF8ABC123456789",
      vehicleModel: "VF8 Plus",
      customerName: "Nguyễn Văn Hùng",
      customerPhone: "0901234567",
      diagnosis: "Battery performance degradation, showing reduced capacity and charging efficiency after 18 months of use",
      components: [
        {
          id: "comp-001",
          name: "Lithium-ion Battery VF8",
          quantity: 1,
          status: "approved"
        }
      ],
      status: "submitted",
      createdDate: "2025-10-01",
      technicianNotes: "Battery diagnostic shows 65% capacity retention, below warranty threshold"
    },
    {
      id: "case-002",
      vehicleVin: "VF9DEF987654321",
      vehicleModel: "VF9 Premium",
      customerName: "Trần Quốc Bảo",
      customerPhone: "0912345678",
      diagnosis: "Front motor making unusual noise during acceleration, vibration detected in drivetrain system",
      components: [
        {
          id: "comp-002",
          name: "Front Electric Motor",
          quantity: 1,
          status: "approved"
        },
        {
          id: "comp-004",
          name: "Front Brake Assembly",
          quantity: 2,
          status: "approved"
        }
      ],
      status: "approved",
      createdDate: "2025-09-28",
      updatedDate: "2025-10-05",
      technicianNotes: "Motor bearing replacement required, brake pads worn beyond specification",
      manufacturerResponse: "Approved for warranty replacement under powertrain coverage"
    }
  ]);

  // Handle search functionality
  const handleSearch = () => {
    // Apply the search term for filtering
    setAppliedSearchTerm(searchTerm);
    
    if (searchTerm.trim()) {
      // Calculate results based on the search term that will be applied
      const tempResults = warrantyDiagnosisCases.filter(warrantyCase => {
        const matches = warrantyCase.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       warrantyCase.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       warrantyCase.vehicleVin.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       warrantyCase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       warrantyCase.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
        return matches;
      });
      
      toast({ 
        title: "Search Completed", 
        description: `Found ${tempResults.length} warranty case${tempResults.length !== 1 ? 's' : ''} matching "${searchTerm}"` 
      });
    } else {
      toast({ 
        title: "Search Cleared", 
        description: `Showing all ${warrantyDiagnosisCases.length} warranty cases` 
      });
    }
  };

  // Update warranty case function
  const updateWarrantyCase = (updatedCase: WarrantyCase) => {
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const caseWithUpdatedDate = {
      ...updatedCase,
      updatedDate: currentDate
    };
    
    setWarrantyDiagnosisCases(prevCases => 
      prevCases.map(warrantyCase => 
        warrantyCase.id === updatedCase.id ? caseWithUpdatedDate : warrantyCase
      )
    );
    
    // Also update the selected case for immediate UI update
    setSelectedWarrantyCase(caseWithUpdatedDate);
  };

  // Initialize form when opening update modal
  const openUpdateModal = (warrantyCase: WarrantyCase) => {
    setSelectedWarrantyCase(warrantyCase);
    setUpdateForm({
      vehicleVin: warrantyCase.vehicleVin,
      vehicleModel: warrantyCase.vehicleModel,
      customerName: warrantyCase.customerName,
      customerPhone: warrantyCase.customerPhone || "",
      status: warrantyCase.status,
      diagnosis: warrantyCase.diagnosis,
      additionalNotes: ""
    });
    setUpdateDetailsModalOpen(true);
  };

  // Handle view case line
  const handleViewCaseLine = (caseLine: CaseLine) => {
    setSelectedCaseLine(caseLine);
    setViewCaseLineModalOpen(true);
  };

  // Handle remove case line
  const handleRemoveCaseLine = (caseLineId: string) => {
    setCaseLineToRemove(caseLineId);
    setConfirmRemoveModalOpen(true);
  };

  // Confirm remove case line
  const confirmRemoveCaseLine = () => {
    if (caseLineToRemove) {
      setCaseLines(prev => prev.filter(caseLine => caseLine.id !== caseLineToRemove));
      toast({
        title: "Issue Diagnosis Removed",
        description: "Issue diagnosis has been removed successfully",
      });
    }
    setConfirmRemoveModalOpen(false);
    setCaseLineToRemove(null);
  };

  // Mock data - replace with API calls in production
  const availableComponents: Component[] = [
    {
      id: "comp-001",
      name: "Battery Lithium-ion VF8",
      partNumber: "BAT-VF8-2024",
      category: "battery",
      inStockServiceCenter: 5,
      inStockManufacturer: 15,
      warrantyMonths: 96,
      requiresVehicleCheck: false,
      description: "Main battery for VF8, separate 8-year warranty"
    },
    {
      id: "comp-002",
      name: "Front Electric Motor",
      partNumber: "MOT-VF8-FRT",
      category: "motor",
      inStockServiceCenter: 2,
      inStockManufacturer: 8,
      warrantyKm: 100000,
      warrantyMonths: 60,
      requiresVehicleCheck: true,
      description: "Front wheel electric motor, requires km and time verification"
    },
    {
      id: "comp-003",
      name: "Exterior Paint",
      partNumber: "PAINT-001",
      category: "paint",
      inStockServiceCenter: 0,
      inStockManufacturer: 20,
      warrantyMonths: 24,
      requiresVehicleCheck: false,
      description: "Exterior paint, separate 2-year warranty"
    },
    {
      id: "comp-004",
      name: "Front Brake Assembly",
      partNumber: "BRK-FRT-001",
      category: "general",
      inStockServiceCenter: 8,
      inStockManufacturer: 25,
      warrantyKm: 50000,
      warrantyMonths: 36,
      requiresVehicleCheck: true,
      description: "Front brake assembly, requires km and vehicle time verification"
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
      name: "John Anderson",
      specialty: "Battery Systems",
      currentWorkload: 2,
      isAvailable: true
    },
    {
      id: "staff-002",
      name: "Michael Brown",
      specialty: "Motor & Drivetrain",
      currentWorkload: 3,
      isAvailable: true
    },
    {
      id: "staff-003",
      name: "Linda Wilson",
      specialty: "Body & Paint",
      currentWorkload: 1,
      isAvailable: true
    },
    {
      id: "staff-004",
      name: "David Miller",
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
      customer: "Robert Johnson",
      component: availableComponents[0],
      assignedStaff: [staffMembers[0]],
      status: "in-progress",
      priority: "high",
      createdDate: "2025-09-28",
      dueDate: "2025-10-05",
      progress: 60,
      warrantyValid: true,
      notes: "Battery capacity degradation"
    },
    {
      id: "task-002",
      vehicleVin: "VF9DEF987654321",
      vehicleModel: "VF9 Premium",
      customer: "William Davis",
      component: availableComponents[1],
      assignedStaff: [staffMembers[1]],
      status: "pending",
      priority: "medium",
      createdDate: "2025-09-30",
      dueDate: "2025-10-07",
      progress: 0,
      warrantyValid: true,
      notes: "Motor making abnormal noise"
    }
  ];

  const filteredComponents = availableComponents.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(componentSearch.toLowerCase()) ||
                         comp.partNumber.toLowerCase().includes(componentSearch.toLowerCase());
    
    const matchesCategory = componentCategoryFilter === "all" || comp.category === componentCategoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Filter warranty cases based on applied search term
  const filteredWarrantyCases = warrantyDiagnosisCases.filter(warrantyCase => {
    const matchesSearch = appliedSearchTerm === "" || 
                         warrantyCase.customerName.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
                         warrantyCase.vehicleModel.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
                         warrantyCase.vehicleVin.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
                         warrantyCase.id.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
                         warrantyCase.diagnosis.toLowerCase().includes(appliedSearchTerm.toLowerCase());
    
    return matchesSearch;
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
                  Welcome,Technician
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="warranty-reports">Warranty Reports</TabsTrigger>
            <TabsTrigger value="case-lines">Issue Diagnosis</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="staff">Staff Management</TabsTrigger>
          </TabsList>

          {/* Warranty Reports Tab */}
          <TabsContent value="warranty-reports" className="space-y-6">
            {/* Search and Filter */}
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search VIN or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch}>
                  <SearchIcon className="h-4 w-4 mr-1" />
                  Search
                </Button>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setAppliedSearchTerm("");
                  toast({ 
                    title: "Search Cleared", 
                    description: `Showing all ${warrantyDiagnosisCases.length} warranty cases` 
                  });
                }}>
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

            {/* My Warranty Cases */}
            <Card>
              <CardHeader>
                <CardTitle>My Warranty Cases</CardTitle>
                <CardDescription>
                  View and manage your created warranty cases and issue diagnoses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Case ID</TableHead>
                      <TableHead>Vehicle & Customer</TableHead>
                      <TableHead>Diagnosis</TableHead>
                      <TableHead>Components</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWarrantyCases.map((warrantyCase) => (
                      <TableRow key={warrantyCase.id}>
                        <TableCell className="font-mono text-sm">
                          {warrantyCase.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{warrantyCase.customerName}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {warrantyCase.vehicleVin}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {warrantyCase.vehicleModel}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-sm">
                          <p className="text-sm whitespace-normal break-words">
                            {warrantyCase.diagnosis}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {warrantyCase.components.map((component, index) => (
                              <div key={component.id} className="flex items-center gap-2">
                                <span className="text-sm">{component.name}</span>
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  ×{component.quantity}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              warrantyCase.status === 'submitted' ? 'outline' :
                              warrantyCase.status === 'approved' ? 'default' :
                              warrantyCase.status === 'rejected' ? 'destructive' :
                              warrantyCase.status === 'in-progress' ? 'secondary' :
                              'default'
                            }
                            className={
                              warrantyCase.status === 'approved' ? 'bg-blue-500 text-white' : ''
                            }
                          >
                            {warrantyCase.status === 'submitted' ? 'Submitted' :
                             warrantyCase.status === 'approved' ? 'Approved' :
                             warrantyCase.status === 'rejected' ? 'Rejected' :
                             warrantyCase.status === 'in-progress' ? 'In Progress' :
                             'Completed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {warrantyCase.createdDate}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedWarrantyCase(warrantyCase);
                                setViewCaseModalOpen(true);
                              }}
                              title="View Case"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedWarrantyCase(warrantyCase);
                                setReportPreviewModalOpen(true);
                              }}
                              title="View Report"
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => {
                                setSelectedWarrantyCase(warrantyCase);
                                setCreateCaseLineModalOpen(true);
                              }}
                              className="bg-green-600 hover:bg-green-700"
                              title="Create Issue Diagnosis"
                            >
                              <Plus className="h-3 w-3" />
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

          {/* Issue Diagnosis Tab */}
          <TabsContent value="case-lines" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Issue Diagnoses</CardTitle>
                <CardDescription>
                  View and manage issue diagnoses you've created for warranty cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                {caseLines.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No Issue Diagnoses Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Create issue diagnoses by clicking the green "+" button on warranty cases
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Diagnosis ID</TableHead>
                        <TableHead>Case ID</TableHead>
                        <TableHead>Damage Level</TableHead>
                        <TableHead>Repair Possibility</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead>Photos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {caseLines.map((caseLine) => (
                        <TableRow key={caseLine.id}>
                          <TableCell className="font-mono text-sm">
                            {caseLine.id}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {caseLine.caseId}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {caseLine.damageLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={caseLine.repairPossibility === 'repairable' ? 'default' : 'destructive'}>
                              {caseLine.repairPossibility}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              caseLine.warrantyDecision === 'approved' ? 'default' :
                              caseLine.warrantyDecision === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {caseLine.warrantyDecision}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Camera className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{caseLine.photos.length}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              caseLine.status === 'submitted' ? 'default' :
                              caseLine.status === 'approved' ? 'default' :
                              caseLine.status === 'rejected' ? 'destructive' :
                              'secondary'
                            }>
                              {caseLine.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {caseLine.createdDate}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button 
                                onClick={() => handleViewCaseLine(caseLine)}
                                variant="outline" 
                                size="sm"
                                title="View Details"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button 
                                onClick={() => handleRemoveCaseLine(caseLine.id)}
                                variant="outline" 
                                size="sm"
                                title="Remove Issue Diagnosis"
                                className="text-red-600 hover:text-red-700 hover:border-red-300"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              {caseLine.status === 'draft' && (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  title="Edit"
                                >
                                  <Settings className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                <Badge variant="outline" className="text-xs">Battery Lithium</Badge>
                <Badge variant="outline" className="text-xs">BAT-VF8-2024</Badge>
                <Badge variant="outline" className="text-xs">Motor</Badge>
                <Badge variant="outline" className="text-xs">Exterior Paint</Badge>
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

      {/* View Case Modal */}
      <Dialog open={viewCaseModalOpen} onOpenChange={setViewCaseModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">View Warranty Case Details</DialogTitle>
            <DialogDescription className="text-base">
              Detailed information for warranty case <span className="font-mono font-medium">{selectedWarrantyCase?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Vehicle & Customer Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Vehicle Information */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Car className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-blue-900">Vehicle Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-blue-700">VIN Number</span>
                    <span className="text-lg font-mono bg-white px-3 py-2 rounded border">{selectedWarrantyCase?.vehicleVin}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-blue-700">Model</span>
                    <span className="text-lg bg-white px-3 py-2 rounded border">{selectedWarrantyCase?.vehicleModel}</span>
                  </div>
                </div>
              </div>
              
              {/* Customer Information */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-green-900">Customer Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-green-700">Full Name</span>
                    <span className="text-lg bg-white px-3 py-2 rounded border">{selectedWarrantyCase?.customerName}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-green-700">Phone Number</span>
                    <span className="text-lg bg-white px-3 py-2 rounded border">{selectedWarrantyCase?.customerPhone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Case Status & Timeline */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-gray-900">Case Information</h4>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">Case ID</div>
                  <div className="text-lg font-mono font-semibold text-gray-900">{selectedWarrantyCase?.id}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">Status</div>
                  <Badge 
                    variant={
                      selectedWarrantyCase?.status === 'approved' ? 'default' :
                      selectedWarrantyCase?.status === 'rejected' ? 'destructive' :
                      selectedWarrantyCase?.status === 'in-progress' ? 'secondary' :
                      'outline'
                    }
                    className="text-sm px-3 py-1"
                  >
                    {selectedWarrantyCase?.status}
                  </Badge>
                </div>
                <div className="bg-white p-4 rounded-lg border text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">Created Date</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedWarrantyCase?.createdDate}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border text-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">Last Updated</div>
                  <div className="text-lg font-semibold text-gray-900">{selectedWarrantyCase?.updatedDate || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-yellow-900">Diagnosis Report</h4>
              </div>
              <div className="bg-white p-4 rounded-lg border border-yellow-300">
                <p className="text-base leading-relaxed text-gray-800">{selectedWarrantyCase?.diagnosis}</p>
              </div>
            </div>

            {/* Components */}
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-purple-900">Affected Components</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {selectedWarrantyCase?.components.map((component, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-purple-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold">#{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{component.name}</div>
                        <div className="text-sm text-gray-600">Quantity: <span className="font-medium">{component.quantity}</span></div>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        component.status === 'approved' ? 'default' :
                        component.status === 'rejected' ? 'destructive' :
                        component.status === 'shipped' ? 'secondary' :
                        'outline'
                      }
                      className="text-sm px-3 py-1"
                    >
                      {component.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t mt-8">
            <Button 
              variant="default" 
              onClick={() => {
                setViewCaseModalOpen(false);
                if (selectedWarrantyCase) {
                  openUpdateModal(selectedWarrantyCase);
                }
              }}
              className="px-6"
            >
              <Settings className="h-4 w-4 mr-2" />
              Update Details
            </Button>
            <Button variant="outline" onClick={() => setViewCaseModalOpen(false)} className="px-6">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Preview Modal */}
      <Dialog open={reportPreviewModalOpen} onOpenChange={setReportPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">Warranty Report Preview</DialogTitle>
            <DialogDescription className="text-base">
              Generated warranty report for case <span className="font-mono font-medium">{selectedWarrantyCase?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Report Type */}
            <div className="space-y-4">
              <h4 className="font-medium text-base">📋 Report Type</h4>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Comprehensive Warranty Report" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">� Standard Report</SelectItem>
                  <SelectItem value="detailed">� Detailed Report</SelectItem>
                  <SelectItem value="summary">� Summary Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Report Options */}
            <div className="space-y-4">
              <h4 className="font-medium text-base">⚙️ Report Options</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="include-photos" className="rounded" defaultChecked />
                  <Label htmlFor="include-photos" className="text-sm">📷 Include Photos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="include-diagnosis" className="rounded" defaultChecked />
                  <Label htmlFor="include-diagnosis" className="text-sm">🔍 Include Diagnosis</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="manufacturer-format" className="rounded" />
                  <Label htmlFor="manufacturer-format" className="text-sm">🏭 Use Official Format</Label>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="space-y-4">
              <h4 className="font-medium text-base">📝 Additional Notes</h4>
              <Textarea 
                placeholder="Add any additional notes or comments for the report..."
                className="min-h-20"
              />
            </div>

            {/* Case Summary */}
            <div className="space-y-4">
              <h4 className="font-medium text-base">📊 Case Summary</h4>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Case ID:</span>
                  <span className="font-mono">{selectedWarrantyCase?.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Vehicle:</span>
                  <span>{selectedWarrantyCase?.vehicleModel}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Customer:</span>
                  <span>{selectedWarrantyCase?.customerName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Components:</span>
                  <span>{selectedWarrantyCase?.components.length} items</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setReportPreviewModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Preview Modal */}
      <Dialog open={reportPreviewModalOpen} onOpenChange={setReportPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">Warranty Report Preview</DialogTitle>
            <DialogDescription className="text-base">
              Generated warranty report for case <span className="font-mono font-medium">{selectedWarrantyCase?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 bg-white p-6 border rounded-lg">
            {/* Report Header */}
            <div className="text-center border-b pb-6 mb-6">
              <h1 className="text-3xl font-bold text-blue-900 mb-2">Warranty Report</h1>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <FileText className="h-4 w-4" />
                <span>Generated on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Case Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-blue-900">Case Information</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="font-medium text-blue-700">Case ID:</span>
                    <span className="font-mono font-semibold text-blue-900">{selectedWarrantyCase?.id}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="font-medium text-blue-700">Status:</span>
                    <span className="capitalize font-semibold text-blue-900">{selectedWarrantyCase?.status}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-blue-200">
                    <span className="font-medium text-blue-700">Created Date:</span>
                    <span className="font-semibold text-blue-900">{selectedWarrantyCase?.createdDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-blue-700">Last Updated:</span>
                    <span className="font-semibold text-blue-900">{selectedWarrantyCase?.updatedDate || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Vehicle Information */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Car className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-base text-green-900">Vehicle Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-green-200">
                      <span className="font-medium text-green-700 text-sm">VIN:</span>
                      <span className="font-mono font-semibold text-green-900 text-sm">{selectedWarrantyCase?.vehicleVin}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-green-200">
                      <span className="font-medium text-green-700 text-sm">Model:</span>
                      <span className="font-semibold text-green-900 text-sm">{selectedWarrantyCase?.vehicleModel}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-green-200">
                      <span className="font-medium text-green-700 text-sm">Year:</span>
                      <span className="font-semibold text-green-900 text-sm">2023</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-green-200">
                      <span className="font-medium text-green-700 text-sm">Mileage:</span>
                      <span className="font-semibold text-green-900 text-sm">18,500 km</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-green-700 text-sm">Purchase Date:</span>
                      <span className="font-semibold text-green-900 text-sm">2023-01-15</span>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-bold text-base text-purple-900">Customer Information</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-purple-200">
                      <span className="font-medium text-purple-700 text-sm">Customer:</span>
                      <span className="font-semibold text-purple-900 text-sm">{selectedWarrantyCase?.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-purple-200">
                      <span className="font-medium text-purple-700 text-sm">Phone:</span>
                      <span className="font-semibold text-purple-900 text-sm">{selectedWarrantyCase?.customerPhone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-purple-200">
                      <span className="font-medium text-purple-700 text-sm">Email:</span>
                      <span className="font-semibold text-purple-900 text-sm">customer@email.com</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="font-medium text-purple-700 text-sm">Address:</span>
                      <span className="font-semibold text-purple-900 text-sm">123 Main St, District 1, HCMC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Center Information */}
            <div className="bg-cyan-50 p-6 rounded-lg border border-cyan-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center">
                  <Wrench className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-cyan-900">Service Center Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-cyan-200">
                    <span className="font-medium text-cyan-700">Service Center:</span>
                    <span className="font-semibold text-cyan-900">VinFast Service HCMC</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-cyan-200">
                    <span className="font-medium text-cyan-700">Technician:</span>
                    <span className="font-semibold text-cyan-900">Nguyễn Văn Bảo</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-cyan-700">Contact:</span>
                    <span className="font-semibold text-cyan-900">+84 28 1234 5678</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-cyan-200">
                    <span className="font-medium text-cyan-700">Inspection Date:</span>
                    <span className="font-semibold text-cyan-900">{selectedWarrantyCase?.createdDate}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-cyan-200">
                    <span className="font-medium text-cyan-700">Priority Level:</span>
                    <span className="font-semibold text-cyan-900">High</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium text-cyan-700">Estimated Repair Time:</span>
                    <span className="font-semibold text-cyan-900">3-5 business days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warranty Status */}
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                  <Palette className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-indigo-900">Warranty Status</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">VALID</div>
                    <div className="text-sm text-gray-600">Warranty Status</div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">24 months</div>
                    <div className="text-sm text-gray-600">Remaining Period</div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-indigo-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">Battery</div>
                    <div className="text-sm text-gray-600">Warranty Type</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-orange-900">Diagnosis Report</h3>
              </div>
              <div className="bg-white p-4 rounded-lg border border-orange-200 shadow-sm">
                <p className="text-sm leading-relaxed text-gray-800">{selectedWarrantyCase?.diagnosis}</p>
              </div>
            </div>

            {/* Affected Components */}
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-purple-900">Affected Components</h3>
              </div>
              <div className="space-y-3">
                {selectedWarrantyCase?.components.map((component, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-700 font-bold text-sm">#{index + 1}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900">{component.name}</span>
                          <span className="text-sm text-gray-600 ml-3">Qty: <span className="font-medium">{component.quantity}</span></span>
                          <div className="text-xs text-gray-500 mt-1">
                            Part Number: VF8-BAT-001 | Serial: BAT123456789
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          component.status === 'approved' ? 'bg-green-100 text-green-800' :
                          component.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          component.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {component.status.toUpperCase()}
                        </span>
                        <div className="text-sm font-semibold text-gray-700 mt-1">
                          Cost: $1,250.00
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">$</span>
                </div>
                <h3 className="font-bold text-lg text-yellow-900">Cost Analysis</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="font-medium text-yellow-700">Parts Cost:</span>
                    <span className="font-semibold text-yellow-900">$1,250.00</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="font-medium text-yellow-700">Labor Cost:</span>
                    <span className="font-semibold text-yellow-900">$150.00</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-yellow-200">
                    <span className="font-medium text-yellow-700">Diagnostic Fee:</span>
                    <span className="font-semibold text-yellow-900">$50.00</span>
                  </div>
                  <div className="flex justify-between items-center py-2 font-bold text-lg">
                    <span className="text-yellow-700">Total Cost:</span>
                    <span className="text-yellow-900">$1,450.00</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-yellow-900 mb-3">Coverage Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Warranty Coverage:</span>
                      <span className="text-green-600 font-semibold">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Customer Payment:</span>
                      <span className="text-red-600 font-semibold">$0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-700">Manufacturer Coverage:</span>
                      <span className="text-blue-600 font-semibold">$1,450.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">📅</span>
                </div>
                <h3 className="font-bold text-lg text-gray-900">Case Timeline</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 bg-blue-500 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Case Created</span>
                      <span className="text-sm text-gray-600">{selectedWarrantyCase?.createdDate}</span>
                    </div>
                    <p className="text-sm text-gray-600">Initial warranty claim submitted by service center</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Under Review</span>
                      <span className="text-sm text-gray-600">{selectedWarrantyCase?.createdDate}</span>
                    </div>
                    <p className="text-sm text-gray-600">Technical assessment and documentation review in progress</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 bg-green-500 rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Approved & Parts Ordered</span>
                      <span className="text-sm text-gray-600">Expected: {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</span>
                    </div>
                    <p className="text-sm text-gray-600">Warranty claim approved, replacement parts have been ordered</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Notes */}
            {selectedWarrantyCase?.technicianNotes && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Technician Notes</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm leading-relaxed">{selectedWarrantyCase.technicianNotes}</p>
                </div>
              </div>
            )}

            {/* Manufacturer Response */}
            {selectedWarrantyCase?.manufacturerResponse && (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg border-b pb-2">Manufacturer Response</h3>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm leading-relaxed text-green-800">{selectedWarrantyCase.manufacturerResponse}</p>
                </div>
              </div>
            )}

          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setReportPreviewModalOpen(false)} className="px-6">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Update Details Modal */}
      <Dialog open={updateDetailsModalOpen} onOpenChange={setUpdateDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">Update Warranty Case Details</DialogTitle>
            <DialogDescription className="text-base">
              Edit information for warranty case <span className="font-mono font-medium">{selectedWarrantyCase?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8">
            {/* Vehicle & Customer Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Vehicle Information */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Car className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-blue-900">Vehicle Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-sm font-medium text-blue-700">VIN Number</Label>
                    <Input 
                      value={updateForm.vehicleVin}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, vehicleVin: e.target.value }))}
                      className="font-mono"
                      placeholder="Enter VIN number..."
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Label className="text-sm font-medium text-blue-700">Model</Label>
                    <Select value={updateForm.vehicleModel} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, vehicleModel: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select vehicle model..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VF8 Plus">VF8 Plus</SelectItem>
                        <SelectItem value="VF9 Premium">VF9 Premium</SelectItem>
                        <SelectItem value="VF6 Standard">VF6 Standard</SelectItem>
                        <SelectItem value="VF7 Eco">VF7 Eco</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Customer Information */}
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-green-900">Customer Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <Label className="text-sm font-medium text-green-700">Full Name</Label>
                    <Input 
                      value={updateForm.customerName}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="Enter customer name..."
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <Label className="text-sm font-medium text-green-700">Phone Number</Label>
                    <Input 
                      value={updateForm.customerPhone}
                      onChange={(e) => setUpdateForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="Enter phone number..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Case Status & Priority */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-gray-900">Case Management</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Case Status</Label>
                  <Select value={updateForm.status} onValueChange={(value) => setUpdateForm(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col space-y-1">
                  <Label className="text-sm font-medium text-gray-700">Priority Level</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">🟢 Low Priority</SelectItem>
                      <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                      <SelectItem value="high">🔴 High Priority</SelectItem>
                      <SelectItem value="urgent">🚨 Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Diagnosis Update */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-yellow-900">Diagnosis Update</h4>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col space-y-1">
                  <Label className="text-sm font-medium text-yellow-700">Current Diagnosis</Label>
                  <Textarea 
                    value={updateForm.diagnosis}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                    placeholder="Update diagnosis information..."
                    className="min-h-24"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <Label className="text-sm font-medium text-yellow-700">Additional Notes</Label>
                  <Textarea 
                    value={updateForm.additionalNotes}
                    onChange={(e) => setUpdateForm(prev => ({ ...prev, additionalNotes: e.target.value }))}
                    placeholder="Add any additional findings or updates..."
                    className="min-h-20"
                  />
                </div>
              </div>
            </div>

            {/* Components Update */}
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-purple-900">Component Status Update</h4>
              </div>
              <div className="space-y-3">
                {selectedWarrantyCase?.components.map((component, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-purple-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div>
                        <div className="font-semibold text-gray-900">{component.name}</div>
                        <div className="text-sm text-gray-600">Quantity: {component.quantity}</div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Label className="text-xs font-medium text-purple-700">Component Status</Label>
                        <Select defaultValue={component.status}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Label className="text-xs font-medium text-purple-700">Update Quantity</Label>
                        <Input 
                          type="number" 
                          defaultValue={component.quantity}
                          className="h-8"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t mt-8">
            <Button 
              variant="default" 
              onClick={() => {
                if (selectedWarrantyCase) {
                  const updatedCase: WarrantyCase = {
                    ...selectedWarrantyCase,
                    vehicleVin: updateForm.vehicleVin,
                    vehicleModel: updateForm.vehicleModel,
                    customerName: updateForm.customerName,
                    customerPhone: updateForm.customerPhone,
                    status: updateForm.status as 'submitted' | 'approved' | 'rejected' | 'in-progress' | 'completed',
                    diagnosis: updateForm.diagnosis
                  };
                  updateWarrantyCase(updatedCase);
                  toast({ 
                    title: "Details Updated", 
                    description: `Warranty case ${selectedWarrantyCase.id} has been updated successfully` 
                  });
                  setUpdateDetailsModalOpen(false);
                }
              }}
              className="px-6"
            >
              <Settings className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setUpdateDetailsModalOpen(false)} className="px-6">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Case Line Modal */}
      <Dialog open={createCaseLineModalOpen} onOpenChange={setCreateCaseLineModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Issue Diagnosis</DialogTitle>
            <DialogDescription>
              Create a new issue diagnosis for warranty case {selectedWarrantyCase?.id}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Vehicle & Customer Information and Diagnosis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <h4 className="font-medium text-base">🚗 Vehicle & Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>Vehicle VIN</Label>
                    <Input 
                      placeholder="Enter vehicle VIN..." 
                      defaultValue={selectedWarrantyCase?.vehicleVin}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input 
                      placeholder="Enter customer name..." 
                      defaultValue={selectedWarrantyCase?.customerName}
                    />
                  </div>
                </div>
                <div className="space-y-2 -mt-2">
                  <Label>Customer Phone</Label>
                  <Input 
                    placeholder="Enter phone number..." 
                    defaultValue={selectedWarrantyCase?.customerPhone}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium text-base">🔍 Diagnosis</h4>
                <div className="space-y-2 mb-4">
                  <Label>Affected Components</Label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      placeholder="Search components..."
                      value={componentQuery}
                      onChange={(e) => setComponentQuery(e.target.value)}
                    />
                    {/* results dropdown */}
                    {componentQuery.trim().length > 0 && (
                      <div className="absolute z-30 bg-white border rounded mt-1 w-full max-h-40 overflow-auto shadow">
                        {availableComponents
                          .filter(c => c.name.toLowerCase().includes(componentQuery.toLowerCase()))
                          .map((c) => (
                            <div
                              key={c.id}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                              onClick={() => {
                                setCaseLineForm(prev => ({ ...prev, affectedComponent: c.name }));
                                setComponentQuery('');
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{c.name}</span>
                                <span className="text-xs text-gray-400">{c.partNumber}</span>
                              </div>
                              <div className="text-xs text-gray-500">{c.category}</div>
                            </div>
                          ))}
                        {availableComponents.filter(c => c.name.toLowerCase().includes(componentQuery.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-500">No components found</div>
                        )}
                      </div>
                    )}

                    {/* show selected */}
                    {caseLineForm.affectedComponent && (
                      <div className="mt-2 text-sm text-green-700">Selected: <span className="font-medium">{caseLineForm.affectedComponent}</span></div>
                    )}

                    {/* show count of matches when typing */}
                    {componentQuery.trim().length > 0 && (
                      <div className="mt-1 text-xs text-gray-500">Matches: {availableComponents.filter(c => c.name.toLowerCase().includes(componentQuery.toLowerCase())).length}</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Issue Description</Label>
                  <Textarea 
                    placeholder="Describe the warranty issue in detail..."
                    className="min-h-20"
                  />
                </div>
              </div>
            </div>

            {/* Component Assessment */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-base mb-4">🔧 Component Assessment</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Damage Level</Label>
                  <Select value={caseLineForm.damageLevel} onValueChange={(value) => setCaseLineForm(prev => ({ ...prev, damageLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">🟡 Light - Can be repaired</SelectItem>
                      <SelectItem value="severe">🔴 Severe - Must replace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Repair Possibility</Label>
                  <Select value={caseLineForm.repairPossibility} onValueChange={(value) => setCaseLineForm(prev => ({ ...prev, repairPossibility: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Can repair?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="repairable">✅ Yes - Repairable</SelectItem>
                      <SelectItem value="replace-only">❌ No - Replace only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Warranty Decision</Label>
                  <Select value={caseLineForm.warrantyDecision} onValueChange={(value) => setCaseLineForm(prev => ({ ...prev, warrantyDecision: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Decision..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">🛡️ Warranty Coverage</SelectItem>
                      <SelectItem value="customer-choice">🤔 Customer Choice</SelectItem>
                      <SelectItem value="repair-only">🔧 Repair Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Documentation */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-base mb-4">📷 Documentation</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Technician Notes</Label>
                  <Textarea 
                    value={caseLineForm.technicianNotes}
                    onChange={(e) => setCaseLineForm(prev => ({ ...prev, technicianNotes: e.target.value }))}
                    placeholder="Enter detailed diagnosis notes, measurements, test results..."
                    className="min-h-20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload Photos</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload photos of the issue, components, and diagnostic results
                    </p>
                    <input
                      type="file"
                      id="photo-upload"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Choose Photos
                    </Button>
                  </div>
                  
                  {/* Display uploaded files */}
                  {uploadedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm font-medium">Uploaded Photos ({uploadedFiles.length})</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <div className="bg-gray-100 rounded-lg p-2 border">
                              <div className="aspect-square mb-2 overflow-hidden rounded">
                                <img 
                                  src={uploadedFileUrls[index]} 
                                  alt={file.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Image load error:', e);
                                    // Fallback to recreate URL if it fails
                                    const newUrl = URL.createObjectURL(file);
                                    setUploadedFileUrls(prev => {
                                      const newUrls = [...prev];
                                      newUrls[index] = newUrl;
                                      return newUrls;
                                    });
                                  }}
                                />
                              </div>
                              <div className="text-xs">
                                <div className="font-medium truncate" title={file.name}>{file.name}</div>
                                <div className="text-gray-500 mt-1">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t pt-6">
              <div className="flex gap-4">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // Validate form
                    if (!caseLineForm.damageLevel || !caseLineForm.repairPossibility || !caseLineForm.warrantyDecision) {
                      toast({
                        title: "Missing Information",
                        description: "Please fill in all assessment fields",
                        variant: "destructive"
                      });
                      return;
                    }

                    // Create new case line
                    const newCaseLine: CaseLine = {
                      id: `CL-${Date.now()}`,
                      caseId: selectedWarrantyCase?.id || '',
                      damageLevel: caseLineForm.damageLevel,
                      repairPossibility: caseLineForm.repairPossibility,
                      warrantyDecision: caseLineForm.warrantyDecision,
                      technicianNotes: caseLineForm.technicianNotes,
                      photos: [...uploadedFileUrls], // Use the pre-created URLs
                      photoFiles: [...uploadedFiles], // Store actual File objects
                      createdDate: new Date().toLocaleDateString('en-GB'),
                      status: 'submitted'
                    };

                    // Add to case lines list
                    setCaseLines(prev => [...prev, newCaseLine]);

                    // Reset form and close modal
                    setCaseLineForm({
                      damageLevel: '',
                      repairPossibility: '',
                      warrantyDecision: '',
                      affectedComponent: '',
                      technicianNotes: ''
                    });
                    setUploadedFiles([]);
                    setUploadedFileUrls([]);
                    setCreateCaseLineModalOpen(false);

                    toast({ 
                      title: "Issue Diagnosis Created", 
                      description: `Issue diagnosis ${newCaseLine.id} has been created successfully with ${uploadedFiles.length} photos. View it in the Issue Diagnosis tab.`
                    });
                  }}
                >
                  Create Issue Diagnosis
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    toast({ 
                      title: "Draft Saved", 
                      description: "Issue diagnosis draft has been saved" 
                    });
                  }}
                >
                  Save Draft
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCreateCaseLineModalOpen(false);
                    setUploadedFiles([]);
                    setUploadedFileUrls([]);
                    setCaseLineForm({
                      damageLevel: '',
                      repairPossibility: '',
                      warrantyDecision: '',
                      affectedComponent: '',
                      technicianNotes: ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Issue Diagnosis Modal */}
      <Dialog open={viewCaseLineModalOpen} onOpenChange={setViewCaseLineModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">Issue Diagnosis Details</DialogTitle>
            <DialogDescription className="text-base">
              Detailed information for issue diagnosis <span className="font-mono font-medium">{selectedCaseLine?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Case Line Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-blue-900">Basic Information</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-blue-700">Diagnosis ID</span>
                    <span className="text-lg bg-white px-3 py-2 rounded border font-mono">{selectedCaseLine?.id}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-blue-700">Case ID</span>
                    <span className="text-lg bg-white px-3 py-2 rounded border font-mono">{selectedCaseLine?.caseId}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-blue-700">Created Date</span>
                    <span className="text-lg bg-white px-3 py-2 rounded border">{selectedCaseLine?.createdDate}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-blue-700">Status</span>
                    <div className="bg-white px-3 py-2 rounded border">
                      <Badge 
                        variant={
                          selectedCaseLine?.status === 'approved' ? 'default' :
                          selectedCaseLine?.status === 'rejected' ? 'destructive' :
                          selectedCaseLine?.status === 'submitted' ? 'secondary' :
                          'outline'
                        }
                        className="text-sm px-3 py-1"
                      >
                        {selectedCaseLine?.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessment Details */}
              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Wrench className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-yellow-900">Assessment Details</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-yellow-700">Damage Level</span>
                    <span className="text-lg bg-white px-3 py-2 rounded border">{selectedCaseLine?.damageLevel}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-yellow-700">Repair Possibility</span>
                    <span className="text-lg bg-white px-3 py-2 rounded border">{selectedCaseLine?.repairPossibility}</span>
                  </div>
                  <div className="flex flex-col space-y-1">
                    <span className="text-sm font-medium text-yellow-700">Warranty Decision</span>
                    <span className="text-lg bg-white px-3 py-2 rounded border">{selectedCaseLine?.warrantyDecision}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Notes */}
            {selectedCaseLine?.technicianNotes && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-gray-900">Technician Notes</h4>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-base leading-relaxed text-gray-800">{selectedCaseLine.technicianNotes}</p>
                </div>
              </div>
            )}

            {/* Photos */}
            {selectedCaseLine?.photos && selectedCaseLine.photos.length > 0 && (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-green-900">Attached Photos ({selectedCaseLine.photos.length})</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedCaseLine.photos.map((photo, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-green-300 hover:shadow-lg transition-shadow">
                      <div className="aspect-square mb-3 overflow-hidden rounded">
                        <img 
                          src={photo} 
                          alt={`Damage Photo ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            setPreviewImageUrl(photo);
                            setImagePreviewModalOpen(true);
                          }}
                          title="Click to view full size"
                          onError={(e) => {
                            console.error('Image load error for photo:', photo);
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NyA3NEw5MCA3N0wxMTMgMTAwTDE0MyA3MEwxNTcgODRWMTI2SDQzVjc0SDg3WiIgZmlsbD0iI0Q1REREOCIvPgo8Y2lyY2xlIGN4PSI3NSIgY3k9IjkxIiByPSI5IiBmaWxsPSIjRDVEREQ4Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgQmxpbmtNYWNTeXN0ZW1Gb250LCBTZWdvZSBVSSwgUm9ib3RvLCBPeHlnZW4sIFVidW50dSwgQ2FudGFyZWxsLCBGaXJhIFNhbnMsIERyb2lkIFNhbnMsIEhlbHZldGljYSBOZXVlLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOUI5QkE0Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K';
                            e.currentTarget.style.cursor = 'default';
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-center text-green-700 font-medium">Damage Photo {index + 1}</p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setPreviewImageUrl(photo);
                              setImagePreviewModalOpen(true);
                            }}
                            className="text-xs flex-1"
                          >
                            View Full Size
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(photo);
                              toast({
                                title: "URL Copied",
                                description: `Photo ${index + 1} URL copied to clipboard`,
                              });
                            }}
                            className="text-xs"
                          >
                            Copy URL
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setViewCaseLineModalOpen(false)} className="px-6">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={imagePreviewModalOpen} onOpenChange={setImagePreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Image Preview</DialogTitle>
            <DialogDescription className="text-base">
              Full size image preview
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-4">
            <img 
              src={previewImageUrl} 
              alt="Damage Photo Preview"
              className="max-w-full max-h-[60vh] object-contain rounded"
              onError={(e) => {
                console.error('Preview image load error:', previewImageUrl);
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzQgMTQ4TDE4MCA0MEwyMjYgMjAwTDI4NiAxNDBMMzE0IDE2OFYyNTJIODZWMTQ4SDE3NFoiIGZpbGw9IiNENURERC4iLz4KPGNpcmNsZSBjeD0iMTUwIiBjeT0iMTgyIiByPSIxOCIgZmlsbD0iI0Q1REREOCIvPgo8dGV4dCB4PSIyMDAiIHk9IjIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIEJsaW5rTWFjU3lzdGVtRm9udCwgU2Vnb2UgVUksIFJvYm90bywgT3h5Z2VuLCBVYnVudHUsIENhbnRhcmVsbCwgRmlyYSBTYW5zLCBEcm9pZCBTYW5zLCBIZWx2ZXRpY2EgTmV1ZSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzlCOUJBNCI+SW1hZ2Ugbm90IGF2YWlsYWJsZTwvdGV4dD4KPHN2Zz4K';
              }}
            />
          </div>
          
          <div className="flex justify-between items-center gap-3 pt-4 border-t">
            <div className="text-sm text-gray-600 font-mono break-all flex-1">
              {previewImageUrl}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(previewImageUrl);
                  toast({
                    title: "URL Copied",
                    description: "Image URL copied to clipboard",
                  });
                }}
              >
                Copy URL
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setImagePreviewModalOpen(false);
                  setPreviewImageUrl('');
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Case Line Modal */}
      <Dialog open={confirmRemoveModalOpen} onOpenChange={setConfirmRemoveModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold text-red-600">Remove Issue Diagnosis</DialogTitle>
            <DialogDescription className="text-base">
              Are you sure you want to remove this issue diagnosis? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-4">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <div>
                <p className="font-medium text-red-800">Diagnosis ID:</p>
                <p className="text-sm text-red-600 font-mono">{caseLineToRemove}</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setConfirmRemoveModalOpen(false);
                setCaseLineToRemove(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmRemoveCaseLine}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Issue Diagnosis
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianDashboard;