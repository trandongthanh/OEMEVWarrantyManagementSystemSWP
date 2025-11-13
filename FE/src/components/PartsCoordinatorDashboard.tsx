import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Package,
  LogOut,
  Warehouse as WarehouseIcon,
  Eye,
  Loader2,
  Calendar,
  User,
  Warehouse,
  Truck,
  CheckCircle,
  MapPin,
  ClipboardList,
  AlertCircle,
  FileText,
  Building2,
  Tag,
  Search
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface TypeComponent {
  typeComponentId: string;
  name: string;
  sku: string;
  category: string;
}

interface Stock {
  stockId: string;
  typeComponentId: string;
  quantityInStock: number;
  quantityReserved: number;
  quantityAvailable: number;
  typeComponent?: TypeComponent;
}

interface InventorySummary {
  warehouseId: string;
  totalInStock: string;
  totalReserved: string;
  totalAvailable: string;
  warehouse: {
    warehouseId: string;
    name: string;
    serviceCenterId: string;
    vehicleCompanyId: string;
  };
}

interface Warehouse {
  warehouseId: string;
  name: string;
  address: string;
  priority: number;
  vehicleCompanyId: string | null;
  serviceCenterId: string | null;
  createdAt: string;
  updatedAt: string;
  serviceCenter?: {
    serviceCenterId: string;
    name: string;
    address: string;
  };
  company?: {
    vehicleCompanyId: string;
    name: string;
  };
  stocks?: Stock[];
  inventorySummary?: InventorySummary; // Add inventory summary to warehouse
}

interface Component {
  componentId: string;
  serialNumber: string;
  status: string;
  warehouseId: string | null;
  typeComponentId: string;
}

interface Technician {
  userId: string;
  name: string;
  email: string;
  phone: string;
  roleId?: string;
}

interface Staff {
  userId: string;
  serviceCenterId: string;
  name: string;
}

interface VehicleProcessingRecord {
  vehicleProcessingRecordId: string;
  vin: string;
  createdByStaffId: string;
  createdByStaff: Staff;
}

interface GuaranteeCase {
  guaranteeCaseId: string;
  vehicleProcessingRecordId: string;
  status: string;
  vehicleProcessingRecord: VehicleProcessingRecord;
}

interface CaseLine {
  id: string;
  guaranteeCaseId: string;
  typeComponentId: string;
  quantity: number;
  status: string;
  diagnosticTechId: string;
  repairTechId: string;
  diagnosticTechnician: Technician;
  repairTechnician: Technician;
  guaranteeCase: GuaranteeCase;
}


interface ComponentReservation {
  reservationId: string;
  caseLineId: string;
  componentId: string;
  status: string;
  pickedUpBy: string | null;
  pickedUpAt: string | null;
  installedAt: string | null;
  oldComponentSerial?: string | null;
  oldComponentReturned?: boolean;
  returnedAt?: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  case_line_id?: string; // snake_case from API
  component_id?: string; // snake_case from API
  picked_up_by?: string | null; // snake_case from API
  component: Component;
  pickedUpByTech: Technician | null;
  caseLine: CaseLine;
}

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

