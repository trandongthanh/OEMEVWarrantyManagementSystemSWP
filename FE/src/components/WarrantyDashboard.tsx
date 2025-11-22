import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import {
		LogOut,Wrench
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

//base URL for API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StockTransferRequest {
  id: string; 
  requestingWarehouseId: string;
  requestedByUserId: string; 
  requestedAt: string;
  approvedByUserId: string | null;
  rejectedByUserId?: string | null;
  cancelledByUserId?: string | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  requester?: {
    userId: string;
    name: string;
    serviceCenterId?: string;
  };
  approver?: {
    userId: string;
    name: string;
    serviceCenterId?: string;
  };
  requestingWarehouse?: {
    warehouseId: string;
    name: string;
    serviceCenterId?: string;
    vehicleCompanyId?: string;
  };
}

interface CaselineInfo {
  caselineId: string;
  diagnosisText: string;
  correctionText: string;
  typeComponent: {
    name: string;
    sku: string;
    category: string;
    description?: string;
    price?: number;
  };
}

interface TypeComponentInfo {
  typeComponentId: string;
  name: string;
  sku: string;
  category: string;
  price?: number;
}

interface StockTransferRequestDetail extends StockTransferRequest {
  items?: Array<{
    id: string;
    requestId?: string;
    typeComponentId?: string;
    quantityRequested: number;
    quantityApproved?: number | null;
    caselineId?: string;
    typeComponent?: TypeComponentInfo; // Thông tin chi tiết component
    caselineInfo?: CaselineInfo; // Thông tin caseline
  }>;
}

// Helper function to format numbers with thousand separators
const formatNumberWithCommas = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const WarrantyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'requests' | 'models'>('requests');
  const [stockTransferRequests, setStockTransferRequests] = useState<StockTransferRequest[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [status, setStatus] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedRequest, setSelectedRequest] = useState<StockTransferRequestDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const { user } = useAuth();
  
  // Vehicle Models states
  const [vehicleModels, setVehicleModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isLoadingComponents, setIsLoadingComponents] = useState<boolean>(false);
  const [modelComponents, setModelComponents] = useState<any[]>([]);
  const [selectedModelFilter, setSelectedModelFilter] = useState<string>('');
  
  // Create Warranty Component states
  const [isCreateComponentDialogOpen, setIsCreateComponentDialogOpen] = useState<boolean>(false);
  const [isCreatingComponent, setIsCreatingComponent] = useState<boolean>(false);
  const [selectedCopyComponent, setSelectedCopyComponent] = useState<string>(''); // Track selected component in dropdown
  const [newComponent, setNewComponent] = useState({
    typeComponentId: '', // For reusing existing component
    sku: '',
    name: '',
    price: '',
    category: 'HIGH_VOLTAGE_BATTERY',
    makeBrand: '',
    durationMonth: '',
    mileageLimit: '',
    quantity: '1'
  });
  
  // Add New Vehicle Model states
  const [isAddModelDialogOpen, setIsAddModelDialogOpen] = useState<boolean>(false);
  const [isAddingModel, setIsAddingModel] = useState<boolean>(false);
  const [newVehicleModel, setNewVehicleModel] = useState({
    vehicleModelName: '',
    yearOfLaunch: '',
    placeOfManufacture: '',
    generalWarrantyDuration: '',
    generalWarrantyMileage: ''
  });
  
  // Caseline Detail Dialog states
  const [isCaselineDetailOpen, setIsCaselineDetailOpen] = useState<boolean>(false);
  const [selectedCaselineDetail, setSelectedCaselineDetail] = useState<any>(null);
  const [isLoadingCaselineDetail, setIsLoadingCaselineDetail] = useState<boolean>(false);
  
  useEffect(() => {
    // Auto-fetch when page changes
    if (user) {
      fetchStockTransferRequests();
    }
  }, [user, page]);

  // Fetch vehicle models when switching to models view
  useEffect(() => {
    if (viewMode === 'models' && vehicleModels.length === 0) {
      fetchVehicleModels();
    }
  }, [viewMode]);

  const fetchVehicleModels = async () => {
    setIsLoadingModels(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login again to continue.',
          variant: 'destructive'
        });
        return [];
      }

      const response = await axios.get(`${API_BASE_URL}/oem-vehicle-models`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.status === 'success' && response.data.data) {
        const models = Array.isArray(response.data.data) ? response.data.data : [];
        setVehicleModels(models);
        return models;
      } else {
        setVehicleModels([]);
        return [];
      }
    } catch (error) {
      toast({
        title: 'Error Loading Vehicle Models',
        description: 'Failed to load vehicle models.',
        variant: 'destructive'
      });
      setVehicleModels([]);
      return [];
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleLoadModels = () => {
    fetchVehicleModels();
  };

  const handleSelectModel = (model: any) => {
    setSelectedModel(model);
    // Components are already in model.typeComponents, no need to fetch
    if (model.typeComponents && Array.isArray(model.typeComponents)) {
      setModelComponents(model.typeComponents);
    } else {
      setModelComponents([]);
    }
  };

  const handleCreateComponentClick = () => {
    // Reset form and dropdown
    setNewComponent({
      typeComponentId: '',
      sku: '',
      name: '',
      price: '',
      category: 'HIGH_VOLTAGE_BATTERY',
      makeBrand: '',
      durationMonth: '',
      mileageLimit: '',
      quantity: '1'
    });
    setSelectedCopyComponent('');
    setIsCreateComponentDialogOpen(true);
  };

  const handleAddModelClick = () => {
    // Reset form
    setNewVehicleModel({
      vehicleModelName: '',
      yearOfLaunch: '',
      placeOfManufacture: '',
      generalWarrantyDuration: '',
      generalWarrantyMileage: ''
    });
    setIsAddModelDialogOpen(true);
  };

  const handleAddModelSubmit = async () => {
    // Validation
    if (!newVehicleModel.vehicleModelName.trim() || !newVehicleModel.yearOfLaunch || 
        !newVehicleModel.placeOfManufacture.trim() || !newVehicleModel.generalWarrantyDuration || 
        !newVehicleModel.generalWarrantyMileage) {
      toast({
        title: 'Field Required!',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    // Validate Year of Launch is not in the future
    const selectedDate = new Date(newVehicleModel.yearOfLaunch);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      toast({
        title: 'Invalid Date',
        description: 'Year of Launch cannot be in the future.',
        variant: 'destructive'
      });
      return;
    }

    setIsAddingModel(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      
      const payload: any = {
        vehicleModelName: newVehicleModel.vehicleModelName.trim(),
        yearOfLaunch: new Date(newVehicleModel.yearOfLaunch).toISOString(),
        placeOfManufacture: newVehicleModel.placeOfManufacture.trim(),
        generalWarrantyDuration: parseInt(newVehicleModel.generalWarrantyDuration),
        generalWarrantyMileage: parseInt(newVehicleModel.generalWarrantyMileage)
      };

      const response = await axios.post(
        `${API_BASE_URL}/oem-vehicle-models`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast({
          title: 'Model Added! ✅',
          description: 'The vehicle model has been added successfully.',
        });
        setIsAddModelDialogOpen(false);
        
        // Refresh vehicle models
        await fetchVehicleModels();
      } else {
        toast({
          title: 'Creation Failed',
          description: response.data.message || 'Failed to add model. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error adding model:', error);
      toast({
        title: 'Error',
        description: axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : 'An error occurred while adding the model.',
        variant: 'destructive'
      });
    } finally {
      setIsAddingModel(false);
    }
  };

  const handleCreateComponentSubmit = async () => {
    if (!selectedModel) {
      toast({
        title: 'No Model Selected',
        description: 'Please select a vehicle model from the dropdown first.',
        variant: 'destructive'
      });
      return;
    }
    
    if (!selectedModel) return;
    
    // Validation - different requirements for reusing vs creating new
    const isReusingComponent = selectedCopyComponent.trim() !== '';
    
    if (isReusingComponent) {
      // Trường hợp 1: Copy component - chỉ cần selectedCopyComponent và 3 field không disable
      if (!selectedCopyComponent || !newComponent.durationMonth || !newComponent.mileageLimit || !newComponent.quantity) {
        toast({
          title: 'Field Required!',
          description: 'Please select a component to copy and fill in warranty duration, mileage limit, and quantity.',
          variant: 'destructive'
        });
        return;
      }
    } else {
      // Trường hợp 2: Tạo mới - cần tất cả các field
      if (!newComponent.sku.trim() || !newComponent.name.trim() || !newComponent.price || 
          !newComponent.durationMonth || !newComponent.mileageLimit || !newComponent.quantity) {
        toast({
          title: 'Field Required!',
          description: 'Please fill in all required fields (SKU, Name, Price, Warranty Duration, Mileage, Quantity).',
          variant: 'destructive'
        });
        return;
      }
    }

    setIsCreatingComponent(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      
      // Build payload based on whether copying or creating new
      let componentData: any;
      
      if (isReusingComponent) {
        // Trường hợp 1: Copy component - parse selectedCopyComponent để lấy typeComponentId từ API data
        const [sourceVehicleModelId, componentIndexStr] = selectedCopyComponent.split('||');
        const componentIndex = parseInt(componentIndexStr);
        
        // Tìm model và component từ vehicleModels (đã có data từ API)
        const sourceModel = vehicleModels.find(m => m.vehicleModelId === sourceVehicleModelId);
        const sourceComponent = sourceModel?.typeComponents?.[componentIndex];
        
        if (!sourceComponent) {
          toast({
            title: 'Error',
            description: 'Could not find the selected component.',
            variant: 'destructive'
          });
          setIsCreatingComponent(false);
          return;
        }
        
        // Lấy typeComponentId từ component object (API đã trả về field này)
        const componentId = sourceComponent.typeComponentId;
        
        if (!componentId) {
          toast({
            title: 'Error',
            description: 'Component ID not found. Please refresh and try again.',
            variant: 'destructive'
          });
          console.error('Component missing typeComponentId:', sourceComponent);
          setIsCreatingComponent(false);
          return;
        }
        
        // Gửi typeComponentId (UUID thuần) về endpoint
        componentData = {
          typeComponentId: componentId,
          durationMonth: parseInt(newComponent.durationMonth),
          mileageLimit: parseInt(newComponent.mileageLimit),
          quantity: parseInt(newComponent.quantity)
        };
      } else {
        // Trường hợp 2: Tạo mới - gửi tất cả fields (KHÔNG có typeComponentId)
        componentData = {
          sku: newComponent.sku.trim(),
          name: newComponent.name.trim(),
          price: parseInt(newComponent.price),
          category: newComponent.category,
          makeBrand: newComponent.makeBrand.trim() || "",
          durationMonth: parseInt(newComponent.durationMonth),
          mileageLimit: parseInt(newComponent.mileageLimit),
          quantity: parseInt(newComponent.quantity)
        };
      }

      const payload = {
        typeComponentWarrantyList: [componentData]
      };

      const response = await axios.post(
        `${API_BASE_URL}/oem-vehicle-models/${selectedModel.vehicleModelId}/warranty-components`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast({
          title: 'Component Created! ✅',
          description: 'The warranty component has been added successfully.',
        });
        setIsCreateComponentDialogOpen(false);
        
        // Refresh vehicle models to get updated components
        const updatedModels = await fetchVehicleModels();
        
        // If the created component is for the currently selected model, update its components
        if (selectedModel && updatedModels.length > 0) {
          const updatedModel = updatedModels.find(m => m.vehicleModelId === selectedModel.vehicleModelId);
          if (updatedModel) {
            setSelectedModel(updatedModel);
            if (updatedModel.typeComponents && Array.isArray(updatedModel.typeComponents)) {
              setModelComponents(updatedModel.typeComponents);
            }
          }
        }
      } else {
        toast({
          title: 'Creation Failed',
          description: response.data.message || 'Failed to create component. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error creating component:', error);
      toast({
        title: 'Invalid vehicle information!',
        description: "Please enter valid information for the new component.",
        variant: 'destructive'
      });
    } finally {
      setIsCreatingComponent(false);
    }
  };

  const fetchStockTransferRequests = async () => {
    setIsLoadingTransfers(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please login again to continue.',
          variant: 'destructive'
        });
        navigate('/login');
        return;
      }
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: status
      });
      
      const response = await axios.get(`${API_BASE_URL}/stock-transfer-requests?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data;
      
      // Handle API response structure: { status: "success", data: { stockTransferRequests: [...] } }
      if (data.status === 'success' && data.data?.stockTransferRequests) {
        let requests = data.data.stockTransferRequests;
        
        // If status filter is empty (All Status), sort with PENDING_APPROVAL first
        if (!status || status === '') {
          requests = requests.sort((a: StockTransferRequest, b: StockTransferRequest) => {
            // PENDING_APPROVAL should come first
            if (a.status === 'PENDING_APPROVAL' && b.status !== 'PENDING_APPROVAL') return -1;
            if (a.status !== 'PENDING_APPROVAL' && b.status === 'PENDING_APPROVAL') return 1;
            // Otherwise maintain original order
            return 0;
          });
        }
        
        setStockTransferRequests(requests);
        setTotalPages(data.data.totalPages || 1);
      } else {
        setStockTransferRequests([]);
        setTotalPages(1);
      }
    } catch (error) {
      toast({
        title: 'Error Loading Data',
        description: error instanceof Error ? error.message : 'Failed to load stock transfer requests.',
        variant: 'destructive'
      });
      setStockTransferRequests([]);
      setTotalPages(1);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  const handleLoadRequests = () => {
    fetchStockTransferRequests();
  };

  // Fetch caseline info for a single item
  const fetchCaselineInfo = async (caselineId: string, token: string): Promise<CaselineInfo | null> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/case-lines/${caselineId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data;
      // Extract caseline info from API response (backend returns 'caseLine' not 'caseline')
      if (data.status === 'success' && data.data?.caseLine) {
        const caseline = data.data.caseLine;
        
        return {
          caselineId: caseline.id,
          diagnosisText: caseline.diagnosisText || 'N/A',
          correctionText: caseline.correctionText || 'N/A',
          typeComponent: {
            name: caseline.typeComponent?.name || 'N/A',
            sku: caseline.typeComponent?.sku || 'N/A',
            category: caseline.typeComponent?.category || 'N/A',
            description: caseline.typeComponent?.description,
            price: caseline.typeComponent?.price
          }
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Fetch full caseline detail for detail dialog
  const fetchCaselineDetail = async (caselineId: string) => {
    setIsLoadingCaselineDetail(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      const response = await axios.get(`${API_BASE_URL}/case-lines/${caselineId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data;
      if (data.status === 'success' && data.data?.caseLine) {
        setSelectedCaselineDetail(data.data.caseLine);
        setIsCaselineDetailOpen(true);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load caseline details.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load caseline details.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingCaselineDetail(false);
    }
  };

  const fetchRequestDetail = async (requestId: string) => {
    setIsLoadingDetail(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      const response = await axios.get(`${API_BASE_URL}/stock-transfer-requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = response.data;
      
      // Handle API response structure: { status: "success", data: { stockTransferRequest: {...} } }
      if (data.status === 'success' && data.data?.stockTransferRequest) {
        const requestDetail = data.data.stockTransferRequest;

        
        // Fetch caseline info for each item that has a caselineId
        if (requestDetail.items && requestDetail.items.length > 0) {
          const itemsWithCaselineInfo = await Promise.all(
            requestDetail.items.map(async (item: any) => {
              if (item.caselineId) {
                const caselineInfo = await fetchCaselineInfo(item.caselineId, token || '');
                return { ...item, caselineInfo };
              }
              return item;
            })
          );
          
          requestDetail.items = itemsWithCaselineInfo;
        }
        
        setSelectedRequest(requestDetail);
        setIsDetailDialogOpen(true);
      } else {
        setSelectedRequest(null);
      }
    } catch (error) {
      toast({
        title: 'Error Loading Details',
        description: error instanceof Error ? error.message : 'Failed to load request details.',
        variant: 'destructive'
      });
      setSelectedRequest(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleViewDetails = (requestId: string) => {
    fetchRequestDetail(requestId);
  };

  const handleApproveClick = () => {
    setIsApproveDialogOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;
    
    setIsApproving(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      const response = await axios.patch(
        `${API_BASE_URL}/stock-transfer-requests/${selectedRequest.id}/approve`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        toast({
          title: 'Request Approved! ✅',
          description: 'The stock transfer request has been approved successfully.',
        });
        setIsApproveDialogOpen(false);
        setIsDetailDialogOpen(false);
        fetchStockTransferRequests();
      } else {
        toast({
          title: 'Approval Failed',
          description: response.data.message || 'Failed to approve request. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Something Went Wrong!',
        description: 'An error occurred while approving the request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'completed':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      
      {/* Your Content/Components */}
      <div className="relative z-10 container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div  className=" flex items-center justify-between " >
          <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Wrench className="h-6 w-6 text-primary-foreground" />
              </div>
          <div>
          <h1 className="text-3xl font-bold text-gray-900">Warranty Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome, {user?.role === 'emv_staff' ? 'EMV Staff' : 'Staff'}
</p>    
        </div>
         
        </div>
        <Button
								variant="ghost"
								size="sm"
								className="text-black hover:text-black"
								style={{ backgroundColor: '#7476F2' }}
								onClick={() => {
									// Clear any stored auth data and navigate to login
									localStorage.clear();
									sessionStorage.clear();
									navigate("/login");
								}}
							>
								<LogOut className="h-4 w-4 mr-2" />
								Log Out
							</Button>
      </div>

      {/* Navigation Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'requests' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('requests')}
              className={viewMode === 'requests' ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-blue-50 border-blue-300'}
            >
              📦 Stock Transfer Requests
            </Button>
            <Button
              variant={viewMode === 'models' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('models')}
              className={viewMode === 'models' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-purple-50 border-purple-300'}
            >
              🚗 Vehicle Models
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stock Transfer Requests - Only show when viewMode is 'requests' */}
      {viewMode === 'requests' && (
      <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stock Transfer Requests</CardTitle>
                  <CardDescription>List of stock transfer requests in the system</CardDescription>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Page</label>
                  <input
                    type="number"
                    min="1"
                    value={page}
                    onChange={(e) => setPage(Math.max(1, parseInt(e.target.value) || 1))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLoadRequests();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Page number"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={limit}
                    onChange={(e) => setLimit(Math.max(1, Math.min(100, parseInt(e.target.value) || 10)))}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleLoadRequests();
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Items per page"
                  />
                </div>
                
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RECEIVED">Received</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                
                <Button 
                  onClick={handleLoadRequests}
                  disabled={isLoadingTransfers}
                  className="px-6"
                >
                  {isLoadingTransfers ? '🔄 Loading...' : 'Load'}
                </Button>
              </div>
              
              {/* Page Info */}
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages} • Showing up to {limit} items
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingTransfers ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <div className="text-gray-500 font-medium">Loading data...</div>
                </div>
              </div>
            ) : stockTransferRequests.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-6xl mb-4">📦</div>
                  <div className="text-gray-500 font-medium text-lg mb-2">No stock transfer requests found</div>
                  <div className="text-gray-400 text-sm">Try adjusting your filters or create a new request</div>
                </div>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Requesting Warehouse</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Request Time</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockTransferRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">#{request.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">🏢</span>
                        {request.requestingWarehouse?.name || `Warehouse #${request.requestingWarehouseId.substring(0, 8)}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600">👤</span>
                        {request.requester?.name || `User #${request.requestedByUserId.substring(0, 8)}`}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(request.requestedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.approvedByUserId ? (
                        <div className="flex items-center gap-2">
                          <span className="text-green-600">✓</span>
                          {request.approver?.name || `User #${request.approvedByUserId.substring(0, 8)}`}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Not approved</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(request.status)}>
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(request.id)}
                        disabled={isLoadingDetail}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          
          {/* Pagination Controls */}
          {!isLoadingTransfers && stockTransferRequests.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || isLoadingTransfers}
              >
                ← Previous
              </Button>
              
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || isLoadingTransfers}
              >
                Next →
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Vehicle Models View */}
      {viewMode === 'models' && (
        <div className="space-y-6">
          {/* Vehicle Model Selection */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vehicle Models</CardTitle>
                    <CardDescription>Select a vehicle model to view and manage its warranty components</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAddModelClick}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add New Vehicle Model
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleCreateComponentClick}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Add Warranty Component
                    </Button>
                  </div>
                </div>
                
                {/* Filters */}
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Vehicle Model</label>
                    <select
                      value={selectedModelFilter}
                      onChange={(e) => setSelectedModelFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Models</option>
                      <option value="VF e34">VF e34</option>
                      <option value="VF 8">VF 8</option>
                      <option value="VF 9">VF 9</option>
                    </select>
                  </div>
                  
                  <Button 
                    onClick={handleLoadModels}
                    disabled={isLoadingModels}
                    className="px-6"
                  >
                    {isLoadingModels ? '🔄 Loading...' : 'Load'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingModels ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⏳</div>
                    <div className="text-gray-500 font-medium">Loading models...</div>
                  </div>
                </div>
              ) : vehicleModels.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🚗</div>
                    <div className="text-gray-500 font-medium text-lg mb-2">No vehicle models found</div>
                    <div className="text-gray-400 text-sm">No models available in the system</div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {vehicleModels
                    .filter(model => !selectedModelFilter || model.vehicleModelName === selectedModelFilter)
                    .map((model) => (
                    <Card
                      key={model.vehicleModelId}
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedModel?.vehicleModelId === model.vehicleModelId
                          ? 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectModel(model)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="text-3xl">🚗</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{model.vehicleModelName}</h3>
                            <p className="text-sm text-gray-500">Year: {new Date(model.yearOfLaunch).getFullYear()}</p>
                          </div>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">
                            <span className="font-medium">Warranty:</span> {model.generalWarrantyDuration} months / {formatNumberWithCommas(model.generalWarrantyMileage)} km
                          </p>
                          <p className="text-gray-600">
                            <span className="font-medium">Components:</span> {model.typeComponents?.length || 0}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Model Components */}
          {selectedModel && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Components for {selectedModel.vehicleModelName}</CardTitle>
                    <CardDescription>
                      Warranty: {selectedModel.generalWarrantyDuration} months / {formatNumberWithCommas(selectedModel.generalWarrantyMileage)} km
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedModel(null);
                      setModelComponents([]);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingComponents ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="text-4xl mb-2">⏳</div>
                      <div className="text-gray-500 font-medium">Loading components...</div>
                    </div>
                  </div>
                ) : modelComponents.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📦</div>
                      <div className="text-gray-500 font-medium text-lg mb-2">No components found</div>
                      <div className="text-gray-400 text-sm">This model has no components configured</div>
                    </div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component Name</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Warranty Duration</TableHead>
                        <TableHead>Warranty Mileage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modelComponents.map((component) => (
                        <TableRow key={component.typeComponentId}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-blue-600">🔧</span>
                              {component.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {component.sku}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{component.category}</Badge>
                          </TableCell>
                          <TableCell>
                            {component.price ? (
                              <span className="font-semibold text-green-600">
                                {formatNumberWithCommas(component.price)} VND
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {component.WarrantyComponent?.durationMonth ? (
                              <span className="text-blue-600 font-medium">
                                {component.WarrantyComponent.durationMonth} months
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {component.WarrantyComponent?.mileageLimit ? (
                              <span className="text-blue-600 font-medium">
                                {formatNumberWithCommas(component.WarrantyComponent.mileageLimit)} km
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      {isDetailDialogOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Stock Transfer Request Details</h2>
                <p className="text-sm text-gray-500 mt-1">Request ID: #{selectedRequest.id}</p>
              </div>
              <button
                onClick={() => setIsDetailDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">Status:</span>
                <Badge variant={getStatusBadgeVariant(selectedRequest.status)} className="text-base px-4 py-1">
                  {selectedRequest.status}
                </Badge>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Request Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Request Time:</span>
                      <p className="font-medium">{formatDateTime(selectedRequest.requestedAt)}</p>
                    </div>
                    {selectedRequest.requestingWarehouse && (
                      <div>
                        <span className="text-xs text-gray-500">Requesting Warehouse:</span>
                        <p className="font-medium">🏢 {selectedRequest.requestingWarehouse.name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedRequest.requester && (
                      <div>
                        <span className="text-xs text-gray-500">Requested By:</span>
                        <p className="font-medium">👤 {selectedRequest.requester.name}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500">Approved By:</span>
                      {selectedRequest.approvedByUserId ? (
                        <p className="font-medium text-600">👤 {selectedRequest.approver?.name || `User #${selectedRequest.approvedByUserId.substring(0, 8)}...`}</p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">Pending approval</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Items Grid */}
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Requested Items</CardTitle>
                    <CardDescription>Components and quantities for warranty service</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedRequest.items.map((item, index) => (
                        <div key={item.id || `item-${index}`} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow bg-white">
                          {/* Request ID - Full Display */}
                          <div className="pb-2 border-b">
                            <span className="text-xs text-gray-500 font-medium">Request ID:</span>
                            <p className="text-xs font-mono text-gray-900 mt-1 bg-gray-50 px-2 py-1 rounded">
                              {item.id || `Item ${index + 1}`}
                            </p>
                          </div>

                          {/* Type Component Section */}
                          {item.caselineInfo ? (
                            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                              <h4 className="text-sm font-semibold text-blue-800 mb-2">📦 Type Component</h4>
                              
                              <div>
                                <span className="text-xs text-gray-600">Name:</span>
                                <p className="font-medium text-gray-900">{item.caselineInfo.typeComponent.name}</p>
                              </div>
                              
                              <div>
                                <span className="text-xs text-gray-600">SKU:</span>
                                <p className="font-medium text-gray-900">{item.caselineInfo.typeComponent.sku}</p>
                              </div>
                              
                              {item.caselineInfo.typeComponent.price && (
                                <div>
                                  <span className="text-xs text-gray-600">Price:</span>
                                  <p className="font-medium text-green-600">{formatNumberWithCommas(item.caselineInfo.typeComponent.price)} VND</p>
                                </div>
                              )}
                              
                              <div className="pt-2 border-t border-blue-200">
                                <span className="text-xs text-gray-600">Correction:</span>
                                <p className="text-sm text-gray-700 mt-1">{item.caselineInfo.correctionText}</p>
                              </div>
                              
                            </div>
                          ) : (
                            <div className="bg-gray-100 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 italic">Component information not available</p>
                            </div>
                          )}

                          {/* Quantity Requested */}
                          <div className="pt-2">
                            <span className="text-xs text-gray-500 font-medium">Quantity Requested:</span>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="font-bold text-blue-600 text-lg">{item.quantityRequested}</span>
                              {item.quantityApproved !== null && item.quantityApproved !== undefined && (
                                <span className="text-xs text-green-600 font-medium">✓ Approved: {item.quantityApproved}</span>
                              )}
                            </div>
                          </div>

                          {/* Caseline ID - Separate Row */}
                          <div className="pt-2 border-t">
                            <span className="text-xs text-gray-500 font-medium">Caseline ID:</span>
                            {item.caselineId ? (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded flex-1">
                                  {item.caselineId}
                                </span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs"
                                  onClick={() => fetchCaselineDetail(item.caselineId!)}
                                  disabled={isLoadingCaselineDetail}
                                >
                                  {isLoadingCaselineDetail ? 'Loading...' : 'View Detail'}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic mt-1 block">N/A</span>
                            )}
                          </div>
                          
                          {/* Total Price - Below Quantity */}
                          {item.caselineInfo?.typeComponent?.price && item.quantityRequested && (
                            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                              <span className="text-sm text-gray-600 font-medium">💰 Total Price:</span>
                              <p className="font-bold text-green-600 text-2xl mt-1">
                                {formatNumberWithCommas(item.caselineInfo.typeComponent.price * item.quantityRequested)} VND
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                ({item.quantityRequested} × {formatNumberWithCommas(item.caselineInfo.typeComponent.price)}) VND
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Close
              </Button>
              
              {/* Only show action buttons if status is PENDING_APPROVAL */}
              {selectedRequest.status === 'PENDING_APPROVAL' && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleApproveClick}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    ✓ Approve
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog */}
      {isApproveDialogOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Dialog Header */}
            <div className="bg-green-50 border-b border-green-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">✅</span>
                <div>
                  <h2 className="text-xl font-bold text-green-900">Approve Request</h2>
                  <p className="text-sm text-green-600 mt-0.5">Confirm approval of this stock transfer</p>
                </div>
              </div>
              <button
                onClick={() => setIsApproveDialogOpen(false)}
                className="text-green-400 hover:text-green-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Request ID: <span className="font-mono font-semibold">#{selectedRequest.id.substring(0, 8)}...</span>
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  Requested by: <span className="font-semibold">{selectedRequest.requester?.name || 'Unknown'}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Warehouse: <span className="font-semibold">{selectedRequest.requestingWarehouse?.name || 'Unknown'}</span>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  📦 Items in this request:
                </p>
                {selectedRequest.items && selectedRequest.items.length > 0 ? (
                  <ul className="text-sm text-blue-700 space-y-1">
                    {selectedRequest.items.map((item, index) => (
                      <li key={item.id}>
                        {index + 1}. {item.caselineInfo?.typeComponent?.name || item.typeComponent?.name || 'Component'} 
                        <span className="font-semibold"> x{item.quantityRequested}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-blue-700">No items found</p>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Once approved, the stock transfer will be processed. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <Button
                variant="outline"
                onClick={() => setIsApproveDialogOpen(false)}
                disabled={isApproving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApproveSubmit}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? '🔄 Approving...' : '✓ Confirm Approve'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Warranty Component Dialog */}
      {isCreateComponentDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl"></span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add Warranty Component</h2>
                  <p className="text-sm text-gray-600 mt-0.5">Select a vehicle model to add warranty component</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateComponentDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-4">
              {/* Vehicle Model Selection */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Vehicle Model <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedModel?.vehicleModelId || ''}
                  onChange={(e) => {
                    const model = vehicleModels.find(m => m.vehicleModelId === e.target.value);
                    setSelectedModel(model || null);
                    setSelectedCopyComponent(''); // Reset copy dropdown when model changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">-- Select Vehicle Model --</option>
                  {vehicleModels.map((model) => (
                    <option key={model.vehicleModelId} value={model.vehicleModelId}>
                      {model.vehicleModelName} (Year: {new Date(model.yearOfLaunch).getFullYear()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Copy from Existing Component */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Copy from Existing Component (Optional)
                </label>
                <select
                  value={selectedCopyComponent}
                  onChange={(e) => {
                    const selectedValue = e.target.value;
                    setSelectedCopyComponent(selectedValue);
                    
                    if (!selectedValue) {
                      // Reset form when deselecting copy option
                      setNewComponent({
                        typeComponentId: '',
                        sku: '',
                        name: '',
                        price: '',
                        category: 'HIGH_VOLTAGE_BATTERY',
                        makeBrand: '',
                        durationMonth: '',
                        mileageLimit: '',
                        quantity: '1'
                      });
                      return;
                    }
                    
                    // Parse the value as "vehicleModelId-componentIndex"
                    const [vehicleModelId, componentIndexStr] = selectedValue.split('||');
                    const componentIndex = parseInt(componentIndexStr);
                    
                    // Find model by ID
                    const model = vehicleModels.find(m => m.vehicleModelId === vehicleModelId);
                    
                    if (model && componentIndex >= 0) {
                      const foundComponent = model.typeComponents?.[componentIndex];
                      
                      if (foundComponent) {
                        // Pre-fill form with component data (typeComponentId stays empty, we'll use selectedCopyComponent)
                        const newData = {
                          typeComponentId: '', // Keep empty, will use selectedCopyComponent when submitting
                          sku: foundComponent.sku || '',
                          name: foundComponent.name || '',
                          price: foundComponent.price?.toString() || '',
                          category: foundComponent.category || 'HIGH_VOLTAGE_BATTERY',
                          makeBrand: foundComponent.makeBrand || '',
                          durationMonth: foundComponent.WarrantyComponent?.durationMonth?.toString() || '',
                          mileageLimit: foundComponent.WarrantyComponent?.mileageLimit?.toString() || '',
                          quantity: '1'
                        };

                        setNewComponent(newData);
                        
                        toast({
                          title: 'Component Copied! 📋',
                          description: `Filled fields with data from "${foundComponent.name}" (${model.vehicleModelName})`,
                        });
                      } else {
                        toast({
                          title: 'Component Not Found',
                          description: 'Could not find the selected component.',
                          variant: 'destructive'
                        });
                      }
                    }
                  }}
                  disabled={!selectedModel}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                >
                  <option value="">
                    {selectedModel ? '-- Select Component to Copy --' : '-- Please select a vehicle model first --'}
                  </option>
                  {selectedModel && vehicleModels
                    .filter(model => 
                      model.typeComponents && 
                      model.typeComponents.length > 0 &&
                      model.vehicleModelId !== selectedModel.vehicleModelId
                    )
                    .map((model) => {
                      // Lấy danh sách typeComponentId đã có trong selectedModel
                      const existingComponentIds = selectedModel.typeComponents?.map(c => c.typeComponentId) || [];
                      
                      // Lọc ra những component chưa tồn tại trong selectedModel
                      const availableComponents = model.typeComponents.filter(component => 
                        !existingComponentIds.includes(component.typeComponentId)
                      );
                      
                      // Nếu không còn component nào available thì không hiển thị optgroup
                      if (availableComponents.length === 0) return null;
                      
                      return (
                        <optgroup key={model.vehicleModelId} label={`${model.vehicleModelName} Components`}>
                          {availableComponents.map((component, componentIndex) => {
                            // Tìm index thực của component trong mảng gốc
                            const originalIndex = model.typeComponents.indexOf(component);
                            return (
                              <option 
                                key={`${model.vehicleModelId}-${originalIndex}`} 
                                value={`${model.vehicleModelId}||${originalIndex}`}
                              >
                                {component.name} ({component.sku})
                              </option>
                            );
                          })}
                        </optgroup>
                      );
                    })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  💡 {selectedModel 
                    ? 'Select a component from OTHER vehicles to pre-fill the form. You can then adjust the warranty policy.' 
                    : 'Please select a vehicle model first to enable this option.'}
                </p>
              </div>

              {/* SKU */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  SKU {!selectedCopyComponent && <span className="text-red-500">*</span>}
                  {selectedCopyComponent && <span className="text-blue-500 text-xs ml-2">(Read-only - Reusing Component)</span>}
                </label>
                <input
                  type="text"
                  value={newComponent.sku}
                  onChange={(e) => setNewComponent({ ...newComponent, sku: e.target.value })}
                  placeholder="e.g., SUSP-AIR-ADAPTIVE"
                  disabled={!!selectedCopyComponent}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Component Name */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Component Name {!selectedCopyComponent && <span className="text-red-500">*</span>}
                  {selectedCopyComponent && <span className="text-blue-500 text-xs ml-2">(Read-only - Reusing Component)</span>}
                </label>
                <input
                  type="text"
                  value={newComponent.name}
                  onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                  placeholder="e.g., Adaptive Air Suspension System"
                  disabled={!!selectedCopyComponent}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Price and Category Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Price (VND) {!selectedCopyComponent && <span className="text-red-500">*</span>}
                    {selectedCopyComponent && <span className="text-blue-500 text-xs ml-2">(Read-only)</span>}
                  </label>
                  <input
                    type="number"
                    value={newComponent.price}
                    onChange={(e) => setNewComponent({ ...newComponent, price: e.target.value })}
                    placeholder="e.g., 82000000"
                    disabled={!!selectedCopyComponent}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Category {!selectedCopyComponent && <span className="text-red-500">*</span>}
                    {selectedCopyComponent && <span className="text-blue-500 text-xs ml-2">(Read-only)</span>}
                  </label>
                  <select
                    value={newComponent.category}
                    onChange={(e) => setNewComponent({ ...newComponent, category: e.target.value })}
                    disabled={!!selectedCopyComponent}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="HIGH_VOLTAGE_BATTERY">HIGH_VOLTAGE_BATTERY</option>
                    <option value="CHARGING_SYSTEM">CHARGING_SYSTEM</option>
                    <option value="POWERTRAIN">POWERTRAIN</option>
                    <option value="SUSPENSION_STEERING">SUSPENSION_STEERING</option>
                    <option value="HVAC">HVAC</option>
                    <option value="INFOTAINMENT_ADAS">INFOTAINMENT_ADAS</option>
                    <option value="BODY_CHASSIS">BODY_CHASSIS</option>
                  </select>
                </div>
              </div>

              {/* Make Brand */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Make Brand {!selectedCopyComponent && <span className="text-red-500">*</span>}
                  {selectedCopyComponent && <span className="text-blue-500 text-xs ml-2">(Read-only)</span>}
                </label>
                <input
                  type="text"
                  value={newComponent.makeBrand}
                  onChange={(e) => setNewComponent({ ...newComponent, makeBrand: e.target.value })}
                  placeholder="e.g., China, Germany, Japan"
                  disabled={!!selectedCopyComponent}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Warranty Duration and Mileage Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Warranty Duration (months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newComponent.durationMonth}
                    onChange={(e) => setNewComponent({ ...newComponent, durationMonth: e.target.value })}
                    placeholder="e.g., 72"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    Warranty Mileage (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newComponent.mileageLimit}
                    onChange={(e) => setNewComponent({ ...newComponent, mileageLimit: e.target.value })}
                    placeholder="e.g., 150000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newComponent.quantity}
                  onChange={(e) => setNewComponent({ ...newComponent, quantity: e.target.value })}
                  placeholder="e.g., 1"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <Button
                variant="outline"
                onClick={() => setIsCreateComponentDialogOpen(false)}
                disabled={isCreatingComponent}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateComponentSubmit}
                disabled={isCreatingComponent}
                className="bg-green-600 hover:bg-green-700"
              >
                {isCreatingComponent ? '🔄 Creating...' : '✓ Create Component'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Vehicle Model Dialog */}
      {isAddModelDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🚗</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add New Vehicle Model</h2>
                  <p className="text-sm text-gray-600 mt-0.5">Create a new vehicle model with warranty information</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModelDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-4">
              {/* Vehicle Model Name */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Vehicle Model Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newVehicleModel.vehicleModelName}
                  onChange={(e) => setNewVehicleModel({ ...newVehicleModel, vehicleModelName: e.target.value })}
                  placeholder="e.g., VF 8, VF 9, VF e34"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Year of Launch */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Year of Launch <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newVehicleModel.yearOfLaunch}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewVehicleModel({ ...newVehicleModel, yearOfLaunch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Place of Manufacture */}
              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Place of Manufacture <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newVehicleModel.placeOfManufacture}
                  onChange={(e) => setNewVehicleModel({ ...newVehicleModel, placeOfManufacture: e.target.value })}
                  placeholder="e.g., Vietnam, China, USA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* General Warranty Duration and Mileage Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    General Warranty Duration (months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newVehicleModel.generalWarrantyDuration}
                    onChange={(e) => setNewVehicleModel({ ...newVehicleModel, generalWarrantyDuration: e.target.value })}
                    placeholder="e.g., 120"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-900 mb-2 block">
                    General Warranty Mileage (km) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={newVehicleModel.generalWarrantyMileage}
                    onChange={(e) => setNewVehicleModel({ ...newVehicleModel, generalWarrantyMileage: e.target.value })}
                    placeholder="e.g., 200000"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <Button
                variant="outline"
                onClick={() => setIsAddModelDialogOpen(false)}
                disabled={isAddingModel}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddModelSubmit}
                disabled={isAddingModel}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAddingModel ? '🔄 Adding...' : '✓ Add Model'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Caseline Detail Dialog */}
      {isCaselineDetailOpen && selectedCaselineDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-xl">📋</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Case Line Details</h2>
                  <p className="text-sm text-gray-500">Complete information about this case line</p>
                </div>
              </div>
              <button
                onClick={() => setIsCaselineDetailOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Case Line Information Card */}
              <Card className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">📋</span>
                    <CardTitle className="text-base font-semibold">Case Line Information</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Case Line ID</span>
                      <p className="text-sm text-gray-900 mt-1 font-mono">
                        {selectedCaselineDetail.id}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Status</span>
                      <div className="mt-1">
                        <Badge 
                          className={`${
                            selectedCaselineDetail.status === 'COMPLETED' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : selectedCaselineDetail.status === 'APPROVED'
                              ? 'bg-blue-500 hover:bg-blue-600'
                              : 'bg-gray-500 hover:bg-gray-600'
                          } text-white`}
                        >
                          {selectedCaselineDetail.status || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mt-4">
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Warranty Status</span>
                      <div className="mt-1">
                        <Badge 
                          className={`${
                            selectedCaselineDetail.warrantyStatus === 'ELIGIBLE' 
                              ? 'bg-blue-500 hover:bg-blue-600' 
                              : 'bg-gray-500 hover:bg-gray-600'
                          } text-white`}
                        >
                          {selectedCaselineDetail.warrantyStatus || 'N/A'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Quantity</span>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {selectedCaselineDetail.quantity || 1}
                      </p>
                    </div>
                  </div>

                  {/* Solution */}
                  <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm font-semibold text-green-800">Solution</span>
                    </div>
                    <p className="text-sm text-gray-900">
                      {selectedCaselineDetail.correctionText || 'No solution provided'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Component Information Card */}
              {selectedCaselineDetail.typeComponent && (
                <Card className="border border-gray-200">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">📦</span>
                      <CardTitle className="text-base font-semibold">Component Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <span className="text-xs text-gray-500 font-medium">Component Name</span>
                        <p className="text-sm text-gray-900 mt-1 font-semibold">
                          {selectedCaselineDetail.typeComponent.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 font-medium">SKU</span>
                        <p className="text-sm text-gray-900 mt-1 font-mono">
                          {selectedCaselineDetail.typeComponent.sku}
                        </p>
                      </div>
                    </div>

                    {selectedCaselineDetail.typeComponent.price && (
                      <div className="mt-4">
                        <span className="text-xs text-gray-500 font-medium">Price</span>
                        <p className="text-sm text-gray-900 mt-1 font-semibold">
                          {formatNumberWithCommas(selectedCaselineDetail.typeComponent.price)} đ
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Guarantee Case & Vehicle Information Card */}
              {(selectedCaselineDetail.guaranteeCase || selectedCaselineDetail.vehicle) && (
                <Card className="border border-gray-200">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">🚗</span>
                      <CardTitle className="text-base font-semibold">Guarantee Case & Vehicle Information</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {selectedCaselineDetail.guaranteeCase && (
                      <>
                        <div>
                          <span className="text-xs text-gray-500 font-medium">Guarantee Case ID</span>
                          <p className="text-sm text-gray-900 mt-1 font-mono">
                            {selectedCaselineDetail.guaranteeCase.guaranteeCaseId || selectedCaselineDetail.guaranteeCaseId}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 font-medium">Content</span>
                          <p className="text-sm text-gray-900 mt-1 bg-blue-50 p-3 rounded">
                            {selectedCaselineDetail.guaranteeCase.contentGuarantee || selectedCaselineDetail.diagnosisText || 'N/A'}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Vehicle Details */}
                    {selectedCaselineDetail.vehicle && (
                      <div className="pt-4 border-t">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Vehicle Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-xs text-gray-500 font-medium">VIN</span>
                            <p className="text-sm text-gray-900 mt-1 font-mono">
                              {selectedCaselineDetail.vehicle.vin}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 font-medium">Processing Record ID</span>
                            <p className="text-sm text-gray-900 mt-1 font-mono">
                              {selectedCaselineDetail.vehicleProcessingRecordId || 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Assigned Technicians Card */}
              {(selectedCaselineDetail.diagnosticTechnician || selectedCaselineDetail.repairTechnician) && (
                <Card className="border border-gray-200">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">👥</span>
                      <CardTitle className="text-base font-semibold">Assigned Technicians</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedCaselineDetail.diagnosticTechnician && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2">Diagnostic Technician</h4>
                          <p className="text-gray-900 font-medium">
                            {selectedCaselineDetail.diagnosticTechnician.name || selectedCaselineDetail.diagnosticTechnician.fullName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            ID: {selectedCaselineDetail.diagnosticTechnician.userId || selectedCaselineDetail.diagnosticTechnicianId}
                          </p>
                        </div>
                      )}
                      {selectedCaselineDetail.repairTechnician && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <h4 className="text-sm font-semibold text-purple-900 mb-2">Repair Technician</h4>
                          <p className="text-gray-900 font-medium">
                            {selectedCaselineDetail.repairTechnician.name || selectedCaselineDetail.repairTechnician.fullName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            ID: {selectedCaselineDetail.repairTechnician.userId || selectedCaselineDetail.repairTechnicianId}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Component Reservations Card */}
              {selectedCaselineDetail.componentReservations && selectedCaselineDetail.componentReservations.length > 0 && (
                <Card className="border border-gray-200">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center gap-2">
                      <span className="text-blue-600">🔧</span>
                      <CardTitle className="text-base font-semibold">Component Reservations ({selectedCaselineDetail.componentReservations.length})</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Reservation ID</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Serial Number</th>
                            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600">Component Status</th>
                            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-600">Reservation Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCaselineDetail.componentReservations.map((reservation: any, index: number) => (
                            <tr key={reservation.componentReservationId || index} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-3 font-mono text-xs">{reservation.componentReservationId}</td>
                              <td className="py-3 px-3 font-mono text-xs">{reservation.component?.serialNumber || 'N/A'}</td>
                              <td className="py-3 px-3 text-center">
                                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                                  {reservation.component?.status || 'N/A'}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                                  {reservation.status || 'N/A'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Timestamps Card */}
              <Card className="border border-gray-200">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600">🕐</span>
                    <CardTitle className="text-base font-semibold">Timestamps</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {selectedCaselineDetail.updatedAt && (
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Last Updated At</span>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDateTime(selectedCaselineDetail.updatedAt)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end rounded-b-lg">
              <Button
                variant="outline"
                onClick={() => setIsCaselineDetailOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default WarrantyDashboard;