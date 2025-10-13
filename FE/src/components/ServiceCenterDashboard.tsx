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
import NewClaim from "./NewClaim";
import RegisterVehicle from "./RegisterVehicle";
import AddCustomer from "./AddCustomer";
import AttachParts from "./AttachParts";
import ClaimDetails from "./ClaimDetails";
import UpdateClaimStatus from "./UpdateClaimStatus";
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
  Warehouse,
  BoxIcon as Box,
  Edit,
  Trash,
  ArrowLeft
} from "lucide-react";

interface Technician {
  id: string;
  name: string;
  workload?: number; // maps to activeTaskCount
  isAvailable: boolean;
  status?: string; // WORKING | DAY_OFF | LEAVE_REQUESTED | LEAVE_APPROVED
}

interface AssignedComponent {
  id: string;
  warehouse_id: string;
  warehouse_name: string;
  type_component_id: string;
  component_name: string;
  component_sku: string;
  quantity: number;
  assigned_at: string;
  status: 'pending' | 'reserved' | 'dispatched' | 'delivered';
}

interface WarrantyClaim {
  vin: string;
  mileage: number;
  checkInDate: string;
  caseDescription: string;
  assignedTechnicians: Technician[];
  assignedComponents: AssignedComponent[];
  model: string;
  serviceCenter: string;
  submissionDate: string;
  estimatedCost: number;
  status?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  issueType: string;
}

