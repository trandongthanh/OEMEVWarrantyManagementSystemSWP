import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface CaseLine {
  id: string;
  typeComponentId: string | null;
  diagnosisText: string;
  correctionText: string;
  warrantyStatus: 'ELIGIBLE' | 'INELIGIBLE' | string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED_BY_OUT_OF_WARRANTY' | 'REJECTED_BY_DAMAGE_ANALYSIS' | string;
  rejectionReason: string | null;
  repairTechId: string | null;
  diagnosticTechId: string | null;
  quantity: number;
  typeComponent: {
    typeComponentId: string;
    name: string;
    category: string;
  } | null;
}

export interface ProcessingRecord {
  vehicleProcessingRecordId?: string; // Backend uses this field name
  recordId?: string; // Alias for compatibility
  vin: string;
  checkInDate: string;
  odometer: number;
  status: 'CHECKED_IN' | 'IN_DIAGNOSIS' | 'WAITING_FOR_PARTS' | 'IN_REPAIR' | 'COMPLETED' | 'PAID' | 'CANCELLED';
  visitorInfo?: {
    email: string;
    phone: string;
    fullName: string;
  };
  mainTechnician: {
    userId: string;
    name: string;
  };
  vehicle: {
    vin: string;
    model: {
      name: string;
      vehicleModelId: string;
    };
  };
  guaranteeCases: Array<{
    guaranteeCaseId: string;
    status: string;
    contentGuarantee: string;
    leadTechId?: string;
    caseLines?: CaseLine[];
  }>;
  createdByStaff: {
    userId: string;
    name: string;
    serviceCenterId?: string;
  };
}

export interface ProcessingRecordsResponse {
  status: string;
  data: {
    records: {
      records: ProcessingRecord[];
      recordsCount: number;
    };
  };
}

export interface ProcessingRecordsByStatus {
  CHECKED_IN: ProcessingRecord[];
  IN_DIAGNOSIS: ProcessingRecord[];
  WAITING_FOR_PARTS: ProcessingRecord[];
  IN_REPAIR: ProcessingRecord[];
  COMPLETED: ProcessingRecord[];
  PAID: ProcessingRecord[];
  CANCELLED: ProcessingRecord[];
}

