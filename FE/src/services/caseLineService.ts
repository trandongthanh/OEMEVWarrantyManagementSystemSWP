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
      
      const response = await apiClient.post<CreateCaseLinesResponse>(
        `/guarantee-cases/${guaranteeCaseId}/case-lines`,
        { caselines: caseLines }  // Backend expects 'caselines' (lowercase)
      );
      
      console.log('✅ Case lines created:', response.data);
      return response.data.data.caseLines;
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
};
