import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AxiosResponse } from "axios";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/utils/api";
import { toast } from "@/hooks/use-toast";
import { processingRecordsService, ProcessingRecord, ProcessingRecordsByStatus } from "@/services/processingRecordsService";

// Case Line Request interface (moved from caseLineService.ts)
interface CaseLineRequest {
  diagnosisText: string;
  correctionText: string;
  componentId?: string | null;
  quantity: number;
  warrantyStatus: 'ELIGIBLE' | 'INELIGIBLE';
  rejectionReason?: string;
  evidenceImageUrls?: string[];
}
import {
  Wrench,
  FileText,
  User,
  Search,
  LogOut,
  Camera,
  Eye,
  Edit,
  Settings,
  Zap,
  Palette,
  X,
  SearchIcon,
  Plus,
  Car,
  Calendar,
  Gauge,
  AlertCircle,
  RefreshCw,
  Package,
  Trash,
  Users,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Friendly labels and badge variants for case-line statuses (defined outside component for stability)
const CASELINE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  CUSTOMER_APPROVED: 'Customer Approved',
  READY_FOR_REPAIR: 'Ready For Repair',
  IN_REPAIR: 'In Repair',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
};

const getCaseLineStatusLabel = (status?: string | null): string => {
  if (!status) return 'N/A';
  return CASELINE_STATUS_LABELS[status] ?? status.replace(/_/g, ' ');
};

const getCaseLineBadgeVariant = (status?: string | null): 'default' | 'secondary' | 'outline' | 'destructive' => {
  if (!status) return 'secondary';
  switch (status) {
    case 'DRAFT':
      return 'secondary';
    case 'PENDING_APPROVAL':
    case 'PENDING':
      return 'outline';
    case 'READY_FOR_REPAIR':
      return 'default';
    case 'IN_REPAIR':
      return 'default';
    case 'COMPLETED':
      return 'default';
    case 'CANCELLED':
      return 'destructive';
    default:
      return 'secondary';
  }
};

// Work Schedule Interface
interface WorkSchedule {
  scheduleId: string;
  technicianId: string;
  workDate: string; // YYYY-MM-DD
  status: 'AVAILABLE' | 'UNAVAILABLE' | string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  technician_id?: string;
  technician?: {
    userId: string;
    name: string;
    email?: string;
  } | null;
}

type WorkSchedulesResponse = {
  status?: string;
  data: WorkSchedule[];
} | WorkSchedule[];

// API Interface cho Guarantee Cases

interface GuaranteeCase {
  guaranteeCaseId: string;
  contentGuarantee: string;
  status: string;
  recordId: string;
  createdAt: string;
}

interface CaseLineResponse {
  caseLineId: string;
  guaranteeCaseId: string;
  diagnosisText: string;
  correctionText: string;
  componentId: string | null;
  quantity: number;
  warrantyStatus: string;
  techId: string;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  // Optional fields that may appear in different backend shapes
  typeComponentId?: string | null;
  repairTechId?: string | null;
  rejectionReason?: string | null;
  evidenceImageUrls?: string[];
}

// Assigned Tasks Interfaces
interface AssignedCaseLine {
  id: string;
  correctionText: string;
  typeComponentId: string;
  quantity: number;
  warrantyStatus: string;
  status: string;
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
  // Optional shorthand diagnostic tech object (used by processingCaseLines mapping)
  diagnosticTech?: {
    userId?: string;
    name?: string;
    fullName?: string;
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
  reservations?: ComponentReservation[];
}

interface ComponentReservation {
  reservationId: string;
  caseLineId: string;
  componentId: string;
  status: string;
  pickedUpBy?: string | null;
  pickedUpAt?: string | null;
  installedAt?: string | null;
  oldComponentSerial?: string | null;
  oldComponentReturned?: boolean;
  returnedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  component?: {
    componentId: string;
    serialNumber: string;
    status: string;
    warehouseId?: string | null;
    typeComponentId: string;
    warehouse?: {
      warehouseId: string;
      name: string;
      address: string;
    };
  };
  pickedUpByTech?: {
    userId: string;
    name: string;
    email: string;
    phone: string;
  };
  caseLine?: {
    id: string;
    guaranteeCaseId: string;
    typeComponentId: string;
    quantity: number;
    status: string;
    diagnosticTechId?: string;
    repairTechId?: string;
    diagnosticTechnician?: {
      userId: string;
      name: string;
      email: string;
      phone: string;
    };
    repairTechnician?: {
      userId: string;
      name: string;
      email: string;
      phone: string;
    };
    guaranteeCase?: {
      guaranteeCaseId: string;
      vehicleProcessingRecordId: string;
      status: string;
      vehicleProcessingRecord?: {
        vehicleProcessingRecordId: string;
        vin: string;
        createdByStaffId: string;
        createdByStaff?: {
          userId: string;
          serviceCenterId?: string;
          name: string;
        };
      };
    };
  };
}

// Legacy interfaces for existing Issue Diagnosis tab functionality
interface CaseLine {
  id: string;
  caseId: string;
  damageLevel: string;
  repairPossibility: string;
  warrantyDecision: string;
  technicianNotes: string;
  photos: string[];
  photoFiles?: File[];
  createdDate: string;
  status: string;
  // Additional fields from API response
  diagnosisText?: string;
  correctionText?: string;
  componentId?: string | null;
  // Friendly component info populated when viewing details
  componentName?: string | null;
  componentSku?: string | null;
  componentPrice?: number | null;
  typeComponentId?: string | null;
  quantity?: number;
  warrantyStatus?: string;
  diagnosticTechId?: string;
  repairTechId?: string;
  diagnosticTechnicianName?: string | null;
  repairTechnicianName?: string | null;
  rejectionReason?: string | null;
  updatedAt?: string;
  evidenceImageUrls?: string[];
  guaranteeCaseId?: string; // Add guarantee case ID for proper display
  
