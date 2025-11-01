import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface CaseLineRequest {
  diagnosisText: string;
  correctionText: string;
  componentId?: string | null;
  quantity: number;
  warrantyStatus: 'ELIGIBLE' | 'INELIGIBLE';
  evidenceImageUrls?: string[]; // Cloudinary image URLs
}

export interface CaseLine {
  caseLineId: string;
  guaranteeCaseId: string;
  diagnosisText: string;
  correctionText: string;
  componentId: string | null;
  quantity: number;
  warrantyStatus: 'ELIGIBLE' | 'INELIGIBLE';
  techId: string;
  status: 'pending' | 'approved' | 'rejected';
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
      const payload = {
        caselines: caseLines.map((cl: CaseLineRequest) => ({
          diagnosisText: cl.diagnosisText,
          correctionText: cl.correctionText,
          // backend expects typeComponentId; allow null when no component specified
          typeComponentId: cl.componentId ?? null,
          quantity: cl.quantity,
          warrantyStatus: cl.warrantyStatus,
          evidenceImageUrls: cl.evidenceImageUrls || [] // Send Cloudinary URLs
        }))
      };

      console.debug('📤 Payload being sent to backend:', JSON.stringify(payload, null, 2));
      console.debug('📸 Evidence image URLs in payload:', payload.caselines[0]?.evidenceImageUrls);

      const response = await apiClient.post<CreateCaseLinesResponse>(
        `/guarantee-cases/${guaranteeCaseId}/case-lines`,
        payload
      );
      
  console.debug('Case lines created (raw):', response.data);

      // Normalize response shape: backend may return `id` instead of `caseLineId` and `typeComponentId` instead of `componentId`.
      const rawCaseLines = response.data?.data?.caseLines || [];

  // rawCaseLines comes from backend and may have snake_case or different keys; allow flexible mapping
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized = rawCaseLines.map((cl: any) => ({
        caseLineId: cl.caseLineId ?? cl.id ?? cl.case_line_id,
        guaranteeCaseId:
          cl.guaranteeCaseId ?? cl.guarantee_case_id ?? cl.guaranteeCase?.guaranteeCaseId ?? null,
        diagnosisText: cl.diagnosisText ?? cl.diagnosis_text ?? null,
        correctionText: cl.correctionText ?? cl.correction_text ?? null,
        componentId: cl.componentId ?? cl.typeComponentId ?? cl.type_component_id ?? null,
        quantity: cl.quantity ?? 0,
        warrantyStatus: cl.warrantyStatus ?? cl.warranty_status ?? null,
        techId: cl.techId ?? cl.diagnosticTechId ?? cl.diagnostic_tech_id ?? null,
        status: cl.status ?? null,
        createdAt: cl.createdAt ?? cl.created_at ?? null,
        updatedAt: cl.updatedAt ?? cl.updated_at ?? null,
        evidenceImageUrls: cl.evidenceImageUrls ?? cl.evidence_image_urls ?? [],
      }));

      console.debug('Case lines created (normalized): %d items', normalized.length);
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
  getCaseLineById: async (caseLineId: string): Promise<CaseLine> => {
    try {
      console.debug('🔍 Fetching case line detail for:', caseLineId);
      
      const response = await apiClient.get(`/case-lines/${caseLineId}`);
      
      console.debug('✅ Case line detail response:', response.data);
      
      // Normalize response shape from backend
      const cl = response.data?.data?.caseLine;
      
      if (!cl) {
        throw new Error('Case line not found');
      }

      const normalized: CaseLine = {
        caseLineId: cl.caseLineId ?? cl.id ?? cl.case_line_id,
        guaranteeCaseId: cl.guaranteeCaseId ?? cl.guarantee_case_id ?? cl.guaranteeCase?.guaranteeCaseId ?? null,
        diagnosisText: cl.diagnosisText ?? cl.diagnosis_text ?? '',
        correctionText: cl.correctionText ?? cl.correction_text ?? '',
        componentId: cl.componentId ?? cl.typeComponentId ?? cl.type_component_id ?? null,
        quantity: cl.quantity ?? 0,
        warrantyStatus: cl.warrantyStatus ?? cl.warranty_status ?? 'INELIGIBLE',
        techId: cl.techId ?? cl.diagnosticTechId ?? cl.diagnostic_tech_id ?? '',
        status: cl.status ?? 'pending',
        createdAt: cl.createdAt ?? cl.created_at ?? '',
        updatedAt: cl.updatedAt ?? cl.updated_at ?? '',
        evidenceImageUrls: cl.evidenceImageUrls ?? cl.evidence_image_urls ?? [],
      };

      console.debug('📸 Evidence images in case line:', normalized.evidenceImageUrls);
      return normalized;
    } catch (error) {
      console.error('❌ Error fetching case line detail:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch case line detail');
      }
      throw error;
    }
  }
};
