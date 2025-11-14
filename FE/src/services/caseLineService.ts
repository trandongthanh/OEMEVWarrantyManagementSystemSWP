import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface CaseLineRequest {
  diagnosisText: string;
  correctionText: string;
  componentId?: string | null;
  quantity: number;
  warrantyStatus: 'ELIGIBLE' | 'INELIGIBLE';
  rejectionReason?: string;
  evidenceImageUrls?: string[]; // Cloudinary image URLs
}

export interface CaseLine {
  caseLineId: string;
  guaranteeCaseId: string;
  diagnosisText: string;
  correctionText: string;
  componentId: string | null;
  componentName?: string; // Component name from typeComponent.name
  componentSku?: string; // Component SKU from typeComponent.sku
  componentPrice?: number; // Component price from typeComponent.price
  quantity: number;
  warrantyStatus: 'ELIGIBLE' | 'INELIGIBLE';
  techId: string;
  diagnosticTechnicianName?: string; // Name from diagnosticTechnician.name
  repairTechnicianName?: string | null; // Name from repairTechnician.name
  rejectionReason?: string | null; // Rejection reason if any
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'CUSTOMER_APPROVED' | 'REJECTED_BY_CUSTOMER' | 'PARTS_AVAILABLE' | 'READY_FOR_REPAIR' | 'COMPLETED' | 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  evidenceImageUrls?: string[]; // Cloudinary image URLs
}

export interface CreateCaseLinesResponse {
  status: string;
  data: {
    caseLines: CaseLine[];
  };
}

export interface GetCaseLinesResponse {
  status: string;
  data: {
    caseLines: CaseLine[];
  };
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ev_warranty_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const caseLineService = {
  // Create case lines for a guarantee case
  createCaseLines: async (guaranteeCaseId: string, caseLines: CaseLineRequest[]): Promise<CaseLine[]> => {
    try {
      console.debug('Creating case lines for case:', guaranteeCaseId);
      console.debug('Case lines data length:', caseLines.length);
      
      // Map frontend CaseLineRequest (which uses `componentId`) to backend shape
      // backend validator expects `typeComponentId` in each caseline item
      // IMPORTANT: do NOT send `diagnosisText` - backend validator rejects it
      // Build a sanitized payload: only include fields accepted by backend validators.
      // This defensively strips any unexpected keys (for example `diagnosisText`) so
      // older bundles or other call sites cannot send disallowed properties.
      const payload = {
        caselines: caseLines.map((cl: CaseLineRequest) => {
          // Explicitly pick allowed properties
          const correctionText = cl.correctionText;
          const typeComponentId = cl.componentId ?? null;
          const quantity = cl.quantity;
          const warrantyStatus = cl.warrantyStatus;
          const evidenceImageUrls = cl.evidenceImageUrls || [];

          // Build base payload
          const caselinePayload: Record<string, any> = {
            correctionText,
            typeComponentId,
            quantity,
            warrantyStatus,
            evidenceImageUrls,
          };

          // Only include rejectionReason if it has a value (not empty string)
          if (cl.rejectionReason && cl.rejectionReason.trim()) {
            caselinePayload.rejectionReason = cl.rejectionReason;
          }

          return caselinePayload;
        })
      };

      console.debug('📤 Payload being sent to backend:', JSON.stringify(payload, null, 2));
      console.debug('📸 Evidence image URLs in payload:', payload.caselines[0]?.evidenceImageUrls);

      const response = await apiClient.post<CreateCaseLinesResponse>(
        `/guarantee-cases/${guaranteeCaseId}/case-lines`,
        payload
      );
      
      console.debug('✅ Case lines created (raw response):', response.data);

      // Backend returns response.data.data.caseLines with structure:
      // { id, correctionText, typeComponentId, quantity, warrantyStatus, 
      //   status, guaranteeCaseId, diagnosticTechId, createdAt, updatedAt }
      // NOTE: Backend model does NOT include diagnosisText or evidenceImageUrls in current schema
      const rawCaseLines = (response.data?.data?.caseLines || []) as unknown[];

      // Normalize: backend returns `id` (not caseLineId) and `diagnosticTechId` (not techId)
       
      const normalized: CaseLine[] = rawCaseLines.map((cl: unknown): CaseLine => {
        const c = cl as Record<string, unknown>;
        return {
          caseLineId: String(c.id ?? ''), // Backend returns `id`
          guaranteeCaseId: String(c.guaranteeCaseId ?? ''),
          diagnosisText: '', // Backend does not return diagnosisText; leave empty for now
          correctionText: String(c.correctionText ?? ''),
          componentId: c.typeComponentId ? String(c.typeComponentId) : null, // Backend returns `typeComponentId`
          quantity: typeof c.quantity === 'number' ? c.quantity : 0,
          warrantyStatus: (c.warrantyStatus as 'ELIGIBLE' | 'INELIGIBLE') ?? 'ELIGIBLE',
          techId: String(c.diagnosticTechId ?? ''), // Backend returns `diagnosticTechId`
          status: (c.status as CaseLine['status']) ?? 'DRAFT',
          createdAt: String(c.createdAt ?? ''),
          updatedAt: String(c.updatedAt ?? ''),
          evidenceImageUrls: [], // Backend does not persist evidenceImageUrls yet
        };
      });

      console.debug('📦 Case lines normalized: %d items', normalized.length);
      console.debug('📸 Evidence URLs:', normalized[0]?.evidenceImageUrls);
      return normalized;
    } catch (error) {
      console.debug('Error creating case lines');
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create case lines');
      }
      throw error;
    }
  },

