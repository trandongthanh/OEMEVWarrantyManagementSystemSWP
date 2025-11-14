import React, { useState, useEffect, useRef } from "react";
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
import { toast } from "@/hooks/use-toast";
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
  Trash,
  Eye,
  Building2
} from "lucide-react";

interface Technician {
  id: string;
  name: string;
  workload?: number; // maps to activeTaskCount
  status: string; 
  specialty?: string;
  experience?: number;
  rating?: number;
  activeTaskCount?: number;
  tasksAssignedToday?: number;
  workSchedule?: Array<{
    workDate: string;
    status: string;
  }>;
}

interface ComponentInfo {
  typeComponentId: string;
  name: string;
  category: string;
}

interface CaseLine {
  id: string;
  correctionText: string;
  warrantyStatus: string;
  status: string;
  rejectionReason: string | null;
  repairTechId: string | null;
  quantity: number;
  typeComponent?: ComponentInfo;
}

interface DetailedCaseLine {
  id: string;
  correctionText: string;
  warrantyStatus: string;
  status: string;
  typeComponentId: string;
  quantity: number;
  rejectionReason: string | null;
  updatedAt: string;
  guaranteeCase?: {
    guaranteeCaseId: string;
    contentGuarantee: string;
    status: string;
    vehicleProcessingRecord?: {
      vehicleProcessingRecordId: string;
      vin: string;
      createdByStaff?: {
        userId: string;
        serviceCenterId: string;
        vehicleCompanyId: string | null;
        serviceCenter?: {
          serviceCenterId: string;
          vehicleCompanyId: string;
        };
      };
    };
  };
  diagnosticTechnician?: {
    userId: string;
    name: string;
  };
  repairTechnician?: {
    userId: string;
    name: string;
  };
  typeComponent?: {
    typeComponentId: string;
    sku: string;
    name: string;
    price: number;
  };
  reservations?: Array<{
    reservationId: string;
    caseLineId: string;
    status: string;
    component?: {
      componentId: string;
      serialNumber: string;
      status: string;
    };
  }>;
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
  
  status?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  evidenceImageUrls?: string[]; // Evidence images from vehicle processing record
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

interface TypeComponent {
  typeComponentId: string;
  name: string;
  sku: string;
  category: string;
}

interface Stock {
  stockId: string;
  typeComponentId: string;
  quantityInStock: number;
  quantityReserved: number;
  quantityAvailable: number;
  typeComponent?: TypeComponent;
}

interface Warehouse {
  warehouseId: string;
  name: string;
  address: string;
  priority: number;
  vehicleCompanyId: string | null;
  serviceCenterId: string | null;
  createdAt: string;
  updatedAt: string;
  service_center_id?: string | null;
  vehicle_company_id?: string | null;
  serviceCenter?: {
    serviceCenterId: string;
    name: string;
    address: string;
  };
  company?: {
    vehicleCompanyId: string;
    name: string;
  };
  stocks?: Stock[];
}

interface StockTransferRequest {
  id: string;
  requestingWarehouseId: string;
  requestedByUserId: string;
  approvedByUserId: string | null;
  rejectedByUserId: string | null;
  cancelledByUserId: string | null;
  status: string;
  rejectionReason: string | null;
  cancellationReason: string | null;
  requestedAt: string;
  receivedByUserId: string | null;
  approvedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Snake_case fields from API
  requesting_warehouse_id?: string;
  requested_by_user_id?: string;
  approved_by_user_id?: string | null;
  rejected_by_user_id?: string | null;
  cancelled_by_user_id?: string | null;
  received_by_user_id?: string | null;
  // Nested objects
  requester?: {
    userId: string;
    name: string;
    serviceCenterId: string;
    serviceCenter?: {
      name: string;
    };
  };
  approver?: {
    userId: string;
    name: string;
    serviceCenterId?: string;
    serviceCenter?: {
      name: string;
    };
  } | null;
  requestingWarehouse?: {
    warehouseId: string;
    name: string;
    serviceCenterId: string;
    vehicleCompanyId: string;
    address?: string;
  };
  items?: Array<{
    id: string;
    quantityRequested: number;
    quantityApproved?: number | null;
    typeComponentId?: string;
    caselineId?: string;
    component?: {
      name: string;
      typeComponentId: string;
      sku?: string;
    };
    typeComponent?: {
      typeComponentId: string;
      nameComponent?: string;
      name?: string;
      description?: string | null;
    };
  }>;
  caseLines?: Array<{
    id: string;
    correctionText: string;
    warrantyStatus: string;
    status: string;
    rejectionReason: string | null;
    quantity: number;
    typeComponent?: ComponentInfo;
  }>;
}

// Helper: Save and recover caselineIds mapping in localStorage
const saveCaseLineIdsToLocal = (requestId: string, caseLineIds: string[]) => {
  try {
    if (!requestId || !Array.isArray(caseLineIds) || caseLineIds.length === 0) return;
    localStorage.setItem(`stockRequestCaseLines:${requestId}`, JSON.stringify(caseLineIds));
  } catch (e) {
    console.warn('Failed to persist stockRequestCaseLines mapping', e);
  }
};

const recoverCaseLineIdsFromLocal = (requestId: string): string[] => {
  try {
    const raw = localStorage.getItem(`stockRequestCaseLines:${requestId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

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
    // Pending/Initial states - gray
    case 'CHECKED_IN':
    case 'PENDING_DIAGNOSIS':
      return 'secondary';
    // Waiting states - amber/outline
    case 'WAITING_CUSTOMER_APPROVAL':
      return 'outline';
    // Active processing states - blue
    case 'IN_PROGRESS':
    case 'IN_DIAGNOSIS':
    case 'PROCESSING':
      return 'default';
    // Ready for pickup - green/success
    case 'READY_FOR_PICKUP':
      return 'success';
    // Success states - green
    case 'COMPLETED':
    case 'DELIVERED':
      return 'success';
    // Error/Cancelled states - red
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
  WAITING_CUSTOMER_APPROVAL: 'Waiting Customer Approval',
  PROCESSING: 'Processing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',

  
  // CaseLine statuses
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  CUSTOMER_APPROVED: 'Customer Approved',
  PARTS_AVAILABLE: 'Parts Available',
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
AVAILABLE: 'Available',
  UNAVAILABLE: 'Unavailable', 
  // Generic
  UNKNOWN: 'Unknown'
};

const getDisplayStatus = (status?: string) => {
  if (!status) return STATUS_LABELS.UNKNOWN;
  const key = String(status).trim().toUpperCase().replace(/\s+/g, '_');
  
  // Check general status labels
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
    default:
      return 'outline';
  }
};

const getCaseLineStatusVariant = (status?: string) => {
  switch ((status || '').toUpperCase()) {
    // Pending/Draft states - gray
    case 'PENDING_APPROVAL':
    case 'DRAFT':
      return 'secondary';
    // Approved but waiting for parts - blue
    case 'CUSTOMER_APPROVED':
      return 'default';
    // Parts available and ready states - green
    case 'PARTS_AVAILABLE':
    case 'READY_FOR_REPAIR':
      return 'success';
    // Completed - green
    case 'COMPLETED':
      return 'success';
    // Rejected/Cancelled - red
    case 'REJECTED_BY_OUT_OF_WARRANTY':
    case 'REJECTED_BY_TECH':
    case 'REJECTED_BY_CUSTOMER':
    case 'CANCELLED':
      return 'destructive';
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

// Helper function to get workload badge variant based on task count
const getWorkloadBadgeVariant = (workload: number | undefined, maxWorkload = 5) => {
  if (typeof workload !== 'number') return 'outline';
  
  if (workload >= maxWorkload) return 'destructive';  //  RED - Max capacity
  if (workload >= Math.max(1, maxWorkload - 2)) return 'secondary';    //  GRAY - Medium load
  return 'default';                          //  BLUE - Low load
};

// Helper function to check if technician can be assigned (workload < maxWorkload)
  const canAssignTechnician = (technician: Technician, maxWorkload = 5): boolean => {
    const tasksToday = technician.tasksAssignedToday || 0;
    return tasksToday < maxWorkload && technician.status === 'AVAILABLE';
  };// Helper function to get warning message based on workload
const getWorkloadWarningMessage = (workload: number, maxWorkload = 5): string => {
  if (workload >= maxWorkload) return `⚠️ Technician at maximum daily capacity (${workload}/${maxWorkload} tasks today)`;
  if (workload >= Math.max(1, maxWorkload - 1)) return "⚠️ Technician almost at daily capacity";
  return "";
};


const ServiceCenterDashboard = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([]);
  const [availableTechnicians, setAvailableTechnicians] = useState<Technician[]>([]);
  const [techFilterStatus, setTechFilterStatus] = useState<string>('AVAILABLE');

  // Technician Status tabs
  const TECH_STATUSES = ['AVAILABLE', 'UNAVAILABLE'];
  

  // Status tabs
  const STATUSES = [
    'CHECKED_IN',
    'IN_DIAGNOSIS',
    'WAITING_CUSTOMER_APPROVAL',
    'PROCESSING',
    'READY_FOR_PICKUP',
    'COMPLETED',
    'CANCELLED'
  ];
  const [claimsByStatus, setClaimsByStatus] = useState<Record<string, WarrantyClaim[]>>({});
  const [activeStatus, setActiveStatus] = useState<string>('CHECKED_IN');
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<string>('');
  const [showClaimDetailModal, setShowClaimDetailModal] = useState(false);
  const [selectedClaimForDetail, setSelectedClaimForDetail] = useState<WarrantyClaim | null>(null);

  // Out of Stock Modal States
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [outOfStockInfo, setOutOfStockInfo] = useState<{
    errorMessage: string;
    guaranteeCaseId: string;
    caseLineId: string;
    typeComponentId: string;
    quantity: number;
    availableQuantity?: number;
  } | null>(null);

  // Track case lines with out of stock status
  // Technician Records Modal States
  const [showTechnicianRecordsModal, setShowTechnicianRecordsModal] = useState(false);
  const [selectedTechnicianForRecords, setSelectedTechnicianForRecords] = useState<Technician | null>(null);
  const [technicianRecords, setTechnicianRecords] = useState<WarrantyClaim[]>([]);
  const [technicianCaseLines, setTechnicianCaseLines] = useState<any[]>([]);

  // Warehouse States
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [showWarehouseDetailModal, setShowWarehouseDetailModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Stock Transfer Request States
  const [showWarehouseSelectionModal, setShowWarehouseSelectionModal] = useState(false);
  const [pendingStockRequest, setPendingStockRequest] = useState<{
    caseLineId: string;
    typeComponentId: string;
    quantity: number;
    guaranteeCaseId: string;
    availableQuantity?: number;
  } | null>(null);
  const [caseLineToRequestMap, setCaseLineToRequestMap] = useState<Map<string, string>>(new Map()); // Map caselineId -> requestId
  const [stockTransferRequests, setStockTransferRequests] = useState<StockTransferRequest[]>([]);
  const [isLoadingStockRequests, setIsLoadingStockRequests] = useState(false);
  const [showStockRequestsModal, setShowStockRequestsModal] = useState(false);
  const [selectedStockRequest, setSelectedStockRequest] = useState<StockTransferRequest | null>(null);
  const [showStockRequestDetailModal, setShowStockRequestDetailModal] = useState(false);

  // Technician assignment for case line states
  const [showTechnicianSelectionModal, setShowTechnicianSelectionModal] = useState(false);
  const [selectedCaseLineForTechnician, setSelectedCaseLineForTechnician] = useState<{
    guaranteeCaseId: string;
    caseLineId: string;
  } | null>(null);

  // Case line detail modal states
  const [showCaseLineDetailModal, setShowCaseLineDetailModal] = useState(false);
  const [selectedCaseLineDetail, setSelectedCaseLineDetail] = useState<DetailedCaseLine | null>(null);
  const [loadingCaseLineIds, setLoadingCaseLineIds] = useState<Set<string>>(new Set());
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);

  // Cancel stock request states
  const [showCancelRequestModal, setShowCancelRequestModal] = useState(false);
  const [cancelRequestId, setCancelRequestId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // Workload config states
  const [maxWorkload, setMaxWorkload] = useState<number>(5); // default 5
  const [isLoadingWorkloadConfig, setIsLoadingWorkloadConfig] = useState(false);
  const [showWorkloadConfigModal, setShowWorkloadConfigModal] = useState(false);
  const [serviceCenterId, setServiceCenterId] = useState<string | null>(null);
  const [editingMaxWorkload, setEditingMaxWorkload] = useState<number>(5); // for editing in modal
  const [isSavingWorkloadConfig, setIsSavingWorkloadConfig] = useState(false);

  // Registration states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Array<{ roleId: string; roleName: string }>>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    name: '',
    address: '',
    roleId: ''
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const registerFormRef = useRef<HTMLDivElement>(null);

  const { user, logout, getToken } = useAuth();

  // Decode JWT to get serviceCenterId on mount
  useEffect(() => {
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const scId = payload.serviceCenterId || payload.service_center_id || null;
        setServiceCenterId(scId);
        console.log('🔑 Decoded serviceCenterId from JWT:', scId);
        
        // Fetch workload config after getting serviceCenterId
        if (scId) {
          fetchWorkloadConfigSilent(scId);
        }
      } catch (error) {
        console.error('Failed to decode JWT token:', error);
      }
    }
  }, [getToken]);

  // Fetch workload config silently on mount
  const fetchWorkloadConfigSilent = async (scId: string) => {
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token || !scId) return;
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/service-centers/${scId}/workload-config`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const maxTasks = response.data?.data?.maxActiveTasksPerTechnician || 5;
      setMaxWorkload(maxTasks);
      setEditingMaxWorkload(maxTasks);
      console.log('✅ Fetched workload config on mount:', maxTasks);
    } catch (error) {
      console.error('Failed to fetch workload config on mount:', error);
      // Silent fail, keep default value
    }
  };

  // Fetch workload config from backend
  const fetchWorkloadConfig = async () => {
    if (!serviceCenterId) {
      toast({
        title: 'Error',
        description: 'Service Center ID not found in token',
        variant: 'destructive'
      });
      return;
    }
    setIsLoadingWorkloadConfig(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingWorkloadConfig(false);
      return;
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/service-centers/${serviceCenterId}/workload-config`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const maxTasks = response.data?.data?.maxActiveTasksPerTechnician || 5;
      setMaxWorkload(maxTasks);
      setEditingMaxWorkload(maxTasks); // Set editing value same as current
      console.log('✅ Fetched workload config:', maxTasks);
      setShowWorkloadConfigModal(true);
    } catch (error) {
      console.error('Failed to fetch workload config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load workload configuration',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingWorkloadConfig(false);
    }
  };

  // Save workload config to backend
  const saveWorkloadConfig = async () => {
    if (!serviceCenterId) {
      toast({
        title: 'Error',
        description: 'Service Center ID not found',
        variant: 'destructive'
      });
      return;
    }
    
    const newMaxWorkload = Math.max(1, Math.round(editingMaxWorkload));
    
    console.log('🔧 Saving workload config:', {
      serviceCenterId,
      newMaxWorkload,
      url: `${API_BASE_URL}/service-centers/${serviceCenterId}/workload-config`,
      body: { maxActiveTasksPerTechnician: newMaxWorkload }
    });
    
    setIsSavingWorkloadConfig(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      console.error('❌ No token found');
      setIsSavingWorkloadConfig(false);
      return;
    }
    
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/service-centers/${serviceCenterId}/workload-config`,
        { maxActiveTasksPerTechnician: newMaxWorkload },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('📦 Full response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📦 Response data.data:', response.data?.data);
      console.log('📦 Service Center:', response.data?.data?.serviceCenter);
      
      const updatedMaxTasks = response.data?.data?.serviceCenter?.maxActiveTasksPerTechnician || newMaxWorkload;
      setMaxWorkload(updatedMaxTasks);
      setEditingMaxWorkload(updatedMaxTasks);
      console.log('✅ Saved workload config:', updatedMaxTasks);
      toast({
        title: 'Success',
        description: `Max workload updated successfully to ${updatedMaxTasks} tasks per technician`
      });
    } catch (error: any) {
      console.error('❌ Failed to save workload config:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to save workload configuration';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsSavingWorkloadConfig(false);
    }
  };

  // Fetch available roles from API
  const fetchAvailableRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      const response = await axios.get(`${API_BASE_URL}/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data?.status === 'success' && Array.isArray(response.data.data)) {
        setAvailableRoles(response.data.data);
        console.log('✅ Fetched roles:', response.data.data);
      } else {
        console.warn('⚠️ Unexpected roles response format:', response.data);
        setAvailableRoles([]);
      }
    } catch (error) {
      console.error('❌ Error fetching roles:', error);
      toast({
        title: "Error Loading Roles",
        description: "Failed to load available roles. Using default roles.",
        variant: "destructive"
      });
      // Fallback to empty array
      setAvailableRoles([]);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // Validate registration form
  const validateRegisterForm = () => {
    const errors: Record<string, string> = {};

    // Username validation (3-50 characters, alphanumeric and underscore only)
    if (!registerForm.username.trim()) {
      errors.username = 'Username is required';
    } else if (registerForm.username.length < 3 || registerForm.username.length > 50) {
      errors.username = 'Username must be between 3 and 50 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(registerForm.username)) {
      errors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Password validation (min 8 characters + complexity requirements)
    if (!registerForm.password) {
      errors.password = 'Password is required';
    } else if (registerForm.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(registerForm.password)) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(registerForm.password)) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*\d)/.test(registerForm.password)) {
      errors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[@$!%*?&#^()\-_=+\[\]{}|;:'",.<>\/\\`~])/.test(registerForm.password)) {
      errors.password = 'Password must contain at least one special character';
    }

    // Email validation
    if (!registerForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
      errors.email = 'Invalid email format';
    }

    // Phone validation (Vietnamese phone format: 10-11 digits, starts with 0)
    if (!registerForm.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const phoneDigits = registerForm.phone.replace(/[\s\-\+]/g, '');
      if (!/^(\+84|84|0)[0-9]{9,10}$/.test(phoneDigits)) {
        errors.phone = 'Phone must be valid Vietnamese format (10-11 digits, e.g., 0912345678 or +84912345678)';
      }
    }

    // Name validation (2-100 characters)
    if (!registerForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (registerForm.name.length < 2 || registerForm.name.length > 100) {
      errors.name = 'Name must be between 2 and 100 characters';
    }

    // Address validation (5-200 characters)
    if (!registerForm.address.trim()) {
      errors.address = 'Address is required';
    } else if (registerForm.address.length < 5 || registerForm.address.length > 200) {
      errors.address = 'Address must be between 5 and 200 characters';
    }

    // Role validation
    if (!registerForm.roleId) {
      errors.roleId = 'Please select a role';
    } else if (availableRoles.length > 0 && !availableRoles.some(role => role.roleId === registerForm.roleId)) {
      errors.roleId = 'Invalid role selected';
    }

    setRegisterErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle user registration
  const handleRegisterUser = async () => {
    // Validate form
    if (!validateRegisterForm()) {
      // Scroll to top of form to show error fields
      if (registerFormRef.current) {
        registerFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Get first error to show
      const firstError = Object.entries(registerErrors)[0];
      const errorCount = Object.keys(registerErrors).length;
      
      toast({
        title: "Please Complete All Required Fields",
        description: errorCount === 1 
          ? `${firstError[0]}: ${firstError[1]}`
          : `${errorCount} fields need attention. Please scroll up and check all required fields marked with *.`,
        variant: "destructive"
      });
      return;
    }

    setIsRegistering(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      toast({
        title: 'Authentication Required',
        description: 'Please login again.',
        variant: 'destructive'
      });
      setIsRegistering(false);
      return;
    }

    try {
      const payload = {
        username: registerForm.username,
        password: registerForm.password,
        email: registerForm.email,
        phone: registerForm.phone,
        name: registerForm.name,
        address: registerForm.address,
        roleId: registerForm.roleId
      };

      console.log('🔧 Registering new user with payload:', payload);
      console.log('🔑 Using roleId:', registerForm.roleId);

      const response = await axios.post(
        `${API_BASE_URL}/auth/register-in-service-center`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Registration response:', response.data);

      if (response.status === 200 || response.status === 201) {
        toast({
          title: "User Registered Successfully",
          description: `User ${registerForm.name} has been registered successfully!`,
        });
        
        // Reset form and close modal
        setRegisterForm({
          username: '',
          password: '',
          email: '',
          phone: '',
          name: '',
          address: '',
            roleId: ''
        });
        setRegisterErrors({});
        setShowRegisterModal(false);

        // Refresh technicians list if we're on that tab
        await refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
      }
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to register user. Please try again.';
      const errorDetails = error.response?.data?.details || '';
      
      toast({
        title: "Registration Failed",
        description: `${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`,
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  // Fetch records for a specific status (moved outside useEffect to be reusable)
  const fetchForStatus = async (status: string) => {
    const url = `${API_BASE_URL}/processing-records?status=${status}`;
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) return [] as WarrantyClaim[];
    try {
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const apiRecords = res.data?.data?.records?.records || [];
      console.log('🔍 Raw API records:', apiRecords);
      const mapped: WarrantyClaim[] = apiRecords.map((r: any) => {
        const mainTech = r.mainTechnician ? [{ 
          id: r.mainTechnician.userId, 
          name: r.mainTechnician.name, 
          workload: typeof r.mainTechnician.activeTaskCount === 'number' ? r.mainTechnician.activeTaskCount : undefined, 
          status: r.mainTechnician.workSchedule?.[0]?.status || r.mainTechnician.status || ''
        }] : [];
        const cases: GuaranteeCase[] = Array.isArray(r.guaranteeCases) ? r.guaranteeCases.map((gc: any) => {
          console.log(`📦 Guarantee Case ${gc.guaranteeCaseId} has ${gc.caseLines?.length || 0} case lines`);
          return {
            guaranteeCaseId: gc.guaranteeCaseId || gc.id || '',
            contentGuarantee: gc.contentGuarantee || '',
            status: gc.status,
            caseLines: Array.isArray(gc.caseLines) ? gc.caseLines.map((cl: any) => ({
              id: cl.id || '',
              correctionText: cl.correctionText || '',
              warrantyStatus: cl.warrantyStatus || '',
              status: cl.status || '',
              rejectionReason: cl.rejectionReason || null,
              repairTechId: cl.repairTechId || null,
              diagnosticTechId: cl.diagnosticTechId || null,
              quantity: cl.quantity || 0,
              typeComponent: cl.typeComponent ? {
                typeComponentId: cl.typeComponent.typeComponentId || '',
                name: cl.typeComponent.name || '',
                category: cl.typeComponent.category || ''
              } : undefined
            })) : []
          };
        }) : [];
        console.log('✅ Mapped cases:', cases);
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
          
          priority: r.priority || undefined,
          status: r.status || cases[0]?.status || status,
          evidenceImageUrls: r.evidenceImageUrls || []
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
    const results = await Promise.all(STATUSES.map(s => fetchForStatus(s)));
    const byStatus: Record<string, WarrantyClaim[]> = {};
    STATUSES.forEach((s, idx) => { byStatus[s] = results[idx] || []; });
    setClaimsByStatus(byStatus);
    setWarrantyClaims(byStatus[activeStatus] || []);

    // Return byStatus data for immediate use by caller
    return byStatus;
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
    setIsLoadingWarehouses(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingWarehouses(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const warehouseData = response.data?.data?.warehouses || [];
      setWarehouses(warehouseData);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  // Fetch all stock transfer requests
  const fetchStockTransferRequests = async () => {
    setIsLoadingStockRequests(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingStockRequests(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/stock-transfer-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestsData = response.data?.data?.stockTransferRequests || [];
      console.log('📦 Fetched all stock transfer requests:', requestsData);
      setStockTransferRequests(requestsData);
      
      // For each request, fetch detail to get caselineId and build mapping
      console.log('🔄 Building caselineId → requestId mapping...');
      const mappingPromises = requestsData.map(async (request: StockTransferRequest) => {
        try {
          const detailResponse = await axios.get(
            `${API_BASE_URL}/stock-transfer-requests/${request.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          const detailData = detailResponse.data?.data?.stockTransferRequest;
          if (detailData?.items && Array.isArray(detailData.items)) {
            return {
              requestId: request.id,
              caselineIds: detailData.items
                .map((item: any) => item.caselineId)
                .filter(Boolean)
            };
          }
          return null;
        } catch (err) {
          console.error(`Failed to fetch detail for request ${request.id}:`, err);
          return null;
        }
      });
      
      const mappings = await Promise.all(mappingPromises);
      
      // Build the caseLineToRequestMap
      setCaseLineToRequestMap(prev => {
        const newMap = new Map(prev);
        mappings.forEach(mapping => {
          if (mapping && mapping.caselineIds.length > 0) {
            mapping.caselineIds.forEach((caselineId: string) => {
              newMap.set(caselineId, mapping.requestId);
              console.log(`💾 Mapped caselineId ${caselineId} → requestId ${mapping.requestId}`);
            });
            // Persist mapping to localStorage for durability
            try {
              saveCaseLineIdsToLocal(mapping.requestId, mapping.caselineIds);
            } catch (e) {
              console.warn('Failed to persist mapping to localStorage:', e);
            }
          }
        });
        console.log('✅ Total mappings:', newMap.size, 'entries:', Array.from(newMap.entries()));
        return newMap;
      });
      
    } catch (error) {
      console.error('Failed to fetch stock transfer requests:', error);
    } finally {
      setIsLoadingStockRequests(false);
    }
  };

  // Fetch detailed stock transfer request with case lines
  const fetchStockTransferRequestDetail = async (requestId: string) => {
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      return null;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/stock-transfer-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const detailData = response.data?.data?.stockTransferRequest || null;
      console.log('📦 Stock Transfer Request Detail:', detailData);
      console.log('📦 Detail Items:', detailData?.items);
      
      // If items don't have caselineId from API, try to recover from localStorage
      if (detailData && detailData.items) {
        const recoveredIds = recoverCaseLineIdsFromLocal(requestId);
        if (recoveredIds.length > 0) {
          detailData.items.forEach((item: any, idx: number) => {
            if (!item.caselineId && recoveredIds[idx]) {
              item.caselineId = recoveredIds[idx];
            }
          });
        }
      }
      
      // Map case line details from existing records data (already loaded via GET all records)
      if (detailData && detailData.items && detailData.items.length > 0) {
        // Ensure we have claims data to map caseline -> full case line info
        let allClaims = Object.values(claimsByStatus).flat();
        if (allClaims.length === 0) {
          console.log('⚠️ Claims not loaded yet, fetching now...');
          const byStatus = await fetchAllStatuses();
          allClaims = Object.values(byStatus).flat();
          console.log('✅ Loaded', allClaims.length, 'claims for mapping');
        }
        
        // Map caselineId to full case line data from records
        const caseLineDetails = detailData.items
          .filter((item: any) => item.caselineId)
          .map((item: any) => {
            // Search through all claims to find matching case line
            for (const claim of allClaims) {
              for (const gc of claim.guaranteeCases || []) {
                const foundCaseLine = gc.caseLines?.find(cl => cl.id === item.caselineId);
                if (foundCaseLine) {
                  console.log('✅ Found case line in records:', foundCaseLine);
                  return foundCaseLine;
                }
              }
            }
            console.warn('⚠️ Could not find case line in records:', item.caselineId);
            return null;
          })
          .filter(cl => cl !== null);
        
        if (caseLineDetails.length > 0) {
          detailData.caseLines = caseLineDetails;
          console.log('✅ Mapped', caseLineDetails.length, 'case lines from records data');
        }
      }
      
      console.log('📦 Final Detail with Case Lines:', detailData);
      return detailData;
    } catch (error) {
      console.error('Failed to fetch stock transfer request detail:', error);
      return null;
    }
  };

  // Fetch detailed case line information
  const fetchCaseLineDetail = async (caseLineId: string) => {
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      console.error('❌ No auth token available');
      toast({
        title: 'Authentication Required',
        description: 'Authentication token not found. Please log in again.',
        variant: 'destructive'
      });
      return null;
    }

    // Add this caseLineId to loading set
    setLoadingCaseLineIds(prev => new Set(prev).add(caseLineId));
    try {
      console.log('🔍 Fetching case line detail for ID:', caseLineId);
      console.log('🔍 API URL:', `${API_BASE_URL}/case-lines/${caseLineId}`);
      
      const response = await axios.get(`${API_BASE_URL}/case-lines/${caseLineId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📦 Full API Response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📦 Response data.data:', response.data?.data);
      
      const caseLineData = response.data?.data?.caseLine || null;
      console.log('✅ Case line detail parsed:', caseLineData);
      
      if (caseLineData) {
        setSelectedCaseLineDetail(caseLineData);
        setShowCaseLineDetailModal(true);
      } else {
        console.warn('⚠️ No case line data found in response');
        toast({
          title: 'No Data Found',
          description: 'No case line data found. The response structure may be different.',
          variant: 'destructive'
        });
      }
      
      return caseLineData;
    } catch (error: any) {
      console.error('❌ Failed to fetch case line detail:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      toast({
        title: 'Error',
        description: `Failed to load case line details: ${errorMsg}`,
        variant: 'destructive'
      });
      return null;
    } finally {
      // Remove this caseLineId from loading set
      setLoadingCaseLineIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(caseLineId);
        return newSet;
      });
    }
  };

  // Load warranty claims and technicians data
  useEffect(() => {
    let cancelled = false;

    // Initialize data on mount - ensure claims loaded before fetching stock requests
    const initializeData = async () => {
      try {
        // 1. Fetch all claims first (needed for mapping requestId -> caselineId -> guaranteeCaseId)
        if (cancelled) return;
        await fetchAllStatuses();
        
        // 2. Load technicians
        if (cancelled) return;
        await refreshTechnicians('');
        
        // 3. Load warehouses
        if (cancelled) return;
        await fetchWarehouses();
        
        // 4. Load stock transfer requests and build caselineId → requestId mapping
        if (cancelled) return;
        await fetchStockTransferRequests();
      } catch (error) {
        console.error('Failed to initialize data:', error);
      }
    };

    initializeData();

    return () => { cancelled = true; };
  }, []);

  const assignTechnicianToCase = async (vin: string, technicianId: string) => {
    const technician = availableTechnicians.find(t => t.id === technicianId);
    if (!technician) return;

    // ✅ Check if technician can be assigned (workload < maxWorkload)
    if (!canAssignTechnician(technician, maxWorkload)) {
      const workload = technician.workload || 0;
      toast({
        title: 'Cannot Assign Technician',
        description: `Cannot assign ${technician.name}. Technician has reached maximum capacity (${workload}/${maxWorkload} tasks). Please assign a different technician.`,
        variant: 'destructive'
      });
      return;
    }

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
      toast({
        title: 'Error',
        description: 'Record ID not found',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login again.',
          variant: 'destructive'
        });
        return;
      }

      // Call backend API to assign technician
      const response = await axios.patch(
        `${API_BASE_URL}/processing-records/${claim.recordId}/assignment`,
        { technicianId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.status === 'success') {
        toast({
          title: 'Success',
          description: `Technician ${technician.name} assigned successfully!`
        });
        
        // Close modal
        setShowTechnicianModal(false);
        setSelectedCaseForAssignment('');

        // Refresh all data to ensure UI is up-to-date
        const updatedData = await fetchAllStatuses();

        // Refresh technicians list to update workload
        await refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
        
        // Update the detail modal with fresh data if open
        if (selectedClaimForDetail && updatedData) {
          const updatedClaims = Object.values(updatedData).flat();
          const updatedClaim = updatedClaims.find(c => c.vin === selectedClaimForDetail.vin);
          if (updatedClaim) {
            setSelectedClaimForDetail(updatedClaim);
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to assign technician:', error);
      if (error.response?.data?.message) {
        toast({
          title: 'Error',
          description: `Failed to assign technician: ${error.response.data.message}`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to assign technician. Please try again.',
          variant: 'destructive'
        });
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

   const getRecommendedTechnicians = () => {
    // Recommend by availability and workload (less loaded first)

    // Without specialty information, recommend by availability and workload (less loaded first)
    // Only show technicians with AVAILABLE status
    return availableTechnicians
      .filter(tech => tech.status === 'AVAILABLE')
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
    // Refresh data when closing modal
    fetchAllStatuses();
    refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
  };

  // View technician's assigned records
  const viewTechnicianRecords = async (technician: Technician) => {
    try {
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

      // Fetch assigned caselines for this technician using correct endpoint
      const token = typeof getToken === 'function' ? getToken() : (localStorage.getItem('ev_warranty_token') || localStorage.getItem('token'));
      if (token) {
        try {
          console.log('🔍 Fetching assigned caselines for technician:', technician.id);
          // Use the correct endpoint: /case-lines?repairTechId=xxx
          const response = await axios.get(`${API_BASE_URL}/case-lines`, {
            params: { repairTechId: technician.id },
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('📋 Full API response:', response);
          console.log('📋 Response data:', response.data);
          
          const caseLines = response.data?.data?.caseLines || [];
          console.log('📋 Parsed caselines:', caseLines);
          console.log('📋 Caselines count:', caseLines.length);
          
          setTechnicianCaseLines(caseLines);
        } catch (error) {
          console.error('❌ Failed to fetch technician caselines:', error);
          console.error('❌ Error response:', error.response);
          setTechnicianCaseLines([]);
        }
      }
    } catch (error) {
      console.error('Error viewing technician records:', error);
    }
  };

  const closeTechnicianRecordsModal = () => {
    setShowTechnicianRecordsModal(false);
    setSelectedTechnicianForRecords(null);
    setTechnicianRecords([]);
    setTechnicianCaseLines([]);
    // Refresh data when closing modal
    fetchAllStatuses();
  };

  // View warehouse details
  const viewWarehouseDetails = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowWarehouseDetailModal(true);
  };

  const closeWarehouseDetailModal = () => {
    setShowWarehouseDetailModal(false);
    setSelectedWarehouse(null);
    // Refresh data when closing modal
    fetchWarehouses();
  };

  // Allocate component for case line
  const handleAllocateComponent = async (guaranteeCaseId: string, caseLineId: string) => {
    console.log('🎯 Allocating component with params:', {
      guaranteeCaseId,
      caseLineId,
      url: `${API_BASE_URL}/guarantee-cases/${guaranteeCaseId}/case-lines/${caseLineId}/allocate-stock`
    });
    
    try {
      const token = typeof getToken === 'function' ? getToken() : (localStorage.getItem('ev_warranty_token') || localStorage.getItem('token'));
      const response = await axios.post(
        `${API_BASE_URL}/guarantee-cases/${guaranteeCaseId}/case-lines/${caseLineId}/allocate-stock`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Allocation successful!');
        toast({
          title: 'Success',
          description: 'Component allocated successfully!'
        });

        // Remove from case line to request mapping (allocation successful, no longer need the request reference)
        setCaseLineToRequestMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(caseLineId);
          // Also update localStorage
          const currentMap: Record<string, string> = {};
          newMap.forEach((requestId, clId) => {
            currentMap[clId] = requestId;
          });
          localStorage.setItem('caseLineToRequestMap', JSON.stringify(currentMap));
          return newMap;
        });

        // Clear the mapping from localStorage to ensure clean state
        const storedMapping = localStorage.getItem('caseLineToRequestMap');
        if (storedMapping) {
          try {
            const mapping = JSON.parse(storedMapping);
            delete mapping[caseLineId];
            localStorage.setItem('caseLineToRequestMap', JSON.stringify(mapping));
          } catch (e) {
            console.error('Error updating localStorage mapping:', e);
          }
        }

        // Refresh all data to ensure UI is up-to-date
        const updatedData = await fetchAllStatuses();
        
        // Also refresh stock transfer requests to update the mapping
        await fetchStockTransferRequests();
        
        // Update the detail modal with fresh data
        if (selectedClaimForDetail && updatedData) {
          const updatedClaims = Object.values(updatedData).flat();
          const updatedClaim = updatedClaims.find(c => c.vin === selectedClaimForDetail.vin);
          if (updatedClaim) {
            setSelectedClaimForDetail(updatedClaim);
          }
        }
      }
    } catch (error: any) {
      console.error('Error allocating component:', error);
      const errorMessage = error.response?.data?.message || 'Failed to allocate component. Please try again.';

      // Check if error is 409 Conflict (out of stock)  
      if (error.response?.status === 409) {
        // Find the case line to get component info
        const allCaseLines = Object.values(claimsByStatus)
          .flat()
          .flatMap(claim => claim.guaranteeCases.flatMap(gc => gc.caseLines || []));
        const caseLine = allCaseLines.find(cl => cl.id === caseLineId);
        
        if (caseLine && caseLine.typeComponent) {
          // Parse available quantity from error message
          // Example: "Insufficient stock. Available: 12, Requested: 13"
          let availableQuantity: number | undefined;
          const availableMatch = errorMessage.match(/Available:\s*(\d+)/i);
          if (availableMatch) {
            availableQuantity = parseInt(availableMatch[1], 10);
          }
          
          // Open out of stock modal instead of confirm dialog
          setOutOfStockInfo({
            errorMessage,
            guaranteeCaseId,
            caseLineId,
            typeComponentId: caseLine.typeComponent.typeComponentId,
            quantity: caseLine.quantity,
            availableQuantity
          });
          setShowOutOfStockModal(true);
        } else {
          toast({
            title: 'Out of Stock',
            description: errorMessage,
            variant: 'destructive'
          });
        }
      } else {
        // Show error message for other errors
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    }
  };

  // Request component from manufacturer - Open warehouse selection modal
  const handleRequestFromManufacturer = async (
    guaranteeCaseId: string, 
    caseLineId: string, 
    typeComponentId: string,
    quantity: number,
    availableQuantity?: number
  ) => {
    // Store the pending request data
    setPendingStockRequest({
      caseLineId,
      typeComponentId,
      quantity,
      guaranteeCaseId,
      availableQuantity
    });
    
    // Open warehouse selection modal
    setShowWarehouseSelectionModal(true);
  };

  // Assign technician to case line
  const handleAssignTechnicianToCaseLine = async (guaranteeCaseId: string, caseLineId: string, technicianId: string) => {
    try {
      const token = typeof getToken === 'function' ? getToken() : (localStorage.getItem('ev_warranty_token') || localStorage.getItem('token'));
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login again.',
          variant: 'destructive'
        });
        return;
      }

      // ✅ Check if technician can be assigned (tasksAssignedToday < maxWorkload)
      const technician = availableTechnicians.find(t => t.id === technicianId);
      if (technician && !canAssignTechnician(technician, maxWorkload)) {
        const tasksToday = technician.tasksAssignedToday || 0;
        toast({
          title: 'Cannot Assign Technician',
          description: `Cannot assign ${technician.name}. Technician has reached maximum daily capacity (${tasksToday}/${maxWorkload} tasks today). Please assign a different technician.`,
          variant: 'destructive'
        });
        return;
      }

      console.log('🔧 Assigning technician to case line:', {
        guaranteeCaseId,
        caseLineId,
        technicianId,
        url: `${API_BASE_URL}/guarantee-cases/${guaranteeCaseId}/case-lines/${caseLineId}/assign-technician`
      });

      const response = await axios.patch(
        `${API_BASE_URL}/guarantee-cases/${guaranteeCaseId}/case-lines/${caseLineId}/assign-technician`,
        { technicianId },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Technician assigned successfully');
        toast({
          title: 'Success',
          description: 'Technician assigned to case line successfully!'
        });
        
        // Close modal
        setShowTechnicianSelectionModal(false);
        setSelectedCaseLineForTechnician(null);
        
        // Refresh data to update UI
        const updatedData = await fetchAllStatuses();
        
        // Refresh technicians list to update workload
        await refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
        
        // Update the detail modal with fresh data
        if (selectedClaimForDetail && updatedData) {
          const updatedClaims = Object.values(updatedData).flat();
          const updatedClaim = updatedClaims.find(c => c.vin === selectedClaimForDetail.vin);
          if (updatedClaim) {
            setSelectedClaimForDetail(updatedClaim);
          }
        }
      }
    } catch (error: any) {
      console.error('Error assigning technician to case line:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign technician. Please try again.';
      
      // Check if technician is already assigned - show as info toast instead of error
      if (errorMessage.toLowerCase().includes('already assigned')){
        toast({
          title: 'Technician Already Assigned',
          description: 'This case line already has a technician assigned. Please refresh to see the latest status.',
          variant: 'default'
        });
        
        // Close modal and refresh data
        setShowTechnicianSelectionModal(false);
        setSelectedCaseLineForTechnician(null);
        await fetchAllStatuses();
        await refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
      } else {
        // Show error toast for other errors
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    }
  };

  // Submit stock transfer request after warehouse is selected
  const submitStockTransferRequest = async (warehouseId: string) => {
    if (!pendingStockRequest) return;

    try {
      const token = typeof getToken === 'function' ? getToken() : (localStorage.getItem('ev_warranty_token') || localStorage.getItem('token'));
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login again.',
          variant: 'destructive'
        });
        return;
      }

      // Find the selected warehouse to check its current stock
      const selectedWarehouse = warehouses.find(w => w.warehouseId === warehouseId);
      let availableInWarehouse = 0;
      
      if (selectedWarehouse?.stocks) {
        // Find stock of this component type in the selected warehouse
        const componentStock = selectedWarehouse.stocks.find(
          stock => stock.typeComponentId === pendingStockRequest.typeComponentId
        );
        availableInWarehouse = componentStock?.quantityAvailable || 0;
        
        console.log('📦 Stock check in selected warehouse:', {
          warehouseId,
          warehouseName: selectedWarehouse.name,
          typeComponentId: pendingStockRequest.typeComponentId,
          requestedQuantity: pendingStockRequest.quantity,
          availableInWarehouse,
          shortage: Math.max(0, pendingStockRequest.quantity - availableInWarehouse)
        });
      }

      // Calculate shortage: only request what's missing from the selected warehouse
      // Example: Need 9 batteries, warehouse has 8 → request only 1
      const quantityToRequest = Math.max(0, pendingStockRequest.quantity - availableInWarehouse);
      
      // If warehouse already has enough stock, don't create request
      if (quantityToRequest <= 0) {
        toast({
          title: 'Stock Available',
          description: `The selected warehouse already has sufficient stock (${availableInWarehouse} available). Please try allocating again.`,
          variant: 'default'
        });
        setShowWarehouseSelectionModal(false);
        setPendingStockRequest(null);
        return;
      }
      
      console.log(`✅ Creating request for ${quantityToRequest} units (need ${pendingStockRequest.quantity}, warehouse has ${availableInWarehouse})`);
      
      const requestBody = {
        items: [
          {
            quantityRequested: quantityToRequest,
            typeComponentId: pendingStockRequest.typeComponentId,
            caselineId: pendingStockRequest.caseLineId
          }
        ],
        requestingWarehouseId: warehouseId
      };

      const response = await axios.post(
        `${API_BASE_URL}/stock-transfer-requests`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        const createdRequestId = response.data?.data?.stockTransferRequest?.newStockTransferRequest?.id ||
                                 response.data?.data?.stockTransferRequest?.id ||
                                 response.data?.data?.id;
        
        console.log('✅ Stock transfer request created with ID:', createdRequestId);
        
        // Fetch the detail to get accurate caselineId from API
        if (createdRequestId) {
          try {
            const detailResponse = await axios.get(
              `${API_BASE_URL}/stock-transfer-requests/${createdRequestId}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            const detailData = detailResponse.data?.data?.stockTransferRequest;
            console.log('📦 Fetched request detail:', detailData);
            
            if (detailData?.items && Array.isArray(detailData.items)) {
              const caselineIds = detailData.items
                .map((item: any) => item.caselineId)
                .filter(Boolean);
              
              if (caselineIds.length > 0) {
                saveCaseLineIdsToLocal(createdRequestId, caselineIds);
                console.log('💾 Saved stock request mapping from detail API:', createdRequestId, '→', caselineIds);
              }
            }
          } catch (err) {
            console.error('Failed to fetch request detail for mapping:', err);
            // Fallback to original method
            const toSave = pendingStockRequest?.caseLineId ? [pendingStockRequest.caseLineId] : [];
            if (toSave.length > 0) {
              saveCaseLineIdsToLocal(createdRequestId, toSave);
              console.log('💾 Saved stock request mapping (fallback):', createdRequestId, '→', toSave);
            }
          }
        }

        // Save mapping from caselineId to requestId for "View Request" button
        setCaseLineToRequestMap(prev => {
          const newMap = new Map(prev);
          newMap.set(pendingStockRequest.caseLineId, createdRequestId);
          console.log('💾 Saved caseLineToRequestMap:', {
            caseLineId: pendingStockRequest.caseLineId,
            requestId: createdRequestId,
            allMappings: Array.from(newMap.entries())
          });
          return newMap;
        });

        toast({
          title: 'Success',
          description: 'Stock transfer request sent successfully!'
        });
        
        // Close modal and reset
        setShowWarehouseSelectionModal(false);
        setPendingStockRequest(null);

        // Refresh data from backend to get updated caseline status (WAITING_FOR_PARTS)
        console.log('🔄 Refreshing data after creating stock request...');
        const updatedData = await fetchAllStatuses();
        await fetchWarehouses();
        // Refresh stock transfer requests list to include the newly created request
        await fetchStockTransferRequests();
        
        // Refresh claim detail modal with updated data from backend (includes updated caseline status)
        if (selectedClaimForDetail && updatedData) {
          const updatedClaims = Object.values(updatedData).flat();
          const updatedClaim = updatedClaims.find(c => c.recordId === selectedClaimForDetail.recordId);
          if (updatedClaim) {
            setSelectedClaimForDetail(updatedClaim);
            console.log('✅ Refreshed claim detail modal - caselines should now show WAITING_FOR_PARTS status');
          }
        }
      }
    } catch (error: any) {
      console.error('Error requesting from manufacturer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send request to manufacturer. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  // Cancel stock transfer request
  const handleCancelStockRequest = async () => {
    if (!cancelRequestId || !cancellationReason.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a cancellation reason',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = typeof getToken === 'function' ? getToken() : (localStorage.getItem('ev_warranty_token') || localStorage.getItem('token'));
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login again.',
          variant: 'destructive'
        });
        return;
      }

      const response = await axios.patch(
        `${API_BASE_URL}/stock-transfer-requests/${cancelRequestId}/cancel`,
        { cancellationReason: cancellationReason.trim() },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast({
          title: 'Success',
          description: 'Stock transfer request cancelled successfully!'
        });
        
        // Close modal and reset
        setShowCancelRequestModal(false);
        setCancelRequestId(null);
        setCancellationReason('');
        
        // Close detail modal if open
        setShowStockRequestDetailModal(false);
        setSelectedStockRequest(null);
        
        // Refresh data
        const updatedData = await fetchAllStatuses();
        await fetchStockTransferRequests();
        
        // Update detail modal if open
        if (selectedClaimForDetail && updatedData) {
          const updatedClaims = Object.values(updatedData).flat();
          const updatedClaim = updatedClaims.find(c => c.vin === selectedClaimForDetail.vin);
          if (updatedClaim) {
            setSelectedClaimForDetail(updatedClaim);
          }
        }
      }
    } catch (error: any) {
      console.error('Error cancelling stock request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel request. Please try again.';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
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
      const url = status ? `${API_BASE_URL}/users/technicians?status=${status}` : `${API_BASE_URL}/users/technicians`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const records = res.data?.data || [];
      console.log('🔍 API Response technicians:', records);
      const mapped: Technician[] = records.map((t: any) => {
        // Status is in workSchedule array, not at root level
        const rawStatus = t.workSchedule?.[0]?.status || t.status || '';
        const normalizedStatus = String(rawStatus).trim().toUpperCase().replace(/\s+/g, '_') || undefined;

        const workloadValue = typeof t.activeTaskCount === 'number' ? t.activeTaskCount : (typeof t.workload === 'number' ? t.workload : (typeof t.currentLoad === 'number' ? t.currentLoad : undefined));
        console.log(`👨‍🔧 Technician ${t.name}: activeTaskCount=${t.activeTaskCount}, workload=${t.workload}, currentLoad=${t.currentLoad}, final=${workloadValue}`);

        return {
          id: t.userId || t.id || String(t.techId || ''),
          name: t.name || t.fullName || t.username || '',
          specialty: t.specialty || t.department || undefined,
          experience: t.experience || t.yearsOfExperience || undefined,
          rating: t.rating || undefined,
          workload: workloadValue,
          status: normalizedStatus || '',
          activeTaskCount: t.activeTaskCount,
          tasksAssignedToday: t.tasksAssignedToday,
          workSchedule: t.workSchedule || []
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
                <Button 
                  variant="default" 
                  onClick={() => {
                    setShowRegisterModal(true);
                    fetchAvailableRoles();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Register
                </Button>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="claims">Warranty Claims</TabsTrigger>
              <TabsTrigger value="repairs">Technician Management</TabsTrigger>
              <TabsTrigger value="warehouses">Warehouse Management</TabsTrigger>
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
                                    </Badge>
                                  ))}
                                  {claim.assignedTechnicians.length === 0 && (
                                    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Not assigned
                                    </Badge>
                                  )}
                                </div>

                                {/* Assign Technician Button - Only show for CHECKED_IN status and when no technician assigned yet */}
                                {hasPermission(user, 'assign_technicians') && 
                                 claim.status === 'CHECKED_IN' && 
                                 (!claim.assignedTechnicians || claim.assignedTechnicians.length === 0) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                                    onClick={() => openTechnicianAssignmentModal(claim.vin)}
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign Technician (Diagnosis)
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
 <CardDescription>View and manage technicians statuses, assignments and config workload</CardDescription>                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchWorkloadConfig}
                        disabled={isLoadingWorkloadConfig || !serviceCenterId}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {isLoadingWorkloadConfig ? 'Loading...' : 'Config Workload'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
 {/* Status tabs for technicians - show all defined statuses */}              
     <div className="mb-4 flex items-center gap-2 flex-wrap">
                   
                       {/* ALL button */}
                    <Button
                      key="ALL"
                      size="sm"
                      variant={techFilterStatus === 'ALL' ? 'default' : 'outline'}
                      onClick={() => setTechFilterStatus('ALL')}
                      className="border-dashed"
                    >
                      All ({availableTechnicians.length})
                    </Button>
                    {/* Status buttons */}
                    {TECH_STATUSES.map(s => {
                      const count = availableTechnicians.filter(t => t.status === s).length;
                      return (
                        <Button
                          key={s}
                          size="sm"
                          variant={s === techFilterStatus ? 'default' : 'outline'}
                          onClick={() => setTechFilterStatus(s)}
                          className="border-dashed"
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
                          <TableHead>Active Tasks</TableHead>
                          <TableHead>Tasks Today</TableHead>
                          <TableHead>Today's Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(techFilterStatus && techFilterStatus !== 'ALL' ? availableTechnicians.filter(t => t.status === techFilterStatus) : availableTechnicians).map(tech => {
                          // Get today's work schedule status
                          const today = new Date().toISOString().split('T')[0];
                          const todaySchedule = tech.workSchedule?.find(ws => ws.workDate === today);
                          const scheduleStatus = todaySchedule?.status || 'N/A';
                          
                          return (
                            <TableRow key={tech.id}>
                              <TableCell className="font-medium">{tech.name}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {tech.activeTaskCount ?? tech.workload ?? 0} active
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm text-muted-foreground">
                                  {tech.tasksAssignedToday ?? 0} assigned
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getTechBadgeVariant(scheduleStatus)} className="text-xs">
                                  {getDisplayStatus(scheduleStatus)}
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
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="warehouses" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Warehouse Management
                      </CardTitle>
                      <CardDescription>View and manage warehouses and inventory</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => {
                          fetchStockTransferRequests();
                          setShowStockRequestsModal(true);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        View All Requests
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchWarehouses}
                        disabled={isLoadingWarehouses}
                      >
                        {isLoadingWarehouses ? 'Loading...' : 'Refresh'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingWarehouses ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading warehouses...</p>
                    </div>
                  ) : warehouses.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No warehouses found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={fetchWarehouses}
                      >
                        Load Warehouses
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {warehouses.map((warehouse) => (
                            <TableRow key={warehouse.warehouseId}>
                              <TableCell className="font-medium">
                                {warehouse.name}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {warehouse.address}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={warehouse.priority === 1 ? 'default' : warehouse.priority === 2 ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  Priority {warehouse.priority}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(warehouse.createdAt).toLocaleDateString('en-US')}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewWarehouseDetails(warehouse)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Claim Detail Modal */}
        <Dialog open={showClaimDetailModal} onOpenChange={(open) => {
          setShowClaimDetailModal(open);
          // Refresh data when closing modal to ensure latest state
          if (!open) {
            fetchAllStatuses();
            fetchStockTransferRequests();
          }
        }}>
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
                                                className={`text-xs px-2 py-0 ${
                                                  line.status === 'CUSTOMER_APPROVED' 
                                                    ? 'bg-green-600 text-white' 
                                                    : line.status === 'REJECTED_BY_CUSTOMER'
                                                    ? 'bg-red-600 text-white font-semibold'
                                                    : ''
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

                                          {/* Solution */}
                                          <div className="mb-2">
                                            <div className="p-2 bg-green-50/80 dark:bg-green-900/10 rounded border-l-2 border-green-400">
                                              <div className="flex items-center gap-1 mb-1">
                                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                                <span className="font-semibold text-sm text-green-700 dark:text-green-400">Solution</span>
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
                                                    Quantity: {line.quantity}
                                                  </Badge>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  {/* Show Allocate button based on case line status: */}
                                                  {/* 1. PARTS_AVAILABLE - stock received from manufacturer (green button) */}
                                                  {/* 2. CUSTOMER_APPROVED - first allocation from warehouse (blue button) */}
                                                  {/* DO NOT show allocate for WAITING_FOR_PARTS */}
                                                  {(() => {
                                                    const isPartsAvailable = line.status === 'PARTS_AVAILABLE';
                                                    const isCustomerApproved = line.status === 'CUSTOMER_APPROVED';
                                                    const isWaitingForParts = line.status === 'WAITING_FOR_PARTS';
                                                    
                                                    // Don't show allocate button if waiting for parts
                                                    if (isWaitingForParts) {
                                                      return null;
                                                    }
                                                    
                                                    // Show allocate for PARTS_AVAILABLE (after stock received)
                                                    if (isPartsAvailable && hasPermission(user, 'attach_parts')) {
                                                      return (
                                                        <Button
                                                          size="sm"
                                                          variant="default"
                                                          onClick={() => handleAllocateComponent(gc.guaranteeCaseId, line.id)}
                                                          className="bg-green-600 hover:bg-green-700 text-white text-xs h-6 px-2"
                                                        >
                                                          <Package className="h-3 w-3 mr-1" />
                                                          Allocate Component
                                                        </Button>
                                                      );
                                                    }
                                                    
                                                    // Show allocate for CUSTOMER_APPROVED (first allocation)
                                                    if (isCustomerApproved && 
                                                        selectedClaimForDetail.status === 'PROCESSING' && 
                                                        hasPermission(user, 'attach_parts')) {
                                                      return (
                                                        <Button
                                                          size="sm"
                                                          variant="default"
                                                          onClick={() => handleAllocateComponent(gc.guaranteeCaseId, line.id)}
                                                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-6 px-2"
                                                        >
                                                          <Package className="h-3 w-3 mr-1" />
                                                          Allocate Component
                                                        </Button>
                                                      );
                                                    }
                                                    
                                                    return null;
                                                  })()}
                                                  
                                                  {/* Show "View Request" button for WAITING_FOR_PARTS status or if has active stock request */}
                                                  {(line.status === 'WAITING_FOR_PARTS' || (caseLineToRequestMap.has(line.id) && line.status !== 'PARTS_AVAILABLE')) && (() => {
                                                    const requestId = caseLineToRequestMap.get(line.id);
                                                    
                                                    // Show "View Request" button for pending requests
                                                    return (
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={async () => {
                                                          if (requestId) {
                                                            // Ensure claims are loaded before fetching request detail
                                                            if (Object.keys(claimsByStatus).length === 0) {
                                                              await fetchAllStatuses();
                                                            }
                                                            const requestDetail = await fetchStockTransferRequestDetail(requestId);
                                                            if (requestDetail) {
                                                              setSelectedStockRequest(requestDetail);
                                                              setShowStockRequestDetailModal(true);
                                                            }
                                                          }
                                                        }}
                                                        className="text-blue-600 hover:bg-blue-50 border-blue-600 text-xs h-6 px-2"
                                                      >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View Request
                                                      </Button>
                                                    );
                                                  })()}
                                                  
                                                  {/* Show PARTS_AVAILABLE badge with special styling */}
                                                  {line.status === 'PARTS_AVAILABLE' && (
                                                    <Badge variant="outline" className="text-xs bg-green-50 border-green-400 text-green-700">
                                                      <Package className="h-3 w-3 mr-1" />
                                                      Parts Available
                                                    </Badge>
                                                  )}
                                                  
                                                  {/* Show "Assign Technician" button if status is READY_FOR_REPAIR */}
                                                  {line.status === 'READY_FOR_REPAIR' && hasPermission(user, 'assign_technicians') && (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        setSelectedCaseLineForTechnician({
                                                          guaranteeCaseId: gc.guaranteeCaseId,
                                                          caseLineId: line.id
                                                        });
                                                        setShowTechnicianSelectionModal(true);
                                                      }}
                                                      className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-xs h-6 px-2"
                                                    >
                                                      <User className="h-3 w-3 mr-1" />
                                                      Assign Repair Technician
                                                    </Button>
                                                  )}
                                                  
                                                  {/* View Details button - always show */}
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => fetchCaseLineDetail(line.id)}
                                                    disabled={loadingCaseLineIds.has(line.id)}
                                                    className="text-gray-700 hover:bg-gray-50 border-gray-300 text-xs h-6 px-2"
                                                  >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    {loadingCaseLineIds.has(line.id) ? 'Loading...' : 'View Details'}
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Assigned Repair Technician */}
                                          {line.repairTechId && (
                                            <div className="mt-2 p-2 bg-purple-50/80 dark:bg-purple-900/10 rounded border-l-2 border-purple-400">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                                                    <User className="h-4 w-4 text-purple-600" />
                                                  </div>
                                                  <div>
                                                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-0.5">
                                                      Repair Technician Assigned
                                                    </p>
                                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                      {(() => {
                                                        const tech = availableTechnicians.find(t => t.id === line.repairTechId);
                                                        return tech ? tech.name : 'Technician';
                                                      })()}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground font-mono">ID: {line.repairTechId}</p>
                                                  </div>
                                                </div>
                                                <Badge variant="outline" className="text-xs bg-purple-100 border-purple-300 text-purple-700">
                                                  <User className="h-3 w-3 mr-1" />
                                                  Assigned
                                                </Badge>
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
                      {/* Only show Assign button if no technician assigned yet */}
                      {hasPermission(user, 'assign_technicians') && 
                       (!selectedClaimForDetail.assignedTechnicians || selectedClaimForDetail.assignedTechnicians.length === 0) && (
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

                {/* Evidence Images */}
                {selectedClaimForDetail.evidenceImageUrls && selectedClaimForDetail.evidenceImageUrls.length > 0 && (
                  <Card className="shadow-md border">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                          <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        Evidence Images ({selectedClaimForDetail.evidenceImageUrls.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {selectedClaimForDetail.evidenceImageUrls.map((url, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setSelectedImageUrl(url);
                              setShowImageModal(true);
                            }}
                            className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 transition-all shadow-sm hover:shadow-lg cursor-pointer"
                          >
                            <img
                              src={url}
                              alt={`Evidence ${idx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-6 w-6 text-white" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-xs text-white font-medium">Image {idx + 1}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

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
                  {selectedCaseForAssignment && getRecommendedTechnicians().map((tech) => { 
                    const isAssigned = warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.some(t => t.id === tech.id);
                    const canAssign = canAssignTechnician(tech, maxWorkload);
                    const workloadWarning = !canAssign ? getWorkloadWarningMessage(tech.tasksAssignedToday || 0, maxWorkload) : "";
                    
                    return (
                      <Card 
                        key={tech.id} 
                        className={`p-4 transition-colors ${
                          isAssigned 
                            ? 'bg-gray-100 opacity-60' 
                            : !canAssign 
                              ? 'opacity-50 cursor-not-allowed border-red-300 bg-red-50' 
                              : 'hover:bg-blue-50 cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-medium">{tech.name}</h5>
                              {typeof tech.tasksAssignedToday === 'number' && (
                                <Badge variant={getWorkloadBadgeVariant(tech.tasksAssignedToday, maxWorkload)} className="text-xs">
                                  Tasks Today: {tech.tasksAssignedToday}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className={tech.status === 'AVAILABLE' ? 'text-green-600' : 'text-gray-600'}>
                                {getDisplayStatus(tech.status)}
                              </span>
                            </div>
                            {workloadWarning && (
                              <div className="mt-2 text-xs text-red-600 font-medium">
                                {workloadWarning}
                              </div>
                            )}
                          </div>
                          <Button
                            variant={isAssigned ? "outline" : "default"}
                            size="sm"
                            disabled={isAssigned || tech.status !== 'AVAILABLE' || !canAssign}
                            onClick={() => canAssign && assignTechnicianToCase(selectedCaseForAssignment, tech.id)}
                          >
                            {isAssigned ? 'Assigned' : !canAssign ? 'Full' : 'Assign'}
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
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Work Assignments for {selectedTechnicianForRecords?.name || 'Technician'}
              </DialogTitle>
              <DialogDescription>
                View all assigned records and case lines for this technician
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Total Records</p>
                        <p className="text-2xl font-bold mt-1">{technicianRecords.length}</p>
                      </div>
                      <Car className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Total Case Lines</p>
                        <p className="text-2xl font-bold mt-1">{technicianCaseLines.length}</p>
                      </div>
                      <FileText className="h-8 w-8 text-purple-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold">Workload</p>
                        <p className="text-2xl font-bold mt-1">{selectedTechnicianForRecords?.workload || 0}</p>
                      </div>
                      <Wrench className="h-8 w-8 text-orange-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assigned Records Section */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-600" />
                    Assigned Vehicle Processing Records ({technicianRecords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {technicianRecords.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Car className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No records assigned to this technician</p>
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>VIN</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Guarantee Cases</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Check-in Date</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {technicianRecords.map((record) => (
                            <TableRow key={record.recordId}>
                              <TableCell className="font-mono text-xs font-semibold">{record.vin}</TableCell>
                              <TableCell>{displayValue(record.model)}</TableCell>
                              <TableCell>
                                {record.guaranteeCases && record.guaranteeCases.length > 0 ? (
                                  <div className="space-y-1">
                                    {record.guaranteeCases.slice(0, 2).map((gCase, idx) => (
                                      <div key={gCase.guaranteeCaseId} className="text-xs">
                                        <Badge variant="outline" className="mr-1">#{idx + 1}</Badge>
                                        {gCase.contentGuarantee.substring(0, 40)}
                                        {gCase.contentGuarantee.length > 40 ? '...' : ''}
                                      </div>
                                    ))}
                                    {record.guaranteeCases.length > 2 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{record.guaranteeCases.length - 2} more
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No cases</span>
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
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assigned Case Lines Section */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-purple-600" />
                    Assigned Case Lines ({technicianCaseLines.length})
                  </CardTitle>
                  <CardDescription>
                    Individual repair tasks assigned to this technician
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {technicianCaseLines.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>No case lines assigned to this technician</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {technicianCaseLines.map((caseLine, index) => (
                        <div key={caseLine.id || index} className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border hover:border-purple-300 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs">
                                #{index + 1}
                              </Badge>
                              <Badge 
                                variant={
                                  caseLine.status === 'READY_FOR_REPAIR' ? 'default' :
                                  caseLine.status === 'IN_REPAIR' ? 'secondary' :
                                  caseLine.status === 'COMPLETED' ? 'default' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {caseLine.status}
                              </Badge>
                            </div>
                            <Badge variant={caseLine.warrantyStatus === 'ELIGIBLE' ? 'default' : 'destructive'} className="text-xs">
                              {caseLine.warrantyStatus}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <span className="text-xs text-muted-foreground">Case Line ID:</span>
                              <p className="font-mono text-xs mt-0.5">{caseLine.id}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground">VIN:</span>
                              <p className="font-mono text-xs font-semibold mt-0.5">
                                {caseLine.guaranteeCase?.vehicleProcessingRecord?.vin || 'N/A'}
                              </p>
                            </div>
                            {caseLine.typeComponent && (
                              <>
                                <div>
                                  <span className="text-xs text-muted-foreground">Component:</span>
                                  <p className="text-xs font-medium mt-0.5">{caseLine.typeComponent.name}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">SKU:</span>
                                  <p className="font-mono text-xs mt-0.5">{caseLine.typeComponent.sku}</p>
                                </div>
                              </>
                            )}
                            <div>
                              <span className="text-xs text-muted-foreground">Quantity:</span>
                              <p className="text-xs font-semibold mt-0.5">{caseLine.quantity}</p>
                            </div>
                            {caseLine.guaranteeCase && (
                              <div>
                                <span className="text-xs text-muted-foreground">Guarantee Case:</span>
                                <p className="text-xs mt-0.5">{caseLine.guaranteeCase.contentGuarantee?.substring(0, 30)}...</p>
                              </div>
                            )}
                          </div>

                          {caseLine.correctionText && (
                            <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/10 rounded border-l-2 border-green-400">
                              <div className="flex items-center gap-1 mb-1">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                <span className="text-xs font-semibold text-green-700 dark:text-green-400">Solution</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300">
                                {caseLine.correctionText}
                              </p>
                            </div>
                          )}

                          {caseLine.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200">
                              <span className="text-xs font-semibold text-red-700 dark:text-red-400">Rejection:</span>
                              <p className="text-xs text-red-900 dark:text-red-100 mt-1">{caseLine.rejectionReason}</p>
                            </div>
                          )}

                          {caseLine.updatedAt && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              Last updated: {new Date(caseLine.updatedAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={closeTechnicianRecordsModal}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warehouse Detail Modal */}
        <Dialog open={showWarehouseDetailModal} onOpenChange={setShowWarehouseDetailModal}>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Warehouse Inventory Details
              </DialogTitle>
              <DialogDescription>
                View warehouse information and stock inventory
              </DialogDescription>
            </DialogHeader>

            {selectedWarehouse && (
              <div className="space-y-6">
                {/* Warehouse Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Warehouse Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Warehouse Name</label>
                        <p className="text-sm font-semibold">{selectedWarehouse.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Priority</label>
                        <div className="mt-1">
                          <Badge 
                            variant={selectedWarehouse.priority === 1 ? 'default' : selectedWarehouse.priority === 2 ? 'secondary' : 'outline'}
                          >
                            Priority {selectedWarehouse.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Address
                        </label>
                        <p className="text-sm">{selectedWarehouse.address}</p>
                      </div>
                      {selectedWarehouse.serviceCenter && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Service Center</label>
                          <p className="text-sm font-medium">{selectedWarehouse.serviceCenter.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedWarehouse.serviceCenter.address}</p>
                        </div>
                      )}
                      {selectedWarehouse.company && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Company</label>
                          <p className="text-sm font-medium">{selectedWarehouse.company.name}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created At
                        </label>
                        <p className="text-sm">{new Date(selectedWarehouse.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                        <p className="text-sm">{new Date(selectedWarehouse.updatedAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Stock Inventory
                      </span>
                      <Badge variant="outline">
                        {selectedWarehouse.stocks?.length || 0} component types
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Available components and quantities in this warehouse
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedWarehouse.stocks && selectedWarehouse.stocks.length > 0 ? (
                      <div className="space-y-4">
                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            const categories = Array.from(
                              new Set(
                                selectedWarehouse.stocks
                                  ?.map(stock => stock.typeComponent?.category)
                                  .filter(Boolean)
                              )
                            ).sort();
                            
                            return (
                              <>
                                <Button
                                  key="ALL"
                                  variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setSelectedCategory('ALL')}
                                  className="border-dashed"
                                >
                                  All Categories ({selectedWarehouse.stocks?.length || 0})
                                </Button>
                                {categories.map((category) => {
                                  const count = selectedWarehouse.stocks?.filter(
                                    stock => stock.typeComponent?.category === category
                                  ).length || 0;
                                  return (
                                    <Button
                                      key={category}
                                      variant={selectedCategory === category ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setSelectedCategory(category as string)}
                                      className="border-dashed"
                                    >
                                      {category} ({count})
                                    </Button>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>

                        {/* Stock Table */}
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Component Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">In Stock</TableHead>
                                <TableHead className="text-right">Reserved</TableHead>
                                <TableHead className="text-right">Available</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                const filteredStocks = selectedCategory === 'ALL'
                                  ? selectedWarehouse.stocks
                                  : selectedWarehouse.stocks?.filter(
                                      stock => stock.typeComponent?.category === selectedCategory
                                    );

                                return filteredStocks && filteredStocks.length > 0 ? (
                                  filteredStocks.map((stock, index) => (
                                    <TableRow key={stock.stockId}>
                                      <TableCell className="font-medium">
                                        {index + 1}
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <p className="font-medium text-sm">{stock.typeComponent?.name || 'N/A'}</p>
                                          <p className="text-xs text-muted-foreground font-mono">
                                            ID: {stock.typeComponentId.substring(0, 8)}...
                                          </p>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                          {stock.typeComponent?.sku || 'N/A'}
                                        </code>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                          {stock.typeComponent?.category || 'N/A'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className="font-medium">{stock.quantityInStock}</span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Badge variant="secondary" className="text-xs">
                                          {stock.quantityReserved}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Badge 
                                          variant={stock.quantityAvailable > 0 ? 'default' : 'destructive'}
                                          className="text-xs font-semibold"
                                        >
                                          {stock.quantityAvailable}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {stock.quantityAvailable === 0 ? (
                                          <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                        ) : stock.quantityAvailable < 5 ? (
                                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">Low Stock</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs border-green-500 text-green-700">In Stock</Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                                      No stocks found for this category
                                    </TableCell>
                                  </TableRow>
                                );
                              })()}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No stock information available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={closeWarehouseDetailModal}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warehouse Selection Modal for Stock Transfer Request */}
        <Dialog open={showWarehouseSelectionModal} onOpenChange={(open) => {
          setShowWarehouseSelectionModal(open);
          // Refresh data when closing modal
          if (!open) {
            fetchAllStatuses();
            fetchStockTransferRequests();
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Select Warehouse for Stock Transfer Request
              </DialogTitle>
              <DialogDescription>
                Choose the warehouse that will request the component from the manufacturer
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {pendingStockRequest && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Request Details:
                      </p>
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p>• Component ID: <span className="font-mono">{pendingStockRequest.typeComponentId}</span></p>
                        <p>• Quantity: <span className="font-semibold">{pendingStockRequest.quantity}</span></p>
                        <p>• Case Line ID: <span className="font-mono text-xs">{pendingStockRequest.caseLineId}</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <h4 className="font-medium text-sm mb-3">Available Warehouses:</h4>
                {warehouses.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No warehouses available</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={fetchWarehouses}
                    >
                      Load Warehouses
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                    {warehouses.map((warehouse) => {
                      // Calculate current stock for this component in this warehouse
                      const componentStock = warehouse.stocks?.find(
                        stock => stock.typeComponentId === pendingStockRequest?.typeComponentId
                      );
                      const availableQty = componentStock?.quantityAvailable || 0;
                      const requestedQty = pendingStockRequest?.quantity || 0;
                      const shortage = Math.max(0, requestedQty - availableQty);
                      
                      return (
                        <Card 
                          key={warehouse.warehouseId} 
                          className="p-4 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 hover:border-blue-400"
                          onClick={() => submitStockTransferRequest(warehouse.warehouseId)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h5 className="font-semibold">{warehouse.name}</h5>
                                <Badge 
                                  variant={warehouse.priority === 1 ? 'default' : warehouse.priority === 2 ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  Priority {warehouse.priority}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{warehouse.address}</span>
                              </div>
                              
                              {/* Show current stock info */}
                              {pendingStockRequest && (
                                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Current Stock:</span>
                                    <span className={`font-semibold ${availableQty >= requestedQty ? 'text-green-600' : 'text-orange-600'}`}>
                                      {availableQty} / {requestedQty} needed
                                    </span>
                                  </div>
                                  {shortage > 0 && (
                                    <div className="flex items-center justify-between text-xs mt-1">
                                      <span className="text-muted-foreground">Will request:</span>
                                      <span className="font-semibold text-blue-600">
                                        {shortage} units from manufacturer
                                      </span>
                                    </div>
                                  )}
                                  {availableQty >= requestedQty && (
                                    <p className="text-xs text-green-600 mt-1 font-medium">
                                      ✓ Sufficient stock available
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-xs text-muted-foreground mt-1 font-mono">
                                ID: {warehouse.warehouseId}
                              </p>
                            </div>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                submitStockTransferRequest(warehouse.warehouseId);
                              }}
                            >
                              Select
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowWarehouseSelectionModal(false);
                  setPendingStockRequest(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Technician Selection Modal for Case Line Assignment */}
        <Dialog open={showTechnicianSelectionModal} onOpenChange={(open) => {
          setShowTechnicianSelectionModal(open);
          if (!open) {
            setSelectedCaseLineForTechnician(null);
            // Refresh data when closing modal
            fetchAllStatuses();
            refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
          }
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Assign Technician to Case Line
              </DialogTitle>
              <DialogDescription>
                Select a technician to assign to this case line for repair work
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {selectedCaseLineForTechnician && (
                <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                        Case Line Details:
                      </p>
                      <div className="text-sm text-purple-800 dark:text-purple-200">
                        <p>• Guarantee Case ID: <span className="font-mono text-xs">{selectedCaseLineForTechnician.guaranteeCaseId}</span></p>
                        <p>• Case Line ID: <span className="font-mono text-xs">{selectedCaseLineForTechnician.caseLineId}</span></p>
                        <p>• Status: <span className="font-semibold">Ready for Repair</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <h4 className="font-medium text-sm mb-3">Available Technicians:</h4>
                {availableTechnicians.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No technicians available</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => refreshTechnicians('AVAILABLE')}
                    >
                      Load Technicians
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                    {availableTechnicians
                      .filter(tech => tech.status === 'AVAILABLE')
                      .map((tech) => {
                        const canAssign = canAssignTechnician(tech, maxWorkload);
                        const workloadWarning = !canAssign ? getWorkloadWarningMessage(tech.tasksAssignedToday || 0, maxWorkload) : "";
                        
                        return (
                          <Card 
                            key={tech.id} 
                            className={`p-4 transition-colors border-2 ${
                              !canAssign
                                ? 'opacity-50 cursor-not-allowed border-red-300 bg-red-50 dark:bg-red-900/10'
                                : 'cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-400'
                            }`}
                            onClick={() => {
                              if (!canAssign) return; // Prevent click if at max workload
                              if (selectedCaseLineForTechnician) {
                                handleAssignTechnicianToCaseLine(
                                  selectedCaseLineForTechnician.guaranteeCaseId,
                                  selectedCaseLineForTechnician.caseLineId,
                                  tech.id
                                );
                                // Modal will be closed in handleAssignTechnicianToCaseLine after success
                              }
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <h5 className="font-semibold">{tech.name}</h5>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      {typeof tech.tasksAssignedToday === 'number' && (
                                        <Badge variant={getWorkloadBadgeVariant(tech.tasksAssignedToday, maxWorkload)} className="text-xs">
                                          Tasks Today: {tech.tasksAssignedToday}
                                        </Badge>
                                      )}
                                      <span className={tech.status === 'AVAILABLE' ? 'text-green-600' : 'text-gray-600'}>
                                        {getDisplayStatus(tech.status)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground font-mono">
                                  ID: {tech.id}
                                </p>
                                {workloadWarning && (
                                  <div className="mt-2 text-xs text-red-600 font-medium">
                                    {workloadWarning}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="default"
                                size="sm"
                                disabled={!canAssign}
                                className={canAssign ? "bg-purple-600 hover:bg-purple-700" : ""}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (selectedCaseLineForTechnician && canAssign) {
                                    handleAssignTechnicianToCaseLine(
                                      selectedCaseLineForTechnician.guaranteeCaseId,
                                      selectedCaseLineForTechnician.caseLineId,
                                      tech.id
                                    );
                                    // Modal will be closed in handleAssignTechnicianToCaseLine after success
                                  }
                                }}
                              >
                                {canAssign ? 'Assign' : 'Full'}
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowTechnicianSelectionModal(false);
                  setSelectedCaseLineForTechnician(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Case Line Detail Modal */}
        <Dialog open={showCaseLineDetailModal} onOpenChange={(open) => {
          setShowCaseLineDetailModal(open);
          if (!open) {
            setSelectedCaseLineDetail(null);
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Case Line Details
              </DialogTitle>
              <DialogDescription>
                Complete information about this case line
              </DialogDescription>
            </DialogHeader>

            {loadingCaseLineIds.size > 0 && !selectedCaseLineDetail ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading case line details...</p>
              </div>
            ) : selectedCaseLineDetail ? (
              <div className="space-y-4 mt-4">
                {/* Case Line Information Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Case Line Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Case Line ID</p>
                        <p className="text-sm font-mono">{selectedCaseLineDetail.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                        <Badge variant={getCaseLineStatusVariant(selectedCaseLineDetail.status)}>
                          {getDisplayStatus(selectedCaseLineDetail.status)}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Warranty Status</p>
                        <Badge variant={selectedCaseLineDetail.warrantyStatus === 'ELIGIBLE' ? 'default' : 'destructive'}>
                          {selectedCaseLineDetail.warrantyStatus}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                        <p className="text-sm font-medium">{selectedCaseLineDetail.quantity}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <div className="p-3 bg-green-50/80 dark:bg-green-900/10 rounded border-l-2 border-green-400">
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-semibold text-sm text-green-700 dark:text-green-400">Solution</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{selectedCaseLineDetail.correctionText}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Component Information Card */}
                {selectedCaseLineDetail.typeComponent && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        Component Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Component Name</p>
                          <p className="text-sm font-medium">{selectedCaseLineDetail.typeComponent.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">SKU</p>
                          <p className="text-sm font-mono">{selectedCaseLineDetail.typeComponent.sku}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Price</p>
                          <p className="text-sm font-medium">{formatCurrency(selectedCaseLineDetail.typeComponent.price)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Guarantee Case & Vehicle Information */}
                {selectedCaseLineDetail.guaranteeCase && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Car className="h-4 w-4 text-blue-600" />
                        Guarantee Case & Vehicle Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Guarantee Case ID</p>
                        <p className="text-sm font-mono">{selectedCaseLineDetail.guaranteeCase.guaranteeCaseId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Content</p>
                        <p className="text-sm bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                          {selectedCaseLineDetail.guaranteeCase.contentGuarantee}
                        </p>
                      </div>
                      
                      {selectedCaseLineDetail.guaranteeCase.vehicleProcessingRecord && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Vehicle Details</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">VIN</p>
                              <p className="text-sm font-mono">{selectedCaseLineDetail.guaranteeCase.vehicleProcessingRecord.vin}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Processing Record ID</p>
                              <p className="text-sm font-mono text-xs">{selectedCaseLineDetail.guaranteeCase.vehicleProcessingRecord.vehicleProcessingRecordId}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Technicians Information */}
                {(selectedCaseLineDetail.diagnosticTechnician || selectedCaseLineDetail.repairTechnician) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Assigned Technicians
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedCaseLineDetail.diagnosticTechnician && (
                          <div className="p-3 bg-blue-50/80 dark:bg-blue-900/10 rounded border-l-2 border-blue-400">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">Diagnostic Technician</p>
                            <p className="text-sm font-medium">{selectedCaseLineDetail.diagnosticTechnician.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">ID: {selectedCaseLineDetail.diagnosticTechnician.userId}</p>
                          </div>
                        )}
                        
                        {selectedCaseLineDetail.repairTechnician && (
                          <div className="p-3 bg-purple-50/80 dark:bg-purple-900/10 rounded border-l-2 border-purple-400">
                            <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">Repair Technician</p>
                            <p className="text-sm font-medium">{selectedCaseLineDetail.repairTechnician.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">ID: {selectedCaseLineDetail.repairTechnician.userId}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Reservations Information */}
                {selectedCaseLineDetail.reservations && selectedCaseLineDetail.reservations.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        Component Reservations ({selectedCaseLineDetail.reservations.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-lg border overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-xs">Reservation ID</TableHead>
                              <TableHead className="text-xs">Serial Number</TableHead>
                              <TableHead className="text-xs">Component Status</TableHead>
                              <TableHead className="text-xs">Reservation Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedCaseLineDetail.reservations.map((reservation) => (
                              <TableRow key={reservation.reservationId}>
                                <TableCell className="font-mono text-xs">
                                  {reservation.reservationId.substring(0, 8)}...
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {reservation.component?.serialNumber || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      reservation.component?.status === 'INSTALLED' ? 'success' :
                                      reservation.component?.status === 'PICKED_UP' ? 'default' :
                                      'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {reservation.component?.status || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={
                                      reservation.status === 'INSTALLED' ? 'success' :
                                      reservation.status === 'PICKED_UP' ? 'default' :
                                      'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {reservation.status.replace(/_/g, ' ')}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timestamps */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Last Updated At</p>
                        <p className="text-sm">
                          {new Date(selectedCaseLineDetail.updatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No case line details available</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCaseLineDetailModal(false);
                  setSelectedCaseLineDetail(null);
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Transfer Requests List Modal */}
        <Dialog open={showStockRequestsModal} onOpenChange={(open) => {
          setShowStockRequestsModal(open);
          if (!open) {
            // Refresh data when closing modal
            fetchAllStatuses();
            fetchStockTransferRequests();
          }
        }}>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                All Stock Transfer Requests
              </DialogTitle>
              <DialogDescription>
                View all stock transfer requests from warehouses
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {isLoadingStockRequests ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading requests...</p>
                </div>
              ) : stockTransferRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No stock transfer requests found</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockTransferRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono text-xs">
                            {request.id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-sm">{request.requester?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              SC: {request.requester?.serviceCenterId?.substring(0, 8) || 'N/A'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                request.status === 'PENDING_APPROVAL' ? 'outline' :
                                request.status === 'APPROVED' ? 'default' :
                                request.status === 'SHIPPED' ? 'secondary' :
                                request.status === 'RECEIVED' ? 'success' :
                                request.status === 'REJECTED' ? 'destructive' :
                                'outline'
                              }
                              className="text-xs"
                            >
                              {request.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(request.requestedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                // Fetch full request details including case lines
                                const detailedRequest = await fetchStockTransferRequestDetail(request.id);
                                if (detailedRequest) {
                                  setSelectedStockRequest(detailedRequest);
                                } else {
                                  setSelectedStockRequest(request);
                                }
                                setShowStockRequestDetailModal(true);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Showing {stockTransferRequests.length} request{stockTransferRequests.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowStockRequestsModal(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Transfer Request Detail Modal */}
        <Dialog open={showStockRequestDetailModal} onOpenChange={(open) => {
          setShowStockRequestDetailModal(open);
          if (!open) {
            setSelectedStockRequest(null);
            // Refresh data when closing modal
            fetchAllStatuses();
            fetchStockTransferRequests();
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Stock Transfer Request Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the stock transfer request
              </DialogDescription>
            </DialogHeader>

            {selectedStockRequest && (
              <div className="space-y-6 mt-4">
                {/* Request Information */}
                <Card className="shadow-md border">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Request Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Request ID</label>
                          <p className="font-mono text-sm mt-0.5">{selectedStockRequest.id}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                          <div className="mt-1">
                            <Badge 
                              variant={
                                selectedStockRequest.status === 'PENDING_APPROVAL' ? 'outline' :
                                selectedStockRequest.status === 'APPROVED' ? 'default' :
                                selectedStockRequest.status === 'REJECTED' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {selectedStockRequest.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Requesting Warehouse</label>
                          <p className="font-medium text-sm mt-0.5">
                            {selectedStockRequest.requestingWarehouse?.name || 'Unknown Warehouse'}
                          </p>
                          {selectedStockRequest.requestingWarehouse?.address && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {selectedStockRequest.requestingWarehouse.address}
                            </p>
                          )}
                          <p className="font-mono text-xs text-muted-foreground mt-1">
                            ID: {selectedStockRequest.requestingWarehouseId}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Requester</label>
                          <p className="font-medium text-sm mt-0.5">{selectedStockRequest.requester?.name || 'Unknown'}</p>
                          {selectedStockRequest.requester?.serviceCenter?.name && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {selectedStockRequest.requester.serviceCenter.name}
                            </p>
                          )}
                          <p className="font-mono text-xs text-muted-foreground mt-1">
                            User ID: {selectedStockRequest.requestedByUserId}
                          </p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <Calendar className="h-3 w-3" />
                            Requested At
                          </label>
                          <p className="text-sm mt-0.5">
                            {new Date(selectedStockRequest.requestedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {selectedStockRequest.approvedAt && (
                          <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                              <CheckCircle className="h-3 w-3" />
                              Approved At
                            </label>
                            <p className="text-sm mt-0.5">
                              {new Date(selectedStockRequest.approvedAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                        {selectedStockRequest.rejectedAt && (
                          <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                              <XCircle className="h-3 w-3" />
                              Rejected At
                            </label>
                            <p className="text-sm mt-0.5">
                              {new Date(selectedStockRequest.rejectedAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Approver Information */}
                    {selectedStockRequest.approver && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200">
                        <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Approved By
                        </label>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            {selectedStockRequest.approver.name}
                          </p>
                          {selectedStockRequest.approver.serviceCenter?.name && (
                            <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {selectedStockRequest.approver.serviceCenter.name}
                            </p>
                          )}
                          <p className="font-mono text-xs text-green-600 dark:text-green-400">
                            User ID: {selectedStockRequest.approvedByUserId}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedStockRequest.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200">
                        <label className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">Rejection Reason</label>
                        <p className="text-sm text-red-900 dark:text-red-100 mt-1">{selectedStockRequest.rejectionReason}</p>
                      </div>
                    )}
                    {selectedStockRequest.cancellationReason && (
                      <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200">
                        <label className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase">Cancellation Reason</label>
                        <p className="text-sm text-orange-900 dark:text-orange-100 mt-1">{selectedStockRequest.cancellationReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Requested Items */}
                {selectedStockRequest.items && selectedStockRequest.items.length > 0 && (
                  <Card className="shadow-md border">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                          <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        Requested Items ({selectedStockRequest.items.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {selectedStockRequest.items.map((item, index) => {
                          // Get component info with priority: item.component (new API) > case line > typeComponent (old format)
                          let componentName = 'Unknown Component';
                          let componentDescription = '';
                          let relatedCaseLine = null;
                          
                          // Priority 1: New API response with component object
                          if (item.component?.name) {
                            componentName = item.component.name;
                          }
                          // Priority 2: Find from fetched case lines using caselineId
                          else if (item.caselineId && selectedStockRequest.caseLines) {
                            relatedCaseLine = selectedStockRequest.caseLines.find(cl => cl.id === item.caselineId);
                            if (relatedCaseLine?.typeComponent) {
                              componentName = relatedCaseLine.typeComponent.name;
                            }
                          }
                          // Priority 3: Fallback to old typeComponent format
                          else if (item.typeComponent?.nameComponent) {
                            componentName = item.typeComponent.nameComponent;
                            componentDescription = item.typeComponent.description || '';
                          }
                          
                          return (
                          <div key={item.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">Component Name</label>
                                  <p className="font-medium text-base mt-1">
                                    {componentName}
                                  </p>
                                  {componentDescription && (
                                    <p className="text-xs text-muted-foreground mt-1">{componentDescription}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {item.component?.sku && (
                                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200">
                                        <Tag className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                        <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300">
                                          {item.component.sku}
                                        </span>
                                      </div>
                                    )}
                                    {item.component?.typeComponentId && (
                                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200">
                                        <span className="font-mono text-xs text-muted-foreground">
                                          Type ID: {item.component.typeComponentId}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {item.caselineId && (
                                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
                                    <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">
                                      Case Line ID
                                    </label>
                                    <p className="font-mono text-xs text-blue-900 dark:text-blue-100 mt-1">
                                      {item.caselineId}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Quantity Requested</label>
                                <p className="font-semibold text-lg mt-1 text-blue-600 dark:text-blue-400">
                                  {item.quantityRequested}
                                </p>
                              </div>
                              {item.quantityApproved !== null && item.quantityApproved !== undefined && (
                                <div>
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">Quantity Approved</label>
                                  <p className="font-semibold text-lg mt-1 text-green-600 dark:text-green-400">
                                    {item.quantityApproved}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Case Lines Information */}
                {selectedStockRequest.caseLines && selectedStockRequest.caseLines.length > 0 && (
                  <Card className="shadow-md border">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                          <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        Related Case Lines ({selectedStockRequest.caseLines.length})
                        {selectedStockRequest.status === 'RECEIVED' && (
                          <Badge className="ml-2 bg-green-600">Stock Received - Ready to Allocate</Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {selectedStockRequest.caseLines.map((caseLine, index) => {
                          // Find the record this case line belongs to
                          let relatedRecord: WarrantyClaim | null = null;
                          for (const status in claimsByStatus) {
                            const found = claimsByStatus[status].find(claim =>
                              claim.guaranteeCases?.some(gc =>
                                gc.caseLines?.some(cl => cl.id === caseLine.id)
                              )
                            );
                            if (found) {
                              relatedRecord = found;
                              break;
                            }
                          }
                          
                          return (
                          <div 
                            key={caseLine.id} 
                            className="p-5 bg-white dark:bg-gray-800 rounded-lg border shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1 space-y-3">
                                <div>
                                  <p className="font-mono text-xs text-muted-foreground mb-2">
                                    Case Line ID: {caseLine.id}
                                  </p>
                                  {relatedRecord && (
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <p className="font-mono text-sm font-semibold text-blue-700 dark:text-blue-400">
                                          Record: {relatedRecord.recordId}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span className="font-medium">VIN: {relatedRecord.vin}</span>
                                        <span>•</span>
                                        <span>{relatedRecord.model}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={
                                      caseLine.status === 'CUSTOMER_APPROVED' || caseLine.status === 'READY_FOR_REPAIR' ? 'default' :
                                      caseLine.status === 'REJECTED_BY_CUSTOMER' ? 'destructive' :
                                      'outline'
                                    }
                                  >
                                    {caseLine.status.replace(/_/g, ' ')}
                                  </Badge>
                                  <Badge 
                                    variant={
                                      caseLine.warrantyStatus === 'APPROVED' ? 'default' :
                                      caseLine.warrantyStatus === 'REJECTED' ? 'destructive' :
                                      'outline'
                                    }
                                  >
                                    Warranty: {caseLine.warrantyStatus}
                                  </Badge>
                                </div>
                              </div>
                              {caseLine.typeComponent && (
                                <div className="text-right ml-4">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">Component</label>
                                  <p className="font-semibold text-base mt-1">{caseLine.typeComponent.name}</p>
                                  <p className="text-sm text-muted-foreground mt-1">Quantity: {caseLine.quantity}</p>
                                  {caseLine.typeComponent.category && (
                                    <p className="text-xs text-muted-foreground mt-1">Category: {caseLine.typeComponent.category}</p>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="mb-4">
                              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                                <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Solution
                                </label>
                                <p className="text-sm mt-1">{caseLine.correctionText || 'N/A'}</p>
                              </div>
                            </div>
                            
                            {caseLine.rejectionReason && (
                              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 mb-4">
                                <label className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">Rejection Reason</label>
                                <p className="text-sm text-red-900 dark:text-red-100 mt-1">{caseLine.rejectionReason}</p>
                              </div>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              {/* Show Cancel button if request is not in terminal state */}
              {selectedStockRequest && 
               selectedStockRequest.status !== 'CANCELLED' && 
               selectedStockRequest.status !== 'REJECTED' && 
               selectedStockRequest.status !== 'RECEIVED' && 
               hasPermission(user, 'attach_parts') && (
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setCancelRequestId(selectedStockRequest.id);
                    setShowCancelRequestModal(true);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Request
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowStockRequestDetailModal(false);
                  setSelectedStockRequest(null);
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Request Modal */}
        <Dialog open={showCancelRequestModal} onOpenChange={setShowCancelRequestModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Cancel Stock Transfer Request
              </DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling this request. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Enter the reason for cancelling this request..."
                  className="w-full min-h-[100px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-red-500"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {cancellationReason.length}/500 characters
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCancelRequestModal(false);
                  setCancelRequestId(null);
                  setCancellationReason('');
                }}
              >
                Keep Request
              </Button>
              <Button 
                variant="destructive"
                onClick={handleCancelStockRequest}
                disabled={!cancellationReason.trim()}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Confirm Cancellation
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Full View Modal */}
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="max-w-4xl max-h-[95vh] p-2">
            <DialogHeader>
              <DialogTitle className="text-sm">Evidence Image - Full View</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {selectedImageUrl && (
                <img
                  src={selectedImageUrl}
                  alt="Full size evidence"
                  className="max-w-full max-h-[80vh] object-contain rounded"
                />
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowImageModal(false);
                  setSelectedImageUrl(null);
                }}
              >
                Close
              </Button>
              {selectedImageUrl && (
                <Button
                  variant="default"
                  onClick={() => window.open(selectedImageUrl, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Workload Config Modal */}
        <Dialog open={showWorkloadConfigModal} onOpenChange={setShowWorkloadConfigModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Workload Configuration
              </DialogTitle>
              <DialogDescription>
                Maximum active tasks per technician for this service center
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Current Config Display */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Current Max Active Tasks
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Per technician limit
                      </p>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {maxWorkload}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Edit Section */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Update Max Workload</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={editingMaxWorkload}
                    onChange={(e) => setEditingMaxWorkload(Math.max(1, Number(e.target.value || 1)))}
                    className="w-32"
                    placeholder="Enter max tasks"
                  />
                  <span className="text-sm text-muted-foreground">tasks per technician</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Set the maximum number of active tasks a technician can handle simultaneously.
                </p>
              </div>

              {serviceCenterId && (
                <div className="text-xs text-muted-foreground p-2 bg-gray-50 dark:bg-gray-900 rounded">
                  <p>Service Center ID: <span className="font-mono">{serviceCenterId}</span></p>
                </div>
              )}

              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  ℹ️ Changing this value will affect all technician assignments. Technicians cannot be assigned more tasks than this limit.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowWorkloadConfigModal(false);
                  setEditingMaxWorkload(maxWorkload); // Reset to current value
                }}
                disabled={isSavingWorkloadConfig}
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={saveWorkloadConfig}
                disabled={isSavingWorkloadConfig || editingMaxWorkload === maxWorkload}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingWorkloadConfig ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Registration Modal */}
        <Dialog open={showRegisterModal} onOpenChange={(open) => {
          setShowRegisterModal(open);
          // Reset form when opening modal to clear any autofilled values
          if (open) {
            setRegisterForm({
              username: '',
              password: '',
              email: '',
              phone: '',
              name: '',
              address: '',
              roleId: ''
            });
            setRegisterErrors({});
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="pb-6 border-b border-gradient">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Register New User
                  </DialogTitle>
                  <DialogDescription className="text-sm mt-1 text-muted-foreground">
                    Create a new user account for this service center
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-8" ref={registerFormRef}>
              {/* Use a form with autoComplete="off" and prevent submit to discourage browser autofill */}
              <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                {/* Honeypot fields to trick browser autofill - hidden from user */}
                <div style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}>
                  <input type="text" name="username" tabIndex={-1} autoComplete="off" />
                  <input type="password" name="password" tabIndex={-1} autoComplete="new-password" />
                  <input type="email" name="email" tabIndex={-1} autoComplete="off" />
                </div>
                
                {/* Account Credentials Section */}
                <div className="mb-8">
                  <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                    Account Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20 border shadow-sm">
                    {/* Username */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Username <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="register-username"
                        autoComplete="off"
                        value={registerForm.username}
                        onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                        placeholder="e.g., tech_user123"
                        className={`transition-all ${registerErrors.username ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                      {registerErrors.username && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {registerErrors.username}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">3-50 characters, alphanumeric and underscore only</p>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="password"
                        name="register-password"
                        autoComplete="new-password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        placeholder="e.g., SecurePass123!"
                        className={`transition-all ${registerErrors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'}`}
                      />
                      {registerErrors.password && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {registerErrors.password}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Min 8 characters with uppercase, lowercase, number and special character</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div className="mb-8">
                  <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20 border shadow-sm">
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="register-fullname"
                        autoComplete="off"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        placeholder="Nguyen Van A"
                        className={`transition-all ${registerErrors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                      />
                      {registerErrors.name && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {registerErrors.name}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">2-100 characters</p>
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        name="register-email"
                        autoComplete="off"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        placeholder="user@servicecenter.com"
                        className={`transition-all ${registerErrors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                      />
                      {registerErrors.email && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {registerErrors.email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Valid email format</p>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        name="register-phone"
                        autoComplete="off"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        placeholder="0912345678"
                        className={`transition-all ${registerErrors.phone ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                      />
                      {registerErrors.phone && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {registerErrors.phone}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Format: 10-11 digits</p>
                    </div>

                    {/* Address (span full width) */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="register-address"
                        autoComplete="off"
                        value={registerForm.address}
                        onChange={(e) => setRegisterForm({ ...registerForm, address: e.target.value })}
                        placeholder="123 Nguyen Hue Street, District 1, HCMC"
                        className={`transition-all ${registerErrors.address ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                      />
                      {registerErrors.address && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {registerErrors.address}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">5-200 characters</p>
                    </div>

                    {/* Role Selection */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                        User Role <span className="text-red-500">*</span>
                      </label>
                      <Select 
                        value={registerForm.roleId} 
                        onValueChange={(value) => setRegisterForm({ ...registerForm, roleId: value })}
                        disabled={isLoadingRoles}
                      >
                        <SelectTrigger className={`transition-all ${registerErrors.roleId ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'}`}>
                          <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select a role for this user"} />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingRoles ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              Loading available roles...
                            </div>
                          ) : availableRoles.length > 0 ? (
                            // Exclude manager roles from the UI per UX request
                            availableRoles
                              .filter((role) => !String(role.roleName).toLowerCase().includes('manager'))
                              .map((role) => {
                              // Map role names to display info
                              let icon = '👤';
                              let color = 'text-gray-600';
                              let displayName = role.roleName;
                              
                              if (role.roleName.includes('technician')) {
                                icon = '🔧';
                                color = 'text-blue-600';
                                displayName = 'Technician';
                              } else if (role.roleName.includes('staff')) {
                                icon = '👔';
                                color = 'text-green-600';
                                displayName = 'Staff';
                              } else if (role.roleName.includes('parts_coordinator')) {
                                icon = '📦';
                                color = 'text-orange-600';
                                displayName = 'Parts Coordinator';
                              } else if (role.roleName.includes('manager')) {
                                icon = '👨‍💼';
                                color = 'text-purple-600';
                                displayName = 'Manager';
                              }
                              
                              return (
                                <SelectItem key={role.roleId} value={role.roleId}>
                                  <div className="flex items-center gap-2">
                                    <span className={color}>{icon}</span>
                                    <span>{displayName}</span>
                                  </div>
                                </SelectItem>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              No roles available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      {registerErrors.roleId && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <span>⚠</span> {registerErrors.roleId}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Select the role for this user account</p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowRegisterModal(false);
                  setRegisterForm({
                    username: '',
                    password: '',
                    email: '',
                    phone: '',
                    name: '',
                    address: '',
                    roleId: ''
                  });
                  setRegisterErrors({});
                }}
                disabled={isRegistering}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                variant="default"
                onClick={handleRegisterUser}
                disabled={isRegistering}
                className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
              >
                {isRegistering ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Register User
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Out of Stock Modal */}
        <Dialog open={showOutOfStockModal} onOpenChange={setShowOutOfStockModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-6 w-6" />
                Component Out of Stock
              </DialogTitle>
              <DialogDescription>
                The requested component is not available in stock
              </DialogDescription>
            </DialogHeader>

            {outOfStockInfo && (
              <div className="space-y-4">
                {/* Error Message */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900">
                    {outOfStockInfo.errorMessage}
                  </p>
                </div>

                {/* Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">What would you like to do?</h4>
                  <p className="text-sm text-blue-700">
                    You can request this component from the manufacturer. A stock transfer request will be created.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowOutOfStockModal(false);
                      setOutOfStockInfo(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      if (outOfStockInfo) {
                        handleRequestFromManufacturer(
                          outOfStockInfo.guaranteeCaseId,
                          outOfStockInfo.caseLineId,
                          outOfStockInfo.typeComponentId,
                          outOfStockInfo.quantity,
                          outOfStockInfo.availableQuantity
                        );
                        setShowOutOfStockModal(false);
                        setOutOfStockInfo(null);
                      }
                    }}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Request from Manufacturer
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ServiceCenterDashboard;