// Helper type for raw API records before normalization
interface RawRecord {
  vehicleProcessingRecordId?: string;
  recordId?: string;
  id?: string;
  [key: string]: unknown;
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
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

export const processingRecordsService = {
  // Get all processing records with pagination
  getAllProcessingRecords: async (params?: { page?: number; limit?: number; status?: string }): Promise<{ records: ProcessingRecord[]; total: number }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      
      const url = `/processing-records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 Fetching processing records:', url);
      
      const response = await apiClient.get(url);
      console.log('📦 Raw API response:', response.data);
      
  let rawRecords: unknown[] = [];
      let total = 0;

      // Handle different possible response structures
      if (response.data?.data?.records?.records) {
        rawRecords = response.data.data.records.records;
        total = response.data.data.records.total || response.data.data.records.recordsCount || 0;
      } else if (response.data?.data?.records) {
        rawRecords = response.data.data.records;
        total = response.data.data.recordsCount || response.data.data.total || rawRecords.length;
      } else if (response.data?.records) {
        rawRecords = response.data.records;
        total = response.data.recordsCount || response.data.total || rawRecords.length;
      } else if (Array.isArray(response.data?.data)) {
        rawRecords = response.data.data;
        total = rawRecords.length;
      } else if (Array.isArray(response.data)) {
        rawRecords = response.data;
        total = rawRecords.length;
      } else {
        console.warn('⚠️ Unexpected response structure, returning empty array');
        return { records: [], total: 0 };
      }

      // Normalize records: map vehicleProcessingRecordId to recordId
      const normalizedRecords = (rawRecords as RawRecord[]).map((record: RawRecord) => ({
        ...record,
        recordId: record.vehicleProcessingRecordId || record.recordId || record.id,
        vehicleProcessingRecordId: record.vehicleProcessingRecordId || record.recordId || record.id
      })) as ProcessingRecord[];

      console.log('✅ Normalized records:', normalizedRecords.length, 'Total:', total);
      return {
        records: normalizedRecords,
        total
      };
    } catch (error) {
      // Expected network/backend errors are noisy in dev - downgrade to warn and return empty list
      console.warn('Warning: failed to fetch all processing records:', (error as Error)?.message || error);
      return { records: [], total: 0 };
    }
  },

  // Get processing records by status (with pagination)
  getProcessingRecordsByStatus: async (params?: { status?: string; page?: number; limit?: number }): Promise<{ records: ProcessingRecord[]; total: number }> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `/processing-records${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('🔍 Fetching processing records by status:', url);
      
      const response = await apiClient.get(url);
      console.log('📦 Raw API response (by status):', response.data);
      
  let rawRecords: unknown[] = [];
      let total = 0;

      // Handle different possible response structures
      if (response.data?.data?.records?.records) {
        rawRecords = response.data.data.records.records;
        total = response.data.data.records.total || response.data.data.records.recordsCount || 0;
      } else if (response.data?.data?.records) {
        rawRecords = response.data.data.records;
        total = response.data.data.recordsCount || response.data.data.total || rawRecords.length;
      } else if (response.data?.records) {
        rawRecords = response.data.records;
        total = response.data.recordsCount || response.data.total || rawRecords.length;
      } else if (Array.isArray(response.data?.data)) {
        rawRecords = response.data.data;
        total = rawRecords.length;
      } else if (Array.isArray(response.data)) {
        rawRecords = response.data;
        total = rawRecords.length;
      } else {
        console.warn('⚠️ Unexpected response structure, returning empty array');
        return { records: [], total: 0 };
      }

      // Normalize records: map vehicleProcessingRecordId to recordId
      const normalizedRecords = (rawRecords as RawRecord[]).map((record: RawRecord) => ({
        ...record,
        recordId: record.vehicleProcessingRecordId || record.recordId || record.id,
        vehicleProcessingRecordId: record.vehicleProcessingRecordId || record.recordId || record.id
      })) as ProcessingRecord[];

      console.log('✅ Normalized records (by status):', normalizedRecords.length, 'Total:', total);
      return {
        records: normalizedRecords,
        total
      };
    } catch (error) {
      // Downgrade noisy errors to warn and return empty list so UI can handle gracefully
      console.warn(`Warning: Error fetching processing records${params?.status ? ` with status ${params.status}` : ''}:`, (error as Error)?.message || error);
      return { records: [], total: 0 };
    }
  },

  // Get processing records grouped by status
  getProcessingRecordsGroupedByStatus: async (): Promise<ProcessingRecordsByStatus> => {
    try {
      const { records: allRecords } = await processingRecordsService.getAllProcessingRecords();
      
      const groupedRecords: ProcessingRecordsByStatus = {
        CHECKED_IN: [],
        IN_DIAGNOSIS: [],
        WAITING_FOR_PARTS: [],
        IN_REPAIR: [],
        COMPLETED: [],
        PAID: [],
        CANCELLED: [],
      };

      allRecords.forEach(record => {
        if (groupedRecords[record.status]) {
          groupedRecords[record.status].push(record);
        }
      });

      return groupedRecords;
    } catch (error) {
      console.error('Error fetching and grouping processing records:', error);
      throw error;
    }
  },

  // Get compatible components for a processing record
  getCompatibleComponents: async (
    recordId: string, 
    params?: { category?: string; searchName?: string }
  ): Promise<Array<{ typeComponentId: string; name: string; isUnderWarranty: boolean }>> => {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.searchName) queryParams.append('searchName', params.searchName);
      
      const url = `/processing-records/${recordId}/compatible-components${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🔍 Fetching compatible components:', url);
      const response = await apiClient.get(url);
      console.log('✅ Compatible components response:', response.data);
      
      return response.data?.data?.result || [];
    } catch (error) {
      console.error('❌ Error fetching compatible components:', error);
      throw error;
    }
  },

  // Get processing record detail by recordId
  getProcessingRecordById: async (recordId: string): Promise<ProcessingRecord> => {
    try {
      console.log('🔍 Fetching processing record detail for:', recordId);
      const response = await apiClient.get(`/processing-records/${recordId}`);
      console.log('✅ Processing record detail response:', response.data);
      
      return response.data?.data?.record || response.data?.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching processing record detail:', error);
      throw error;
    }
  }
};