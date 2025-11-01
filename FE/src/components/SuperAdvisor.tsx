
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Search, LogOut, Plus, Edit, Wrench, CheckCircle, Car, Trash2, User, XCircle, Save, Clock, FileText, Shield } from 'lucide-react';


// API Base URL
const API_BASE_URL = 'http://localhost:3000/api/v1';



// API service function for creating processing record
const createProcessingRecord = async (recordData: {
  vin: string;
  odometer: number;
  guaranteeCases: { contentGuarantee: string }[];
}) => {
  const token = localStorage.getItem("ev_warranty_token");
  
  const response = await fetch(`${API_BASE_URL}/processing-records`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(recordData)
  });
  
  const result = await response.json();
  
  // Check for API errors
  if (!response.ok || result.status === 'error') {
    throw new Error(result.message || 'API call failed');
  }
  
  return result;
};

// API service function for fetching processing records
const fetchProcessingRecords = async () => {
  const token = localStorage.getItem("ev_warranty_token");
  
  const response = await fetch(`${API_BASE_URL}/processing-records`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  
  // Check for API errors
  if (!response.ok || result.status === 'error') {
    throw new Error(result.message || 'Failed to fetch processing records');
  }
  
  return result;
};

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

interface CaseNote {
  id: string;
  text: string;
  createdAt: string;
}

interface WarrantyRecord {
  id: string;
  vinNumber: string;
  customerName: string;
  customerEmail?: string;
  odometer: number;
  purchaseDate?: string;
  cases?: CaseNote[];
  status: 'pending' | 'in-progress' | 'completed';
  rawStatus?: string; // Store actual API status
  createdAt: string;
}

interface VinDataState {
  vinNumber: string;
  warrantyStatus: string;
}

interface VehicleSearchResult {
  vin: string;
  dateOfManufacture: string;
  placeOfManufacture?: string;
  model?: string;
  company?: string;
  licensePlate?: string;
  purchaseDate?: string;
  owner?: {
    id: string;
    fullName: string;
    phone: string;
    email: string;
    address: string;
  };
}

interface OwnerForm {
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

const SuperAdvisor = () => {
  const { logout, getToken } = useAuth();
  const { toast } = useToast();
  
  // UI State
  const [searchVin, setSearchVin] = useState('');
  const [searchMode, setSearchMode] = useState<'warranty' | 'customer' | 'phone'>('phone');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddNewcaseOpen, setIsAddNewcaseOpen] = useState(false);
  const [isDialogSearch, setIsDialogSearch] = useState(false);
  
  // Record State
  const [selectedRecord, setSelectedRecord] = useState<WarrantyRecord | null>(null);
  const [currentCaseText, setCurrentCaseText] = useState('');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  
  // Form States
  const [vinData, setVinData] = useState<VinDataState>({
    vinNumber: "",
    warrantyStatus: ""
  });
  const [vehicleSearchResult, setVehicleSearchResult] = useState<VehicleSearchResult | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [ownerForm, setOwnerForm] = useState<OwnerForm>({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  });

  // Customer search states
  const [customerSearchPhone, setCustomerSearchPhone] = useState('');
  const [registrationFlowPhone, setRegistrationFlowPhone] = useState(''); // Phone from Register New Vehicle flow
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [hasSearchedCustomer, setHasSearchedCustomer] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: ''
  });
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);

  // Caseline dialog states
  const [showCaselineDialog, setShowCaselineDialog] = useState(false);
  const [selectedRecordForCaseline, setSelectedRecordForCaseline] = useState<WarrantyRecord | null>(null);
  const [caselines, setCaselines] = useState<any[]>([]);
  const [isLoadingCaselines, setIsLoadingCaselines] = useState(false);
  const [selectedCaselineIds, setSelectedCaselineIds] = useState<{
    approved: string[];
    rejected: string[];
  }>({ approved: [], rejected: [] });
  const [isProcessingCaselines, setIsProcessingCaselines] = useState(false);

  // Warranty dialog states
  const [showWarrantyDialog, setShowWarrantyDialog] = useState(false);
  const [warrantyDialogData, setWarrantyDialogData] = useState(null);
  const [currentVehicleForWarranty, setCurrentVehicleForWarranty] = useState(null);

  // Create warranty record dialog states
  const [showCreateWarrantyDialog, setShowCreateWarrantyDialog] = useState(false);
  const [warrantyRecordForm, setWarrantyRecordForm] = useState({
    vin: '',
    odometer: '',
    purchaseDate: '',
    customerName: '',
    cases: [],
    visitorFullName: '',
    visitorPhone: '',
    customerEmail: ''
  });
  const [warrantyRecordCaseText, setWarrantyRecordCaseText] = useState('');
  const [isCreatingRecord, setIsCreatingRecord] = useState(false);

  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Caseline OTP states
  const [caselineApproverEmail, setCaselineApproverEmail] = useState('');
  const [caselineOtpCode, setCaselineOtpCode] = useState('');
  const [isSendingCaselineOtp, setIsSendingCaselineOtp] = useState(false);
  const [caselineOtpSent, setCaselineOtpSent] = useState(false);
  const [caselineOtpVerified, setCaselineOtpVerified] = useState(false);
  const [caselineOtpCountdown, setCaselineOtpCountdown] = useState(0);

  // Warranty check states
  const [odometer, setOdometer] = useState('');
  const [isCheckingWarranty, setIsCheckingWarranty] = useState(false);
  const [warrantyStatus, setWarrantyStatus] = useState<'valid' | 'expired' | null>(null);
  const [warrantyDetails, setWarrantyDetails] = useState(null);

  // States for customer vehicle warranty check in phone mode
  const [selectedVehicleForWarranty, setSelectedVehicleForWarranty] = useState<any>(null);
  const [vehicleOdometer, setVehicleOdometer] = useState('');
  const [isCheckingVehicleWarranty, setIsCheckingVehicleWarranty] = useState(false);
  const [vehicleWarrantyStatus, setVehicleWarrantyStatus] = useState<'valid' | 'expired' | null>(null);
  const [newVehicleVin, setNewVehicleVin] = useState('');

  // Form state for editing record
  const [editRecord, setEditRecord] = useState({
    vinNumber: '',
    odometer: '',
    visitorFullName: '', // Visitor name from visitorInfo
    visitorPhone: '', // Visitor phone (legacy, keeping for compatibility)
    customerEmail: '', // Customer email for OTP
    cases: [] as CaseNote[],
    purchaseDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed',
    rawStatus: 'CHECKED_IN' // Store actual API status
  });

  // Transform form data to API format
  const transformToApiFormat = (formData: { vinNumber: string; odometer: string; cases: CaseNote[] }) => {
    return {
      vin: formData.vinNumber,
      odometer: parseInt(formData.odometer),
      guaranteeCases: formData.cases.map(caseItem => ({
        contentGuarantee: caseItem.text
      }))
    };
  };

  const [records, setRecords] = useState<WarrantyRecord[]>([]);

  // Helper Functions
  // Validate record - customerName is optional for new records (will be fetched from vehicle owner)
  const validateRecord = (record: { vinNumber: string; customerName?: string; odometer: string; cases: CaseNote[] }) => 
    record.vinNumber && record.odometer && record.cases.length > 0;

  const mapApiStatus = (apiStatus: string): 'pending' | 'in-progress' | 'completed' => {
    // Pending statuses
    if (['CHECKED_IN', 'IN_DIAGNOSIS', 'WAITING_CUSTOMER_APPROVAL'].includes(apiStatus)) return 'pending';
    // In-progress statuses
    if (['PROCESSING', 'READY_FOR_PICKUP'].includes(apiStatus)) return 'in-progress';
    // Completed statuses
    if (['COMPLETED', 'CANCELLED'].includes(apiStatus)) return 'completed';
    // Default fallback
    return 'pending';
  };

  // Transform API processing records to WarrantyRecord format
  const transformProcessingRecords = (apiRecords: any[]): WarrantyRecord[] => {
    return apiRecords.map((record, index) => ({
      id: record.vehicleProcessingRecordId || record.id || `record-${index}`,
      vinNumber: record.vin || '',
      customerName: record.customerName || 
                   record.vehicle?.owner?.fullName || 
                   record.owner?.fullName ||
                   record.customer?.fullName ||
                   record.vehicle?.customer?.fullName ||
                   'Unknown Customer',
      customerEmail: record.customerEmail ||
                    record.vehicle?.owner?.email ||
                    record.owner?.email ||
                    record.customer?.email ||
                    record.vehicle?.customer?.email ||
                    '',
      odometer: record.odometer || 0,
      cases: record.guaranteeCases?.map((gCase: any, idx: number) => ({
        id: gCase.guaranteeCaseId || `case-${idx}`,
        text: gCase.contentGuarantee || '',
        createdAt: gCase.createdAt || new Date().toISOString()
      })) || [],
      status: mapApiStatus(record.status || 'CHECKED_IN'),
      rawStatus: record.status || 'CHECKED_IN', // Store original API status
      createdAt: record.checkInDate || record.createdAt || new Date().toISOString()
    }));
  };

  // Load processing records from API
  const loadProcessingRecords = async () => {
    try {
      const token = localStorage.getItem('ev_warranty_token');
      
      const response = await fetchProcessingRecords();
      
      if (response.status === 'success' && response.data?.records?.records) {
        // API returns nested structure: data.records.records
        const apiRecords = transformProcessingRecords(response.data.records.records);
        
        // Merge with existing records, keeping local records that might have better data
        setRecords(prevRecords => {
          const mergedRecords = [...apiRecords];
          
          // Add any local records that aren't in the API response
          prevRecords.forEach(localRecord => {
            if (!mergedRecords.some(apiRecord => apiRecord.id === localRecord.id)) {
              mergedRecords.unshift(localRecord); // Add to beginning
            }
          });
          
          // Sort by creation date (newest first)
          return mergedRecords.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      } else if (response.data && Array.isArray(response.data)) {
        // Maybe API returns data directly
        const apiRecords = transformProcessingRecords(response.data);
        setRecords(prevRecords => {
          const mergedRecords = [...apiRecords];
          prevRecords.forEach(localRecord => {
            if (!mergedRecords.some(apiRecord => apiRecord.id === localRecord.id)) {
              mergedRecords.unshift(localRecord);
            }
          });
          return mergedRecords.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      } else {
       
        // Don't clear existing records if API has no data
      }
    } catch (error) {
      console.error('Error loading processing records:', error);
      // Keep existing records if API fails
      toast({
        title: 'Warning',
        description: 'Could not load latest records',
        variant: 'default'
      });
    }
  };

  useEffect(() => {
    loadProcessingRecords();
  }, []);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (otpCountdown === 0 && otpSent) {
      setOtpSent(false);
      setOtpCode('');
      toast({
        title: 'OTP Expired',
        description: 'Please request a new OTP code',
        variant: 'default'
      });
    }
  }, [otpCountdown, otpSent, toast]);

  // Caseline OTP countdown timer
  useEffect(() => {
    if (caselineOtpCountdown > 0) {
      const timer = setTimeout(() => {
        setCaselineOtpCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (caselineOtpCountdown === 0 && caselineOtpSent) {
      setCaselineOtpSent(false);
      setCaselineOtpCode('');
      toast({
        title: 'OTP Expired',
        description: 'Please request a new OTP code',
        variant: 'default'
      });
    }
  }, [caselineOtpCountdown, caselineOtpSent, toast]);

  const handleSearchWarranty = async () => {
  try {
    if (!searchVin.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter VIN',
        variant: 'destructive'
      });
      return;
    }

    const vin = searchVin.trim();
    const odometer = 0;

    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      console.error("No token found (checked AuthContext.getToken and localStorage 'ev_warranty_token')");
      toast({
        title: 'Error',
        description: 'Không tìm thấy token đăng nhập',
        variant: 'destructive'
      });
      return;
    }

    const url = `${API_BASE_URL}/vehicles/${vin}/warranty?odometer=${odometer}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok || data.status !== 'success') {
      toast({
        title: 'Unable to find warranty',
        variant: 'destructive'
      });
      return;
    }    if (data && data.status === 'success' && data.data && data.data.vehicle) {
      const vehicle = data.data.vehicle;
      
      // Lấy warranty status từ response hoặc từ generalWarranty
      let warrantyStatus = 'N/A';
      if (vehicle.warrantyStatus) {
        warrantyStatus = vehicle.warrantyStatus;
      } else if (vehicle.generalWarranty) {
        // Nếu không có warrantyStatus trực tiếp, lấy từ generalWarranty
        const durationStatus = vehicle.generalWarranty.duration?.status;
        const mileageStatus = vehicle.generalWarranty.mileage?.status;
        
        if (durationStatus === 'ACTIVE' && mileageStatus === 'ACTIVE') {
          warrantyStatus = 'Active';
        } else if (durationStatus === 'INACTIVE' && mileageStatus === 'INACTIVE') {
          warrantyStatus = 'Expired (Time & Odometer)';
        } else if (durationStatus === 'INACTIVE') {
          warrantyStatus = 'Expired (Time)';
        } else if (mileageStatus === 'INACTIVE') {
          warrantyStatus = 'Expired (Odometer)';
        }
      }
      
      setVinData({
        vinNumber: vehicle.vin || '',
        warrantyStatus
      });

      setIsDialogSearch(true);

      toast({
        title: 'Thành công',
        description: 'Đã tải thông tin VIN',
      });
    } else {
      toast({
        title: 'Không có dữ liệu',
        description: 'Không tìm thấy thông tin xe',
        variant: 'destructive'
      });
    }

  } catch (error) {
    console.error("Failed to fetch VIN warranty info:", error);
    
  }
};

  const handleSearchCustomer = async (vinToSearch?: string) => {
    try {
      // Reset customer search state and warranty info
      setHasSearchedCustomer(false);
      setFoundCustomer(null);
      setWarrantyStatus(null);
      setWarrantyDetails(null);
      setOdometer('');
      
      const vin = vinToSearch || searchVin.trim();
      
      if (!vin) {
        toast({
          title: 'Error',
          description: 'Please enter VIN to search vehicle',
          variant: 'destructive'
        });
        return;
      }

      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive'
        });
        return;
      }

      const apiUrl = `${API_BASE_URL}/vehicles/${vin}`;

      // Search vehicle by VIN
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.vehicle) {
        const vehicle = response.data.data.vehicle;

        setVehicleSearchResult({
          vin: vehicle.vin,
          dateOfManufacture: vehicle.dateOfManufacture,
          placeOfManufacture: vehicle.placeOfManufacture,
          model: vehicle.model || 'N/A',
          company: vehicle.company || 'N/A',
          licensePlate: vehicle.licensePlate,
          purchaseDate: vehicle.purchaseDate,
          owner: vehicle.owner
        });

        // Reset warranty status for new vehicle - user must check warranty first
        setWarrantyStatus(null);
        setWarrantyDetails(null);

        // Reset customer search states and initialize owner form
        setCustomerSearchPhone('');
        setFoundCustomer(null);
        setHasSearchedCustomer(false);

        // Initialize owner form with existing owner data or empty
        if (vehicle.owner) {
          setOwnerForm({
            fullName: vehicle.owner.fullName || '',
            phone: vehicle.owner.phone || '',
            email: vehicle.owner.email || '',
            address: vehicle.owner.address || ''
          });
        } else {
          setOwnerForm({
            fullName: '',
            phone: '',
            email: '',
            address: ''
          });
        }

        if (vehicle.owner) {
          toast({
            title: 'Vehicle Found',
            description: `Vehicle is registered to ${vehicle.owner.fullName}`,
          });
        } else {
          toast({
            title: 'Vehicle Found - No Owner',
            description: 'Vehicle exists but no owner is registered. You can search for existing customer or register a new one.',
          });
        }
      } else {
        toast({
          title: 'Vehicle Not Found',
          description: 'No vehicle found with this VIN',
          variant: 'destructive'
        });
        setVehicleSearchResult(null);
      }

    } catch (error) {
      console.error("❌ Failed to search vehicle:", error);
      console.error("Error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'An error occurred while searching for vehicle',
        variant: 'destructive'
      });
      setVehicleSearchResult(null);
    }
  };

  const handleSearchCustomerByPhone = async (phoneToSearch?: string) => {
    const phoneNumber = phoneToSearch || customerSearchPhone.trim();
    
    if (!phoneNumber) {
      toast({
        title: 'Error',
        description: 'Please enter phone number',
        variant: 'destructive'
      });
      return;
    }

    setIsSearchingCustomer(true);
    setFoundCustomer(null);

    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive'
        });
        setIsSearchingCustomer(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/customers?phone=${phoneNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success') {
        // API returns customer object directly in data.customer
        const customer = response.data.data?.customer;
        
        if (customer && customer.id) {
          setFoundCustomer(customer);
          
          // Fill all 4 fields with found customer data
          setOwnerForm({
            fullName: customer.fullName || '',
            phone: customer.phone || '',
            email: customer.email || '',
            address: customer.address || ''
          });

          toast({
            title: 'Customer Found',
            description: `Found existing customer: ${customer.fullName}`,
          });
          
          setHasSearchedCustomer(true);
          
          // Don't reset vehicle info here - user still needs to complete registration
          // Only keep the registrationFlowPhone marker for later cleanup

        } else {
          setFoundCustomer(null);
          
          // Fill only phone number, clear other fields
          setOwnerForm({
            fullName: '',
            phone: phoneNumber,
            email: '',
            address: ''
          });

          toast({
            title: 'Customer Not Found',
            description: 'No customer found with this phone number. You can enter new customer information.',
            variant: 'default'
          });
          
          setHasSearchedCustomer(true);
        }
      } else {
        setFoundCustomer(null);
        
        // Fill only phone number, clear other fields
        setOwnerForm({
          fullName: '',
          phone: phoneNumber,
          email: '',
          address: ''
        });

        toast({
          title: 'Customer Not Found',
          description: 'No customer found with this phone number. You can enter new customer information.',
          variant: 'default'
          });
          
          setHasSearchedCustomer(true);
        }

      setHasSearchedCustomer(true);
      setIsSearchingCustomer(false);

    } catch (error) {
      console.error('❌ Failed to search customer:', error);
      setFoundCustomer(null);
      setHasSearchedCustomer(true);
      setIsSearchingCustomer(false);
      
      // Fill only phone number, clear other fields  
      setOwnerForm({
        fullName: '',
        phone: phoneNumber,
        email: '',
        address: ''
      });

      toast({
        title: 'Search Error',
        description: 'An error occurred while searching for customer. You can enter new customer information.',
        variant: 'default'
      });
    }
  };

  // Handle Enter key press for search fields
  const handleVinSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchMode === 'customer') {
        handleSearchCustomer();
      }
    }
  };

  const handlePhoneSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchCustomerByPhone();
    }
  };

  const handleWarrantyPhoneSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchCustomerByPhone();
    }
  };

  const handleRegisterVehicleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newVehicleVin.trim()) {
        handleRegisterNewVehicle();
      }
    }
  };

  // Handle edit customer info
  const handleEditCustomer = () => {
    setIsEditingCustomer(true);
    setEditCustomerForm({
      fullName: foundCustomer?.fullName || '',
      phone: foundCustomer?.phone || '',
      email: foundCustomer?.email || '',
      address: foundCustomer?.address || ''
    });
  };

  const handleCancelEditCustomer = () => {
    setIsEditingCustomer(false);
    setEditCustomerForm({
      fullName: '',
      phone: '',
      email: '',
      address: ''
    });
  };

  const handleUpdateCustomer = async () => {
    if (!foundCustomer?.id) {
      toast({
        title: 'Error',
        description: 'Customer ID not found',
        variant: 'destructive'
      });
      return;
    }

    // Validate phone number (10 digits)
    if (editCustomerForm.phone && !/^\d{10}$/.test(editCustomerForm.phone)) {
      toast({
        title: 'Error',
        description: 'Phone number must be exactly 10 digits',
        variant: 'destructive'
      });
      return;
    }

    setIsUpdatingCustomer(true);

    try {
      const token = localStorage.getItem('ev_warranty_token');
      
      // Build request body with only changed fields
      const updateData: any = {};
      
      if (editCustomerForm.fullName.trim() !== foundCustomer.fullName) {
        updateData.fullName = editCustomerForm.fullName.trim();
      }
      if (editCustomerForm.phone.trim() !== foundCustomer.phone) {
        updateData.phone = editCustomerForm.phone.trim();
      }
      if (editCustomerForm.email.trim() !== foundCustomer.email) {
        updateData.email = editCustomerForm.email.trim();
      }
      if (editCustomerForm.address.trim() !== foundCustomer.address) {
        updateData.address = editCustomerForm.address.trim();
      }

      // Only send request if there are changes
      if (Object.keys(updateData).length === 0) {
        toast({
          title: 'No Changes',
          description: 'No changes detected',
        });
        setIsEditingCustomer(false);
        setIsUpdatingCustomer(false);
        return;
      }

      const response = await axios.patch(
        `${API_BASE_URL}/customers/${foundCustomer.id}`,
        updateData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.status === 'success') {
        // Update foundCustomer with new data
        setFoundCustomer({
          ...foundCustomer,
          ...updateData
        });

        toast({
          title: 'Success',
          description: 'Customer information updated successfully!',
        });

        setIsEditingCustomer(false);
      }
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update customer information',
        variant: 'destructive'
      });
    } finally {
      setIsUpdatingCustomer(false);
    }
  };

  // Handle warranty check for customer's existing vehicle
  const handleCheckVehicleWarranty = async (vehicle: any) => {
    if (!vehicleOdometer) {
      toast({
        title: 'Error',
        description: 'Please enter odometer reading',
        variant: 'destructive'
      });
      return;
    }

    setIsCheckingVehicleWarranty(true);
    setVehicleWarrantyStatus(null);

    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      
      const response = await axios.post(
        `${API_BASE_URL}/vehicles/${vehicle.vin}/warranty/preview`,
        {
          odometer: parseInt(vehicleOdometer),
          purchaseDate: vehicle.purchaseDate
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.status === 'success') {
        const warrantyData = response.data.data?.vehicle;
        
        const generalWarranty = warrantyData?.generalWarranty;
        
        // Check if warranty is valid (both duration and mileage must be ACTIVE)
        const isDurationValid = generalWarranty?.duration?.status === 'ACTIVE';
        const isMileageValid = generalWarranty?.mileage?.status === 'ACTIVE';
        const isValid = isDurationValid && isMileageValid;
        
        // Set warranty data for dialog
        setWarrantyDialogData(warrantyData);
        setCurrentVehicleForWarranty(vehicle);
        setVehicleWarrantyStatus(isValid ? 'valid' : 'expired');
        setShowWarrantyDialog(true);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to check warranty',
          variant: 'destructive'
        });
      }

      setIsCheckingVehicleWarranty(false);
    } catch (error) {
      console.error('Warranty check error:', error);
      setIsCheckingVehicleWarranty(false);
      toast({
        title: 'Error',
        description: 'Failed to check warranty',
        variant: 'destructive'
      });
    }
  };

  // Handle register new vehicle
  const handleRegisterNewVehicle = async () => {
    if (!newVehicleVin.trim()) {
      toast({
        title: 'Error', 
        description: 'Please enter VIN number',
        variant: 'destructive'
      });
      return;
    }

    const vinToSearch = newVehicleVin.trim();
    
    // Save the phone from registration flow before switching modes
    if (customerSearchPhone.trim()) {
      setRegistrationFlowPhone(customerSearchPhone.trim());

    }

    // Switch to customer mode (Find Vehicle by VIN) and auto search
    setSearchMode('customer');
    setSearchVin(vinToSearch);
    
    toast({
      title: 'Switching Mode',
      description: 'Switched to Find Vehicle by VIN mode and searching...',
    });

    // Auto search after a brief delay to allow state to update
    setTimeout(async () => {
      try {
        await handleSearchCustomer(vinToSearch);
        // User will manually enter odometer and click "Check Warranty Policy"
      } catch (error) {
        console.error('Auto search failed:', error);
      }
    }, 300);
  };

  // Handle create record for warranty-valid vehicle
  const handleCreateRecord = async (vehicle: any) => {
    if (!foundCustomer || !vehicle) {
      toast({
        title: 'Error',
        description: 'Missing customer or vehicle information',
        variant: 'destructive'
      });
      return;
    }

    if (!vehicleOdometer) {
      toast({
        title: 'Error',
        description: 'Please enter odometer reading first',
        variant: 'destructive'
      });
      return;
    }

    // Prepare form data and open create warranty dialog
    setWarrantyRecordForm({
      vin: vehicle.vin,
      odometer: vehicleOdometer,
      purchaseDate: vehicle.purchaseDate,
      customerName: foundCustomer.fullName || foundCustomer.name,
      cases: [],
      visitorFullName: foundCustomer.fullName || foundCustomer.name || '',
      visitorPhone: foundCustomer.phone || '',
      customerEmail: foundCustomer.email || ''
    });
    
    // Close warranty dialog and open create dialog
    setShowWarrantyDialog(false);
    setShowCreateWarrantyDialog(true);
  };

  // Handle add case to warranty record form
  // Handle send OTP to customer email
  const handleSendOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!warrantyRecordForm.customerEmail || !emailRegex.test(warrantyRecordForm.customerEmail)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid email address first',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingOtp(true);

    try {
      const response = await fetch(`${API_BASE_URL}/mail/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ev_warranty_token')}`
        },
        body: JSON.stringify({
          email: warrantyRecordForm.customerEmail,
          vin: warrantyRecordForm.vin
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();


      if (result.status === 'success') {
        setOtpSent(true);
        setOtpCountdown(300); // 5 minutes
        toast({
          title: 'OTP Sent',
          description: `OTP code has been sent to ${warrantyRecordForm.customerEmail}. Please check your email inbox.`,
        });
      } else {
        throw new Error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send OTP. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle verify OTP from email
  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit OTP code',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mail/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ev_warranty_token')}`
        },
        body: JSON.stringify({
          email: warrantyRecordForm.customerEmail,
          otp: otpCode
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success' && result.isValid) {
        setOtpVerified(true);
        toast({
          title: 'Success',
          description: 'OTP verified successfully. You can now create the record.',
        });
      } else {
        throw new Error(result.message || 'Invalid or expired OTP code');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify OTP. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle send OTP for caseline approval
  const handleSendCaselineOtp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!caselineApproverEmail || !emailRegex.test(caselineApproverEmail)) {
      toast({
        title: 'Error',
        description: 'Please enter a valid approver email address',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedRecordForCaseline?.vinNumber) {
      toast({
        title: 'Error',
        description: 'VIN not found for this record',
        variant: 'destructive'
      });
      return;
    }

    setIsSendingCaselineOtp(true);

    try {
      const response = await fetch(`${API_BASE_URL}/mail/otp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ev_warranty_token')}`
        },
        body: JSON.stringify({
          email: caselineApproverEmail,
          vin: selectedRecordForCaseline.vinNumber
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();


      if (result.status === 'success') {
        setCaselineOtpSent(true);
        setCaselineOtpCountdown(300); // 5 minutes
        toast({
          title: 'OTP Sent',
          description: `OTP code has been sent to ${caselineApproverEmail}. Please check your email inbox.`,
        });
      } else {
        throw new Error(result.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error sending caseline OTP:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send OTP. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSendingCaselineOtp(false);
    }
  };

  // Handle verify OTP for caseline approval
  const handleVerifyCaselineOtp = async () => {
    if (!caselineOtpCode || caselineOtpCode.length !== 6) {
      toast({
        title: 'Error',
        description: 'Please enter a valid 6-digit OTP code',
        variant: 'destructive'
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/mail/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ev_warranty_token')}`
        },
        body: JSON.stringify({
          email: caselineApproverEmail,
          otp: caselineOtpCode
        })
      });

      const result = await response.json();

      if (response.ok && result.status === 'success' && result.isValid) {
        setCaselineOtpVerified(true);
        toast({
          title: 'Success',
          description: 'OTP verified successfully. You can now approve or reject caselines.',
        });
      } else {
        throw new Error(result.message || 'Invalid or expired OTP code');
      }
    } catch (error) {
      console.error('Error verifying caseline OTP:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to verify OTP. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleAddWarrantyCase = () => {
    if (!warrantyRecordCaseText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter case description',
        variant: 'destructive'
      });
      return;
    }

    const newCase = {
      id: `case-${Date.now()}`,
      text: warrantyRecordCaseText.trim(),
      createdAt: new Date().toISOString()
    };

    setWarrantyRecordForm(prev => ({
      ...prev,
      cases: [...prev.cases, newCase]
    }));

    setWarrantyRecordCaseText('');
  };

  // Handle remove case from warranty record form
  const handleRemoveWarrantyCase = (caseId: string) => {
    setWarrantyRecordForm(prev => ({
      ...prev,
      cases: prev.cases.filter(c => c.id !== caseId)
    }));
  };

  // Handle submit warranty record
  const handleSubmitWarrantyRecord = async () => {
    if (warrantyRecordForm.cases.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one case',
        variant: 'destructive'
      });
      return;
    }

    // Validate visitor info from form inputs
    if (!warrantyRecordForm.visitorFullName?.trim() || !warrantyRecordForm.visitorPhone?.trim()) {
      toast({
        title: 'Error',
        description: 'Visitor name and phone are required',
        variant: 'destructive'
      });
      return;
    }

    // Validate OTP verification - MUST verify OTP before creating record
    if (!otpVerified) {
      toast({
        title: 'OTP Verification Required',
        description: 'Please send and verify OTP for the email address before creating record',
        variant: 'destructive'
      });
      return;
    }

    setIsCreatingRecord(true);

    try {
      // Prepare data for createProcessingRecord API with visitor info from form
      const apiData = {
        vin: warrantyRecordForm.vin,
        odometer: parseInt(warrantyRecordForm.odometer),
        guaranteeCases: warrantyRecordForm.cases.map(caseItem => ({
          contentGuarantee: caseItem.text
        })),
        visitorInfo: {
          fullName: warrantyRecordForm.visitorFullName.trim(),
          phone: warrantyRecordForm.visitorPhone.trim(),
          email: warrantyRecordForm.customerEmail.trim()
        }
      };
      
      // Call API to create processing record
      const response = await createProcessingRecord(apiData);
    
      // Refresh the records list from server to get complete data
      await loadProcessingRecords();
      
      // Reset forms and close dialogs
      setWarrantyRecordForm({ vin: '', odometer: '', purchaseDate: '', customerName: '', cases: [], visitorFullName: '', visitorPhone: '', customerEmail: '' });
      setWarrantyRecordCaseText('');
      setShowCreateWarrantyDialog(false);
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode('');
      setOtpCountdown(0);
      setVehicleWarrantyStatus(null);
      setVehicleOdometer('');
      
      // Reset OTP states
      setOtpCode('');
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCountdown(0);
      
      toast({
        title: 'Success',
        description: 'Warranty processing record created successfully',
      });
      
    } catch (error: unknown) {
      let errorMessage = 'Failed to create warranty record';
      
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          errorMessage = 'Please login again';
        } else if (error.message.includes('Required role')) {
          errorMessage = 'You do not have permission to create records';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsCreatingRecord(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!vehicleSearchResult) {
      toast({
        title: 'Error',
        description: 'No vehicle selected',
        variant: 'destructive'
      });
      return;
    }

    // Validate required fields
    if (!ownerForm.fullName?.trim() || !ownerForm.phone?.trim() || !ownerForm.email?.trim() || !ownerForm.address?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all owner information (Full Name, Phone, Email, Address)',
        variant: 'destructive'
      });
      return;
    }

    // Validate phone number is exactly 10 digits
    if (ownerForm.phone.length !== 10) {
      toast({
        title: 'Validation Error',
        description: 'Phone number must be exactly 10 digits',
        variant: 'destructive'
      });
      return;
    }

    if (!vehicleSearchResult.licensePlate?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter license plate number',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive'
        });
        return;
      }

      // Case 1: Vehicle already has owner - Not allowed to update
      // Owner information is read-only when vehicle already has an owner
      if (vehicleSearchResult.owner && vehicleSearchResult.owner.id) {
        toast({
          title: 'Not Allowed',
          description: 'Cannot modify owner information for vehicles that already have an owner',
          variant: 'destructive'
        });
        return;
      } 
      
      // Case 2: Registering vehicle with existing customer (found via phone search)
      if (foundCustomer && foundCustomer.id) {
        // Register vehicle using PATCH /vehicles/{VIN} with customerId only
        const requestBody = {
          dateOfManufacture: vehicleSearchResult.dateOfManufacture,
          licensePlate: vehicleSearchResult.licensePlate.trim(),
          purchaseDate: vehicleSearchResult.purchaseDate || new Date().toISOString(),
          customerId: foundCustomer.id
        };

        const response = await axios.patch(`${API_BASE_URL}/vehicles/${vehicleSearchResult.vin}`, requestBody, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.status === 'success') {
          const updatedVehicle = response.data.data?.vehicle || response.data.data;
          setVehicleSearchResult(prev => prev ? ({
            ...prev,
            owner: updatedVehicle.owner,
            licensePlate: updatedVehicle.licensePlate,
            purchaseDate: updatedVehicle.purchaseDate
          }) : prev);

          toast({
            title: 'Success',
            description: 'Vehicle registered to existing customer successfully!',
          });
          
          // Reset Register New Vehicle flow after successful registration
          if (registrationFlowPhone) {
            setNewVehicleVin('');
            setRegistrationFlowPhone('');
          }
        }
      }
      // Case 3: Have form data but no customer ID - Search by phone or create new
      else {
        // Try to find customer by phone first
        let customerIdToUse = null;
        
        try {
          const searchResponse = await axios.get(`${API_BASE_URL}/customers?phone=${ownerForm.phone.trim()}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (searchResponse.data && searchResponse.data.status === 'success') {
            // API returns customer object directly in data.customer
            const customer = searchResponse.data.data?.customer;
            
            if (customer && customer.id) {
              customerIdToUse = customer.id;
            }
          }
        } catch (searchError) {
          // Customer not found, will create new
        }

        // Prepare request body
        const requestBody: any = {
          dateOfManufacture: vehicleSearchResult.dateOfManufacture,
          licensePlate: vehicleSearchResult.licensePlate.trim(),
          purchaseDate: vehicleSearchResult.purchaseDate || new Date().toISOString()
        };

        // Use customerId if customer exists, otherwise include customer object for new customer
        if (customerIdToUse) {
          requestBody.customerId = customerIdToUse;
        } else {
          requestBody.customer = {
            fullName: ownerForm.fullName.trim(),
            email: ownerForm.email.trim(),
            phone: ownerForm.phone.trim(),
            address: ownerForm.address.trim()
          };
        }

        // Register vehicle with PATCH /vehicles/{VIN}
        const response = await axios.patch(
          `${API_BASE_URL}/vehicles/${vehicleSearchResult.vin}`,
          requestBody,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data && response.data.status === 'success') {
          const updatedVehicle = response.data.data?.vehicle || response.data.data;
          setVehicleSearchResult(prev => prev ? ({
            ...prev,
            owner: updatedVehicle.owner,
            licensePlate: updatedVehicle.licensePlate,
            purchaseDate: updatedVehicle.purchaseDate
          }) : prev);

          toast({
            title: 'Success',
            description: customerIdToUse 
              ? 'Vehicle registered to existing customer successfully!'
              : 'New customer created and vehicle registered successfully!',
          });
          
          // Reset Register New Vehicle flow after successful registration
          if (registrationFlowPhone) {
            setNewVehicleVin('');
            setRegistrationFlowPhone('');
          }
        }
      }

      // Reset search states
      setCustomerSearchPhone('');
      setFoundCustomer(null);
      setHasSearchedCustomer(false);

    } catch (error) {
      console.error('❌ Error saving changes:', error);
      if (error.response) {
        console.error('Backend error:', error.response.data);
        const errorMessage = error.response.data.message || 'Server error';
        toast({
          title: 'Error',
          description: `Failed to save changes: ${errorMessage}`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'An error occurred while saving changes. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleCheckWarranty = async () => {
    if (!vehicleSearchResult || !odometer) {
      toast({
        title: 'Error',
        description: 'Please enter odometer reading',
        variant: 'destructive'
      });
      return;
    }

    setIsCheckingWarranty(true);
    setWarrantyStatus(null);

    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive'
        });
        setIsCheckingWarranty(false);
        return;
      }

   
      const response = await axios.post(
        `${API_BASE_URL}/vehicles/${vehicleSearchResult.vin}/warranty/preview`,
        {
          odometer: parseInt(odometer),
          purchaseDate: vehicleSearchResult.purchaseDate
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );


      if (response.data && response.data.status === 'success') {
        const warrantyData = response.data.data?.vehicle;
        
        if (warrantyData) {
          // Save warranty details
          setWarrantyDetails(warrantyData);
        
          // Check if general warranty is still active
          // Both duration and odometer must be valid
          const generalWarranty = warrantyData.generalWarranty;
          
        
          const isDurationValid = 
            generalWarranty?.duration?.status === true || 
            generalWarranty?.duration?.status === 'ACTIVE';
          const isMileageValid = 
            generalWarranty?.mileage?.status === 'ACTIVE';
          
          // Warranty is valid if BOTH duration and odometer are valid
          const isGeneralWarrantyValid = isDurationValid && isMileageValid;
          
          // Check component warranties for display purposes only (not blocking)
          const componentWarranties = warrantyData.componentWarranties || [];
          let hasExpiredComponent = false;
          let expiredComponents = [];
          
          for (const comp of componentWarranties) {
            const compDurationValid = 
              comp.duration?.status === true || 
              comp.duration?.status === 'ACTIVE';
            const compMileageValid = 
              comp.mileage?.status === 'ACTIVE';
            
            // Component is expired if EITHER duration OR mileage is expired
            if (!compDurationValid || !compMileageValid) {
              hasExpiredComponent = true;
              expiredComponents.push({
                name: comp.componentName || comp.name || 'Unknown component',
                reason: !compDurationValid ? 'time limit exceeded' : 'mileage limit exceeded'
              });
            }
          }
          
          // Overall warranty is valid if ONLY general warranty is valid (ignore component expiration)
          const isWarrantyValid = isGeneralWarrantyValid;
          
          setWarrantyStatus(isWarrantyValid ? 'valid' : 'expired');

          if (isWarrantyValid) {
            const componentWarning = hasExpiredComponent 
              ? ` Note: ${expiredComponents.length} component(s) have expired warranty.`
              : ' All components covered.';
            
            toast({
              title: 'Warranty Active',
              description: `General warranty valid for ${generalWarranty.duration.remainingDays} more days and ${generalWarranty.mileage.remainingMileage} km.${componentWarning}`,
            });


            // Check for owner phone from two sources:
            // 1. If vehicle already has owner (existing customer)
            // 2. If phone was entered in "Find Customer by Phone" field (new registration flow)
            let phoneToSearch = null;
            
            if (vehicleSearchResult.owner?.phone) {
              // Vehicle already has owner
              phoneToSearch = vehicleSearchResult.owner.phone;
              setFoundCustomer(vehicleSearchResult.owner);
            } else if (registrationFlowPhone) {
              // Phone was saved from Register New Vehicle flow
              phoneToSearch = registrationFlowPhone;
            } else if (customerSearchPhone.trim()) {
              // Fallback: use current phone in search field
              phoneToSearch = customerSearchPhone.trim();
            }

            if (phoneToSearch) {
              
              // Fill customer search phone if not already filled
              if (!customerSearchPhone.trim()) {
                setCustomerSearchPhone(phoneToSearch);
              }
              
              // Auto-trigger phone search by passing phone directly
              setTimeout(async () => {
                try {
                  await handleSearchCustomerByPhone(phoneToSearch);
                } catch (error) {
                  console.error('❌ Auto-search failed:', error);
                }
              }, 600);
            }
          } else {
            const reasons = [];
            if (!isDurationValid) reasons.push('general warranty time limit exceeded');
            if (!isMileageValid) reasons.push('general warranty odometer limit exceeded');
            
            toast({
              title: 'Warranty Expired',
              description: `Cannot register warranty claim: ${reasons.join('; ')}`,
              variant: 'destructive'
            });
          }
        } else {
          throw new Error('Invalid warranty data structure');
        }
      } else {
        throw new Error('Invalid response from warranty check');
      }

      setIsCheckingWarranty(false);

    } catch (error) {
      console.error('❌ Failed to check warranty:', error);
      setIsCheckingWarranty(false);
      setWarrantyStatus('expired');
      
      toast({
        title: 'Warranty Check Failed',
        description: error.response?.data?.message || 'Unable to verify warranty status. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const handleRegisterOwner = async () => {
    if (!ownerForm.fullName?.trim() || !ownerForm.phone?.trim() || !ownerForm.email?.trim() || !ownerForm.address?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all owner information (Full Name, Phone, Email, Address)',
        variant: 'destructive'
      });
      return;
    }

    // Validate phone number is exactly 10 digits
    if (ownerForm.phone.length !== 10) {
      toast({
        title: 'Validation Error',
        description: 'Phone number must be exactly 10 digits',
        variant: 'destructive'
      });
      return;
    }

    if (!vehicleSearchResult) {
      toast({
        title: 'Error',
        description: 'No vehicle selected for registration',
        variant: 'destructive'
      });
      return;
    }

    try {
      const token = localStorage.getItem('ev_warranty_token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please login first',
          variant: 'destructive'
        });
        return;
      }

      // First, find or create customer
      let customerData = null;

      const searchResponse = await axios.get(`${API_BASE_URL}/customers/`, {
        params: {
          phone: ownerForm.phone.trim()
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (searchResponse.data?.data?.customer) {
        customerData = searchResponse.data.data.customer;
      } else {
        // Create new customer
        const createResponse = await axios.post(`${API_BASE_URL}/customers/`, {
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
        } else {
          throw new Error('Failed to create customer');
        }
      }

      // Prepare request body - only send ownerId and vehicle info
      const requestBody = {
        ownerId: customerData.id,  // Use existing customer ID
        licensePlate: vehicleSearchResult.licensePlate || '',
        purchaseDate: vehicleSearchResult.purchaseDate || new Date().toISOString(),
        dateOfManufacture: vehicleSearchResult.dateOfManufacture,
        placeOfManufacture: vehicleSearchResult.placeOfManufacture || ''
      };

      // Register owner to vehicle
      const response = await axios.patch(`${API_BASE_URL}/vehicle/${vehicleSearchResult.vin}/update-owner`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success') {
        toast({
          title: 'Success',
          description: 'Vehicle owner registered successfully!',
        });

        // Update vehicle search result with owner info
        setVehicleSearchResult(prev => prev ? ({
          ...prev,
          owner: {
            id: customerData.id,
            fullName: customerData.fullName || customerData.fullname,
            phone: customerData.phone,
            email: customerData.email,
            address: customerData.address
          }
        }) : prev);

        // Reset form and close dialog
        setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
        setShowRegisterDialog(false);
      } else {
        throw new Error('Failed to register owner');
      }

    } catch (error) {
      console.error('Error registering owner:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to register owner. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle creating record from VIN search flow - prepare form and open dialog
  const handleCreateRecordFromVin = () => {
    if (!vehicleSearchResult || !odometer) {
      toast({
        title: 'Validation Error',
        description: 'VIN and odometer are required',
        variant: 'destructive'
      });
      return;
    }

    if (!vehicleSearchResult.owner) {
      toast({
        title: 'Error',
        description: 'Vehicle must have an owner before creating a processing record',
        variant: 'destructive'
      });
      return;
    }

    // Prepare form data and open create warranty dialog
    setWarrantyRecordForm({
      vin: vehicleSearchResult.vin,
      odometer: odometer,
      purchaseDate: vehicleSearchResult.purchaseDate || '',
      customerName: vehicleSearchResult.owner.fullName,
      cases: [],
      visitorFullName: vehicleSearchResult.owner.fullName || '',
      visitorPhone: vehicleSearchResult.owner.phone || '',
      customerEmail: vehicleSearchResult.owner.email || ''
    });
    
    // Open create dialog
    setShowCreateWarrantyDialog(true);
  };

  const handleEditRecord = async (record: WarrantyRecord) => {
    
    setSelectedRecord(record);
    
    // Fetch full record details to get visitorInfo
    try {
      const token = localStorage.getItem('ev_warranty_token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/processing-records/${record.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.status === 'success' && result.data?.record) {
        const recordData = result.data.record;
        
        // Get customer name from API response
        // Note: processing-record API doesn't include vehicle owner, need to call vehicle API separately
        let apiCustomerName = 'Unknown Customer';
        
        try {
          const vehicleResponse = await fetch(`${API_BASE_URL}/vehicles/${recordData.vin}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const vehicleResult = await vehicleResponse.json();
          
          if (vehicleResult.status === 'success' && vehicleResult.data?.vehicle?.owner) {
            apiCustomerName = vehicleResult.data.vehicle.owner.fullName || 'Unknown Customer';
          }
        } catch (vehicleError) {
          console.error('❌ Error fetching vehicle details:', vehicleError);
        }
        
        setEditRecord({
          vinNumber: record.vinNumber,
          odometer: record.odometer.toString(),
          visitorFullName: recordData.visitorInfo?.fullName || '',
          visitorPhone: recordData.visitorInfo?.phone || '',
          customerEmail: recordData.visitorInfo?.email || '',
          cases: record.cases || [],
          purchaseDate: record.purchaseDate || '',
          status: record.status,
          rawStatus: record.rawStatus || 'CHECKED_IN'
        });
      } else {
        // Fallback to record data without visitorInfo
        setEditRecord({
          vinNumber: record.vinNumber,
          odometer: record.odometer.toString(),
          visitorFullName: '',
          visitorPhone: '',
          customerEmail: '',
          cases: record.cases || [],
          purchaseDate: record.purchaseDate || '',
          status: record.status,
          rawStatus: record.rawStatus || 'CHECKED_IN'
        });
      }
    } catch (error) {
      console.error('Error fetching record details:', error);
      // Fallback to record data without visitorInfo
      setEditRecord({
        vinNumber: record.vinNumber,
        odometer: record.odometer.toString(),
        visitorFullName: '',
        visitorPhone: '',
        customerEmail: '',
        cases: record.cases || [],
        purchaseDate: record.purchaseDate || '',
        status: record.status,
        rawStatus: record.rawStatus || 'CHECKED_IN'
      });
    }
    
    setIsEditMode(true);
  };

  const handleDeleteRecord = (record: WarrantyRecord) => {
    if (window.confirm(`Are you sure you want to delete this warranty record for VIN: ${record.vinNumber}?`)) {
      // Remove from local state only
      const updatedRecords = records.filter(r => r.id !== record.id);
      setRecords(updatedRecords);
      
      toast({
        title: 'Record Deleted',
        description: `Warranty record for VIN ${record.vinNumber} has been deleted`,
      });
    }
  };

  const handleSaveEdit = () => {
    if (!validateRecord(editRecord)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and have at least one case',
        variant: 'destructive'
      });
      return;
    }

    const updatedRecords = records.map(record => {
      if (record.id === selectedRecord?.id) {
        return {
          ...record,
          vinNumber: editRecord.vinNumber.toUpperCase(),
          visitorFullName: editRecord.visitorFullName,
          odometer: parseInt(editRecord.odometer),
          cases: editRecord.cases,
          purchaseDate: editRecord.purchaseDate,
          status: editRecord.status,
          rawStatus: editRecord.rawStatus
        };
      }
      return record;
    });

    setRecords(updatedRecords);
    setIsEditMode(false);

    toast({
      title: 'Record Updated Successfully',
      description: `Warranty claim ${selectedRecord?.id} has been updated`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'pending' as const, text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
      'in-progress': { variant: 'warning' as const, text: 'In Progress', class: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'success' as const, text: 'Completed', class: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className={config.class}>
        {config.text}
      </Badge>
    );
  };

  // Get badge for raw API status
  const getRawStatusBadge = (rawStatus?: string) => {
    if (!rawStatus) return null;

    const statusConfig = {
      'CHECKED_IN': { text: 'Checked In', class: 'bg-gray-100 text-gray-800' },
      'IN_DIAGNOSIS': { text: 'In Diagnosis', class: 'bg-yellow-100 text-yellow-800' },
      'WAITING_CUSTOMER_APPROVAL': { text: 'Waiting Approval', class: 'bg-orange-100 text-orange-800' },
      'PROCESSING': { text: 'Processing', class: 'bg-blue-100 text-blue-800' },
      'READY_FOR_PICKUP': { text: 'Ready for Pickup', class: 'bg-purple-100 text-purple-800' },
      'COMPLETED': { text: 'Completed', class: 'bg-green-100 text-green-800' },
      'CANCELLED': { text: 'Cancelled', class: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[rawStatus as keyof typeof statusConfig];
    if (!config) {
      return <Badge className="bg-gray-100 text-gray-800">{rawStatus}</Badge>;
    }

    return (
      <Badge className={config.class}>
        {config.text}
      </Badge>
    );
  };

  // Handle view caselines
  const handleViewCaselines = async (record: WarrantyRecord) => {
    setSelectedRecordForCaseline(record);
    setShowCaselineDialog(true);
    setIsLoadingCaselines(true);
    setCaselines([]);
    
    // Reset all states when opening dialog (fresh start)
    setSelectedCaselineIds({ approved: [], rejected: [] });
    setCaselineApproverEmail('');
    setCaselineOtpCode('');
    setCaselineOtpSent(false);
    setCaselineOtpVerified(false);
    setCaselineOtpCountdown(0);

    try {
      const token = localStorage.getItem('ev_warranty_token');
      if (!token) {
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive'
        });
        setIsLoadingCaselines(false);
        return;
      }

      // Fetch record details with caselines
      const response = await fetch(`${API_BASE_URL}/processing-records/${record.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.status === 'success' && result.data?.record) {
        const recordData = result.data.record;
        
        const allCaselines: any[] = [];

        // Extract caselines from all guarantee cases
        if (recordData.guaranteeCases && Array.isArray(recordData.guaranteeCases)) {
          recordData.guaranteeCases.forEach((guaranteeCase: any) => {
            if (guaranteeCase.caseLines && Array.isArray(guaranteeCase.caseLines)) {
              guaranteeCase.caseLines.forEach((caseline: any) => {
                allCaselines.push({
                  ...caseline,
                  guaranteeCaseId: guaranteeCase.guaranteeCaseId,
                  contentGuarantee: guaranteeCase.contentGuarantee
                });
              });
            }
          });
        }

        // Auto-fill approver email from visitorInfo
        const ownerEmail = recordData.visitorInfo?.email || 
                          recordData.vehicle?.owner?.email || 
                          recordData.owner?.email || 
                          recordData.customer?.email ||
                          recordData.vehicle?.customer?.email ||
                          record.customerEmail ||
                          '';
        
        
        if (ownerEmail) {
          setCaselineApproverEmail(ownerEmail);
        } else {
          console.warn('⚠️ No email found in API response!');
        }

        setCaselines(allCaselines);

        if (allCaselines.length === 0) {
          toast({
            title: 'No Caselines',
            description: 'This record has no caselines yet. Technician needs to create them.',
            variant: 'default'
          });
        }
      } else {
        throw new Error('Failed to fetch record details');
      }

      setIsLoadingCaselines(false);
    } catch (error) {
      console.error('Error fetching caselines:', error);
      setIsLoadingCaselines(false);
      toast({
        title: 'Error',
        description: 'Failed to load caselines',
        variant: 'destructive'
      });
    }
  };

  // Toggle caseline selection for approval
  const handleToggleApprove = (caselineId: string) => {
    setSelectedCaselineIds(prev => {
      // Remove from rejected if exists
      const newRejected = prev.rejected.filter(id => id !== caselineId);
      
      // Toggle in approved
      const isCurrentlyApproved = prev.approved.includes(caselineId);
      const newApproved = isCurrentlyApproved
        ? prev.approved.filter(id => id !== caselineId)
        : [...prev.approved, caselineId];
      
      return {
        approved: newApproved,
        rejected: newRejected
      };
    });
  };

  // Toggle caseline selection for rejection
  const handleToggleReject = (caselineId: string) => {
    setSelectedCaselineIds(prev => {
      // Remove from approved if exists
      const newApproved = prev.approved.filter(id => id !== caselineId);
      
      // Toggle in rejected
      const isCurrentlyRejected = prev.rejected.includes(caselineId);
      const newRejected = isCurrentlyRejected
        ? prev.rejected.filter(id => id !== caselineId)
        : [...prev.rejected, caselineId];
      
      return {
        approved: newApproved,
        rejected: newRejected
      };
    });
  };

  // Submit approve/reject decisions
  const handleSubmitCaselineDecisions = async () => {
    if (selectedCaselineIds.approved.length === 0 && selectedCaselineIds.rejected.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select caselines to approve or reject',
        variant: 'destructive'
      });
      return;
    }

    // Check OTP verification
    if (!caselineOtpVerified) {
      toast({
        title: 'OTP Required',
        description: 'Please verify OTP before approving or rejecting caselines',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessingCaselines(true);

    try {
      const token = localStorage.getItem('ev_warranty_token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`${API_BASE_URL}/case-lines/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          approvedCaseLineIds: selectedCaselineIds.approved.map(id => ({ id })),
          rejectedCaseLineIds: selectedCaselineIds.rejected.map(id => ({ id })),
          approverEmail: caselineApproverEmail
        })
      });

      const result = await response.json();

      if (!response.ok || result.status !== 'success') {
        throw new Error(result.message || 'Failed to process caselines');
      }

      toast({
        title: 'Success',
        description: `Processed ${selectedCaselineIds.approved.length} approved and ${selectedCaselineIds.rejected.length} rejected caselines`,
      });

      // Reset selections and OTP states
      setSelectedCaselineIds({ approved: [], rejected: [] });
      setCaselineApproverEmail('');
      setCaselineOtpCode('');
      setCaselineOtpSent(false);
      setCaselineOtpVerified(false);
      setCaselineOtpCountdown(0);

      // Reload caselines
      if (selectedRecordForCaseline) {
        await handleViewCaselines(selectedRecordForCaseline);
      }

    } catch (error) {
      console.error('Error processing caselines:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process caselines',
        variant: 'destructive'
      });
    } finally {
      setIsProcessingCaselines(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Super Advisor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, Super Advisor </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search Section */}
        <Card className="mb-6 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Search</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search Mode Buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={searchMode === 'phone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('phone')}
                className={searchMode === 'phone' ? 'bg-purple-600 hover:bg-purple-700' : ''}
              >
                <User className="h-4 w-4 mr-2" />
                Find Customer by Phone
              </Button>
              <Button
                variant={searchMode === 'customer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('customer')}
                className={searchMode === 'customer' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Car className="h-4 w-4 mr-2" />
                Find Vehicle by VIN
              </Button>
              <Button
                variant={searchMode === 'warranty' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSearchMode('warranty')}
                className={searchMode === 'warranty' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                <Search className="h-4 w-4 mr-2" />
                Check Warranty by VIN
              </Button>
            </div>

            {/* Dynamic Search Bar - Only for customer and phone modes */}
            {searchMode !== 'warranty' && (
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  {searchMode === 'customer' ? (
                    <Car className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  ) : (
                    <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  )}
                  <Input
                    placeholder={
                      searchMode === 'customer'
                        ? "Enter VIN to find vehicle and customer records"
                        : "Enter 10-digit phone number"
                    }
                    className="pl-10 h-11"
                    value={searchMode === 'phone' ? customerSearchPhone : searchVin}
                    onChange={(e) => {
                      if (searchMode === 'phone') {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                        setCustomerSearchPhone(numericValue);
                      } else {
                        setSearchVin(e.target.value);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (searchMode === 'phone') {
                        handlePhoneSearchKeyPress(e);
                      } else {
                        handleVinSearchKeyPress(e);
                      }
                    }}
                    maxLength={searchMode === 'phone' ? 10 : undefined}
                  />
                </div>
                <Button 
                  size="sm" 
                  className={
                    searchMode === 'customer'
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-purple-600 hover:bg-purple-700"
                  }
                  onClick={
                    searchMode === 'customer'
                      ? () => handleSearchCustomer()
                      : () => handleSearchCustomerByPhone()
                  }
                >
                  {searchMode === 'customer' ? 'Find Vehicle' : 'Search Customer'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warranty Records Section - Only show in warranty mode */}
        {searchMode === 'warranty' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Recent Warranty Records</CardTitle>
              <CardDescription>Manage warranty records and track their progress</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vin</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No warranty records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record, index) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{record.vinNumber}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{record.cases?.length || 0} cases</Badge>
                            {record.cases && record.cases.length > 0 && (
                              <span className="text-sm truncate">{record.cases[0].text}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getRawStatusBadge(record.rawStatus)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCaselines(record)}
                              className="text-blue-600 hover:bg-blue-50"
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              View Caselines
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRecord(record)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteRecord(record)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

              {records.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline">View All Records</Button>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Customer Search Results Section - Only show in customer mode */}
        {searchMode === 'customer' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Vehicle Search Results</CardTitle>
              <CardDescription>Search for vehicles and register owners if needed</CardDescription>
            </CardHeader>
            <CardContent>
              {vehicleSearchResult ? (
                <div className="space-y-6">
                  {/* Vehicle Information Fields */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                      <Car className="mr-2 h-5 w-5" />
                      Vehicle Information
                    </h3>
                    <div className="grid gap-4">
                      {/* VIN Number - Read Only */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">VIN Number:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={vehicleSearchResult.vin}
                            disabled
                            className="bg-gray-100 font-mono text-sm"
                          />
                        </div>
                      </div>

                      {/* Date of Manufacture - Read Only */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Date of Manufacture:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={formatDate(vehicleSearchResult.dateOfManufacture)}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>

                      {/* Place of Manufacture - Read Only - Show Model */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Place of Manufacture:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={vehicleSearchResult.model || 'N/A'}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>

                      {/* Company - Read Only - New Field */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Company:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={vehicleSearchResult.company || 'N/A'}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>

                      {/* License Plate - Editable only after valid warranty check */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">License Plate:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={warrantyStatus === 'valid' ? (vehicleSearchResult.licensePlate || '') : 'N/A'}
                            onChange={(e) => setVehicleSearchResult(prev => prev ? ({
                              ...prev,
                              licensePlate: e.target.value
                            }) : prev)}
                            placeholder="Enter license plate number"
                            disabled={warrantyStatus !== 'valid'}
                            className={warrantyStatus === 'valid' ? "bg-white border-green-300 focus:border-green-500" : "bg-gray-100"}
                          />
                        </div>
                      </div>

                      {/* Purchase Date - Editable only if vehicle has no owner */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Purchase Date:</Label>
                        <div className="md:col-span-2">
                          <Input
                            type="date"
                            value={vehicleSearchResult.purchaseDate ? new Date(vehicleSearchResult.purchaseDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setVehicleSearchResult(prev => prev ? ({
                              ...prev,
                              purchaseDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                            }) : prev)}
                            disabled={!!vehicleSearchResult.owner}
                            className={vehicleSearchResult.owner ? "bg-gray-100" : "bg-white border-green-300 focus:border-green-500"}
                          />
                        </div>
                      </div>

                      {/* Odometer - Editable */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Odometer (km):</Label>
                        <div className="md:col-span-2">
                          <Input
                            type="number"
                            value={odometer}
                            onChange={(e) => setOdometer(e.target.value)}
                            placeholder="Enter current odometer reading"
                            className="bg-white border-green-300 focus:border-green-500"
                          />
                        </div>
                      </div>

                      {/* Warranty Check Button */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Warranty Check:</Label>
                        <div className="md:col-span-2">
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Button
                                onClick={handleCheckWarranty}
                                disabled={isCheckingWarranty || !odometer}
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                                data-action="check-warranty"
                              >
                                {isCheckingWarranty ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Checking Warranty...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Check Warranty Policy
                                  </>
                                )}
                              </Button>
                              
                              {/* Create Record Button - Show ONLY when warranty is valid AND vehicle has owner */}
                              {warrantyStatus === 'valid' && vehicleSearchResult.owner && (
                                <Button
                                  onClick={handleCreateRecordFromVin}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Record
                                </Button>
                              )}
                            </div>
                            
                            {warrantyStatus && (
                              <div className={`p-3 rounded-lg border ${
                                warrantyStatus === 'valid' 
                                  ? 'bg-green-50 border-green-200 text-green-800' 
                                  : 'bg-red-50 border-red-200 text-red-800'
                              }`}>
                                <div className="flex items-center">
                                  {warrantyStatus === 'valid' ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      <span className="font-medium">Warranty is still valid</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      <span className="font-medium">Warranty has expired</span>
                                    </>
                                  )}
                                </div>
                                {warrantyStatus === 'expired' && (
                                  <p className="text-sm mt-1">
                                    This vehicle is no longer covered under warranty policy.
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Warranty Details Display */}
                            {warrantyDetails && (
                              <div className="mt-4 space-y-4">
                                {/* General Warranty - Main Info */}
                                <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    General Warranty Coverage
                                  </h4>
                                  
                                  <div className="grid md:grid-cols-2 gap-4">
                                    {/* Duration Status */}
                                    <div className="bg-blue-50 rounded p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-600">Time Coverage</span>
                                        <Badge variant={
                                          ((warrantyDetails.generalWarranty?.duration?.status === 'ACTIVE' || warrantyDetails.generalWarranty?.duration?.status === true) &&
                                           (warrantyDetails.generalWarranty?.duration?.remainingDays || 0) > 0) 
                                            ? 'default' 
                                            : 'destructive'
                                        } className="text-xs">
                                          {(warrantyDetails.generalWarranty?.duration?.remainingDays || 0) === 0 
                                            ? 'EXPIRED' 
                                            : (warrantyDetails.generalWarranty?.duration?.status === 'ACTIVE' || warrantyDetails.generalWarranty?.duration?.status === true) ? 'ACTIVE' : 'EXPIRED'}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <p className={`text-2xl font-bold ${(warrantyDetails.generalWarranty?.duration?.remainingDays || 0) === 0 ? 'text-red-600' : 'text-blue-900'}`}>
                                          {warrantyDetails.generalWarranty?.duration?.remainingDays || 0} days
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Until: {warrantyDetails.generalWarranty?.duration?.endDate ? 
                                            new Date(warrantyDetails.generalWarranty.duration.endDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Policy: {warrantyDetails.generalWarranty?.policy?.durationMonths || 0} months
                                        </p>
                                      </div>
                                    </div>

                                    {/* Odometer Status */}
                                    <div className="bg-green-50 rounded p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-600">Odometer Coverage</span>
                                        <Badge variant={
                                          (warrantyDetails.generalWarranty?.mileage?.status === 'ACTIVE' && 
                                           (warrantyDetails.generalWarranty?.mileage?.remainingMileage || 0) > 0) 
                                            ? 'default' 
                                            : 'destructive'
                                        } className="text-xs">
                                          {(warrantyDetails.generalWarranty?.mileage?.remainingMileage || 0) === 0 
                                            ? 'EXPIRED' 
                                            : warrantyDetails.generalWarranty?.mileage?.status || 'N/A'}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <p className={`text-2xl font-bold ${(warrantyDetails.generalWarranty?.mileage?.remainingMileage || 0) === 0 ? 'text-red-600' : 'text-green-900'}`}>
                                          {warrantyDetails.generalWarranty?.mileage?.remainingMileage?.toLocaleString() || 0} km
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Remaining odometer
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Limit: {warrantyDetails.generalWarranty?.policy?.mileageLimit?.toLocaleString() || 0} km
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Total Components Info */}
                                  {warrantyDetails.componentWarranties && warrantyDetails.componentWarranties.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600 flex items-center">
                                          <Wrench className="h-4 w-4 mr-2 text-blue-600" />
                                          Additional Component Coverage
                                        </span>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                                          Total components: {warrantyDetails.componentWarranties.length}
                                        </Badge>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Component Warranties - Secondary Info */}
                                {warrantyDetails.componentWarranties && warrantyDetails.componentWarranties.length > 0 && (
                                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center">
                                      <span className="mr-2">🔧</span>
                                      Component Warranties (Additional Coverage)
                                    </h4>
                                    <div className="space-y-2">
                                      {warrantyDetails.componentWarranties.map((component: any, index: number) => {
                                        const isDurationActive = component.duration?.status === 'ACTIVE' || component.duration?.status === true;
                                        const isMileageActive = component.mileage?.status === 'ACTIVE';
                                        const remainingOdo = component.mileage?.remainingMileage || 0;
                                        const remainingDays = component.duration?.remainingDays || 0;
                                        
                                        // EXPIRED khi: 0 km HOẶC 0 days HOẶC duration/mileage không ACTIVE
                                        const isExpired = remainingOdo === 0 || remainingDays === 0 || !isDurationActive || !isMileageActive;
                                        const isActive = !isExpired;
                                        
                                        // Xác định màu sắc:
                                        // EXPIRED = xám nhạt background, chữ đậm hơn
                                        // ACTIVE = trắng
                                        let bgColor = isExpired ? 'bg-gray-400' : 'bg-white';
                                        let borderColor = isExpired ? 'border-gray-500' : 'border-gray-200';
                                        let textColor = isExpired ? 'text-gray-800' : 'text-gray-800';
                                        
                                        return (
                                        <div key={index} className={`${bgColor} border ${borderColor} rounded p-3`}>
                                          <div className="flex items-center justify-between mb-2">
                                            <span className={`font-medium text-sm ${textColor}`}>{component.componentName}</span>
                                            <Badge 
                                              variant={isActive ? "outline" : "destructive"} 
                                              className={isExpired ? 'bg-red-600 text-white font-semibold' : ''}
                                            >
                                              {isExpired ? '✗ EXPIRED' : '✓ ACTIVE'}
                                            </Badge>
                                          </div>
                                          <div className={`grid grid-cols-2 gap-2 text-xs ${isExpired ? 'text-gray-700' : 'text-gray-600'}`}>
                                            <div>
                                              <span className={isExpired ? 'text-gray-800' : 'text-gray-500'}>Duration:</span> {remainingDays} days left
                                            </div>
                                            <div>
                                              <span className={isExpired ? 'text-gray-800' : 'text-gray-500'}>Odometer:</span> {remainingOdo.toLocaleString()} km left
                                            </div>
                                            <div>
                                              <span className={isExpired ? 'text-gray-800' : 'text-gray-500'}>Policy Duration:</span> {component.policy?.durationMonths || 0} months
                                            </div>
                                            <div>
                                              <span className={isExpired ? 'text-gray-800' : 'text-gray-500'}>Odometer Limit:</span> {component.policy?.mileageLimit?.toLocaleString() || 0} km
                                            </div>
                                          </div>
                                        </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Owner Status */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Owner Status:</Label>
                        <div className="md:col-span-2">
                          {vehicleSearchResult.owner ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Owner Registered
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">
                              <User className="mr-1 h-3 w-3" />
                              No Owner
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warranty Status Message */}
                  {warrantyStatus === 'expired' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-600 mr-3" />
                        <div>
                          <h4 className="font-semibold text-red-800">Warranty Expired</h4>
                          <p className="text-sm text-red-700 mt-1">
                            This vehicle's warranty has expired. Customer registration is not available for expired warranties.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Search Section - Only show if warranty is valid AND vehicle has no owner */}
                  {warrantyStatus === 'valid' && !vehicleSearchResult.owner && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <Search className="mr-2 h-4 w-4" />
                        Search Customer by Phone
                        <Badge variant="outline" className="ml-2 text-xs bg-green-100 text-green-800">
                          Warranty Valid
                        </Badge>
                      </h4>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Input
                            placeholder="Enter customer phone number"
                            value={customerSearchPhone}
                            onChange={(e) => {
                              const numericValue = e.target.value.replace(/[^0-9]/g, '');
                              setCustomerSearchPhone(numericValue);
                            }}
                            onKeyPress={handleWarrantyPhoneSearchKeyPress}
                            className="bg-white"
                          />
                        </div>
                        <Button
                          onClick={() => handleSearchCustomerByPhone()}
                          disabled={isSearchingCustomer || !customerSearchPhone.trim()}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isSearchingCustomer ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Searching...
                            </>
                          ) : (
                            <>
                              <Search className="h-4 w-4 mr-2" />
                              Search
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Search Result Status */}
                      {hasSearchedCustomer && (
                        <div className="p-3 bg-white rounded-lg border">
                          {foundCustomer ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                              <span className="text-sm font-medium text-green-800">
                                Customer found: {foundCustomer.fullName}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <User className="h-4 w-4 text-gray-500 mr-2" />
                              <span className="text-sm font-medium text-gray-700">
                                Customer not found. You can enter new customer information below.
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  )}

                  {/* Owner Information Section - Show when: 1) Vehicle has owner OR 2) After customer search */}
                  {warrantyStatus === 'valid' && warrantyDetails && (vehicleSearchResult.owner || hasSearchedCustomer) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-4 flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Owner Information
                        {!vehicleSearchResult.owner && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {foundCustomer ? 'Existing Customer' : 'New Customer'}
                          </Badge>
                        )}
                      </h4>
                      <div className="grid gap-4">
                        <div className="grid md:grid-cols-3 gap-2 items-center">
                          <Label className="font-medium text-gray-700">Full Name:</Label>
                          <div className="md:col-span-2">
                            <Input
                              value={ownerForm.fullName}
                              onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
                              placeholder="Enter full name"
                              className="bg-white border-green-300 focus:border-green-500"
                              disabled={!!vehicleSearchResult.owner}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2 items-center">
                          <Label className="font-medium text-gray-700">Phone:</Label>
                          <div className="md:col-span-2">
                            <Input
                              value={ownerForm.phone}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                setOwnerForm({ ...ownerForm, phone: numericValue });
                              }}
                              placeholder="Enter 10-digit phone number"
                              maxLength={10}
                              className="bg-white border-green-300 focus:border-green-500 font-mono"
                              disabled={!!vehicleSearchResult.owner}
                            />
                            {ownerForm.phone && ownerForm.phone.length !== 10 && !vehicleSearchResult.owner && (
                              <p className="text-xs text-red-500 mt-1">Phone must be exactly 10 digits</p>
                            )}
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2 items-center">
                          <Label className="font-medium text-gray-700">Email:</Label>
                          <div className="md:col-span-2">
                            <Input
                              type="email"
                              value={ownerForm.email}
                              onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                              placeholder="Enter email address"
                              className="bg-white border-green-300 focus:border-green-500"
                              disabled={!!vehicleSearchResult.owner}
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2 items-center">
                          <Label className="font-medium text-gray-700">Address:</Label>
                          <div className="md:col-span-2">
                            <Input
                              value={ownerForm.address}
                              onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
                              placeholder="Enter address"
                              className="bg-white border-green-300 focus:border-green-500"
                              disabled={!!vehicleSearchResult.owner}
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Save Changes Button - Only show if vehicle has no owner */}
                      {!vehicleSearchResult.owner && (
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <Button 
                            onClick={handleSaveChanges}
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Car className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Vehicle Search Performed
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enter a VIN above and click "Find Vehicle" to search for vehicle and owner information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Customer Search Results Section - Only show in phone mode */}
        {searchMode === 'phone' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Customer Search Results</CardTitle>
              <CardDescription>Search for customers by phone number</CardDescription>
            </CardHeader>
            <CardContent>
              {foundCustomer ? (
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-purple-800 flex items-center">
                        <User className="mr-2 h-5 w-5" />
                        Customer Information
                      </h3>
                      {!isEditingCustomer ? (
                        <Button
                          onClick={handleEditCustomer}
                          size="sm"
                          variant="outline"
                          className="border-purple-300 text-purple-700 hover:bg-purple-100"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            onClick={handleUpdateCustomer}
                            size="sm"
                            disabled={isUpdatingCustomer}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            {isUpdatingCustomer ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            onClick={handleCancelEditCustomer}
                            size="sm"
                            variant="outline"
                            disabled={isUpdatingCustomer}
                            className="border-gray-300"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-4">
                      {/* Full Name */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Full Name:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={isEditingCustomer ? editCustomerForm.fullName : (foundCustomer.fullName || '')}
                            onChange={(e) => isEditingCustomer && setEditCustomerForm({ ...editCustomerForm, fullName: e.target.value })}
                            disabled={!isEditingCustomer}
                            className={isEditingCustomer ? "bg-white" : "bg-gray-100"}
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Phone Number:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={isEditingCustomer ? editCustomerForm.phone : (foundCustomer.phone || '')}
                            onChange={(e) => {
                              if (isEditingCustomer) {
                                const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                                setEditCustomerForm({ ...editCustomerForm, phone: numericValue });
                              }
                            }}
                            disabled={!isEditingCustomer}
                            maxLength={10}
                            className={isEditingCustomer ? "bg-white font-mono" : "bg-gray-100 font-mono"}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Email:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={isEditingCustomer ? editCustomerForm.email : (foundCustomer.email || '')}
                            onChange={(e) => isEditingCustomer && setEditCustomerForm({ ...editCustomerForm, email: e.target.value })}
                            disabled={!isEditingCustomer}
                            type="email"
                            className={isEditingCustomer ? "bg-white" : "bg-gray-100"}
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Address:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={isEditingCustomer ? editCustomerForm.address : (foundCustomer.address || '')}
                            onChange={(e) => isEditingCustomer && setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                            disabled={!isEditingCustomer}
                            className={isEditingCustomer ? "bg-white" : "bg-gray-100"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Vehicles */}
                  {foundCustomer?.vehicles && Array.isArray(foundCustomer.vehicles) && foundCustomer.vehicles.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <Car className="mr-2 h-5 w-5" />
                        Customer's Vehicles ({foundCustomer.vehicles.length})
                      </h3>
                      <div className="space-y-3">
                        {foundCustomer.vehicles.map((vehicle: any, index: number) => (
                          <div key={vehicle?.vin || index} className="bg-white border border-blue-200 rounded p-4">
                            <div className="grid md:grid-cols-2 gap-3 mb-4">
                              <div>
                                <span className="text-sm font-medium text-gray-600">VIN: </span>
                                <span className="text-sm font-mono">{vehicle?.vin || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Model: </span>
                                <span className="text-sm">{vehicle?.model?.modelName || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">License Plate: </span>
                                <span className="text-sm">{vehicle?.licensePlate || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Purchase Date: </span>
                                <span className="text-sm">
                                  {vehicle?.purchaseDate 
                                    ? new Date(vehicle.purchaseDate).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric'
                                      }).split('/').join('/')
                                    : 'N/A'}
                                </span>
                              </div>
                            </div>

                            {/* Warranty Check Section for this vehicle */}
                            {selectedVehicleForWarranty?.vin === vehicle.vin ? (
                              <div className="border-t pt-4 space-y-3">
                                <h5 className="font-medium text-gray-800">Check Warranty for this Vehicle</h5>
                                <div className="flex gap-3 items-end">
                                  <div className="flex-1">
                                    <Label className="text-sm">Odometer (km):</Label>
                                    <Input
                                      type="number"
                                      value={vehicleOdometer}
                                      onChange={(e) => setVehicleOdometer(e.target.value)}
                                      placeholder="Enter current odometer reading"
                                      className="mt-1"
                                    />
                                  </div>
                                  <Button
                                    onClick={() => handleCheckVehicleWarranty(vehicle)}
                                    disabled={isCheckingVehicleWarranty}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {isCheckingVehicleWarranty ? 'Checking...' : 'Check Warranty'}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="border-t pt-4 flex gap-2">
                                <Button
                                  onClick={() => {
                                    setSelectedVehicleForWarranty(vehicle);
                                    setVehicleOdometer('');
                                    setVehicleWarrantyStatus(null);
                                  }}
                                  variant="outline"
                                  size="sm"
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                >
                                  Check Warranty
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Register New Vehicle Section */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                      <Plus className="mr-2 h-5 w-5" />
                      Register New Vehicle
                    </h3>
                    <p className="text-sm text-green-700 mb-4">
                      If the customer wants to register a new vehicle for warranty, enter the VIN below:
                    </p>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label className="text-sm">Vehicle VIN:</Label>
                        <Input
                          value={newVehicleVin}
                          onChange={(e) => setNewVehicleVin(e.target.value.toUpperCase())}
                          onKeyPress={handleRegisterVehicleKeyPress}
                          placeholder="Enter VIN number"
                          className="mt-1 font-mono"
                        />
                      </div>
                      <Button
                        onClick={handleRegisterNewVehicle}
                        disabled={!newVehicleVin.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Register Vehicle
                      </Button>
                    </div>
                  </div>
                </div>
              ) : hasSearchedCustomer ? (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Customer Found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    No customer found with the provided phone number. Please check and try again.
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">
                    No Customer Search Performed
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Enter a phone number above and click "Search Customer" to search for customer information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {/* dialog search */}
      <Dialog open={isDialogSearch} onOpenChange={setIsDialogSearch}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>VIN Warranty</span>
            </DialogTitle>
            <DialogDescription>
              Vehicle warranty information and coverage details
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4" >
            <div className="grid gap-2">
              <Label>VIN Number</Label>
              <Input
                id="vinNumber"
                placeholder="VIN" 
                value={vinData.vinNumber}
                readOnly              
              />
            </div>

            <div className="grid gap-2">
              <Label>Warranty Status</Label>
              <Input
                id="Status"
                placeholder="Warranty status"
                value={vinData.warrantyStatus}
                readOnly
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      

      {/* Nested New Case Dialog */}
      <Dialog open={isAddNewcaseOpen} onOpenChange={(open) => {
        setIsAddNewcaseOpen(open);
        if (!open) {
          setCurrentCaseText('');
          setEditingCaseId(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCaseId ? 'Edit Case' : 'New Case'}</DialogTitle>
            <DialogDescription>
              {editingCaseId ? 'Update the case details' : 'Enter case details for this warranty record'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="caseText">Case Description *</Label>
              <Textarea
                id="caseText"
                placeholder="Describe the case..."
                value={currentCaseText}
                onChange={(e) => setCurrentCaseText(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddNewcaseOpen(false);
              setCurrentCaseText('');
              setEditingCaseId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (!currentCaseText.trim()) {
                toast({
                  title: 'Validation Error',
                  description: 'Please enter case description',
                  variant: 'destructive'
                });
                return;
              }

              if (isEditMode) {
                // Working with edit dialog
                if (editingCaseId) {
                  // Edit existing case in edit mode
                  setEditRecord({
                    ...editRecord,
                    cases: editRecord.cases.map(c => 
                      c.id === editingCaseId 
                        ? { ...c, text: currentCaseText } 
                        : c
                    )
                  });
                  toast({ title: 'Case updated successfully' });
                } else {
                  // Add new case in edit mode
                  const newCase: CaseNote = {
                    id: Date.now().toString(),
                    text: currentCaseText,
                    createdAt: new Date().toISOString()
                  };
                  setEditRecord({
                    ...editRecord,
                    cases: [...editRecord.cases, newCase]
                  });
                  toast({ title: 'Case added successfully' });
                }
              }

              setIsAddNewcaseOpen(false);
              setCurrentCaseText('');
              setEditingCaseId(null);
            }}>
              {editingCaseId ? 'Update Case' : 'Add Case'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Record Dialog */}
      <Dialog open={isEditMode} onOpenChange={(open) => {
        if (!open) setIsEditMode(false);
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>View Warranty Record</span>
            </DialogTitle>
            <DialogDescription>
              View warranty details and update status
            </DialogDescription>
          </DialogHeader>

          {isEditMode && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-vinNumber">VIN Number</Label>
                <Input
                  id="edit-vinNumber"
                  value={editRecord.vinNumber}
                  readOnly
                  className="bg-muted/50 cursor-default"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-visitorFullName">Visitor Full Name</Label>
                <Input
                  id="edit-visitorFullName"
                  value={editRecord.visitorFullName}
                  readOnly
                  className="bg-muted/50 cursor-default"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-visitorPhone">Visitor Phone</Label>
                <Input
                  id="edit-visitorPhone"
                  value={editRecord.visitorPhone}
                  readOnly
                  className="bg-muted/50 cursor-default font-mono"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-odometer">Odometer (km)</Label>
                <Input
                  id="edit-odometer"
                  type="number"
                  value={editRecord.odometer}
                  readOnly
                  className="bg-muted/50 cursor-default"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status *</Label>
                <select
                  id="edit-status"
                  value={editRecord.rawStatus}
                  onChange={(e) => setEditRecord({ 
                    ...editRecord, 
                    rawStatus: e.target.value,
                    status: mapApiStatus(e.target.value)
                  })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="IN_DIAGNOSIS">In Diagnosis</option>
                  <option value="WAITING_CUSTOMER_APPROVAL">Waiting Customer Approval</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Cases ({editRecord.cases?.length || 0})</Label>
                </div>
                {editRecord.cases && editRecord.cases.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                    {editRecord.cases.map((caseNote, index) => (
                      <div key={caseNote.id} className="p-3 bg-muted/50 rounded-md border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">Case {index + 1}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(caseNote.createdAt)}</span>
                          </div>
                          <p className="text-sm break-words">{caseNote.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/20 rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground italic">No cases available.</p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-muted-foreground">Created Date</Label>
                <p className="text-sm">{selectedRecord && formatDate(selectedRecord.createdAt)}</p>
              </div>
            </div>
          )}

          <DialogFooter>
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Owner Dialog */}
      <Dialog open={showRegisterDialog} onOpenChange={setShowRegisterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Register Vehicle Owner</span>
            </DialogTitle>
            <DialogDescription>
              {foundCustomer ? 
                `Register ${foundCustomer.fullName} as the owner of this vehicle` :
                "Enter owner information to register this vehicle"
              }
            </DialogDescription>
          </DialogHeader>

          {foundCustomer && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">Using Existing Customer Data</span>
              </div>
              <p className="text-xs text-green-700">
                The form has been pre-filled with the customer information found in the system. You can modify any field if needed.
              </p>
            </div>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Enter full name"
                value={ownerForm.fullName}
                onChange={(e) => setOwnerForm({ ...ownerForm, fullName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="Enter 10-digit phone number"
                value={ownerForm.phone}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setOwnerForm({ ...ownerForm, phone: numericValue });
                }}
                maxLength={10}
              />
              {ownerForm.phone && ownerForm.phone.length !== 10 && (
                <p className="text-xs text-red-500">Phone must be exactly 10 digits</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={ownerForm.email}
                onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={ownerForm.address}
                onChange={(e) => setOwnerForm({ ...ownerForm, address: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRegisterDialog(false);
              setOwnerForm({ fullName: '', phone: '', email: '', address: '' });
              setCustomerSearchPhone('');
              setFoundCustomer(null);
              setHasSearchedCustomer(false);
            }}>
              Cancel
            </Button>
            <Button onClick={handleRegisterOwner} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Register Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warranty Check Dialog */}
      <Dialog open={showWarrantyDialog} onOpenChange={setShowWarrantyDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Vehicle Warranty Information</span>
            </DialogTitle>
            <DialogDescription>
              Detailed warranty coverage and status for this vehicle
            </DialogDescription>
          </DialogHeader>

          {!warrantyDialogData && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading warranty information...</p>
              </div>
            </div>
          )}

          {warrantyDialogData && (
            <div className="grid gap-6 py-4">
              {/* Vehicle Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">VIN:</span> {currentVehicleForWarranty?.vin || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Model:</span> {
                      typeof currentVehicleForWarranty?.model === 'string' 
                        ? currentVehicleForWarranty.model 
                        : currentVehicleForWarranty?.model?.modelName || 'N/A'
                    }
                  </div>
                  <div>
                    <span className="font-medium">License Plate:</span> {currentVehicleForWarranty?.licensePlate || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Purchase Date:</span> {
                      currentVehicleForWarranty?.purchaseDate 
                        ? new Date(currentVehicleForWarranty.purchaseDate).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })
                        : 'N/A'
                    }
                  </div>
                </div>
              </div>

              {/* General Warranty */}
              {warrantyDialogData.generalWarranty && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    General Warranty
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Duration */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">Duration Coverage</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge variant={
                            (warrantyDialogData.generalWarranty.duration?.status === 'ACTIVE' && 
                             (warrantyDialogData.generalWarranty.duration?.remainingDays || 0) > 0) 
                              ? 'default' 
                              : 'destructive'
                          }>
                            {(warrantyDialogData.generalWarranty.duration?.remainingDays || 0) === 0 
                              ? 'EXPIRED' 
                              : warrantyDialogData.generalWarranty.duration?.status || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Policy Duration:</span>
                          <span className="font-medium">{warrantyDialogData.generalWarranty.policy?.durationMonths || 0} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span>End Date:</span>
                          <span className="text-green-600">{
                            warrantyDialogData.generalWarranty.duration?.endDate 
                              ? (typeof warrantyDialogData.generalWarranty.duration.endDate === 'string' 
                                  ? warrantyDialogData.generalWarranty.duration.endDate 
                                  : new Date(warrantyDialogData.generalWarranty.duration.endDate).toLocaleDateString())
                              : 'N/A'
                          }</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining Days:</span>
                          <span className={`font-medium ${(warrantyDialogData.generalWarranty.duration?.remainingDays || 0) === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {warrantyDialogData.generalWarranty.duration?.remainingDays?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Mileage */}
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Mileage Coverage</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge variant={
                            (warrantyDialogData.generalWarranty.mileage?.status === 'ACTIVE' && 
                             (warrantyDialogData.generalWarranty.mileage?.remainingMileage || 0) > 0) 
                              ? 'default' 
                              : 'destructive'
                          }>
                            {(warrantyDialogData.generalWarranty.mileage?.remainingMileage || 0) === 0 
                              ? 'EXPIRED' 
                              : warrantyDialogData.generalWarranty.mileage?.status || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Policy Limit:</span>
                          <span className="font-medium">{warrantyDialogData.generalWarranty.policy?.mileageLimit?.toLocaleString() || 'N/A'} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Odometer:</span>
                          <span>{parseInt(vehicleOdometer)?.toLocaleString() || 0} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Remaining:</span>
                          <span className={`font-medium ${(warrantyDialogData.generalWarranty.mileage?.remainingMileage || 0) === 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {warrantyDialogData.generalWarranty.mileage?.remainingMileage?.toLocaleString() || 0} km
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Component Warranties */}
              {warrantyDialogData?.componentWarranties && warrantyDialogData.componentWarranties.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Wrench className="h-4 w-4 mr-2 text-blue-500" />
                    Component Warranties ({warrantyDialogData.componentWarranties.length} components)
                  </h3>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                    {warrantyDialogData.componentWarranties.map((component: any, index: number) => {
                      const isDurationActive = component.duration?.status === 'ACTIVE';
                      const isMileageActive = component.mileage?.status === 'ACTIVE';
                      const remainingOdo = component.mileage?.remainingMileage || 0;
                      const remainingDays = component.duration?.remainingDays || 0;
                      
                      // EXPIRED khi: 0 km HOẶC 0 days HOẶC duration/mileage không ACTIVE
                      const isExpired = remainingOdo === 0 || remainingDays === 0 || !isDurationActive || !isMileageActive;
                      const isComponentValid = !isExpired;
                      
                      // Xác định màu sắc:
                      // EXPIRED = xám nhạt background, chữ đỏ
                      // ACTIVE = xanh
                      let bgColor = isExpired ? 'bg-gray-400' : 'bg-green-50';
                      let borderColor = isExpired ? 'border-gray-500' : 'border-green-200';
                      let textColor = isExpired ? 'text-gray-800' : 'text-gray-800';
                      
                      return (
                        <div key={component.typeComponentId || index} className={`p-3 rounded-lg border ${bgColor} ${borderColor}`}>
                          <h4 className={`font-medium text-sm mb-2 ${textColor}`}>
                            {component.componentName || `Component ${index + 1}`}
                          </h4>
                          <div className="space-y-1 text-xs">
                            {/* Overall Status */}
                            <div className="flex justify-between mb-2">
                              <span className={`font-medium ${isExpired ? 'text-gray-700' : ''}`}>Overall:</span>
                              <Badge 
                                variant={isComponentValid ? 'default' : 'destructive'} 
                                className={isExpired ? 'bg-red-600 text-white font-semibold' : ''}
                              >
                                {isExpired ? '✗ EXPIRED' : '✓ ACTIVE'}
                              </Badge>
                            </div>

                            {/* Duration Info */}
                            <div className="flex justify-between">
                              <span className={isExpired ? 'text-gray-700' : ''}>Duration:</span>
                              <Badge 
                                variant={isDurationActive ? 'default' : 'destructive'}
                                className={isExpired ? 'bg-red-600 text-white font-semibold' : ''}
                              >
                                {isDurationActive ? 'ACTIVE' : 'EXPIRED'}
                              </Badge>
                            </div>
                            
                            {/* Mileage Info */}
                            <div className="flex justify-between">
                              <span className={isExpired ? 'text-gray-700' : ''}>Mileage:</span>
                              <Badge 
                                variant={isMileageActive ? 'default' : 'destructive'}
                                className={isExpired ? 'bg-red-600 text-white font-semibold' : ''}
                              >
                                {isMileageActive && remainingOdo > 0 ? 'ACTIVE' : 'EXPIRED'}
                              </Badge>
                            </div>

                            <hr className="my-1" />

                            {/* Policy Details */}
                            <div className="flex justify-between">
                              <span className={isExpired ? 'text-gray-700' : ''}>Policy:</span>
                              <span className={`font-medium ${isExpired ? 'text-gray-800' : ''}`}>{component.policy?.durationMonths || 0}m / {component.policy?.mileageLimit?.toLocaleString() || 'N/A'}km</span>
                            </div>

                            {/* Remaining Details */}
                            <div className="flex justify-between">
                              <span className={isExpired ? 'text-gray-700' : ''}>Expires:</span>
                              <span className={`text-xs ${isExpired ? 'text-gray-800' : 'text-blue-600'}`}>{
                                component.duration?.endDate 
                                  ? (typeof component.duration.endDate === 'string' 
                                      ? component.duration.endDate 
                                      : new Date(component.duration.endDate).toLocaleDateString())
                                  : 'N/A'
                              }</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={isExpired ? 'text-gray-700' : ''}>Days left:</span>
                              <span className={`font-medium ${isExpired ? 'text-gray-800' : remainingDays === 0 ? 'text-red-600' : 'text-green-600'}`}>{remainingDays.toLocaleString()}</span>
                            </div>
                            
                            <div className="flex justify-between">
                              <span className={isExpired ? 'text-gray-700' : ''}>KM left:</span>
                              <span className={`font-medium ${isExpired ? 'text-gray-800' : remainingOdo === 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {remainingOdo.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Overall Status */}
              <div className={`p-4 rounded-lg ${vehicleWarrantyStatus === 'valid' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center space-x-2">
                  {vehicleWarrantyStatus === 'valid' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <h3 className={`font-semibold ${vehicleWarrantyStatus === 'valid' ? 'text-green-800' : 'text-red-800'}`}>
                    {vehicleWarrantyStatus === 'valid' ? 'Warranty Active' : 'Warranty Expired'}
                  </h3>
                </div>
                <p className={`mt-2 text-sm ${vehicleWarrantyStatus === 'valid' ? 'text-green-700' : 'text-red-700'}`}>
                  {vehicleWarrantyStatus === 'valid' 
                    ? 'This vehicle is covered under warranty. You can create a warranty processing record.'
                    : 'This vehicle\'s warranty has expired. No warranty claims can be processed.'
                  }
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarrantyDialog(false)}>
              Close
            </Button>
            {vehicleWarrantyStatus === 'valid' && (
              <Button 
                onClick={() => {
                  handleCreateRecord(currentVehicleForWarranty);
                  setShowWarrantyDialog(false);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Warranty Record
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Warranty Record Dialog */}
      <Dialog open={showCreateWarrantyDialog} onOpenChange={(open) => {
        setShowCreateWarrantyDialog(open);
        if (!open) {
          // Reset OTP states when closing dialog
          setOtpCode('');
          setOtpSent(false);
          setOtpVerified(false);
          setOtpCountdown(0);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Create New Warranty Record</span>
            </DialogTitle>
            <DialogDescription>
              Enter vehicle and customer information to create a new warranty record
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* VIN Number - Read Only */}
            <div className="grid gap-2">
              <Label htmlFor="record-vin">VIN Number *</Label>
              <Input
                id="record-vin"
                value={warrantyRecordForm.vin}
                readOnly
                className="bg-gray-100"
                placeholder="Enter VIN (17 characters)"
              />
            </div>

            {/* Customer Name - Read Only */}
            <div className="grid gap-2">
              <Label htmlFor="record-customer">Customer Name *</Label>
              <Input
                id="record-customer"
                value={warrantyRecordForm.customerName}
                readOnly
                className="bg-gray-100"
                placeholder="Customer name"
              />
            </div>

            {/* Odometer - Read Only */}
            <div className="grid gap-2">
              <Label htmlFor="record-odometer">Odometer (km) *</Label>
              <Input
                id="record-odometer"
                value={warrantyRecordForm.odometer}
                readOnly
                className="bg-gray-100"
                placeholder="Enter current odometer reading"
              />
            </div>

            {/* Visitor Full Name - Editable */}
            <div className="grid gap-2">
              <Label htmlFor="visitor-fullname">Visitor Full Name *</Label>
              <Input
                id="visitor-fullname"
                value={warrantyRecordForm.visitorFullName}
                onChange={(e) => setWarrantyRecordForm(prev => ({ ...prev, visitorFullName: e.target.value }))}
                placeholder="Enter visitor's full name"
                className="border-green-300 focus:border-green-500"
              />
            </div>

            {/* Visitor Phone - Editable */}
            <div className="grid gap-2">
              <Label htmlFor="visitor-phone">Visitor Phone *</Label>
              <Input
                id="visitor-phone"
                type="tel"
                value={warrantyRecordForm.visitorPhone}
                onChange={(e) => setWarrantyRecordForm(prev => ({ ...prev, visitorPhone: e.target.value }))}
                placeholder="Enter visitor's phone number"
                className="border-green-300 focus:border-green-500"
              />
            </div>

            {/* Customer Email - Editable */}
            <div className="grid gap-2">
              <Label htmlFor="customer-email">Customer Email *</Label>
              <div className="flex gap-2">
                <Input
                  id="customer-email"
                  type="email"
                  value={warrantyRecordForm.customerEmail}
                  onChange={(e) => {
                    setWarrantyRecordForm(prev => ({ ...prev, customerEmail: e.target.value }));
                    // Reset OTP states when email changes
                    setOtpSent(false);
                    setOtpVerified(false);
                    setOtpCode('');
                    setOtpCountdown(0);
                  }}
                  placeholder="Enter customer email address"
                  className="flex-1 border-green-300 focus:border-green-500"
                  disabled={otpVerified}
                />
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={!warrantyRecordForm.customerEmail || isSendingOtp || otpVerified || (otpSent && otpCountdown > 0)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSendingOtp ? 'Sending...' : otpSent && otpCountdown > 0 ? `Resend (${Math.floor(otpCountdown / 60)}:${(otpCountdown % 60).toString().padStart(2, '0')})` : otpVerified ? 'Verified ✓' : 'Send OTP'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">OTP will be sent to this email address</p>
            </div>

            {/* OTP Verification Section */}
            {otpSent && !otpVerified && (
              <div className="grid gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <Label htmlFor="otp-code" className="text-blue-900 font-semibold">Enter OTP Code</Label>
                </div>
                <p className="text-xs text-blue-700 mb-2">
                  A 6-digit OTP code has been sent to {warrantyRecordForm.customerEmail}. 
                  Valid for {Math.floor(otpCountdown / 60)}:{(otpCountdown % 60).toString().padStart(2, '0')} minutes.
                </p>
                <div className="flex gap-2">
                  <Input
                    id="otp-code"
                    type="text"
                    value={otpCode}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                      setOtpCode(numericValue);
                    }}
                    placeholder="Enter 6-digit OTP"
                    className="flex-1 font-mono text-center text-lg"
                    maxLength={6}
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={!otpCode || otpCode.length !== 6}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {/* OTP Verified Success Message */}
            {otpVerified && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Email verified successfully! You can now create the record.</span>
              </div>
            )}

            {/* Cases Section */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Cases * ({warrantyRecordForm.cases.length})</Label>
              </div>

              {/* Add Case Input */}
              <div className="flex gap-2">
                <Textarea
                  value={warrantyRecordCaseText}
                  onChange={(e) => setWarrantyRecordCaseText(e.target.value)}
                  placeholder="Describe the warranty case..."
                  rows={3}
                  className="flex-1"
                  onKeyDown={(e) => {
                    // Allow adding case with Ctrl+Enter
                    if (e.ctrlKey && e.key === 'Enter' && warrantyRecordCaseText.trim()) {
                      handleAddWarrantyCase();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleAddWarrantyCase}
                  disabled={!warrantyRecordCaseText.trim()}
                  className="self-end"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Press Ctrl+Enter or click "Add" to add the case</p>

              {/* Cases List */}
              {warrantyRecordForm.cases.length === 0 ? (
                <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <p>No cases added yet. Enter description above and click "Add".</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {warrantyRecordForm.cases.map((caseItem, index) => (
                    <div key={caseItem.id} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">Case {index + 1}</Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(caseItem.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{caseItem.text}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWarrantyCase(caseItem.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateWarrantyDialog(false);
                setWarrantyRecordForm({ vin: '', odometer: '', purchaseDate: '', customerName: '', cases: [], visitorFullName: '', visitorPhone: '', customerEmail: '' });
                setWarrantyRecordCaseText('');
                // Reset OTP states
                setOtpCode('');
                setOtpSent(false);
                setOtpVerified(false);
                setOtpCountdown(0);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitWarrantyRecord}
              disabled={warrantyRecordForm.cases.length === 0 || isCreatingRecord || !warrantyRecordForm.visitorFullName.trim() || !warrantyRecordForm.visitorPhone.trim() || !warrantyRecordForm.customerEmail.trim() || !otpVerified}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isCreatingRecord ? 'Creating...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Caselines Dialog */}
      <Dialog open={showCaselineDialog} onOpenChange={setShowCaselineDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>View Caselines</span>
            </DialogTitle>
            <DialogDescription>
              {selectedRecordForCaseline && (
                <>
                  VIN: <span className="font-mono font-semibold">{selectedRecordForCaseline.vinNumber}</span> - 
                  Odometer: <span className="font-semibold">{selectedRecordForCaseline.odometer} km</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingCaselines ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-3 text-muted-foreground">Loading caselines...</span>
              </div>
            ) : caselines.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No Caselines Found</p>
                <p className="text-sm text-gray-500 mt-1">
                  This record has no caselines yet. The technician needs to create them.
                </p>
              </div>
            ) : (
              <>
                {caselines.filter(c => c.status === 'PENDING_APPROVAL').length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-100 rounded-full p-2">
                        <Clock className="h-5 w-5 text-yellow-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-900 mb-1">
                          {caselines.filter(c => c.status === 'PENDING_APPROVAL').length} Caseline{caselines.filter(c => c.status === 'PENDING_APPROVAL').length > 1 ? 's' : ''} Awaiting Your Decision
                        </h4>
                        <p className="text-sm text-yellow-800">
                          Review and approve or reject the caselines below. Click the buttons on each caseline, then submit your decisions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              <div className="space-y-4">
                {caselines.map((caseline, index) => {
                  const isApproved = selectedCaselineIds.approved.includes(caseline.id);
                  const isRejected = selectedCaselineIds.rejected.includes(caseline.id);
                  const isPendingApproval = caseline.status === 'PENDING_APPROVAL';
                  
                  return (
                  <div 
                    key={caseline.id || index} 
                    className={`border rounded-lg p-4 transition-all ${
                      isApproved ? 'bg-green-50 border-green-300' :
                      isRejected ? 'bg-red-50 border-red-300' :
                      'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-sm">
                          Caseline #{index + 1}
                        </Badge>
                        <Badge className={
                          caseline.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          caseline.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          caseline.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                          caseline.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          caseline.status === 'REJECTED_BY_TECH' ? 'bg-red-100 text-red-800' :
                          caseline.status === 'REJECTED_BY_CUSTOMER' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {caseline.status === 'PENDING_APPROVAL' ? '⏳ PENDING APPROVAL' : caseline.status || 'N/A'}
                        </Badge>
                        {caseline.warrantyStatus && (
                          <Badge className={
                            caseline.warrantyStatus === 'UNDER_WARRANTY' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {caseline.warrantyStatus === 'UNDER_WARRANTY' ? 'Under Warranty' : 'Out of Warranty'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {/* Guarantee Case Info */}
                      {caseline.contentGuarantee && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3">
                          <Label className="text-xs text-blue-700 font-semibold">Related Case:</Label>
                          <p className="text-sm text-blue-900 mt-1">{caseline.contentGuarantee}</p>
                        </div>
                      )}

                      {/* Diagnosis Text */}
                      {caseline.diagnosisText && (
                        <div>
                          <Label className="text-xs text-gray-600 font-semibold">Diagnosis:</Label>
                          <p className="text-sm mt-1 text-gray-800">{caseline.diagnosisText}</p>
                        </div>
                      )}

                      {/* Correction Text */}
                      {caseline.correctionText && (
                        <div>
                          <Label className="text-xs text-gray-600 font-semibold">Correction:</Label>
                          <p className="text-sm mt-1 text-gray-800">{caseline.correctionText}</p>
                        </div>
                      )}

                      {/* Quantity */}
                      {caseline.quantity && (
                        <div>
                          <Label className="text-xs text-gray-600 font-semibold">Quantity:</Label>
                          <p className="text-sm mt-1 text-gray-800">{caseline.quantity}</p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {caseline.rejectionReason && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <Label className="text-xs text-red-700 font-semibold">Rejection Reason:</Label>
                          <p className="text-sm text-red-900 mt-1">{caseline.rejectionReason}</p>
                        </div>
                      )}

                      {/* Technician Info */}
                      <div className="flex gap-4 text-xs text-gray-500">
                        {caseline.diagnosticTechId && (
                          <span>Diagnostic Tech ID: {caseline.diagnosticTechId}</span>
                        )}
                        {caseline.repairTechId && (
                          <span>Repair Tech ID: {caseline.repairTechId}</span>
                        )}
                      </div>

                      {/* Approve/Reject Buttons for PENDING_APPROVAL status */}
                      {caseline.status === 'PENDING_APPROVAL' && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={selectedCaselineIds.approved.includes(caseline.id) ? 'default' : 'outline'}
                              className={selectedCaselineIds.approved.includes(caseline.id) ? 'bg-green-600 hover:bg-green-700' : 'border-green-600 text-green-700 hover:bg-green-50'}
                              onClick={() => handleToggleApprove(caseline.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {selectedCaselineIds.approved.includes(caseline.id) ? 'Selected for Approval' : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedCaselineIds.rejected.includes(caseline.id) ? 'destructive' : 'outline'}
                              className={selectedCaselineIds.rejected.includes(caseline.id) ? '' : 'border-red-600 text-red-700 hover:bg-red-50'}
                              onClick={() => handleToggleReject(caseline.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {selectedCaselineIds.rejected.includes(caseline.id) ? 'Selected for Rejection' : 'Reject'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
              </div>
              </>
            )}

            {/* OTP Verification Section - Show when caselines are selected */}
            {(selectedCaselineIds.approved.length > 0 || selectedCaselineIds.rejected.length > 0) && (
              <div className="mt-6 p-4 border-t border-gray-200 bg-blue-50 rounded-lg space-y-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">OTP Verification Required</h3>
                </div>
                <p className="text-sm text-blue-700 mb-3">
                  Please verify your identity with OTP before approving or rejecting caselines.
                </p>

                {/* Email Input */}
                <div>
                  <Label htmlFor="caselineApproverEmail">Approver Email *</Label>
                  <Input
                    id="caselineApproverEmail"
                    type="email"
                    placeholder="Enter approver email address"
                    value={caselineApproverEmail}
                    onChange={(e) => setCaselineApproverEmail(e.target.value)}
                    disabled={caselineOtpVerified}
                    className="mt-1"
                  />
                </div>

                {/* Send OTP Button */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSendCaselineOtp}
                    disabled={!caselineApproverEmail || isSendingCaselineOtp || caselineOtpVerified || (caselineOtpSent && caselineOtpCountdown > 0)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSendingCaselineOtp ? 'Sending...' : caselineOtpSent && caselineOtpCountdown > 0 ? `Resend (${Math.floor(caselineOtpCountdown / 60)}:${(caselineOtpCountdown % 60).toString().padStart(2, '0')})` : caselineOtpVerified ? 'Verified ✓' : 'Send OTP'}
                  </Button>
                </div>

                {/* OTP Input and Verify Button */}
                {caselineOtpSent && !caselineOtpVerified && (
                  <div className="space-y-2">
                    <Label htmlFor="caselineOtpCode">OTP Code *</Label>
                    <div className="text-xs text-blue-600 mb-1">
                      Valid for {Math.floor(caselineOtpCountdown / 60)}:{(caselineOtpCountdown % 60).toString().padStart(2, '0')} minutes.
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="caselineOtpCode"
                        type="text"
                        placeholder="Enter 6-digit OTP code"
                        value={caselineOtpCode}
                        onChange={(e) => setCaselineOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleVerifyCaselineOtp}
                        disabled={caselineOtpCode.length !== 6}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Verify OTP
                      </Button>
                    </div>
                  </div>
                )}

                {/* Verification Success Message */}
                {caselineOtpVerified && (
                  <div className="flex items-center space-x-2 text-green-700 bg-green-50 p-3 rounded">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">OTP verified successfully. You can now submit your decisions.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {(selectedCaselineIds.approved.length > 0 || selectedCaselineIds.rejected.length > 0) && (
              <div className="flex-1 text-sm text-muted-foreground">
                Selected: {selectedCaselineIds.approved.length} approved, {selectedCaselineIds.rejected.length} rejected
              </div>
            )}
            <Button variant="outline" onClick={() => {
              setShowCaselineDialog(false);
              setSelectedCaselineIds({ approved: [], rejected: [] });
              // Reset OTP states when closing
              setCaselineApproverEmail('');
              setCaselineOtpCode('');
              setCaselineOtpSent(false);
              setCaselineOtpVerified(false);
              setCaselineOtpCountdown(0);
            }}>
              Close
            </Button>
            {(selectedCaselineIds.approved.length > 0 || selectedCaselineIds.rejected.length > 0) && (
              <Button 
                onClick={handleSubmitCaselineDecisions}
                disabled={isProcessingCaselines || !caselineOtpVerified}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessingCaselines ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Decisions
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdvisor;