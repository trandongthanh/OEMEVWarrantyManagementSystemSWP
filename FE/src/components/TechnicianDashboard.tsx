import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AxiosResponse } from "axios";
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
import { caseLineService, CaseLineRequest } from "@/services/caseLineService";
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
  Calendar,
  Gauge,
  AlertCircle,
  RefreshCw,
  Package,
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

interface WarrantyCase {
  id: string;
  vehicleVin: string;
  customerName: string;
  vehicleModel: string;
  status: string;
  createdDate: string;
  // Optional fields
  vin?: string;
  issueType?: string;
  submissionDate?: string;
  updatedDate?: string;
  technicianName?: string;
  photos?: string[];
  diagnosis?: string;
  customerPhone?: string;
  components?: Array<{ id?: string; name: string; quantity: number; status: string }>;
  technicianNotes?: string;
  manufacturerResponse?: string;
}

interface IssueDiagnosisForm {
  affectedComponent: string;
  damageLevel: string;
  repairPossibility: string;
  warrantyDecision: string;
  technicianNotes: string;
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
  const [viewCaseLineModalOpen, setViewCaseLineModalOpen] = useState(false);
  const [selectedCaseLine, setSelectedCaseLine] = useState<CaseLine | null>(null);
  const [imagePreviewModalOpen, setImagePreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");

  const [reportPreviewModalOpen, setReportPreviewModalOpen] = useState(false);
  const [updateDetailsModalOpen, setUpdateDetailsModalOpen] = useState(false);
  const [selectedWarrantyCase, setSelectedWarrantyCase] = useState<WarrantyCase | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [caseLines, setCaseLines] = useState<CaseLine[]>([]);
  // Processing Records state
  const [processingRecords, setProcessingRecords] = useState<ProcessingRecord[]>([]);
  const [recordsByStatus, setRecordsByStatus] = useState<ProcessingRecordsByStatus>({
    CHECKED_IN: [],
    IN_DIAGNOSIS: [],
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

  // Processing Records View states
  const [selectedRecord, setSelectedRecord] = useState<ProcessingRecord | null>(null);
  const [viewCaseModalOpen, setViewCaseModalOpen] = useState(false);
  const [viewReportModalOpen, setViewReportModalOpen] = useState(false);
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
    warrantyStatus: 'ELIGIBLE'
  });

  // Issue Diagnosis tab form (old modal with different fields)
  const [issueDiagnosisForm, setIssueDiagnosisForm] = useState<IssueDiagnosisForm>({
    affectedComponent: '',
    damageLevel: '',
    repairPossibility: '',
    warrantyDecision: '',
    technicianNotes: ''
  });

  // Component search state (for Affected Components field in Issue Diagnosis tab)
  const [componentQuery, setComponentQuery] = useState<string>("");

  // Compatible components for Processing Records modal
  const [compatibleComponents, setCompatibleComponents] = useState<Array<{ typeComponentId: string; name: string; isUnderWarranty: boolean; availableQuantity?: number }>>([]);
  const [componentSearchQuery, setComponentSearchQuery] = useState<string>("");
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

  // State cho API data
  const [selectedGuaranteeCase, setSelectedGuaranteeCase] = useState<GuaranteeCase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('processing-records');
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

  // Helper function để lấy token
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

  // Generic API call function với error handling
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
          
          const fetches = guaranteeIds.map(id => caseLineService.getCaseLines(id).catch(err => {
            console.error('❌ Failed loading case lines for', id, err);
            return [] as unknown[];
          }));

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
      // apiService is an axios wrapper with baseURL = http://localhost:3000/api/v1
      const resp = await apiService.patch(`/processing-records/${recordId}/complete-diagnosis`, {
        checkOutDate: nowIso
      });

      toast({ title: 'Record Completed', description: `Processing record ${recordId} marked as completed.` });

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
      try { await fetchProcessingRecords(); } catch (e) { /* ignore refresh error */ }
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
        console.warn('⚠️ No reservations found or invalid response structure');
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

      // Check if there are any reservations
      if (caseReservations.length === 0) {
        toast({
          title: 'Warning',
          description: 'No reservations found for this case line',
          variant: 'destructive'
        });
        setCompletingCaseLineId(null);
        return;
      }

      // Check if all reservations are installed
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

  // NOTE: createCaseLines handled by `caseLineService.createCaseLines` (uses axios POST).
  // Keep component-side logic (handleCreateIssueDiagnosis) using the service so created
  // case-lines are persisted to backend and then merged into local state for display.

  // Fetch components để hiển thị trong dropdown
  const fetchComponents = useCallback(async () => {
    try {
  const data = await apiCall('/components');
      // Có thể lưu vào state nếu cần hiển thị dropdown components
    } catch (error) {
      console.error('Error fetching components:', error);
    }
  }, [apiCall]);

  // Fetch case lines đã tạo cho guarantee case
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
      const serverCreatedCaseLines = await caseLineService.createCaseLines(
        guaranteeCase.guaranteeCaseId,
        [caseLineForm] // Send form as-is (only correctionText, no diagnosisText)
      );

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

  // useEffect hooks để call API

  // Load data on component mount
  useEffect(() => {
    const initializeData = async () => {
      if (user) {
        await fetchProcessingRecords();
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
  }, [user, fetchProcessingRecords, fetchComponents]);

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

  // Handle view case line: enrich the lightweight UI caseLine with any detailed
  // response we've previously loaded into `createdCaseLines` so the modal can
  // display the full set of fields returned by the backend.
  const handleViewCaseLine = async (caseLine: CaseLine) => {
    try {
      console.log('🔍 Attempting to fetch case line detail for ID:', caseLine.id);
      
      // Open modal immediately with loading state
      setViewCaseLineModalOpen(true);

      // Call API to get full case line detail including images
      const detailedCaseLine = await caseLineService.getCaseLineById(caseLine.id);

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
          <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="processing-records">Processing Records</TabsTrigger>
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
                  <CardTitle>Processing Records</CardTitle>
                  <CardDescription>
                    View and manage vehicle processing records in diagnosis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VIN</TableHead>
                        <TableHead>Vehicle & Model</TableHead>
                        <TableHead>Odometer</TableHead>
                        <TableHead>Check-in Date</TableHead>
                        <TableHead>Main Technician</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cases</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {((recordsByStatus.IN_DIAGNOSIS || []).length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                            <p>No records found</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        (recordsByStatus.IN_DIAGNOSIS || []).map((record) => (
                          <TableRow key={record.recordId || (record.vin + record.checkInDate)}>
                            <TableCell className="font-mono text-sm">
                              <div>
                                <p>{record.vin}</p>
                                {record.recordId && (
                                  <p className="text-xs text-muted-foreground">ID: {(record.recordId as string)?.substring?.(0, 8) ?? ''}...</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{record.vehicle?.model?.name ?? 'Unknown model'}</p>
                                <p className="text-xs text-muted-foreground">
                                  Model ID: {(record.vehicle?.model?.vehicleModelId as string | undefined)?.substring?.(0, 8) ?? 'N/A'}...
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{(record.odometer ?? 0).toLocaleString()} km</p>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(record.checkInDate ?? new Date().toISOString())}
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{record.mainTechnician?.name ?? '—'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(record.mainTechnician?.userId as string | undefined)?.substring?.(0, 8) ?? ''}...
                                </p>
                              </div>
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
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
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

            {/* Technical / Backend Fields (show if available) */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <h4 className="font-semibold text-lg text-gray-900">Technical Details</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCaseLine?.correctionText !== undefined && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-600">Solution</div>
                    <div className="bg-muted p-3 rounded mt-1">{selectedCaseLine?.correctionText || '—'}</div>
                  </div>
                )}

                {selectedCaseLine?.componentId !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Component ID</div>
                    <div className="font-mono bg-white px-3 py-2 rounded border mt-1">{selectedCaseLine?.componentId ?? selectedCaseLine?.typeComponentId ?? '—'}</div>
                  </div>
                )}

                {selectedCaseLine?.quantity !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Quantity</div>
                    <div className="bg-white px-3 py-2 rounded border mt-1">{selectedCaseLine?.quantity ?? '—'}</div>
                  </div>
                )}

                {selectedCaseLine?.warrantyStatus !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Warranty Status</div>
                    <div className="bg-white px-3 py-2 rounded border mt-1">{selectedCaseLine?.warrantyStatus ?? '—'}</div>
                  </div>
                )}

                {selectedCaseLine?.diagnosticTechId !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Diagnostic Tech ID</div>
                    <div className="font-mono bg-white px-3 py-2 rounded border mt-1">{selectedCaseLine?.diagnosticTechId ?? '—'}</div>
                  </div>
                )}

                {selectedCaseLine?.repairTechId !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Repair Tech ID</div>
                    <div className="font-mono bg-white px-3 py-2 rounded border mt-1">{selectedCaseLine?.repairTechId ?? '—'}</div>
                  </div>
                )}

                {selectedCaseLine?.rejectionReason !== undefined && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-600">Rejection Reason</div>
                    <div className="bg-muted p-3 rounded mt-1">{selectedCaseLine?.rejectionReason || '—'}</div>
                  </div>
                )}

                {selectedCaseLine?.updatedAt !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Update At</div>
                    <div className="bg-white px-3 py-2 rounded border mt-1 text-sm text-gray-800">{selectedCaseLine?.updatedAt ?? '—'}</div>
                  </div>
                )}
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
                  <div className="text-sm font-medium text-gray-600 mb-1">Update At</div>
                  <div className="text-sm text-gray-800">{selectedWarrantyCase?.updatedDate || 'N/A'}</div>
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
                    <span className="font-medium text-blue-700">Updat At:</span>
                    <span className="text-sm text-blue-900">{selectedWarrantyCase?.updatedDate || 'N/A'}</span>
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
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Updat At</span>
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
                          <span className="text-sm text-gray-800 font-semibold">{(selectedCaseLine.componentPrice * selectedCaseLine.quantity).toLocaleString('vi-VN')} VND</span>
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

            {/* Rejection Reason (if any) */}
            {selectedCaseLine?.rejectionReason && (
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
                        
                        {/* Case Lines nested under Guarantee Case */}
                        {caseLinesForCase.length > 0 ? (
                          <div className="p-4 space-y-3 bg-white">
                            {caseLinesForCase.map((caseLine, clIndex) => (
                              <div key={caseLine.caseLineId} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                                      {clIndex + 1}
                                    </span>
                                    {/* caseLine ID hidden from view per UX request */}
                                  </div>
                                  <Badge 
                                    variant={
                                      caseLine.warrantyStatus === 'ELIGIBLE' ? 'default' : 
                                      caseLine.status === 'rejected' ? 'destructive' : 
                                      'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {caseLine.warrantyStatus || caseLine.status}
                                  </Badge>
                                </div>
                                
                                {/* Correction only - diagnosis removed from UI */}
                                <div className="mb-3">
                                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-green-700 mb-1">Correction</p>
                                    <p className="text-sm text-slate-800">{caseLine.correctionText || 'N/A'}</p>
                                  </div>
                                </div>
                                
                                {/* Component Info */}
                                {caseLine.componentId && (
                                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-3">
                                    <div className="p-2 bg-blue-100 rounded">
                                      <Package className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-xs text-slate-600">Component</p>
                                      <p className="text-sm font-semibold text-slate-900">
                                        Component ID: {caseLine.componentId}
                                      </p>
                                      <p className="text-xs text-slate-500">Quantity: {caseLine.quantity}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Evidence Photos */}
                                {caseLine.evidenceImageUrls && caseLine.evidenceImageUrls.length > 0 && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Camera className="h-4 w-4 text-slate-600" />
                                      <p className="text-xs font-semibold text-slate-700">Evidence Photos ({caseLine.evidenceImageUrls.length})</p>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                      {caseLine.evidenceImageUrls.map((url, imgIndex) => (
                                        <div 
                                          key={imgIndex}
                                          className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                                          onClick={() => window.open(url, '_blank')}
                                        >
                                          <img 
                                            src={url} 
                                            alt={`Evidence ${imgIndex + 1}`}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* View Details Button */}
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                      // Validate case line ID before fetching
                                      const caseLineId = caseLine.caseLineId;
                                      if (!caseLineId || caseLineId.trim() === '') {
                                        console.error('❌ Invalid case line ID:', caseLine);
                                        toast({
                                          title: "Invalid Case Line",
                                          description: "This case line has no valid ID and cannot be viewed.",
                                          variant: "destructive"
                                        });
                                        return;
                                      }
                                      
                                      console.log('📋 Viewing case line with ID:', caseLineId);
                                      
                                      // Convert to CaseLine format for view modal
                                      const formattedCaseLine: CaseLine = {
                                        id: caseLineId,
                                        caseId: caseLine.guaranteeCaseId,
                                        damageLevel: 'medium',
                                        repairPossibility: 'repairable',
                                        warrantyDecision: caseLine.warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
                                        // Use correctionText as primary note now that diagnosis is removed
                                        technicianNotes: caseLine.correctionText || '',
                                        photos: caseLine.evidenceImageUrls || [],
                                        evidenceImageUrls: caseLine.evidenceImageUrls || [],
                                        createdDate: formatSafeDate(caseLine.createdAt),
                                        status: caseLine.status ?? 'submitted',
                                        correctionText: caseLine.correctionText,
                                        componentId: caseLine.componentId,
                                        quantity: caseLine.quantity,
                                        warrantyStatus: caseLine.warrantyStatus,
                                        diagnosticTechId: caseLine.techId,
                                        updatedAt: caseLine.updatedAt
                                      };
                                      handleViewCaseLine(formattedCaseLine);
                                    }}
                                  >
                                    <Eye className="h-3 w-3 mr-2" />
                                    View Full Details
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center text-slate-500 bg-slate-50">
                            <FileText className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm">No case lines created for this guarantee case yet.</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setViewCaseModalOpen(false)}>Close</Button>

            {selectedRecord && (selectedRecord.status !== 'COMPLETED') && (() => {
              // Check if ALL guarantee cases have at least one case line
              const guaranteeCases = selectedRecord.guaranteeCases || [];
              const allGuaranteeCasesHaveCaseLines = guaranteeCases.length > 0 && guaranteeCases.every(gc => 
                createdCaseLines.some(cl => cl.guaranteeCaseId === gc.guaranteeCaseId)
              );
              
              // Count how many guarantee cases are missing case lines
              const guaranteeCasesWithoutCaseLines = guaranteeCases.filter(gc =>
                !createdCaseLines.some(cl => cl.guaranteeCaseId === gc.guaranteeCaseId)
              );
              
              return (
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
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Report Modal from Processing Records */}
      <Dialog open={viewReportModalOpen} onOpenChange={setViewReportModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Warranty Report Preview</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Generated processing report for VIN {selectedRecord?.vin}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              <div className="text-center py-4 border-b">
                <h2 className="text-2xl font-bold text-blue-600">Warranty Report</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  📅 Generated on {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-blue-500 text-white rounded-full p-1.5">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-blue-700">Case Information</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Case ID:</span>
                      <span className="font-semibold text-blue-600">{(selectedRecord?.guaranteeCases?.[0]?.guaranteeCaseId as string | undefined)?.substring?.(0, 8) ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusBadgeVariant(selectedRecord.status)}>{getStatusLabel(selectedRecord.status)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created Date:</span>
                      <span className="font-medium">{formatDate(selectedRecord.checkInDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-green-500 text-white rounded-full p-1.5">
                      <Car className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-green-700">Vehicle Information</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VIN:</span>
                      <span className="font-semibold font-mono">{selectedRecord.vin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{selectedRecord.vehicle.model.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mileage:</span>
                      <span className="font-medium">{selectedRecord.odometer.toLocaleString()} km</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-cyan-500 text-white rounded-full p-1.5">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-cyan-700">Service Center Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Technician:</span>
                    <p className="font-medium">{selectedRecord.mainTechnician.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-in Date:</span>
                    <p className="font-medium">{formatDate(selectedRecord.checkInDate)}</p>
                  </div>
                </div>
              </div>

              { (selectedRecord?.guaranteeCases?.length ?? 0) > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-orange-500 text-white rounded-full p-1.5">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-orange-700">Diagnosis Report</h3>
                  </div>
                  <p className="text-sm">{selectedRecord.guaranteeCases[0]?.contentGuarantee}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setViewReportModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 shadow-sm">
                    <span className="text-white font-bold text-sm">1</span>
                  </div>
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
                                <div className="text-xs font-mono text-gray-500 mb-2">
                                  {gc.guaranteeCaseId}
                                </div>
                                {gc.contentGuarantee && (
                                  <div className="text-sm text-gray-700 mb-2">
                                    {gc.contentGuarantee}
                                  </div>
                                )}
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
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 shadow-sm">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
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
                    </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Component Selected</p>
                            <p className="text-sm font-bold text-green-900 mt-1 break-words">{componentSearchQuery || 'Selected'}</p>
                            {/* Show warranty status line below the name */}
                            <div className="mt-3 flex items-center gap-2">
                              {caseLineForm.warrantyStatus === 'ELIGIBLE' ? (
                                <Badge className="bg-green-500 text-white border-0 text-xs font-semibold px-3 py-1">
                                  ✓ Under Warranty
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500 text-white border-0 text-xs font-semibold px-3 py-1">
                                  ✗ Not Covered
                                </Badge>
                              )}
                            </div>
                            {/* Show full component ID */}
                            <div className="mt-3 bg-white/60 rounded-lg px-3 py-2 border border-green-200">
                              <p className="text-xs text-gray-600 font-semibold mb-0.5">Component ID</p>
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
                        } else {
                          // Find selected component
                          const selectedComponent = compatibleComponents.find(c => c.typeComponentId === value);
                          if (selectedComponent) {
                            const warrantyStatus = selectedComponent.isUnderWarranty ? 'ELIGIBLE' : 'INELIGIBLE';
                            // default quantity to 1 when a component is selected
                            setCaseLineForm(prev => ({ 
                              ...prev, 
                              componentId: selectedComponent.typeComponentId,
                              quantity: prev.quantity && prev.quantity > 0 ? prev.quantity : 1,
                              warrantyStatus: warrantyStatus
                            }));
                            setComponentSearchQuery(selectedComponent.name);
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
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {component.isUnderWarranty ? (
                                      <Badge className="bg-green-500 text-white border-0 text-xs font-semibold">
                                        ✓ Warranty
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-red-500 text-white border-0 text-xs font-semibold">
                                        ✗ No Warranty
                                      </Badge>
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
                  </div>

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
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Component ID</label>
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
            <DialogTitle className="flex items-center justify-between">
              <span>Component Reservations</span>
              {!isLoadingReservations && reservations.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  {reservations.length} total reservation{reservations.length !== 1 ? 's' : ''}
                </span>
              )}
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
    </div>
  );
};

export default TechnicianDashboard;