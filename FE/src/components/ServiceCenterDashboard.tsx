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
import { API_BASE_URL } from "@/config/api";
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
  Eye
} from "lucide-react";

interface Technician {
  id: string;
  name: string;
  workload?: number; // maps to activeTaskCount
  isAvailable: boolean;
  status?: string; // AVAILABLE | UNAVAILABLE
  specialty?: string;
  experience?: number;
  rating?: number;
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
  requester?: {
    userId: string;
    name: string;
    serviceCenterId: string;
  };
  items?: Array<{
    id: string;
    quantityRequested: number;
    quantityApproved: number | null;
    typeComponentId: string;
    caselineId?: string; // Add caselineId from backend response
    typeComponent?: {
      typeComponentId: string;
      nameComponent: string;
      description: string | null;
    };
  }>;
  caseLines?: Array<{
    id: string;
    diagnosisText: string;
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
    case 'CHECKED_IN':
    case 'PENDING_DIAGNOSIS':
      return 'secondary';
    case 'WAITING_CUSTOMER_APPROVAL':
      return 'outline';
    case 'IN_PROGRESS':
    case 'IN_DIAGNOSIS':
    case 'PROCESSING':
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
  WAITING_CUSTOMER_APPROVAL: 'Waiting Customer Approval',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',

  // Technician statuses
  AVAILABLE: 'Available',
  UNAVAILABLE: 'Unavailable',

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
    'WAITING_CUSTOMER_APPROVAL',
    'PROCESSING',
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

  // Track case lines with out of stock status
  // Technician Records Modal States
  const [showTechnicianRecordsModal, setShowTechnicianRecordsModal] = useState(false);
  const [selectedTechnicianForRecords, setSelectedTechnicianForRecords] = useState<Technician | null>(null);
  const [technicianRecords, setTechnicianRecords] = useState<WarrantyClaim[]>([]);

  // Warehouse States
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [showWarehouseDetailModal, setShowWarehouseDetailModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);

  // Stock Transfer Request States
  const [showWarehouseSelectionModal, setShowWarehouseSelectionModal] = useState(false);
  const [pendingStockRequest, setPendingStockRequest] = useState<{
    caseLineId: string;
    typeComponentId: string;
    quantity: number;
    guaranteeCaseId: string;
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

  const { user, logout, getToken } = useAuth();

  // Fetch records for a specific status (moved outside useEffect to be reusable)
  const fetchForStatus = async (status: string) => {
    const url = `${API_BASE_URL}/processing-records?status=${status}`;
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
      let detailData = response.data?.data?.stockTransferRequest || null;
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
        `${API_BASE_URL}/processing-records/${claim.recordId}/assignment`,
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
    // Refresh data when closing modal
    fetchAllStatuses();
    refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
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
        alert('Component allocated successfully!');

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
        await fetchAllStatuses();
        
        // Also refresh stock transfer requests to update the mapping
        await fetchStockTransferRequests();
      }
    } catch (error: any) {
      console.error('Error allocating component:', error);
      const errorMessage = error.response?.data?.message || 'Failed to allocate component. Please try again.';

      // Check if error is 409 Conflict (out of stock)  
      if (error.response?.status === 409) {
        const shouldRequest = window.confirm(
          `⚠️ Out of Stock!\n\n${errorMessage}\n\nWould you like to request this component from manufacturer?`
        );
        
        if (shouldRequest) {
          // Find the case line to get component info
          const allCaseLines = Object.values(claimsByStatus)
            .flat()
            .flatMap(claim => claim.guaranteeCases.flatMap(gc => gc.caseLines || []));
          const caseLine = allCaseLines.find(cl => cl.id === caseLineId);
          
          if (caseLine && caseLine.typeComponent) {
            handleRequestFromManufacturer(
              guaranteeCaseId,
              caseLineId,
              caseLine.typeComponent.typeComponentId,
              caseLine.quantity
            );
          } else {
            alert('Cannot find component information to create request.');
          }
        }
      } else {
        // Show error message for other errors
        alert(`⚠️ ${errorMessage}`);
      }
    }
  };

  // Request component from manufacturer - Open warehouse selection modal
  const handleRequestFromManufacturer = async (
    guaranteeCaseId: string, 
    caseLineId: string, 
    typeComponentId: string,
    quantity: number
  ) => {
    // Store the pending request data
    setPendingStockRequest({
      caseLineId,
      typeComponentId,
      quantity,
      guaranteeCaseId
    });
    
    // Open warehouse selection modal
    setShowWarehouseSelectionModal(true);
  };

  // Assign technician to case line
  const handleAssignTechnicianToCaseLine = async (guaranteeCaseId: string, caseLineId: string, technicianId: string) => {
    try {
      const token = typeof getToken === 'function' ? getToken() : (localStorage.getItem('ev_warranty_token') || localStorage.getItem('token'));
      if (!token) {
        alert('Authentication required');
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
        alert('Technician assigned to case line successfully!');
        
        // Close modal
        setShowTechnicianSelectionModal(false);
        setSelectedCaseLineForTechnician(null);
        
        // Refresh data to update UI
        await fetchAllStatuses();
        
        // Refresh technicians list to update workload
        await refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
      }
    } catch (error: any) {
      console.error('Error assigning technician to case line:', error);
      const errorMessage = error.response?.data?.message || 'Failed to assign technician. Please try again.';
      alert(errorMessage);
    }
  };

  // Submit stock transfer request after warehouse is selected
  const submitStockTransferRequest = async (warehouseId: string) => {
    if (!pendingStockRequest) return;

    try {
      const token = typeof getToken === 'function' ? getToken() : (localStorage.getItem('ev_warranty_token') || localStorage.getItem('token'));
      if (!token) {
        alert('Authentication required');
        return;
      }

      const requestBody = {
        items: [
          {
            quantityRequested: pendingStockRequest.quantity,
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

        alert('Stock transfer request sent successfully!');
        
        // Close modal and reset
        setShowWarehouseSelectionModal(false);
        setPendingStockRequest(null);

        // Refresh data from backend to get updated status - IMPORTANT: fetch records first
        await fetchAllStatuses();
        await fetchWarehouses();
        // Refresh stock transfer requests list to include the newly created request
        await fetchStockTransferRequests();
        
        // Refresh claim detail modal with updated data from backend
        if (selectedClaimForDetail) {
          const updatedClaims = Object.values(claimsByStatus).flat();
          const updatedClaim = updatedClaims.find(c => c.vin === selectedClaimForDetail.vin);
          if (updatedClaim) {
            setSelectedClaimForDetail(updatedClaim);
          }
        }
      }
    } catch (error: any) {
      console.error('Error requesting from manufacturer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send request to manufacturer. Please try again.';
      alert(errorMessage);
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

                                {/* Assign Technician Button - Only show for CHECKED_IN status */}
                                {hasPermission(user, 'assign_technicians') && claim.status === 'CHECKED_IN' && (
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
                                                  {/* Show Allocate button based on case line status: */}
                                                  {/* 1. PARTS_AVAILABLE - stock received from manufacturer (green button) */}
                                                  {/* 2. CUSTOMER_APPROVED - first allocation from warehouse (blue button) */}
                                                  {(() => {
                                                    const isPartsAvailable = line.status === 'PARTS_AVAILABLE';
                                                    const isCustomerApproved = line.status === 'CUSTOMER_APPROVED';
                                                    
                                                    // Show allocate for PARTS_AVAILABLE (after stock received)
                                                    if (isPartsAvailable && hasPermission(user, 'attach_parts')) {
                                                      console.log(`🟢 Case line ${line.id} - PARTS_AVAILABLE, showing allocate button`);
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
                                                      console.log(`🔵 Case line ${line.id} - CUSTOMER_APPROVED, showing allocate button`);
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
                                                  
                                                  {/* Show "View Request" button if case line has active stock request (but not PARTS_AVAILABLE yet) */}
                                                  {caseLineToRequestMap.has(line.id) && line.status !== 'PARTS_AVAILABLE' && (() => {
                                                    const requestId = caseLineToRequestMap.get(line.id);
                                                    const matchingRequest = stockTransferRequests.find(req => req.id === requestId);
                                                    
                                                    console.log(`🔎 Case line ${line.id} (status: ${line.status}) - hasMapping: true, requestId:`, requestId, 'requestStatus:', matchingRequest?.status);
                                                    
                                                    // Show "View Request" button for pending requests
                                                    return (
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={async () => {
                                                          if (requestId) {
                                                            console.log('🔍 Fetching request detail for ID:', requestId);
                                                            // Ensure claims are loaded before fetching request detail
                                                            if (Object.keys(claimsByStatus).length === 0) {
                                                              console.log('⚠️ Claims not loaded, fetching now...');
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
                                                  
                                                  {/* Show status badge for other statuses (not CUSTOMER_APPROVED, PARTS_AVAILABLE, DRAFT, PENDING_APPROVAL) */}
                                                  {line.status !== 'CUSTOMER_APPROVED' && 
                                                   line.status !== 'PARTS_AVAILABLE' && 
                                                   line.status !== 'DRAFT' && 
                                                   line.status !== 'PENDING_APPROVAL' && (
                                                    <Badge variant="success" className="text-xs">
                                                      ✓ {getDisplayStatus(line.status)}
                                                    </Badge>
                                                  )}
                                                  
                                                  {/* Show "Assign Technician" button if status is READY_FOR_REPAIR */}
                                                  {line.status === 'READY_FOR_REPAIR' && hasPermission(user, 'assign_technicians') && (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        console.log('👷 Opening technician selection for case line:', {
                                                          guaranteeCaseId: gc.guaranteeCaseId,
                                                          caseLineId: line.id
                                                        });
                                                        setSelectedCaseLineForTechnician({
                                                          guaranteeCaseId: gc.guaranteeCaseId,
                                                          caseLineId: line.id
                                                        });
                                                        setShowTechnicianSelectionModal(true);
                                                      }}
                                                      className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 text-xs h-6 px-2"
                                                    >
                                                      <User className="h-3 w-3 mr-1" />
                                                      Assign Technician
                                                    </Button>
                                                  )}
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

        {/* Warehouse Detail Modal */}
        <Dialog open={showWarehouseDetailModal} onOpenChange={setShowWarehouseDetailModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Warehouse Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the warehouse
              </DialogDescription>
            </DialogHeader>

            {selectedWarehouse && (
              <div className="space-y-6 mt-4">
                {/* Basic Information */}
                <Card className="shadow-md border">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Warehouse ID</label>
                          <p className="font-mono text-sm font-semibold mt-0.5">{selectedWarehouse.warehouseId}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Name</label>
                          <p className="text-sm font-medium mt-0.5">{selectedWarehouse.name}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <MapPin className="h-3 w-3" />
                            Address
                          </label>
                          <p className="text-sm font-medium mt-0.5">{selectedWarehouse.address}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Priority</label>
                          <div className="mt-1">
                            <Badge 
                              variant={selectedWarehouse.priority === 1 ? 'default' : selectedWarehouse.priority === 2 ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              Priority {selectedWarehouse.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Service Center ID</label>
                          <p className="font-mono text-sm mt-0.5">{selectedWarehouse.serviceCenterId || selectedWarehouse.service_center_id || '-'}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Vehicle Company ID</label>
                          <p className="font-mono text-sm mt-0.5">{selectedWarehouse.vehicleCompanyId || selectedWarehouse.vehicle_company_id || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card className="shadow-md border">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                        <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                          <Calendar className="h-3 w-3" />
                          Created At
                        </label>
                        <p className="text-sm font-medium mt-0.5">
                          {new Date(selectedWarehouse.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                          <Calendar className="h-3 w-3" />
                          Updated At
                        </label>
                        <p className="text-sm font-medium mt-0.5">
                          {new Date(selectedWarehouse.updatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
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
                    {warehouses.map((warehouse) => (
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
                    ))}
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
                    {availableTechnicians.map((tech) => (
                      <Card 
                        key={tech.id} 
                        className="p-4 cursor-pointer transition-colors hover:bg-purple-50 dark:hover:bg-purple-900/20 border-2 hover:border-purple-400"
                        onClick={() => {
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
                                  {typeof tech.workload === 'number' && (
                                    <Badge variant="outline" className="text-xs">
                                      Active Tasks: {tech.workload}
                                    </Badge>
                                  )}
                                  {tech.status && (
                                    <Badge 
                                      variant={tech.status === 'AVAILABLE' ? 'default' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {tech.status}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">
                              ID: {tech.id}
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700"
                            onClick={(e) => {
                              e.stopPropagation();
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
                            Assign
                          </Button>
                        </div>
                      </Card>
                    ))}
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
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Requesting Warehouse ID</label>
                          <p className="font-mono text-sm mt-0.5">{selectedStockRequest.requestingWarehouseId}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Requester</label>
                          <p className="font-medium text-sm mt-0.5">{selectedStockRequest.requester?.name || 'Unknown'}</p>
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
                          // Find component info from case line using caselineId
                          let componentName = 'Unknown Component';
                          let componentDescription = '';
                          let relatedCaseLine = null;
                          
                          // First try to find from fetched case lines using caselineId
                          if (item.caselineId && selectedStockRequest.caseLines) {
                            relatedCaseLine = selectedStockRequest.caseLines.find(cl => cl.id === item.caselineId);
                            if (relatedCaseLine?.typeComponent) {
                              componentName = relatedCaseLine.typeComponent.name;
                            }
                          }
                          
                          // Fallback to API response if available
                          if (componentName === 'Unknown Component' && item.typeComponent?.nameComponent) {
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
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                  <FileText className="h-3 w-3" />
                                  Diagnosis
                                </label>
                                <p className="text-sm mt-1">{caseLine.diagnosisText || 'N/A'}</p>
                              </div>
                              <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                                <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                                  <Wrench className="h-3 w-3" />
                                  Correction
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
      </div>
    </div>
  );
};

export default ServiceCenterDashboard;
