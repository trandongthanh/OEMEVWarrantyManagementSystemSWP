/**
 * API Configuration
 * 
 * Change API_BASE_URL when deploying to different environments:
 * - Development: http://localhost:3000/api/v1
 * - Staging: https://staging-api.yourapp.com/api/v1
 * - Production: https://api.yourapp.com/api/v1
 */

// You can also use environment variables:
// export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const API_BASE_URL = 'http://localhost:3000/api/v1';

// API Endpoints (optional - for better organization)
export const API_ENDPOINTS = {
  // Processing Records
  PROCESSING_RECORDS: '/processing-records',
  PROCESSING_RECORD_BY_ID: (id: string) => `/processing-records/${id}`,
  ASSIGN_TECHNICIAN: (id: string) => `/processing-records/${id}/assignment`,
  COMPATIBLE_COMPONENTS: (id: string) => `/processing-records/${id}/compatible-components`,
  
  // Users & Technicians
  TECHNICIANS: '/users/technicians',
  
  // Guarantee Cases
  ALLOCATE_STOCK: (caseId: string, lineId: string) => 
    `/guarantee-cases/${caseId}/case-lines/${lineId}/allocate-stock`,
} as const;
