import axios, { InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface PickupResponse {
  reservation: {
    reservationId: string;
    status: string;
    pickedUpBy?: string;
    pickedUpAt?: string;
  };
  component: {
    componentId: string;
    serialNumber?: string;
    status?: string;
  };
  caseLine?: {
    id?: string;
    status?: string;
  };
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('ev_warranty_token');
  if (token) {
    // Ensure headers object exists and set Authorization in a type-safe way
    if (!config.headers) {
      // assign an empty AxiosRequestHeaders object
      config.headers = {} as AxiosRequestHeaders;
    }
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const componentReservationService = {
  pickupReservation: async (reservationId: string, body?: { pickedUpByTechId: string }): Promise<PickupResponse> => {
    // NOTE: backend mounts the reservations router under /reservations (see BE app.js)
    const url = `/reservations/${reservationId}/pickup`;
    const res = await apiClient.patch(url, body ?? {});
    // assume backend returns { status: 'success', data: { reservation, component, caseLine } }
    return res.data?.data || res.data;
  }
  ,
  installComponent: async (reservationId: string): Promise<{
    reservation?: Record<string, unknown>;
    component?: Record<string, unknown>;
    caseLine?: Record<string, unknown>;
  }> => {
    const url = `/reservations/${reservationId}/installComponent`;
    const res = await apiClient.patch(url);
    return res.data?.data || res.data;
  }
  ,
  returnComponent: async (reservationId: string, body?: { serialNumber: string }): Promise<{
    reservation?: Record<string, unknown>;
    component?: Record<string, unknown>;
  }> => {
    const url = `/reservations/${reservationId}/return`;
    // this endpoint expects a body like { serialNumber: string }
    const res = await apiClient.patch(url, body ?? {});
    return res.data?.data || res.data;
  }
};

export default componentReservationService;
