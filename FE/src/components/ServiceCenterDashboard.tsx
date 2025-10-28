import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/utils/permissions";
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
  Save,
  MapPin,
  DollarSign,
  Tag,
  Package,
  BoxIcon as Box,
  Edit,
  Trash
} from "lucide-react";

interface Technician {
  id: string;
  name: string;
  workload?: number; // maps to activeTaskCount
  isAvailable: boolean;
  status?: string; // AVAILABLE | UNAVAILABLE
}

interface ComponentInfo {
  typeComponentId: string;
  name: string;
  category: string;
}

interface CaseLine {
  id: string;
  diagnosisText: string;
  correctionText: string;
  warrantyStatus: string;
  status: string;
  rejectionReason: string | null;
  repairTechId: string | null;
  quantity: number;
  typeComponent?: ComponentInfo;
}

interface GuaranteeCase {
  guaranteeCaseId: string;
  contentGuarantee: string;
  status?: string;
  caseLines?: CaseLine[];
}

interface WarrantyClaim {
  recordId?: string; // Processing record ID from backend
  vin: string;
  mileage: number;
  checkInDate: string;
  guaranteeCases: GuaranteeCase[]; // Array of guarantee cases
  assignedTechnicians: Technician[];
  model: string;
  modelId?: string; // Vehicle model ID
  serviceCenter: string;
  createdByStaffId?: string; // Staff who created the record
  createdByStaffName?: string; // Staff name who created the record
  submissionDate: string;
  estimatedCost: number;
  status?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  issueType: string;
}

