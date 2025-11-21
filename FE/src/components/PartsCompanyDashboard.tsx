import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Package,
  LogOut,
  Building2,
  Eye,
  Loader2,
  Calendar,
  User,
  Warehouse,
  Truck,
  Tag,
  CheckCircle
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const EXTERNAL_COMPONENTS_API = 'https://dongthanhswp.space/api/v1/components';
// Fallback token provided by user when no auth token available locally
const FALLBACK_BEARER_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4N2YxOGQ1MS1lMjdjLTQxMWMtOGZmYi0xM2FmZDk1NGE1ZDUiLCJyb2xlTmFtZSI6InBhcnRzX2Nvb3JkaW5hdG9yX2NvbXBhbnkiLCJzZXJ2aWNlQ2VudGVySWQiOm51bGwsImNvbXBhbnlJZCI6IjQ2NWQ3NWU1LTJlYTYtNDc4Ny05NTBhLTE0YzBjMzVmZTVkYSIsImlhdCI6MTc2MzcwMTc0MywiZXhwIjoxNzYzNzE5NzQzfQ.2hGuLramgfynoPfQSNLY8cZp3U0dPHOXjF-YoETMEWI';

interface StockTransferRequest {
  id: string;
  requestingWarehouseId: string;
  requestedByUserId: string;
  approvedByUserId: string | null;
  rejectedByUserId: string | null;
  cancelledByUserId: string | null;
  receivedByUserId: string | null;
  status: string;
  rejectionReason: string | null;
  cancellationReason: string | null;
  requestedAt: string;
  approvedAt: string | null;
  shippedAt: string | null;
  receivedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Snake_case fields from API
  requesting_warehouse_id?: string;
  requested_by_user_id?: string;
  approved_by_user_id?: string | null;
  rejected_by_user_id?: string | null;
  cancelled_by_user_id?: string | null;
  received_by_user_id?: string | null;
  // Nested objects
  requester?: {
    userId: string;
    name: string;
    serviceCenterId?: string;
    serviceCenter?: {
      name: string;
    };
  };
  approver?: {
    userId: string;
    name: string;
    serviceCenterId?: string;
    serviceCenter?: {
      name: string;
    };
  } | null;
  requestingWarehouse?: {
    warehouseId: string;
    name: string;
    serviceCenterId: string;
    vehicleCompanyId: string;
    address?: string;
  };
  items?: Array<{
    id: string;
    requestId?: string;
    typeComponentId?: string;
    quantityRequested: number;
    quantityApproved?: number | null;
    caselineId?: string | null;
    component?: {
      name: string;
      typeComponentId: string;
      sku?: string;
    };
    typeComponent?: {
      typeComponentId: string;
      nameComponent?: string;
      name?: string;
      description?: string | null;
    };
  }>;
}

interface TypeComponent {
  typeComponentId: string;
  name: string;
  price: number;
  sku: string;
  category: string;
  makeBrand: string;
  createdAt: string;
  updatedAt: string;
}

interface TypeComponentsResponse {
  status: string;
  data: {
    items: TypeComponent[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      itemsPerPage: number;
    };
  };
}

interface CreateComponentRequest {
  typeComponentId: string;
  warehouseId: string;
  serialNumber: string;
}

interface CreateComponentResponse {
  status: string;
  data: {
    component: {
      componentId: string;
      typeComponentId: string;
      warehouseId: string;
      serialNumber: string;
      status: string;
      updatedAt: string;
      createdAt: string;
    };
    stock: {
      stockId: string;
      warehouseId: string;
      typeComponentId: string;
      quantityInStock: number;
      quantityReserved: number;
    };
  };
}