  // Get all case lines for a guarantee case
  getCaseLines: async (guaranteeCaseId: string): Promise<CaseLine[]> => {
    try {
      console.debug('Fetching case lines for case:', guaranteeCaseId);
      
      const response = await apiClient.get<GetCaseLinesResponse>(
        `/guarantee-cases/${guaranteeCaseId}/case-lines`
      );
      
      console.debug('Case lines fetched: %d', response.data?.data?.caseLines?.length ?? 0);
      return response.data.data.caseLines;
    } catch (error) {
      console.debug('Error fetching case lines');
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch case lines');
      }
      throw error;
    }
  },

  // Delete a case line by ID
  deleteCaseLine: async (caseLineId: string): Promise<boolean> => {
    try {
      console.debug('Deleting case line:', caseLineId);
      const token = localStorage.getItem('ev_warranty_token');
      if (!token) {
        // Avoid calling backend without auth token which causes server-side code to access undefined user
        throw new Error('Authentication required. Please login before deleting a case line.');
      }
      const response = await apiClient.delete(`/case-lines/${caseLineId}`);
      console.debug('Delete response status:', response.status);
      return response.data?.status === 'success';
    } catch (error) {
      console.debug('Error deleting case line');
      if (axios.isAxiosError(error)) {
        // Prefer a clearer user-facing message when backend fails due to auth/user issues
        const backendMessage = error.response?.data?.message;
        if (backendMessage && backendMessage.toString().toLowerCase().includes('userid')) {
          throw new Error('Delete failed: missing or invalid authentication (userId). Please login again.');
        }
        throw new Error(backendMessage || 'Failed to delete case line');
      }
      throw error;
    }
  },

  // Get case line detail by ID
  // Return null when case line not found (404) to avoid noisy stack traces in UI
  getCaseLineById: async (caseLineId: string): Promise<CaseLine | null> => {
    try {
      console.debug('🔍 Fetching case line detail for:', caseLineId);

      const response = await apiClient.get(`/case-lines/${caseLineId}`);

      console.debug('✅ Case line detail response:', response.data);

      // Backend returns response.data.data.caseLine with structure matching create response
      const cl = response.data?.data?.caseLine;

      if (!cl) {
        console.warn('⚠️ Case line not found in API response for ID:', caseLineId);
        return null;
      }

      console.debug('🔍 Component data from API:', cl.typeComponent);
      console.debug('🔍 Diagnostic technician data:', cl.diagnosticTechnician);
      console.debug('🔍 Repair technician data:', cl.repairTechnician);

      const normalized: CaseLine = {
        caseLineId: cl.id, // Backend returns `id`
        guaranteeCaseId: cl.guaranteeCaseId,
        diagnosisText: cl.diagnosisText,
        correctionText: cl.correctionText,
        componentId: cl.typeComponentId, // Backend returns `typeComponentId`
        componentName: cl.typeComponent?.name, // Extract component name
        componentSku: cl.typeComponent?.sku, // Extract component SKU
        componentPrice: cl.typeComponent?.price, // Extract component price
        quantity: cl.quantity,
        warrantyStatus: cl.warrantyStatus,
        techId: cl.diagnosticTechId, // Backend returns `diagnosticTechId`
        diagnosticTechnicianName: cl.diagnosticTechnician?.name, // Extract diagnostic technician name
        repairTechnicianName: cl.repairTechnician?.name || null, // Extract repair technician name (can be null)
        rejectionReason: cl.rejectionReason || null, // Extract rejection reason
        status: cl.status,
        createdAt: cl.createdAt,
        updatedAt: cl.updatedAt,
        evidenceImageUrls: cl.evidenceImageUrls || [],
      };

      console.debug('📦 Normalized case line:', normalized);
      console.debug('🏷️ Component name extracted:', normalized.componentName);
      console.debug('📸 Evidence images in case line:', normalized.evidenceImageUrls);
      return normalized;
    } catch (error) {
      // If backend returns 404, treat as 'not found' and return null to caller
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          console.warn('⚠️ Case line not found (404) for ID:', caseLineId);
          return null;
        }
        // For other axios errors, surface a clearer message
        throw new Error(error.response?.data?.message || 'Failed to fetch case line detail');
      }
      throw error;
    }
  }
};