interface Warehouse {
  warehouse_id: string;
  name: string;
  address: string;
  vehicle_company_id: string;
  service_center_id: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

interface TypeComponent {
  type_component_id: string;
  name: string;
  price: number;
  sku: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface Stock {
  stock_id: string;
  warehouse_id: string;
  type_component_id: string;
  quantity_in_stock: number;
  quantity_reserved: number;
  created_at: string;
  updated_at: string;
  // Relations
  warehouse?: Warehouse;
  type_component?: TypeComponent;
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
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([]);
  const [availableTechnicians, setAvailableTechnicians] = useState<Technician[]>([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState<boolean>(false);
  const [techFilterStatus, setTechFilterStatus] = useState<string>('WORKING');
  // Status tabs
  const STATUSES = [
    'CHECKED_IN',
    'IN_DIAGNOSIS',
    'WAITING_FOR_PARTS',
    'IN_REPAIR',
    'COMPLETED',
    'PAID',
    'CANCELLED'
  ];
  const [claimsByStatus, setClaimsByStatus] = useState<Record<string, WarrantyClaim[]>>({});
  const [activeStatus, setActiveStatus] = useState<string>('CHECKED_IN');
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<string>('');
  const [showClaimDetailModal, setShowClaimDetailModal] = useState(false);
  const [selectedClaimForDetail, setSelectedClaimForDetail] = useState<WarrantyClaim | null>(null);
  const [customerSearchPhone, setCustomerSearchPhone] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [hasSearchedCustomer, setHasSearchedCustomer] = useState(false);

  // Component Assignment Modal States
  const [showComponentAssignmentModal, setShowComponentAssignmentModal] = useState(false);
  const [selectedClaimForComponents, setSelectedClaimForComponents] = useState<string>('');
  const [selectedWarehouseForAssignment, setSelectedWarehouseForAssignment] = useState<string>('');
  const [selectedComponentForAssignment, setSelectedComponentForAssignment] = useState<string>('');
  const [componentQuantity, setComponentQuantity] = useState<number>(1);

  // Inventory Management States
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [typeComponents, setTypeComponents] = useState<TypeComponent[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [inventoryView, setInventoryView] = useState<'warehouses' | 'warehouse-detail'>('warehouses');
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [warehouseStocks, setWarehouseStocks] = useState<Stock[]>([]);

  // CRUD Modal States
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [editingComponent, setEditingComponent] = useState<TypeComponent | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const { user, logout, getToken } = useAuth();

  // Load warranty claims and technicians data
  useEffect(() => {
    let cancelled = false;

    // Fetch technicians from backend instead of using mock data
    const fetchTechnicians = async (status = 'WORKING') => {
      setIsLoadingTechnicians(true);
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) {
        setIsLoadingTechnicians(false);
        return [] as Technician[];
      }
      try {
        const res = await axios.get(`http://localhost:3000/api/v1/users/technicians?status=${status}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const records = res.data?.data || [];
        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        // Map backend technician shape to local Technician interface
        const mapped: Technician[] = records.map((t: any) => {
          const schedule = Array.isArray(t.workSchedule) ? t.workSchedule : [];
          const todayEntry = schedule.find((ws: any) => ws.workDate === today) || schedule[schedule.length - 1];
          const statusToday = todayEntry?.status || (t.status || undefined);
          const normalizedStatus = String(statusToday || '').trim().toUpperCase().replace(/\s+/g, '_') || undefined;
          const tech: Technician = {
            id: t.userId || t.id || String(t.techId || ''),
            name: t.name || t.fullName || t.username || '',
            workload: typeof t.activeTaskCount === 'number' ? t.activeTaskCount : (typeof t.workload === 'number' ? t.workload : undefined),
            isAvailable: (normalizedStatus || '') === 'WORKING',
            status: normalizedStatus
          } as Technician;
          return tech;
        });
        setIsLoadingTechnicians(false);
        return mapped;
      } catch (err) {
        console.error('Failed to fetch technicians', err);
        setIsLoadingTechnicians(false);
        return [] as Technician[];
      }
    };

    // no local mockClaims; we'll use API as source of truth

    const fetchForStatus = async (status: string) => {
      const url = `http://localhost:3000/api/v1/processing-records?status=${status}`;
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) return [] as WarrantyClaim[];
      try {
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        const apiRecords = res.data?.data?.records?.records || [];
        const mapped: WarrantyClaim[] = apiRecords.map((r: any) => {
          const mainTech = r.mainTechnician ? [{ id: r.mainTechnician.userId, name: r.mainTechnician.name, isAvailable: false, workload: typeof r.mainTechnician.activeTaskCount === 'number' ? r.mainTechnician.activeTaskCount : undefined, status: r.mainTechnician.status }] : [];
          const primaryCase = Array.isArray(r.guaranteeCases) && r.guaranteeCases.length > 0 ? r.guaranteeCases[0] : null;
          return {
            vin: r.vin || r.vehicle?.vin || '',
            mileage: r.odometer || 0,
            checkInDate: r.checkInDate || r.check_in_date || new Date().toISOString(),
            caseDescription: primaryCase?.contentGuarantee || '',
            assignedTechnicians: mainTech,
            assignedComponents: [],
            model: r.vehicle?.model?.name || r.model || '',
            serviceCenter: r.createdByStaff?.name || r.serviceCenter || '',
            submissionDate: r.createdAt || new Date().toISOString(),
            estimatedCost: 0,
            priority: r.priority || undefined,
            issueType: primaryCase ? primaryCase.contentGuarantee : '',
            status: r.status || (primaryCase?.status) || status
          } as WarrantyClaim;
        });
        return mapped;
      } catch (err) {
        console.error(`Failed to fetch status ${status}`, err);
        return [] as WarrantyClaim[];
      }
    };

    const fetchAllStatuses = async () => {
      setIsLoadingClaims(true);
      const results = await Promise.all(STATUSES.map(s => fetchForStatus(s)));
      const byStatus: Record<string, WarrantyClaim[]> = {};
      STATUSES.forEach((s, idx) => { byStatus[s] = results[idx] || []; });
      setClaimsByStatus(byStatus);
      setWarrantyClaims(byStatus[activeStatus] || []);
      setIsLoadingClaims(false);
    };

    fetchAllStatuses();

    // Load technicians from API (fetch all statuses on mount so DAY_OFF entries are included)
    refreshTechnicians('').then(() => { });

    const mockWarehouses: Warehouse[] = [
      {
        warehouse_id: '1',
        name: 'Main Parts Warehouse',
        address: '123 Industrial Street, Ho Chi Minh City',
        vehicle_company_id: 'vc1',
        service_center_id: 'sc1',
        priority: 1,
        created_at: '2025-01-15',
        updated_at: '2025-01-15'
      },
      {
        warehouse_id: '2',
        name: 'Emergency Stock Center',
        address: '456 Supply Road, Hanoi',
        vehicle_company_id: 'vc1',
        service_center_id: 'sc2',
        priority: 2,
        created_at: '2025-02-01',
        updated_at: '2025-02-01'
      }
    ];

    const mockTypeComponents: TypeComponent[] = [
      {
        type_component_id: '1',
        name: 'EV Battery Pack 75kWh',
        price: 15000,
        sku: 'BAT-EV-75K',
        category: 'Battery',
        created_at: '2025-01-10',
        updated_at: '2025-01-10'
      },
      {
        type_component_id: '2',
        name: 'Electric Motor Controller',
        price: 3500,
        sku: 'MOT-CTL-001',
        category: 'Motor',
        created_at: '2025-01-12',
        updated_at: '2025-01-12'
      },
      {
        type_component_id: '3',
        name: 'Brake Pad Set',
        price: 250,
        sku: 'BRK-PAD-STD',
        category: 'Brakes',
        created_at: '2025-01-14',
        updated_at: '2025-01-14'
      }
    ];

    const mockStocks: Stock[] = [
      {
        stock_id: '1',
        warehouse_id: '1',
        type_component_id: '1',
        quantity_in_stock: 15,
        quantity_reserved: 3,
        created_at: '2025-01-15',
        updated_at: '2025-10-07',
        warehouse: mockWarehouses[0],
        type_component: mockTypeComponents[0]
      },
      {
        stock_id: '2',
        warehouse_id: '1',
        type_component_id: '2',
        quantity_in_stock: 25,
        quantity_reserved: 5,
        created_at: '2025-01-15',
        updated_at: '2025-10-07',
        warehouse: mockWarehouses[0],
        type_component: mockTypeComponents[1]
      },
      {
        stock_id: '3',
        warehouse_id: '2',
        type_component_id: '3',
        quantity_in_stock: 100,
        quantity_reserved: 20,
        created_at: '2025-02-01',
        updated_at: '2025-10-07',
        warehouse: mockWarehouses[1],
        type_component: mockTypeComponents[2]
      }
    ];

    setWarehouses(mockWarehouses);
    setTypeComponents(mockTypeComponents);
    setStocks(mockStocks);

    return () => { cancelled = true; };
  }, []);

  // Inventory Management Helper Functions
  const handleViewWarehouseDetail = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    // Get stocks for this specific warehouse with component info
    const warehouseSpecificStocks = stocks.filter(stock => stock.warehouse_id === warehouse.warehouse_id);
    setWarehouseStocks(warehouseSpecificStocks);
    setInventoryView('warehouse-detail');
  };

  const handleBackToWarehouses = () => {
    setSelectedWarehouse(null);
    setWarehouseStocks([]);
    setInventoryView('warehouses');
  };

  // CRUD Handlers for Warehouse
  const handleCreateWarehouse = () => {
    setModalMode('create');
    setEditingWarehouse(null);
    setShowWarehouseModal(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setModalMode('edit');
    setEditingWarehouse(warehouse);
    setShowWarehouseModal(true);
  };

  const handleDeleteWarehouse = (warehouseId: string) => {
    if (window.confirm('Are you sure you want to delete this warehouse? This will also delete all associated stock records.')) {
      setWarehouses(prev => prev.filter(w => w.warehouse_id !== warehouseId));
      setStocks(prev => prev.filter(s => s.warehouse_id !== warehouseId));
      alert('Warehouse deleted successfully!');
    }
  };

  const handleSaveWarehouse = (warehouseData: Partial<Warehouse>) => {
    if (modalMode === 'create') {
      const newWarehouse: Warehouse = {
        warehouse_id: Date.now().toString(),
        name: warehouseData.name || '',
        address: warehouseData.address || '',
        vehicle_company_id: warehouseData.vehicle_company_id || 'vc1',
        service_center_id: warehouseData.service_center_id || 'sc1',
        priority: warehouseData.priority || 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setWarehouses(prev => [...prev, newWarehouse]);
      alert('Warehouse created successfully!');
    } else {
      setWarehouses(prev => prev.map(w =>
        w.warehouse_id === editingWarehouse?.warehouse_id
          ? { ...w, ...warehouseData, updated_at: new Date().toISOString() }
          : w
      ));
      alert('Warehouse updated successfully!');
    }
    setShowWarehouseModal(false);
  };

  // CRUD Handlers for Component
  const handleCreateComponent = () => {
    setModalMode('create');
    setEditingComponent(null);
    setShowComponentModal(true);
  };

  const handleEditComponent = (component: TypeComponent) => {
    setModalMode('edit');
    setEditingComponent(component);
    setShowComponentModal(true);
  };

  const handleDeleteComponent = (componentId: string) => {
    if (window.confirm('Are you sure you want to delete this component? This will also delete all associated stock records.')) {
      setTypeComponents(prev => prev.filter(c => c.type_component_id !== componentId));
      setStocks(prev => prev.filter(s => s.type_component_id !== componentId));
      alert('Component deleted successfully!');
    }
  };

  const handleSaveComponent = (componentData: Partial<TypeComponent>) => {
    if (modalMode === 'create') {
      const newComponent: TypeComponent = {
        type_component_id: Date.now().toString(),
        name: componentData.name || '',
        price: componentData.price || 0,
        sku: componentData.sku || '',
        category: componentData.category || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTypeComponents(prev => [...prev, newComponent]);
      alert('Component created successfully!');
    } else {
      setTypeComponents(prev => prev.map(c =>
        c.type_component_id === editingComponent?.type_component_id
          ? { ...c, ...componentData, updated_at: new Date().toISOString() }
          : c
      ));
      // Update stock relations
      setStocks(prev => prev.map(s =>
        s.type_component_id === editingComponent?.type_component_id
          ? { ...s, type_component: { ...s.type_component!, ...componentData, updated_at: new Date().toISOString() } }
          : s
      ));
      alert('Component updated successfully!');
    }
    setShowComponentModal(false);
  };

  // CRUD Handlers for Stock
  const handleCreateStock = () => {
    setModalMode('create');
    setEditingStock(null);
    setShowStockModal(true);
  };

  const handleEditStock = (stock: Stock) => {
    setModalMode('edit');
    setEditingStock(stock);
    setShowStockModal(true);
  };

  const handleDeleteStock = (stockId: string) => {
    if (window.confirm('Are you sure you want to delete this stock record?')) {
      setStocks(prev => prev.filter(s => s.stock_id !== stockId));
      // Update warehouse stocks if in detail view
      if (selectedWarehouse) {
        setWarehouseStocks(prev => prev.filter(s => s.stock_id !== stockId));
      }
      alert('Stock record deleted successfully!');
    }
  };

  const handleSaveStock = (stockData: Partial<Stock>) => {
    if (modalMode === 'create') {
      const selectedWarehouseForStock = selectedWarehouse || warehouses[0];
      const targetWarehouseId = stockData.warehouse_id || selectedWarehouseForStock.warehouse_id;
      const targetComponentId = stockData.type_component_id || '';

      // Check for duplicate warehouse-component combination
      const existingStock = stocks.find(s =>
        s.warehouse_id === targetWarehouseId &&
        s.type_component_id === targetComponentId
      );

      if (existingStock) {
        const warehouse = warehouses.find(w => w.warehouse_id === targetWarehouseId);
        const component = typeComponents.find(c => c.type_component_id === targetComponentId);
        alert(`Stock record already exists for "${component?.name}" in "${warehouse?.name}". Please edit the existing record instead of creating a new one.`);
        return;
      }

      const selectedComponent = typeComponents.find(c => c.type_component_id === targetComponentId);

      const newStock: Stock = {
        stock_id: Date.now().toString(),
        warehouse_id: targetWarehouseId,
        type_component_id: targetComponentId,
        quantity_in_stock: stockData.quantity_in_stock || 0,
        quantity_reserved: stockData.quantity_reserved || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        warehouse: warehouses.find(w => w.warehouse_id === targetWarehouseId),
        type_component: selectedComponent
      };
      setStocks(prev => [...prev, newStock]);
      // Update warehouse stocks if in detail view
      if (selectedWarehouse && newStock.warehouse_id === selectedWarehouse.warehouse_id) {
        setWarehouseStocks(prev => [...prev, newStock]);
      }
      alert('Stock created successfully!');
    } else {
      // For edit mode, check for duplicates but exclude current record
      const targetWarehouseId = stockData.warehouse_id || editingStock?.warehouse_id;
      const targetComponentId = stockData.type_component_id || editingStock?.type_component_id;

      const existingStock = stocks.find(s =>
        s.warehouse_id === targetWarehouseId &&
        s.type_component_id === targetComponentId &&
        s.stock_id !== editingStock?.stock_id
      );

      if (existingStock) {
        const warehouse = warehouses.find(w => w.warehouse_id === targetWarehouseId);
        const component = typeComponents.find(c => c.type_component_id === targetComponentId);
        alert(`Stock record already exists for "${component?.name}" in "${warehouse?.name}". Cannot update to duplicate combination.`);
        return;
      }

      setStocks(prev => prev.map(s =>
        s.stock_id === editingStock?.stock_id
          ? { ...s, ...stockData, updated_at: new Date().toISOString() }
          : s
      ));
      // Update warehouse stocks if in detail view
      if (selectedWarehouse) {
        setWarehouseStocks(prev => prev.map(s =>
          s.stock_id === editingStock?.stock_id
            ? { ...s, ...stockData, updated_at: new Date().toISOString() }
            : s
        ));
      }
      alert('Stock updated successfully!');
    }
    setShowStockModal(false);
  };

  // Helper function to handle phone number input (numbers only)
  const handlePhoneChange = (value: string, setter: (value: string) => void) => {
    // Only allow numbers and remove any non-numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');
    setter(numericValue);
  };

  // Helper functions for warranty claims
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatMileage = (mileage: number) => {
    return `${mileage.toLocaleString('vi-VN')} km`;
  };

  const assignTechnicianToCase = (vin: string, technicianId: string) => {
    const technician = availableTechnicians.find(t => t.id === technicianId);
    if (!technician) return;

    setWarrantyClaims(prev => prev.map(claim =>
      claim.vin === vin
        ? {
          ...claim,
          assignedTechnicians: [...claim.assignedTechnicians, technician]
        }
        : claim
    ));
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

  const getPriorityBadgeVariant = (priority: WarrantyClaim['priority']) => {
    switch (priority) {
      case 'Low':
        return 'outline';
      case 'Medium':
        return 'secondary';
      case 'High':
        return 'default';
      case 'Urgent':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'CHECKED_IN':
      case 'PENDING_DIAGNOSIS':
        return 'secondary';
      case 'IN_PROGRESS':
        return 'default';
      case 'COMPLETED':
      case 'DELIVERED':
        return 'success';
      case 'REJECTED':
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Friendly display labels for various status codes (claims, technicians, components)
  const STATUS_LABELS: Record<string, string> = {
    // Claim statuses
    CHECKED_IN: 'Checked In',
    IN_DIAGNOSIS: 'In Diagnosis',
    WAITING_FOR_PARTS: 'Waiting for Parts',
    IN_REPAIR: 'In Repair',
    COMPLETED: 'Completed',
    PAID: 'Paid',
    CANCELLED: 'Cancelled',

    // Technician statuses
    WORKING: 'Working',
    LEAVE_REQUESTED: 'Leave Requested',
    LEAVE_APPROVED: 'Leave Approved',
    DAY_OFF: 'Day Off',

    // Component assignment statuses (uppercase keys)
    PENDING: 'Pending',
    RESERVED: 'Reserved',
    DISPATCHED: 'Dispatched',
    DELIVERED: 'Delivered',

    // Generic
    UNKNOWN: 'Unknown'
  };

  const getDisplayStatus = (status?: string) => {
    if (!status) return STATUS_LABELS.UNKNOWN;
    const key = String(status).trim().toUpperCase().replace(/\s+/g, '_');
    if (STATUS_LABELS[key]) return STATUS_LABELS[key];
    // Fallback: convert underscored or dashed words to Title Case
    return String(status)
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
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

  // Refresh technicians (callable from UI)
  const refreshTechnicians = async (status = 'WORKING') => {
    setIsLoadingTechnicians(true);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setIsLoadingTechnicians(false);
      return;
    }
    try {
      const url = status ? `http://localhost:3000/api/v1/users/technicians?status=${status}` : `http://localhost:3000/api/v1/users/technicians`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const records = res.data?.data || [];
      const today = new Date().toISOString().slice(0, 10);
      const mapped: Technician[] = records.map((t: any) => {
        const schedule = Array.isArray(t.workSchedule) ? t.workSchedule : [];
        const todayEntry = schedule.find((ws: any) => ws.workDate === today) || schedule[schedule.length - 1];
        const statusToday = todayEntry?.status || (t.status || undefined);
        const normalizedStatus = String(statusToday || '').trim().toUpperCase().replace(/\s+/g, '_') || undefined;
        return {
          id: t.userId || t.id || String(t.techId || ''),
          name: t.name || t.fullName || t.username || '',
          specialty: t.specialty || t.department || undefined,
          experience: t.experience || t.yearsOfExperience || undefined,
          rating: t.rating || undefined,
          workload: t.activeTaskCount || t.workload || t.currentLoad || undefined,
          isAvailable: (normalizedStatus || '') === 'WORKING',
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

  // Change technician status (optimistic UI + persist)
  const changeTechnicianStatus = async (techId: string, newStatus: string) => {
    // update local list optimistically
    setAvailableTechnicians(prev => prev.map(t => t.id === techId ? { ...t, status: newStatus, isAvailable: newStatus === 'WORKING' } : t));

    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) return;
      // assuming backend supports PATCH /users/technicians/:id/status
      await axios.patch(`http://localhost:3000/api/v1/users/technicians/${techId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      console.error('Failed to change technician status', err);
      alert('Failed to change technician status on server.');
      // optional: revert by reloading
      refreshTechnicians();
    }
  };

  const getTechBadgeVariant = (status?: string) => {
    switch ((status || '').toUpperCase()) {
      case 'WORKING':
        return 'success';
      case 'LEAVE_REQUESTED':
        return 'secondary';
      case 'LEAVE_APPROVED':
        return 'default';
      case 'DAY_OFF':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Update claim status locally (and persist to backend if possible)
  const updateClaimStatus = async (vin: string, newStatus: string) => {
    // find the claim across claimsByStatus or warrantyClaims
    let currentClaim: WarrantyClaim | undefined;
    for (const k of Object.keys(claimsByStatus)) {
      const found = claimsByStatus[k]?.find(c => c.vin === vin);
      if (found) {
        currentClaim = found;
        break;
      }
    }
    if (!currentClaim) {
      currentClaim = warrantyClaims.find(c => c.vin === vin);
    }
    if (!currentClaim) return;

    const prevStatus = currentClaim.status || activeStatus;

    // Optimistically update UI: remove from old status and add to new status
    setClaimsByStatus(prev => {
      const next: Record<string, WarrantyClaim[]> = {};
      Object.keys(prev).forEach(k => {
        next[k] = prev[k].filter(c => c.vin !== vin);
      });
      const updated: WarrantyClaim = { ...currentClaim!, status: newStatus };
      next[newStatus] = [updated, ...(next[newStatus] || [])];
      return next;
    });

    setWarrantyClaims(prev => {
      // if active tab was the previous status, remove it
      if (activeStatus === prevStatus) {
        return prev.filter(c => c.vin !== vin);
      }
      // if active tab is the new status, prepend it
      if (activeStatus === newStatus) {
        return [{ ...currentClaim!, status: newStatus }, ...prev];
      }
      return prev;
    });

    setSelectedClaimForDetail(prev => prev && prev.vin === vin ? { ...prev, status: newStatus } : prev);

    // Persist change to backend if possible
    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (token) {
        // Assuming backend supports PATCH /processing-records/:vin/status
        await axios.patch(
          `http://localhost:3000/api/v1/processing-records/${vin}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      console.error('Failed to persist status update', err);
      // Optionally show error to user
      // For now, keep optimistic UI but inform
      alert('Status updated locally but failed to persist to server.');
    }
  };

  // Component Assignment Handlers
  const openComponentAssignmentModal = (vin: string) => {
    setSelectedClaimForComponents(vin);
    setShowComponentAssignmentModal(true);
    setSelectedWarehouseForAssignment('');
    setSelectedComponentForAssignment('');
    setComponentQuantity(1);
  };

  const closeComponentAssignmentModal = () => {
    setShowComponentAssignmentModal(false);
    setSelectedClaimForComponents('');
    setSelectedWarehouseForAssignment('');
    setSelectedComponentForAssignment('');
    setComponentQuantity(1);
  };

  const getAvailableStock = (warehouseId: string, componentId: string): number => {
    const stock = stocks.find(
      s => s.warehouse_id === warehouseId && s.type_component_id === componentId
    );
    if (!stock) return 0;
    return stock.quantity_in_stock - stock.quantity_reserved;
  };

  const handleAssignComponent = () => {
    if (!selectedWarehouseForAssignment || !selectedComponentForAssignment || componentQuantity <= 0) {
      return;
    }

    const availableStock = getAvailableStock(selectedWarehouseForAssignment, selectedComponentForAssignment);
    if (componentQuantity > availableStock) {
      alert(`Insufficient stock! Only ${availableStock} units available.`);
      return;
    }

    const warehouse = warehouses.find(w => w.warehouse_id === selectedWarehouseForAssignment);
    const component = typeComponents.find(c => c.type_component_id === selectedComponentForAssignment);

    if (!warehouse || !component) return;

    const newAssignment: AssignedComponent = {
      id: `assign-${Date.now()}`,
      warehouse_id: warehouse.warehouse_id,
      warehouse_name: warehouse.name,
      type_component_id: component.type_component_id,
      component_name: component.name,
      component_sku: component.sku,
      quantity: componentQuantity,
      assigned_at: new Date().toISOString(),
      status: 'pending'
    };

    setWarrantyClaims(prev => prev.map(claim => {
      if (claim.vin === selectedClaimForComponents) {
        return {
          ...claim,
          assignedComponents: [...claim.assignedComponents, newAssignment]
        };
      }
      return claim;
    }));

    // Update stock - reserve the quantity
    setStocks(prev => prev.map(stock => {
      if (stock.warehouse_id === selectedWarehouseForAssignment &&
        stock.type_component_id === selectedComponentForAssignment) {
        return {
          ...stock,
          quantity_reserved: stock.quantity_reserved + componentQuantity
        };
      }
      return stock;
    }));

    setSelectedComponentForAssignment('');
    setComponentQuantity(1);
  };

  const handleRemoveAssignedComponent = (vin: string, assignmentId: string) => {
    const claim = warrantyClaims.find(c => c.vin === vin);
    if (!claim) return;

    const assignment = claim.assignedComponents.find(a => a.id === assignmentId);
    if (!assignment) return;

    // Remove the assignment
    setWarrantyClaims(prev => prev.map(c => {
      if (c.vin === vin) {
        return {
          ...c,
          assignedComponents: c.assignedComponents.filter(a => a.id !== assignmentId)
        };
      }
      return c;
    }));

    // Return stock to available
    setStocks(prev => prev.map(stock => {
      if (stock.warehouse_id === assignment.warehouse_id &&
        stock.type_component_id === assignment.type_component_id) {
        return {
          ...stock,
          quantity_reserved: Math.max(0, stock.quantity_reserved - assignment.quantity)
        };
      }
      return stock;
    }));
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

  // Helper function to display value or "None" for null
  const displayValue = (value: string | null) => {
    return value || "None";
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
      // Get token from AuthContext
      const token = localStorage.getItem('ev_warranty_token');

      if (!token) {
        alert('Please login first');
        return;
      }

      // Search for existing customer or create new one (same logic as save)
      let customerData = null;

      const searchResponse = await axios.get(`http://localhost:3000/api/v1/customer/find-customer-with-phone-or-email`, {
        params: {
          phone: ownerForm.phone.trim()
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (searchResponse.data?.data?.customer) {
        // Customer exists
        customerData = searchResponse.data.data.customer;
        console.log('Existing customer found:', customerData);
      } else {
        // Customer doesn't exist, create new one
        const createResponse = await axios.post(`http://localhost:3000/api/v1/customer`, {
          fullName: ownerForm.fullName.trim(),
          email: ownerForm.email.trim(),
          phone: ownerForm.phone.trim(),
          address: ownerForm.address.trim()
        }, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (createResponse.data?.status === 'success') {
          customerData = createResponse.data.data.customer;
          console.log('New customer created:', customerData);
        } else {
          throw new Error('Failed to create customer');
        }
      }

      // Update searchResult with owner information for Save Changes button
      const updatedVehicle = {
        ...searchResult,
        owner: {
          id: customerData.id,
          fullName: customerData.fullName || customerData.fullname,
          email: customerData.email,
          phone: customerData.phone,
          address: customerData.address
        }
      };

      setSearchResult(updatedVehicle);

      // Update form with backend data
      setOwnerForm({
        fullName: customerData.fullName || customerData.fullname || '',
        phone: customerData.phone || '',
        email: customerData.email || '',
        address: customerData.address || ''
      });

      console.log('Owner registered in response body:', updatedVehicle);
      alert('Owner information added to vehicle. Click "Save Changes" to save to backend.');

    } catch (error) {
      console.error('Error registering owner:', error);
      if (error.response?.data?.message) {
        alert(`Failed to register owner: ${error.response.data.message}`);
      } else {
        alert('Failed to register owner. Please try again.');
      }
    }
  };

  const handleUpdateOwnerInBackend = async () => {
    // Validate owner form
    if (!ownerForm.fullName?.trim() || !ownerForm.phone?.trim() || !ownerForm.email?.trim() || !ownerForm.address?.trim()) {
      alert('Please fill in all owner information (Full Name, Phone, Email, Address).');
      return;
    }

    if (!searchResult?.owner?.id) {
      alert('No owner information found. Please register owner first.');
      return;
    }

    try {
      const token = localStorage.getItem('ev_warranty_token');

      if (!token) {
        alert('Please login first');
        return;
      }

      // First, update or create customer with new information
      let customerId = searchResult.owner.id;

      // Check if phone number changed - if so, search for existing customer or create new
      if (ownerForm.phone.trim() !== searchResult.owner.phone) {
        const searchResponse = await axios.get(`http://localhost:3000/api/v1/customer/find-customer-with-phone-or-email`, {
          params: {
            phone: ownerForm.phone.trim()
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (searchResponse.data?.data?.customer) {
          // Customer with new phone exists
          customerId = searchResponse.data.data.customer.id;
        } else {
          // Create new customer with new phone
          const createResponse = await axios.post(`http://localhost:3000/api/v1/customer`, {
            fullName: ownerForm.fullName.trim(),
            email: ownerForm.email.trim(),
            phone: ownerForm.phone.trim(),
            address: ownerForm.address.trim()
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (createResponse.data?.status === 'success') {
            customerId = createResponse.data.data.customer.id;
          } else {
            throw new Error('Failed to create new customer');
          }
        }
      }

      // Prepare request body for update-owner endpoint
      const requestBody = {
        customerId: customerId,
        licensePlate: searchResult.licensePlate || searchResult.licenseplate,
        purchaseDate: searchResult.purchaseDate || searchResult.purchasedate,
        dateOfManufacture: searchResult.dateOfManufacture || searchResult.dateofmanufacture
      };

      console.log('Updating vehicle owner in backend:', requestBody);

      // API call to backend using HTTP PATCH
      const response = await axios.patch(`http://localhost:3000/api/v1/vehicle/${searchResult.vin}/update-owner`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success') {
        console.log('Vehicle owner updated successfully:', response.data);
        alert('Vehicle owner information updated successfully!');

        // Update local state with new owner info
        const updatedVehicle = {
          ...searchResult,
          owner: {
            id: customerId,
            fullName: ownerForm.fullName,
            phone: ownerForm.phone,
            email: ownerForm.email,
            address: ownerForm.address
          }
        };
        setSearchResult(updatedVehicle);

      } else {
        console.error('Unexpected response format:', response.data);
        alert('Unexpected response from server. Please try again.');
      }

    } catch (error) {
      console.error('Error updating vehicle owner:', error);
      if (error.response) {
        console.error('Backend error:', error.response.data);
        const errorMessage = error.response.data.message || 'Server error';

        if (errorMessage.includes('This vehicle has owner')) {
          alert('This vehicle already has an owner registered. The backend currently does not support updating existing owner information. Please contact the administrator for assistance.');
        } else {
          alert(`Failed to update vehicle owner: ${errorMessage}`);
        }
      } else if (error.request) {
        console.error('No response from server:', error.request);
        alert('No response from server. Please check if backend is running.');
      } else {
        console.error('Request error:', error.message);
        alert('An error occurred while updating. Please try again.');
      }
    }
  };

  const handleSaveVehicleData = async () => {
    if (!searchResult) return;

    // Validate required fields
    const placeOfManufacture = searchResult.placeOfManufacture || searchResult.placeofmanufacture;
    const licensePlate = searchResult.licensePlate || searchResult.licenseplate;
    const purchaseDate = searchResult.purchaseDate || searchResult.purchasedate;

    if (!placeOfManufacture || !placeOfManufacture.trim()) {
      alert('Please fill in Place of Manufacture before saving.');
      return;
    }

    if (!licensePlate || !licensePlate.trim()) {
      alert('Please fill in License Plate before saving.');
      return;
    }

    if (!purchaseDate) {
      alert('Please select Purchase Date before saving.');
      return;
    }

    // Debug: Check owner form values
    console.log('Owner form values:', ownerForm);

    // Check if owner information is available in searchResult
    if (!searchResult.owner?.id) {
      alert('Please register owner information first by clicking "Register Owner" button.');
      return;
    }

    try {
      // Get token from AuthContext
      const token = localStorage.getItem('ev_warranty_token');

      if (!token) {
        alert('Please login first');
        return;
      }

      // Use owner ID from searchResult (already validated in Register Owner step)
      const customerId = searchResult.owner.id;

      // Prepare request body for register-owner endpoint
      const requestBody = {
        customerId: customerId,
        licensePlate: licensePlate,
        purchaseDate: purchaseDate,
        dateOfManufacture: searchResult.dateOfManufacture || searchResult.dateofmanufacture
      };

      console.log('Sending vehicle data to backend:', requestBody);
      console.log('Using customer ID:', customerId);

      // API call to backend using HTTP PATCH
      const response = await axios.patch(`http://localhost:3000/api/v1/vehicle/${searchResult.vin}/update-owner`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success') {
        console.log('Vehicle data saved successfully:', response.data);
        alert('Vehicle owner registered successfully!');

        // Close modal and reset states
        setShowVehicleForm(false);
        setSearchResult(null);
        setSearchTerm('');
        setCustomerSearchPhone('');
        setHasSearchedCustomer(false);
        setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
      } else {
        console.error('Unexpected response format:', response.data);
        alert('Unexpected response from server. Please try again.');
      }

    } catch (error) {
      console.error('Error saving vehicle data:', error);
      if (error.response) {
        // Backend returned an error response
        console.error('Backend error:', error.response.data);
        alert(`Failed to save vehicle data: ${error.response.data.message || 'Server error'}`);
      } else if (error.request) {
        // Request was made but no response received
        console.error('No response from server:', error.request);
        alert('No response from server. Please check if backend is running.');
      } else {
        // Something else happened
        console.error('Request error:', error.message);
        alert('An error occurred while saving. Please try again.');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "pending" as const, icon: Clock, text: "Chờ duyệt" },
      approved: { variant: "approved" as const, icon: CheckCircle, text: "Đã duyệt" },
      rejected: { variant: "rejected" as const, icon: XCircle, text: "Từ chối" },
      "in-progress": { variant: "warning" as const, icon: Wrench, text: "Đang sửa" },
      completed: { variant: "success" as const, icon: CheckCircle, text: "Hoàn thành" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="mr-1 h-3 w-3" />
        {config.text}
      </Badge>
    );
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
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{user?.serviceCenter}</Badge>
                <Button variant="outline" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                {hasPermission(user, 'manage_campaigns') && (
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-6">
          {/* Quick Search */}
          <div className="mb-6">
            <div className="flex w-full space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by VIN"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="gradient"
                onClick={handleVinSearch}
              >
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>



          {/* Statistics Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Card key={stat.title} className="shadow-elegant">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">
                          {stat.change}
                        </p>
                      </div>
                      <Icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Main Content */}
          <Tabs defaultValue="claims" className="space-y-6">
            <TabsList className={`grid w-full ${hasPermission(user, 'manage_campaigns') ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="claims">Warranty Claims</TabsTrigger>
              {hasPermission(user, 'register_vehicle') && (
                <TabsTrigger value="vehicles">Inventory Management</TabsTrigger>
              )}
              <TabsTrigger value="repairs">Technician Management</TabsTrigger>
              {hasPermission(user, 'manage_campaigns') && (
                <TabsTrigger value="campaigns">Service Campaigns</TabsTrigger>
              )}
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
                          setActiveStatus(s);
                          setWarrantyClaims(claimsByStatus[s] || []);
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
                          <TableHead>Case</TableHead>
                          <TableHead>Technician Assignment</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {warrantyClaims.map((claim, index) => (
                          <TableRow key={claim.vin}>
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
                            <TableCell className="max-w-xs">
                              <div className="space-y-1">
                                <div className="font-medium text-sm">{claim.issueType}</div>
                                {claim.caseDescription && claim.caseDescription.trim() !== (claim.issueType || '').trim() && (
                                  <div className="text-xs text-muted-foreground line-clamp-2">
                                    {claim.caseDescription}
                                  </div>
                                )}
                                {claim.priority && (
                                  <Badge variant={getPriorityBadgeVariant(claim.priority)} className="text-xs">
                                    {claim.priority === 'Urgent' && '🚨 '}
                                    {claim.priority === 'High' && '🔥 '}
                                    {claim.priority === 'Medium' && '📋 '}
                                    {claim.priority === 'Low' && '📝 '}
                                    {claim.priority}
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
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="ml-1 h-3 w-3 p-0 hover:bg-red-100"
                                        onClick={() => removeTechnicianFromCase(claim.vin, tech.id)}
                                      >
                                        ×
                                      </Button>
                                    </Badge>
                                  ))}
                                  {claim.assignedTechnicians.length === 0 && (
                                    <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Not assigned
                                    </Badge>
                                  )}
                                </div>

                                {/* Assign Technician Button */}
                                {hasPermission(user, 'assign_technicians') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                                    onClick={() => openTechnicianAssignmentModal(claim.vin)}
                                  >
                                    <Users className="h-4 w-4 mr-2" />
                                    Assign Technician
                                  </Button>
                                )}

                                {/* Assign Components Button */}
                                {hasPermission(user, 'assign_technicians') && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mt-2 border-dashed border-green-300 text-green-600 hover:bg-green-50"
                                    onClick={() => openComponentAssignmentModal(claim.vin)}
                                  >
                                    <Package className="h-4 w-4 mr-2" />
                                    Assign Components ({claim.assignedComponents.length})
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

                                {/* Status update select - moves record between status groups */}
                                <Select
                                  onValueChange={(value) => {
                                    if (!value) return;
                                    if (value === claim.status) return;
                                    updateClaimStatus(claim.vin, value);
                                  }}
                                  value={undefined}
                                >
                                  <SelectTrigger className="min-w-[160px]">
                                    <SelectValue placeholder="Update Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUSES.map(s => (
                                      <SelectItem key={s} value={s}>
                                        {getDisplayStatus(s)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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

            <TabsContent value="vehicles" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Inventory Management
                  </CardTitle>
                  <CardDescription>
                    Manage warehouses, components, and stock levels across service centers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Warehouses List View */}
                  {inventoryView === 'warehouses' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="text-2xl font-bold">Warehouses</h3>
                          <p className="text-muted-foreground">Manage your inventory warehouses</p>
                        </div>
                        <Button variant="gradient" onClick={handleCreateWarehouse}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Warehouse
                        </Button>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {warehouses.map((warehouse) => {
                          const warehouseStockCount = stocks.filter(s => s.warehouse_id === warehouse.warehouse_id).length;
                          const totalComponents = stocks.filter(s => s.warehouse_id === warehouse.warehouse_id)
                            .reduce((sum, stock) => sum + stock.quantity_in_stock, 0);

                          return (
                            <Card key={warehouse.warehouse_id} className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                      <Warehouse className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                      <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                                      <Badge variant="outline" className="text-xs mt-1">
                                        Priority {warehouse.priority}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                      {warehouse.address}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-primary">{warehouseStockCount}</div>
                                      <div className="text-xs text-muted-foreground">Component Types</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-green-600">{totalComponents}</div>
                                      <div className="text-xs text-muted-foreground">Total Items</div>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      className="flex-1"
                                      variant="outline"
                                      onClick={() => handleViewWarehouseDetail(warehouse)}
                                    >
                                      <Package className="h-4 w-4 mr-2" />
                                      View Inventory
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditWarehouse(warehouse);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteWarehouse(warehouse.warehouse_id);
                                      }}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>

                      {warehouses.length === 0 && (
                        <div className="text-center py-16">
                          <Warehouse className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No warehouses found</h3>
                          <p className="text-muted-foreground mb-6">Create your first warehouse to start managing inventory</p>
                          <Button variant="gradient" onClick={handleCreateWarehouse}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Warehouse
                          </Button>
                        </div>
                      )}

                      {/* Floating Component Management Button */}
                      <div className="fixed bottom-6 right-6 z-40">
                        <Button
                          variant="gradient"
                          size="lg"
                          className="rounded-full shadow-lg"
                          onClick={handleCreateComponent}
                          title="Add New Component Type"
                        >
                          <Box className="h-5 w-5 mr-2" />
                          Add Component
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Warehouse Detail View */}
                  {inventoryView === 'warehouse-detail' && selectedWarehouse && (
                    <div className="space-y-6">
                      {/* Header with Back Button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button variant="outline" onClick={handleBackToWarehouses}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Warehouses
                          </Button>
                          <div>
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                              <Warehouse className="h-6 w-6 text-primary" />
                              {selectedWarehouse.name}
                            </h3>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                              <MapPin className="h-4 w-4" />
                              {selectedWarehouse.address}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => handleEditWarehouse(selectedWarehouse!)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Warehouse
                          </Button>
                          <Button variant="gradient" onClick={handleCreateStock}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Stock
                          </Button>
                        </div>
                      </div>

                      {/* Warehouse Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-primary">{warehouseStocks.length}</div>
                            <div className="text-sm text-muted-foreground">Component Types</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {warehouseStocks.reduce((sum, stock) => sum + stock.quantity_in_stock, 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Total Stock</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-amber-600">
                              {warehouseStocks.reduce((sum, stock) => sum + stock.quantity_reserved, 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Reserved</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {warehouseStocks.reduce((sum, stock) => sum + (stock.quantity_in_stock - stock.quantity_reserved), 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Available</div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Components Inventory Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Box className="h-5 w-5" />
                            Inventory Details
                          </CardTitle>
                          <CardDescription>
                            Components and stock levels in this warehouse
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Component</TableHead>
                                  <TableHead>SKU</TableHead>
                                  <TableHead>Category</TableHead>
                                  <TableHead>Unit Price</TableHead>
                                  <TableHead>In Stock</TableHead>
                                  <TableHead>Reserved</TableHead>
                                  <TableHead>Available</TableHead>
                                  <TableHead>Value</TableHead>
                                  <TableHead>Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {warehouseStocks.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8">
                                      <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                      <p className="text-muted-foreground">No components in this warehouse</p>
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  warehouseStocks.map((stock) => {
                                    const component = stock.type_component;
                                    const available = stock.quantity_in_stock - stock.quantity_reserved;
                                    const totalValue = stock.quantity_in_stock * (component?.price || 0);

                                    return (
                                      <TableRow key={stock.stock_id} className="hover:bg-muted/50">
                                        <TableCell>
                                          <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-md">
                                              <Box className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                              <div className="font-medium">{component?.name || 'Unknown'}</div>
                                              <div className="text-sm text-muted-foreground">
                                                Updated {new Date(stock.updated_at).toLocaleDateString('en-US')}
                                              </div>
                                            </div>
                                          </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                          {component?.sku || 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline">{component?.category || 'N/A'}</Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                          ${component?.price?.toLocaleString() || '0'}
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="secondary" className="font-mono">
                                            {stock.quantity_in_stock}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge variant="outline" className="font-mono">
                                            {stock.quantity_reserved}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={available > 0 ? 'default' : 'destructive'}
                                            className="font-mono"
                                          >
                                            {available}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="font-semibold text-green-600">
                                          ${totalValue.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex space-x-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleEditStock(stock)}
                                              title="Edit Stock"
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleDeleteStock(stock.stock_id)}
                                              title="Delete Stock"
                                            >
                                              <Trash className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
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
                    {['WORKING', 'LEAVE_REQUESTED', 'LEAVE_APPROVED', 'DAY_OFF', 'ALL'].map(s => {
                      const count = s === 'ALL' ? availableTechnicians.length : availableTechnicians.filter(t => (t.status || (t.isAvailable ? 'WORKING' : 'OFF')) === s).length;
                      return (
                        <Button
                          key={s}
                          size="sm"
                          variant={s === (typeof techFilterStatus !== 'undefined' ? techFilterStatus : 'WORKING') ? 'default' : 'outline'}
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
                        {(techFilterStatus && techFilterStatus !== 'ALL' ? availableTechnicians.filter(t => (t.status || (t.isAvailable ? 'WORKING' : 'OFF')) === techFilterStatus) : availableTechnicians).map(tech => (
                          <TableRow key={tech.id}>
                            <TableCell>{tech.name}</TableCell>
                            <TableCell>{typeof tech.workload === 'number' ? tech.workload : '-'}</TableCell>
                            <TableCell>
                              <Badge variant={tech.isAvailable ? 'success' : 'outline'} className="text-xs">
                                {getDisplayStatus(tech.status || (tech.isAvailable ? 'WORKING' : 'OFF'))}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Select onValueChange={(val) => {
                                  if (!val) return;
                                  if (val === 'DAY_OFF') {
                                    if (!confirm('Mark technician as DAY_OFF?')) return;
                                  }
                                  changeTechnicianStatus(tech.id, val);
                                }} value={undefined}>
                                  <SelectTrigger className="min-w-[140px]">
                                    <SelectValue placeholder="Change status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="WORKING">{getDisplayStatus('WORKING')}</SelectItem>
                                    <SelectItem value="LEAVE_REQUESTED">{getDisplayStatus('LEAVE_REQUESTED')}</SelectItem>
                                    <SelectItem value="LEAVE_APPROVED">{getDisplayStatus('LEAVE_APPROVED')}</SelectItem>
                                    <SelectItem value="DAY_OFF">{getDisplayStatus('DAY_OFF')}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Service Campaigns</CardTitle>
                  <CardDescription>
                    Manage recall campaigns and customer notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <h3 className="font-semibold">Battery Software Update Campaign</h3>
                        <p className="text-sm text-muted-foreground">
                          Affects 2022-2023 EV models - Critical safety update
                        </p>
                      </div>
                      {hasPermission(user, 'manage_campaigns') && (
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Send Notifications</Button>
                          <Button variant="default" size="sm">Manage Schedule</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals */}
        {showNewClaim && (
          <NewClaim onClose={() => setShowNewClaim(false)} />
        )}
        {showRegisterVehicle && (
          <RegisterVehicle onClose={() => setShowRegisterVehicle(false)} />
        )}
        {showAddCustomer && (
          <AddCustomer onClose={() => setShowAddCustomer(false)} />
        )}
        {showAttachParts && (
          <AttachParts onClose={() => setShowAttachParts(false)} />
        )}
        {showClaimDetails && (
          <ClaimDetails
            claimId={selectedClaimId}
            onClose={() => setShowClaimDetails(false)}
            onUpdateStatus={() => {
              setShowClaimDetails(false);
              setShowUpdateStatus(true);
            }}
          />
        )}
        {showUpdateStatus && (
          <UpdateClaimStatus
            claimId={selectedClaimId}
            currentStatus={selectedClaimStatus}
            onClose={() => setShowUpdateStatus(false)}
            onStatusUpdated={handleStatusUpdated}
          />
        )}

        {/* Vehicle Information Modal */}
        {showVehicleForm && searchResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Car className="h-5 w-5 text-primary" />
                      <span>Vehicle Information</span>
                    </CardTitle>
                    <CardDescription>
                      Edit vehicle details and owner information
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowVehicleForm(false);
                      setSearchResult(null);
                      setSearchTerm('');
                      // Reset customer search states when closing modal
                      setCustomerSearchPhone('');
                      setHasSearchedCustomer(false);
                      setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                {/* Vehicle Details Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Vehicle Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">VIN Number</label>
                      <Input
                        value={searchResult.vin}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Manufacture</label>
                      <Input
                        value={formatDate(searchResult.dateOfManufacture)}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Place of Manufacture</label>
                      <Input
                        value={searchResult.placeOfManufacture || searchResult.placeofmanufacture || ""}
                        onChange={(e) => setSearchResult(prev => ({
                          ...prev,
                          placeOfManufacture: e.target.value,
                          placeofmanufacture: e.target.value
                        }))}
                        placeholder="Enter place of manufacture"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">License Plate</label>
                      <Input
                        value={searchResult.licensePlate || searchResult.licenseplate || ""}
                        onChange={(e) => setSearchResult(prev => ({
                          ...prev,
                          licensePlate: e.target.value,
                          licenseplate: e.target.value
                        }))}
                        placeholder="Enter license plate"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Purchase Date</label>
                      <Input
                        type="date"
                        value={searchResult.purchaseDate || searchResult.purchasedate ?
                          new Date(searchResult.purchaseDate || searchResult.purchasedate).toISOString().split('T')[0] : ""}
                        onChange={(e) => setSearchResult(prev => ({
                          ...prev,
                          purchaseDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                          purchasedate: e.target.value ? new Date(e.target.value).toISOString() : null
                        }))}
                        placeholder="Select purchase date"
                      />
                    </div>
                  </div>
                </div>

                {/* Owner Information Form */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Owner Information</h3>
                  {searchResult.owner ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Badge variant="success">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Registered Owner
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Full Name</label>
                          <Input
                            value={searchResult.owner?.fullName || searchResult.owner?.fullname || ''}
                            onChange={(e) => setSearchResult(prev => ({
                              ...prev,
                              owner: { ...prev.owner, fullName: e.target.value, fullname: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Phone Number</label>
                          <Input
                            value={searchResult.owner?.phone || ''}
                            onChange={(e) => handlePhoneChange(e.target.value, (phone) => setSearchResult(prev => ({
                              ...prev,
                              owner: { ...prev.owner, phone }
                            })))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Email</label>
                          <Input
                            type="email"
                            value={searchResult.owner?.email || ''}
                            onChange={(e) => setSearchResult(prev => ({
                              ...prev,
                              owner: { ...prev.owner, email: e.target.value }
                            }))}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Address</label>
                          <Input
                            value={searchResult.owner?.address || ''}
                            onChange={(e) => setSearchResult(prev => ({
                              ...prev,
                              owner: { ...prev.owner, address: e.target.value }
                            }))}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <p className="text-warning font-medium">This car is unowned</p>
                      </div>

                      {/* Customer Search Section */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">Search Existing Customer</label>
                          <div className="flex space-x-2">
                            <Input
                              placeholder="Enter customer phone number"
                              value={customerSearchPhone}
                              onChange={(e) => handlePhoneChange(e.target.value, setCustomerSearchPhone)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={handleSearchCustomer}
                              disabled={isSearchingCustomer || !customerSearchPhone.trim()}
                              className="px-6"
                            >
                              {isSearchingCustomer ? (
                                <><Clock className="mr-2 h-4 w-4 animate-spin" />Searching...</>
                              ) : (
                                <><Search className="mr-2 h-4 w-4" />Search</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Owner Form Fields - Only show after search button is clicked */}
                      {hasSearchedCustomer && (
                        <>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Full Name *</label>
                              <Input
                                placeholder="Enter owner full name"
                                value={ownerForm.fullName}
                                onChange={(e) => setOwnerForm(prev => ({ ...prev, fullName: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Phone Number *</label>
                              <Input
                                placeholder="Enter phone number"
                                value={ownerForm.phone}
                                onChange={(e) => handlePhoneChange(e.target.value, (phone) => setOwnerForm(prev => ({ ...prev, phone })))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Email</label>
                              <Input
                                placeholder="Enter email address"
                                type="email"
                                value={ownerForm.email}
                                onChange={(e) => setOwnerForm(prev => ({ ...prev, email: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Address</label>
                              <Input
                                placeholder="Enter address"
                                value={ownerForm.address}
                                onChange={(e) => setOwnerForm(prev => ({ ...prev, address: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="flex justify-start gap-2">
                            <Button
                              variant="gradient"
                              onClick={handleRegisterOwner}
                              disabled={!ownerForm.fullName || !ownerForm.phone}
                            >
                              <User className="mr-2 h-4 w-4" />
                              {searchResult?.owner ? 'Update Owner Info' : 'Register Owner'}
                            </Button>
                            {searchResult?.owner && (
                              <Button
                                variant="outline"
                                onClick={handleUpdateOwnerInBackend}
                                disabled={!ownerForm.fullName || !ownerForm.phone}
                              >
                                <Save className="mr-2 h-4 w-4" />
                                Update Changes
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Modal Footer */}
              <div className="border-t p-6">
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={handleSaveVehicleData}
                    disabled={
                      !searchResult ||
                      !(searchResult.placeOfManufacture || searchResult.placeofmanufacture)?.trim() ||
                      !(searchResult.licensePlate || searchResult.licenseplate)?.trim() ||
                      !(searchResult.purchaseDate || searchResult.purchasedate) ||
                      !searchResult.owner?.id
                    }
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowVehicleForm(false);
                      setSearchResult(null);
                      setSearchTerm('');
                      // Reset customer search states when closing modal
                      setCustomerSearchPhone('');
                      setHasSearchedCustomer(false);
                      setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Toast Notification for Vehicle Not Found */}
        {showNotFoundToast && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right duration-300">
            <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg border border-destructive/20 flex items-center space-x-2 min-w-[300px]">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm">Vehicle not found</p>
                <p className="text-xs opacity-90">VIN "{searchTerm}" does not exist in the system</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive-foreground hover:bg-destructive-foreground/20"
                onClick={() => setShowNotFoundToast(false)}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Claim Detail Modal */}
        <Dialog open={showClaimDetailModal} onOpenChange={setShowClaimDetailModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5 text-blue-600" />
                Warranty Claim Details
              </DialogTitle>
              <DialogDescription>
                Complete information for warranty claim
              </DialogDescription>
            </DialogHeader>

            {selectedClaimForDetail && (
              <div className="space-y-6 mt-6">
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusBadgeVariant(selectedClaimForDetail.status)} className="text-sm">
                    {selectedClaimForDetail.status || 'UNKNOWN'}
                  </Badge>
                </div>
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Car className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">VIN</label>
                          <p className="font-mono text-base font-semibold">{selectedClaimForDetail.vin}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Vehicle Model</label>
                          <p className="text-base">{selectedClaimForDetail.model}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            Mileage
                          </label>
                          <p className="text-base font-semibold">{selectedClaimForDetail.mileage.toLocaleString()} km</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Check-in Date
                          </label>
                          <p className="text-base">{new Date(selectedClaimForDetail.checkInDate).toLocaleDateString('en-US')}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            Service Center
                          </label>
                          <p className="text-base">{selectedClaimForDetail.serviceCenter}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Estimated Cost
                          </label>
                          <p className="text-base font-semibold text-green-600">
                            {selectedClaimForDetail.estimatedCost.toLocaleString()} VND
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Issue Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertCircle className="h-5 w-5" />
                      Issue Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          Issue Type
                        </label>
                        <p className="text-base font-semibold">{selectedClaimForDetail.issueType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Priority Level</label>
                        <div className="mt-1">
                          {selectedClaimForDetail.priority && (
                            <Badge variant={getPriorityBadgeVariant(selectedClaimForDetail.priority)} className="text-sm">
                              {selectedClaimForDetail.priority === 'Urgent' && '🚨 '}
                              {selectedClaimForDetail.priority === 'High' && '🔥 '}
                              {selectedClaimForDetail.priority === 'Medium' && '📋 '}
                              {selectedClaimForDetail.priority === 'Low' && '📝 '}
                              {selectedClaimForDetail.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {selectedClaimForDetail.caseDescription && selectedClaimForDetail.caseDescription.trim() !== (selectedClaimForDetail.issueType || '').trim() && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Case Description</label>
                          <div className="mt-2 p-4 bg-muted rounded-lg">
                            <p className="text-base leading-relaxed">{selectedClaimForDetail.caseDescription}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Technicians */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Users className="h-5 w-5" />
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

                {/* Assigned Components */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="h-5 w-5" />
                        Assigned Components ({selectedClaimForDetail.assignedComponents.length})
                      </CardTitle>
                      {hasPermission(user, 'assign_technicians') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowClaimDetailModal(false);
                            openComponentAssignmentModal(selectedClaimForDetail.vin);
                          }}
                          className="border-dashed border-green-300 text-green-600 hover:bg-green-50"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Assign Components
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedClaimForDetail.assignedComponents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedClaimForDetail.assignedComponents.map((comp) => (
                          <Card key={comp.id} className="border-dashed border-green-200">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Box className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold">{comp.component_name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {comp.component_sku}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                      <p className="text-muted-foreground flex items-center gap-1">
                                        <Warehouse className="h-3 w-3" />
                                        Warehouse
                                      </p>
                                      <p className="font-medium">{comp.warehouse_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Quantity</p>
                                      <p className="font-medium">{comp.quantity} units</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Status</p>
                                      <Badge
                                        variant={
                                          comp.status === 'pending' ? 'secondary' :
                                            comp.status === 'reserved' ? 'default' :
                                              comp.status === 'dispatched' ? 'outline' : 'default'
                                        }
                                        className="text-xs"
                                      >
                                        {comp.status}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Assigned At</p>
                                      <p className="text-xs">{new Date(comp.assigned_at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No components assigned yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Click "Assign Components" to allocate parts from inventory
                        </p>
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
                  {selectedCaseForAssignment && (
                    <span>
                      VIN: <span className="font-mono font-medium">{selectedCaseForAssignment}</span> -
                      Issue: <span className="font-medium">
                        {warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.issueType}
                      </span>
                    </span>
                  )}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refreshTechnicians('WORKING')}>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-4 w-4 p-0 hover:bg-red-100"
                            onClick={() => removeTechnicianFromCase(selectedCaseForAssignment, tech.id)}
                          >
                            ×
                          </Button>
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

        {/* Component Assignment Modal */}
        <Dialog open={showComponentAssignmentModal} onOpenChange={closeComponentAssignmentModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Assign Components to Claim
              </DialogTitle>
              <DialogDescription>
                {selectedClaimForComponents && (
                  <span>
                    VIN: <span className="font-mono font-medium">{selectedClaimForComponents}</span> -
                    Issue: <span className="font-medium">
                      {warrantyClaims.find(c => c.vin === selectedClaimForComponents)?.issueType}
                    </span>
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Currently Assigned Components */}
              {selectedClaimForComponents && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Currently Assigned Components ({warrantyClaims.find(c => c.vin === selectedClaimForComponents)?.assignedComponents.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {warrantyClaims.find(c => c.vin === selectedClaimForComponents)?.assignedComponents.length ? (
                      <div className="space-y-2">
                        {warrantyClaims.find(c => c.vin === selectedClaimForComponents)?.assignedComponents.map((comp) => (
                          <div key={comp.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{comp.component_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {comp.component_sku}
                                </Badge>
                                <Badge
                                  variant={
                                    comp.status === 'pending' ? 'secondary' :
                                      comp.status === 'reserved' ? 'default' :
                                        comp.status === 'dispatched' ? 'outline' : 'default'
                                  }
                                  className="text-xs"
                                >
                                  {getDisplayStatus(comp.status)}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Warehouse className="h-3 w-3" />
                                  {comp.warehouse_name}
                                </span>
                                <span>Qty: {comp.quantity}</span>
                                <span className="text-xs">{new Date(comp.assigned_at).toLocaleString()}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleRemoveAssignedComponent(selectedClaimForComponents, comp.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No components assigned yet</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Assign New Component */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Assign New Component</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Warehouse Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Warehouse</label>
                    <Select value={selectedWarehouseForAssignment} onValueChange={setSelectedWarehouseForAssignment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map(warehouse => (
                          <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                            <div className="flex items-center gap-2">
                              <Warehouse className="h-4 w-4" />
                              {warehouse.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Component Selection (filtered by warehouse) */}
                  {selectedWarehouseForAssignment && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Select Component</label>
                      <Select
                        value={selectedComponentForAssignment}
                        onValueChange={setSelectedComponentForAssignment}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a component" />
                        </SelectTrigger>
                        <SelectContent>
                          {stocks
                            .filter(s => s.warehouse_id === selectedWarehouseForAssignment)
                            .map(stock => {
                              const component = typeComponents.find(c => c.type_component_id === stock.type_component_id);
                              const availableStock = stock.quantity_in_stock - stock.quantity_reserved;
                              if (!component) return null;
                              return (
                                <SelectItem
                                  key={stock.stock_id}
                                  value={component.type_component_id}
                                  disabled={availableStock <= 0}
                                >
                                  <div className="flex items-center justify-between w-full gap-4">
                                    <span>{component.name}</span>
                                    <span className="text-xs">
                                      <Badge variant={availableStock > 5 ? 'default' : availableStock > 0 ? 'secondary' : 'destructive'}>
                                        Stock: {availableStock}
                                      </Badge>
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quantity Input with Stock Info */}
                  {selectedComponentForAssignment && selectedWarehouseForAssignment && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">Quantity</label>
                        <span className="text-xs text-muted-foreground">
                          Available: {getAvailableStock(selectedWarehouseForAssignment, selectedComponentForAssignment)} units
                        </span>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        max={getAvailableStock(selectedWarehouseForAssignment, selectedComponentForAssignment)}
                        value={componentQuantity}
                        onChange={(e) => setComponentQuantity(parseInt(e.target.value) || 1)}
                        className="w-full"
                      />
                      {componentQuantity > getAvailableStock(selectedWarehouseForAssignment, selectedComponentForAssignment) && (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠️ Insufficient stock! Only {getAvailableStock(selectedWarehouseForAssignment, selectedComponentForAssignment)} units available.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Assign Button */}
                  <Button
                    onClick={handleAssignComponent}
                    disabled={!selectedWarehouseForAssignment || !selectedComponentForAssignment || componentQuantity <= 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Component
                  </Button>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Warehouse CRUD Modal */}
        <Dialog open={showWarehouseModal} onOpenChange={setShowWarehouseModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {modalMode === 'create' ? 'Add New Warehouse' : 'Edit Warehouse'}
              </DialogTitle>
              <DialogDescription>
                {modalMode === 'create' ? 'Create a new warehouse for inventory management' : 'Update warehouse information'}
              </DialogDescription>
            </DialogHeader>
            <WarehouseForm
              warehouse={editingWarehouse}
              mode={modalMode}
              onSave={handleSaveWarehouse}
              onCancel={() => setShowWarehouseModal(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Component CRUD Modal */}
        <Dialog open={showComponentModal} onOpenChange={setShowComponentModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {modalMode === 'create' ? 'Add New Component' : 'Edit Component'}
              </DialogTitle>
              <DialogDescription>
                {modalMode === 'create' ? 'Create a new component type' : 'Update component information'}
              </DialogDescription>
            </DialogHeader>
            <ComponentForm
              component={editingComponent}
              mode={modalMode}
              onSave={handleSaveComponent}
              onCancel={() => setShowComponentModal(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Stock CRUD Modal */}
        <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {modalMode === 'create' ? 'Add New Stock' : 'Edit Stock'}
              </DialogTitle>
              <DialogDescription>
                {modalMode === 'create' ? 'Add stock for a component' : 'Update stock quantities'}
              </DialogDescription>
            </DialogHeader>
            <StockForm
              stock={editingStock}
              warehouses={warehouses}
              components={typeComponents}
              selectedWarehouse={selectedWarehouse}
              existingStocks={stocks}
              mode={modalMode}
              onSave={handleSaveStock}
              onCancel={() => setShowStockModal(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

// Form Components
interface WarehouseFormProps {
  warehouse: Warehouse | null;
  mode: 'create' | 'edit';
  onSave: (data: Partial<Warehouse>) => void;
  onCancel: () => void;
}

const WarehouseForm: React.FC<WarehouseFormProps> = ({ warehouse, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: warehouse?.name || '',
    address: warehouse?.address || '',
    priority: warehouse?.priority || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Warehouse Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter warehouse name"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Address *</label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter warehouse address"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Priority</label>
        <Select value={formData.priority.toString()} onValueChange={(value) => setFormData({ ...formData, priority: parseInt(value) })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Priority 1 (Highest)</SelectItem>
            <SelectItem value="2">Priority 2</SelectItem>
            <SelectItem value="3">Priority 3</SelectItem>
            <SelectItem value="4">Priority 4</SelectItem>
            <SelectItem value="5">Priority 5 (Lowest)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {mode === 'create' ? 'Create Warehouse' : 'Update Warehouse'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

interface ComponentFormProps {
  component: TypeComponent | null;
  mode: 'create' | 'edit';
  onSave: (data: Partial<TypeComponent>) => void;
  onCancel: () => void;
}

const ComponentForm: React.FC<ComponentFormProps> = ({ component, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: component?.name || '',
    sku: component?.sku || '',
    category: component?.category || '',
    price: component?.price || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim() || !formData.category.trim()) {
      alert('Please fill in all required fields');
      return;
    }
    if (formData.price <= 0) {
      alert('Price must be greater than 0');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Component Name *</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter component name"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">SKU *</label>
        <Input
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          placeholder="Enter SKU code"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Category *</label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Battery">Battery</SelectItem>
            <SelectItem value="Motor">Motor</SelectItem>
            <SelectItem value="Brakes">Brakes</SelectItem>
            <SelectItem value="Electronics">Electronics</SelectItem>
            <SelectItem value="Body">Body Parts</SelectItem>
            <SelectItem value="Interior">Interior</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Price ($) *</label>
        <Input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          placeholder="Enter price"
          min="0.01"
          step="0.01"
          required
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {mode === 'create' ? 'Create Component' : 'Update Component'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

interface StockFormProps {
  stock: Stock | null;
  warehouses: Warehouse[];
  components: TypeComponent[];
  selectedWarehouse: Warehouse | null;
  existingStocks: Stock[];
  mode: 'create' | 'edit';
  onSave: (data: Partial<Stock>) => void;
  onCancel: () => void;
}

const StockForm: React.FC<StockFormProps> = ({ stock, warehouses, components, selectedWarehouse, existingStocks, mode, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    warehouse_id: stock?.warehouse_id || selectedWarehouse?.warehouse_id || warehouses[0]?.warehouse_id || '',
    type_component_id: stock?.type_component_id || '',
    quantity_in_stock: stock?.quantity_in_stock || 0,
    quantity_reserved: stock?.quantity_reserved || 0
  });

  // Get existing stocks for selected warehouse
  const getExistingComponentIds = (warehouseId: string) => {
    return existingStocks
      .filter(s => s.warehouse_id === warehouseId && (mode === 'edit' ? s.stock_id !== stock?.stock_id : true))
      .map(s => s.type_component_id);
  };

  // Check if component already has stock in selected warehouse
  const isComponentDuplicate = (componentId: string, warehouseId: string) => {
    if (mode === 'edit' && stock?.stock_id) {
      return existingStocks.some(s =>
        s.warehouse_id === warehouseId &&
        s.type_component_id === componentId &&
        s.stock_id !== stock.stock_id
      );
    }
    return existingStocks.some(s =>
      s.warehouse_id === warehouseId &&
      s.type_component_id === componentId
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.warehouse_id || !formData.type_component_id) {
      alert('Please select warehouse and component');
      return;
    }
    if (formData.quantity_in_stock < 0 || formData.quantity_reserved < 0) {
      alert('Quantities cannot be negative');
      return;
    }
    if (formData.quantity_reserved > formData.quantity_in_stock) {
      alert('Reserved quantity cannot exceed in-stock quantity');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Warehouse *</label>
        <Select
          value={formData.warehouse_id}
          onValueChange={(value) => setFormData({
            ...formData,
            warehouse_id: value,
            // Reset component selection when warehouse changes in create mode
            type_component_id: mode === 'create' ? '' : formData.type_component_id
          })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select warehouse" />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map(warehouse => {
              const stockCount = existingStocks.filter(s => s.warehouse_id === warehouse.warehouse_id).length;
              return (
                <SelectItem key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                  <div className="flex items-center justify-between w-full">
                    <span>{warehouse.name}</span>
                    {stockCount > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({stockCount} components)
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Component *</label>
        <Select value={formData.type_component_id} onValueChange={(value) => setFormData({ ...formData, type_component_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select component" />
          </SelectTrigger>
          <SelectContent>
            {components.map(component => {
              const isDuplicate = isComponentDuplicate(component.type_component_id, formData.warehouse_id);
              const existingStock = existingStocks.find(s =>
                s.warehouse_id === formData.warehouse_id &&
                s.type_component_id === component.type_component_id
              );

              return (
                <SelectItem
                  key={component.type_component_id}
                  value={component.type_component_id}
                  disabled={isDuplicate && mode === 'create'}
                  className={isDuplicate && mode === 'create' ? "opacity-50" : ""}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{component.name} ({component.sku})</span>
                    {isDuplicate && mode === 'create' && (
                      <span className="text-xs text-amber-600 ml-2">
                        (Stock: {existingStock?.quantity_in_stock || 0})
                      </span>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {mode === 'create' && formData.warehouse_id && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-2">
              Components already in stock are disabled. Edit existing records instead.
            </div>
            {getExistingComponentIds(formData.warehouse_id).length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-xs font-medium mb-2">Existing Stock in This Warehouse:</div>
                <div className="space-y-1">
                  {existingStocks
                    .filter(s => s.warehouse_id === formData.warehouse_id)
                    .map(s => (
                      <div key={s.stock_id} className="flex justify-between text-xs">
                        <span>{s.type_component?.name} ({s.type_component?.sku})</span>
                        <span className="text-primary font-medium">{s.quantity_in_stock} units</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Quantity in Stock *</label>
        <Input
          type="number"
          value={formData.quantity_in_stock}
          onChange={(e) => setFormData({ ...formData, quantity_in_stock: parseInt(e.target.value) || 0 })}
          placeholder="Enter quantity"
          min="0"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Reserved Quantity</label>
        <Input
          type="number"
          value={formData.quantity_reserved}
          onChange={(e) => setFormData({ ...formData, quantity_reserved: parseInt(e.target.value) || 0 })}
          placeholder="Enter reserved quantity"
          min="0"
          max={formData.quantity_in_stock}
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {mode === 'create' ? 'Create Stock' : 'Update Stock'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ServiceCenterDashboard;