const PartsCompanyDashboard: React.FC = () => {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();

  const [stockTransferRequests, setStockTransferRequests] = useState<StockTransferRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<StockTransferRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTab, setSelectedTab] = useState<'REQUESTS' | 'COMPONENTS'>('REQUESTS');
  const [selectedStockRequest, setSelectedStockRequest] = useState<StockTransferRequest | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [shippingRequestId, setShippingRequestId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedCaseLine, setSelectedCaseLine] = useState<any | null>(null);
  const [isLoadingCaseLine, setIsLoadingCaseLine] = useState<boolean>(false);
  const [showCaseLineModal, setShowCaseLineModal] = useState<boolean>(false);
  const [componentsList, setComponentsList] = useState<any[]>([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState<boolean>(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [showReservationsModal, setShowReservationsModal] = useState<boolean>(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState<boolean>(false);
  const [selectedRequestForShip, setSelectedRequestForShip] = useState<StockTransferRequest | null>(null);
  const [matchedComponentsList, setMatchedComponentsList] = useState<any[]>([]);
  const [showComponentsListModal, setShowComponentsListModal] = useState<boolean>(false);
  const [isLoadingComponentsList, setIsLoadingComponentsList] = useState<boolean>(false);
  const [selectedTypeComponentName, setSelectedTypeComponentName] = useState<string>('');
  const [selectedComponentIdsByReservation, setSelectedComponentIdsByReservation] = useState<Record<string, string[]>>({});
  const [currentReservationId, setCurrentReservationId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  
  // Type Components states
  const [typeComponents, setTypeComponents] = useState<TypeComponent[]>([]);
  const [isLoadingTypeComponents, setIsLoadingTypeComponents] = useState<boolean>(false);
  const [showTypeComponentsModal, setShowTypeComponentsModal] = useState<boolean>(false);
  const [typeComponentsPage, setTypeComponentsPage] = useState<number>(1);
  const [typeComponentsTotalPages, setTypeComponentsTotalPages] = useState<number>(1);
  const [typeComponentsTotalItems, setTypeComponentsTotalItems] = useState<number>(0);
  
  // Warehouse selection states
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState<boolean>(false);
  const [showWarehouseSelectionModal, setShowWarehouseSelectionModal] = useState<boolean>(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<any | null>(null);
  
  // Create Component states
  const [showCreateComponentModal, setShowCreateComponentModal] = useState<boolean>(false);
  const [selectedTypeComponentForCreate, setSelectedTypeComponentForCreate] = useState<TypeComponent | null>(null);
  const [componentSerialNumber, setComponentSerialNumber] = useState<string>('');
  const [isCreatingComponent, setIsCreatingComponent] = useState<boolean>(false);

  // Fetch type components from selected warehouse stocks
  const fetchTypeComponentsFromWarehouse = () => {
    console.log('🔍 fetchTypeComponentsFromWarehouse called', selectedWarehouse);
    
    if (!selectedWarehouse) {
      console.log('❌ No selectedWarehouse');
      setTypeComponents([]);
      return;
    }

    if (!selectedWarehouse.stocks) {
      console.log('❌ No stocks in warehouse');
      setTypeComponents([]);
      return;
    }
    
    setIsLoadingTypeComponents(true);
    
    try {
      console.log('📦 Processing stocks:', selectedWarehouse.stocks.length);
      
      // Extract type components from warehouse stocks
      const components = selectedWarehouse.stocks
        .filter((stock: any) => stock.typeComponent)
        .map((stock: any) => ({
          typeComponentId: stock.typeComponent.typeComponentId,
          name: stock.typeComponent.name,
          sku: stock.typeComponent.sku,
          category: stock.typeComponent.category,
          price: 0, // Price not available in stocks
          makeBrand: 'N/A', // Make brand not available in stocks
          createdAt: stock.typeComponent.createdAt || new Date().toISOString(),
          updatedAt: stock.typeComponent.updatedAt || new Date().toISOString(),
          // Additional stock info
          quantityInStock: stock.quantityInStock,
          quantityReserved: stock.quantityReserved,
          quantityAvailable: stock.quantityAvailable,
          stockId: stock.stockId
        }));
      
      console.log('✅ Processed components:', components.length);
      setTypeComponents(components);
      setTypeComponentsTotalItems(components.length);
      setTypeComponentsTotalPages(1);
      setTypeComponentsPage(1);
    } catch (error: any) {
      console.error('❌ Error processing type components:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load type components from warehouse',
        variant: 'destructive'
      });
      setTypeComponents([]);
    } finally {
      setIsLoadingTypeComponents(false);
    }
  };

  // Create component
  const createComponent = async () => {
    if (!selectedTypeComponentForCreate || !componentSerialNumber.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a serial number',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedWarehouse) {
      toast({
        title: 'Validation Error',
        description: 'Please select a warehouse first',
        variant: 'destructive'
      });
      return;
    }

    setIsCreatingComponent(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    
    try {
      const requestData: CreateComponentRequest = {
        typeComponentId: selectedTypeComponentForCreate.typeComponentId,
        warehouseId: selectedWarehouse.warehouseId,
        serialNumber: componentSerialNumber.trim()
      };

      const response = await axios.post<CreateComponentResponse>(
        'https://dongthanhswp.space/api/v1/components',
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token || FALLBACK_BEARER_TOKEN}`
          }
        }
      );
      
      if (response.data.status === 'success') {
        console.log('✅ Component created:', response.data.data.component);
        
        toast({
          title: 'Success',
          description: `Component created successfully with serial number: ${response.data.data.component.serialNumber}`,
          variant: 'default'
        });
        
        // Reset form and close modal
        setComponentSerialNumber('');
        setShowCreateComponentModal(false);
        setSelectedTypeComponentForCreate(null);
        
        // Refresh warehouses to update stock
        console.log('🔄 Refreshing warehouses...');
        await fetchWarehouses();
        
        // Wait a bit for state to update, then find updated warehouse
        setTimeout(() => {
          console.log('🔍 Finding updated warehouse...');
          // Re-fetch to get the absolute latest data
          axios.get(
            'https://dongthanhswp.space/api/v1/warehouses',
            {
              headers: {
                Authorization: `Bearer ${token || FALLBACK_BEARER_TOKEN}`
              }
            }
          ).then(res => {
            if (res.data.status === 'success') {
              const updatedWarehouses = res.data.data.warehouses || [];
              const updatedWarehouse = updatedWarehouses.find(
                (w: any) => w.warehouseId === selectedWarehouse.warehouseId
              );
              
              if (updatedWarehouse) {
                console.log('✅ Updated warehouse found, refreshing components');
                setWarehouses(updatedWarehouses);
                setSelectedWarehouse(updatedWarehouse);
                // fetchTypeComponentsFromWarehouse will be called by useEffect
              } else {
                console.log('⚠️ Warehouse not found in updated data');
              }
            }
          }).catch(err => {
            console.error('Error re-fetching warehouses:', err);
          });
        }, 500);
      }
    } catch (error: any) {
      console.error('Error creating component:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create component',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingComponent(false);
    }
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
    console.log('🏢 Fetching warehouses...');
    setIsLoadingWarehouses(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    
    try {
      const response = await axios.get(
        'https://dongthanhswp.space/api/v1/warehouses',
        {
          headers: {
            Authorization: `Bearer ${token || FALLBACK_BEARER_TOKEN}`
          }
        }
      );
      
      console.log('📦 Warehouses response:', response.data);
      
      if (response.data.status === 'success') {
        const warehousesData = response.data.data.warehouses || [];
        console.log('✅ Warehouses loaded:', warehousesData.length);
        setWarehouses(warehousesData);
      }
    } catch (error: any) {
      console.error('❌ Error fetching warehouses:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to fetch warehouses',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  // Fetch all stock transfer requests
  const fetchStockTransferRequests = async () => {
    setIsLoadingRequests(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingRequests(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/stock-transfer-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestsData = response.data?.data?.stockTransferRequests || [];
      console.log('📦 Fetched all stock transfer requests:', requestsData);
      setStockTransferRequests(requestsData);
    } catch (error) {
      console.error('Failed to fetch stock transfer requests:', error);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Fetch detailed stock transfer request
  const fetchStockTransferRequestDetail = async (requestId: string) => {
    setIsLoadingDetail(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingDetail(false);
      return null;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/stock-transfer-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const detailData = response.data?.data?.stockTransferRequest || null;
      console.log('📦 Stock Transfer Request Detail:', detailData);
      console.log('📦 Items in request:', detailData?.items);
      console.log('📦 Number of items:', detailData?.items?.length);
      
      // Log each item details
      detailData?.items?.forEach((item: any, index: number) => {
        console.log(`Item ${index + 1}:`, {
          id: item.id,
          typeComponentId: item.typeComponentId,
          quantityRequested: item.quantityRequested,
          quantityApproved: item.quantityApproved,
          typeComponent: item.typeComponent,
          caselineId: item.caselineId
        });
      });
      
      setSelectedStockRequest(detailData);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to fetch stock transfer request detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Fetch CaseLine detail by id
  const fetchCaseLineDetail = async (caseLineId: string) => {
    if (!caseLineId) return;
    setIsLoadingCaseLine(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingCaseLine(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/case-lines/${caseLineId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const caseLine = response.data?.data?.caseLine || response.data?.data || null;
      console.log('🩺 CaseLine detail:', caseLine);
      setSelectedCaseLine(caseLine);
      setShowCaseLineModal(true);
    } catch (error) {
      console.error('Failed to fetch case line detail:', error);
      toast({
        title: 'Error Loading Case Line',
        description: 'Failed to load Case Line details. Check console for more information.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingCaseLine(false);
    }
  };

  // Load requests on mount
  useEffect(() => {
    fetchStockTransferRequests();
  }, []);

  // Load type components when warehouse is selected
  useEffect(() => {
    if (selectedWarehouse) {
      fetchTypeComponentsFromWarehouse();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWarehouse]);

  // Fetch components when Components tab selected
  useEffect(() => {
    if (selectedTab === 'COMPONENTS') {
      fetchComponents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  // Fetch external components list
  const fetchComponents = async (page: number = 1) => {
    setIsLoadingComponents(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    const bearer = token || FALLBACK_BEARER_TOKEN;
    try {
      const response = await axios.get(EXTERNAL_COMPONENTS_API, {
        params: {
          limit: 100,
          page: page
        },
        headers: { Authorization: `Bearer ${bearer}` }
      });
      const components = response.data?.data?.components || [];
      const pagination = response.data?.data?.pagination;
      console.log('🔩 Fetched external components:', components);
      console.log('📄 Pagination:', pagination);
      setComponentsList(components);
      setCurrentPage(page);
      // Calculate total pages from pagination info if available
      if (pagination?.total && pagination?.limit) {
        setTotalPages(Math.ceil(pagination.total / pagination.limit));
      } else {
        // If no pagination info, assume there might be more pages if we got full page
        setTotalPages(components.length === 100 ? page + 1 : page);
      }
    } catch (error: any) {
      console.error('Failed to fetch components:', error);
      toast({ title: 'Error Loading Components', description: error?.message || 'Failed to load components', variant: 'destructive' });
    } finally {
      setIsLoadingComponents(false);
    }
  };

  // Fetch all components matching typeComponentId from external API
  const handleSelectComponent = async (typeComponentId: string, typeComponentName: string, warehouseId: string, reservationId: string) => {
    setIsLoadingComponentsList(true);
    setCurrentReservationId(reservationId);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    
    try {
      // Call internal API with query parameters
      const response = await axios.get(`${API_BASE_URL}/components`, {
        params: {
          warehouseId: warehouseId,
          typeComponentId: typeComponentId,
          limit: 100,
          page: 1
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const components = response.data?.data?.components || [];
      
      if (components.length > 0) {
        console.log('🔍 Found components:', components);
        setMatchedComponentsList(components);
        setSelectedTypeComponentName(typeComponentName);
        setShowComponentsListModal(true);
      } else {
        toast({
          title: 'Component Not Found',
          description: `No components found with Type Component ID: ${typeComponentId}`,
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch components:', error);
      toast({
        title: 'Error Loading Component',
        description: error?.message || 'Failed to load component information',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingComponentsList(false);
    }
  };

  // Filter requests by status
  useEffect(() => {
    if (selectedStatus === 'ALL') {
      setFilteredRequests(stockTransferRequests);
    } else {
      setFilteredRequests(stockTransferRequests.filter(req => req.status === selectedStatus));
    }
  }, [selectedStatus, stockTransferRequests]);

  // Fetch reservations for a stock transfer request
  const fetchReservations = async (requestId: string) => {
    setIsLoadingReservations(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingReservations(false);
      return;
    }
    try {
      const response = await axios.get(
        `${API_BASE_URL}/stock-transfer-requests/${requestId}/reservations`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const reservationsData = response.data?.data?.reservations || [];
      console.log('📦 Fetched reservations:', reservationsData);
      setReservations(reservationsData);
      return reservationsData;
    } catch (error: any) {
      console.error('Failed to fetch reservations:', error);
      toast({
        title: 'Error Loading Reservations',
        description: error?.message || 'Failed to load reservations',
        variant: 'destructive'
      });
      return [];
    } finally {
      setIsLoadingReservations(false);
    }
  };

  // Show reservations before shipping
  const handleShipRequest = async (request: StockTransferRequest) => {
    setSelectedRequestForShip(request);
    await fetchReservations(request.id);
    setShowReservationsModal(true);
  };

  // Confirm and execute ship action
  const confirmShipRequest = async () => {
    if (!selectedRequestForShip) return;
    
    const requestId = selectedRequestForShip.id;
    
    // Check if all reservations have components selected
    const reservationsWithoutComponents = reservations.filter(reservation => {
      const componentIds = selectedComponentIdsByReservation[reservation.reservationId] || [];
      const required = reservation.quantityRequested || 0;
      return componentIds.length !== required;
    });
    
    if (reservationsWithoutComponents.length > 0) {
      toast({
        title: 'Components Not Selected',
        description: `Please select all required components for ${reservationsWithoutComponents.length} reservation(s) before shipping.`,
        variant: 'destructive'
      });
      return;
    }
    
    setShippingRequestId(requestId);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setShippingRequestId(null);
      return;
    }
    try {
      // Ship each reservation separately
      const shipPromises = reservations.map(async (reservation) => {
        const reservationId = reservation.reservationId;
        const componentIds = selectedComponentIdsByReservation[reservationId] || [];
        
        // Skip if no components selected for this reservation
        if (componentIds.length === 0) {
          return null;
        }
        
        // Set estimated delivery date to 3 weeks from now
        const estimatedDeliveryDate = new Date();
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 21);
        const formattedDate = estimatedDeliveryDate.toISOString().split('T')[0];
        
        return axios.patch(
          `${API_BASE_URL}/stock-transfer-requests/${requestId}/ship`,
          {
            reservationId: reservationId,
            componentIds: componentIds,
            estimatedDeliveryDate: formattedDate
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      });
      
      // Wait for all ship requests to complete
      const results = await Promise.all(shipPromises);
      const successfulShips = results.filter(r => r !== null);
      
      console.log(`✅ Successfully shipped ${successfulShips.length} reservations`);
      
      // Close modals and reset state
      setShowReservationsModal(false);
      setSelectedComponentIdsByReservation({});
      localStorage.removeItem('selectedComponentsByReservation');
      
      // Refresh the list
      await fetchStockTransferRequests();
      
      // If detail modal is open, refresh the detail
      if (showDetailModal && selectedStockRequest?.id === requestId) {
        await fetchStockTransferRequestDetail(requestId);
      }
    } catch (error: any) {
      console.error('Failed to ship request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to ship request';
      toast({
        title: 'Shipping Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setShippingRequestId(null);
    }
  };

  // Handle selecting component for shipping
  const handleSelectComponentForShip = (componentId: string) => {
    if (!currentReservationId) return;
    
    const currentReservation = reservations.find(r => r.reservationId === currentReservationId);
    const maxQuantity = currentReservation?.quantityRequested || 0;
    
    setSelectedComponentIdsByReservation(prev => {
      const currentSelected = prev[currentReservationId] || [];
      const isAlreadySelected = currentSelected.includes(componentId);
      
      // If already selected, deselect (toggle off)
      if (isAlreadySelected) {
        return {
          ...prev,
          [currentReservationId]: currentSelected.filter(id => id !== componentId)
        };
      }
      
      // If not selected, check if we can add more
      if (currentSelected.length >= maxQuantity) {
        toast({
          title: 'Maximum Reached',
          description: `You can only select up to ${maxQuantity} component(s) for this reservation.`,
          variant: 'destructive'
        });
        return prev;
      }
      
      // Add component to selection
      return {
        ...prev,
        [currentReservationId]: [...currentSelected, componentId]
      };
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'PENDING_APPROVAL':
        return 'secondary';
      case 'APPROVED':
        return 'default';
      case 'SHIPPED':
        return 'default';
      case 'RECEIVED':
        return 'default'; // Changed from 'success' to 'default'
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString('vi-VN');
    } catch (e) {
      return dateString;
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

      {/* Content */}
      <div className="min-h-screen bg-transparent relative z-10">
        {/* Header */}
        <header className="border-b bg-card shadow-elegant">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Package className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Parts Company Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome, {user?.name || 'Parts Coordinator'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs">
                  <Building2 className="mr-1 h-3 w-3" />
                  Parts Coordinator Company
                </Badge>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="container mx-auto px-6 py-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant={selectedTab === 'REQUESTS' ? 'default' : 'ghost'} onClick={() => setSelectedTab('REQUESTS')}>Requests</Button>
                  <Button size="sm" variant={selectedTab === 'COMPONENTS' ? 'default' : 'ghost'} onClick={() => setSelectedTab('COMPONENTS')}>Components</Button>
                </div>
                {selectedTab === 'COMPONENTS' && (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => {
                      setShowWarehouseSelectionModal(true);
                      fetchWarehouses();
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Type Components
                  </Button>
                )}
              </div>
              <CardTitle>{selectedTab === 'REQUESTS' ? 'Stock Transfer Requests' : 'Components'}</CardTitle>
              <CardDescription>
                {selectedTab === 'REQUESTS'
                  ? 'Manage stock transfer requests from service centers'
                  : 'List of components from the parts company API'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Status Filter - only show for Requests tab */}
              {selectedTab === 'REQUESTS' && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'SHIPPED', 'RECEIVED', 'REJECTED', 'CANCELLED'].map((status) => {
                    const count = status === 'ALL' 
                      ? stockTransferRequests.length 
                      : stockTransferRequests.filter(req => req.status === status).length;
                    return (
                      <Button
                        key={status}
                        variant={status === selectedStatus ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedStatus(status)}
                        className="border-dashed"
                      >
                        {status === 'ALL' ? 'All' : status.replace(/_/g, ' ')} ({count})
                      </Button>
                    );
                  })}
                </div>
              )}

              {selectedTab === 'COMPONENTS' ? (
                isLoadingComponents ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-muted-foreground">Loading components...</span>
                  </div>
                ) : componentsList.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Components</h3>
                      <p className="text-sm text-muted-foreground">No components returned from external API.</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Serial Number</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Vehicle VIN</TableHead>
                          <TableHead>Installed At</TableHead>
                          <TableHead>Price</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {componentsList.filter(c => c.status === 'IN_WAREHOUSE').map((c) => (
                          <TableRow key={c.componentId}>
                            <TableCell className="font-mono text-xs">{c.serialNumber || c.componentId}</TableCell>
                            <TableCell>{c.typeComponent?.sku || c.type_component_id || '-'}</TableCell>
                            <TableCell>{c.typeComponent?.name || '-'}</TableCell>
                            <TableCell>{c.typeComponent?.category || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(c.status)}>{c.status}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{c.warehouseId || c.warehouse_id || '-'}</TableCell>
                            <TableCell className="text-sm">{c.vehicleVin || c.vehicle_vin || '-'}</TableCell>
                            <TableCell className="text-sm">{c.installedAt ? formatDate(c.installedAt) : '-'}</TableCell>
                            <TableCell className="text-sm">{c.typeComponent?.price ? `${c.typeComponent.price}` : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {/* Pagination Controls */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 p-4 rounded-lg">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchComponents(currentPage - 1)}
                        disabled={currentPage <= 1 || isLoadingComponents}
                        className="gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">Page</span>
                        <div className="flex items-center gap-1">
                          {(() => {
                            const pages = [];
                            const maxVisible = 5;
                            
                            if (totalPages <= maxVisible) {
                              // Show all pages if total is 5 or less
                              for (let i = 1; i <= totalPages; i++) {
                                pages.push(i);
                              }
                            } else {
                              // Smart pagination for more than 5 pages
                              if (currentPage <= 3) {
                                // Near the start: show 1,2,3,4,5
                                for (let i = 1; i <= 5; i++) {
                                  pages.push(i);
                                }
                              } else if (currentPage >= totalPages - 2) {
                                // Near the end: show last 5 pages
                                for (let i = totalPages - 4; i <= totalPages; i++) {
                                  pages.push(i);
                                }
                              } else {
                                // In the middle: show current page centered
                                for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                                  pages.push(i);
                                }
                              }
                            }
                            
                            return pages.map((page, idx) => {                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => fetchComponents(page as number)}
                                  disabled={isLoadingComponents}
                                  className={`min-w-[36px] h-9 ${currentPage === page ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : ''}`}
                                >
                                  {page}
                                </Button>
                              );
                            });
                          })()}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">of {totalPages}</span>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchComponents(currentPage + 1)}
                        disabled={currentPage >= totalPages || isLoadingComponents}
                        className="gap-2"
                      >
                        Next
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                      </Button>
                    </div>
                  </div>
                )
              ) : isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">Loading requests...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No Stock Transfer Requests
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedStatus === 'ALL' 
                        ? 'There are no stock transfer requests at the moment.'
                        : `No requests with status "${selectedStatus}"`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Warehouse</TableHead>
                        <TableHead>Requested At</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono text-xs">
                            #{request.id.substring(0, 8)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(request.status)}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">{request.requester?.name || 'N/A'}</p>
                              {request.requester?.serviceCenter?.name && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {request.requester.serviceCenter.name}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">
                                {request.requestingWarehouse?.name || 'N/A'}
                              </p>
                              {request.requestingWarehouse?.address && (
                                <p className="text-xs text-muted-foreground">
                                  {request.requestingWarehouse.address}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(request.requestedAt)}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <Badge variant="outline">
                                {request.items?.length || 0} items
                              </Badge>
                              {request.items && request.items.length > 0 && request.items[0].component?.name && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {request.items[0].component.name}
                                  {request.items.length > 1 && ` +${request.items.length - 1} more`}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => fetchStockTransferRequestDetail(request.id)}
                                disabled={isLoadingDetail}
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                View Details
                              </Button>
                              {request.status === 'APPROVED' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleShipRequest(request)}
                                  disabled={shippingRequestId === request.id}
                                >
                                  {shippingRequestId === request.id ? (
                                    <>
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      Shipping...
                                    </>
                                  ) : (
                                    <>
                                      <Truck className="mr-1 h-3 w-3" />
                                      Ship
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Stock Transfer Request Details</DialogTitle>
              <DialogDescription>
                Detailed information about the stock transfer request
              </DialogDescription>
            </DialogHeader>

            {isLoadingDetail ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedStockRequest ? (
              <div className="space-y-6">
                {/* Request Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Request Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Request ID</label>
                        <p className="font-mono text-sm">#{selectedStockRequest.id.substring(0, 8)}...</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          <Badge variant={getStatusBadgeVariant(selectedStockRequest.status)}>
                            {selectedStockRequest.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          Requester
                        </label>
                        <p className="text-sm font-semibold">{selectedStockRequest.requester?.name || '---'}</p>
                        {selectedStockRequest.requester?.serviceCenter?.name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3" />
                            {selectedStockRequest.requester.serviceCenter.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center">
                          <Warehouse className="mr-1 h-3 w-3" />
                          Requesting Warehouse
                        </label>
                        <p className="text-sm font-semibold">{selectedStockRequest.requestingWarehouse?.name || '---'}</p>
                        {selectedStockRequest.requestingWarehouse?.address && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedStockRequest.requestingWarehouse.address}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          Requested At
                        </label>
                        <p className="text-sm">{selectedStockRequest.requestedAt ? formatDate(selectedStockRequest.requestedAt) : '---'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Approved At</label>
                        <p className="text-sm">{selectedStockRequest.approvedAt ? formatDate(selectedStockRequest.approvedAt) : '---'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Shipped At</label>
                        <p className="text-sm">{selectedStockRequest.shippedAt ? formatDate(selectedStockRequest.shippedAt) : '---'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Received At</label>
                        <p className="text-sm">{selectedStockRequest.receivedAt ? formatDate(selectedStockRequest.receivedAt) : '---'}</p>
                      </div>
                    </div>

                    {/* Approver Information */}
                    {selectedStockRequest.approver && (
                      <div className="pt-3 border-t">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200">
                          <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Approved By
                          </label>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                              {selectedStockRequest.approver.name}
                            </p>
                            {selectedStockRequest.approver.serviceCenter?.name && (
                              <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {selectedStockRequest.approver.serviceCenter.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedStockRequest.rejectionReason && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <label className="text-sm font-medium text-destructive">Rejection Reason</label>
                        <p className="text-sm mt-1">{selectedStockRequest.rejectionReason}</p>
                      </div>
                    )}

                    {selectedStockRequest.cancellationReason && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                        <label className="text-sm font-medium text-destructive">Cancellation Reason</label>
                        <p className="text-sm mt-1">{selectedStockRequest.cancellationReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Requested Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Requested Items</CardTitle>
                    <CardDescription>
                      {selectedStockRequest.items?.length || 0} item(s) in this request
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedStockRequest.items && selectedStockRequest.items.length > 0 ? (
                      <div className="space-y-3">
                        {selectedStockRequest.items.map((item, index) => {
                          // Get component info with priority: item.component (new API) > typeComponent (old format)
                          let componentName = 'Unknown Component';
                          let componentDescription = '';
                          
                          // Priority 1: New API response with component object
                          if (item.component?.name) {
                            componentName = item.component.name;
                          }
                          // Priority 2: Fallback to old typeComponent format
                          else if (item.typeComponent?.nameComponent || item.typeComponent?.name) {
                            componentName = item.typeComponent.nameComponent || item.typeComponent.name || 'Unknown';
                            componentDescription = item.typeComponent.description || '';
                          }
                          
                          return (
                          <div key={item.id || index} className="p-4 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <div>
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">Component Name</label>
                                  <p className="font-medium text-base mt-1">
                                    {componentName}
                                  </p>
                                  {componentDescription && (
                                    <p className="text-xs text-muted-foreground mt-1">{componentDescription}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {item.component?.sku && (
                                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded border border-indigo-200">
                                        <Tag className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                                        <span className="font-mono text-xs text-indigo-700 dark:text-indigo-300">
                                          {item.component.sku}
                                        </span>
                                      </div>
                                    )}
                                    {item.component?.typeComponentId && (
                                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200">
                                        <span className="font-mono text-xs text-muted-foreground">
                                          Type ID: {item.component.typeComponentId}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {item.caselineId && (
                                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200">
                                    <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase">
                                      Case Line ID
                                    </label>
                                    <p className="font-mono text-xs text-blue-900 dark:text-blue-100 mt-1">
                                      {item.caselineId}
                                    </p>
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-muted-foreground uppercase">Quantity Requested</label>
                                <p className="font-semibold text-lg mt-1 text-blue-600 dark:text-blue-400">
                                  {item.quantityRequested}
                                </p>
                              </div>
                              {item.quantityApproved !== null && item.quantityApproved !== undefined && (
                                <div>
                                  <label className="text-xs font-semibold text-muted-foreground uppercase">Quantity Approved</label>
                                  <p className="font-semibold text-lg mt-1 text-green-600 dark:text-green-400">
                                    {item.quantityApproved}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No items found</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No details available</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Reservations Modal */}
        <Dialog open={showReservationsModal} onOpenChange={setShowReservationsModal}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Reservations for Ship Request
              </DialogTitle>
              <DialogDescription className="text-base">
                Review reservations before shipping request <span className="font-mono font-semibold">#{selectedRequestForShip?.id.substring(0, 8)}</span>
              </DialogDescription>
            </DialogHeader>

            {isLoadingReservations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-3 text-lg text-muted-foreground">Loading reservations...</span>
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-base text-muted-foreground">No reservations found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reservations.map((reservation, index) => (
                  <Card key={reservation.reservationId || index} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reservation ID</span>
                          </div>
                          <p className="font-mono text-sm font-medium">{reservation.reservationId || '---'}</p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(reservation.status)} className="text-sm px-3 py-1">
                          {reservation.status || 'N/A'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Component Information */}
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-500">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Component</label>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 bg-white dark:bg-blue-900 hover:bg-blue-100 dark:hover:bg-blue-800 border-blue-300"
                                onClick={() => handleSelectComponent(
                                  reservation.typeComponentId, 
                                  reservation.typeComponent?.name || 'Unknown',
                                  reservation.warehouse?.warehouseId || '',
                                  reservation.reservationId
                                )}
                                disabled={isLoadingComponentsList}
                              >
                                {isLoadingComponentsList ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Package className="h-3 w-3 mr-1" />
                                )}
                                Select
                              </Button>
                            </div>
                            <p className="text-base font-bold text-blue-900 dark:text-blue-100">{reservation.typeComponent?.name || '---'}</p>
                            {reservation.typeComponent?.sku && (
                              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-white dark:bg-blue-900/50 rounded border border-blue-200">
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">SKU:</span>
                                <span className="font-mono text-xs font-semibold text-blue-900 dark:text-blue-100">{reservation.typeComponent.sku}</span>
                              </div>
                            )}
                          </div>

                          <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border-l-4 border-green-500">
                            <div className="flex items-center gap-2 mb-2">
                              <Warehouse className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <label className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider">Warehouse</label>
                            </div>
                            <p className="text-base font-bold text-green-900 dark:text-green-100">{reservation.warehouse?.name || '---'}</p>
                            {reservation.warehouse?.address && (
                              <p className="text-sm text-green-800 dark:text-green-200 mt-2">{reservation.warehouse.address}</p>
                            )}
                            {reservation.warehouse?.warehouseId && (
                              <p className="font-mono text-xs text-green-700 dark:text-green-300 mt-1">ID: {reservation.warehouse.warehouseId}</p>
                            )}
                          </div>
                        </div>

                        {/* Quantity Information */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-center border-2 border-blue-200 dark:border-blue-800">
                              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase mb-2">Requested</p>
                              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{reservation.quantityRequested || 0}</p>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg text-center border-2 border-green-200 dark:border-green-800">
                              <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase mb-2">Reserved</p>
                              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{reservation.quantityReserved || 0}</p>
                            </div>
                          </div>

                          {/* Technical IDs */}
                          <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg space-y-3 border border-gray-200 dark:border-gray-800">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock ID</label>
                              <p className="font-mono text-sm mt-1 text-foreground">{reservation.stockId || '---'}</p>
                            </div>
                            <div className="border-t pt-3">
                              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Request Item ID</label>
                              <p className="font-mono text-sm mt-1 text-foreground">{reservation.requestItemId || '---'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <div className="flex items-center justify-end gap-4 pt-6 border-t bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 rounded-lg -mx-6 -mb-6 mt-6">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowReservationsModal(false)}
                      className="px-6"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      onClick={confirmShipRequest}
                      disabled={shippingRequestId === selectedRequestForShip?.id}
                      className="px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {shippingRequestId === selectedRequestForShip?.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Shipping...
                        </>
                      ) : (
                        <>
                          <Truck className="mr-2 h-4 w-4" />
                          Confirm Ship
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* CaseLine Detail Modal */}
        <Dialog open={showCaseLineModal} onOpenChange={setShowCaseLineModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Case Line Details</DialogTitle>
              <DialogDescription>Full case line information returned from the API</DialogDescription>
            </DialogHeader>

            {isLoadingCaseLine ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selectedCaseLine ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Case Line ID</label>
                    <p className="font-mono text-sm">{selectedCaseLine.caseLineId || selectedCaseLine.id || '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Guarantee Case ID</label>
                    <p className="font-mono text-sm">{selectedCaseLine.guaranteeCaseId || '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Diagnosis Text</label>
                    <p className="text-sm">{selectedCaseLine.diagnosisText || '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Correction Text</label>
                    <p className="text-sm">{selectedCaseLine.correctionText || '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Component ID</label>
                    <p className="font-mono text-sm">{selectedCaseLine.componentId || '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                    <p className="text-sm">{(selectedCaseLine.quantity != null) ? selectedCaseLine.quantity : '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity Reserved</label>
                    <p className="text-sm">{(selectedCaseLine.quantityReserved != null) ? selectedCaseLine.quantityReserved : '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Warranty Status</label>
                    <p className="text-sm">{selectedCaseLine.warrantyStatus || '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm">{selectedCaseLine.status || '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tech ID</label>
                    <p className="font-mono text-sm">{selectedCaseLine.techId || '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <p className="text-sm">{selectedCaseLine.createdAt ? formatDate(selectedCaseLine.createdAt) : '---'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                    <p className="text-sm">{selectedCaseLine.updatedAt ? formatDate(selectedCaseLine.updatedAt) : '---'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-6">No case line details available</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Component Detail Modal */}
        {/* Components List Modal */}
        <Dialog open={showComponentsListModal} onOpenChange={setShowComponentsListModal}>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Components List - {selectedTypeComponentName}
              </DialogTitle>
              <DialogDescription>
                All available components for this type
              </DialogDescription>
            </DialogHeader>

            {isLoadingComponentsList ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <span className="ml-3 text-lg text-muted-foreground">Loading components...</span>
              </div>
            ) : matchedComponentsList.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Found <span className="font-bold text-blue-600 dark:text-blue-400">{matchedComponentsList.length}</span> available components
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-400 dark:bg-blue-600 rounded-lg blur opacity-25"></div>
                      <div className="relative px-6 py-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-blue-400 dark:border-blue-600 shadow-md">
                        <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1 text-center">Selected</div>
                        <div className="text-3xl font-black text-blue-600 dark:text-blue-400 text-center tabular-nums">
                          {currentReservationId ? (selectedComponentIdsByReservation[currentReservationId]?.length || 0) : 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-3xl font-bold text-gray-400 dark:text-gray-600">/</div>
                    
                    <div className="relative">
                      <div className="absolute inset-0 bg-green-400 dark:bg-green-600 rounded-lg blur opacity-25"></div>
                      <div className="relative px-6 py-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-green-400 dark:border-green-600 shadow-md">
                        <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1 text-center">Required</div>
                        <div className="text-3xl font-black text-green-600 dark:text-green-400 text-center tabular-nums">
                          {reservations.find(r => r.reservationId === currentReservationId)?.quantityRequested || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-4">
                  {matchedComponentsList.map((component, index) => (
                    <Card key={component.serialNumber || index} className="border-2 hover:shadow-lg transition-shadow">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Name</label>
                              <p className="text-base font-bold mt-1">{component.typeComponent?.name || component.name || '---'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Serial Number</label>
                              <p className="font-mono text-sm mt-1">{component.serialNumber || '---'}</p>
                            </div>
                            {(component.typeComponent?.sku || component.sku) && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/50 rounded border border-blue-200">
                                <Tag className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                <span className="font-mono text-xs font-semibold">{component.typeComponent?.sku || component.sku}</span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Category</label>
                              <p className="text-sm mt-1">{component.typeComponent?.category || component.category || '---'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                              <div className="mt-1">
                                <Badge variant={component.status === 'IN_WAREHOUSE' ? 'default' : 'secondary'}>
                                  {component.status || 'N/A'}
                                </Badge>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Make Brand</label>
                              <p className="text-sm mt-1">{component.typeComponent?.makeBrand || component.makeBrand || '---'}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Component ID</label>
                              <p className="font-mono text-xs mt-1">{component.componentId || '---'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Created At</label>
                              <p className="text-sm mt-1">{component.createdAt ? formatDate(component.createdAt) : '---'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Price</label>
                              <p className="text-base font-bold text-green-600 dark:text-green-400 mt-1">
                                {(component.typeComponent?.price || component.price) ? `${(component.typeComponent?.price || component.price).toLocaleString()} VND` : '---'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end mt-4 pt-4 border-t">
                          {currentReservationId && selectedComponentIdsByReservation[currentReservationId]?.includes(component.componentId) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-green-50 dark:bg-green-950 border-green-500 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectComponentForShip(component.componentId);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Selected
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectComponentForShip(component.componentId);
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Select This Component
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-base text-muted-foreground">No components found</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Warehouse Selection Modal */}
        <Dialog open={showWarehouseSelectionModal} onOpenChange={setShowWarehouseSelectionModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-blue-600" />
                Select Warehouse
              </DialogTitle>
              <DialogDescription>
                Choose a warehouse to view its available type components
              </DialogDescription>
            </DialogHeader>

            {isLoadingWarehouses ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading warehouses...</span>
              </div>
            ) : warehouses.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {warehouses.map((warehouse) => (
                  <Card 
                    key={warehouse.warehouseId} 
                    className="border hover:border-blue-400 transition-all cursor-pointer hover:shadow-md"
                    onClick={() => {
                      console.log('🖱️ Warehouse clicked:', warehouse.name);
                      setSelectedWarehouse(warehouse);
                      setShowWarehouseSelectionModal(false);
                      setShowTypeComponentsModal(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg text-foreground mb-1">
                              {warehouse.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">{warehouse.address}</p>
                          </div>
                          <Badge variant={warehouse.priority === 1 ? 'default' : 'secondary'}>
                            Priority {warehouse.priority}
                          </Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                          {warehouse.serviceCenter && (
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Service Center</label>
                              <p className="text-sm mt-1">{warehouse.serviceCenter.name}</p>
                              <p className="text-xs text-muted-foreground">{warehouse.serviceCenter.address}</p>
                            </div>
                          )}
                          {warehouse.company && (
                            <div>
                              <label className="text-xs font-semibold text-muted-foreground uppercase">Company</label>
                              <p className="text-sm mt-1">{warehouse.company.name}</p>
                            </div>
                          )}
                        </div>

                        {/* Stock Summary */}
                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">
                              <Package className="h-4 w-4 inline mr-1" />
                              Component Types Available
                            </span>
                            <Badge variant="outline" className="text-sm">
                              {warehouse.stocks?.length || 0} types
                            </Badge>
                          </div>
                          {warehouse.stocks && warehouse.stocks.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {warehouse.stocks.slice(0, 3).map((stock: any, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {stock.typeComponent?.name}
                                </Badge>
                              ))}
                              {warehouse.stocks.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{warehouse.stocks.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Warehouse className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-base text-muted-foreground">No warehouses found</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Type Components Modal */}
        <Dialog open={showTypeComponentsModal} onOpenChange={setShowTypeComponentsModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Type Components in {selectedWarehouse?.name || 'Warehouse'}
              </DialogTitle>
              <DialogDescription>
                {selectedWarehouse 
                  ? `Viewing components available in ${selectedWarehouse.name}`
                  : 'Browse available component types'
                }
              </DialogDescription>
            </DialogHeader>

            {isLoadingTypeComponents ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading type components...</span>
              </div>
            ) : typeComponents.length > 0 ? (
              <div className="space-y-4">
                {/* Warehouse Info Banner */}
                {selectedWarehouse && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Warehouse className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100">{selectedWarehouse.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedWarehouse.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {typeComponentsTotalItems} component types
                        </Badge>
                        <Badge variant={selectedWarehouse.priority === 1 ? 'default' : 'secondary'}>
                          Priority {selectedWarehouse.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* Components Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {typeComponents.map((component: any) => (
                    <Card key={component.typeComponentId} className="border hover:border-blue-300 transition-colors">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-base text-foreground mb-1">
                                {component.name}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {component.sku}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {component.category.replace(/_/g, ' ')}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Stock Info */}
                          <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                            <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                              <p className="text-xs text-muted-foreground">In Stock</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {component.quantityInStock || 0}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                              <p className="text-xs text-muted-foreground">Reserved</p>
                              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                                {component.quantityReserved || 0}
                              </p>
                            </div>
                            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                              <p className="text-xs text-muted-foreground">Available</p>
                              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {component.quantityAvailable || 0}
                              </p>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2 border-t">
                            <Button
                              variant="default"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                setSelectedTypeComponentForCreate(component);
                                setShowCreateComponentModal(true);
                              }}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Add Component
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Back to Warehouse Selection */}
                <div className="flex items-center justify-center pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowTypeComponentsModal(false);
                      setShowWarehouseSelectionModal(true);
                      setSelectedWarehouse(null);
                    }}
                  >
                    <Warehouse className="h-4 w-4 mr-2" />
                    Back to Warehouse Selection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-base text-muted-foreground">
                  {selectedWarehouse ? 'No type components found in this warehouse' : 'No type components found'}
                </p>
                {selectedWarehouse && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setShowTypeComponentsModal(false);
                      setShowWarehouseSelectionModal(true);
                      setSelectedWarehouse(null);
                    }}
                  >
                    <Warehouse className="h-4 w-4 mr-2" />
                    Back to Warehouse Selection
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Component Modal */}
        <Dialog open={showCreateComponentModal} onOpenChange={setShowCreateComponentModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Add New Component
              </DialogTitle>
              <DialogDescription>
                Create a new component for {selectedTypeComponentForCreate?.name || 'this type'}
              </DialogDescription>
            </DialogHeader>

            {selectedTypeComponentForCreate && selectedWarehouse && (
              <div className="space-y-4">
                {/* Warehouse Info Banner */}
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4 text-blue-600" />
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Target Warehouse</label>
                      <p className="text-sm font-semibold mt-0.5">{selectedWarehouse.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedWarehouse.address}</p>
                    </div>
                  </div>
                </div>

                {/* Type Component Info */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Component Type</label>
                      <p className="text-sm font-semibold mt-1">{selectedTypeComponentForCreate.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedTypeComponentForCreate.sku}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {selectedTypeComponentForCreate.category.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Serial Number Input */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    Serial Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter serial number (e.g., ADAS-CAM-666)"
                    value={componentSerialNumber}
                    onChange={(e) => setComponentSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                    disabled={isCreatingComponent}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be the unique identifier for this component
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateComponentModal(false);
                      setComponentSerialNumber('');
                      setSelectedTypeComponentForCreate(null);
                    }}
                    disabled={isCreatingComponent}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    onClick={createComponent}
                    disabled={isCreatingComponent || !componentSerialNumber.trim()}
                    className="gap-2"
                  >
                    {isCreatingComponent ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Create Component
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PartsCompanyDashboard;
