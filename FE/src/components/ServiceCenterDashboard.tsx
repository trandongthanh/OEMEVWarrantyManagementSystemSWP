import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/utils/permissions";
import { API_BASE_URL } from "@/config/api";
import {
  Car,
  User,
  Wrench,
  FileText,
  Search,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Calendar,
  Users,
  LogOut,
  Save,
  MapPin,
  DollarSign,
  Tag,
  Package,
  BoxIcon as Box,
  Edit,
  Trash
} from "lucide-react";

interface VehicleResult {
  vin: string;
  licensePlate?: string;
  licenseplate?: string;
  purchaseDate?: string;
  purchasedate?: string;
  dateOfManufacture?: string;
  dateofmanufacture?: string;
  placeOfManufacture?: string;
  placeofmanufacture?: string;
  owner?: {
    id: string;
    fullName?: string;
    fullname?: string;
    phone: string;
    email: string;
    address: string;
  };
}

interface Claim {
  id: string;
  vin: string;
  customer: string;
  issue: string;
  technician: string;
  date: string;
  status: string;
}

const ServiceCenterDashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showNotFoundToast, setShowNotFoundToast] = useState(false);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [showRegisterVehicle, setShowRegisterVehicle] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAttachParts, setShowAttachParts] = useState(false);
  const [showClaimDetails, setShowClaimDetails] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string>('');
  const [selectedClaimStatus, setSelectedClaimStatus] = useState<string>('');
  const [ownerForm, setOwnerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  });
  const [customerSearchPhone, setCustomerSearchPhone] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [hasSearchedCustomer, setHasSearchedCustomer] = useState(false);
  const { user, logout } = useAuth();

  // Helper function to handle phone number input (numbers only)
  const handlePhoneChange = (value: string, setter: (value: string) => void) => {
    // Only allow numbers and remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  // Helper function to format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "None";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return "None";
    }
  };