const PartsCoordinatorDashboard: React.FC = () => {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();

  const [stockTransferRequests, setStockTransferRequests] = useState<StockTransferRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<StockTransferRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedStockRequest, setSelectedStockRequest] = useState<StockTransferRequest | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [receivingRequestId, setReceivingRequestId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Warehouse States
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [showWarehouseDetailModal, setShowWarehouseDetailModal] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Stock Adjustment States
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({
    adjustmentType: 'IN' as 'IN' | 'OUT',
    quantity: '',
    reason: 'SUPPLIER_DELIVERY',
    note: ''
  });

  // Component Reservation States
  const [reservations, setReservations] = useState<ComponentReservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<ComponentReservation[]>([]);
  const [selectedReservationStatus, setSelectedReservationStatus] = useState<string>('ALL');
  const [technicianSearchQuery, setTechnicianSearchQuery] = useState<string>('');
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [showReservationDetailModal, setShowReservationDetailModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<ComponentReservation | null>(null);
  const [selectedReservationIds, setSelectedReservationIds] = useState<string[]>([]);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [isPickingUp, setIsPickingUp] = useState(false);
  
  // Pagination states for reservations
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReservations, setTotalReservations] = useState(0);
  const [pageLimit] = useState(20);

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
  // Load requests on mount
  useEffect(() => {
    fetchStockTransferRequests();
    fetchWarehouses();
    fetchReservations();
  }, []);

  // Filter requests by status
  useEffect(() => {
    if (selectedStatus === 'ALL') {
      setFilteredRequests(stockTransferRequests);
    } else {
      setFilteredRequests(stockTransferRequests.filter(req => req.status === selectedStatus));
    }
  }, [selectedStatus, stockTransferRequests]);

  // Filter reservations by status and technician name
  useEffect(() => {
    let filtered = reservations;
    
    // Filter by status
    if (selectedReservationStatus !== 'ALL') {
      filtered = filtered.filter(r => r.status === selectedReservationStatus);
    }
    
    // Filter by technician name - only search repair technician
    if (technicianSearchQuery.trim()) {
      const query = technicianSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => {
        const repairTech = r.caseLine?.repairTechnician?.name?.toLowerCase() || '';
        return repairTech.includes(query);
      });
    }
    
    setFilteredReservations(filtered);
  }, [selectedReservationStatus, reservations, technicianSearchQuery]);

  // Fetch warehouses
  const fetchWarehouses = async () => {
    setIsLoadingWarehouses(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingWarehouses(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const warehouseData = response.data?.data?.warehouses || [];
      
      // Fetch inventory summary for each warehouse that has a service center
      const warehousesWithSummary = await Promise.all(
        warehouseData.map(async (warehouse: Warehouse) => {
          if (warehouse.serviceCenterId) {
            try {
              const summaryResponse = await axios.get(
                `${API_BASE_URL}/inventory/summary?serviceCenterId=${warehouse.serviceCenterId}`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              
              if (summaryResponse.data.status === 'success') {
                // Find the summary for this specific warehouse
                const summary = summaryResponse.data.data.summary.find(
                  (s: InventorySummary) => s.warehouseId === warehouse.warehouseId
                );
                
                return {
                  ...warehouse,
                  inventorySummary: summary,
                };
              }
            } catch (error) {
              console.error(`Failed to fetch inventory summary for warehouse ${warehouse.warehouseId}:`, error);
            }
          }
          return warehouse;
        })
      );
      
      setWarehouses(warehousesWithSummary);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  // View warehouse details
  const viewWarehouseDetails = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setSelectedCategory('ALL'); // Reset category filter when opening new warehouse
    setShowWarehouseDetailModal(true);
  };

  // Fetch component reservations
  const fetchReservations = async (page: number = 1) => {
    setIsLoadingReservations(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      console.error('❌ No token found');
      setIsLoadingReservations(false);
      return;
    }
    try {
      console.log(`🔍 Fetching reservations - Page ${page}, Limit ${pageLimit}`);
      const url = `${API_BASE_URL}/reservations?page=${page}&limit=${pageLimit}`;
      console.log('📍 Request URL:', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Full API Response:', response.data);
      console.log('📦 Response status:', response.status);
      
      // Try different response structures
      let reservationsData: any[] = [];
      let pagination: any = {};
      
      // Structure 1: { data: { reservations: [], pagination: {} } }
      if (response.data?.data?.reservations) {
        reservationsData = response.data.data.reservations;
        pagination = response.data.data.pagination || {};
        console.log('✅ Found reservations in response.data.data.reservations');
      }
      // Structure 2: { data: { componentReservations: [], pagination: {} } }
      else if (response.data?.data?.componentReservations) {
        reservationsData = response.data.data.componentReservations;
        pagination = response.data.data.pagination || {};
        console.log('✅ Found reservations in response.data.data.componentReservations');
      }
      // Structure 3: { reservations: [] }
      else if (response.data?.reservations) {
        reservationsData = response.data.reservations;
        console.log('✅ Found reservations in response.data.reservations');
      }
      // Structure 4: Direct array
      else if (Array.isArray(response.data)) {
        reservationsData = response.data;
        console.log('✅ Response is direct array');
      }
      // Structure 5: { data: [] }
      else if (Array.isArray(response.data?.data)) {
        reservationsData = response.data.data;
        console.log('✅ Found reservations in response.data (array)');
      }
      
      console.log('� Reservations data:', reservationsData);
      console.log('📊 Number of reservations:', reservationsData.length);
      console.log('📄 Pagination info:', pagination);
      
      setReservations(reservationsData);
      setCurrentPage(pagination.currentPage || page);
      setTotalPages(pagination.totalPages || Math.ceil(reservationsData.length / pageLimit) || 1);
      setTotalReservations(pagination.totalItems || reservationsData.length);
      
      console.log('✅ State updated - Current Page:', pagination.currentPage || page);
      console.log('✅ State updated - Total Pages:', pagination.totalPages || 1);
      console.log('✅ State updated - Total Items:', pagination.totalItems || reservationsData.length);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch reservations:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error message:', error.message);
      setReservations([]);
      setTotalPages(1);
      setTotalReservations(0);
    } finally {
      setIsLoadingReservations(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchReservations(newPage);
      // Clear selections when changing page
      setSelectedReservationIds([]);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  // Open stock adjustment modal
  const openAdjustmentModal = (stock: Stock) => {
    setSelectedStock(stock);
    setAdjustmentForm({
      adjustmentType: 'IN',
      quantity: '',
      reason: 'SUPPLIER_DELIVERY',
      note: ''
    });
    setShowAdjustmentModal(true);
  };

  // View reservation details
  const viewReservationDetails = (reservation: ComponentReservation) => {
    // Simply show the modal with the reservation data we already have from the list
    setSelectedReservation(reservation);
    setShowReservationDetailModal(true);
  };

  // Toggle reservation selection
  const toggleReservationSelection = (reservationId: string) => {
    setSelectedReservationIds(prev => 
      prev.includes(reservationId) 
        ? prev.filter(id => id !== reservationId)
        : [...prev, reservationId]
    );
  };

  // Open pickup modal
  const openPickupModal = () => {
    if (selectedReservationIds.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one reservation to pick up',
        variant: 'destructive'
      });
      return;
    }

    // Validate that all selected reservations have the same repair technician
    const selectedReservations = reservations.filter(r => 
      selectedReservationIds.includes(r.reservationId) && r.status === 'RESERVED'
    );

    if (selectedReservations.length === 0) {
      toast({
        title: 'Invalid Selection',
        description: 'No valid reservations selected. Only RESERVED status can be picked up.',
        variant: 'destructive'
      });
      return;
    }

    const techIds = new Set(selectedReservations.map(r => r.caseLine.repairTechId));
    if (techIds.size > 1) {
      toast({
        title: 'Invalid Selection',
        description: 'All selected reservations must have the same repair technician',
        variant: 'destructive'
      });
      return;
    }

    setShowPickupModal(true);
  };

  // Handle pickup reservations
  const handlePickupReservations = async () => {
    if (selectedReservationIds.length === 0) {
      return;
    }

    setIsPickingUp(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsPickingUp(false);
      toast({
        title: 'Authentication Required',
        description: 'Please login again.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get repair tech ID from first selected reservation
      const selectedReservations = reservations.filter(r => 
        selectedReservationIds.includes(r.reservationId) && r.status === 'RESERVED'
      );
      
      if (selectedReservations.length === 0) {
        toast({
          title: 'No Valid Reservations',
          description: 'No valid reservations to pick up',
          variant: 'destructive'
        });
        setIsPickingUp(false);
        return;
      }

      const repairTechId = selectedReservations[0].caseLine.repairTechId;

      const response = await axios.patch(
        `${API_BASE_URL}/reservations/pickup`,
        {
          reservationIds: selectedReservationIds,
          pickedUpByTechId: repairTechId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.status === 'success') {
        toast({
          title: 'Success',
          description: `Successfully picked up ${selectedReservationIds.length} component(s)`
        });
        setShowPickupModal(false);
        setSelectedReservationIds([]);
        
        // Refresh reservations list
        await fetchReservations();
      }
    } catch (error: any) {
      console.error('Failed to pickup reservations:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to pickup components',
        variant: 'destructive'
      });
    } finally {
      setIsPickingUp(false);
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    if (!selectedStock || !adjustmentForm.quantity || parseInt(adjustmentForm.quantity) <= 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid quantity',
        variant: 'destructive'
      });
      return;
    }

    setIsAdjusting(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsAdjusting(false);
      toast({
        title: 'Authentication Required',
        description: 'Please login again.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/inventory/adjustments`,
        {
          stockId: selectedStock.stockId,
          adjustmentType: adjustmentForm.adjustmentType,
          quantity: parseInt(adjustmentForm.quantity),
          reason: adjustmentForm.reason,
          note: adjustmentForm.note
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.status === 'success') {
        toast({
          title: 'Success',
          description: 'Stock adjustment completed successfully'
        });
        setShowAdjustmentModal(false);
        
        // Update the stock in selectedWarehouse
        if (selectedWarehouse) {
          const updatedStocks = selectedWarehouse.stocks?.map(stock => 
            stock.stockId === selectedStock.stockId 
              ? {
                  ...stock,
                  quantityInStock: response.data.data.updatedStock.quantityInStock,
                  quantityReserved: response.data.data.updatedStock.quantityReserved,
                  quantityAvailable: response.data.data.updatedStock.quantityAvailable,
                }
              : stock
          );
          setSelectedWarehouse({
            ...selectedWarehouse,
            stocks: updatedStocks
          });
          
          // Also update in warehouses list
          setWarehouses(warehouses.map(w => 
            w.warehouseId === selectedWarehouse.warehouseId 
              ? { ...selectedWarehouse, stocks: updatedStocks }
              : w
          ));
        }
      }
    } catch (error: any) {
      console.error('Failed to adjust stock:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to adjust stock',
        variant: 'destructive'
      });
    } finally {
      setIsAdjusting(false);
    }
  };

  // Receive stock transfer request
  const handleReceiveRequest = async (requestId: string) => {
    setReceivingRequestId(requestId);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setReceivingRequestId(null);
      return;
    }
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/stock-transfer-requests/${requestId}/receive`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Request received successfully:', response.data);
      
      // Refresh the list
      await fetchStockTransferRequests();
      
      // Refresh warehouse data to reflect inventory changes
      await fetchWarehouses();
      
      // If modal is open, refresh the detail
      if (showDetailModal && selectedStockRequest?.id === requestId) {
        await fetchStockTransferRequestDetail(requestId);
      }
      
      toast({
        title: 'Success',
        description: 'Request received successfully!'
      });
    } catch (error: any) {
      console.error('Failed to receive request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to receive request';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setReceivingRequestId(null);
    }
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
        return 'success';
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
                  <h1 className="text-xl font-bold text-foreground">Parts Coordinator Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome, {user?.name || 'Parts Coordinator'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs">
                  <WarehouseIcon className="mr-1 h-3 w-3" />
                  Parts Coordinator Service Center
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
          <Tabs defaultValue="requests" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="requests">Stock Transfer Requests</TabsTrigger>
              <TabsTrigger value="warehouses">Warehouse Management</TabsTrigger>
              <TabsTrigger value="reservations">Component Reservations</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Stock Transfer Requests</CardTitle>
                  <CardDescription>
                    View stock transfer requests for your service center
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Status Filter */}
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

              {isLoadingRequests ? (
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
                              {request.status === 'SHIPPED' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleReceiveRequest(request.id)}
                                  disabled={receivingRequestId === request.id}
                                >
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  {receivingRequestId === request.id ? 'Receiving...' : 'Receive'}
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
            </TabsContent>

            <TabsContent value="warehouses" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Warehouse Management
                      </CardTitle>
                      <CardDescription>View and manage warehouses and inventory</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchWarehouses}
                      disabled={isLoadingWarehouses}
                    >
                      {isLoadingWarehouses ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingWarehouses ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-muted-foreground">Loading warehouses...</p>
                    </div>
                  ) : warehouses.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No warehouses found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={fetchWarehouses}
                      >
                        Load Warehouses
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Service Center</TableHead>
                            <TableHead>Address</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Inventory Summary</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {warehouses.map((warehouse) => (
                            <TableRow key={warehouse.warehouseId}>
                              <TableCell className="font-medium">
                                {warehouse.name}
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">{warehouse.serviceCenter?.name || 'N/A'}</p>
                                  {warehouse.company?.name && (
                                    <p className="text-xs text-muted-foreground">{warehouse.company.name}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-muted-foreground" />
                                  {warehouse.address}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={warehouse.priority === 1 ? 'default' : warehouse.priority === 2 ? 'secondary' : 'outline'}
                                  className="text-xs"
                                >
                                  Priority {warehouse.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {warehouse.inventorySummary ? (
                                  <div className="space-y-1 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">In Stock:</span>
                                      <Badge variant="outline" className="font-semibold">
                                        {warehouse.inventorySummary.totalInStock}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">Reserved:</span>
                                      <Badge variant="secondary" className="font-semibold">
                                        {warehouse.inventorySummary.totalReserved}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">Available:</span>
                                      <Badge variant="default" className="font-semibold">
                                        {warehouse.inventorySummary.totalAvailable}
                                      </Badge>
                                    </div>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    No data
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewWarehouseDetails(warehouse)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Inventory
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {warehouses.length} warehouse{warehouses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Component Reservations Tab */}
            <TabsContent value="reservations" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5" />
                        Component Reservations
                      </CardTitle>
                      <CardDescription>
                        Components reserved for warranty case repairs
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchReservations(currentPage)}
                      disabled={isLoadingReservations}
                    >
                      <Loader2 className={`h-4 w-4 mr-2 ${isLoadingReservations ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status Filter Tabs */}
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    {['ALL', 'RESERVED', 'PICKED_UP', 'INSTALLED', 'CANCELLED'].map((status) => {
                      const count = status === 'ALL' 
                        ? reservations.length 
                        : reservations.filter(r => r.status === status).length;
                      return (
                        <Button
                          key={status}
                          variant={selectedReservationStatus === status ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedReservationStatus(status)}
                          className="border-dashed"
                        >
                          {status.replace(/_/g, ' ')} ({count})
                        </Button>
                      );
                    })}
                  </div>

                  {/* Technician Search */}
                  <div className="mb-4">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search by technician name..."
                        value={technicianSearchQuery}
                        onChange={(e) => setTechnicianSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  {/* Pickup Button */}
                  {reservations.some(r => r.status === 'RESERVED') && (
                    <div className="mb-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          {selectedReservationIds.length} item(s) selected
                        </span>
                      </div>
                      <Button
                        onClick={openPickupModal}
                        disabled={selectedReservationIds.length === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Pick Up Selected ({selectedReservationIds.length})
                      </Button>
                    </div>
                  )}

                  {isLoadingReservations ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredReservations.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">No reservations found</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedReservationStatus === 'ALL' 
                          ? 'There are no component reservations at the moment'
                          : `No reservations with status "${selectedReservationStatus.replace(/_/g, ' ')}"`
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">Select</TableHead>
                            <TableHead>#</TableHead>
                            <TableHead>Component Serial</TableHead>
                            <TableHead>VIN</TableHead>
                            <TableHead>Case Line Status</TableHead>
                            <TableHead>Technician</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reserved At</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredReservations.map((reservation, index) => (
                            <TableRow key={reservation.reservationId}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedReservationIds.includes(reservation.reservationId)}
                                  onCheckedChange={() => toggleReservationSelection(reservation.reservationId)}
                                  disabled={reservation.status !== 'RESERVED'}
                                />
                              </TableCell>
                              <TableCell className="font-medium">
                                {(currentPage - 1) * pageLimit + index + 1}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                    {reservation.component?.serialNumber || 'N/A'}
                                  </code>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    ID: {reservation.componentId?.substring(0, 8) || 'N/A'}...
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">
                                    {reservation.caseLine?.guaranteeCase?.vehicleProcessingRecord?.vin || 'N/A'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Case: {reservation.caseLine?.guaranteeCaseId?.substring(0, 8) || 'N/A'}...
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={`text-xs font-semibold ${
                                    reservation.caseLine?.status === 'PENDING'
                                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                    reservation.caseLine?.status === 'READY_FOR_REPAIR' 
                                      ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    reservation.caseLine?.status === 'IN_PROGRESS'
                                      ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                    reservation.caseLine?.status === 'COMPLETED' 
                                      ? 'bg-green-100 text-green-800 border-green-300' :
                                    reservation.caseLine?.status === 'CANCELLED'
                                      ? 'bg-red-100 text-red-800 border-red-300' :
                                      'bg-gray-100 text-gray-800 border-gray-300'
                                  }`}
                                  variant="outline"
                                >
                                  {reservation.caseLine?.status?.replace(/_/g, ' ') || 'N/A'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="font-medium">
                                    {reservation.caseLine?.repairTechnician?.name || 'N/A'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {reservation.caseLine?.repairTechnician?.email || 'N/A'}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  className={`text-xs font-semibold ${
                                    reservation.status === 'RESERVED' 
                                      ? 'bg-amber-100 text-amber-800 border-amber-400' :
                                    reservation.status === 'PICKED_UP' 
                                      ? 'bg-blue-100 text-blue-800 border-blue-400' :
                                    reservation.status === 'INSTALLED' 
                                      ? 'bg-green-100 text-green-800 border-green-400' :
                                    reservation.status === 'CANCELLED' 
                                      ? 'bg-red-100 text-red-800 border-red-400' :
                                    reservation.status === 'RETURNED'
                                      ? 'bg-purple-100 text-purple-800 border-purple-400' :
                                      'bg-gray-100 text-gray-800 border-gray-300'
                                  }`}
                                  variant="outline"
                                >
                                  {reservation.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(reservation.createdAt).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewReservationDetails(reservation)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  
                  {/* Pagination Controls */}
                  {!isLoadingReservations && reservations.length > 0 && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * pageLimit) + 1} to {Math.min(currentPage * pageLimit, totalReservations)} of {totalReservations} reservation{totalReservations !== 1 ? 's' : ''}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          {/* Show first page */}
                          {currentPage > 3 && (
                            <>
                              <Button
                                variant={currentPage === 1 ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(1)}
                              >
                                1
                              </Button>
                              {currentPage > 4 && <span className="px-2">...</span>}
                            </>
                          )}
                          
                          {/* Show pages around current page */}
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              return page === currentPage || 
                                     page === currentPage - 1 || 
                                     page === currentPage + 1 ||
                                     (page === currentPage - 2 && currentPage <= 3) ||
                                     (page === currentPage + 2 && currentPage >= totalPages - 2);
                            })
                            .map(page => (
                              <Button
                                key={page}
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </Button>
                            ))
                          }
                          
                          {/* Show last page */}
                          {currentPage < totalPages - 2 && (
                            <>
                              {currentPage < totalPages - 3 && <span className="px-2">...</span>}
                              <Button
                                variant={currentPage === totalPages ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(totalPages)}
                              >
                                {totalPages}
                              </Button>
                            </>
                          )}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Stock Transfer Request Detail Modal */}
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Stock Transfer Request Details</span>
                {selectedStockRequest && selectedStockRequest.status === 'SHIPPED' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleReceiveRequest(selectedStockRequest.id)}
                    disabled={receivingRequestId === selectedStockRequest.id}
                  >
                    <CheckCircle className="mr-1 h-4 w-4" />
                    {receivingRequestId === selectedStockRequest.id ? 'Receiving...' : 'Receive Request'}
                  </Button>
                )}
              </DialogTitle>
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
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Request Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Request ID</label>
                        <p className="font-mono text-sm mt-1">#{selectedStockRequest.id.substring(0, 8)}...</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                        <div className="mt-1">
                          <Badge variant={getStatusBadgeVariant(selectedStockRequest.status)}>
                            {selectedStockRequest.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Requester
                        </label>
                        <p className="text-sm mt-1 font-medium">{selectedStockRequest.requester?.name || 'Unknown'}</p>
                        {selectedStockRequest.requester?.serviceCenter?.name && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {selectedStockRequest.requester.serviceCenter.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                          <Warehouse className="h-3 w-3" />
                          Requesting Warehouse
                        </label>
                        <p className="text-sm mt-1 font-medium">
                          {selectedStockRequest.requestingWarehouse?.name || 'Unknown Warehouse'}
                        </p>
                        {selectedStockRequest.requestingWarehouse?.address && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedStockRequest.requestingWarehouse.address}
                          </p>
                        )}
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

                    {/* Timestamps */}
                    <div className="pt-3 border-t">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Timeline</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/30 rounded">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Requested At
                          </label>
                          <p className="text-sm mt-1">{formatDate(selectedStockRequest.requestedAt)}</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/30 rounded">
                          <label className="text-xs font-semibold text-muted-foreground">Approved At</label>
                          <p className="text-sm mt-1">{selectedStockRequest.approvedAt ? formatDate(selectedStockRequest.approvedAt) : '---'}</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/30 rounded">
                          <label className="text-xs font-semibold text-muted-foreground">Shipped At</label>
                          <p className="text-sm mt-1">{selectedStockRequest.shippedAt ? formatDate(selectedStockRequest.shippedAt) : '---'}</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/30 rounded">
                          <label className="text-xs font-semibold text-muted-foreground">Received At</label>
                          <p className="text-sm mt-1">{selectedStockRequest.receivedAt ? formatDate(selectedStockRequest.receivedAt) : '---'}</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/30 rounded">
                          <label className="text-xs font-semibold text-muted-foreground">Rejected At</label>
                          <p className="text-sm mt-1">{selectedStockRequest.rejectedAt ? formatDate(selectedStockRequest.rejectedAt) : '---'}</p>
                        </div>
                        <div className="p-2 bg-slate-50 dark:bg-slate-900/30 rounded">
                          <label className="text-xs font-semibold text-muted-foreground">Cancelled At</label>
                          <p className="text-sm mt-1">{selectedStockRequest.cancelledAt ? formatDate(selectedStockRequest.cancelledAt) : '---'}</p>
                        </div>
                      </div>
                    </div>

                    {/* User IDs */}
                    <div className="pt-3 border-t">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Action By Users</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Approved By User ID</label>
                          <p className="font-mono text-xs mt-1">{selectedStockRequest.approvedByUserId || '---'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Received By User ID</label>
                          <p className="font-mono text-xs mt-1">{selectedStockRequest.receivedByUserId || '---'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Rejected By User ID</label>
                          <p className="font-mono text-xs mt-1">{selectedStockRequest.rejectedByUserId || '---'}</p>
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Cancelled By User ID</label>
                          <p className="font-mono text-xs mt-1">{selectedStockRequest.cancelledByUserId || '---'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Rejection/Cancellation Reasons */}
                    {selectedStockRequest.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <label className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Rejection Reason
                        </label>
                        <p className="text-sm mt-1 text-red-900 dark:text-red-100">{selectedStockRequest.rejectionReason}</p>
                      </div>
                    )}

                    {selectedStockRequest.cancellationReason && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                        <label className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Cancellation Reason
                        </label>
                        <p className="text-sm mt-1 text-red-900 dark:text-red-100">{selectedStockRequest.cancellationReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Requested Items */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600" />
                      Requested Items
                    </CardTitle>
                    <CardDescription>
                      {selectedStockRequest.items?.length || 0} component(s) in this request
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

        {/* Warehouse Detail Modal */}
        <Dialog open={showWarehouseDetailModal} onOpenChange={setShowWarehouseDetailModal}>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Warehouse className="h-5 w-5 text-primary" />
                Warehouse Inventory Details
              </DialogTitle>
              <DialogDescription>
                View warehouse information and stock inventory
              </DialogDescription>
            </DialogHeader>

            {selectedWarehouse && (
              <div className="space-y-6">
                {/* Warehouse Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Warehouse Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Warehouse Name</label>
                        <p className="text-sm font-semibold">{selectedWarehouse.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Priority</label>
                        <div className="mt-1">
                          <Badge 
                            variant={selectedWarehouse.priority === 1 ? 'default' : selectedWarehouse.priority === 2 ? 'secondary' : 'outline'}
                          >
                            Priority {selectedWarehouse.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Address
                        </label>
                        <p className="text-sm">{selectedWarehouse.address}</p>
                      </div>
                      {selectedWarehouse.serviceCenter && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Service Center</label>
                          <p className="text-sm font-medium">{selectedWarehouse.serviceCenter.name}</p>
                          <p className="text-xs text-muted-foreground">{selectedWarehouse.serviceCenter.address}</p>
                        </div>
                      )}
                      {selectedWarehouse.company && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Company</label>
                          <p className="text-sm font-medium">{selectedWarehouse.company.name}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created At
                        </label>
                        <p className="text-sm">{new Date(selectedWarehouse.createdAt).toLocaleString('vi-VN')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                        <p className="text-sm">{new Date(selectedWarehouse.updatedAt).toLocaleString('vi-VN')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Stock Inventory
                      </span>
                      <Badge variant="outline">
                        {selectedWarehouse.stocks?.length || 0} component types
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Available components and quantities in this warehouse
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedWarehouse.stocks && selectedWarehouse.stocks.length > 0 ? (
                      <div className="space-y-4">
                        {/* Category Filter */}
                        <div className="flex flex-wrap gap-2">
                          {(() => {
                            // Get unique categories from stocks
                            const categories = Array.from(
                              new Set(
                                selectedWarehouse.stocks
                                  ?.map(stock => stock.typeComponent?.category)
                                  .filter(Boolean)
                              )
                            ).sort();
                            
                            return (
                              <>
                                <Button
                                  key="ALL"
                                  variant={selectedCategory === 'ALL' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setSelectedCategory('ALL')}
                                  className="border-dashed"
                                >
                                  All Categories ({selectedWarehouse.stocks?.length || 0})
                                </Button>
                                {categories.map((category) => {
                                  const count = selectedWarehouse.stocks?.filter(
                                    stock => stock.typeComponent?.category === category
                                  ).length || 0;
                                  return (
                                    <Button
                                      key={category}
                                      variant={selectedCategory === category ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setSelectedCategory(category as string)}
                                      className="border-dashed"
                                    >
                                      {category} ({count})
                                    </Button>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>

                        {/* Stock Table */}
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Component Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">In Stock</TableHead>
                                <TableHead className="text-right">Reserved</TableHead>
                                <TableHead className="text-right">Available</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(() => {
                                // Filter stocks by selected category
                                const filteredStocks = selectedCategory === 'ALL'
                                  ? selectedWarehouse.stocks
                                  : selectedWarehouse.stocks?.filter(
                                      stock => stock.typeComponent?.category === selectedCategory
                                    );

                                return filteredStocks && filteredStocks.length > 0 ? (
                                  filteredStocks.map((stock, index) => (
                                    <TableRow key={stock.stockId}>
                                      <TableCell className="font-medium">
                                        {index + 1}
                                      </TableCell>
                                      <TableCell>
                                        <div>
                                          <p className="font-medium text-sm">{stock.typeComponent?.name || 'N/A'}</p>
                                          <p className="text-xs text-muted-foreground font-mono">
                                            ID: {stock.typeComponentId.substring(0, 8)}...
                                          </p>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <code className="text-xs bg-muted px-2 py-1 rounded">
                                          {stock.typeComponent?.sku || 'N/A'}
                                        </code>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                          {stock.typeComponent?.category || 'N/A'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <span className="font-medium">{stock.quantityInStock}</span>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Badge variant="secondary" className="text-xs">
                                          {stock.quantityReserved}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Badge 
                                          variant={stock.quantityAvailable > 0 ? 'default' : 'destructive'}
                                          className="text-xs font-semibold"
                                        >
                                          {stock.quantityAvailable}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {stock.quantityAvailable === 0 ? (
                                          <Badge variant="destructive" className="text-xs">
                                            Out of Stock
                                          </Badge>
                                        ) : stock.quantityAvailable <= 5 ? (
                                          <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                                            Low Stock
                                          </Badge>
                                        ) : (
                                          <Badge variant="success" className="text-xs">
                                            In Stock
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => openAdjustmentModal(stock)}
                                        >
                                          Adjust
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
                                      <p className="text-muted-foreground">
                                        No components in category "{selectedCategory}"
                                      </p>
                                    </TableCell>
                                  </TableRow>
                                );
                              })()}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No stock items in this warehouse</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Stock Adjustment Modal */}
        <Dialog open={showAdjustmentModal} onOpenChange={setShowAdjustmentModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adjust Stock Quantity</DialogTitle>
              <DialogDescription>
                Update stock levels for inventory management
              </DialogDescription>
            </DialogHeader>
            
            {selectedStock && (
              <div className="space-y-6">
                {/* Stock Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Stock Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Component:</span>
                      <span className="font-medium">{selectedStock.typeComponent?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SKU:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{selectedStock.typeComponent?.sku}</code>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="outline" className="text-xs">{selectedStock.typeComponent?.category}</Badge>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">In Stock</p>
                          <p className="text-lg font-semibold">{selectedStock.quantityInStock}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Reserved</p>
                          <p className="text-lg font-semibold text-amber-600">{selectedStock.quantityReserved}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Available</p>
                          <p className="text-lg font-semibold text-green-600">{selectedStock.quantityAvailable}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Adjustment Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="adjustmentType">Adjustment Type *</Label>
                      <Select
                        value={adjustmentForm.adjustmentType}
                        onValueChange={(value: 'IN' | 'OUT') => 
                          setAdjustmentForm({ ...adjustmentForm, adjustmentType: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IN">IN - Increase Stock</SelectItem>
                          <SelectItem value="OUT">OUT - Decrease Stock</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {adjustmentForm.adjustmentType === 'IN' 
                          ? 'Add items to inventory' 
                          : 'Remove items from inventory'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        placeholder="Enter quantity"
                        value={adjustmentForm.quantity}
                        onChange={(e) => 
                          setAdjustmentForm({ ...adjustmentForm, quantity: e.target.value })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Number of items to {adjustmentForm.adjustmentType === 'IN' ? 'add' : 'remove'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Select
                      value={adjustmentForm.reason}
                      onValueChange={(value) => 
                        setAdjustmentForm({ ...adjustmentForm, reason: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUPPLIER_DELIVERY">Supplier Delivery</SelectItem>
                        <SelectItem value="CUSTOMER_RETURN">Customer Return</SelectItem>
                        <SelectItem value="DAMAGE">Damage/Defect</SelectItem>
                        <SelectItem value="THEFT">Theft/Loss</SelectItem>
                        <SelectItem value="MANUAL_COUNT">Manual Count Correction</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="note">Note</Label>
                    <Textarea
                      id="note"
                      placeholder="Enter additional details (PO number, invoice, etc.)"
                      rows={3}
                      value={adjustmentForm.note}
                      onChange={(e) => 
                        setAdjustmentForm({ ...adjustmentForm, note: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowAdjustmentModal(false)}
                    disabled={isAdjusting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStockAdjustment}
                    disabled={isAdjusting || !adjustmentForm.quantity}
                  >
                    {isAdjusting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adjusting...
                      </>
                    ) : (
                      'Confirm Adjustment'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reservation Detail Modal */}
        <Dialog open={showReservationDetailModal} onOpenChange={setShowReservationDetailModal}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ClipboardList className="h-6 w-6 text-blue-600" />
                Component Reservation Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the component reservation and related warranty case
              </DialogDescription>
            </DialogHeader>

            {selectedReservation && (
              <div className="space-y-5">
                {/* Status Overview Bar */}
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Reservation Status</p>
                        <p className="text-2xl font-bold mt-1">{selectedReservation.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Reservation ID</p>
                        <p className="text-sm font-mono mt-1 opacity-90">{selectedReservation.reservationId.substring(0, 13)}...</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline Information */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <label className="text-xs font-semibold text-blue-700 uppercase">Created</label>
                        <p className="text-sm mt-1.5 text-blue-900">
                          {new Date(selectedReservation.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                        <p className="text-xs text-blue-600 mt-0.5">
                          {new Date(selectedReservation.createdAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                      {selectedReservation.pickedUpAt && (
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                          <label className="text-xs font-semibold text-amber-700 uppercase">Picked Up</label>
                          <p className="text-sm mt-1.5 text-amber-900">
                            {new Date(selectedReservation.pickedUpAt).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            {new Date(selectedReservation.pickedUpAt).toLocaleTimeString('vi-VN')}
                          </p>
                        </div>
                      )}
                      {selectedReservation.installedAt && (
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <label className="text-xs font-semibold text-green-700 uppercase">Installed</label>
                          <p className="text-sm mt-1.5 text-green-900">
                            {new Date(selectedReservation.installedAt).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-xs text-green-600 mt-0.5">
                            {new Date(selectedReservation.installedAt).toLocaleTimeString('vi-VN')}
                          </p>
                        </div>
                      )}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <label className="text-xs font-semibold text-slate-700 uppercase">Last Updated</label>
                        <p className="text-sm mt-1.5 text-slate-900">
                          {new Date(selectedReservation.updatedAt).toLocaleDateString('vi-VN')}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {new Date(selectedReservation.updatedAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Component Information */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-5 w-5 text-purple-600" />
                      Component Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <label className="text-xs font-semibold text-purple-700 uppercase">Serial Number</label>
                        <code className="text-lg bg-white text-purple-900 px-3 py-2 rounded font-mono mt-2 inline-block font-bold border-2 border-purple-300 shadow-sm">
                          {selectedReservation.component?.serialNumber || 'N/A'}
                        </code>
                      </div>
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <label className="text-xs font-semibold text-purple-700 uppercase">Status</label>
                        <div className="mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-sm font-bold px-3 py-1 ${
                              selectedReservation.component?.status === 'AVAILABLE'
                                ? 'bg-green-100 text-green-800 border-green-400' :
                              selectedReservation.component?.status === 'RESERVED'
                                ? 'bg-amber-100 text-amber-800 border-amber-400' :
                              selectedReservation.component?.status === 'INSTALLED'
                                ? 'bg-blue-100 text-blue-800 border-blue-400' :
                              selectedReservation.component?.status === 'IN_USE'
                                ? 'bg-indigo-100 text-indigo-800 border-indigo-400' :
                              selectedReservation.component?.status === 'DEFECTIVE'
                                ? 'bg-red-100 text-red-800 border-red-400' :
                                'bg-purple-50 text-purple-700 border-purple-300'
                            }`}
                          >
                            {selectedReservation.component?.status || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Vehicle Information */}
                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Truck className="h-5 w-5 text-orange-600" />
                      Vehicle Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <label className="text-xs font-semibold text-orange-700 uppercase">VIN (Vehicle Identification Number)</label>
                        <p className="text-xl font-bold mt-2 text-orange-900 tracking-wider">
                          {selectedReservation.caseLine?.guaranteeCase?.vehicleProcessingRecord?.vin || 'N/A'}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <label className="text-xs font-semibold text-orange-700 uppercase flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Service Staff
                        </label>
                        <p className="text-base font-semibold mt-2 text-orange-900">
                          {selectedReservation.caseLine?.guaranteeCase?.vehicleProcessingRecord?.createdByStaff?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Warranty Case Information */}
                <Card className="border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                      Warranty Case & Repair Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <label className="text-xs font-semibold text-emerald-700 uppercase">Case Status</label>
                        <div className="mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-sm font-bold px-3 py-1 ${
                              selectedReservation.caseLine?.guaranteeCase?.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
                              selectedReservation.caseLine?.guaranteeCase?.status === 'DIAGNOSED'
                                ? 'bg-blue-100 text-blue-800 border-blue-400' :
                              selectedReservation.caseLine?.guaranteeCase?.status === 'IN_PROGRESS'
                                ? 'bg-purple-100 text-purple-800 border-purple-400' :
                              selectedReservation.caseLine?.guaranteeCase?.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800 border-green-400' :
                                'bg-gray-100 text-gray-800 border-gray-400'
                            }`}
                          >
                            {selectedReservation.caseLine?.guaranteeCase?.status || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <label className="text-xs font-semibold text-emerald-700 uppercase">Case Line Status</label>
                        <div className="mt-2">
                          <Badge 
                            variant="outline"
                            className={`text-sm font-bold px-3 py-1 ${
                              selectedReservation.caseLine?.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
                              selectedReservation.caseLine?.status === 'READY_FOR_REPAIR' 
                                ? 'bg-blue-100 text-blue-800 border-blue-400' :
                              selectedReservation.caseLine?.status === 'IN_PROGRESS'
                                ? 'bg-purple-100 text-purple-800 border-purple-400' :
                              selectedReservation.caseLine?.status === 'COMPLETED' 
                                ? 'bg-green-100 text-green-800 border-green-400' :
                                'bg-gray-100 text-gray-800 border-gray-400'
                            }`}
                          >
                            {selectedReservation.caseLine?.status?.replace(/_/g, ' ') || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                        <label className="text-xs font-semibold text-emerald-700 uppercase">Component Quantity</label>
                        <p className="text-2xl font-bold mt-2 text-emerald-900">{selectedReservation.caseLine?.quantity || 0}</p>
                      </div>
                    </div>

                    {/* Technicians Section */}
                    <div className="border-t-2 border-dashed border-emerald-200 pt-4 mt-4">
                      <h4 className="text-sm font-bold mb-4 text-emerald-900 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Assigned Technicians
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Diagnostic Technician */}
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-blue-500 text-white rounded-full p-2">
                              <User className="h-4 w-4" />
                            </div>
                            <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                              Diagnostic Technician
                            </label>
                          </div>
                          <div className="space-y-2">
                            <p className="text-base font-bold text-blue-900">
                              {selectedReservation.caseLine?.diagnosticTechnician?.name || 'Not Assigned'}
                            </p>
                            {selectedReservation.caseLine?.diagnosticTechnician?.email && (
                              <p className="text-sm text-blue-700 flex items-center gap-2">
                                <span className="text-base">📧</span>
                                {selectedReservation.caseLine.diagnosticTechnician.email}
                              </p>
                            )}
                            {selectedReservation.caseLine?.diagnosticTechnician?.phone && (
                              <p className="text-sm text-blue-700 flex items-center gap-2">
                                <span className="text-base">📞</span>
                                {selectedReservation.caseLine.diagnosticTechnician.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Repair Technician */}
                        <div className="bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-green-500 text-white rounded-full p-2">
                              <User className="h-4 w-4" />
                            </div>
                            <label className="text-xs font-bold text-green-700 uppercase tracking-wide">
                              Repair Technician
                            </label>
                          </div>
                          <div className="space-y-2">
                            <p className="text-base font-bold text-green-900">
                              {selectedReservation.caseLine?.repairTechnician?.name || 'Not Assigned'}
                            </p>
                            {selectedReservation.caseLine?.repairTechnician?.email && (
                              <p className="text-sm text-green-700 flex items-center gap-2">
                                <span className="text-base">📧</span>
                                {selectedReservation.caseLine.repairTechnician.email}
                              </p>
                            )}
                            {selectedReservation.caseLine?.repairTechnician?.phone && (
                              <p className="text-sm text-green-700 flex items-center gap-2">
                                <span className="text-base">📞</span>
                                {selectedReservation.caseLine.repairTechnician.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Picked Up By */}
                    {selectedReservation.pickedUpByTech && (
                      <div className="border-t-2 border-dashed border-emerald-200 pt-4">
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-2 border-amber-300 rounded-lg p-4 shadow-md">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-amber-500 text-white rounded-full p-2">
                              <User className="h-4 w-4" />
                            </div>
                            <label className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                              Component Picked Up By
                            </label>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-sm text-amber-600 uppercase text-xs font-semibold mb-1">Name</p>
                              <p className="text-base font-bold text-amber-900">
                                {selectedReservation.pickedUpByTech.name}
                              </p>
                            </div>
                            {selectedReservation.pickedUpByTech.email && (
                              <div>
                                <p className="text-sm text-amber-600 uppercase text-xs font-semibold mb-1">Email</p>
                                <p className="text-sm text-amber-800">
                                  {selectedReservation.pickedUpByTech.email}
                                </p>
                              </div>
                            )}
                            {selectedReservation.pickedUpByTech.phone && (
                              <div>
                                <p className="text-sm text-amber-600 uppercase text-xs font-semibold mb-1">Phone</p>
                                <p className="text-sm text-amber-800">
                                  {selectedReservation.pickedUpByTech.phone}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Pickup Confirmation Modal */}
        <Dialog open={showPickupModal} onOpenChange={setShowPickupModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Confirm Component Pickup
              </DialogTitle>
              <DialogDescription>
                You are about to pick up {selectedReservationIds.length} component(s)
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 overflow-y-auto flex-1 pr-2">
              {/* Selected Reservations Summary */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-blue-900">Selected Components</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {reservations
                      .filter(r => selectedReservationIds.includes(r.reservationId))
                      .map((reservation, index) => (
                        <div 
                          key={reservation.reservationId} 
                          className="flex items-center justify-between p-3 bg-white rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <code className="text-xs bg-blue-100 text-blue-900 px-2 py-1 rounded font-mono font-semibold">
                                {reservation.component.serialNumber}
                              </code>
                              <p className="text-xs text-muted-foreground mt-1">
                                VIN: {reservation.caseLine.guaranteeCase.vehicleProcessingRecord.vin}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {reservation.status}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Technician Info */}
              {selectedReservationIds.length > 0 && (
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-green-900">Pickup By Technician</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const firstReservation = reservations.find(r => 
                        selectedReservationIds.includes(r.reservationId)
                      );
                      if (!firstReservation) return null;
                      
                      const tech = firstReservation.caseLine?.repairTechnician;
                      if (!tech) {
                        return (
                          <div className="text-sm text-amber-700 p-3 bg-amber-50 rounded border border-amber-200">
                            No technician assigned yet
                          </div>
                        );
                      }
                      
                      return (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                            <User className="h-5 w-5 text-green-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-green-900">{tech.name}</p>
                            {tech.email && <p className="text-xs text-green-700">{tech.email}</p>}
                            {tech.phone && <p className="text-xs text-green-700">{tech.phone}</p>}
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-amber-900">Important</h4>
                    <p className="text-sm text-amber-800 mt-1">
                      By confirming, you acknowledge that the technician is picking up these components.
                      The status will be updated to "PICKED_UP".
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-4 flex-shrink-0 bg-white">
              <Button
                variant="outline"
                onClick={() => setShowPickupModal(false)}
                disabled={isPickingUp}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePickupReservations}
                disabled={isPickingUp}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPickingUp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Picking Up...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Confirm Pickup
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PartsCoordinatorDashboard;
