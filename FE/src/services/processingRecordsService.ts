import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

export interface ProcessingRecord {
  vin: string;
  checkInDate: string;
  odometer: number;
  status: 'CHECKED_IN' | 'IN_DIAGNOSIS' | 'WAITING_FOR_PARTS' | 'IN_REPAIR' | 'COMPLETED' | 'PAID' | 'CANCELLED';
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
  }>;
  createdByStaff: {
    userId: string;
    name: string;
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
  // Get all processing records
  getAllProcessingRecords: async (): Promise<ProcessingRecord[]> => {
    try {
      const response = await apiClient.get('/processing-records');
      
      // Handle different possible response structures
      if (response.data?.data?.records?.records) {
        return response.data.data.records.records;
      } else if (response.data?.data?.records) {
        return response.data.data.records;
      } else if (response.data?.records) {
        return response.data.records;
      } else if (Array.isArray(response.data?.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('⚠️ Unexpected response structure, returning empty array');
        return [];
      }
    } catch (error) {
      console.error('Error fetching all processing records:', error);
      throw error;
    }
  },

  // Get processing records by status
  getProcessingRecordsByStatus: async (status?: string): Promise<ProcessingRecord[]> => {
    try {
      const url = status ? `/processing-records?status=${status}` : '/processing-records';
      const response = await apiClient.get(url);
      
      console.log('🔍 API Response:', response.data);
      console.log('🔍 Full response structure:', JSON.stringify(response.data, null, 2));
      
      // Handle different possible response structures
      if (response.data?.data?.records?.records) {
        return response.data.data.records.records;
      } else if (response.data?.data?.records) {
        return response.data.data.records;
      } else if (response.data?.records) {
        return response.data.records;
      } else if (Array.isArray(response.data?.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('⚠️ Unexpected response structure, returning empty array');
        return [];
      }
    } catch (error) {
      console.error(`❌ Error fetching processing records${status ? ` with status ${status}` : ''}:`, error);
      throw error;
    }
  },

  // Get processing records grouped by status
  getProcessingRecordsGroupedByStatus: async (): Promise<ProcessingRecordsByStatus> => {
    try {
      const allRecords = await processingRecordsService.getAllProcessingRecords();
      
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
  }
};