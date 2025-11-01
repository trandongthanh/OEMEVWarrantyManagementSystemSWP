import React, { useState, useEffect, useCallback } from "react";

// Defensive: ensure a module-scoped fallback for any leftover dev-only variable
// (some HMR edits previously added/removed pickup UI and a variable named
// `reservationIdInput` accidentally; declare it here to avoid ReferenceError
// during development while we fully remove any stale usage).
let reservationIdInput: string | undefined;
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
  CheckCircle
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
  // Additional backend fields (optional) - surface them in the Details modal when available
  diagnosisText?: string;
  correctionText?: string;
  typeComponentId?: string | null;
  componentId?: string | null;
  quantity?: number;
  warrantyStatus?: string | null;
  diagnosticTechId?: string | null;
  repairTechId?: string | null;
  rejectionReason?: string | null;
  updatedAt?: string | null;
  evidenceImageUrls?: string[]; // Cloudinary image URLs
}

interface IssueDiagnosisForm {
  affectedComponent: string;
  damageLevel: string;
  repairPossibility: string;
  warrantyDecision: string;
  technicianNotes: string;
}

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
  evidenceImageUrls?: string[]; // Cloudinary image URLs
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
  const [viewCaseLineModalOpen, setViewCaseLineModalOpen] = useState(false);
  const [selectedCaseLine, setSelectedCaseLine] = useState<CaseLine | null>(null);
  const [imagePreviewModalOpen, setImagePreviewModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  // caseline deletion removed per product request: no UI for removing case lines
  // NOTE: createCaseLineModalOpen is not used - modal exists but no trigger button

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
  
  
  // Processing Records form (uses CaseLineRequest for API)
  const [caseLineForm, setCaseLineForm] = useState<CaseLineRequest>({
    diagnosisText: '',
    correctionText: '',
    componentId: null,
    quantity: 1,
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
  const [compatibleComponents, setCompatibleComponents] = useState<Array<{ typeComponentId: string; name: string }>>([]);
  const [componentSearchQuery, setComponentSearchQuery] = useState<string>("");
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);

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
    const diagnosisText = (r['diagnosisText'] ?? r['diagnosis_text']) as string | undefined ?? '';
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
              const damageLevel = (mm['damageLevel'] as string) ?? 'N/A';
              const warrantyStatus = (mm['warrantyStatus'] as string) ?? (mm['warranty_status'] as string) ?? null;
              const diag = (mm['diagnosisText'] ?? mm['diagnosis_text']) as string | undefined || '';
              const corr = (mm['correctionText'] ?? mm['correction_text']) as string | undefined || '';
              const photos = Array.isArray(mm['photos']) ? (mm['photos'] as string[]) : [];
              const createdAt = (mm['createdAt'] ?? mm['created_at']) as string | undefined || new Date().toLocaleDateString('en-GB');

              return {
                id,
                caseId,
                damageLevel,
                repairPossibility: 'N/A',
                warrantyDecision: warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
                technicianNotes: `${diag} | ${corr}`,
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
  const API_BASE_URL = 'http://localhost:3000/api/v1';

  // Helper function để lấy token
  const getAuthToken = () => {
    const token = localStorage.getItem('ev_warranty_token');
    // avoid logging tokens to console; signal auth presence only
    if (!token) {
      console.debug('No auth token found in localStorage');
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

    console.debug(`API Call: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    console.debug(`Response: ${response.status} ${response.statusText}`);

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
      
      console.log('Fetching all processing records...');
      
      // Get all records
      const allRecords = await processingRecordsService.getAllProcessingRecords();
      setProcessingRecords(allRecords);
      
      // Group records by status
      const groupedRecords = await processingRecordsService.getProcessingRecordsGroupedByStatus();
      setRecordsByStatus(groupedRecords);
      
      console.log('Fetched processing records:', allRecords);
      console.log('Grouped by status:', groupedRecords);
      
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
      console.log('📡 Fetching records with status: IN_DIAGNOSIS');
      
      const inDiagnosisRecords = await processingRecordsService.getProcessingRecordsByStatus('IN_DIAGNOSIS');

      console.log('📦 Received records:', inDiagnosisRecords);
      console.log(`✅ Loaded ${inDiagnosisRecords.length} records in diagnosis`);

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
      
      console.log('💾 State updated with records');

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
          console.log('🔁 Loading case-lines for guarantee cases:', guaranteeIds);
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
                  const damageLevel = mm.diagnosisText || 'N/A';
                  const warrantyStatus = mm.warrantyStatus || null;
                  const diag = mm.diagnosisText || '';
                  const corr = mm.correctionText || '';
                  const photos: string[] = [];
                  const createdAt = mm.createdAt ?? new Date().toLocaleDateString('en-GB');
                  const status = (mm.status as string) ?? 'submitted';

                  return {
                    id,
                    caseId,
                    damageLevel,
                    repairPossibility: 'N/A',
                    warrantyDecision: warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
                    technicianNotes: `${diag} | ${corr}`,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // NOTE: createCaseLines handled by `caseLineService.createCaseLines` (uses axios POST).
  // Keep component-side logic (handleCreateIssueDiagnosis) using the service so created
  // case-lines are persisted to backend and then merged into local state for display.

  // Fetch components để hiển thị trong dropdown
  const fetchComponents = useCallback(async () => {
    try {
      const data = await apiCall('/components');
      console.log('Fetched components:', data);
      // Có thể lưu vào state nếu cần hiển thị dropdown components
    } catch (error) {
      console.error('Error fetching components:', error);
    }
  }, [apiCall]);

  // Fetch case lines đã tạo cho guarantee case
  const fetchCaseLinesForCase = useCallback(async (guaranteeCaseId: string): Promise<unknown[]> => {
    try {
      const data = await apiCall(`/guarantee-cases/${guaranteeCaseId}/case-lines`);
      console.log('Fetched case lines for case:', data);
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
      console.log('🔍 Fetching components for recordId:', recordId, 'searchName:', searchName);
      
      const components = await processingRecordsService.getCompatibleComponents(
        recordId,
        { searchName }
      );
      console.log('✅ Fetched components:', components);
      // Set components directly without transformation since API doesn't provide isUnderWarranty
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

  // Search components without recordId dependency
  const searchComponents = useCallback(async (searchName: string) => {
    if (!searchName || searchName.length < 2) {
      setCompatibleComponents([]);
      return;
    }

    try {
      setIsLoadingComponents(true);
      console.log('🔍 Searching components with name:', searchName);

      const components = await processingRecordsService.searchComponents(
        { searchName }
      );
      console.log('✅ Fetched components:', components);
      // Set components directly without transformation since API doesn't provide isUnderWarranty
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
    if (!caseLineForm.diagnosisText || !caseLineForm.correctionText) {
      toast({
        title: "Validation Error",
        description: "Please fill in diagnosis and correction text",
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
      const guaranteeCase = selectedRecord.guaranteeCases[0];
      
      console.log('🚀 Creating case line for guarantee case:', guaranteeCase.guaranteeCaseId);

      // Upload images to Cloudinary first (if any)
      let evidenceImageUrls: string[] = [];
      if (uploadedFiles.length > 0) {
        toast({
          title: "Uploading Images",
          description: `Uploading ${uploadedFiles.length} image(s) to Cloudinary...`,
        });

        try {
          const { uploadImagesToCloudinary } = await import('@/services/cloudinaryService');
          evidenceImageUrls = await uploadImagesToCloudinary(uploadedFiles, (fileIndex, progress) => {
            console.log(`Uploading image ${fileIndex + 1}/${uploadedFiles.length}: ${progress.percentage}%`);
          });
          
          console.log('✅ Images uploaded to Cloudinary:', evidenceImageUrls);
          
          toast({
            title: "Images Uploaded",
            description: `Successfully uploaded ${evidenceImageUrls.length} image(s)`,
          });
        } catch (uploadError) {
          console.error('Failed to upload images:', uploadError);
          toast({
            title: "Image Upload Failed",
            description: uploadError instanceof Error ? uploadError.message : "Failed to upload images to Cloudinary",
            variant: "destructive"
          });
          // Continue without images if upload fails
          evidenceImageUrls = [];
        }
      }

      // Create case line with image URLs
      const caseLineWithImages = {
        ...caseLineForm,
        evidenceImageUrls
      };

      const serverCreatedCaseLines = await caseLineService.createCaseLines(
        guaranteeCase.guaranteeCaseId,
        [caseLineWithImages]
      );

      console.log('✅ Case lines created:', serverCreatedCaseLines);

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
        technicianNotes: `${serverCreatedCaseLines[0].diagnosisText} | ${serverCreatedCaseLines[0].correctionText}`,
        photos: evidenceImageUrls, // Use Cloudinary URLs instead of local URLs
        photoFiles: [], // No need to store files anymore
        createdDate: new Date(serverCreatedCaseLines[0].createdAt).toLocaleDateString('en-GB'),
        status: serverCreatedCaseLines[0].status === 'pending' ? 'submitted' : 'approved',
        evidenceImageUrls // Store Cloudinary URLs
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
        title: "Case Line Created",
        description: `Case line ${createdIdSuffix} has been created successfully. View it in the Processing Record details.`,
      });

      setCaseLineForm({
        diagnosisText: '',
        correctionText: '',
        componentId: null,
        quantity: 1,
        warrantyStatus: 'ELIGIBLE'
      });
      setUploadedFiles([]);
      setUploadedFileUrls([]);
      setComponentSearchQuery('');
      setCompatibleComponents([]);
      setCreateIssueDiagnosisModalOpen(false);
      
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
      console.log('🚀 TechnicianDashboard useEffect triggered');
      console.log('👤 User state:', user);
      console.log('🔍 LocalStorage token:', localStorage.getItem('ev_warranty_token') ? 'Present' : 'Missing');
      
      if (user) {
        console.log('✅ User authenticated, fetching data...');
        console.log('🔄 User details:', {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        });
        
        await fetchProcessingRecords();
        // Do not fetch global /components on init to avoid 404 noisy logs when backend
        // doesn't expose that endpoint. Components are fetched when needed (e.g. when
        // opening Create Issue Diagnosis modal via fetchCompatibleComponents).
      } else {
        console.log('❌ No user found, cannot fetch data');
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
        console.log('Auto refreshing processing records...');
        fetchProcessingRecords();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, isLoading, fetchProcessingRecords, autoRefreshEnabled]);

  // Fetch case lines when guarantee case is selected
  useEffect(() => {
    const loadCaseLines = async () => {
      if (selectedGuaranteeCase) {
        console.log('Loading case lines for selected guarantee case...');
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
  useEffect(() => {
    console.log('Processing records updated:', processingRecords.length, 'records');
  }, [processingRecords]);

  useEffect(() => {
    console.log('Created case lines updated:', createdCaseLines.length, 'case lines');
  }, [createdCaseLines]);

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
      // Open modal immediately with loading state
      setViewCaseLineModalOpen(true);
      
      console.log('🔍 Fetching case line detail from API for ID:', caseLine.id);
      
      // Call API to get full case line detail including images
      const detailedCaseLine = await caseLineService.getCaseLineById(caseLine.id);
      
      console.log('✅ Received detailed case line from API:', detailedCaseLine);
      console.log('📸 Evidence images:', detailedCaseLine.evidenceImageUrls);
      
      // Map backend CaseLine to frontend CaseLine format
      const enriched: CaseLine = {
        id: detailedCaseLine.caseLineId,
        caseId: detailedCaseLine.guaranteeCaseId,
        damageLevel: 'medium',
        repairPossibility: 'repairable',
        warrantyDecision: detailedCaseLine.warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
        technicianNotes: `${detailedCaseLine.diagnosisText} | ${detailedCaseLine.correctionText}`,
        photos: detailedCaseLine.evidenceImageUrls || [],
        evidenceImageUrls: detailedCaseLine.evidenceImageUrls || [],
        createdDate: new Date(detailedCaseLine.createdAt).toLocaleDateString('en-GB'),
        status: detailedCaseLine.status === 'pending' ? 'submitted' : 'approved',
        diagnosisText: detailedCaseLine.diagnosisText,
        correctionText: detailedCaseLine.correctionText,
        componentId: detailedCaseLine.componentId,
        quantity: detailedCaseLine.quantity,
        warrantyStatus: detailedCaseLine.warrantyStatus,
        diagnosticTechId: detailedCaseLine.techId,
        updatedAt: detailedCaseLine.updatedAt
      };

      console.log('🎨 Enriched case line for display:', enriched);
      setSelectedCaseLine(enriched);
    } catch (err) {
      console.error('❌ Failed to fetch case line detail from API:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load case line details",
        variant: "destructive"
      });
      
      // Fallback to local data if API fails
      setSelectedCaseLine(caseLine);
    }
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
      
  <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="processing-records">Processing Records</TabsTrigger>
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
                                    console.log('🔘 Create Issue Diagnosis button clicked for record:', record);

                                    try {
                                      // Try to pick a usable id from common fields so component search can run when possible.
                                      const recMap = record as unknown as Record<string, unknown>;
                                      const candidateId = record.recordId
                                        || (typeof recMap['vehicleProcessingRecordId'] === 'string' ? recMap['vehicleProcessingRecordId'] as string : (recMap['vehicleProcessingRecordId'] ?? ''))
                                        || (typeof recMap['processing_record_id'] === 'string' ? recMap['processing_record_id'] as string : (recMap['processing_record_id'] ?? ''))
                                        || (typeof recMap['id'] === 'string' ? recMap['id'] as string : (recMap['id'] ?? ''))
                                        || '';

                                      setSelectedRecord(record);
                                      setCreateIssueDiagnosisModalOpen(true);

                                      if (candidateId) {
                                        console.log('✅ Using candidate recordId for component fetch:', candidateId);
                                        // try fetching compatible components but don't block the UI if it fails
                                        fetchCompatibleComponents(candidateId.toString()).catch(error => {
                                          console.error('❌ Failed to fetch components:', error);
                                          toast({
                                            title: "Component Fetch Failed",
                                            description: "Failed to fetch compatible components. You can still create the case line.",
                                            variant: "destructive"
                                          });
                                        });

                                        toast({
                                          title: "Component Search Available",
                                          description: "Compatible components will be searched automatically.",
                                        });
                                      } else {
                                        console.warn('⚠️ No candidate recordId found on record, component search will be unavailable');
                                        toast({
                                          title: "Component Search Unavailable",
                                          description: "Record ID not available. You can still create case line without component search.",
                                          variant: "destructive"
                                        });
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

          {/* Work Schedules Tab (replaced Components + Staff Management) */}
          <TabsContent value="work-schedules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Schedules</CardTitle>
                <CardDescription>
                  View your assigned work schedules and availability. Use the Work Schedules API to fetch real data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    This tab shows your personal work schedules. Data is fetched from
                    <code className="ml-2 font-mono">/work-schedules/my-schedule</code>.
                  </div>
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
                          <TableHead>Schedule ID</TableHead>
                          <TableHead>Work Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead>Technician Name</TableHead>
                          <TableHead>Technician Email</TableHead>
                          <TableHead>Technician ID</TableHead>
                          <TableHead>Created At</TableHead>
                          <TableHead>Updated At</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {workSchedules.map((s) => (
                          <TableRow key={s.scheduleId}>
                            <TableCell className="font-mono text-xs">{s.scheduleId}</TableCell>
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
                            <TableCell className="font-mono text-xs">{s.technicianId ?? s.technician_id ?? '—'}</TableCell>
                            <TableCell className="text-xs">
                              {s.createdAt ? (
                                <div className="text-right">
                                  <div>{new Date(s.createdAt).toLocaleTimeString()}</div>
                                  <div className="text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</div>
                                </div>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              {s.updatedAt ? (
                                <div className="text-right">
                                  <div>{new Date(s.updatedAt).toLocaleTimeString()}</div>
                                  <div className="text-muted-foreground">{new Date(s.updatedAt).toLocaleDateString()}</div>
                                </div>
                              ) : (
                                '—'
                              )}
                            </TableCell>
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
                {selectedCaseLine?.diagnosisText !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Diagnosis Text</div>
                    <div className="bg-muted p-3 rounded mt-1">{selectedCaseLine?.diagnosisText || '—'}</div>
                  </div>
                )}

                {selectedCaseLine?.correctionText !== undefined && (
                  <div>
                    <div className="text-sm text-gray-600">Correction Text</div>
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
                    <div className="text-sm text-gray-600">Last Updated</div>
                    <div className="bg-white px-3 py-2 rounded border mt-1">{selectedCaseLine?.updatedAt ?? '—'}</div>
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

      {/* View Issue Diagnosis Modal */}
      <Dialog open={viewCaseLineModalOpen} onOpenChange={setViewCaseLineModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-xl font-semibold">Issue Diagnosis Details</DialogTitle>
            <DialogDescription className="text-base">
              Detailed information for issue diagnosis <span className="font-mono font-medium">{selectedCaseLine?.id}</span>
            </DialogDescription>
          </DialogHeader>
          
          {(() => {
            // Debug: Log selected case line data
            console.log('🔍 Selected Case Line:', selectedCaseLine);
            console.log('📸 Evidence Image URLs:', selectedCaseLine?.evidenceImageUrls);
            console.log('📷 Photos:', selectedCaseLine?.photos);
            return null;
          })()}
          
          <div className="space-y-6">
            {/* Case Line Information - single row split into two sides */}
            <div className="flex gap-6 items-start">
              {/* Left side: Basic Information + Diagnosis */}
              <div className="flex-1 space-y-4">
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
                      <span className="text-lg bg-white px-3 py-2 rounded border">{selectedCaseLine?.createdDate || 'N/A'}</span>
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

                {/* Diagnosis moved into Technician Notes - removed separate block */}
              </div>

              {/* Right side: Component & Warranty + Correction */}
              <div className="w-1/2 space-y-4">
                <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Wrench className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-lg text-yellow-900">Component & Warranty Details</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedCaseLine?.componentId && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-yellow-700">Component ID</span>
                        <span className="text-sm bg-white px-3 py-2 rounded border font-mono">{selectedCaseLine.componentId}</span>
                      </div>
                    )}
                    {selectedCaseLine?.quantity !== undefined && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-yellow-700">Quantity</span>
                        <span className="text-lg bg-white px-3 py-2 rounded border">{selectedCaseLine.quantity}</span>
                      </div>
                    )}
                    {selectedCaseLine?.warrantyStatus && (
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-yellow-700">Warranty Status</span>
                        <div className="bg-white px-3 py-2 rounded border">
                          <Badge 
                            variant={selectedCaseLine.warrantyStatus === 'ELIGIBLE' ? 'default' : 'destructive'}
                            className="text-sm px-3 py-1"
                          >
                            {selectedCaseLine.warrantyStatus}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Correction moved into Technician Notes - removed separate block */}
              </div>
            </div>

            {/* Technician Information */}
            {(selectedCaseLine?.diagnosticTechId || selectedCaseLine?.repairTechId) && (
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-indigo-900">Technician Information</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCaseLine?.diagnosticTechId && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-indigo-700">Diagnostic Technician ID</span>
                      <span className="text-sm bg-white px-3 py-2 rounded border font-mono">{selectedCaseLine.diagnosticTechId}</span>
                    </div>
                  )}
                  {selectedCaseLine?.repairTechId && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-sm font-medium text-indigo-700">Repair Technician ID</span>
                      <span className="text-sm bg-white px-3 py-2 rounded border font-mono">{selectedCaseLine.repairTechId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejection Reason (if any) */}
            {selectedCaseLine?.rejectionReason && (
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-red-900">Rejection Reason</h4>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <p className="text-base leading-relaxed text-red-800">{selectedCaseLine.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Updated Date */}
            {selectedCaseLine?.updatedAt && (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Last Updated:</span>
                  <span className="text-sm text-slate-900">{new Date(selectedCaseLine.updatedAt).toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Technician Notes split into two fields: Diagnosis and Correction */}
            {selectedCaseLine && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-lg text-gray-900">Technician Notes</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Diagnosis Text</span>
                    <div className="bg-white p-3 rounded-lg border mt-2">
                      <p className="text-sm text-gray-800">{selectedCaseLine.diagnosisText || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm font-medium text-gray-700">Correction Text</span>
                    <div className="bg-white p-3 rounded-lg border mt-2">
                      <p className="text-sm text-gray-800">{selectedCaseLine.correctionText || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Evidence Photos from Cloudinary */}
            {(() => {
              const photoUrls = selectedCaseLine?.evidenceImageUrls || selectedCaseLine?.photos || [];
              return photoUrls.length > 0 ? (
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-lg text-green-900">Evidence Photos ({photoUrls.length})</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photoUrls.map((photo, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-green-300 hover:shadow-lg transition-shadow">
                        <div className="aspect-square mb-3 overflow-hidden rounded">
                          <img 
                            src={photo} 
                            alt={`Evidence Photo ${index + 1}`}
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
                          <p className="text-sm text-center text-green-700 font-medium">Evidence Photo {index + 1}</p>
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
              ) : null;
            })()}
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

      {/* Confirm remove dialog removed — deletion disabled in UI */}

      {/* View Case Modal from Processing Records */}
      <Dialog open={viewCaseModalOpen} onOpenChange={setViewCaseModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">Processing Record Details</DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                  VIN: {selectedRecord?.vin}
                </DialogDescription>
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
              {/* Basic Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <Car className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">VIN</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRecord.vin}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">Vehicle Model</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRecord.vehicle.model.name}</p>
                    <p className="text-xs text-slate-500">Model ID: {selectedRecord.vehicle.model.vehicleModelId}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">Odometer</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRecord.odometer.toLocaleString()} km</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">Check-in Date</p>
                    <p className="text-sm font-bold text-slate-900">{formatDate(selectedRecord.checkInDate)}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-600">Created by Staff</p>
                    <p className="text-sm font-bold text-slate-900">{selectedRecord.createdByStaff.name}</p>
                    <p className="text-xs text-slate-500">Staff ID: {selectedRecord.createdByStaff.userId}</p>
                  </div>
                </div>
              </div>

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
                                <span className="font-medium">Content:</span> {guaranteeCase.contentGuarantee}
                              </p>
                              <p className="text-xs text-slate-400 mt-1 font-mono">
                                ID: {guaranteeCase.guaranteeCaseId}
                              </p>
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
                                    <span className="text-xs font-mono text-slate-500">
                                      {caseLine.caseLineId}
                                    </span>
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
                                
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  {/* Diagnosis */}
                                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-orange-700 mb-1">Diagnosis</p>
                                    <p className="text-sm text-slate-800">{caseLine.diagnosisText || 'N/A'}</p>
                                  </div>
                                  
                                  {/* Correction */}
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
                                      // Convert to CaseLine format for view modal
                                      const formattedCaseLine: CaseLine = {
                                        id: caseLine.caseLineId,
                                        caseId: caseLine.guaranteeCaseId,
                                        damageLevel: 'medium',
                                        repairPossibility: 'repairable',
                                        warrantyDecision: caseLine.warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
                                        technicianNotes: `${caseLine.diagnosisText} | ${caseLine.correctionText}`,
                                        photos: caseLine.evidenceImageUrls || [],
                                        evidenceImageUrls: caseLine.evidenceImageUrls || [],
                                        createdDate: new Date(caseLine.createdAt).toLocaleDateString('en-GB'),
                                        status: caseLine.status === 'pending' ? 'submitted' : 'approved',
                                        diagnosisText: caseLine.diagnosisText,
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

              {/* Assigned Technicians Section */}
              <div className="bg-white border border-slate-300 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Assigned Technicians</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{selectedRecord.mainTechnician.name}</p>
                      <p className="text-xs text-slate-500">Main Technician • ID: {selectedRecord.mainTechnician.userId}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="bg-white border border-slate-300 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Timeline</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 rounded-full mt-0.5">
                      <Calendar className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Case Submitted</p>
                      <p className="text-xs text-slate-500">{formatDate(selectedRecord.checkInDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Vehicle Check-in</p>
                      <p className="text-xs text-slate-500">{formatDate(selectedRecord.checkInDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="outline" onClick={() => setViewCaseModalOpen(false)}>Close</Button>

            {selectedRecord && (selectedRecord.status !== 'COMPLETED') && (
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
                  try {
                    await completeProcessingRecord(candidateId);
                  } catch (err) {
                    // error already handled in helper
                  }
                }}
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : 'Complete Record'}
              </Button>
            )}
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
        console.log('📝 Dialog onOpenChange:', open);
        setCreateIssueDiagnosisModalOpen(open);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Issue Diagnosis</DialogTitle>
            <DialogDescription>
              Create a new issue diagnosis for VIN: {selectedRecord?.vin || 'N/A'}
              {selectedRecord?.recordId && ` (Record: ${(selectedRecord.recordId as string | undefined)?.substring?.(0, 8) ?? ''}...)`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-base">🚗 Vehicle & Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vehicle VIN</Label>
                        <Input 
                          placeholder="Enter vehicle VIN..." 
                          defaultValue={selectedRecord.vin}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle Model</Label>
                        <Input 
                          placeholder="Vehicle model..." 
                          defaultValue={selectedRecord.vehicle.model.name}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.1rem' }}>
                    <div className="space-y-2">
                      <Label>Technician</Label>
                      <Input 
                        placeholder="Technician name..." 
                        defaultValue={selectedRecord.mainTechnician.name}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-base mb-4">🔧 Case Line Details</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosisText">Diagnosis Text *</Label>
                    <Textarea 
                      id="diagnosisText"
                      value={caseLineForm.diagnosisText}
                      onChange={(e) => setCaseLineForm(prev => ({ ...prev, diagnosisText: e.target.value }))}
                      placeholder="Describe the problem diagnosis..."
                      className="min-h-24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correctionText">Correction Text *</Label>
                    <Textarea 
                      id="correctionText"
                      value={caseLineForm.correctionText}
                      onChange={(e) => setCaseLineForm(prev => ({ ...prev, correctionText: e.target.value }))}
                      placeholder="Describe the correction action..."
                      className="min-h-24"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="componentSearch">Component Search (Optional)</Label>
                    <div className="relative">
                      <Input 
                        id="componentSearch"
                        value={componentSearchQuery}
                        onChange={(e) => {
                          const q = e.target.value;
                          setComponentSearchQuery(q);
                          // Search components when typing: prefer fetching compatible components for the selected record
                          if (q.length >= 2) {
                            try {
                              // Try to derive a candidate record id from selectedRecord
                              const recMap = (selectedRecord as unknown) as Record<string, unknown> | null;
                              const candidateId = recMap && (
                                (recMap['recordId'] as string) ||
                                (recMap['vehicleProcessingRecordId'] as string) ||
                                (recMap['processing_record_id'] as string) ||
                                (recMap['id'] as string) || ''
                              );

                              if (candidateId) {
                                // Use record-scoped compatible components endpoint (provides more relevant results)
                                fetchCompatibleComponents(candidateId, q).catch((err) => {
                                  console.error('Failed to fetch compatible components for search:', err);
                                  // fallback to generic search if record-scoped endpoint fails
                                  searchComponents(q).catch(() => setCompatibleComponents([]));
                                });
                              } else {
                                // No selected record / id available — fall back to generic search
                                searchComponents(q);
                              }
                            } catch (err) {
                              console.error('Error while searching components:', err);
                              searchComponents(q).catch(() => setCompatibleComponents([]));
                            }
                          } else {
                            setCompatibleComponents([]);
                          }
                        }}
                        placeholder="Search components..."
                      />
                      {isLoadingComponents && (
                        <div className="absolute right-2 top-2">
                          <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      )}
                      {/* Dropdown results */}
                      {componentSearchQuery.length >= 2 && Array.isArray(compatibleComponents) && compatibleComponents.length > 0 && (
                        <div className="absolute z-50 bg-white border rounded mt-1 w-full max-h-60 overflow-auto shadow-lg">
                          {compatibleComponents.map((component) => (
                            <div
                              key={component.typeComponentId}
                              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                              onClick={() => {
                                setCaseLineForm(prev => ({ ...prev, componentId: component.typeComponentId }));
                                setComponentSearchQuery(component.name);
                              }}
                            >
                              <div className="flex-1">
                                <span className="text-sm font-medium">{component.name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-400">{component.typeComponentId.slice(0, 8)}...</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {componentSearchQuery.length >= 2 && !isLoadingComponents && compatibleComponents.length === 0 && (
                        <div className="absolute z-50 bg-white border rounded mt-1 w-full p-3 shadow-lg">
                          <p className="text-sm text-gray-500">No compatible components found</p>
                        </div>
                      )}
                    </div>
                    {caseLineForm.componentId && (
                      <p className="text-xs text-green-600">✓ Selected: {caseLineForm.componentId.slice(0, 8)}...</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      id="quantity"
                      type="number"
                      min="1"
                      value={caseLineForm.quantity}
                      onChange={(e) => setCaseLineForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warrantyStatus">Warranty Status *</Label>
                    <Select 
                      value={caseLineForm.warrantyStatus} 
                      onValueChange={(value: 'ELIGIBLE' | 'INELIGIBLE') => setCaseLineForm(prev => ({ ...prev, warrantyStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ELIGIBLE">✅ Eligible</SelectItem>
                        <SelectItem value="INELIGIBLE">❌ Ineligible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-base mb-4">📷 Documentation</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload Photos</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload photos of the issue, components, and diagnostic results
                      </p>
                      <input
                        type="file"
                        id="photo-upload-processing"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('photo-upload-processing')?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Choose Photos
                      </Button>
                    </div>
                    
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

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCreateIssueDiagnosisModalOpen(false);
                    setComponentSearchQuery('');
                    setCompatibleComponents([]);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCreateIssueDiagnosis}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Issue Diagnosis"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No record selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TechnicianDashboard;