  // New fields from API response
  guaranteeCase?: {
    guaranteeCaseId: string;
    caseNumber?: string;
    contentGuarantee: string;
    status: string;
    vehicleProcessingRecord?: {
      vehicleProcessingRecordId: string;
      vin: string;
      createdByStaff?: {
        userId: string;
        serviceCenterId: string;
        serviceCenter?: {
          serviceCenterId: string;
          vehicleCompanyId: string;
        };
      };
    };
  };
  typeComponent?: {
    typeComponentId: string;
    sku: string;
    name: string;
    price: number;
  };
  diagnosticTechnician?: {
    userId: string;
    name: string;
  };
  diagnosticTech?: {
    userId?: string;
    name?: string;
    fullName?: string;
  };
  repairTechnician?: {
    userId: string;
    name: string;
  };
  reservations?: Array<{
    reservationId: string;
    caseLineId: string;
    status: string;
    component: {
      componentId: string;
      serialNumber: string;
      status: string;
      warehouse: {
        warehouseId: string;
        name: string;
        address: string;
      };
    };
  }>;
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
  const [viewCaseLineModalOpen, setViewCaseLineModalOpen] = useState(false);
  const [selectedCaseLine, setSelectedCaseLine] = useState<CaseLine | null>(null);
  const [imagePreviewModalOpen, setImagePreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [caseLines, setCaseLines] = useState<CaseLine[]>([]);
  // Processing Records state
  const [processingRecords, setProcessingRecords] = useState<ProcessingRecord[]>([]);
  const [recordsByStatus, setRecordsByStatus] = useState<ProcessingRecordsByStatus>({
    CHECKED_IN: [],
    IN_DIAGNOSIS: [],
    WAITING_CUSTOMER_APPROVAL: [],
    WAITING_FOR_PARTS: [],
    IN_REPAIR: [],
    COMPLETED: [],
    PAID: [],
    CANCELLED: [],
  });
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [consecutiveRecordErrors, setConsecutiveRecordErrors] = useState<number>(0);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [processingCaseLines, setProcessingCaseLines] = useState<CaseLine[]>([]);
  const [isLoadingProcessing, setIsLoadingProcessing] = useState(false);
  
  // Pagination state for case lines
  const [caseLinePage, setCaseLinePage] = useState(1);
  const [caseLineLimit] = useState(10);
  const [caseLineTotalPages, setCaseLineTotalPages] = useState(1);
  const [caseLineTotal, setCaseLineTotal] = useState(0);

  // Processing Records View states
  const [selectedRecord, setSelectedRecord] = useState<ProcessingRecord | null>(null);
  const [viewCaseModalOpen, setViewCaseModalOpen] = useState(false);
  const [createIssueDiagnosisModalOpen, setCreateIssueDiagnosisModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Loading state for completing a processing record
  const [isCompleting, setIsCompleting] = useState(false);
  // Selected guarantee case for creating case line
  const [selectedGuaranteeCaseForCaseLine, setSelectedGuaranteeCaseForCaseLine] = useState<string | null>(null);
  
  
  // Processing Records form (uses CaseLineRequest for API)
  const [caseLineForm, setCaseLineForm] = useState<CaseLineRequest>({
    diagnosisText: '',
    correctionText: '',
    componentId: null,
    quantity: 0,
    warrantyStatus: 'ELIGIBLE',
    rejectionReason: ''
  });



  // Compatible components for Processing Records modal
  const [compatibleComponents, setCompatibleComponents] = useState<Array<{ typeComponentId: string; name: string; isUnderWarranty: boolean; availableQuantity?: number }>>([]);
  const [componentSearchQuery, setComponentSearchQuery] = useState<string>("");
  const [selectedComponentWarranty, setSelectedComponentWarranty] = useState<boolean | null>(null);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);

  // Assigned Tasks state
  const [assignedCaseLines, setAssignedCaseLines] = useState<AssignedCaseLine[]>([]);
  const [isLoadingAssignedTasks, setIsLoadingAssignedTasks] = useState(false);
  const [selectedAssignedCaseLine, setSelectedAssignedCaseLine] = useState<AssignedCaseLine | null>(null);
  const [viewAssignedCaseLineModalOpen, setViewAssignedCaseLineModalOpen] = useState(false);
  const [reservations, setReservations] = useState<ComponentReservation[]>([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [viewReservationsModalOpen, setViewReservationsModalOpen] = useState(false);
  const [installingReservationId, setInstallingReservationId] = useState<string | null>(null);
  const [completingCaseLineId, setCompletingCaseLineId] = useState<string | null>(null);
  
  // Pagination state for reservations in assigned case line modal
  const [reservationsPage, setReservationsPage] = useState(1);
  const [reservationsPerPage] = useState(5);
  
  // Pagination state for View Reservations modal
  const [viewReservationsPage, setViewReservationsPage] = useState(1);
  const [viewReservationsPerPage] = useState(10);

  // Update Case Line modal state
  const [updateCaseLineModalOpen, setUpdateCaseLineModalOpen] = useState(false);
  const [isUpdatingCaseLine, setIsUpdatingCaseLine] = useState(false);
  const [updateComponentSearchQuery, setUpdateComponentSearchQuery] = useState('');
  const [updateSelectedComponentWarranty, setUpdateSelectedComponentWarranty] = useState<boolean | null>(null);
  const [updateCaseLineForm, setUpdateCaseLineForm] = useState({
    correctionText: '',
    typeComponentId: '',
    quantity: 0,
    warrantyStatus: 'ELIGIBLE',
    rejectionReason: ''
  });

  // Delete Case Line modal state
  const [deleteCaseLineModalOpen, setDeleteCaseLineModalOpen] = useState(false);
  const [caseLineToDelete, setCaseLineToDelete] = useState<string | null>(null);
  const [isDeletingCaseLine, setIsDeletingCaseLine] = useState(false);



  // State for API data
  const [selectedGuaranteeCase, setSelectedGuaranteeCase] = useState<GuaranteeCase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('processing-records');
  const [activeProcessingStatus, setActiveProcessingStatus] = useState<'IN_DIAGNOSIS' | 'WAITING_CUSTOMER_APPROVAL' | 'PROCESSING'>('IN_DIAGNOSIS');
  const [createdCaseLines, setCreatedCaseLines] = useState<CaseLineResponse[]>([]);
  // Work schedules state
  const [workSchedules, setWorkSchedules] = useState<WorkSchedule[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  // Helper: robustly extract a canonical caseLineId from various API shapes
  const extractCaseLineId = React.useCallback((obj: unknown): string | null => {
    if (!obj || typeof obj !== 'object') return null;
    const o = obj as Record<string, unknown>;
    const val = o['caseLineId'] ?? o['id'] ?? o['case_line_id'] ?? o['caseLine_Id'];
    if (typeof val === 'string' && val.length > 0) return val;
    if (typeof val === 'number') return String(val);
    return null;
  }, []);

  // Helper: normalize various backend shapes into CaseLineResponse (best-effort)
  const normalizeCaseLineResponse = React.useCallback((raw: unknown): CaseLineResponse | null => {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const caseLineId = extractCaseLineId(r);
    if (!caseLineId) return null;
    const guaranteeCaseId = (r['guaranteeCaseId'] ?? r['guarantee_case_id'] ?? (r['guaranteeCase'] && (r['guaranteeCase'] as Record<string, unknown>)['guaranteeCaseId'])) as string | undefined ?? '';
  // Diagnosis is no longer used/displayed in the UI; ignore any incoming diagnosisText
  const diagnosisText = '';
  const correctionText = (r['correctionText'] ?? r['correction_text']) as string | undefined ?? '';
    const componentId = (r['componentId'] ?? r['typeComponentId'] ?? r['type_component_id']) as string | null ?? null;
    const quantity = (typeof r['quantity'] === 'number' ? r['quantity'] as number : Number(r['quantity'] ?? 0)) as number;
    const warrantyStatus = (r['warrantyStatus'] ?? r['warranty_status']) as string | undefined ?? null;
    const createdAt = (r['createdAt'] ?? r['created_at']) as string | undefined ?? null;
    const updatedAt = (r['updatedAt'] ?? r['updated_at']) as string | undefined ?? null;
    // diagnostic technician may be present as a flat field (diagnosticTechId)
    // or as a nested object (diagnosticTechnician: { userId }). Read both.
    const techIdFromFlat = (r['techId'] ?? r['diagnosticTechId'] ?? r['diagnostic_tech_id']) as string | undefined ?? null;
    const diagObj = r['diagnosticTechnician'] ?? r['diagnostic_technician'] ?? null;
    const techIdFromNested = diagObj && typeof diagObj === 'object' ? ((diagObj as Record<string, unknown>)['userId'] ?? (diagObj as Record<string, unknown>)['user_id']) as string | undefined ?? null : null;

    const techId = techIdFromFlat || techIdFromNested || null;

    return {
      caseLineId,
      guaranteeCaseId,
      diagnosisText,
      correctionText,
      componentId,
      quantity,
      warrantyStatus: (warrantyStatus as 'ELIGIBLE' | 'INELIGIBLE' | null),
      techId,
      status: (r['status'] as string) ?? null,
      createdAt,
      updatedAt,
    } as CaseLineResponse;
  }, [extractCaseLineId]);

  // Load persisted created case lines from localStorage on mount so UI survives F5
  useEffect(() => {
    try {
      const raw = localStorage.getItem('ev_created_caselines');
      if (raw) {
        const parsed = JSON.parse(raw) as CaseLineResponse[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCreatedCaseLines(parsed);
          // Also map into lightweight UI caseLines for display
          setCaseLines(prev => {
            const existing = new Set(prev.map(c => c.id));
            const toAdd = (parsed as unknown[]).map((cl) => {
              const mm = cl as Record<string, unknown>;
              const id = (mm['caseLineId'] ?? mm['id'] ?? mm['case_line_id']) as string | undefined || '';
              const caseId = (mm['guaranteeCaseId'] ?? mm['guarantee_case_id'] ?? mm['guaranteeCaseId']) as string | undefined || '';
              const damageLevel = 'N/A'; // Backend does not store damageLevel
              const warrantyStatus = (mm['warrantyStatus'] as string) ?? (mm['warranty_status'] as string) ?? null;
              // Backend only returns correctionText (no diagnosisText)
              const corr = (mm['correctionText'] ?? mm['correction_text']) as string | undefined || '';
              const photos = Array.isArray(mm['photos']) ? (mm['photos'] as string[]) : [];
              const createdAtRaw = mm['createdAt'] ?? mm['created_at'];
              const createdAt = createdAtRaw ? formatSafeDate(String(createdAtRaw)) : formatSafeDate(new Date());

              return {
                id,
                caseId,
                damageLevel,
                repairPossibility: 'N/A',
                warrantyDecision: warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
                technicianNotes: corr, // Use correctionText as technician notes
                photos,
                createdDate: createdAt,
                status: (mm['status'] as string) ?? 'submitted'
              } as CaseLine;
            }).filter((c: CaseLine) => c.id && !existing.has(c.id));

            return [...prev, ...toAdd];
          });
        }
      }
    } catch (err) {
      console.warn('Could not restore created case lines from localStorage', err);
    }
  }, []);

  // Persist createdCaseLines to localStorage so refresh doesn't lose UI state
  useEffect(() => {
    try {
      localStorage.setItem('ev_created_caselines', JSON.stringify(createdCaseLines));
    } catch (err) {
      console.warn('Failed to persist createdCaseLines to localStorage', err);
    }
  }, [createdCaseLines]);

  const { user, logout } = useAuth();

  // API Functions
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Helper function to get token
  const getAuthToken = () => {
    const token = localStorage.getItem('ev_warranty_token');
    // avoid logging tokens to console; signal auth presence only
    if (!token) {
    
      toast({
        title: "Authentication Error",
        description: "No authentication token found. Please login again.",
        variant: "destructive"
      });
      return null;
    }
    return token;
  };

  // Generic API call function with error handling
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token');
    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    };

    

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    

    // If no content, return null to caller
    if (response.status === 204) return null;

    // Try to parse JSON only when content-type is JSON
    const contentType = response.headers.get('content-type') || '';
  let body: unknown = null;
    if (contentType.includes('application/json')) {
      try {
        body = await response.json();
      } catch (err) {
        // Parsing failed - treat as null payload but surface a helpful error for non-ok
        body = null;
      }
    }

    if (!response.ok) {
      const msgFromBody = (body && typeof body === 'object' && 'message' in (body as Record<string, unknown>)) ? ((body as Record<string, unknown>)['message'] as string) : undefined;
      const message = msgFromBody || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(message);
    }

    return body;
  }, []);

  // Fetch all processing records using axios service
  const fetchAllProcessingRecords = useCallback(async () => {
    try {
      setIsLoadingRecords(true);
      setRecordsError(null);
      
      
      // Get all records
      const { records: allRecords, total } = await processingRecordsService.getAllProcessingRecords();
      setProcessingRecords(allRecords);
      
      // Group records by status
      const groupedRecords = await processingRecordsService.getProcessingRecordsGroupedByStatus();
      setRecordsByStatus(groupedRecords);
      
      
      toast({
        title: "Success",
        description: `Loaded ${allRecords.length} processing records`,
      });
    } catch (error) {
      console.error('Error fetching processing records:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch processing records";
      setRecordsError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  // Fetch case lines with PROCESSING status
  const fetchProcessingCaseLines = useCallback(async (page: number = 1) => {
    try {
      setIsLoadingProcessing(true);
      const token = getAuthToken();
      
      if (!token) {
        setIsLoadingProcessing(false);
        return;
      }

      const url = `https://dongthanhswp.space/api/v1/case-lines?page=${page}&limit=${caseLineLimit}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Map case lines from paginated API response
      const allCaseLines: any[] = [];
      
      if (result?.data?.caseLines && Array.isArray(result.data.caseLines)) {
        result.data.caseLines.forEach((caseLine: any) => {
          const mappedCaseLine = {
            id: caseLine.id,
            typeComponentId: caseLine.typeComponentId || caseLine.type_component_id,
            correctionText: caseLine.correctionText,
            warrantyStatus: caseLine.warrantyStatus,
            status: caseLine.status,
            quantity: caseLine.quantity,
            rejectionReason: caseLine.rejectionReason,
            diagnosticTechId: caseLine.diagnosticTechId || caseLine.diagnostic_tech_id,
            repairTechId: caseLine.repairTechId || caseLine.repair_tech_id,
            caseId: caseLine.guaranteeCaseId || caseLine.guarantee_case_id,
            // Type component info
            typeComponent: caseLine.typeComponent ? {
              typeComponentId: caseLine.typeComponent.typeComponentId,
              name: caseLine.typeComponent.name,
              category: caseLine.typeComponent.category,
              sku: caseLine.typeComponent.sku || '',
              price: caseLine.typeComponent.price || 0
            } : null,
            // Guarantee case info with case number
            guaranteeCase: caseLine.guaranteeCase ? {
              guaranteeCaseId: caseLine.guaranteeCase.guaranteeCaseId,
              caseNumber: `GC-${caseLine.guaranteeCase.guaranteeCaseId.substring(0, 8)}`,
              contentGuarantee: caseLine.guaranteeCase.contentGuarantee,
              status: caseLine.guaranteeCase.status,
              vehicleProcessingRecord: caseLine.guaranteeCase.vehicleProcessingRecord ? {
                vehicleProcessingRecordId: caseLine.guaranteeCase.vehicleProcessingRecord.vehicleProcessingRecordId,
                vin: caseLine.guaranteeCase.vehicleProcessingRecord.vin
              } : undefined
            } : undefined,
            // Diagnostic tech info
            diagnosticTech: caseLine.diagnosticTechnician ? {
              userId: caseLine.diagnosticTechnician.userId,
              name: caseLine.diagnosticTechnician.name
            } : undefined
          };
          
          allCaseLines.push(mappedCaseLine);
        });
      }

      // Update pagination info
      if (result?.data?.pagination) {
        const pagination = result.data.pagination;
        setCaseLinePage(pagination.page || 1);
        setCaseLineTotalPages(pagination.totalPages || 1);
        setCaseLineTotal(pagination.total || 0);
      }

      setProcessingCaseLines(allCaseLines);
      
    } catch (error) {
      console.error('❌ Error fetching processing case lines:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch processing case lines',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingProcessing(false);
    }
  }, []);

  // Fetch case line details by ID for Processing records
  const fetchCaseLineDetails = useCallback(async (caseLineId: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: 'Error',
          description: 'No authentication token found',
          variant: 'destructive'
        });
        return null;
      }

      const response = await fetch(`https://dongthanhswp.space/api/v1/case-lines/${caseLineId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If 404, remove from local state as it was deleted
        if (response.status === 404) {
          setCreatedCaseLines(prev => prev.filter(cl => cl.caseLineId !== caseLineId));
          toast({
            title: 'Case Line Not Found',
            description: 'This case line has been deleted and will be removed from the list.',
            variant: 'destructive'
          });
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data?.data?.caseLine) {
        const cl = data.data.caseLine;
        // Map to the format expected by the modal
        return {
          id: cl.id,
          correctionText: cl.correctionText,
          typeComponentId: cl.typeComponentId,
          quantity: cl.quantity,
          warrantyStatus: cl.warrantyStatus,
          status: cl.status,
          rejectionReason: cl.rejectionReason,
          updatedAt: cl.updatedAt,
          componentName: cl.typeComponent?.name,
          componentSku: cl.typeComponent?.sku,
          componentPrice: cl.typeComponent?.price,
          diagnosticTechnicianName: cl.diagnosticTechnician?.name,
          repairTechnicianName: cl.repairTechnician?.name,
          guaranteeCaseId: cl.guaranteeCase?.guaranteeCaseId,
          guaranteeCase: cl.guaranteeCase ? {
            guaranteeCaseId: cl.guaranteeCase.guaranteeCaseId,
            contentGuarantee: cl.guaranteeCase.contentGuarantee,
            status: cl.guaranteeCase.status,
            vehicleProcessingRecord: cl.guaranteeCase.vehicleProcessingRecord
          } : undefined,
          typeComponent: cl.typeComponent,
          diagnosticTechnician: cl.diagnosticTechnician,
          repairTechnician: cl.repairTechnician,
          reservations: cl.reservations || []
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching case line details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch case line details',
        variant: 'destructive'
      });
      return null;
    }
  }, []);

  // Update case line function
  const updateCaseLine = useCallback(async (guaranteeCaseId: string, caseLineId: string, data: {
    correctionText: string;
    typeComponentId: string;
    quantity: number;
    warrantyStatus: string;
    rejectionReason: string;
  }) => {
    try {
      console.log('updateCaseLine called with:', { guaranteeCaseId, caseLineId, data });
      setIsUpdatingCaseLine(true);
      const token = getAuthToken();
      if (!token) {
        console.error('No token found');
        toast({
          title: 'Error',
          description: 'No authentication token found',
          variant: 'destructive'
        });
        return;
      }

      console.log('Calling API PATCH /guarantee-cases/' + guaranteeCaseId + '/case-lines/' + caseLineId);
      
      // Build sanitized payload - only include fields with valid values
      const payload: Record<string, any> = {
        correctionText: data.correctionText,
        warrantyStatus: data.warrantyStatus,
      };
      
      // Only include typeComponentId if it has a value (not empty string)
      if (data.typeComponentId && data.typeComponentId.trim()) {
        payload.typeComponentId = data.typeComponentId;
        payload.quantity = data.quantity;
      } else {
        // If no component, set to null and quantity to 0
        payload.typeComponentId = null;
        payload.quantity = 0;
      }
      
      // Only include rejectionReason if it's not empty
      if (data.rejectionReason && data.rejectionReason.trim()) {
        payload.rejectionReason = data.rejectionReason;
      }
      
      console.log('Sanitized payload:', payload);
      
      const response = await apiService.patch(
        `/guarantee-cases/${guaranteeCaseId}/case-lines/${caseLineId}`,
        payload
      );

      console.log('API response:', response);

      if (response?.data) {
        console.log('Update successful');
        toast({
          title: 'Success',
          description: 'Case line updated successfully',
        });
        
        // Refresh data and update selectedCaseLine to reflect changes in UI
        const updatedCaseLine = await fetchCaseLineDetails(caseLineId);
        if (updatedCaseLine) {
          // Map the detailed case line to CaseLine format for selectedCaseLine
          const mappedCaseLine: CaseLine = {
            id: updatedCaseLine.id,
            caseId: updatedCaseLine.guaranteeCaseId || '',
            guaranteeCaseId: updatedCaseLine.guaranteeCaseId,
            damageLevel: 'medium',
            repairPossibility: 'repairable',
            warrantyDecision: updatedCaseLine.warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
            technicianNotes: updatedCaseLine.correctionText,
            photos: (updatedCaseLine as any).evidenceImageUrls || [],
            evidenceImageUrls: (updatedCaseLine as any).evidenceImageUrls || [],
            createdDate: formatSafeDate(updatedCaseLine.updatedAt),
            status: updatedCaseLine.status ?? 'submitted',
            diagnosisText: '',
            correctionText: updatedCaseLine.correctionText,
            componentId: updatedCaseLine.typeComponentId,
            componentName: updatedCaseLine.componentName,
            componentSku: updatedCaseLine.componentSku,
            componentPrice: updatedCaseLine.componentPrice,
            quantity: updatedCaseLine.quantity,
            warrantyStatus: updatedCaseLine.warrantyStatus,
            diagnosticTechId: undefined,
            diagnosticTechnicianName: updatedCaseLine.diagnosticTechnicianName,
            repairTechnicianName: updatedCaseLine.repairTechnicianName,
            rejectionReason: updatedCaseLine.rejectionReason,
            updatedAt: updatedCaseLine.updatedAt,
            guaranteeCase: updatedCaseLine.guaranteeCase,
            typeComponent: updatedCaseLine.typeComponent,
            diagnosticTechnician: updatedCaseLine.diagnosticTechnician,
            repairTechnician: updatedCaseLine.repairTechnician,
            reservations: updatedCaseLine.reservations || []
          };
          setSelectedCaseLine(mappedCaseLine);
        }
        setUpdateCaseLineModalOpen(false);
        
        return response.data;
      } else {
        console.warn('Unexpected response:', response);
      }
    } catch (error) {
      console.error('Error updating case line:', error);
      
      // Log detailed error information
      if (error instanceof Error) {
        const axiosError = error as any;
        if (axiosError.response) {
          console.error('API Error Response:', axiosError.response.data);
          console.error('API Error Status:', axiosError.response.status);
          
          toast({
            title: 'Error',
            description: axiosError.response.data?.message || 'Failed to update case line',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to update case line',
            variant: 'destructive'
          });
        }
      }
    } finally {
      setIsUpdatingCaseLine(false);
    }
  }, []);

  // Delete case line function
  const deleteCaseLine = useCallback(async (caseLineId: string) => {
    try {
      setIsDeletingCaseLine(true);
      const token = getAuthToken();
      if (!token) {
        console.error('No token found');
        toast({
          title: 'Error',
          description: 'No authentication token found',
          variant: 'destructive'
        });
        return false;
      }

      const response = await axios.delete(
        `https://dongthanhswp.space/api/v1/case-lines/${caseLineId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 200 || response.status === 204) {
        // Remove from local state
        setCreatedCaseLines(prev => prev.filter(cl => cl.caseLineId !== caseLineId));
        
        toast({
          title: 'Success',
          description: 'Case line deleted successfully',
        });
        
        setDeleteCaseLineModalOpen(false);
        setCaseLineToDelete(null);
        return true;
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete case line',
          variant: 'destructive'
        });
        return false;
      }
    } catch (error) {
      console.error('Error deleting case line:', error);
      
      if (error instanceof Error) {
        const axiosError = error as any;
        if (axiosError.response) {
          console.error('API Error Response:', axiosError.response.data);
          console.error('API Error Status:', axiosError.response.status);
          
          toast({
            title: 'Error',
            description: axiosError.response.data?.message || 'Failed to delete case line',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Error',
            description: 'Failed to delete case line',
            variant: 'destructive'
          });
        }
      }
      return false;
    } finally {
      setIsDeletingCaseLine(false);
    }
  }, []);

  // Fetch processing records with WAITING_CUSTOMER_APPROVAL status
  const fetchWaitingCustomerApprovalRecords = useCallback(async () => {
    try {
      setIsLoadingRecords(true);
      const { records: waitingRecords, total } = await processingRecordsService.getProcessingRecordsByStatus({ status: 'WAITING_CUSTOMER_APPROVAL' });

      // Normalize record id field
      const normalized: ProcessingRecord[] = (waitingRecords || []).map((r: unknown) => {
        const rr = r as Record<string, unknown>;
        const getStr = (key: string) => {
          const v = rr[key];
          if (typeof v === 'string') return v;
          if (v == null) return '';
          try { return String(v); } catch { return ''; }
        };

        const recordIdValue = getStr('id') || getStr('vehicleProcessingRecordId') || getStr('processing_record_id') || getStr('recordId') || '';
        const merged = Object.assign({}, rr, { recordId: recordIdValue });
        return merged as unknown as ProcessingRecord;
      });

      setRecordsByStatus(prev => ({
        ...prev,
        WAITING_CUSTOMER_APPROVAL: normalized
      }));

      // reset consecutive error counter on success
      try {
        setConsecutiveRecordErrors(0);
        setAutoRefreshEnabled(true);
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.warn('Warning: failed to fetch waiting customer approval records:', error instanceof Error ? error.message : error);
      const errMsg = error instanceof Error ? error.message : "Failed to fetch records";
      setRecordsError(errMsg);
      setConsecutiveRecordErrors(prev => {
        const next = prev + 1;
        const threshold = 3;
        if (next >= threshold) {
          setAutoRefreshEnabled(false);
          toast({
            title: "Auto-refresh paused",
            description: `Auto-refresh paused after ${next} consecutive failures. Click Retry to fetch now.`,
            variant: "destructive"
          });
        }
        return next;
      });
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  // Fetch processing records with IN_DIAGNOSIS status
  const fetchProcessingRecords = useCallback(async () => {
    try {
      setIsLoadingRecords(true);
      const { records: inDiagnosisRecords, total } = await processingRecordsService.getProcessingRecordsByStatus({ status: 'IN_DIAGNOSIS' });

      
      // Normalize record id field: backend may return id under different keys (recordId, id, vehicleProcessingRecordId, processing_record_id)
      const normalized: ProcessingRecord[] = (inDiagnosisRecords || []).map((r: unknown) => {
        const rr = r as Record<string, unknown>;
        // preserve original fields but ensure `recordId` exists for downstream calls
        const getStr = (key: string) => {
          const v = rr[key];
          if (typeof v === 'string') return v;
          if (v == null) return '';
          try { return String(v); } catch { return ''; }
        };

        const recordIdValue = getStr('id') || getStr('vehicleProcessingRecordId') || getStr('processing_record_id') || getStr('recordId') || '';
        const merged = Object.assign({}, rr, { recordId: recordIdValue });
        return merged as unknown as ProcessingRecord;
      });

      setRecordsByStatus(prev => ({
        ...prev,
        IN_DIAGNOSIS: normalized
      }));
      // reset consecutive error counter on success and ensure auto-refresh is enabled
      try {
        setConsecutiveRecordErrors(0);
        setAutoRefreshEnabled(true);
      } catch (e) {
        // ignore
      }
      
      

      // After we've loaded records, attempt to fetch persisted case-lines for all guarantee cases
        try {
        const guaranteeIds: string[] = [];
        (normalized || []).forEach((rec) => {
          if (Array.isArray(rec.guaranteeCases)) {
            rec.guaranteeCases.forEach(gc => {
              // Normalize possible id fields coming from backend and coerce to string so
              // TypeScript knows the type and we avoid pushing `unknown` into the string[]
              const rawId = (gc as Record<string, unknown>).guaranteeCaseId ?? (gc as Record<string, unknown>).guarantee_case_id ?? (gc as Record<string, unknown>).id ?? '';
              const id = typeof rawId === 'string' ? rawId : String(rawId);
              if (id) guaranteeIds.push(id);
            });
          }
        });

        if (guaranteeIds.length > 0) {
          
          const fetches = guaranteeIds.map(id => {
            const token = localStorage.getItem('ev_warranty_token');
            return axios.get(`${API_BASE_URL}/guarantee-cases/${id}/case-lines`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            })
            .then(response => {
              const rawCaseLines = (response.data?.data?.caseLines || []) as unknown[];
              return rawCaseLines;
            })
            .catch(err => {
              console.error('❌ Failed loading case lines for', id, err);
              return [] as unknown[];
            });
          });

          const results = await Promise.all(fetches);
          // Flatten and dedupe by caseLineId / caseLineId-like fields
          const flat = results.flat().filter(Boolean) as unknown[];
          const dedupMap: Record<string, unknown> = {};
          flat.forEach((cl: unknown) => {
            const c = cl as Record<string, unknown>;
            const key = (c['caseLineId'] ?? c['id'] ?? c['case_line_id']) as string | undefined;
            if (!key) return;
            if (!dedupMap[key]) dedupMap[key] = c;
          });

          const merged = Object.values(dedupMap);
          if (merged.length > 0) {
            // Normalize merged items into CaseLineResponse and dedupe reliably
            const normalized = merged
              .map(m => normalizeCaseLineResponse(m))
              .filter((x): x is CaseLineResponse => x !== null);

            if (normalized.length > 0) {
              setCreatedCaseLines(prev => {
                const map = new Map<string, CaseLineResponse>();
                prev.forEach(p => map.set(p.caseLineId, p));
                normalized.forEach(n => map.set(n.caseLineId, n));
                return Array.from(map.values());
              });

              // Also surface them in the lightweight caseLines UI list if they match expected fields
              setCaseLines(prev => {
                const existing = new Set(prev.map(c => c.id));
                const toAdd = normalized.map((mm) => {
                  const id = mm.caseLineId || '';
                  const caseId = mm.guaranteeCaseId || '';
                  // Backend does not return diagnosisText, use correctionText only
                  const damageLevel = 'N/A';
                  const warrantyStatus = mm.warrantyStatus || null;
                  const corr = mm.correctionText || '';
                  const photos: string[] = [];
                  const createdAt = mm.createdAt ? formatSafeDate(String(mm.createdAt)) : formatSafeDate(new Date());
                  const status = (mm.status as string) ?? 'submitted';

                  return {
                    id,
                    caseId,
                    damageLevel,
                    repairPossibility: 'N/A',
                    warrantyDecision: warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
                    technicianNotes: corr, // Use correctionText as technician notes
                    photos,
                    createdDate: createdAt,
                    status
                  } as CaseLine;
                }).filter((c: CaseLine) => c.id && !existing.has(c.id));

                return [...prev, ...toAdd];
              });
            }
          }
        }
      } catch (err) {
        console.error('❌ Error while preloading case-lines after records fetch:', err);
      }
    } catch (error) {
      // Downgrade noisy logs: keep a concise warning and let backoff mechanism surface to user
      console.warn('Warning: failed to fetch processing records (see backoff/retry state)', error instanceof Error ? error.message : error);
      const errMsg = error instanceof Error ? error.message : "Failed to fetch records";
      setRecordsError(errMsg);
      // increment consecutive failures and pause auto-refresh if threshold reached
      setConsecutiveRecordErrors(prev => {
        const next = prev + 1;
        const threshold = 3;
        if (next >= threshold) {
          setAutoRefreshEnabled(false);
          // notify user once when threshold reached (toast created here)
          toast({
            title: "Auto-refresh paused",
            description: `Auto-refresh paused after ${next} consecutive failures. Click Retry to fetch now.`,
            variant: "destructive"
          });
        }
        return next;
      });
    } finally {
      setIsLoadingRecords(false);
    }
  }, [normalizeCaseLineResponse]);

  // Helper functions for Processing Records
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CHECKED_IN': return 'secondary';
      case 'IN_DIAGNOSIS': return 'default';
      case 'WAITING_CUSTOMER_APPROVAL': return 'outline';
      case 'WAITING_FOR_PARTS': return 'outline';
      case 'IN_REPAIR': return 'default';
      case 'COMPLETED': return 'default';
      case 'PAID': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'CHECKED_IN': 'Checked In',
      'IN_DIAGNOSIS': 'In Diagnosis',
      'WAITING_CUSTOMER_APPROVAL': 'Waiting Customer Approval',
      'WAITING_FOR_PARTS': 'Waiting For Parts',
      'IN_REPAIR': 'In Repair',
      'COMPLETED': 'Completed',
      'PAID': 'Paid',
      'CANCELLED': 'Cancelled',
    };
    return labels[status] || status;
  };

  // Complete a processing record by calling the backend PATCH endpoint
  // Endpoint: PATCH /processing-records/{id}/complete-diagnosis
  const completeProcessingRecord = useCallback(async (recordId?: string) => {
    if (!recordId) {
      toast({ title: 'Missing Record ID', description: 'Cannot complete record without an ID', variant: 'destructive' });
      return;
    }

    try {
      setIsCompleting(true);
      const nowIso = new Date().toISOString();
      // apiService is an axios wrapper with baseURL = https://dongthanhswp.space/api/v1
      const resp = await apiService.patch(`/processing-records/${recordId}/complete-diagnosis`, {
        checkOutDate: nowIso
      });

      // Update local selectedRecord state if it refers to the same record we just completed.
      if (selectedRecord) {
        // Backend may return the id under different keys (recordId, id). Normalize safely without using `any`.
        const maybeId = ((selectedRecord as unknown) as Record<string, unknown>)['id'];
        const selId = typeof selectedRecord.recordId === 'string' && selectedRecord.recordId.length > 0
          ? selectedRecord.recordId
          : (typeof maybeId === 'string' ? maybeId : (typeof maybeId === 'number' ? String(maybeId) : ''));

        if (selId === recordId) {
          setSelectedRecord(prev => prev ? ({ ...prev, status: 'COMPLETED', checkOutDate: nowIso } as ProcessingRecord) : prev);
        }
      }

      // Refresh processing records to reflect status change
      try { 
        await fetchProcessingRecords(); 
        await fetchAllProcessingRecords();
        await fetchAssignedTasks();
      } catch (e) { /* ignore refresh error */ }
      setViewCaseModalOpen(false);
      return resp?.data;
    } catch (err) {
      console.error('Failed to complete processing record', err);
      toast({ title: 'Complete Failed', description: err instanceof Error ? err.message : String(err), variant: 'destructive' });
      throw err;
    } finally {
      setIsCompleting(false);
    }
  }, [fetchProcessingRecords, selectedRecord]);

  // Fetch assigned case lines for the current technician
  const fetchAssignedTasks = useCallback(async () => {
    if (!user?.id) {
      console.warn('No user logged in');
      return;
    }

    try {
      setIsLoadingAssignedTasks(true);
      
      
      
      // Call API to get case lines where repairTechId matches current user
      // Try without status filter first to see all case lines
      const response = await apiService.get('/case-lines', {
        params: {
          repairTechId: user.id,
          // status: 'IN_REPAIR,READY_FOR_REPAIR,PENDING', // Comment out to see all
          sortBy: 'createdAt',
          sortOrder: 'DESC'
        }
      }) as AxiosResponse<{ status: string; data: { caseLines: AssignedCaseLine[]; pagination?: { page: number; limit: number; total: number } } }>;
      
      if (response.data?.status === 'success') {
        const caseLines = response.data?.data?.caseLines || [];
        setAssignedCaseLines(Array.isArray(caseLines) ? caseLines : []);
      } else {
        console.warn('⚠️ No case lines found or invalid response structure');
        setAssignedCaseLines([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch assigned tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load assigned tasks',
        variant: 'destructive'
      });
      setAssignedCaseLines([]);
    } finally {
      setIsLoadingAssignedTasks(false);
    }
  }, [user]);

  // Fetch reservations for a specific case line
  const fetchReservations = useCallback(async (caseLineId: string) => {
    if (!user?.id) {
      console.warn('⚠️ No user logged in - cannot fetch reservations');
      return;
    }

    try {
  setIsLoadingReservations(true);
      
      // URL format: /reservations?caseLineId={id}&repairTechId={userId}&sortBy=createdAt&sortOrder=DESC
      const response = await apiService.get<{ status: string; data: { reservations: ComponentReservation[] } }>('/reservations', {
        params: {
          caseLineId: caseLineId,
          repairTechId: user.id,
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          page: 1,
          limit: 20
          
        }
      });

      if (response.data?.status === 'success' && Array.isArray(response.data?.data?.reservations)) {
        setReservations(response.data.data.reservations);
      } else {
        // console.warn('⚠️ No reservations found or invalid response structure');
        setReservations([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch reservations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reservations',
        variant: 'destructive'
      });
      setReservations([]);
    } finally {
      setIsLoadingReservations(false);
    }
  }, [user]);

  // View assigned case line details
  const viewAssignedCaseLineDetails = useCallback(async (caseLineId: string) => {
    try {
      const response = await apiService.get<{ status: string; data: { caseLine: AssignedCaseLine } }>(`/case-lines/${caseLineId}`);

      if (response.data?.status === 'success' && response.data?.data?.caseLine) {
        setSelectedAssignedCaseLine(response.data.data.caseLine);
        setReservationsPage(1); // Reset to page 1 when opening modal
        setViewAssignedCaseLineModalOpen(true);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load case line details - invalid response',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch case line details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load case line details',
        variant: 'destructive'
      });
    }
  }, []);

  // View reservations modal
  const viewReservationsModal = useCallback(async (caseLineId: string) => {
    setViewReservationsPage(1); // Reset to page 1
    await fetchReservations(caseLineId);
    setViewReservationsModalOpen(true);
  }, [fetchReservations]);

  // Install component
  const handleInstallComponent = useCallback(async (reservationId: string) => {
    try {
  setInstallingReservationId(reservationId);

  const response = await apiService.patch<{ 
        status: string; 
        data: { component: ComponentReservation } 
      }>(`/reservations/${reservationId}/installComponent`);

  if (response.data?.status === 'success') {
        toast({
          title: 'Success',
          description: 'Component installed successfully',
        });

        // Update the reservations list
        setReservations(prev => 
          prev.map(r => 
            r.reservationId === reservationId 
              ? { ...r, status: 'INSTALLED', installedAt: new Date().toISOString() }
              : r
          )
        );
      }
    } catch (error) {
      console.error('❌ Failed to install component:', error);
      toast({
        title: 'Error',
        description: 'Failed to install component',
        variant: 'destructive'
      });
    } finally {
      setInstallingReservationId(null);
    }
  }, []);

  // Install all picked up components
  const handleInstallAllComponents = useCallback(async () => {
    const pickedUpReservations = reservations.filter(r => r.status === 'PICKED_UP');
    
    if (pickedUpReservations.length === 0) {
      toast({
        title: 'No Components',
        description: 'No picked up components to install',
        variant: 'default'
      });
      return;
    }

    try {
      setInstallingReservationId('all');
      
      const installPromises = pickedUpReservations.map(reservation =>
        apiService.patch<{ 
          status: string; 
          data: { component: ComponentReservation } 
        }>(`/reservations/${reservation.reservationId}/installComponent`)
      );

      const results = await Promise.allSettled(installPromises);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `Installed ${successCount} component${successCount !== 1 ? 's' : ''} successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        });

        // Update all successfully installed reservations
        const now = new Date().toISOString();
        setReservations(prev => 
          prev.map(r => {
            const wasPickedUp = r.status === 'PICKED_UP';
            const resultIndex = pickedUpReservations.findIndex(p => p.reservationId === r.reservationId);
            if (wasPickedUp && resultIndex !== -1 && results[resultIndex].status === 'fulfilled') {
              return { ...r, status: 'INSTALLED', installedAt: now };
            }
            return r;
          })
        );
      } else {
        toast({
          title: 'Error',
          description: 'Failed to install all components',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('❌ Failed to install all components:', error);
      toast({
        title: 'Error',
        description: 'Failed to install all components',
        variant: 'destructive'
      });
    } finally {
      setInstallingReservationId(null);
    }
  }, [reservations]);

  // Complete repair for case line
  const handleCompleteRepair = useCallback(async (caseLineId: string) => {
    try {
  setCompletingCaseLineId(caseLineId);

      // First, fetch reservations to check if all are installed
      const reservationsResponse = await apiService.get<{ 
        status: string; 
        data: { reservations: ComponentReservation[] } 
      }>('/reservations', {
        params: {
          caseLineId: caseLineId,
          repairTechId: user?.id,
          sortBy: 'createdAt',
          sortOrder: 'DESC'
        }
      });

      const caseReservations = reservationsResponse.data?.data?.reservations || [];
      const allInstalled = caseReservations.every(r => r.status === 'INSTALLED');
      const notInstalledCount = caseReservations.filter(r => r.status !== 'INSTALLED').length;

  if (!allInstalled) {
        toast({
          title: 'Cannot Complete',
          description: `All components must be installed first. ${notInstalledCount} component(s) not yet installed.`,
          variant: 'destructive'
        });
        setCompletingCaseLineId(null);
        return;
      }

      // All reservations are installed, proceed with completion
      const response = await apiService.patch<{ 
        status: string; 
        data: { caseLine: AssignedCaseLine } 
      }>(`/case-lines/${caseLineId}/mark-repair-complete`);
      if (response.data?.status === 'success') {
        toast({
          title: 'Success',
          description: 'Repair marked as complete successfully',
        });

        // Update the assigned case lines list
        setAssignedCaseLines(prev => 
          prev.map(cl => 
            cl.id === caseLineId 
              ? { ...cl, status: 'COMPLETED' }
              : cl
          )
        );

        // Update selected case line if viewing details
        if (selectedAssignedCaseLine?.id === caseLineId) {
          setSelectedAssignedCaseLine(prev => 
            prev ? { ...prev, status: 'COMPLETED' } : null
          );
        }

        // Optionally close the modal after completion
        // setViewAssignedCaseLineModalOpen(false);
      }
    } catch (error) {
      console.error('❌ Failed to complete repair:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark repair as complete',
        variant: 'destructive'
      });
    } finally {
      setCompletingCaseLineId(null);
    }
  }, [selectedAssignedCaseLine, user]);

  // Helper function to check if case line can be completed
  const canCompleteRepair = useCallback((caseLineId: string): boolean => {
    // Find the case line in assigned tasks
    const caseLine = assignedCaseLines.find(cl => cl.id === caseLineId);
    
    if (!caseLine) return false;
    if (caseLine.status === 'COMPLETED' || caseLine.status === 'CANCELLED') return false;
    
    // If there are reservations in the case line data, check them
    if (caseLine.reservations && caseLine.reservations.length > 0) {
      const allInstalled = caseLine.reservations.every(r => r.status === 'INSTALLED');
      return allInstalled;
    }
    
    // If no reservations data available in case line, allow completion
    // (validation will happen in handleCompleteRepair)
    return true;
  }, [assignedCaseLines]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Safe date formatter: accepts string|Date|number and returns a locale date string.
  // If input is missing, returns 'N/A'. If parsing fails, returns the original raw value.
  const formatSafeDate = (raw?: string | Date | number, locale = 'en-GB') => {
    if (raw === undefined || raw === null) return 'N/A';
    try {
      const d = raw instanceof Date ? raw : new Date(String(raw));
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleDateString(locale);
    } catch (e) {
      return String(raw);
    }
  };

  // createCaseLines: implementation moved inline into this component.
  // The component builds a sanitized payload, POSTs to the API, and normalizes the response.

  // Fetch components to display in dropdown
  const fetchComponents = useCallback(async () => {
    try {
  const data = await apiCall('/components');
      // Can save to state if need to display components dropdown
    } catch (error) {
      console.error('Error fetching components:', error);
    }
  }, [apiCall]);

  // Fetch case lines created for guarantee case
  const fetchCaseLinesForCase = useCallback(async (guaranteeCaseId: string): Promise<unknown[]> => {
    try {
  const data = await apiCall(`/guarantee-cases/${guaranteeCaseId}/case-lines`);
      // Defensive: apiCall may return null (204) or different shapes.
      if (!data) return [];
      const asObj = data as unknown as Record<string, unknown>;
      const nested = asObj['data'];
      if (nested && typeof nested === 'object') {
        const list = (nested as Record<string, unknown>)['caseLines'];
        if (Array.isArray(list)) return list as unknown[];
      }
      const direct = asObj['caseLines'];
      if (Array.isArray(direct)) return direct as unknown[];
      return [];
    } catch (error) {
      console.error('Error fetching case lines:', error);
      return [];
    }
  }, [apiCall]);

  // Fetch compatible components for a processing record
  const fetchCompatibleComponents = useCallback(async (recordId: string, searchName?: string) => {
    if (!recordId) {
      console.warn('⚠️ No recordId provided to fetchCompatibleComponents');
      return;
    }

    try {
  setIsLoadingComponents(true);
      
      const components = await processingRecordsService.getCompatibleComponents(
        recordId,
        { searchName }
      );
  setCompatibleComponents(Array.isArray(components) ? components : []);
    } catch (error) {
      console.error('❌ Failed to search components:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to search components",
        variant: "destructive"
      });
      setCompatibleComponents([]);
    } finally {
      setIsLoadingComponents(false);
    }
  }, []);

  // Handle create issue diagnosis from Processing Records
  const handleCreateIssueDiagnosis = async () => {
    if (!caseLineForm.correctionText) {
      toast({
        title: "Validation Error",
        description: "Please fill in solution",
        variant: "destructive"
      });
      return;
    }

    if (!selectedGuaranteeCaseForCaseLine) {
      toast({
        title: "Validation Error",
        description: "Please select a guarantee case first",
        variant: "destructive"
      });
      return;
    }

    // Validate quantity when component is selected
    if (caseLineForm.componentId && caseLineForm.quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a quantity greater than 0 for the selected component",
        variant: "destructive"
      });
      return;
    }

    // Validate rejection reason when warranty status is INELIGIBLE
    if (caseLineForm.warrantyStatus === 'INELIGIBLE' && !caseLineForm.rejectionReason?.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a rejection reason when warranty status is Ineligible",
        variant: "destructive"
      });
      return;
    }

    if (!selectedRecord || !selectedRecord.guaranteeCases || (selectedRecord.guaranteeCases?.length ?? 0) === 0) {
      toast({
        title: "Error",
        description: "No guarantee case found for this record",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const guaranteeCase = selectedRecord.guaranteeCases.find(gc => gc.guaranteeCaseId === selectedGuaranteeCaseForCaseLine);
      
      if (!guaranteeCase) {
        toast({
          title: "Error",
          description: "Selected guarantee case not found",
          variant: "destructive"
        });
        return;
      }
      
  // creating case line for guaranteeCase

      // Create case line (backend no longer accepts diagnosisText)
      // Inline API call (previously in caseLineService.ts)
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const token = localStorage.getItem('ev_warranty_token');
      
      // Build sanitized payload (only include fields accepted by backend validators)
      const payload = {
        caselines: [caseLineForm].map((cl: typeof caseLineForm) => {
          const caselinePayload: Record<string, any> = {
            correctionText: cl.correctionText,
            typeComponentId: cl.componentId ?? null,
            quantity: cl.quantity,
            warrantyStatus: cl.warrantyStatus,
            evidenceImageUrls: cl.evidenceImageUrls || [],
          };
          
          // Only include rejectionReason if it has a value
          if (cl.rejectionReason && cl.rejectionReason.trim()) {
            caselinePayload.rejectionReason = cl.rejectionReason;
          }
          
          return caselinePayload;
        })
      };
      
      console.debug('📤 Payload being sent to backend:', JSON.stringify(payload, null, 2));
      
      const response = await axios.post(
        `${API_BASE_URL}/guarantee-cases/${guaranteeCase.guaranteeCaseId}/case-lines`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        }
      );
      
      console.debug('✅ Case lines created (raw response):', response.data);
      
      // Normalize backend response
      const rawCaseLines = (response.data?.data?.caseLines || []) as unknown[];
      const serverCreatedCaseLines = rawCaseLines.map((cl: unknown): any => {
        const c = cl as Record<string, unknown>;
        return {
          caseLineId: String(c.id ?? ''),
          guaranteeCaseId: String(c.guaranteeCaseId ?? ''),
          diagnosisText: '',
          correctionText: String(c.correctionText ?? ''),
          componentId: c.typeComponentId ? String(c.typeComponentId) : null,
          quantity: typeof c.quantity === 'number' ? c.quantity : 0,
          warrantyStatus: (c.warrantyStatus as 'ELIGIBLE' | 'INELIGIBLE') ?? 'ELIGIBLE',
          techId: String(c.diagnosticTechId ?? ''),
          status: c.status ?? 'DRAFT',
          createdAt: String(c.createdAt ?? ''),
          updatedAt: String(c.updatedAt ?? ''),
          evidenceImageUrls: [],
        };
      });
      
      console.debug('📦 Case lines normalized: %d items', serverCreatedCaseLines.length);

  // case lines created on server and merged into state

      // Persist created case lines into normalized state so they survive F5
      if (serverCreatedCaseLines && serverCreatedCaseLines.length > 0) {
        try {
          // Merge and dedupe by caseLineId to avoid duplicates and React key warnings
          setCreatedCaseLines(prev => {
            const map = new Map<string, CaseLineResponse>();
            prev.forEach(p => map.set(p.caseLineId, p));
            serverCreatedCaseLines.forEach((c: CaseLineResponse) => {
              if (c && c.caseLineId) map.set(c.caseLineId, c);
            });
            return Array.from(map.values());
          });
        } catch (err) {
          console.warn('Failed to append created case lines to state', err);
        }
      }

      const newCaseLine: CaseLine = {
        id: serverCreatedCaseLines[0].caseLineId,
        caseId: serverCreatedCaseLines[0].guaranteeCaseId,
        damageLevel: 'N/A',
        repairPossibility: 'N/A',
        warrantyDecision: serverCreatedCaseLines[0].warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
        technicianNotes: serverCreatedCaseLines[0].correctionText, // Backend only returns correctionText
        photos: [],
        photoFiles: [],
  createdDate: formatSafeDate(serverCreatedCaseLines[0].createdAt),
  // Preserve the backend status verbatim so statuses like 'DRAFT' are shown correctly
  status: serverCreatedCaseLines[0].status ?? 'submitted',
      };

      // Ensure no duplicate caseLine IDs in UI list
      setCaseLines(prev => {
        const exists = prev.some(c => c.id === newCaseLine.id);
        return exists ? prev : [...prev, newCaseLine];
      });

      // Safely compute a short id suffix for the toast (backend may vary response shape)
      const createdIdSuffix =
        createdCaseLines && createdCaseLines[0] && createdCaseLines[0].caseLineId
          ? createdCaseLines[0].caseLineId.slice(-8)
          : 'N/A';

      toast({
        title: "Case Line Created Successfully",
        description: `Case line created successfully! You can create another case line for this or another guarantee case.`,
      });

      // Do not automatically switch tabs after creating a case line.
      // Keeping the user on the current tab (Processing Records) avoids unexpected navigation.

      // Reset form but keep modal open and keep selected guarantee case
      setCaseLineForm({
        diagnosisText: '',
        correctionText: '',
        componentId: null,
        quantity: 0,
        warrantyStatus: 'ELIGIBLE'
      });
      setComponentSearchQuery('');
      // Don't reset selectedGuaranteeCaseForCaseLine - keep it selected for creating another case line
      
      // Reload compatible components for the selected guarantee case so user can create another case line
        if (selectedRecord?.recordId) {
          fetchCompatibleComponents(selectedRecord.recordId.toString(), '').catch(error => {
            console.error('Failed to reload components after case line creation', error);
          });
        }
      
    } catch (error) {
      console.error('❌ Failed to create case line:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create case line",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // useEffect hooks to call API

  // Load data on component mount
  useEffect(() => {
    const initializeData = async () => {
      if (user) {
        // Fetch all processing records data on mount
        await Promise.all([
          fetchProcessingRecords(), // IN_DIAGNOSIS
          fetchWaitingCustomerApprovalRecords(), // WAITING_CUSTOMER_APPROVAL
          fetchProcessingCaseLines(1), // PROCESSING case lines
          fetchAssignedTasks(), // Assigned tasks
        ]);
        // Do not fetch global /components on init to avoid 404 noisy logs when backend
        // doesn't expose that endpoint. Components are fetched when needed (e.g. when
        // opening Create Issue Diagnosis modal via fetchCompatibleComponents).
      } else {
        // user not present; prompt will be shown elsewhere if needed
        toast({
          title: "Authentication Required",
          description: "Please login to view processing records",
          variant: "destructive"
        });
      }
    };

    initializeData();
  }, [user, fetchProcessingRecords, fetchWaitingCustomerApprovalRecords, fetchProcessingCaseLines, fetchAssignedTasks, fetchComponents]);

  // Fetch technician's own schedules
  const fetchMySchedules = useCallback(async () => {
    try {
      setIsLoadingSchedules(true);
      setSchedulesError(null);
      const resp = await apiService.get<WorkSchedulesResponse>('/work-schedules/my-schedule');
      const payload = resp?.data;

      if (Array.isArray(payload)) {
        setWorkSchedules(payload);
      } else if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as { data?: unknown }).data)) {
        setWorkSchedules((payload as { data: WorkSchedule[] }).data);
      } else {
        setWorkSchedules([]);
      }
    } catch (err) {
      console.error('Failed to load work schedules', err);
      setSchedulesError(err instanceof Error ? err.message : String(err));
      setWorkSchedules([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  }, []);

  // Auto-fetch schedules when user is present
  useEffect(() => {
    if (user && user.role === 'service_center_technician') {
      fetchMySchedules();
    }
  }, [user, fetchMySchedules]);

  // Auto refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !isLoading && autoRefreshEnabled) {
        fetchProcessingRecords();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, isLoading, fetchProcessingRecords, autoRefreshEnabled]);

  // Fetch assigned tasks when switching to assigned-tasks tab
  useEffect(() => {
    if (activeTab === 'assigned-tasks') {
      fetchAssignedTasks();
    }
  }, [activeTab, fetchAssignedTasks]);

  // Fetch processing case lines when switching to PROCESSING status
  useEffect(() => {
    if (activeTab === 'processing-records' && activeProcessingStatus === 'PROCESSING') {
      fetchProcessingCaseLines(caseLinePage);
    }
  }, [activeTab, activeProcessingStatus, caseLinePage, fetchProcessingCaseLines]);

  // Fetch waiting customer approval records when switching to WAITING_CUSTOMER_APPROVAL tab
  useEffect(() => {
    if (activeTab === 'processing-records' && activeProcessingStatus === 'WAITING_CUSTOMER_APPROVAL') {
      fetchWaitingCustomerApprovalRecords();
    }
  }, [activeTab, activeProcessingStatus, fetchWaitingCustomerApprovalRecords]);

  // Fetch case lines when guarantee case is selected
  useEffect(() => {
    const loadCaseLines = async () => {
        if (selectedGuaranteeCase) {
          const caseLines = await fetchCaseLinesForCase(selectedGuaranteeCase.guaranteeCaseId);
          if (caseLines.length > 0) {
            // Normalize server shapes into CaseLineResponse so we have tech owner info
            const normalized = (caseLines as unknown[])
              .map(cl => normalizeCaseLineResponse(cl))
              .filter((x): x is CaseLineResponse => x !== null);

            if (normalized.length > 0) {
              // Merge into createdCaseLines and dedupe by caseLineId to avoid duplicates
              setCreatedCaseLines(prev => {
                const map = new Map<string, CaseLineResponse>();
                prev.forEach(p => map.set(p.caseLineId, p));
                normalized.forEach((c) => {
                  if (c && c.caseLineId) map.set(c.caseLineId, c);
                });
                return Array.from(map.values());
              });
            }
          }
      }
    };

    loadCaseLines();
  }, [selectedGuaranteeCase, fetchCaseLinesForCase, normalizeCaseLineResponse]);

  // Log state changes for debugging
  // Removed verbose change-logging to keep console output clean in production.

  // Helpers
  const isCaseLineCompleted = (status?: string | null) => {
    if (!status) return false;
    try { return String(status).toUpperCase() === 'COMPLETED'; } catch { return false; }
  };



  // Handle view case line: enrich the lightweight UI caseLine with any detailed
  // response we've previously loaded into `createdCaseLines` so the modal can
  // display the full set of fields returned by the backend.
  const handleViewCaseLine = async (caseLine: CaseLine) => {
    try {
      console.log('🔍 Attempting to fetch case line detail for ID:', caseLine.id);
      
      // Open modal immediately with loading state
      setViewCaseLineModalOpen(true);

      // Call API to get full case line detail including images
      const token = localStorage.getItem('ev_warranty_token');
      const response = await axios.get(`${API_BASE_URL}/case-lines/${caseLine.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const detailedCaseLine = response.data?.data?.caseLine;

      if (!detailedCaseLine) {
        console.warn('Case line not found on server, cleaning up local state for ID:', caseLine.id);
        // Remove from createdCaseLines and caseLines (cleanup)
        setCreatedCaseLines(prev => prev.filter(cl => cl.caseLineId !== caseLine.id));
        setCaseLines(prev => prev.filter(cl => cl.id !== caseLine.id));
        // Close modal if opened
        setViewCaseLineModalOpen(false);
        toast({ title: 'Cannot Load Case Line Details', description: 'Case line not found', variant: 'destructive' });
        return;
      }

      console.log('✅ Successfully fetched case line detail:', detailedCaseLine);

      // Map backend CaseLine to frontend CaseLine format
      const enriched: CaseLine = {
        id: detailedCaseLine.caseLineId || detailedCaseLine.caseLineId,
        caseId: detailedCaseLine.guaranteeCaseId,
        guaranteeCaseId: detailedCaseLine.guaranteeCaseId,
        damageLevel: 'medium',
        repairPossibility: 'repairable',
        warrantyDecision: detailedCaseLine.warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
        technicianNotes: detailedCaseLine.correctionText,
        photos: detailedCaseLine.evidenceImageUrls || [],
        evidenceImageUrls: detailedCaseLine.evidenceImageUrls || [],
        createdDate: formatSafeDate(detailedCaseLine.createdAt),
        status: detailedCaseLine.status ?? 'submitted',
        diagnosisText: '',
        correctionText: detailedCaseLine.correctionText,
        componentId: detailedCaseLine.componentId,
        componentName: detailedCaseLine.componentName ?? undefined,
        componentSku: detailedCaseLine.componentSku,
        componentPrice: detailedCaseLine.componentPrice,
        quantity: detailedCaseLine.quantity,
        warrantyStatus: detailedCaseLine.warrantyStatus,
        diagnosticTechId: detailedCaseLine.techId,
        diagnosticTechnicianName: detailedCaseLine.diagnosticTechnicianName,
        repairTechnicianName: detailedCaseLine.repairTechnicianName,
        rejectionReason: detailedCaseLine.rejectionReason,
        updatedAt: detailedCaseLine.updatedAt,
        // New nested fields - cast to any to avoid type errors since the API returns these
        guaranteeCase: (detailedCaseLine as any).guaranteeCase,
        typeComponent: (detailedCaseLine as any).typeComponent,
        diagnosticTechnician: (detailedCaseLine as any).diagnosticTechnician,
        repairTechnician: (detailedCaseLine as any).repairTechnician,
        reservations: (detailedCaseLine as any).reservations
      };
      setSelectedCaseLine(enriched);
    } catch (err) {
      console.error('❌ Failed to fetch case line detail from API:', err);
      console.error('Case line ID that failed:', caseLine.id);
      
      // If 404, remove this case line from localStorage and state (it doesn't exist in DB)
      if (err instanceof Error && err.message.includes('not found')) {
        console.warn('🗑️ Removing non-existent case line from local state:', caseLine.id);
        
        // Remove from createdCaseLines state
        setCreatedCaseLines(prev => prev.filter(cl => cl.caseLineId !== caseLine.id));
        
        // Remove from caseLines UI list
        setCaseLines(prev => prev.filter(cl => cl.id !== caseLine.id));
      }
      
      // Close the modal if it was opened
      setViewCaseLineModalOpen(false);
      
      toast({
        title: "Cannot Load Case Line Details",
        description: err instanceof Error ? err.message : "The case line may have been deleted or does not exist in the database.",
        variant: "destructive"
      });
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
      
  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="processing-records">Processing Records</TabsTrigger>
                      <TabsTrigger value="issue-diagnosis">Issue Diagnosis</TabsTrigger>
                      <TabsTrigger value="assigned-tasks">Assigned Tasks</TabsTrigger>
                      <TabsTrigger value="work-schedules">Work Schedules</TabsTrigger>
                    </TabsList>

          {/* Processing Records Tab */}
          <TabsContent value="processing-records">
            <div className="space-y-6">
              {/* Processing Records Table */}
              {!autoRefreshEnabled && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-yellow-800">Auto-refresh paused after multiple consecutive errors. Click Retry to fetch now.</div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        try {
                          // reset counters and attempt an immediate fetch
                          setConsecutiveRecordErrors(0);
                          setAutoRefreshEnabled(true);
                          await fetchProcessingRecords();
                        } catch (err) {
                          console.error('Retry fetch failed', err);
                          toast({ title: 'Retry failed', description: 'Could not fetch records. Please try again.', variant: 'destructive' });
                        }
                      }}>
                        Retry
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        setConsecutiveRecordErrors(0);
                        setAutoRefreshEnabled(true);
                        toast({ title: 'Auto-refresh resumed', description: 'Auto-refresh has been re-enabled.' });
                      }}>
                        Resume
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>
                    {activeProcessingStatus === 'IN_DIAGNOSIS' ? 'In Diagnosis' : (activeProcessingStatus === 'WAITING_CUSTOMER_APPROVAL' ? 'Waiting Customer Approval' : 'Processing')} Records
                  </CardTitle>
                  <CardDescription>
                    {activeProcessingStatus === 'IN_DIAGNOSIS' 
                      ? 'View and manage vehicle processing records in diagnosis'
                      : (activeProcessingStatus === 'WAITING_CUSTOMER_APPROVAL'
                        ? 'View records waiting for customer approval'
                        : 'View and manage vehicle processing records in repair')}
                  </CardDescription>
                  
                  {/* Status Filter Tabs */}
                  <div className="flex gap-3 mt-4">
                    <Button
                      variant={activeProcessingStatus === 'IN_DIAGNOSIS' ? 'default' : 'outline'}
                      onClick={() => setActiveProcessingStatus('IN_DIAGNOSIS')}
                      className="flex items-center gap-2"
                    >
                      In Diagnosis ({(recordsByStatus.IN_DIAGNOSIS || []).length})
                    </Button>
                    <Button
                      variant={activeProcessingStatus === 'WAITING_CUSTOMER_APPROVAL' ? 'default' : 'outline'}
                      onClick={() => setActiveProcessingStatus('WAITING_CUSTOMER_APPROVAL')}
                      className="flex items-center gap-2"
                    >
                      Waiting Customer Approval ({(recordsByStatus.WAITING_CUSTOMER_APPROVAL || []).length})
                    </Button>
                    <Button
                      variant={activeProcessingStatus === 'PROCESSING' ? 'default' : 'outline'}
                      onClick={() => setActiveProcessingStatus('PROCESSING')}
                      className="flex items-center gap-2"
                    >
                      Processing ({caseLineTotal > 0 ? caseLineTotal : processingCaseLines.length})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeProcessingStatus === 'PROCESSING' ? (
                    // Show Processing Case Lines table
                    isLoadingProcessing ? (
                      <div className="text-center py-8 text-slate-500">
                        <RefreshCw className="h-8 w-8 mx-auto mb-2 text-slate-300 animate-spin" />
                        <p>Loading processing case lines...</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Case Line ID</TableHead>
                            <TableHead>Case Number</TableHead>
                            <TableHead>Component</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Warranty Status</TableHead>
                            <TableHead>Diagnostic Tech</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {processingCaseLines.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                <p>No processing case lines found</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            processingCaseLines.map((caseLine) => (
                              <TableRow key={caseLine.id}>
                                <TableCell className="font-mono text-xs">
                                  {caseLine.id?.substring(0, 8)}...
                                </TableCell>
                                <TableCell className="font-medium">
                                  {caseLine.guaranteeCase?.caseNumber || 'N/A'}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {caseLine.typeComponent?.name || 'N/A'}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-semibold">
                                    {caseLine.quantity || 0}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={getCaseLineBadgeVariant(caseLine.status)} className="text-xs font-semibold">
                                    {getCaseLineStatusLabel(caseLine.status)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      caseLine.warrantyStatus === 'ELIGIBLE'
                                        ? 'default'
                                        : 'destructive'
                                    }
                                  >
                                    {caseLine.warrantyStatus || 'N/A'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {caseLine.diagnosticTech?.name || '—'}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        // Validate case line ID before fetching
                                        const caseLineId = caseLine.id;
                                        if (!caseLineId || typeof caseLineId !== 'string' || caseLineId.trim() === '') {
                                          console.error('Invalid case line ID:', caseLine);
                                          toast({
                                            title: 'Error',
                                            description: 'Invalid case line ID',
                                            variant: 'destructive'
                                          });
                                          return;
                                        }
                                        
                                        // Fetch full case line details from API
                                        const details = await fetchCaseLineDetails(caseLineId);
                                        if (details) {
                                          setSelectedCaseLine(details as any);
                                          setViewCaseLineModalOpen(true);
                                        }
                                      }}
                                      title="View Case"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    )
                  ) : null}
                  
                  {/* Pagination Controls for Case Lines */}
                  {activeProcessingStatus === 'PROCESSING' && !isLoadingProcessing && processingCaseLines.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {processingCaseLines.length} of {caseLineTotal} case lines (Page {caseLinePage} of {caseLineTotalPages})
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = Math.max(1, caseLinePage - 1);
                            setCaseLinePage(newPage);
                          }}
                          disabled={caseLinePage <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <div className="text-sm font-medium">
                          Page {caseLinePage} of {caseLineTotalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = Math.min(caseLineTotalPages, caseLinePage + 1);
                            setCaseLinePage(newPage);
                          }}
                          disabled={caseLinePage >= caseLineTotalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {activeProcessingStatus !== 'PROCESSING' && (
                    <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VIN</TableHead>
                        <TableHead>Vehicle & Model</TableHead>
                        <TableHead>Odometer</TableHead>
                        <TableHead>Check-in Date</TableHead>
                        <TableHead>Main Technician</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Caselines</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const records = activeProcessingStatus === 'WAITING_CUSTOMER_APPROVAL'
                          ? (recordsByStatus.WAITING_CUSTOMER_APPROVAL || [])
                          : (recordsByStatus.IN_DIAGNOSIS || []);
                        
                        return records.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                              <p>No records found</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          records.map((record) => (
                          <TableRow key={record.recordId || (record.vin + record.checkInDate)}>
                            <TableCell className="font-mono text-sm">
                              <p>{record.vin}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{record.vehicle?.model?.name ?? 'Unknown model'}</p>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{(record.odometer ?? 0).toLocaleString()} km</p>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(record.checkInDate ?? new Date().toISOString())}
                            </TableCell>
                            <TableCell>
                              <p className="font-medium">{record.mainTechnician?.name ?? '—'}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(record.status)}>
                                {getStatusLabel(record.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">×{record.guaranteeCases?.length ?? 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRecord(record);
                                    setViewCaseModalOpen(true);
                                  }}
                                  title="View Case"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                {activeProcessingStatus !== 'WAITING_CUSTOMER_APPROVAL' && (
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 flex items-center justify-center"
                                    onClick={async () => {
                                      // Open Create Issue Diagnosis modal for selected record

                                      try {
                                        // Try to pick a usable id from common fields so component search can run when possible.
                                        const recMap = record as unknown as Record<string, unknown>;
                                        const candidateId = record.recordId
                                          || (typeof recMap['vehicleProcessingRecordId'] === 'string' ? recMap['vehicleProcessingRecordId'] as string : (recMap['vehicleProcessingRecordId'] ?? ''))
                                          || (typeof recMap['processing_record_id'] === 'string' ? recMap['processing_record_id'] as string : (recMap['processing_record_id'] ?? ''))
                                          || (typeof recMap['id'] === 'string' ? recMap['id'] as string : (recMap['id'] ?? ''))
                                          || '';

                                        setSelectedRecord(record);
                                        setSelectedGuaranteeCaseForCaseLine(null); // Reset guarantee case selection
                                        setCreateIssueDiagnosisModalOpen(true);

                                        if (candidateId) {
                                          // Load all compatible components (no search query needed)
                                          fetchCompatibleComponents(candidateId.toString(), '').catch(error => {
                                            console.error('❌ Failed to fetch components:', error);
                                          });
                                        } else {
                                          console.warn('⚠️ No candidate recordId found on record, component list will be empty');
                                        }
                                      } catch (error) {
                                        console.error('❌ Error in create diagnosis handler:', error);
                                        toast({
                                          title: "Error",
                                          description: "Unexpected error while opening Create Issue Diagnosis modal.",
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                    title="Create Issue Diagnosis"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )))
                      })()}
                    </TableBody>
                  </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Issue Diagnosis Tab - show created case lines (no modal) */}
          <TabsContent value="issue-diagnosis">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Issue Diagnosis
                  </CardTitle>
                  <CardDescription>
                    Case lines you created from the Create Issue Diagnosis form.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {createdCaseLines.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p>No created case lines yet</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Case Line ID</TableHead>
                          <TableHead>Guarantee Case</TableHead>
                          <TableHead>Component ID</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Warranty Status</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {createdCaseLines.map((cl) => (
                          <TableRow key={cl.caseLineId}>
                            <TableCell className="font-mono text-xs">{cl.caseLineId?.substring(0,8)}...</TableCell>
                            <TableCell>{cl.guaranteeCaseId || 'N/A'}</TableCell>
                            <TableCell className="font-mono text-sm">{cl.componentId || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-semibold">{cl.quantity ?? 0}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={cl.warrantyStatus === 'ELIGIBLE' ? 'default' : 'destructive'}>{cl.warrantyStatus || 'N/A'}</Badge>
                            </TableCell>
                            <TableCell>{cl.status || 'N/A'}</TableCell>
                            <TableCell>{formatSafeDate(cl.createdAt)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    try {
                                      const id = cl.caseLineId || '';
                                      if (!id) {
                                        toast({ title: 'Error', description: 'Invalid case line id', variant: 'destructive' });
                                        return;
                                      }

                                      // Load full details and open view modal
                                      const details = await fetchCaseLineDetails(id);
                                      if (details) {
                                        setSelectedCaseLine(details as any);
                                        setViewCaseLineModalOpen(true);
                                      } else {
                                        toast({ title: 'Not found', description: 'Case line details not found', variant: 'destructive' });
                                      }
                                    } catch (err) {
                                      console.error('Failed to load case line details from Issue Diagnosis tab', err);
                                      toast({ title: 'Error', description: 'Failed to load case line details', variant: 'destructive' });
                                    }
                                  }}
                                  title="View Case"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={async () => {
                                    // Open Update modal pre-filled with case line details
                                    try {
                                      const id = cl.caseLineId || '';
                                      if (!id) {
                                        toast({ title: 'Error', description: 'Invalid case line id', variant: 'destructive' });
                                        return;
                                      }
                                      const details = await fetchCaseLineDetails(id);
                                      if (!details) {
                                        toast({ title: 'Not found', description: 'Case line details not found', variant: 'destructive' });
                                        return;
                                      }

                                      setSelectedCaseLine(details as any);

                                      const typeComponentId = details.typeComponentId || details.typeComponent?.typeComponentId || cl.componentId || '';

                                      const formData = {
                                        correctionText: details.correctionText || '',
                                        typeComponentId: typeComponentId,
                                        quantity: details.quantity || 0,
                                        warrantyStatus: details.warrantyStatus || 'ELIGIBLE',
                                        rejectionReason: details.rejectionReason || ''
                                      };

                                      if (typeComponentId) {
                                        setUpdateComponentSearchQuery(details.componentName || details.typeComponent?.name || '');
                                      } else {
                                        setUpdateComponentSearchQuery('');
                                      }

                                      setUpdateCaseLineForm(formData);

                                      // If we can find the record id, fetch compatible components
                                      const recordId = details.guaranteeCase?.vehicleProcessingRecord?.vehicleProcessingRecordId || details.guaranteeCase?.vehicleProcessingRecord?.recordId || details.guaranteeCase?.vehicleProcessingRecord?.id;
                                      if (recordId) {
                                        await fetchCompatibleComponents(recordId.toString(), '');
                                      }

                                      setUpdateCaseLineModalOpen(true);
                                    } catch (err) {
                                      console.error('Failed to open update modal for case line', err);
                                      toast({ title: 'Error', description: 'Failed to prepare update form', variant: 'destructive' });
                                    }
                                  }}
                                  title="Update"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setCaseLineToDelete(cl.caseLineId || '');
                                    setDeleteCaseLineModalOpen(true);
                                  }}
                                  title="Delete"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assigned Tasks Tab */}
          <TabsContent value="assigned-tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Assigned Tasks
                </CardTitle>
                <CardDescription>
                  View warranty repair tasks assigned to you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    {assignedCaseLines.length > 0 ? (
                      <span>Found {assignedCaseLines.length} assigned task{assignedCaseLines.length !== 1 ? 's' : ''}</span>
                    ) : (
                      <span>No tasks assigned</span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => fetchAssignedTasks()}
                    disabled={isLoadingAssignedTasks}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingAssignedTasks ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                {isLoadingAssignedTasks ? (
                  <div className="text-center py-8 text-slate-500">
                    <RefreshCw className="h-8 w-8 mx-auto mb-2 text-slate-300 animate-spin" />
                    <p>Loading assigned tasks...</p>
                  </div>
                ) : assignedCaseLines.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p>No tasks assigned</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Case Line ID</TableHead>
                        <TableHead>VIN</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Warranty Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedCaseLines.map((caseLine) => (
                        <TableRow key={caseLine.id}>
                          <TableCell className="font-mono text-xs">
                            {caseLine.id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="font-medium">
                            {caseLine.guaranteeCase?.vehicleProcessingRecord?.vin || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">
                                {caseLine.typeComponent?.name || 'N/A'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                SKU: {caseLine.typeComponent?.sku || 'N/A'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-semibold">
                              {caseLine.quantity || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getCaseLineBadgeVariant(caseLine.status)} className="text-xs font-semibold">
                              {getCaseLineStatusLabel(caseLine.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                caseLine.warrantyStatus === 'ELIGIBLE'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {caseLine.warrantyStatus || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewAssignedCaseLineDetails(caseLine.id)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewReservationsModal(caseLine.id)}
                              >
                                <Package className="h-3 w-3 mr-1" />
                                Reservations
                              </Button>
                              {caseLine.status !== 'COMPLETED' && caseLine.status !== 'CANCELLED' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteRepair(caseLine.id)}
                                  disabled={completingCaseLineId === caseLine.id}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {completingCaseLineId === caseLine.id ? (
                                    <>
                                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                      Completing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Complete
                                    </>
                                  )}
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

          

          {/* Work Schedules Tab (replaced Components + Staff Management) */}
          <TabsContent value="work-schedules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">{/* Description removed per request */}</div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => fetchMySchedules()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  {isLoadingSchedules ? (
                    <div className="text-center py-6 text-slate-500">Loading schedules...</div>
                  ) : schedulesError ? (
                    <div className="text-center py-6 text-destructive">Error: {schedulesError}</div>
                  ) : workSchedules.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">No schedules found</div>
                  ) : (
                    <Table>
                      <TableHeader>
                          <TableRow>
                            <TableHead>Work Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead>Technician Name</TableHead>
                            <TableHead>Technician Email</TableHead>
                          </TableRow>
                        </TableHeader>
                      <TableBody>
                        {workSchedules.map((s) => (
                          <TableRow key={s.scheduleId}>
                            <TableCell className="whitespace-nowrap">{s.workDate}</TableCell>
                            <TableCell>
                              <Badge variant={s.status === 'AVAILABLE' ? 'default' : 'destructive'} className="uppercase">
                                {s.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{s.notes ?? '—'}</TableCell>
                            <TableCell>
                              <div className="font-semibold">{s.technician?.name ?? '—'}</div>
                            </TableCell>
                            <TableCell className="text-sm">{s.technician?.email ?? '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>

      {/* Removed unused warranty case modals that referenced deleted state variables */}

      {/* View Issue Diagnosis Modal */}
      <Dialog open={viewCaseLineModalOpen} onOpenChange={setViewCaseLineModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Issue Diagnosis Details</DialogTitle>
              </div>
            </div>
          </DialogHeader>
          
          {/* Debug logs removed */}
          
          <div className="space-y-6 pt-2">
            {/* Case Line Information - single row split into two sides */}
            <div className="grid grid-cols-1 gap-6">
              {/* Left side: Diagnosis Information */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-lg text-blue-900">Diagnosis Information</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Diagnosis ID</span>
                      <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border-2 border-blue-100 shadow-sm">
                        <span className="text-sm font-mono text-gray-800 break-all">{selectedCaseLine?.id}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Status</span>
                      <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border-2 border-blue-100 shadow-sm">
                        <Badge 
                          variant={
                            selectedCaseLine?.status === 'approved' ? 'default' :
                            selectedCaseLine?.status === 'rejected' ? 'destructive' :
                            selectedCaseLine?.status === 'submitted' ? 'secondary' :
                            'outline'
                          }
                          className="text-sm px-4 py-1.5 font-semibold"
                        >
                          {selectedCaseLine?.status}
                        </Badge>
                      </div>
                    </div>
                    {selectedCaseLine?.updatedAt && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Updated At</span>
                        <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border-2 border-blue-100 shadow-sm">
                          <span className="text-sm text-gray-800">
                            {new Date(selectedCaseLine.updatedAt).toLocaleString('vi-VN', { 
                              year: 'numeric', 
                              month: '2-digit', 
                              day: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side: Component & Warranty */}
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-xl border-2 border-amber-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                      <Wrench className="h-5 w-5 text-white" />
                    </div>
                    <h4 className="font-bold text-lg text-amber-900">Component Details</h4>
                  </div>
                  <div className="space-y-4">
                    {selectedCaseLine?.componentName && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Component Name</span>
                        <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border-2 border-amber-100 shadow-sm">
                          <span className="text-sm text-gray-900">{selectedCaseLine.componentName}</span>
                        </div>
                      </div>
                    )}
                    {selectedCaseLine?.componentSku && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Component SKU</span>
                        <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border-2 border-amber-100 shadow-sm">
                          <span className="text-sm font-mono text-gray-800">{selectedCaseLine.componentSku}</span>
                        </div>
                      </div>
                    )}
                    {/* Component ID removed from Issue Diagnosis Details per UX request */}
                    {selectedCaseLine?.quantity !== undefined && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Quantity</span>
                        <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border-2 border-amber-100 shadow-sm">
                          <span className="text-sm text-gray-800">{selectedCaseLine.quantity}</span>
                        </div>
                      </div>
                    )}
                    {selectedCaseLine?.componentPrice !== undefined && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Unit Price</span>
                        <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border-2 border-amber-100 shadow-sm">
                          <span className="text-sm text-gray-800">{selectedCaseLine.componentPrice.toLocaleString('vi-VN')} VND</span>
                        </div>
                      </div>
                    )}
                    {selectedCaseLine?.componentPrice !== undefined && selectedCaseLine?.quantity !== undefined && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Total Price</span>
                        <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border-2 border-amber-100 shadow-sm">
                          <span className="text-sm text-gray-800">{(selectedCaseLine.componentPrice * selectedCaseLine.quantity).toLocaleString('vi-VN')} VND</span>
                        </div>
                      </div>
                    )}
                    {selectedCaseLine?.warrantyStatus && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Warranty Status</span>
                        <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-lg border-2 border-amber-100 shadow-sm">
                          <Badge 
                            className={`text-sm px-4 py-1.5 font-semibold ${
                              selectedCaseLine.warrantyStatus === 'ELIGIBLE' 
                                ? 'bg-green-500 hover:bg-green-600 text-white' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                          >
                            {selectedCaseLine.warrantyStatus === 'ELIGIBLE' ? '✓ ELIGIBLE' : '✗ INELIGIBLE'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Information removed per request */}

            {/* Rejection Reason (only show when warranty status is INELIGIBLE) */}
            {selectedCaseLine?.warrantyStatus === 'INELIGIBLE' && selectedCaseLine?.rejectionReason && (
              <div className="bg-gradient-to-br from-red-50 to-pink-50 p-6 rounded-xl border-2 border-red-300 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 shadow-md">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-lg text-red-900">Rejection Reason</h4>
                </div>
                <div className="bg-white/80 backdrop-blur p-5 rounded-lg border-2 border-red-200 shadow-sm">
                  <p className="text-sm leading-relaxed text-red-900 font-medium">{selectedCaseLine.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Technician Notes */}
            {selectedCaseLine && (
              <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-6 rounded-xl border-2 border-slate-300 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 shadow-md">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-900">Technician Notes</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Wrench className="h-4 w-4 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Solution</span>
                    </div>
                    <div className="bg-white/90 backdrop-blur p-4 rounded-lg border-2 border-gray-200 shadow-sm">
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{selectedCaseLine.correctionText || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Evidence Photos from Cloudinary */}
            {(() => {
              const photoUrls = selectedCaseLine?.evidenceImageUrls || selectedCaseLine?.photos || [];
              return photoUrls.length > 0 ? (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-300 shadow-sm">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-green-900">Evidence Photos</h4>
                      <p className="text-xs text-green-700 font-semibold">{photoUrls.length} image(s) attached</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photoUrls.map((photo, index) => (
                      <div key={index} className="group bg-white p-3 rounded-xl border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all duration-200">
                        <div className="relative aspect-square mb-3 overflow-hidden rounded-lg border-2 border-gray-200">
                          <img 
                            src={photo} 
                            alt={`Evidence Photo ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
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
                          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            #{index + 1}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs text-center text-green-800 font-semibold uppercase tracking-wide">Evidence Photo {index + 1}</p>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setPreviewImageUrl(photo);
                                setImagePreviewModalOpen(true);
                              }}
                              className="text-xs flex-1 border-2 hover:bg-green-50 hover:border-green-400 font-semibold"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
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
                              className="text-xs border-2 hover:bg-green-50 hover:border-green-400"
                              title="Copy URL"
                            >
                              <Camera className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t-2">
            <Button 
              variant="outline" 
              onClick={() => setViewCaseLineModalOpen(false)} 
              className="px-8 border-2 hover:bg-gray-100 font-semibold"
            >
              <X className="h-4 w-4 mr-2" />
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

      {/* Confirm remove dialog removed — deletion disabled in UI */}

      {/* View Case Modal from Processing Records */}
      <Dialog open={viewCaseModalOpen} onOpenChange={setViewCaseModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
              <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">Processing Record Details</DialogTitle>
                {selectedRecord?.recordId && (
                  <div className="mt-1">
                    <p className="text-xs font-mono text-gray-500">ID: {selectedRecord.recordId}</p>
                  </div>
                )}
              </div>
              {selectedRecord && (
                <Badge 
                  variant={getStatusBadgeVariant(selectedRecord.status)} 
                  className="text-sm px-3 py-1"
                >
                  {getStatusLabel(selectedRecord.status)}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6 mt-4">
              {/* Diagnosis Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Diagnosis Information</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">VIN</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRecord.vin}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">Vehicle Model</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRecord.vehicle.model.name}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">Odometer</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRecord.odometer.toLocaleString()} km</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">Assigner</p>
                    <p className="text-sm font-bold text-slate-900">
                      {selectedRecord.guaranteeCases?.[0]?.taskAssignments?.[0]?.assigner?.name || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">Check-in Date</p>
                    <p className="text-sm font-bold text-slate-900">{formatDate(selectedRecord.checkInDate)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">Created by Staff</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRecord.createdByStaff.name}</p>
                  </div>
                </div>
              </div>

              {/* Assigned Technicians Section */}
              <div className="bg-white border border-slate-300 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Diagnosis Technician</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedRecord.mainTechnician?.name}</p>
                      <p className="text-xs text-slate-500">Main Technician</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Images Section */}
              {selectedRecord.evidenceImageUrls && selectedRecord.evidenceImageUrls.length > 0 && (
                <div className="bg-white border border-slate-300 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Eye className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-slate-800">Evidence Images</h3>
                    <span className="text-sm text-slate-500">({selectedRecord.evidenceImageUrls.length})</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedRecord.evidenceImageUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="group relative aspect-square rounded-lg overflow-hidden border-2 border-slate-200 hover:border-purple-500 transition-all shadow-sm hover:shadow-lg cursor-pointer"
                        onClick={() => {
                          setPreviewImageUrl(url);
                          setImagePreviewModalOpen(true);
                        }}
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Guarantee Cases with nested Case Lines */}
              {selectedRecord?.guaranteeCases && selectedRecord.guaranteeCases.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-slate-800">Guarantee Cases</h3>
                    <span className="text-sm text-slate-500">({selectedRecord.guaranteeCases.length})</span>
                  </div>
                  
                  {selectedRecord.guaranteeCases.map((guaranteeCase, gcIndex) => {
                    // Filter case lines for this guarantee case
                    const caseLinesForCase = createdCaseLines.filter(
                      cl => cl.guaranteeCaseId === guaranteeCase.guaranteeCaseId
                    );
                    
                    return (
                      <div key={guaranteeCase.guaranteeCaseId} className="border border-slate-300 rounded-xl overflow-hidden">
                        {/* Guarantee Case Header */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 border-b">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-slate-700">Guarantee Case #{gcIndex + 1}</span>
                                <Badge variant="outline" className="text-xs">
                                  {guaranteeCase.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">
                                <span className="font-bold">Content:</span> {guaranteeCase.contentGuarantee}
                              </p>
                              {/* Guarantee case id hidden from view per request */}
                            </div>
                          </div>
                        </div>
                        
                        {/* Case Lines nested under Guarantee Case removed per UX request */}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setViewCaseModalOpen(false)}>Close</Button>

            {selectedRecord && selectedRecord.status !== 'COMPLETED' && selectedRecord.status !== 'WAITING_CUSTOMER_APPROVAL' && (() => {
              // Compute guarantee cases and whether any created case lines exist for this record
              const guaranteeCases = selectedRecord.guaranteeCases || [];
              
              // Check if ALL guarantee cases have at least one case line
              const allGuaranteeCasesHaveCaseLines = guaranteeCases.length > 0 && guaranteeCases.every(gc => 
                createdCaseLines.some(cl => cl.guaranteeCaseId === gc.guaranteeCaseId)
              );
              
              const guaranteeCasesWithoutCaseLines = guaranteeCases.filter(gc =>
                !createdCaseLines.some(cl => cl.guaranteeCaseId === gc.guaranteeCaseId)
              );

              // Any created case lines that belong to this record's guarantee cases
              const availableCaseLines = createdCaseLines.filter(cl =>
                guaranteeCases.some(gc => gc.guaranteeCaseId === cl.guaranteeCaseId)
              );

              return (
                <>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={async () => {
                      // derive candidate id (recordId or fallback to id field)
                      const rec = selectedRecord as unknown as Record<string, unknown>;
                      const candidateId = (rec['recordId'] as string) || (rec['vehicleProcessingRecordId'] as string) || (rec['processing_record_id'] as string) || (rec['id'] as string) || '';
                      if (!candidateId) {
                        toast({ title: 'Missing Record ID', description: 'Cannot complete record: ID not found', variant: 'destructive' });
                        return;
                      }

                      // Require ALL guarantee cases to have at least one case line
                      if (!allGuaranteeCasesHaveCaseLines) {
                        const missingCount = guaranteeCasesWithoutCaseLines.length;
                        const missingCases = guaranteeCasesWithoutCaseLines.map((gc, idx) => 
                          `Guarantee Case #${guaranteeCases.indexOf(gc) + 1}: ${gc.contentGuarantee.substring(0, 30)}...`
                        ).join('\n');
                        
                        toast({ 
                          title: 'Cannot Complete Record',
                          description: `All guarantee cases must have at least one case line. Missing case lines for ${missingCount} guarantee case(s):\n\n${missingCases}`,
                          variant: 'destructive'
                        });
                        return;
                      }

                      try {
                        await completeProcessingRecord(candidateId);
                      } catch (err) {
                        // error already handled in helper
                      }
                    }}
                    disabled={isCompleting || !allGuaranteeCasesHaveCaseLines}
                    title={!allGuaranteeCasesHaveCaseLines ? `All guarantee cases must have at least one case line (${guaranteeCasesWithoutCaseLines.length} missing)` : ''}
                  >
                    {isCompleting ? 'Completing...' : 'Complete Diagnosis'}
                  </Button>
                </>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Select Case Line Modal */}


      {/* Update Case Line Modal */}
      <Dialog open={updateCaseLineModalOpen} onOpenChange={setUpdateCaseLineModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Update Case Line</DialogTitle>
            <DialogDescription>
              Update case line information for {selectedCaseLine?.id?.substring(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Read-only Information Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Case Line Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Case Line ID:</span>
                  <p className="font-mono text-gray-800 mt-1">{selectedCaseLine?.id}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Status:</span>
                  <p className="mt-1">
                    <Badge variant={getCaseLineBadgeVariant(selectedCaseLine?.status || '')}>
                      {getCaseLineStatusLabel(selectedCaseLine?.status || '')}
                    </Badge>
                  </p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Component:</span>
                  <p className="text-gray-800 mt-1">{selectedCaseLine?.componentName || selectedCaseLine?.typeComponent?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Component SKU:</span>
                  <p className="font-mono text-gray-800 mt-1">{selectedCaseLine?.componentSku || selectedCaseLine?.typeComponent?.sku || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Diagnostic Tech:</span>
                  <p className="text-gray-800 mt-1">{selectedCaseLine?.diagnosticTechnicianName || selectedCaseLine?.diagnosticTechnician?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Updated At:</span>
                  <p className="text-gray-800 mt-1">
                    {selectedCaseLine?.updatedAt ? new Date(selectedCaseLine.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Editable Fields Section */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 shadow-sm">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-gray-800">Editable Fields</h4>
              </div>
              
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="correctionText" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-gray-600" />
                    Correction Text <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="correctionText"
                    value={updateCaseLineForm.correctionText}
                    onChange={(e) => setUpdateCaseLineForm(prev => ({ ...prev, correctionText: e.target.value }))}
                    placeholder="Enter correction text..."
                    rows={4}
                    className="resize-none min-h-28 border-2 focus:border-green-400 focus:ring-green-200 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Component Selector */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="componentSelect" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-600" />
                        Replacement Component <span className="text-red-500">*</span>
                      </Label>
                      {updateCaseLineForm.typeComponentId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                          onClick={() => {
                            setUpdateCaseLineForm(prev => ({ ...prev, typeComponentId: '', quantity: 0 }));
                            setUpdateComponentSearchQuery('');
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>

                    {/* Selected Component Display */}
                    {updateCaseLineForm.typeComponentId && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 mb-2 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 shadow-md flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Type Component Selected</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm font-bold text-green-900 break-words"><span className="font-semibold">Name:</span> {updateComponentSearchQuery || 'Component'}</p>
                              {updateSelectedComponentWarranty !== null && (
                                updateSelectedComponentWarranty ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                                )
                              )}
                            </div>
                            {/* Show full component ID */}
                            <div className="mt-3 bg-white/60 rounded-lg px-3 py-2 border border-green-200">
                              <p className="text-xs text-gray-600 font-semibold mb-0.5">Type Component ID</p>
                              <p className="text-xs text-gray-800 font-mono break-all">{updateCaseLineForm.typeComponentId}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Select
                      disabled={isLoadingComponents || !!updateCaseLineForm.typeComponentId}
                      value={updateCaseLineForm.typeComponentId || "none"}
                      onValueChange={(value) => {
                        if (value === "none" || value === "") {
                          setUpdateCaseLineForm(prev => ({ ...prev, typeComponentId: '', quantity: 0 }));
                          setUpdateComponentSearchQuery('');
                          setUpdateSelectedComponentWarranty(null);
                        } else {
                          const selectedComponent = compatibleComponents.find(c => c.typeComponentId === value);
                          if (selectedComponent) {
                            setUpdateCaseLineForm(prev => ({ 
                              ...prev, 
                              typeComponentId: selectedComponent.typeComponentId,
                              quantity: prev.quantity && prev.quantity > 0 ? prev.quantity : 1
                            }));
                            setUpdateComponentSearchQuery(selectedComponent.name);
                            setUpdateSelectedComponentWarranty(selectedComponent.isUnderWarranty);
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-full border-2 focus:border-green-400 focus:ring-green-200 transition-colors h-11">
                        <SelectValue placeholder={
                          isLoadingComponents 
                            ? "Loading components..." 
                            : compatibleComponents.length === 0
                            ? "No components available"
                            : "Choose a replacement component..."
                        }>
                          {updateComponentSearchQuery || (updateCaseLineForm.typeComponentId
                            ? (compatibleComponents.find(c => c.typeComponentId === updateCaseLineForm.typeComponentId)?.name)
                            : undefined)}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {isLoadingComponents ? (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading components...
                          </div>
                        ) : compatibleComponents.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                            No compatible components found
                          </div>
                        ) : (
                          <>
                            <SelectItem value="none" className="text-gray-500 italic">
                              -- None (Optional) --
                            </SelectItem>
                            {compatibleComponents.map((component) => (
                              <SelectItem 
                                key={component.typeComponentId} 
                                value={component.typeComponentId}
                                className="cursor-pointer hover:bg-blue-50 transition-colors py-3 my-1"
                              >
                                <span className="sr-only">{component.name}</span>
                                <div className="flex items-center justify-between gap-3 py-1">
                                  <div className="flex-1">
                                    <span className="font-semibold text-gray-800 block">{component.name}</span>
                                    {component.availableQuantity !== undefined && (
                                      <span className="text-xs text-gray-500 mt-0.5 block">
                                        Available: {component.availableQuantity} units
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-gray-600" />
                      Quantity <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantity"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={updateCaseLineForm.quantity === 0 ? '' : updateCaseLineForm.quantity}
                      onChange={(e) => {
                        if (!updateCaseLineForm.typeComponentId) return;
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) {
                          const parsed = val === '' ? '' : parseInt(val, 10);
                          setUpdateCaseLineForm(prev => ({ 
                            ...prev, 
                            quantity: parsed === '' ? 0 : parsed 
                          }));
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setUpdateCaseLineForm(prev => ({ ...prev, quantity: 0 }));
                        }
                      }}
                      disabled={!updateCaseLineForm.typeComponentId}
                      placeholder="0"
                      className="border-2 focus:border-green-400 focus:ring-green-200 transition-colors h-11 text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    {!updateCaseLineForm.typeComponentId && (
                      <p className="text-xs text-gray-500 mt-1">Select a component first</p>
                    )}
                  </div>
                </div>

                {/* Warranty Status - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="warrantyStatus" className="text-sm font-semibold text-gray-700">
                    Warranty Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={updateCaseLineForm.warrantyStatus}
                    onValueChange={(value: 'ELIGIBLE' | 'INELIGIBLE') => {
                      setUpdateCaseLineForm(prev => ({ ...prev, warrantyStatus: value }));
                      // Clear rejection reason if changing to ELIGIBLE
                      if (value === 'ELIGIBLE') {
                        setUpdateCaseLineForm(prev => ({ ...prev, rejectionReason: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className="border-2 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ELIGIBLE">Eligible</SelectItem>
                      <SelectItem value="INELIGIBLE">Ineligible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rejection Reason - only show if INELIGIBLE */}
                {updateCaseLineForm.warrantyStatus === 'INELIGIBLE' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason" className="text-sm font-semibold text-gray-700">
                      Rejection Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="rejectionReason"
                      value={updateCaseLineForm.rejectionReason}
                      onChange={(e) => setUpdateCaseLineForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                      placeholder="Enter reason for warranty ineligibility..."
                      rows={3}
                      className="resize-none border-2 focus:border-red-400"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setUpdateCaseLineModalOpen(false)}
              disabled={isUpdatingCaseLine}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                console.log('Update button clicked');
                console.log('selectedCaseLine:', selectedCaseLine);
                console.log('updateCaseLineForm:', updateCaseLineForm);
                
                // Validation: Check if rejection reason is required
                if (updateCaseLineForm.warrantyStatus === 'INELIGIBLE' && !updateCaseLineForm.rejectionReason?.trim()) {
                  toast({
                    title: "Validation Error",
                    description: "Please provide a rejection reason when warranty status is Ineligible",
                    variant: "destructive"
                  });
                  return;
                }
                
                if (selectedCaseLine?.guaranteeCaseId && selectedCaseLine?.id) {
                  console.log('Calling updateCaseLine...');
                  await updateCaseLine(
                    selectedCaseLine.guaranteeCaseId,
                    selectedCaseLine.id,
                    updateCaseLineForm
                  );
                } else {
                  console.error('Missing guaranteeCaseId or id:', {
                    guaranteeCaseId: selectedCaseLine?.guaranteeCaseId,
                    id: selectedCaseLine?.id
                  });
                }
              }}
              disabled={isUpdatingCaseLine}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdatingCaseLine ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Update
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Report Modal from Processing Records */}


      {/* Create Issue Diagnosis Modal from Processing Records */}
      <Dialog open={createIssueDiagnosisModalOpen} onOpenChange={(open) => {
  // dialog open state changed
        setCreateIssueDiagnosisModalOpen(open);
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">Create Issue Diagnosis</DialogTitle>
                {selectedRecord?.recordId && (
                  <div className="text-sm font-mono text-gray-700 mt-1">ID: {selectedRecord.recordId}</div>
                )}
                <div className="text-sm font-mono text-gray-700">VIN: {selectedRecord?.vin || 'N/A'}</div>
              </div>
            </div>
          </DialogHeader>
          
          {selectedRecord ? (
            <div className="space-y-6 pt-2">
              {/* Select Guarantee Case */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center gap-2 mb-5">
                  <h4 className="font-semibold text-lg text-gray-800">Select Guarantee Case</h4>
                </div>
                <div className="space-y-3">
                  {selectedRecord.guaranteeCases && selectedRecord.guaranteeCases.length > 0 ? (
                    selectedRecord.guaranteeCases.map((gc, index) => {
                      const caseLineCount = createdCaseLines.filter(cl => cl.guaranteeCaseId === gc.guaranteeCaseId).length;
                      const isSelected = selectedGuaranteeCaseForCaseLine === gc.guaranteeCaseId;
                      
                      return (
                        <div
                          key={gc.guaranteeCaseId}
                          className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                            isSelected
                              ? 'bg-blue-50 border-blue-500 shadow-lg ring-2 ring-blue-200'
                              : caseLineCount > 0
                              ? 'bg-green-50 border-green-400 hover:bg-green-100 hover:shadow-md'
                              : 'bg-white hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                          }`}
                          onClick={() => {
                            // When user selects a guarantee case, clear any previously chosen component
                            // so the Create Issue Diagnosis flow always requires an explicit component pick.
                            setSelectedGuaranteeCaseForCaseLine(gc.guaranteeCaseId);
                            setCaseLineForm(prev => ({ ...prev, componentId: null, warrantyStatus: 'ELIGIBLE' }));
                            setComponentSearchQuery('');
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                isSelected ? 'bg-blue-500' : caseLineCount > 0 ? 'bg-green-500' : 'bg-gray-300'
                              } text-white font-bold text-sm`}>
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-sm mb-1">
                                  Guarantee Case #{index + 1}
                                </div>
                                <div className="text-xs text-gray-700 mb-2">
                                  <span className="font-semibold">Content:</span> {gc.contentGuarantee}
                                </div>
                                <div className="text-xs font-mono text-gray-500 mb-2">
                                  {gc.guaranteeCaseId}
                                </div>
                                <Badge variant={gc.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                                  {gc.status || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                            {caseLineCount > 0 && (
                              <Badge variant="default" className="bg-green-600 text-xs">
                                {caseLineCount} Case Line{caseLineCount > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No guarantee cases found for this record
                    </div>
                  )}
                </div>
              </div>

              {/* Only show Step 2 if a guarantee case is selected */}
              {selectedGuaranteeCaseForCaseLine && (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 shadow-md">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Selected Case</p>
                        <p className="text-sm font-bold text-blue-900">
                          Guarantee Case #{selectedRecord.guaranteeCases?.findIndex(gc => gc.guaranteeCaseId === selectedGuaranteeCaseForCaseLine) + 1 || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center gap-2 mb-5">
                      <h4 className="font-semibold text-lg text-gray-800">Case Line Details</h4>
                    </div>

                    <div className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="correctionText" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-gray-600" />
                          Solution
                        </Label>
                        <Textarea 
                          id="correctionText"
                          value={caseLineForm.correctionText}
                          onChange={(e) => setCaseLineForm(prev => ({ ...prev, correctionText: e.target.value }))}
                          placeholder="Describe the solution and corrective actions taken to resolve the issue..."
                          className="min-h-28 border-2 focus:border-green-400 focus:ring-green-200 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="componentSelect" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-600" />
                        Replacement Component
                      </Label>
                      {caseLineForm.componentId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold"
                          onClick={() => {
                            setCaseLineForm(prev => ({ ...prev, componentId: null, quantity: 0, warrantyStatus: 'ELIGIBLE' }));
                            setComponentSearchQuery('');
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    {/* Selected Component Display */}
                    {caseLineForm.componentId && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 mb-2 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500 shadow-md flex-shrink-0">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Type Component Selected</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm font-bold text-green-900 break-words"><span className="font-semibold">Name:</span> {componentSearchQuery || 'Selected'}</p>
                              {selectedComponentWarranty !== null && (
                                selectedComponentWarranty ? (
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                ) : (
                                  <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                                )
                              )}
                            </div>
                            {/* Show full component ID */}
                            <div className="mt-3 bg-white/60 rounded-lg px-3 py-2 border border-green-200">
                              <p className="text-xs text-gray-600 font-semibold mb-0.5">Type Component ID</p>
                              <p className="text-xs text-gray-800 font-mono break-all">{caseLineForm.componentId}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <Select
                      disabled={!selectedGuaranteeCaseForCaseLine || isLoadingComponents || !!caseLineForm.componentId}
                      value={caseLineForm.componentId || "none"}
                      onValueChange={(value) => {
                        if (value === "none" || value === "") {
                          // Clear selection and reset quantity when none selected
                          setCaseLineForm(prev => ({ ...prev, componentId: null, quantity: 0, warrantyStatus: 'ELIGIBLE' }));
                          setComponentSearchQuery('');
                          setSelectedComponentWarranty(null);
                        } else {
                          // Find selected component
                          const selectedComponent = compatibleComponents.find(c => c.typeComponentId === value);
                          if (selectedComponent) {
                            // default quantity to 1 when a component is selected
                            setCaseLineForm(prev => ({ 
                              ...prev, 
                              componentId: selectedComponent.typeComponentId,
                              quantity: prev.quantity && prev.quantity > 0 ? prev.quantity : 1
                            }));
                            setComponentSearchQuery(selectedComponent.name);
                            setSelectedComponentWarranty(selectedComponent.isUnderWarranty);
                            // component selection changed
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="w-full border-2 focus:border-green-400 focus:ring-green-200 transition-colors h-11">
                        {/* Render only the selected component name here so the badge inside SelectItem
                            (the 'Under Warranty' / 'Not Covered' chips) doesn't appear inside
                            the closed Select trigger. Use componentSearchQuery (set when an item
                            is selected) as the display; fall back to the same placeholder text. */}
                        <SelectValue placeholder={
                          isLoadingComponents 
                            ? "Loading components..." 
                            : !selectedGuaranteeCaseForCaseLine
                            ? "Select a guarantee case first"
                            : compatibleComponents.length === 0
                            ? "No components available"
                            : "Choose a replacement component..."
                        }>
                          {
                            // Prefer showing the transient componentSearchQuery (we set this when
                            // an item is selected). Fall back to resolving the name from the
                            // componentId in compatibleComponents if needed.
                            componentSearchQuery ||
                            (caseLineForm.componentId
                              ? (compatibleComponents.find(c => c.typeComponentId === caseLineForm.componentId)?.name)
                              : undefined)
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {isLoadingComponents ? (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                            <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2" />
                            Loading components...
                          </div>
                        ) : compatibleComponents.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-gray-500">
                            No compatible components found
                          </div>
                        ) : (
                          <>
                            <SelectItem value="none" className="text-gray-500 italic">
                              -- None (Optional) --
                            </SelectItem>
                            {compatibleComponents.map((component) => (
                              <SelectItem 
                                key={component.typeComponentId} 
                                value={component.typeComponentId}
                                className="cursor-pointer hover:bg-blue-50 transition-colors py-3 my-1"
                              >
                                {/* Hidden plain text label to ensure the Select trigger shows the name
                                    even when the visible item contains complex JSX (badges, layout). */}
                                <span className="sr-only">{component.name}</span>
                                <div className="flex items-center justify-between gap-3 py-1">
                                  <div className="flex-1">
                                    <span className="font-semibold text-gray-800 block">{component.name}</span>
                                    {component.availableQuantity !== undefined && (
                                      <span className="text-xs text-gray-500 mt-0.5 block">
                                        Available: {component.availableQuantity} units
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Gauge className="h-4 w-4 text-gray-600" />
                      Quantity
                    </Label>
                    <Input 
                      id="quantity"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={caseLineForm.quantity.toString()}
                      disabled={!caseLineForm.componentId}
                      onChange={(e) => {
                        // prevent editing when no component selected (safety)
                        if (!caseLineForm.componentId) return;
                        const val = e.target.value;
                        // Allow empty input or valid numbers only
                        if (val === '' || /^\d+$/.test(val)) {
                          const parsed = val === '' ? '' : parseInt(val, 10);
                          setCaseLineForm(prev => ({ 
                            ...prev, 
                            quantity: parsed === '' ? 0 : parsed 
                          }));
                        }
                      }}
                      onBlur={(e) => {
                        // Keep 0 if user leaves empty or enters 0
                        const val = e.target.value;
                        if (val === '') {
                          setCaseLineForm(prev => ({ ...prev, quantity: 0 }));
                        }
                      }}
                      placeholder="0"
                      className="border-2 focus:border-green-400 focus:ring-green-200 transition-colors h-11 text-lg font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Warranty Status - Full Width */}
                <div className="space-y-2">
                  <Label htmlFor="warrantyStatusFull" className="text-sm font-semibold text-gray-700">
                    Warranty Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={caseLineForm.warrantyStatus}
                    onValueChange={(value: 'ELIGIBLE' | 'INELIGIBLE') => {
                      setCaseLineForm(prev => ({ ...prev, warrantyStatus: value }));
                      // Clear rejection reason if changing to ELIGIBLE
                      if (value === 'ELIGIBLE') {
                        setCaseLineForm(prev => ({ ...prev, rejectionReason: '' }));
                      }
                    }}
                  >
                    <SelectTrigger className="border-2 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ELIGIBLE">Eligible</SelectItem>
                      <SelectItem value="INELIGIBLE">Ineligible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Rejection Reason - Full Width, conditional */}
                {caseLineForm.warrantyStatus === 'INELIGIBLE' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReasonFull" className="text-sm font-semibold text-gray-700">
                      Rejection Reason <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="rejectionReasonFull"
                      value={caseLineForm.rejectionReason}
                      onChange={(e) => setCaseLineForm(prev => ({ ...prev, rejectionReason: e.target.value }))}
                      placeholder="Enter reason for warranty ineligibility..."
                      rows={3}
                      className="resize-none border-2 focus:border-red-400"
                    />
                  </div>
                )}

                <div className="flex justify-end items-center gap-3 pt-6 mt-6 border-t-2">
                  <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          // Close modal and reset form state so Quantity returns to 0 next time
                          setCreateIssueDiagnosisModalOpen(false);
                          setCaseLineForm({
                            diagnosisText: '',
                            correctionText: '',
                            componentId: null,
                            quantity: 0,
                            warrantyStatus: 'ELIGIBLE'
                          });
                          setComponentSearchQuery('');
                          setCompatibleComponents([]);
                        }}
                        disabled={isSubmitting}
                        className="border-2 hover:bg-gray-100 font-semibold px-6"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all font-semibold px-8"
                        onClick={handleCreateIssueDiagnosis}
                        disabled={isSubmitting || !caseLineForm.correctionText}
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Create Case Line
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No record selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Assigned Case Line Details Modal */}
      <Dialog open={viewAssignedCaseLineModalOpen} onOpenChange={setViewAssignedCaseLineModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Case Line Details</DialogTitle>
            <DialogDescription>
              Detailed information about the assigned case line
            </DialogDescription>
          </DialogHeader>

          {selectedAssignedCaseLine ? (
            <div className="space-y-6">
              {/* Case Line Information */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Case Line Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Case Line ID</label>
                      <p className="text-sm font-mono mt-1">{selectedAssignedCaseLine.id}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                      <div className="mt-1">
                        <Badge
                          className={`text-xs font-semibold ${
                            selectedAssignedCaseLine.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedAssignedCaseLine.status === 'READY_FOR_REPAIR'
                              ? 'bg-blue-100 text-blue-800'
                              : selectedAssignedCaseLine.status === 'IN_REPAIR'
                              ? 'bg-purple-100 text-purple-800'
                              : selectedAssignedCaseLine.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {getCaseLineStatusLabel(selectedAssignedCaseLine.status)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Warranty Status</label>
                      <div className="mt-1">
                        <Badge variant={selectedAssignedCaseLine.warrantyStatus === 'ELIGIBLE' ? 'default' : 'destructive'}>
                          {selectedAssignedCaseLine.warrantyStatus}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Quantity</label>
                      <p className="text-sm font-semibold mt-1">{selectedAssignedCaseLine.quantity}</p>
                    </div>
                    {selectedAssignedCaseLine.updatedAt && (
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Last Updated</label>
                        <p className="text-sm mt-1">
                          {new Date(selectedAssignedCaseLine.updatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Solution (Correction Text) */}
                  <div className="pt-2">
                    <div className="p-3 bg-green-50/80 dark:bg-green-900/10 rounded border-l-2 border-green-400">
                      <div className="flex items-center gap-1 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-sm text-green-700 dark:text-green-400">Solution</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedAssignedCaseLine.correctionText}
                      </p>
                    </div>
                  </div>

                  {/* Rejection Reason (if any) */}
                  {selectedAssignedCaseLine.rejectionReason && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200">
                      <label className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Rejection Reason
                      </label>
                      <p className="text-sm text-red-900 dark:text-red-100 mt-1">
                        {selectedAssignedCaseLine.rejectionReason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Component Information */}
              {selectedAssignedCaseLine.typeComponent && (
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Component Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Name</label>
                        <p className="text-sm font-medium mt-1">
                          {selectedAssignedCaseLine.typeComponent.name}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">SKU</label>
                        <p className="text-sm font-mono mt-1">
                          {selectedAssignedCaseLine.typeComponent.sku}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Type Component ID</label>
                        <p className="text-sm font-mono mt-1">
                          {selectedAssignedCaseLine.typeComponent.typeComponentId}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Price</label>
                        <p className="text-sm font-semibold mt-1">
                          {selectedAssignedCaseLine.typeComponent.price?.toLocaleString()} VND
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Guarantee Case Information */}
              {selectedAssignedCaseLine.guaranteeCase && (
                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Guarantee Case
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Case ID</label>
                        <p className="text-sm font-mono mt-1">
                          {selectedAssignedCaseLine.guaranteeCase.guaranteeCaseId}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Content</label>
                        <p className="text-sm mt-1 p-2 bg-slate-50 rounded border">
                          {selectedAssignedCaseLine.guaranteeCase.contentGuarantee}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                        <div className="mt-1">
                          <Badge variant="outline">{selectedAssignedCaseLine.guaranteeCase.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Vehicle Information */}
              {selectedAssignedCaseLine.guaranteeCase?.vehicleProcessingRecord && (
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Vehicle Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">VIN</label>
                        <p className="text-sm font-mono font-bold mt-1">
                          {selectedAssignedCaseLine.guaranteeCase.vehicleProcessingRecord.vin}
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Processing Record ID</label>
                        <p className="text-sm font-mono mt-1">
                          {selectedAssignedCaseLine.guaranteeCase.vehicleProcessingRecord.vehicleProcessingRecordId}
                        </p>
                      </div>
                      {selectedAssignedCaseLine.guaranteeCase.vehicleProcessingRecord.createdByStaff && (
                        <>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Created By</label>
                            <p className="text-sm mt-1">
                              {selectedAssignedCaseLine.guaranteeCase.vehicleProcessingRecord.createdByStaff.userId}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted-foreground uppercase">Service Center ID</label>
                            <p className="text-sm font-mono mt-1">
                              {selectedAssignedCaseLine.guaranteeCase.vehicleProcessingRecord.createdByStaff.serviceCenterId}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Technicians Information */}
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Diagnosis Technician
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAssignedCaseLine.diagnosticTechnician && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded border">
                        <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">Diagnostic Technician</label>
                        <p className="text-sm font-medium mt-1">
                          {selectedAssignedCaseLine.diagnosticTechnician.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          ID: {selectedAssignedCaseLine.diagnosticTechnician.userId}
                        </p>
                      </div>
                    )}
                    {selectedAssignedCaseLine.repairTechnician && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/10 rounded border">
                        <label className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase">Repair Technician</label>
                        <p className="text-sm font-medium mt-1">
                          {selectedAssignedCaseLine.repairTechnician.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          ID: {selectedAssignedCaseLine.repairTechnician.userId}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Component Reservations */}
              {selectedAssignedCaseLine.reservations && selectedAssignedCaseLine.reservations.length > 0 && (() => {
                // Calculate pagination
                const totalReservations = selectedAssignedCaseLine.reservations.length;
                const totalPages = Math.ceil(totalReservations / reservationsPerPage);
                const startIndex = (reservationsPage - 1) * reservationsPerPage;
                const endIndex = startIndex + reservationsPerPage;
                const currentReservations = selectedAssignedCaseLine.reservations.slice(startIndex, endIndex);
                
                return (
                <Card className="border-l-4 border-l-teal-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Component Reservations ({totalReservations})
                      </CardTitle>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReservationsPage(prev => Math.max(1, prev - 1))}
                            disabled={reservationsPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground">
                            Page {reservationsPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReservationsPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={reservationsPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {currentReservations.map((reservation, index) => {
                        const globalIndex = startIndex + index;
                        return (
                        <div key={reservation.reservationId} className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-muted-foreground">Reservation #{globalIndex + 1}</span>
                            <Badge 
                              variant={
                                reservation.status === 'RESERVED' ? 'outline' :
                                reservation.status === 'PICKED_UP' ? 'secondary' :
                                reservation.status === 'INSTALLED' ? 'default' :
                                'destructive'
                              }
                            >
                              {reservation.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-xs text-muted-foreground">Reservation ID:</span>
                              <p className="font-mono text-xs">{reservation.reservationId}</p>
                            </div>
                            {reservation.component && (
                              <>
                                <div>
                                  <span className="text-xs text-muted-foreground">Serial Number:</span>
                                  <p className="font-mono text-xs font-semibold">{reservation.component.serialNumber}</p>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Component Status:</span>
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {reservation.component.status}
                                  </Badge>
                                </div>
                                {reservation.component.warehouse && (
                                  <>
                                    <div className="col-span-2">
                                      <span className="text-xs text-muted-foreground">Warehouse:</span>
                                      <p className="text-xs font-medium">{reservation.component.warehouse.name}</p>
                                      <p className="text-xs text-muted-foreground">{reservation.component.warehouse.address}</p>
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    
                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {startIndex + 1}-{Math.min(endIndex, totalReservations)} of {totalReservations} reservations
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReservationsPage(prev => Math.max(1, prev - 1))}
                            disabled={reservationsPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReservationsPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={reservationsPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No case line selected</p>
            </div>
          )}

          {/* Footer with Complete Button */}
          {selectedAssignedCaseLine && 
           selectedAssignedCaseLine.status !== 'COMPLETED' && 
           selectedAssignedCaseLine.status !== 'CANCELLED' && (
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button
                variant="outline"
                onClick={() => setViewAssignedCaseLineModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => handleCompleteRepair(selectedAssignedCaseLine.id)}
                disabled={completingCaseLineId === selectedAssignedCaseLine.id}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {completingCaseLineId === selectedAssignedCaseLine.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Reservations Modal */}
      <Dialog open={viewReservationsModalOpen} onOpenChange={setViewReservationsModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between w-full">
              <span>Component Reservations</span>
              <div className="flex items-center gap-3">
                {!isLoadingReservations && reservations.length > 0 && (
                  <>
                    <span className="text-sm font-normal text-muted-foreground">
                      {reservations.length} total reservation{reservations.length !== 1 ? 's' : ''}
                    </span>
                    {reservations.some(r => r.status === 'PICKED_UP') && (
                      <Button
                        size="sm"
                        onClick={handleInstallAllComponents}
                        disabled={installingReservationId === 'all'}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {installingReservationId === 'all' ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Installing...
                          </>
                        ) : (
                          <>
                            <Wrench className="h-3 w-3 mr-1" />
                            Install All
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              View component reservations for this case line
            </DialogDescription>
          </DialogHeader>

          {isLoadingReservations ? (
            <div className="text-center py-8 text-slate-500">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p>Loading reservations...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No reservations found</p>
            </div>
          ) : (() => {
            // Calculate pagination
            const totalReservations = reservations.length;
            const totalPages = Math.ceil(totalReservations / viewReservationsPerPage);
            const startIndex = (viewReservationsPage - 1) * viewReservationsPerPage;
            const endIndex = startIndex + viewReservationsPerPage;
            const currentReservations = reservations.slice(startIndex, endIndex);
            
            return (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reservation ID</TableHead>
                    <TableHead>Component Serial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Picked Up By</TableHead>
                    <TableHead>Picked Up At</TableHead>
                    <TableHead>Installed At</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentReservations.map((reservation) => (
                    <TableRow key={reservation.reservationId}>
                      <TableCell className="font-mono text-xs">
                        {reservation.reservationId.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {reservation.component?.serialNumber || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs font-semibold ${
                            reservation.status === 'RESERVED'
                              ? 'bg-amber-100 text-amber-800 border-amber-400'
                              : reservation.status === 'PICKED_UP'
                              ? 'bg-blue-100 text-blue-800 border-blue-400'
                              : reservation.status === 'INSTALLED'
                              ? 'bg-green-100 text-green-800 border-green-400'
                              : reservation.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800 border-red-400'
                              : reservation.status === 'RETURNED'
                              ? 'bg-purple-100 text-purple-800 border-purple-400'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                          variant="outline"
                        >
                          {reservation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {reservation.pickedUpByTech?.name || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reservation.pickedUpByTech?.email || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {reservation.pickedUpAt
                          ? new Date(reservation.pickedUpAt).toLocaleString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {reservation.installedAt
                          ? new Date(reservation.installedAt).toLocaleString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(reservation.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {reservation.status === 'PICKED_UP' && (
                          <Button
                            size="sm"
                            onClick={() => handleInstallComponent(reservation.reservationId)}
                            disabled={installingReservationId === reservation.reservationId}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {installingReservationId === reservation.reservationId ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Installing...
                              </>
                            ) : (
                              <>
                                <Wrench className="h-3 w-3 mr-1" />
                                Install
                              </>
                            )}
                          </Button>
                        )}
                        {reservation.status === 'INSTALLED' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Installed
                          </Badge>
                        )}
                        {reservation.status === 'RESERVED' && (
                          <span className="text-xs text-muted-foreground">Waiting for pickup</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(endIndex, totalReservations)} of {totalReservations} reservations
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewReservationsPage(prev => Math.max(1, prev - 1))}
                      disabled={viewReservationsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {viewReservationsPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewReservationsPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={viewReservationsPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Case Line Confirmation Modal */}
      <Dialog open={deleteCaseLineModalOpen} onOpenChange={setDeleteCaseLineModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600">Delete Case Line</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this case line? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-slate-600">
              Case Line ID: <span className="font-mono font-semibold">{caseLineToDelete}</span>
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteCaseLineModalOpen(false);
                setCaseLineToDelete(null);
              }}
              disabled={isDeletingCaseLine}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (caseLineToDelete) {
                  await deleteCaseLine(caseLineToDelete);
                }
              }}
              disabled={isDeletingCaseLine}
            >
              {isDeletingCaseLine ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianDashboard;