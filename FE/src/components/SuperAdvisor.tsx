

import { useState } from 'react';
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
import {
  Search,
  LogOut,
  Plus,
  Edit,
  Wrench,
  CheckCircle,
  Car,
  Trash2,
  User,
  XCircle,
  Save
} from 'lucide-react';

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
  mileage: number;
  cases?: CaseNote[];
  purchaseDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

interface VinDataState {
  vinNumber: string;
  purchaseDate: string;
  warrantyStatus: string;
}

interface VehicleSearchResult {
  vin: string;
  dateOfManufacture: string;
  placeOfManufacture?: string;
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
  const { user, logout, getToken } = useAuth();
  const { toast } = useToast();
  
  const [searchVin, setSearchVin] = useState('');
  const [searchMode, setSearchMode] = useState<'warranty' | 'customer' | 'phone'>('phone');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WarrantyRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddNewcaseOpen, setIsAddNewcaseOpen] = useState(false);
  const [currentCaseText, setCurrentCaseText] = useState('');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [isDialogSearch, setIsDialogSearch] = useState(false);
  // Form state for new record
  const [newRecord, setNewRecord] = useState({
    vinNumber: '',
    mileage: '',
    customerName: '',
    cases: [] as CaseNote[],
    purchaseDate: ''
  });

  const [vinData, setVinData] = useState<VinDataState>({
    vinNumber: "",
    purchaseDate: "",
    warrantyStatus: ""
  });

  // Vehicle registration states
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
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [hasSearchedCustomer, setHasSearchedCustomer] = useState(false);

  // Warranty check states
  const [odometer, setOdometer] = useState('');
  const [isCheckingWarranty, setIsCheckingWarranty] = useState(false);
  const [warrantyStatus, setWarrantyStatus] = useState<'valid' | 'expired' | null>(null);
  const [warrantyDetails, setWarrantyDetails] = useState<any>(null);

  // Form state for editing record
  const [editRecord, setEditRecord] = useState({
    vinNumber: '',
    mileage: '',
    customerName: '',
    cases: [] as CaseNote[],
    purchaseDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed'
  });

  const [records, setRecords] = useState<WarrantyRecord[]>([]);

  // Helper: Validate record data
  const validateRecord = (record: { vinNumber: string; customerName: string; mileage: string; cases: CaseNote[]; purchaseDate: string }) => {
    return record.vinNumber && record.customerName && record.mileage && record.cases.length > 0 && record.purchaseDate;
  };

  // Helper: Calculate warranty status
  const calculateWarrantyStatus = (durationStatus?: string, mileageStatus?: string) => {
    if (durationStatus === 'ACTIVE' && mileageStatus === 'ACTIVE') return 'Active';
    if (durationStatus === 'INACTIVE' && mileageStatus === 'INACTIVE') return 'Expired (Time & Mileage)';
    if (durationStatus === 'INACTIVE') return 'Expired (Time)';
    if (mileageStatus === 'INACTIVE') return 'Expired (Mileage)';
    return 'N/A';
  };

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

    const url = `http://localhost:3000/api/v1/vehicles/${vin}/warranty?odometer=${odometer}`;
    
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
      const warrantyStatus = vehicle.generalWarranty && vehicle.purchaseDate
        ? calculateWarrantyStatus(
            vehicle.generalWarranty.duration?.status,
            vehicle.generalWarranty.mileage?.status
          )
        : 'N/A';
      
      setVinData({
        vinNumber: vehicle.vin || '',
        purchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString('vi-VN') : '',
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

  const handleSearchCustomer = async () => {
    try {
      console.log('🔍 Starting vehicle search...');
      
      // Reset customer search state and warranty info
      setHasSearchedCustomer(false);
      setFoundCustomer(null);
      setWarrantyStatus(null);
      setWarrantyDetails(null);
      setOdometer('');
      
      if (!searchVin.trim()) {
        console.log('❌ Empty VIN provided');
        toast({
          title: 'Error',
          description: 'Please enter VIN to search vehicle',
          variant: 'destructive'
        });
        return;
      }

      console.log('🚗 Searching for VIN:', searchVin.trim());

      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      console.log('🔑 Token check:', token ? 'Token found' : 'No token');
      
      if (!token) {
        console.log('❌ No authentication token found');
        toast({
          title: 'Error',
          description: 'Authentication token not found',
          variant: 'destructive'
        });
        return;
      }

      const apiUrl = `http://localhost:3000/api/v1/vehicles/${searchVin.trim()}`;
      console.log('🌐 Making API call to:', apiUrl);

      // Search vehicle by VIN
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📨 API Response status:', response.status);
      console.log('📄 API Response data:', response.data);

      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.vehicle) {
        const vehicle = response.data.data.vehicle;
        console.log('✅ Vehicle found:', vehicle);
        
        setVehicleSearchResult({
          vin: vehicle.vin,
          dateOfManufacture: vehicle.dateOfManufacture,
          placeOfManufacture: vehicle.placeOfManufacture,
          licensePlate: vehicle.licensePlate,
          purchaseDate: vehicle.purchaseDate,
          owner: vehicle.owner
        });

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
          console.log('👤 Owner found:', vehicle.owner);
          toast({
            title: 'Vehicle Found',
            description: `Vehicle is registered to ${vehicle.owner.fullName}`,
          });
        } else {
          console.log('⚠️ No owner registered for this vehicle');
          toast({
            title: 'Vehicle Found - No Owner',
            description: 'Vehicle exists but no owner is registered. You can search for existing customer or register a new one.',
          });
        }
      } else {
        console.log('❌ No vehicle data in response or unsuccessful status');
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

  const handleSearchCustomerByPhone = async () => {
    if (!customerSearchPhone.trim()) {
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

      console.log('🔍 Searching customer by phone:', customerSearchPhone.trim());

      const response = await axios.get(`http://localhost:3000/api/v1/customers/`, {
        params: {
          phone: customerSearchPhone.trim()
        },
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📨 Customer search response:', response.data);

      if (response.data && response.data.status === 'success' && response.data.data && response.data.data.customer) {
        const customer = response.data.data.customer;
        console.log('✅ Customer found:', customer);
        
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
      } else {
        console.log('❌ Customer not found');
        setFoundCustomer(null);
        
        // Fill only phone number, clear other fields
        setOwnerForm({
          fullName: '',
          phone: customerSearchPhone.trim(),
          email: '',
          address: ''
        });

        toast({
          title: 'Customer Not Found',
          description: 'No customer found with this phone number. You can enter new customer information.',
          variant: 'default'
        });
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
        phone: customerSearchPhone.trim(),
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

    if (!vehicleSearchResult.licensePlate?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter license plate number',
        variant: 'destructive'
      });
      return;
    }

    if (!vehicleSearchResult.purchaseDate) {
      toast({
        title: 'Validation Error',
        description: 'Please select purchase date',
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

      console.log('💾 Saving vehicle and owner changes...');
      console.log('🔍 Debug - foundCustomer:', foundCustomer);
      console.log('🔍 Debug - vehicleSearchResult.owner:', vehicleSearchResult.owner);

      // Prepare request body based on customer status
      let requestBody;

      // Check if customer exists (either from search or from vehicle's existing owner)
      const existingCustomer = foundCustomer || vehicleSearchResult.owner;

      if (existingCustomer && existingCustomer.id) {
        // Existing customer - send customerId only
        console.log('📋 Using existing customer ID:', existingCustomer.id);
        requestBody = {
          customerId: existingCustomer.id,
          dateOfManufacture: vehicleSearchResult.dateOfManufacture,
          licensePlate: vehicleSearchResult.licensePlate.trim(),
          purchaseDate: vehicleSearchResult.purchaseDate
        };
      } else {
        // New customer - send full customer object (backend will create customer)
        console.log('👤 Sending new customer object for registration');
        requestBody = {
          customer: {
            fullName: ownerForm.fullName.trim(),
            email: ownerForm.email.trim(),
            phone: ownerForm.phone.trim(),
            address: ownerForm.address.trim()
          },
          dateOfManufacture: vehicleSearchResult.dateOfManufacture,
          licensePlate: vehicleSearchResult.licensePlate.trim(),
          purchaseDate: vehicleSearchResult.purchaseDate
        };
      }

      console.log('📤 Sending request body:', requestBody);

      // Update vehicle owner using PATCH endpoint: /api/v1/vehicles/{vin}
      const response = await axios.patch(`http://localhost:3000/api/v1/vehicles/${vehicleSearchResult.vin}`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.status === 'success') {
        console.log('✅ Vehicle and owner updated successfully:', response.data);
        
        // Update local state with owner info from response
        const updatedVehicle = response.data.data.vehicle;
        setVehicleSearchResult(prev => ({
          ...prev!,
          owner: updatedVehicle.owner,
          licensePlate: updatedVehicle.licensePlate,
          purchaseDate: updatedVehicle.purchaseDate,
          dateOfManufacture: updatedVehicle.dateOfManufacture,
          placeOfManufacture: updatedVehicle.placeOfManufacture
        }));

        toast({
          title: 'Success',
          description: 'Vehicle and owner information updated successfully!',
        });

        // Reset search states
        setCustomerSearchPhone('');
        setFoundCustomer(null);
        setHasSearchedCustomer(false);

      } else {
        throw new Error('Failed to update vehicle owner');
      }

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
    if (!vehicleSearchResult || !odometer || !vehicleSearchResult.purchaseDate) {
      toast({
        title: 'Error',
        description: 'Please enter odometer reading and ensure purchase date is set',
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

      console.log('🔍 Checking warranty policy...');
      console.log('VIN:', vehicleSearchResult.vin);
      console.log('Odometer:', odometer);
      console.log('Purchase Date:', vehicleSearchResult.purchaseDate);

      const response = await axios.post(
        `http://localhost:3000/api/v1/vehicles/${vehicleSearchResult.vin}/warranty/preview`,
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

      console.log('📨 Warranty check response:', response.data);

      if (response.data && response.data.status === 'success') {
        const warrantyData = response.data.data?.vehicle;
        
        if (warrantyData) {
          // Save warranty details
          setWarrantyDetails(warrantyData);
          
          console.log('🔍 Full Warranty Data:', JSON.stringify(warrantyData, null, 2));
          console.log('🔍 General Warranty:', warrantyData.generalWarranty);
          
          // Check if general warranty is still active
          // Both duration and mileage must be valid
          const generalWarranty = warrantyData.generalWarranty;
          
          // Debug duration status
          console.log('🔍 Duration Status Type:', typeof generalWarranty?.duration?.status);
          console.log('🔍 Duration Status Value:', generalWarranty?.duration?.status);
          console.log('🔍 Duration Status === true:', generalWarranty?.duration?.status === true);
          console.log('🔍 Duration Status === "ACTIVE":', generalWarranty?.duration?.status === 'ACTIVE');
          
          // Debug mileage status
          console.log('🔍 Mileage Status Type:', typeof generalWarranty?.mileage?.status);
          console.log('🔍 Mileage Status Value:', generalWarranty?.mileage?.status);
          console.log('🔍 Mileage Status === "ACTIVE":', generalWarranty?.mileage?.status === 'ACTIVE');
          
          const isDurationValid = 
            generalWarranty?.duration?.status === true || 
            generalWarranty?.duration?.status === 'ACTIVE';
          const isMileageValid = 
            generalWarranty?.mileage?.status === 'ACTIVE';
          
          // Warranty is valid if BOTH duration and mileage are valid
          const isWarrantyValid = isDurationValid && isMileageValid;
          
          console.log('✅ Duration Valid:', isDurationValid);
          console.log('✅ Mileage Valid:', isMileageValid);
          console.log('✅ Overall Warranty Valid:', isWarrantyValid);
          
          setWarrantyStatus(isWarrantyValid ? 'valid' : 'expired');

          if (isWarrantyValid) {
            toast({
              title: 'Warranty Active',
              description: `Warranty valid for ${generalWarranty.duration.remainingDays} more days and ${generalWarranty.mileage.remainingMileage} km`,
            });

            // If vehicle already has owner, set foundCustomer but don't auto-show the form
            // User will need to search or the form will appear after they interact
            if (vehicleSearchResult.owner) {
              console.log('✅ Vehicle has existing owner:', vehicleSearchResult.owner);
              setFoundCustomer(vehicleSearchResult.owner);
            }
          } else {
            const reasons = [];
            if (!isDurationValid) reasons.push('time limit exceeded');
            if (!isMileageValid) reasons.push('mileage limit exceeded');
            
            toast({
              title: 'Warranty Expired',
              description: `Vehicle warranty has expired: ${reasons.join(' and ')}`,
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

      const searchResponse = await axios.get(`http://localhost:3000/api/v1/customers/`, {
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
        const createResponse = await axios.post(`http://localhost:3000/api/v1/customers/`, {
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

      // Prepare request body with 8 fields
      const requestBody = {
        customerId: customerData.id,
        licensePlate: vehicleSearchResult.licensePlate || '',
        purchaseDate: vehicleSearchResult.purchaseDate || new Date().toISOString(),
        dateOfManufacture: vehicleSearchResult.dateOfManufacture,
        placeOfManufacture: vehicleSearchResult.placeOfManufacture || '',
        fullName: customerData.fullName || customerData.fullname,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address
      };

      // Register owner to vehicle
      const response = await axios.patch(`http://localhost:3000/api/v1/vehicle/${vehicleSearchResult.vin}/update-owner`, requestBody, {
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
        setVehicleSearchResult(prev => ({
          ...prev!,
          owner: {
            id: customerData.id,
            fullName: customerData.fullName || customerData.fullname,
            phone: customerData.phone,
            email: customerData.email,
            address: customerData.address
          }
        }));

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

  const handleAddRecord = () => {
    if (!validateRecord(newRecord)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and add at least one case',
        variant: 'destructive'
      });
      return;
    }

    const record: WarrantyRecord = {
      id: `CLM-${String(records.length + 1).padStart(3, '0')}`,
      vinNumber: newRecord.vinNumber.toUpperCase(),
      customerName: newRecord.customerName,
      mileage: parseInt(newRecord.mileage),
      cases: newRecord.cases,
      purchaseDate: newRecord.purchaseDate,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRecords([...records, record]);
    setIsAddDialogOpen(false);
    setNewRecord({ vinNumber: '', mileage: '', customerName: '', cases: [], purchaseDate: '' });

    toast({
      title: 'Record Created Successfully',
      description: `New warranty claim ${record.id} has been created`,
    });
  };

  const handleEditRecord = (record: WarrantyRecord) => {
    setSelectedRecord(record);
    setEditRecord({
      vinNumber: record.vinNumber,
      mileage: record.mileage.toString(),
      customerName: record.customerName,
      cases: record.cases || [],
      purchaseDate: record.purchaseDate,
      status: record.status
    });
    setIsEditMode(true);
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
          customerName: editRecord.customerName,
          mileage: parseInt(editRecord.mileage),
          cases: editRecord.cases,
          purchaseDate: editRecord.purchaseDate,
          status: editRecord.status
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

              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Record
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

            {/* Dynamic Search Bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                {searchMode === 'warranty' ? (
                  <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                ) : searchMode === 'customer' ? (
                  <Car className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                ) : (
                  <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                )}
                <Input
                  placeholder={
                    searchMode === 'warranty' 
                      ? "Enter VIN to check warranty information" 
                      : searchMode === 'customer'
                      ? "Enter VIN to find vehicle and customer records"
                      : "Enter customer phone number"
                  }
                  className="pl-10 h-11"
                  value={searchMode === 'phone' ? customerSearchPhone : searchVin}
                  onChange={(e) => {
                    if (searchMode === 'phone') {
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      setCustomerSearchPhone(numericValue);
                    } else {
                      setSearchVin(e.target.value);
                    }
                  }}
                />
              </div>
              <Button 
                size="sm" 
                className={
                  searchMode === 'warranty' 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : searchMode === 'customer'
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-purple-600 hover:bg-purple-700"
                }
                onClick={
                  searchMode === 'warranty' 
                    ? handleSearchWarranty 
                    : searchMode === 'customer'
                    ? handleSearchCustomer
                    : handleSearchCustomerByPhone
                }
              >
                {searchMode === 'warranty' ? 'Check Warranty' : searchMode === 'customer' ? 'Find Vehicle' : 'Search Customer'}
              </Button>
            </div>
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
                    <TableHead>Record ID</TableHead>
                    <TableHead>VIN Number</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No warranty records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.vinNumber}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{record.cases?.length || 0} cases</Badge>
                            {record.cases && record.cases.length > 0 && (
                              <span className="text-sm truncate">{record.cases[0].text}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                           
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRecord(record)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
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

                      {/* Place of Manufacture - Read Only */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Place of Manufacture:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={vehicleSearchResult.placeOfManufacture || 'N/A'}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>

                      {/* License Plate - Editable */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">License Plate:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={vehicleSearchResult.licensePlate || ''}
                            onChange={(e) => setVehicleSearchResult(prev => ({
                              ...prev!,
                              licensePlate: e.target.value
                            }))}
                            placeholder="Enter license plate number"
                            className="bg-white border-green-300 focus:border-green-500"
                          />
                        </div>
                      </div>

                      {/* Purchase Date - Editable */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Purchase Date:</Label>
                        <div className="md:col-span-2">
                          <Input
                            type="date"
                            value={vehicleSearchResult.purchaseDate ? 
                              new Date(vehicleSearchResult.purchaseDate).toISOString().split('T')[0] : ''}
                            onChange={(e) => setVehicleSearchResult(prev => ({
                              ...prev!,
                              purchaseDate: e.target.value ? new Date(e.target.value).toISOString() : ''
                            }))}
                            className="bg-white border-green-300 focus:border-green-500"
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
                            <Button
                              onClick={handleCheckWarranty}
                              disabled={isCheckingWarranty || !odometer || !vehicleSearchResult.purchaseDate}
                              className="w-full bg-purple-600 hover:bg-purple-700"
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
                                        <Badge variant={(warrantyDetails.generalWarranty?.duration?.status === 'ACTIVE' || warrantyDetails.generalWarranty?.duration?.status === true) ? 'default' : 'destructive'} className="text-xs">
                                          {(warrantyDetails.generalWarranty?.duration?.status === 'ACTIVE' || warrantyDetails.generalWarranty?.duration?.status === true) ? 'ACTIVE' : 'EXPIRED'}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-2xl font-bold text-blue-900">
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

                                    {/* Mileage Status */}
                                    <div className="bg-green-50 rounded p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-600">Mileage Coverage</span>
                                        <Badge variant={warrantyDetails.generalWarranty?.mileage?.status === 'ACTIVE' ? 'default' : 'destructive'} className="text-xs">
                                          {warrantyDetails.generalWarranty?.mileage?.status || 'N/A'}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-2xl font-bold text-green-900">
                                          {warrantyDetails.generalWarranty?.mileage?.remainingMileage?.toLocaleString() || 0} km
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          Remaining mileage
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Limit: {warrantyDetails.generalWarranty?.policy?.mileageLimit?.toLocaleString() || 0} km
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Component Warranties - Secondary Info */}
                                {warrantyDetails.componentWarranties && warrantyDetails.componentWarranties.length > 0 && (
                                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center">
                                      <span className="mr-2">🔧</span>
                                      Component Warranties (Additional Coverage)
                                    </h4>
                                    <div className="space-y-2">
                                      {warrantyDetails.componentWarranties.map((component: any, index: number) => (
                                        <div key={index} className="bg-white border border-gray-200 rounded p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm text-gray-800">{component.componentName}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {(component.duration?.status === 'ACTIVE' || component.duration?.status === true) ? '✓ Active' : '✗ Expired'}
                                            </Badge>
                                          </div>
                                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <div>
                                              <span className="text-gray-500">Duration:</span> {component.duration?.remainingDays || 0} days left
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Mileage:</span> {component.mileage?.remainingMileage?.toLocaleString() || 0} km left
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Policy Duration:</span> {component.policy?.durationMonths || 0} months
                                            </div>
                                            <div>
                                              <span className="text-gray-500">Mileage Limit:</span> {component.policy?.mileageLimit?.toLocaleString() || 0} km
                                            </div>
                                          </div>
                                        </div>
                                      ))}
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
                            className="bg-white"
                          />
                        </div>
                        <Button
                          onClick={handleSearchCustomerByPhone}
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
                            />
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-2 items-center">
                          <Label className="font-medium text-gray-700">Phone:</Label>
                          <div className="md:col-span-2">
                            <Input
                              value={ownerForm.phone}
                              onChange={(e) => {
                                const numericValue = e.target.value.replace(/[^0-9]/g, '');
                                setOwnerForm({ ...ownerForm, phone: numericValue });
                              }}
                              placeholder="Enter phone number"
                              className="bg-white border-green-300 focus:border-green-500 font-mono"
                            />
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
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Save Changes Button */}
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
                    <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Customer Information
                    </h3>
                    <div className="grid gap-4">
                      {/* Full Name */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Full Name:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={foundCustomer.fullName || ''}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Phone Number:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={foundCustomer.phoneNumber || ''}
                            disabled
                            className="bg-gray-100 font-mono"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Email:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={foundCustomer.email || ''}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>

                      {/* Address */}
                      <div className="grid md:grid-cols-3 gap-2 items-center">
                        <Label className="font-medium text-gray-700">Address:</Label>
                        <div className="md:col-span-2">
                          <Input
                            value={foundCustomer.address || ''}
                            disabled
                            className="bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Customer Vehicles */}
                  {foundCustomer.vehicles && foundCustomer.vehicles.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <Car className="mr-2 h-5 w-5" />
                        Customer's Vehicles
                      </h3>
                      <div className="space-y-3">
                        {foundCustomer.vehicles.map((vehicle: any, index: number) => (
                          <div key={index} className="bg-white border border-blue-200 rounded p-3">
                            <div className="grid md:grid-cols-2 gap-3">
                              <div>
                                <span className="text-sm font-medium text-gray-600">VIN:</span>
                                <p className="text-sm font-mono">{vehicle.vin}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Model:</span>
                                <p className="text-sm">{vehicle.model || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">License Plate:</span>
                                <p className="text-sm">{vehicle.licensePlate || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-600">Purchase Date:</span>
                                <p className="text-sm">{vehicle.purchaseDate || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
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
            <div className="grid gap-2">
              <Label htmlFor="vinNumber">VIN Number *</Label>
              <Input
                id="vinNumber"
                placeholder="Enter VIN (17 characters)"
                value={newRecord.vinNumber}
                onChange={(e) => setNewRecord({ ...newRecord, vinNumber: e.target.value })}
                maxLength={17}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer full name"
                value={newRecord.customerName}
                onChange={(e) => setNewRecord({ ...newRecord, customerName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mileage">Mileage (km) *</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="Enter current mileage"
                value={newRecord.mileage}
                onChange={(e) => setNewRecord({ ...newRecord, mileage: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="purchaseDate">Release Date *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={newRecord.purchaseDate}
                onChange={(e) => setNewRecord({ ...newRecord, purchaseDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Cases * ({newRecord.cases.length})</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCurrentCaseText('');
                    setEditingCaseId(null);
                    setIsAddNewcaseOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Case
                </Button>
              </div>
              {newRecord.cases.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newRecord.cases.map((caseNote, index) => (
                    <div key={caseNote.id} className="p-3 bg-muted/50 rounded-md border flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">Case {index + 1}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(caseNote.createdAt)}</span>
                        </div>
                        <p className="text-sm break-words">{caseNote.text}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCurrentCaseText(caseNote.text);
                            setEditingCaseId(caseNote.id);
                            setIsAddNewcaseOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewRecord({
                              ...newRecord,
                              cases: newRecord.cases.filter(c => c.id !== caseNote.id)
                            });
                            toast({ title: 'Case deleted' });
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-muted/20 rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground italic">No cases added yet. Click "New Case" to add one.</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleAddRecord}>
              <Plus className="h-4 w-4 mr-2" />
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label>Purchase Date</Label>
              <Input
                id="purchaseDate"
                placeholder="Purchase Date" 
                value={vinData.purchaseDate}
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
              } else {
                // Working with add dialog
                if (editingCaseId) {
                  // Edit existing case
                  setNewRecord({
                    ...newRecord,
                    cases: newRecord.cases.map(c => 
                      c.id === editingCaseId 
                        ? { ...c, text: currentCaseText } 
                        : c
                    )
                  });
                  toast({ title: 'Case updated successfully' });
                } else {
                  // Add new case
                  const newCase: CaseNote = {
                    id: Date.now().toString(),
                    text: currentCaseText,
                    createdAt: new Date().toISOString()
                  };
                  setNewRecord({
                    ...newRecord,
                    cases: [...newRecord.cases, newCase]
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
              <span>Edit Warranty</span>
            </DialogTitle>
            <DialogDescription>
              Update warranty claim information
            </DialogDescription>
          </DialogHeader>

          {isEditMode && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Record ID</Label>
                <p className="font-medium">{selectedRecord?.id}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-vinNumber">VIN Number *</Label>
                <Input
                  id="edit-vinNumber"
                  placeholder="Enter VIN (17 characters)"
                  value={editRecord.vinNumber}
                  onChange={(e) => setEditRecord({ ...editRecord, vinNumber: e.target.value })}
                  maxLength={17}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-customerName">Customer Name *</Label>
                <Input
                  id="edit-customerName"
                  placeholder="Enter customer full name"
                  value={editRecord.customerName}
                  onChange={(e) => setEditRecord({ ...editRecord, customerName: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-mileage">Mileage (km) *</Label>
                <Input
                  id="edit-mileage"
                  type="number"
                  placeholder="Enter current mileage"
                  value={editRecord.mileage}
                  onChange={(e) => setEditRecord({ ...editRecord, mileage: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-purchaseDate">Purchase Date *</Label>
                <Input
                  id="edit-purchaseDate"
                  type="date"
                  value={editRecord.purchaseDate}
                  onChange={(e) => setEditRecord({ ...editRecord, purchaseDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status *</Label>
                <select
                  id="edit-status"
                  value={editRecord.status}
                  onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value as 'pending' | 'in-progress' | 'completed' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Cases * ({editRecord.cases.length})</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentCaseText('');
                      setEditingCaseId(null);
                      setIsAddNewcaseOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Case
                  </Button>
                </div>
                {editRecord.cases.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {editRecord.cases.map((caseNote, index) => (
                      <div key={caseNote.id} className="p-3 bg-muted/50 rounded-md border flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">Case {index + 1}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(caseNote.createdAt)}</span>
                          </div>
                          <p className="text-sm break-words">{caseNote.text}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setCurrentCaseText(caseNote.text);
                              setEditingCaseId(caseNote.id);
                              setIsAddNewcaseOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditRecord({
                                ...editRecord,
                                cases: editRecord.cases.filter(c => c.id !== caseNote.id)
                              });
                              toast({ title: 'Case deleted' });
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/20 rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground italic">No cases added yet. Click "New Case" to add one.</p>
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
                placeholder="Enter phone number"
                value={ownerForm.phone}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9]/g, '');
                  setOwnerForm({ ...ownerForm, phone: numericValue });
                }}
              />
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
    </div>
  );
};

export default SuperAdvisor;