interface TypeComponent {
  type_component_id: string;
  name: string;
  price: number;
  sku: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// Helper functions moved outside component to prevent re-creation on every render
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

const formatMileage = (mileage: number) => {
  return `${mileage.toLocaleString('vi-VN')} km`;
};

const getPriorityBadgeVariant = (priority: 'Low' | 'Medium' | 'High' | 'Urgent' | undefined) => {
  switch (priority) {
    case 'Low':
      return 'outline';
    case 'Medium':
      return 'secondary';
    case 'High':
      return 'default';
    case 'Urgent':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusBadgeVariant = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'CHECKED_IN':
    case 'PENDING_DIAGNOSIS':
      return 'secondary';
    case 'IN_PROGRESS':
      return 'default';
    case 'COMPLETED':
    case 'DELIVERED':
      return 'success';
    case 'REJECTED':
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const STATUS_LABELS: Record<string, string> = {
  // Processing Record statuses
  CHECKED_IN: 'Checked In',
  IN_DIAGNOSIS: 'In Diagnosis',
  WAITING_FOR_PARTS: 'Waiting for Parts',
  IN_REPAIR: 'In Repair',
  COMPLETED: 'Completed',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',

  // Technician statuses
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Unavailable',

  // CaseLine statuses
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  CUSTOMER_APPROVED: 'Customer Approved',
  REJECTED_BY_OUT_OF_WARRANTY: 'Rejected (Out of Warranty)',
  REJECTED_BY_TECH: 'Rejected by Tech',
  REJECTED_BY_CUSTOMER: 'Rejected by Customer',
  READY_FOR_REPAIR: 'Ready for Repair',

  // Warranty statuses
  ELIGIBLE: 'Eligible',
  INELIGIBLE: 'Ineligible',

  // Component assignment statuses
  PENDING: 'Pending',
  RESERVED: 'Reserved',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',

  // Generic
  UNKNOWN: 'Unknown'
};

const getDisplayStatus = (status?: string) => {
  if (!status) return STATUS_LABELS.UNKNOWN;
  const key = String(status).trim().toUpperCase().replace(/\s+/g, '_');
  if (STATUS_LABELS[key]) return STATUS_LABELS[key];
  // Fallback: convert underscored or dashed words to Title Case
  return String(status)
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const getTechBadgeVariant = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'AVAILABLE':
      return 'success';
    case 'UNAVAILABLE':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getCaseLineStatusVariant = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    case 'CUSTOMER_APPROVED':
    case 'READY_FOR_REPAIR':
    case 'COMPLETED':
      return 'default';
    case 'PENDING_APPROVAL':
    case 'DRAFT':
      return 'secondary';
    case 'REJECTED_BY_OUT_OF_WARRANTY':
    case 'REJECTED_BY_TECH':
    case 'REJECTED_BY_CUSTOMER':
    case 'CANCELLED':
      return 'destructive';
    case 'IN_REPAIR':
      return 'default';
    case 'WAITING_FOR_PARTS':
      return 'secondary';
    default:
      return 'outline';
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "None";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  } catch {
    return "None";
  }
};

const displayValue = (value: string | null | undefined) => {
  return value || "---";
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

const ServiceCenterDashboard = () => {
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([]);
  const [availableTechnicians, setAvailableTechnicians] = useState<Technician[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState<boolean>(false);
  const [techFilterStatus, setTechFilterStatus] = useState<string>('AVAILABLE');
  // Status tabs
  const STATUSES = [
    'CHECKED_IN',
    'IN_DIAGNOSIS',
    'WAITING_FOR_PARTS',
    'IN_REPAIR',
    'COMPLETED',
    'PAID',
    'CANCELLED'
  ];
  const [claimsByStatus, setClaimsByStatus] = useState<Record<string, WarrantyClaim[]>>({});
  const [activeStatus, setActiveStatus] = useState<string>('CHECKED_IN');
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<string>('');
  const [showClaimDetailModal, setShowClaimDetailModal] = useState(false);
  const [selectedClaimForDetail, setSelectedClaimForDetail] = useState<WarrantyClaim | null>(null);

  // Track case lines with out of stock status
  const [outOfStockCaseLines, setOutOfStockCaseLines] = useState<Set<string>>(new Set());

  // Technician Records Modal States
  const [showTechnicianRecordsModal, setShowTechnicianRecordsModal] = useState(false);
  const [selectedTechnicianForRecords, setSelectedTechnicianForRecords] = useState<Technician | null>(null);
  const [technicianRecords, setTechnicianRecords] = useState<WarrantyClaim[]>([]);

  const { user, logout, getToken } = useAuth();

  // Fetch records for a specific status (moved outside useEffect to be reusable)
  const fetchForStatus = async (status: string) => {
    const url = `http://localhost:3000/api/v1/processing-records?status=${status}`;
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) return [] as WarrantyClaim[];
    try {
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const apiRecords = res.data?.data?.records?.records || [];
      const mapped: WarrantyClaim[] = apiRecords.map((r: any) => {
        const mainTech = r.mainTechnician ? [{ 
          id: r.mainTechnician.userId, 
          name: r.mainTechnician.name, 
          isAvailable: false, 
          workload: typeof r.mainTechnician.activeTaskCount === 'number' ? r.mainTechnician.activeTaskCount : undefined, 
          status: r.mainTechnician.workSchedule?.[0]?.status || r.mainTechnician.status 
        }] : [];
        const cases: GuaranteeCase[] = Array.isArray(r.guaranteeCases) ? r.guaranteeCases.map((gc: any) => ({
          guaranteeCaseId: gc.guaranteeCaseId || gc.id || '',
          contentGuarantee: gc.contentGuarantee || '',
          status: gc.status,
          caseLines: Array.isArray(gc.caseLines) ? gc.caseLines.map((cl: any) => ({
            id: cl.id || '',
            diagnosisText: cl.diagnosisText || '',
            correctionText: cl.correctionText || '',
            warrantyStatus: cl.warrantyStatus || '',
            status: cl.status || '',
            rejectionReason: cl.rejectionReason || null,
            repairTechId: cl.repairTechId || null,
            quantity: cl.quantity || 0,
            typeComponent: cl.typeComponent ? {
              typeComponentId: cl.typeComponent.typeComponentId || '',
              name: cl.typeComponent.name || '',
              category: cl.typeComponent.category || ''
            } : undefined
          })) : []
        })) : [];
        const primaryCase = cases.length > 0 ? cases[0] : null;
        return {
          recordId: r.vehicleProcessingRecordId || r.recordId || r.processing_record_id || r.id || '',
          vin: r.vin || r.vehicle?.vin || '',
          mileage: r.odometer || 0,
          checkInDate: r.checkInDate || r.check_in_date || new Date().toISOString(),
          guaranteeCases: cases,
          assignedTechnicians: mainTech,
          model: r.vehicle?.model?.name || r.model || '',
          modelId: r.vehicle?.model?.vehicleModelId || r.vehicle?.model?.id || undefined,
          serviceCenter: r.createdByStaff?.name || r.serviceCenter || '',
          createdByStaffId: r.createdByStaff?.userId || r.createdByStaff?.id || undefined,
          createdByStaffName: r.createdByStaff?.name || undefined,
          submissionDate: r.createdAt || new Date().toISOString(),
          estimatedCost: 0,
          priority: r.priority || undefined,
          issueType: primaryCase ? primaryCase.contentGuarantee : '',
          status: r.status || (primaryCase?.status) || status
        } as WarrantyClaim;
      });
      return mapped;
    } catch (err) {
      console.error(`Failed to fetch status ${status}`, err);
      return [] as WarrantyClaim[];
    }
  };

  // Fetch all statuses (moved outside useEffect to be reusable)
  const fetchAllStatuses = async () => {
    setIsLoadingClaims(true);
    const results = await Promise.all(STATUSES.map(s => fetchForStatus(s)));
    const byStatus: Record<string, WarrantyClaim[]> = {};
    STATUSES.forEach((s, idx) => { byStatus[s] = results[idx] || []; });
    setClaimsByStatus(byStatus);
    setWarrantyClaims(byStatus[activeStatus] || []);
    setIsLoadingClaims(false);
  };

  // Load warranty claims and technicians data
  useEffect(() => {
    let cancelled = false;

    // Fetch technicians from backend instead of using mock data
    const fetchTechnicians = async (status = 'AVAILABLE') => {
      setIsLoadingTechnicians(true);
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) {
        setIsLoadingTechnicians(false);
        return [] as Technician[];
      }
      try {
        const url = status ? `http://localhost:3000/api/v1/users/technicians?status=${status}` : `http://localhost:3000/api/v1/users/technicians`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const records = res.data?.data || [];
        const mapped: Technician[] = records.map((t: any) => {
          // Status is in workSchedule array, not at root level
          const rawStatus = t.workSchedule?.[0]?.status || t.status || '';
          const normalizedStatus = String(rawStatus).trim().toUpperCase().replace(/\s+/g, '_') || undefined;

          return {
            id: t.userId || t.id || String(t.techId || ''),
            name: t.name || t.fullName || '',
            workload: t.activeTaskCount,
            isAvailable: (normalizedStatus || '') === 'AVAILABLE',
            status: normalizedStatus
          } as Technician;
        });
        setIsLoadingTechnicians(false);
        return mapped;
      } catch (err) {
        console.error('Failed to fetch technicians', err);
        setIsLoadingTechnicians(false);
        return [] as Technician[];
      }
    };

    // Fetch all statuses on mount
    fetchAllStatuses();

    // Load technicians from API (AVAILABLE / UNAVAILABLE)
    refreshTechnicians('').then(() => { });

    return () => { cancelled = true; };
  }, []);

  const assignTechnicianToCase = async (vin: string, technicianId: string) => {
    const technician = availableTechnicians.find(t => t.id === technicianId);
    if (!technician) return;

    // Find the record ID from the current claims
    let claim: WarrantyClaim | undefined;
    for (const status of Object.keys(claimsByStatus)) {
      const found = claimsByStatus[status]?.find(c => c.vin === vin);
      if (found) {
        claim = found;
        break;
      }
    }

    if (!claim || !claim.recordId) {
      alert('Record ID not found');
      return;
    }

    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) {
        alert('Authentication required');
        return;
      }

      // Call backend API to assign technician
      const response = await axios.patch(
        `http://localhost:3000/api/v1/processing-records/${claim.recordId}/assignment`,
        { technicianId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.status === 'success') {
        alert(`Technician ${technician.name} assigned successfully!`);
        
        // Close modal
        setShowTechnicianModal(false);
        setSelectedCaseForAssignment('');

        // Refresh all data to ensure UI is up-to-date
        await fetchAllStatuses();

        // Refresh technicians list to update workload
        await refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
      }
    } catch (error: any) {
      console.error('Failed to assign technician:', error);
      if (error.response?.data?.message) {
        alert(`Failed to assign technician: ${error.response.data.message}`);
      } else {
        alert('Failed to assign technician. Please try again.');
      }
    }
  };

  const removeTechnicianFromCase = (vin: string, technicianId: string) => {
    setWarrantyClaims(prev => prev.map(claim =>
      claim.vin === vin
        ? {
          ...claim,
          assignedTechnicians: claim.assignedTechnicians.filter(t => t.id !== technicianId)
        }
        : claim
    ));
  };

  const getRecommendedTechnicians = (issueType: string) => {
    const specialtyMapping: { [key: string]: string[] } = {
      'Pin EV': ['Battery Systems'],
      'Động cơ': ['Motor & Drivetrain', 'Electronics & Software'],
      'Hệ thống điện': ['Electronics & Software', 'Charging Systems'],
      'Cảm biến': ['Electronics & Software', 'General Diagnostics'],
      'Phanh': ['General Diagnostics']
    };

    // Without specialty information, recommend by availability and workload (less loaded first)
    return availableTechnicians
      .filter(tech => tech.isAvailable)
      .sort((a, b) => {
        const aw = a.workload || 0;
        const bw = b.workload || 0;
        return aw - bw;
      });
  };

  const handleViewClaimDetail = (vin: string) => {
    console.log('handleViewClaimDetail called with VIN:', vin);
    const claim = warrantyClaims.find(c => c.vin === vin);
    console.log('Found claim:', claim);
    if (claim) {
      setSelectedClaimForDetail(claim);
      setShowClaimDetailModal(true);
      console.log('Modal should open now');
    }
  };

  const openTechnicianAssignmentModal = (vin: string) => {
    setSelectedCaseForAssignment(vin);
    setShowTechnicianModal(true);
  };

  const closeTechnicianModal = () => {
    setShowTechnicianModal(false);
    setSelectedCaseForAssignment('');
  };

  // View technician's assigned records
  const viewTechnicianRecords = (technician: Technician) => {
    // Filter all records to find ones assigned to this technician
    const allRecords: WarrantyClaim[] = [];
    Object.values(claimsByStatus).forEach(claims => {
      allRecords.push(...claims);
    });

    const techRecords = allRecords.filter(claim =>
      (claim.assignedTechnicians || []).some(tech => tech.id === technician.id)
    );

    setSelectedTechnicianForRecords(technician);
    setTechnicianRecords(techRecords);
    setShowTechnicianRecordsModal(true);
  };

  const closeTechnicianRecordsModal = () => {
    setShowTechnicianRecordsModal(false);
    setSelectedTechnicianForRecords(null);
    setTechnicianRecords([]);
  };

  // Allocate component for case line
  const handleAllocateComponent = async (guaranteeCaseId: string, caseLineId: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ev_warranty_token');
      const response = await axios.post(
        `http://localhost:3000/api/v1/guarantee-cases/${guaranteeCaseId}/case-lines/${caseLineId}/allocate-stock`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        alert('Component allocated successfully!');

        // Refresh all data to ensure UI is up-to-date
        await fetchAllStatuses();
      }
    } catch (error: any) {
      console.error('Error allocating component:', error);
      const errorMessage = error.response?.data?.message || 'Failed to allocate component. Please try again.';

      // Check if error is due to out of stock
      if (error.response?.status === 404 && errorMessage.includes('No available stock found')) {
        // Mark this case line as out of stock
        setOutOfStockCaseLines(prev => new Set([...prev, caseLineId]));
        alert('⚠️ Out of Stock! No available component in warehouse. Please request from manufacturer.');
      } else {
        alert(errorMessage);
      }
    }
  };

