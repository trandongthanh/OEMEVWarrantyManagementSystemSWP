import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface CaseLineRequest {
  diagnosisText: string;
  correctionText: string;
  componentId?: string | null;
  quantity: number;
  warrantyStatus: 'ELIGIBLE' | 'INELIGIBLE';
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
      console.log('📝 Creating case lines for case:', guaranteeCaseId);
      console.log('📝 Case lines data:', caseLines);
      
      // Map frontend CaseLineRequest (which uses `componentId`) to backend shape
      // backend validator expects `typeComponentId` in each caseline item
      const payload = {
        caselines: caseLines.map((cl: CaseLineRequest) => ({
          diagnosisText: cl.diagnosisText,
          correctionText: cl.correctionText,
          // backend expects typeComponentId; allow null when no component specified
          typeComponentId: cl.componentId ?? null,
          quantity: cl.quantity,
          warrantyStatus: cl.warrantyStatus
        }))
      };

      const response = await apiClient.post<CreateCaseLinesResponse>(
        `/guarantee-cases/${guaranteeCaseId}/case-lines`,
        payload
      );
      
      console.log('✅ Case lines created (raw):', response.data);

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
      }));

      console.log('✅ Case lines created (normalized):', normalized);
      return normalized;
    } catch (error) {
      console.error('❌ Error creating case lines:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to create case lines');
      }
      throw error;
    }
  },

  // Get all case lines for a guarantee case
  getCaseLines: async (guaranteeCaseId: string): Promise<CaseLine[]> => {
    try {
      console.log('📡 Fetching case lines for case:', guaranteeCaseId);
      
      const response = await apiClient.get<GetCaseLinesResponse>(
        `/guarantee-cases/${guaranteeCaseId}/case-lines`
      );
      
      console.log('✅ Case lines fetched:', response.data);
      return response.data.data.caseLines;
    } catch (error) {
      console.error('❌ Error fetching case lines:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to fetch case lines');
      }
      throw error;
    }
  },

  // Delete a case line by ID
  deleteCaseLine: async (caseLineId: string): Promise<boolean> => {
    try {
      console.log('🗑️ Deleting case line:', caseLineId);
      const response = await apiClient.delete(`/case-lines/${caseLineId}`);
      console.log('✅ Delete response:', response.data);
      return response.data?.status === 'success';
    } catch (error) {
      console.error('❌ Error deleting case line:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Failed to delete case line');
      }
      throw error;
    }
  }
};