const displayValue = (value: string | null | undefined) => {
  return value || "---";
};





  const stats = [
    {
      title: "Active Claims",
      value: "24",
      change: "+3 from yesterday",
      icon: FileText,
      color: "text-primary"
    },
    {
      title: "Pending Repairs",
      value: "12",
      change: "5 awaiting parts",
      icon: Wrench,
      color: "text-warning"
    },
    {
      title: "Completed Today",
      value: "8",
      change: "+2 from yesterday",
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Technicians",
      value: "6",
      change: "2 available",
      icon: Users,
      color: "text-automotive-steel"
    }
  ];

  // In real app, data would be fetched from API
  const recentClaims: any[] = [];

  const handleViewDetails = (claimId: string) => {
    setSelectedClaimId(claimId);
    setShowClaimDetails(true);
  };

  const handleUpdateStatus = (claimId: string, currentStatus: string) => {
    setSelectedClaimId(claimId);
    setSelectedClaimStatus(currentStatus);
    setShowUpdateStatus(true);
  };

  const handleStatusUpdated = () => {
    // In real app, would refresh the claims list
    setShowUpdateStatus(false);
    setShowClaimDetails(false);
  };

  const handleVinSearch = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      // Get token from AuthContext
      const token = user?.id ? localStorage.getItem('ev_warranty_token') : null;
      
      if (!token) {
        alert('Please login first');
        return;
      }

      // Call backend API to search for vehicle by VIN
      const response = await axios.get(`http://localhost:3000/api/v1/vehicle/find-vehicle-by-vin`, {
        params: {
          vin: searchTerm.trim()
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.status === 'success') {
        const vehicleData = response.data.data.vehicle;
        console.log('Vehicle data received:', vehicleData);
        setSearchResult(vehicleData);
        setShowVehicleForm(true);
        setShowNotFoundToast(false);
      }
    } catch (error) {
      console.error('Error searching vehicle:', error);
      
      if (error.response) {
        console.error('Backend error:', error.response.data);
        // Handle specific error messages
        if (error.response.status === 404) {
          console.log('Vehicle not found in system');
        }
      }
      
      // If vehicle not found (404) or other error, show not found toast
      setSearchResult(null);
      setShowVehicleForm(false);
      setShowNotFoundToast(true);
      
      // Tự động ẩn toast sau 3 giây
      setTimeout(() => {
        setShowNotFoundToast(false);
      }, 3000);
    }
  };

  const handleSearchCustomer = async () => {
    if (!customerSearchPhone.trim()) return;
    
    setIsSearchingCustomer(true);
    setHasSearchedCustomer(false);
    
    try {
      // Get token from AuthContext
      const token = localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        alert('Please login first');
        setIsSearchingCustomer(false);
        return;
      }

      // Call backend API to search for customer by phone
      const response = await axios.get(`http://localhost:3000/api/v1/customer/find-customer-with-phone-or-email`, {
        params: {
          phone: customerSearchPhone.trim()
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.status === 'success') {
        const customerData = response.data.data.customer;
        console.log('Customer data received:', customerData);
        
        // Customer found, populate form with customer data
        setOwnerForm({
          fullName: customerData.fullName || customerData.fullname || '',
          phone: customerData.phone || '',
          email: customerData.email || '',
          address: customerData.address || ''
        });
      }
      
      setIsSearchingCustomer(false);
      setHasSearchedCustomer(true);
    } catch (error) {
      console.error('Error searching customer:', error);
      
      if (error.response) {
        console.error('Backend error:', error.response.data);
        // Handle specific error messages
        if (error.response.status === 404) {
          console.log('Customer not found in system');
        }
      }
      
      // Customer not found, clear form but keep phone number
      setOwnerForm({
        fullName: '',
        phone: customerSearchPhone.trim(),
        email: '',
        address: ''
      });
      
      setIsSearchingCustomer(false);
      setHasSearchedCustomer(true);
    }
  };

  const handleRegisterOwner = async () => {
    // Validate owner form
    if (!ownerForm.fullName?.trim() || !ownerForm.phone?.trim() || !ownerForm.email?.trim() || !ownerForm.address?.trim()) {
      alert('Please fill in all owner information (Full Name, Phone, Email, Address).');
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/warehouses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const warehouseData = response.data?.data?.warehouses || [];
      setWarehouses(warehouseData);
    } catch (error) {
      console.error('Failed to fetch warehouses:', error);
    } finally {
      setIsLoadingWarehouses(false);
    }
  };

  // Fetch stock transfer requests
  const fetchStockTransferRequests = async (status = 'PENDING_APPROVAL') => {
    setIsLoadingStockRequests(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingStockRequests(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/stock-transfer-requests?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const requestsData = response.data?.data?.stockTransferRequests || [];
      setStockTransferRequests(requestsData);
    } catch (error) {
      console.error('Failed to fetch stock transfer requests:', error);
    } finally {
      setIsLoadingStockRequests(false);
    }
  };

  // Load warranty claims and technicians data
  useEffect(() => {
    let cancelled = false;

    // Fetch technicians from backend instead of using mock data
    const fetchTechnicians = async (status = 'AVAILABLE') => {
      setIsLoadingTechnicians(true);
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) {
        setIsLoadingTechnicians(false);
        return [] as Technician[];
      }
      try {
        const url = status ? `${API_BASE_URL}/users/technicians?status=${status}` : `${API_BASE_URL}/users/technicians`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const records = res.data?.data || [];
        const mapped: Technician[] = records.map((t: any) => {
          // Status is in workSchedule array, not at root level
          const rawStatus = t.workSchedule?.[0]?.status || t.status || '';
          const normalizedStatus = String(rawStatus).trim().toUpperCase().replace(/\s+/g, '_') || undefined;

          return {
            id: t.userId || t.id || String(t.techId || ''),
            name: t.name || t.fullName || '',
            workload: t.activeTaskCount,
            isAvailable: (normalizedStatus || '') === 'AVAILABLE',
            status: normalizedStatus
          } as Technician;
        });
        setIsLoadingTechnicians(false);
        return mapped;
      } catch (err) {
        console.error('Failed to fetch technicians', err);
        setIsLoadingTechnicians(false);
        return [] as Technician[];
      }
    };

    // Fetch all statuses on mount
    fetchAllStatuses();

    // Load technicians from API (AVAILABLE / UNAVAILABLE)
    refreshTechnicians('').then(() => { });

    // Load warehouses
    fetchWarehouses();

    return () => { cancelled = true; };
  }, []);

  const assignTechnicianToCase = async (vin: string, technicianId: string) => {
    const technician = availableTechnicians.find(t => t.id === technicianId);
    if (!technician) return;

    // Find the record ID from the current claims
    let claim: WarrantyClaim | undefined;
    for (const status of Object.keys(claimsByStatus)) {
      const found = claimsByStatus[status]?.find(c => c.vin === vin);
      if (found) {
        claim = found;
        break;
      }
    }

    if (!claim || !claim.recordId) {
      alert('Record ID not found');
      return;
    }

    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) {
        alert('Authentication required');
        return;
      }

      // Call backend API to assign technician
      const response = await axios.patch(
        `${API_BASE_URL}/processing-records/${claim.recordId}/assignment`,
        { technicianId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.status === 'success') {
        alert(`Technician ${technician.name} assigned successfully!`);
        
        // Close modal
        setShowTechnicianModal(false);
        setSelectedCaseForAssignment('');

        // Refresh all data to ensure UI is up-to-date
        await fetchAllStatuses();

        // Refresh technicians list to update workload
        await refreshTechnicians(techFilterStatus === 'ALL' ? '' : techFilterStatus);
      }
    } catch (error: any) {
      console.error('Failed to assign technician:', error);
      if (error.response?.data?.message) {
        alert(`Failed to assign technician: ${error.response.data.message}`);
      } else {
        alert('Failed to assign technician. Please try again.');
      }
    }
  };

  const removeTechnicianFromCase = (vin: string, technicianId: string) => {
    setWarrantyClaims(prev => prev.map(claim =>
      claim.vin === vin
        ? {
          ...claim,
          assignedTechnicians: claim.assignedTechnicians.filter(t => t.id !== technicianId)
        }
        : claim
    ));
  };

  const getRecommendedTechnicians = (issueType: string) => {
    const specialtyMapping: { [key: string]: string[] } = {
      'Pin EV': ['Battery Systems'],
      'Động cơ': ['Motor & Drivetrain', 'Electronics & Software'],
      'Hệ thống điện': ['Electronics & Software', 'Charging Systems'],
      'Cảm biến': ['Electronics & Software', 'General Diagnostics'],
      'Phanh': ['General Diagnostics']
    };

    // Without specialty information, recommend by availability and workload (less loaded first)
    return availableTechnicians
      .filter(tech => tech.isAvailable)
      .sort((a, b) => {
        const aw = a.workload || 0;
        const bw = b.workload || 0;
        return aw - bw;
      });
  };

  const handleViewClaimDetail = (vin: string) => {
    console.log('handleViewClaimDetail called with VIN:', vin);
    const claim = warrantyClaims.find(c => c.vin === vin);
    console.log('Found claim:', claim);
    if (claim) {
      setSelectedClaimForDetail(claim);
      setShowClaimDetailModal(true);
      console.log('Modal should open now');
    }
  };

  const openTechnicianAssignmentModal = (vin: string) => {
    setSelectedCaseForAssignment(vin);
    setShowTechnicianModal(true);
  };

  const closeTechnicianModal = () => {
    setShowTechnicianModal(false);
    setSelectedCaseForAssignment('');
  };

  // View technician's assigned records
  const viewTechnicianRecords = (technician: Technician) => {
    // Filter all records to find ones assigned to this technician
    const allRecords: WarrantyClaim[] = [];
    Object.values(claimsByStatus).forEach(claims => {
      allRecords.push(...claims);
    });

    const techRecords = allRecords.filter(claim =>
      (claim.assignedTechnicians || []).some(tech => tech.id === technician.id)
    );

    setSelectedTechnicianForRecords(technician);
    setTechnicianRecords(techRecords);
    setShowTechnicianRecordsModal(true);
  };

  const closeTechnicianRecordsModal = () => {
    setShowTechnicianRecordsModal(false);
    setSelectedTechnicianForRecords(null);
    setTechnicianRecords([]);
  };

  // View warehouse details
  const viewWarehouseDetails = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowWarehouseDetailModal(true);
  };

  const closeWarehouseDetailModal = () => {
    setShowWarehouseDetailModal(false);
    setSelectedWarehouse(null);
  };

  // Allocate component for case line
  const handleAllocateComponent = async (guaranteeCaseId: string, caseLineId: string) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ev_warranty_token');
      const response = await axios.post(
        `${API_BASE_URL}/guarantee-cases/${guaranteeCaseId}/case-lines/${caseLineId}/allocate-stock`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.status === 200 || response.status === 201) {
        alert('Component allocated successfully!');

        // Remove from out of stock list if it was there
        setOutOfStockCaseLines(prev => {
          const newSet = new Set(prev);
          newSet.delete(caseLineId);
          // Save to localStorage
          localStorage.setItem('outOfStockCaseLines', JSON.stringify(Array.from(newSet)));
          return newSet;
        });

        // Refresh all data to ensure UI is up-to-date
        await fetchAllStatuses();
      }
    } catch (error: any) {
      console.error('Error allocating component:', error);
      const errorMessage = error.response?.data?.message || 'Failed to allocate component. Please try again.';

      // Check if error is 409 Conflict (out of stock)
      if (error.response?.status === 409) {
        // Mark this case line as out of stock
        setOutOfStockCaseLines(prev => {
          const newSet = new Set([...prev, caseLineId]);
          // Save to localStorage
          localStorage.setItem('outOfStockCaseLines', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        alert('⚠️ Out of Stock! No available component in warehouse. Please request from manufacturer.');
      } else if (error.response?.status === 404 && errorMessage.includes('No available stock found')) {
        // Also handle 404 as out of stock
        setOutOfStockCaseLines(prev => {
          const newSet = new Set([...prev, caseLineId]);
          // Save to localStorage
          localStorage.setItem('outOfStockCaseLines', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
        alert('⚠️ Out of Stock! No available component in warehouse. Please request from manufacturer.');
      } else {
        alert(errorMessage);
      }
    }
  };

  // Request component from manufacturer - Open warehouse selection modal
  const handleRequestFromManufacturer = async (
    guaranteeCaseId: string, 
    caseLineId: string, 
    typeComponentId: string,
    quantity: number
  ) => {
    // Store the pending request data
    setPendingStockRequest({
      caseLineId,
      typeComponentId,
      quantity,
      guaranteeCaseId
    });
    
    // Open warehouse selection modal
    setShowWarehouseSelectionModal(true);
  };

  // Submit stock transfer request after warehouse is selected
  const submitStockTransferRequest = async (warehouseId: string) => {
    if (!pendingStockRequest) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('ev_warranty_token');
      if (!token) {
        alert('Authentication required');
        return;
      }

      const requestBody = {
        caselineIds: [pendingStockRequest.caseLineId],
        items: [
          {
            quantityRequested: pendingStockRequest.quantity,
            typeComponentId: pendingStockRequest.typeComponentId
          }
        ],
        requestingWarehouseId: warehouseId
      };

      const response = await axios.post(
        `${API_BASE_URL}/stock-transfer-requests`,
        requestBody,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.status === 200 || response.status === 201) {
        // Remove from out of stock list since request has been sent
        setOutOfStockCaseLines(prev => {
          const newSet = new Set(prev);
          newSet.delete(pendingStockRequest.caseLineId);
          localStorage.setItem('outOfStockCaseLines', JSON.stringify(Array.from(newSet)));
          return newSet;
        });

        // Add to requested from manufacturer list to prevent showing allocate button
        setRequestedFromManufacturer(prev => {
          const newSet = new Set([...prev, pendingStockRequest.caseLineId]);
          localStorage.setItem('requestedFromManufacturer', JSON.stringify(Array.from(newSet)));
          return newSet;
        });

        alert('Stock transfer request sent successfully!');
        
        // Close modal and reset
        setShowWarehouseSelectionModal(false);
        setPendingStockRequest(null);

        // Refresh data from backend to get updated status
        await fetchAllStatuses();
        await fetchWarehouses();
        
        // Refresh claim detail modal with updated data from backend
        if (selectedClaimForDetail) {
          const updatedClaims = Object.values(claimsByStatus).flat();
          const updatedClaim = updatedClaims.find(c => c.vin === selectedClaimForDetail.vin);
          if (updatedClaim) {
            setSelectedClaimForDetail(updatedClaim);
          }
        }
      }
    } catch (error: any) {
      console.error('Error requesting from manufacturer:', error);
      const errorMessage = error.response?.data?.message || 'Failed to send request to manufacturer. Please try again.';
      alert(errorMessage);
    }
  };

  // Refresh technicians (callable from UI)
  const refreshTechnicians = async (status = 'AVAILABLE') => {
    setIsLoadingTechnicians(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingTechnicians(false);
      return;
    }
    try {
      const url = status ? `${API_BASE_URL}/users/technicians?status=${status}` : `${API_BASE_URL}/users/technicians`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const records = res.data?.data || [];
      const mapped: Technician[] = records.map((t: any) => {
        // Status is in workSchedule array, not at root level
        const rawStatus = t.workSchedule?.[0]?.status || t.status || '';
        const normalizedStatus = String(rawStatus).trim().toUpperCase().replace(/\s+/g, '_') || undefined;

        return {
          id: t.userId || t.id || String(t.techId || ''),
          name: t.name || t.fullName || t.username || '',
          specialty: t.specialty || t.department || undefined,
          experience: t.experience || t.yearsOfExperience || undefined,
          rating: t.rating || undefined,
          workload: t.activeTaskCount || t.workload || t.currentLoad || undefined,
          isAvailable: (normalizedStatus || '') === 'AVAILABLE',
          status: normalizedStatus
        } as Technician;
      });
      setAvailableTechnicians(mapped);
    } catch (err) {
      console.error('Failed to refresh technicians', err);
    } finally {
      setIsLoadingTechnicians(false);
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

      {/* Your Content/Components */}
      <div className="min-h-screen bg-transparent relative z-10">
        {/* Header */}
        <header className="border-b bg-card shadow-elegant">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <Wrench className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Service Center Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    Welcome,{user?.role === 'service_center_staff' ? 'Staff' : user?.role === 'service_center_manager' ? 'Manager' : 'Technician'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 ml-auto">
                <Button variant="outline" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-6">
          {/* Main Content */}
          <Tabs defaultValue="claims" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="claims">Warranty Claims</TabsTrigger>
              <TabsTrigger value="repairs">Technician Management</TabsTrigger>
              <TabsTrigger value="warehouses">Warehouse Management</TabsTrigger>
            </TabsList>

            <TabsContent value="claims" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Warranty Claims Management
                  </CardTitle>
                  <CardDescription>
                    Manage warranty claims and track their progress across all service centers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Status Tabs */}
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    {STATUSES.map(s => (
                      <Button
                        key={s}
                        variant={s === activeStatus ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          if (s !== activeStatus) {
                            setActiveStatus(s);
                            setWarrantyClaims(claimsByStatus[s] || []);
                          }
                        }}
                        className="border-dashed"
                      >
                        {getDisplayStatus(s)} ({(claimsByStatus[s] || []).length})
                      </Button>
                    ))}
                  </div>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>VIN</TableHead>
                          <TableHead>Mileage</TableHead>
                          <TableHead>Check-in Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Cases</TableHead>
                          <TableHead>Technician Assignment</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warrantyClaims.map((claim, index) => (
                          <TableRow key={claim.recordId || claim.vin}>
                            <TableCell className="font-mono text-sm font-medium">
                              {claim.vin}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {formatMileage(claim.mileage)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(claim.checkInDate).toLocaleDateString('en-US')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(claim.status)} className="text-xs">
                                {getDisplayStatus(claim.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {claim.guaranteeCases && claim.guaranteeCases.length > 0 ? (
                                  <>
                                    <Badge variant="default" className="text-xs">
                                      {claim.guaranteeCases.length} case{claim.guaranteeCases.length > 1 ? 's' : ''}
                                    </Badge>
                                    {claim.priority && (
                                      <Badge variant={getPriorityBadgeVariant(claim.priority)} className="text-xs">
                                        {claim.priority === 'Urgent' && '🚨 '}
                                        {claim.priority === 'High' && '🔥 '}
                                        {claim.priority === 'Medium' && '📋 '}
                                        {claim.priority === 'Low' && '📝 '}
                                        {claim.priority}
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">
                                    No cases
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="space-y-2">
                                {/* Assigned Technicians */}
                                <div className="flex flex-wrap gap-1">
                                  {claim.assignedTechnicians.map((tech) => (
                                    <Badge key={tech.id} variant="outline" className="text-xs">
                                      {tech.name}
                                    </Badge>
                                  ))}
                                  {claim.assignedTechnicians.length === 0 && (
                                    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Not assigned
                                    </Badge>
                                  )}
                                </div>

                                {/* Assign Technician Button - Only show for CHECKED_IN status */}
                                {hasPermission(user, 'assign_technicians') && claim.status === 'CHECKED_IN' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                                    onClick={() => openTechnicianAssignmentModal(claim.vin)}
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign Technician (Diagnosis)
                                  </Button>
                                )}

                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewClaimDetail(claim.vin)}
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-6">
                    <p className="text-sm text-muted-foreground">
                      Showing {warrantyClaims.length} warranty claims
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="repairs" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <CardTitle>Technician Management</CardTitle>
                      <CardDescription>View and manage technicians' statuses and assignments</CardDescription>
                    </div>
                    {/* actions removed: refresh buttons omitted per UX request */}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Status tabs for technicians */}
                  <div className="mb-4 flex items-center gap-2 flex-wrap">
                    {['AVAILABLE', 'UNAVAILABLE', 'ALL'].map(s => {
                      const count = s === 'ALL' ? availableTechnicians.length : availableTechnicians.filter(t => (t.status || (t.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE')) === s).length;
                      return (
                        <Button
                          key={s}
                          size="sm"
                          variant={s === (typeof techFilterStatus !== 'undefined' ? techFilterStatus : 'AVAILABLE') ? 'default' : 'outline'}
                          onClick={() => setTechFilterStatus(s)}
                        >
                          {getDisplayStatus(s)} ({count})
                        </Button>
                      );
                    })}
                  </div>

                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Tasks</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(techFilterStatus && techFilterStatus !== 'ALL' ? availableTechnicians.filter(t => (t.status || (t.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE')) === techFilterStatus) : availableTechnicians).map(tech => (
                          <TableRow key={tech.id}>
                            <TableCell>{tech.name}</TableCell>
                            <TableCell>{typeof tech.workload === 'number' ? tech.workload : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={tech.isAvailable ? 'success' : 'outline'} className="text-xs">
                                {getDisplayStatus(tech.status || (tech.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'))}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => viewTechnicianRecords(tech)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
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
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="default" 
                        size="sm" 
                        onClick={() => {
                          fetchStockTransferRequests('PENDING_APPROVAL');
                          setShowStockRequestsModal(true);
                        }}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        View Stock Requests
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={fetchWarehouses}
                        disabled={isLoadingWarehouses}
                      >
                        {isLoadingWarehouses ? 'Loading...' : 'Refresh'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingWarehouses ? (
                    <div className="text-center py-8">
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
                            <TableHead>Address</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Created At</TableHead>
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
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(warehouse.createdAt).toLocaleDateString('en-US')}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => viewWarehouseDetails(warehouse)}
                                >
                                  View Details
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
          </Tabs>
        </div>

        {/* Claim Detail Modal */}
        <Dialog open={showClaimDetailModal} onOpenChange={setShowClaimDetailModal}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-blue-600" />
                Warranty Claim Details
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                Complete information for warranty claim
              </DialogDescription>
            </DialogHeader>

            {selectedClaimForDetail && (
              <div className="space-y-6 mt-6">
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(selectedClaimForDetail.status)} className="text-xs">
                    {selectedClaimForDetail.status || 'UNKNOWN'}
                  </Badge>
                </div>
                {/* Basic Information */}
                <Card className="shadow-md border">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">VIN</label>
                          <p className="font-mono text-sm font-semibold mt-0.5">{selectedClaimForDetail.vin}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Vehicle Model</label>
                          <p className="text-sm font-medium mt-0.5">{selectedClaimForDetail.model}</p>
                          {selectedClaimForDetail.modelId && (
                            <p className="font-mono text-xs text-muted-foreground mt-1">
                              Model ID: {selectedClaimForDetail.modelId}
                            </p>
                          )}
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <Car className="h-3 w-3" />
                            Mileage
                          </label>
                          <p className="text-sm font-semibold mt-0.5">{selectedClaimForDetail.mileage.toLocaleString()} km</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <Calendar className="h-3 w-3" />
                            Check-in Date
                          </label>
                          <p className="text-sm font-medium mt-0.5">{new Date(selectedClaimForDetail.checkInDate).toLocaleDateString('en-US')}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <User className="h-3 w-3" />
                            Created By Staff
                          </label>
                          <p className="text-sm font-semibold mt-0.5">{selectedClaimForDetail.serviceCenter}</p>
                          {selectedClaimForDetail.createdByStaffId && (
                            <p className="font-mono text-xs text-muted-foreground mt-1">
                              ID: {selectedClaimForDetail.createdByStaffId}
                            </p>
                          )}
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <DollarSign className="h-3 w-3" />
                            Estimated Cost
                          </label>
                          <p className="text-sm font-semibold text-green-600 mt-0.5">
                            {selectedClaimForDetail.estimatedCost.toLocaleString()} VND
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Guarantee Cases */}
                {selectedClaimForDetail.guaranteeCases && selectedClaimForDetail.guaranteeCases.length > 0 && (
                  <Card className="shadow-md border">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        Guarantee Cases ({selectedClaimForDetail.guaranteeCases.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {selectedClaimForDetail.guaranteeCases.map((gc, idx) => (
                          <Card key={gc.guaranteeCaseId} className="border-l-4 border-l-blue-500 shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {/* Case Header */}
                                <div className="flex items-start gap-3">
                                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm shrink-0 shadow-sm">
                                    {idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">Guarantee Case #{idx + 1}</span>
                                      {gc.status && (
                                        <Badge variant="outline" className="text-xs font-semibold">
                                          {getDisplayStatus(gc.status)}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100 font-medium bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md border border-blue-100 dark:border-blue-800">
                                      {gc.contentGuarantee}
                                    </p>
                                  </div>
                                </div>

                                {/* Case Lines */}
                                {gc.caseLines && gc.caseLines.length > 0 && (
                                  <div className="space-y-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                        Case Lines ({gc.caseLines.length})
                                      </span>
                                    </div>

                                    <div className="space-y-2">
                                      {gc.caseLines.map((line, lineIdx) => (
                                        <div
                                          key={line.id}
                                          className={`rounded-md p-2.5 border transition-all ${line.status === 'CUSTOMER_APPROVED'
                                            ? 'bg-green-50/50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                            : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                          {/* Line Header - More compact */}
                                          <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                              <div className="flex items-center justify-center w-5 h-5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold text-xs">
                                                {lineIdx + 1}
                                              </div>
                                              <Badge
                                                variant={getCaseLineStatusVariant(line.status)}
                                                className={`text-xs px-2 py-0 ${
                                                  line.status === 'CUSTOMER_APPROVED' 
                                                    ? 'bg-green-600 text-white' 
                                                    : line.status === 'REJECTED_BY_CUSTOMER'
                                                    ? 'bg-red-600 text-white font-semibold'
                                                    : ''
                                                }`}
                                              >
                                                {getDisplayStatus(line.status)}
                                              </Badge>
                                              <Badge
                                                variant={line.warrantyStatus === 'ELIGIBLE' ? 'default' : 'destructive'}
                                                className="text-xs px-2 py-0"
                                              >
                                                {line.warrantyStatus}
                                              </Badge>
                                            </div>
                                          </div>

                                          {/* Content Grid - 2 columns for better readability */}
                                          <div className="grid grid-cols-2 gap-2 mb-2">
                                            {/* Diagnosis */}
                                            <div className="p-2 bg-amber-50/80 dark:bg-amber-900/10 rounded border-l-2 border-amber-400">
                                              <div className="flex items-center gap-1 mb-1">
                                                <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                                                <span className="font-semibold text-sm text-amber-700 dark:text-amber-400">Diagnosis</span>
                                              </div>
                                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{line.diagnosisText}</p>
                                            </div>

                                            {/* Correction */}
                                            <div className="p-2 bg-green-50/80 dark:bg-green-900/10 rounded border-l-2 border-green-400">
                                              <div className="flex items-center gap-1 mb-1">
                                                <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                                <span className="font-semibold text-sm text-green-700 dark:text-green-400">Correction</span>
                                              </div>
                                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{line.correctionText}</p>
                                            </div>
                                          </div>

                                          {/* Component Information */}
                                          {line.typeComponent && (
                                            <div className="p-2 bg-blue-50/80 dark:bg-blue-900/10 rounded border-l-2 border-blue-400">
                                              <div className="flex items-center justify-between mb-1.5">
                                                <div className="flex items-center gap-1.5">
                                                  <Package className="h-3.5 w-3.5 text-blue-600" />
                                                  <span className="font-semibold text-sm text-blue-700 dark:text-blue-400">Component</span>
                                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{line.typeComponent.name}</span>
                                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                    {line.typeComponent.category}
                                                  </Badge>
                                                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                                    Qty: {line.quantity}
                                                  </Badge>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                  {/* Show Allocate button only when record is PROCESSING and case line is CUSTOMER_APPROVED */}
                                                  {/* Components can only be allocated when all case lines are approved/rejected and record moves to PROCESSING */}
                                                  {/* Don't show if already requested from manufacturer */}
                                                  {selectedClaimForDetail.status === 'PROCESSING' && line.status === 'CUSTOMER_APPROVED' && hasPermission(user, 'attach_parts') && !outOfStockCaseLines.has(line.id) && !requestedFromManufacturer.has(line.id) && (
                                                    <Button
                                                      size="sm"
                                                      variant="default"
                                                      onClick={() => handleAllocateComponent(gc.guaranteeCaseId, line.id)}
                                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-6 px-2"
                                                    >
                                                      <Package className="h-3 w-3 mr-1" />
                                                      Allocate
                                                    </Button>
                                                  )}
                                                  {/* Show Request button if record is PROCESSING, case line is CUSTOMER_APPROVED but out of stock */}
                                                  {/* Don't show if already requested */}
                                                  {selectedClaimForDetail.status === 'PROCESSING' && line.status === 'CUSTOMER_APPROVED' && outOfStockCaseLines.has(line.id) && !requestedFromManufacturer.has(line.id) && hasPermission(user, 'attach_parts') && line.typeComponent && (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => handleRequestFromManufacturer(
                                                        gc.guaranteeCaseId, 
                                                        line.id, 
                                                        line.typeComponent.typeComponentId,
                                                        line.quantity
                                                      )}
                                                      className="bg-orange-600 hover:bg-orange-700 text-white border-orange-600 text-xs h-6 px-2"
                                                    >
                                                      <AlertCircle className="h-3 w-3 mr-1" />
                                                      Request from Manufacturer
                                                    </Button>
                                                  )}
                                                  {/* Show "Requested" badge if request has been sent but backend hasn't updated yet */}
                                                  {requestedFromManufacturer.has(line.id) && line.status === 'CUSTOMER_APPROVED' && (
                                                    <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-400 text-yellow-700">
                                                      <Clock className="h-3 w-3 mr-1" />
                                                      Requested - Pending
                                                    </Badge>
                                                  )}
                                                  {/* Show status badge if already allocated or backend has updated status */}
                                                  {line.status !== 'CUSTOMER_APPROVED' && line.status !== 'DRAFT' && line.status !== 'PENDING_APPROVAL' && (
                                                    <Badge variant="success" className="text-xs">
                                                      ✓ {getDisplayStatus(line.status)}
                                                    </Badge>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Rejection Reason */}
                                          {line.rejectionReason && (
                                            <div className="mt-2 p-2 bg-red-50/80 dark:bg-red-900/10 rounded border-l-2 border-red-400">
                                              <div className="flex items-center gap-1 mb-1">
                                                <XCircle className="h-3.5 w-3.5 text-red-600" />
                                                <span className="font-semibold text-sm text-red-700 dark:text-red-400">Rejection Reason</span>
                                              </div>
                                              <p className="text-sm text-red-900 dark:text-red-100 font-medium leading-relaxed">{line.rejectionReason}</p>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Assigned Technicians */}
                <Card className="shadow-md border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Assigned Technicians ({selectedClaimForDetail.assignedTechnicians.length})
                      </CardTitle>
                      {hasPermission(user, 'assign_technicians') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowClaimDetailModal(false);
                            openTechnicianAssignmentModal(selectedClaimForDetail.vin);
                          }}
                          className="border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Assign Technician
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedClaimForDetail.assignedTechnicians.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedClaimForDetail.assignedTechnicians.map((tech) => (
                          <Card key={tech.id} className="border-dashed">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold">{tech.name}</p>
                                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                    {typeof tech.workload === 'number' && (
                                      <Badge variant="outline" className="text-xs">Tasks: {tech.workload}</Badge>
                                    )}
                                    {tech.status && (
                                      <span className="text-xs">{getDisplayStatus(tech.status)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No technicians assigned yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Case Submitted</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedClaimForDetail.submissionDate).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Vehicle Check-in</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedClaimForDetail.checkInDate).toLocaleDateString('en-US')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Technician Assignment Modal */}
        <Dialog open={showTechnicianModal} onOpenChange={closeTechnicianModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Assign Technician to Case
                </DialogTitle>
                <DialogDescription>
                  {selectedCaseForAssignment && (() => {
                    const claim = warrantyClaims.find(c => c.vin === selectedCaseForAssignment);
                    return (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg border space-y-2">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <span className="text-xs text-muted-foreground mr-2">VIN:</span>
                            <span className="font-mono font-medium text-sm">{selectedCaseForAssignment}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <div className="flex-1">
                            <span className="text-xs text-muted-foreground mr-2">Issue:</span>
                            <span className="font-medium text-sm">{claim?.issueType}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refreshTechnicians('AVAILABLE')}>
                  Refresh
                </Button>
                {isLoadingTechnicians && (
                  <div className="text-sm text-muted-foreground">Loading...</div>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Currently Assigned */}
              {selectedCaseForAssignment && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-sm mb-2">Currently Assigned:</h4>
                  <div className="flex flex-wrap gap-2">
                    {warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.map((tech) => (
                      <Badge key={tech.id} variant="default" className="text-sm p-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{tech.name}</span>
                          {typeof tech.workload === 'number' && (
                            <span className="text-xs">Tasks: {tech.workload}</span>
                          )}
                          {tech.status && (
                            <span className="text-xs text-muted-foreground">{getDisplayStatus(tech.status)}</span>
                          )}
                        </div>
                      </Badge>
                    )) || []}
                    {(!warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.length ||
                      warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.length === 0) && (
                        <span className="text-sm text-muted-foreground">No technicians assigned yet</span>
                      )}
                  </div>
                </div>
              )}

              {/* Available Technicians */}
              <div>
                <h4 className="font-medium text-sm mb-3">Available Technicians:</h4>
                <div className="grid gap-3">
                  {selectedCaseForAssignment && getRecommendedTechnicians(
                    warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.issueType || ''
                  ).map((tech) => {
                    const isAssigned = warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.some(t => t.id === tech.id);
                    return (
                      <Card key={tech.id} className={`p-4 cursor-pointer transition-colors ${isAssigned ? 'bg-gray-100 opacity-60' : 'hover:bg-blue-50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-medium">{tech.name}</h5>
                              {typeof tech.workload === 'number' && (
                                <Badge variant={tech.workload <= 2 ? "default" : tech.workload <= 4 ? "secondary" : "destructive"} className="text-xs">
                                  Tasks: {tech.workload}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className={`${tech.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                {tech.isAvailable ? '✅ Available' : '❌ Busy'}
                              </span>
                              {tech.status && (
                                <span className="text-xs text-muted-foreground">{tech.status}</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant={isAssigned ? "outline" : "default"}
                            size="sm"
                            disabled={isAssigned || !tech.isAvailable}
                            onClick={() => assignTechnicianToCase(selectedCaseForAssignment, tech.id)}
                          >
                            {isAssigned ? 'Assigned' : 'Assign'}
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Technician Records Modal */}
        <Dialog open={showTechnicianRecordsModal} onOpenChange={setShowTechnicianRecordsModal}>
          <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Records Assigned to {selectedTechnicianForRecords?.name || 'Technician'}
              </DialogTitle>
              <DialogDescription>
                Viewing all warranty claims currently assigned to this technician
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {technicianRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No records assigned to this technician
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Total: {technicianRecords.length} record(s)</span>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VIN</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Issue</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check-in Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {technicianRecords.map((record) => (
                        <TableRow key={record.recordId}>
                          <TableCell className="font-mono text-xs">{record.vin}</TableCell>
                          <TableCell>{displayValue(record.model)}</TableCell>
                          <TableCell>
                            {record.guaranteeCases && record.guaranteeCases.length > 0 ? (
                              <div className="space-y-1">
                                {record.guaranteeCases.map((gCase, idx) => (
                                  <div key={gCase.guaranteeCaseId} className="text-xs">
                                    <Badge variant="outline" className="mr-1">#{idx + 1}</Badge>
                                    {gCase.contentGuarantee}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              displayValue(record.issueType)
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(record.status)}>
                              {getDisplayStatus(record.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {new Date(record.checkInDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedClaimForDetail(record);
                                setShowClaimDetailModal(true);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={closeTechnicianRecordsModal}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warehouse Detail Modal */}
        <Dialog open={showWarehouseDetailModal} onOpenChange={setShowWarehouseDetailModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Warehouse Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the warehouse
              </DialogDescription>
            </DialogHeader>

            {selectedWarehouse && (
              <div className="space-y-6 mt-4">
                {/* Basic Information */}
                <Card className="shadow-md border">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Warehouse ID</label>
                          <p className="font-mono text-sm font-semibold mt-0.5">{selectedWarehouse.warehouseId}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Name</label>
                          <p className="text-sm font-medium mt-0.5">{selectedWarehouse.name}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <MapPin className="h-3 w-3" />
                            Address
                          </label>
                          <p className="text-sm font-medium mt-0.5">{selectedWarehouse.address}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Priority</label>
                          <div className="mt-1">
                            <Badge 
                              variant={selectedWarehouse.priority === 1 ? 'default' : selectedWarehouse.priority === 2 ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              Priority {selectedWarehouse.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Service Center ID</label>
                          <p className="font-mono text-sm mt-0.5">{selectedWarehouse.serviceCenterId || selectedWarehouse.service_center_id || '-'}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Vehicle Company ID</label>
                          <p className="font-mono text-sm mt-0.5">{selectedWarehouse.vehicleCompanyId || selectedWarehouse.vehicle_company_id || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card className="shadow-md border">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                        <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      Timestamps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                          <Calendar className="h-3 w-3" />
                          Created At
                        </label>
                        <p className="text-sm font-medium mt-0.5">
                          {new Date(selectedWarehouse.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                          <Calendar className="h-3 w-3" />
                          Updated At
                        </label>
                        <p className="text-sm font-medium mt-0.5">
                          {new Date(selectedWarehouse.updatedAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={closeWarehouseDetailModal}>
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warehouse Selection Modal for Stock Transfer Request */}
        <Dialog open={showWarehouseSelectionModal} onOpenChange={setShowWarehouseSelectionModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Select Warehouse for Stock Transfer Request
              </DialogTitle>
              <DialogDescription>
                Choose the warehouse that will request the component from the manufacturer
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {pendingStockRequest && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Request Details:
                      </p>
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <p>• Component ID: <span className="font-mono">{pendingStockRequest.typeComponentId}</span></p>
                        <p>• Quantity: <span className="font-semibold">{pendingStockRequest.quantity}</span></p>
                        <p>• Case Line ID: <span className="font-mono text-xs">{pendingStockRequest.caseLineId}</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <h4 className="font-medium text-sm mb-3">Available Warehouses:</h4>
                {warehouses.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No warehouses available</p>
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
                  <div className="grid gap-3 max-h-[400px] overflow-y-auto">
                    {warehouses.map((warehouse) => (
                      <Card 
                        key={warehouse.warehouseId} 
                        className="p-4 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20 border-2 hover:border-blue-400"
                        onClick={() => submitStockTransferRequest(warehouse.warehouseId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-semibold">{warehouse.name}</h5>
                              <Badge 
                                variant={warehouse.priority === 1 ? 'default' : warehouse.priority === 2 ? 'secondary' : 'outline'}
                                className="text-xs"
                              >
                                Priority {warehouse.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{warehouse.address}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              ID: {warehouse.warehouseId}
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              submitStockTransferRequest(warehouse.warehouseId);
                            }}
                          >
                            Select
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowWarehouseSelectionModal(false);
                  setPendingStockRequest(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Transfer Requests Modal */}
        <Dialog open={showStockRequestsModal} onOpenChange={setShowStockRequestsModal}>
          <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Stock Transfer Requests
              </DialogTitle>
              <DialogDescription>
                View all pending stock transfer requests from warehouses
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {isLoadingStockRequests ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading requests...</p>
                </div>
              ) : stockTransferRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending stock transfer requests</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Requester</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockTransferRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <p className="font-medium text-sm">{request.requester?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">
                              Service Center: {request.requester?.serviceCenterId || 'N/A'}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                request.status === 'PENDING_APPROVAL' ? 'outline' :
                                request.status === 'APPROVED' ? 'default' :
                                request.status === 'REJECTED' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {request.status.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(request.requestedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStockRequest(request);
                                setShowStockRequestDetailModal(true);
                              }}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                Showing {stockTransferRequests.length} request{stockTransferRequests.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => setShowStockRequestsModal(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Stock Transfer Request Detail Modal */}
        <Dialog open={showStockRequestDetailModal} onOpenChange={setShowStockRequestDetailModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Stock Transfer Request Details
              </DialogTitle>
              <DialogDescription>
                Complete information about the stock transfer request
              </DialogDescription>
            </DialogHeader>

            {selectedStockRequest && (
              <div className="space-y-6 mt-4">
                {/* Request Information */}
                <Card className="shadow-md border">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                        <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      Request Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Request ID</label>
                          <p className="font-mono text-sm mt-0.5">{selectedStockRequest.id}</p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Status</label>
                          <div className="mt-1">
                            <Badge 
                              variant={
                                selectedStockRequest.status === 'PENDING_APPROVAL' ? 'outline' :
                                selectedStockRequest.status === 'APPROVED' ? 'default' :
                                selectedStockRequest.status === 'REJECTED' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {selectedStockRequest.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Requesting Warehouse ID</label>
                          <p className="font-mono text-sm mt-0.5">{selectedStockRequest.requestingWarehouseId}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">Requester</label>
                          <p className="font-medium text-sm mt-0.5">{selectedStockRequest.requester?.name || 'Unknown'}</p>
                          <p className="font-mono text-xs text-muted-foreground mt-1">
                            User ID: {selectedStockRequest.requestedByUserId}
                          </p>
                        </div>
                        <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                            <Calendar className="h-3 w-3" />
                            Requested At
                          </label>
                          <p className="text-sm mt-0.5">
                            {new Date(selectedStockRequest.requestedAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {selectedStockRequest.approvedAt && (
                          <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                              <CheckCircle className="h-3 w-3" />
                              Approved At
                            </label>
                            <p className="text-sm mt-0.5">
                              {new Date(selectedStockRequest.approvedAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                        {selectedStockRequest.rejectedAt && (
                          <div className="p-2 bg-gray-50 dark:bg-gray-900/50 rounded-md">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 uppercase">
                              <XCircle className="h-3 w-3" />
                              Rejected At
                            </label>
                            <p className="text-sm mt-0.5">
                              {new Date(selectedStockRequest.rejectedAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedStockRequest.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200">
                        <label className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">Rejection Reason</label>
                        <p className="text-sm text-red-900 dark:text-red-100 mt-1">{selectedStockRequest.rejectionReason}</p>
                      </div>
                    )}
                    {selectedStockRequest.cancellationReason && (
                      <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-md border border-orange-200">
                        <label className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase">Cancellation Reason</label>
                        <p className="text-sm text-orange-900 dark:text-orange-100 mt-1">{selectedStockRequest.cancellationReason}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowStockRequestDetailModal(false);
                  setSelectedStockRequest(null);
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ServiceCenterDashboard;