  // Refresh technicians (callable from UI)
  const refreshTechnicians = async (status = 'AVAILABLE') => {
    setIsLoadingTechnicians(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingTechnicians(false);
      return;
    }
    try {
      const url = status ? `http://localhost:3000/api/v1/users/technicians?status=${status}` : `http://localhost:3000/api/v1/users/technicians`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const records = res.data?.data || [];
      const mapped: Technician[] = records.map((t: any) => {
        // Status is in workSchedule array, not at root level
        const rawStatus = t.workSchedule?.[0]?.status || t.status || '';
        const normalizedStatus = String(rawStatus).trim().toUpperCase().replace(/\s+/g, '_') || undefined;

        return {
          id: t.userId || t.id || String(t.techId || ''),
          name: t.name || t.fullName || t.username || '',
          specialty: t.specialty || t.department || undefined,
          experience: t.experience || t.yearsOfExperience || undefined,
          rating: t.rating || undefined,
          workload: t.activeTaskCount || t.workload || t.currentLoad || undefined,
          isAvailable: (normalizedStatus || '') === 'AVAILABLE',
          status: normalizedStatus
        } as Technician;
      });
      setAvailableTechnicians(mapped);
    } catch (err) {
      console.error('Failed to refresh technicians', err);
    } finally {
      setIsLoadingTechnicians(false);
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
                  <h1 className="text-xl font-bold text-foreground">Service Center Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome,{user?.role === 'service_center_staff' ? 'Staff' : user?.role === 'service_center_manager' ? 'Manager' : 'Technician'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 ml-auto">
                <Button variant="outline" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-6">
          {/* Main Content */}
          <Tabs defaultValue="claims" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="claims">Warranty Claims</TabsTrigger>
              <TabsTrigger value="repairs">Technician Management</TabsTrigger>
            </TabsList>

            <TabsContent value="claims" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Warranty Claims Management
                  </CardTitle>
                  <CardDescription>
                    Manage warranty claims and track their progress across all service centers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Status Tabs */}
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    {STATUSES.map(s => (
                      <Button
                        key={s}
                        variant={s === activeStatus ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (s !== activeStatus) {
                            setActiveStatus(s);
                            setWarrantyClaims(claimsByStatus[s] || []);
                          }
                        }}
                        className="border-dashed"
                      >
                        {getDisplayStatus(s)} ({(claimsByStatus[s] || []).length})
                      </Button>
                    ))}
                  </div>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>VIN</TableHead>
                          <TableHead>Mileage</TableHead>
                          <TableHead>Check-in Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cases</TableHead>
                          <TableHead>Technician Assignment</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warrantyClaims.map((claim, index) => (
                          <TableRow key={claim.recordId || claim.vin}>
                            <TableCell className="font-mono text-sm font-medium">
                              {claim.vin}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {formatMileage(claim.mileage)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(claim.checkInDate).toLocaleDateString('en-US')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(claim.status)} className="text-xs">
                                {getDisplayStatus(claim.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {claim.guaranteeCases && claim.guaranteeCases.length > 0 ? (
                                  <>
                                    <Badge variant="default" className="text-xs">
                                      {claim.guaranteeCases.length} case{claim.guaranteeCases.length > 1 ? 's' : ''}
                                    </Badge>
                                    {claim.priority && (
                                      <Badge variant={getPriorityBadgeVariant(claim.priority)} className="text-xs">
                                        {claim.priority === 'Urgent' && '🚨 '}
                                        {claim.priority === 'High' && '🔥 '}
                                        {claim.priority === 'Medium' && '📋 '}
                                        {claim.priority === 'Low' && '📝 '}
                                        {claim.priority}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    No cases
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="space-y-2">
                                {/* Assigned Technicians */}
                                <div className="flex flex-wrap gap-1">
                                  {claim.assignedTechnicians.map((tech) => (
                                    <Badge key={tech.id} variant="outline" className="text-xs">
                                      {tech.name}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-1 h-3 w-3 p-0 hover:bg-red-100"
                                        onClick={() => removeTechnicianFromCase(claim.vin, tech.id)}
                                      >
                                        ×
                                      </Button>
                                    </Badge>
                                  ))}
                                  {claim.assignedTechnicians.length === 0 && (
                                    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Not assigned
                                    </Badge>
                                  )}
                                </div>

                                {/* Assign Technician Button */}
                                {hasPermission(user, 'assign_technicians') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                                    onClick={() => openTechnicianAssignmentModal(claim.vin)}
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign Technician
                                  </Button>
                                )}

                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewClaimDetail(claim.vin)}
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {warrantyClaims.length} warranty claims
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="repairs" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <CardTitle>Technician Management</CardTitle>
                      <CardDescription>View and manage technicians' statuses and assignments</CardDescription>
                    </div>
                    {/* actions removed: refresh buttons omitted per UX request */}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status tabs for technicians */}
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    {['AVAILABLE', 'UNAVAILABLE', 'ALL'].map(s => {
                      const count = s === 'ALL' ? availableTechnicians.length : availableTechnicians.filter(t => (t.status || (t.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE')) === s).length;
                      return (
                        <Button
                          key={s}
                          size="sm"
                          variant={s === (typeof techFilterStatus !== 'undefined' ? techFilterStatus : 'AVAILABLE') ? 'default' : 'outline'}
                          onClick={() => setTechFilterStatus(s)}
                        >
                          {getDisplayStatus(s)} ({count})
                        </Button>
                      );
                    })}
                  </div>

                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Tasks</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(techFilterStatus && techFilterStatus !== 'ALL' ? availableTechnicians.filter(t => (t.status || (t.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE')) === techFilterStatus) : availableTechnicians).map(tech => (
                          <TableRow key={tech.id}>
                            <TableCell>{tech.name}</TableCell>
                            <TableCell>{typeof tech.workload === 'number' ? tech.workload : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={tech.isAvailable ? 'success' : 'outline'} className="text-xs">
                                {getDisplayStatus(tech.status || (tech.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'))}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewTechnicianRecords(tech)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Claim Detail Modal */}
        <Dialog open={showClaimDetailModal} onOpenChange={setShowClaimDetailModal}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Warranty Claim Details
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Complete information for warranty claim
              </DialogDescription>
            </DialogHeader>

            {selectedClaimForDetail && (
              <div className="space-y-6 mt-6">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(selectedClaimForDetail.status)} className="text-xs">
                    {selectedClaimForDetail.status || 'UNKNOWN'}
                  </Badge>
                </div>
                {/* Basic Information */}
                <Card className="shadow-md border">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">VIN</label>
                          <p className="font-mono text-sm font-semibold mt-0.5">{selectedClaimForDetail.vin}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Vehicle Model</label>
                          <p className="text-sm font-medium mt-0.5">{selectedClaimForDetail.model}</p>
                          {selectedClaimForDetail.modelId && (
                            <p className="font-mono text-xs text-muted-foreground mt-1">
                              Model ID: {selectedClaimForDetail.modelId}
                            </p>
                          )}
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <Car className="h-3 w-3" />
                            Mileage
                          </label>
                          <p className="text-sm font-semibold mt-0.5">{selectedClaimForDetail.mileage.toLocaleString()} km</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <Calendar className="h-3 w-3" />
                            Check-in Date
                          </label>
                          <p className="text-sm font-medium mt-0.5">{new Date(selectedClaimForDetail.checkInDate).toLocaleDateString('en-US')}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <User className="h-3 w-3" />
                            Created By Staff
                          </label>
                          <p className="text-sm font-semibold mt-0.5">{selectedClaimForDetail.serviceCenter}</p>
                          {selectedClaimForDetail.createdByStaffId && (
                            <p className="font-mono text-xs text-muted-foreground mt-1">
                              ID: {selectedClaimForDetail.createdByStaffId}
                            </p>
                          )}
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <DollarSign className="h-3 w-3" />
                            Estimated Cost
                          </label>
                          <p className="text-sm font-semibold text-green-600 mt-0.5">
                            {selectedClaimForDetail.estimatedCost.toLocaleString()} VND
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Guarantee Cases */}
                {selectedClaimForDetail.guaranteeCases && selectedClaimForDetail.guaranteeCases.length > 0 && (
                  <Card className="shadow-md border">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        Guarantee Cases ({selectedClaimForDetail.guaranteeCases.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {selectedClaimForDetail.guaranteeCases.map((gc, idx) => (
                          <Card key={gc.guaranteeCaseId} className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {/* Case Header */}
                                <div className="flex items-start gap-3">
                                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm shrink-0 shadow-sm">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Guarantee Case #{idx + 1}</span>
                                      {gc.status && (
                                        <Badge variant="outline" className="text-xs font-semibold">
                                          {getDisplayStatus(gc.status)}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 font-medium bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md border border-blue-100 dark:border-blue-800">
                                      {gc.contentGuarantee}
                                    </p>
                                  </div>
                                </div>

                                {/* Case Lines */}
                                {gc.caseLines && gc.caseLines.length > 0 && (
                                  <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                        Case Lines ({gc.caseLines.length})
                                      </span>
                                    </div>

                                    <div className="space-y-2">
                                      {gc.caseLines.map((line, lineIdx) => (
                                        <div
                                          key={line.id}
                                          className={`rounded-md p-2.5 border transition-all ${line.status === 'CUSTOMER_APPROVED'
                                            ? 'bg-green-50/50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                            : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                          {/* Line Header - More compact */}
                                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                              <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs">
                                                {lineIdx + 1}
                                              </div>
                                              <Badge
                                                variant={getCaseLineStatusVariant(line.status)}
                                                className={`text-xs px-2 py-0 ${line.status === 'CUSTOMER_APPROVED' ? 'bg-green-600 text-white' : ''
                                                  }`}
                                              >
                                                {getDisplayStatus(line.status)}
                                              </Badge>
                                              <Badge
                                                variant={line.warrantyStatus === 'ELIGIBLE' ? 'default' : 'destructive'}
                                                className="text-xs px-2 py-0"
                                              >
                                                {line.warrantyStatus}
                                              </Badge>
                                            </div>
                                          </div>

                                          {/* Content Grid - 2 columns for better readability */}
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                            {/* Diagnosis */}
                                            <div className="p-2 bg-amber-50/80 dark:bg-amber-900/10 rounded border-l-2 border-amber-400">
                                              <div className="flex items-center gap-1 mb-1">
                                                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                                <span className="font-semibold text-sm text-amber-700 dark:text-amber-400">Diagnosis</span>
                                              </div>
                                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{line.diagnosisText}</p>
                                            </div>

                                            {/* Correction */}
                                            <div className="p-2 bg-green-50/80 dark:bg-green-900/10 rounded border-l-2 border-green-400">
                                              <div className="flex items-center gap-1 mb-1">
                                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                                <span className="font-semibold text-sm text-green-700 dark:text-green-400">Correction</span>
                                              </div>
                                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{line.correctionText}</p>
                                            </div>
                                          </div>

                                          {/* Component Information */}
                                          {line.typeComponent && (
                                            <div className="p-2 bg-blue-50/80 dark:bg-blue-900/10 rounded border-l-2 border-blue-400">
                                              <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                  <Package className="h-3.5 w-3.5 text-blue-600" />
                                                  <span className="font-semibold text-sm text-blue-700 dark:text-blue-400">Component</span>
                                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{line.typeComponent.name}</span>
                                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                    {line.typeComponent.category}
                                                  </Badge>
                                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                                    Qty: {line.quantity}
                                                  </Badge>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  {/* Show Allocate button if CUSTOMER_APPROVED and NOT out of stock */}
                                                  {line.status === 'CUSTOMER_APPROVED' && hasPermission(user, 'attach_parts') && !outOfStockCaseLines.has(line.id) && (
                                                    <Button
                                                      size="sm"
                                                      variant="default"
                                                      onClick={() => handleAllocateComponent(gc.guaranteeCaseId, line.id)}
                                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-6 px-2"
                                                    >
                                                      <Package className="h-3 w-3 mr-1" />
                                                      Allocate
                                                    </Button>
                                                  )}
                                                  {/* Show Request button if out of stock */}
                                                  {outOfStockCaseLines.has(line.id) && (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        // TODO: Implement request to manufacturer API
                                                        alert('Request to Manufacturer feature - Coming soon!');
                                                      }}
                                                      className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 text-xs h-6 px-2"
                                                    >
                                                      <AlertCircle className="h-3 w-3 mr-1" />
                                                      Request
                                                    </Button>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Rejection Reason */}
                                          {line.rejectionReason && (
                                            <div className="mt-2 p-2 bg-red-50/80 dark:bg-red-900/10 rounded border-l-2 border-red-400">
                                              <div className="flex items-center gap-1 mb-1">
                                                <XCircle className="h-3.5 w-3.5 text-red-600" />
                                                <span className="font-semibold text-sm text-red-700 dark:text-red-400">Rejection Reason</span>
                                              </div>
                                              <p className="text-sm text-red-900 dark:text-red-100 font-medium leading-relaxed">{line.rejectionReason}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assigned Technicians */}
                <Card className="shadow-md border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Assigned Technicians ({selectedClaimForDetail.assignedTechnicians.length})
                      </CardTitle>
                      {hasPermission(user, 'assign_technicians') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowClaimDetailModal(false);
                            openTechnicianAssignmentModal(selectedClaimForDetail.vin);
                          }}
                          className="border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign Technician
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedClaimForDetail.assignedTechnicians.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedClaimForDetail.assignedTechnicians.map((tech) => (
                          <Card key={tech.id} className="border-dashed">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold">{tech.name}</p>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    {typeof tech.workload === 'number' && (
                                      <Badge variant="outline" className="text-xs">Tasks: {tech.workload}</Badge>
                                    )}
                                    {tech.status && (
                                      <span className="text-xs">{getDisplayStatus(tech.status)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No technicians assigned yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Case Submitted</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedClaimForDetail.submissionDate).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Vehicle Check-in</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedClaimForDetail.checkInDate).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Technician Assignment Modal */}
        <Dialog open={showTechnicianModal} onOpenChange={closeTechnicianModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Assign Technician to Case
                </DialogTitle>
                <DialogDescription>
                  {selectedCaseForAssignment && (() => {
                    const claim = warrantyClaims.find(c => c.vin === selectedCaseForAssignment);
                    return (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg border space-y-2">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <span className="text-xs text-muted-foreground mr-2">VIN:</span>
                            <span className="font-mono font-medium text-sm">{selectedCaseForAssignment}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <div className="flex-1">
                            <span className="text-xs text-muted-foreground mr-2">Issue:</span>
                            <span className="font-medium text-sm">{claim?.issueType}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refreshTechnicians('AVAILABLE')}>
                  Refresh
                </Button>
                {isLoadingTechnicians && (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Currently Assigned */}
              {selectedCaseForAssignment && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-sm mb-2">Currently Assigned:</h4>
                  <div className="flex flex-wrap gap-2">
                    {warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.map((tech) => (
                      <Badge key={tech.id} variant="default" className="text-sm p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tech.name}</span>
                          {typeof tech.workload === 'number' && (
                            <span className="text-xs">Tasks: {tech.workload}</span>
                          )}
                          {tech.status && (
                            <span className="text-xs text-muted-foreground">{getDisplayStatus(tech.status)}</span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-4 w-4 p-0 hover:bg-red-100"
                            onClick={() => removeTechnicianFromCase(selectedCaseForAssignment, tech.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </Badge>
                    )) || []}
                    {(!warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.length ||
                      warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.length === 0) && (
                        <span className="text-sm text-muted-foreground">No technicians assigned yet</span>
                      )}
                  </div>
                </div>
              )}

              {/* Available Technicians */}
              <div>
                <h4 className="font-medium text-sm mb-3">Available Technicians:</h4>
                <div className="grid gap-3">
                  {selectedCaseForAssignment && getRecommendedTechnicians(
                    warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.issueType || ''
                  ).map((tech) => {
                    const isAssigned = warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.some(t => t.id === tech.id);
                    return (
                      <Card key={tech.id} className={`p-4 cursor-pointer transition-colors ${isAssigned ? 'bg-gray-100 opacity-60' : 'hover:bg-blue-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-medium">{tech.name}</h5>
                              {typeof tech.workload === 'number' && (
                                <Badge variant={tech.workload <= 2 ? "default" : tech.workload <= 4 ? "secondary" : "destructive"} className="text-xs">
                                  Tasks: {tech.workload}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className={`${tech.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                {tech.isAvailable ? '✅ Available' : '❌ Busy'}
                              </span>
                              {tech.status && (
                                <span className="text-xs text-muted-foreground">{tech.status}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant={isAssigned ? "outline" : "default"}
                            size="sm"
                            disabled={isAssigned || !tech.isAvailable}
                            onClick={() => assignTechnicianToCase(selectedCaseForAssignment, tech.id)}
                          >
                            {isAssigned ? 'Assigned' : 'Assign'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Technician Records Modal */}
        <Dialog open={showTechnicianRecordsModal} onOpenChange={setShowTechnicianRecordsModal}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Records Assigned to {selectedTechnicianForRecords?.name || 'Technician'}
              </DialogTitle>
              <DialogDescription>
                Viewing all warranty claims currently assigned to this technician
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {technicianRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No records assigned to this technician
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Total: {technicianRecords.length} record(s)</span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VIN</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {technicianRecords.map((record) => (
                        <TableRow key={record.recordId}>
                          <TableCell className="font-mono text-xs">{record.vin}</TableCell>
                          <TableCell>{displayValue(record.model)}</TableCell>
                          <TableCell>
                            {record.guaranteeCases && record.guaranteeCases.length > 0 ? (
                              <div className="space-y-1">
                                {record.guaranteeCases.map((gCase, idx) => (
                                  <div key={gCase.guaranteeCaseId} className="text-xs">
                                    <Badge variant="outline" className="mr-1">#{idx + 1}</Badge>
                                    {gCase.contentGuarantee}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              displayValue(record.issueType)
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(record.status)}>
                              {getDisplayStatus(record.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(record.checkInDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedClaimForDetail(record);
                                setShowClaimDetailModal(true);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={closeTechnicianRecordsModal}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ServiceCenterDashboard;
