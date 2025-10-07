import { useState, useEffect } from "react";
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
  Tag
} from "lucide-react";

interface Technician {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  workload: number;
  isAvailable: boolean;
}

interface WarrantyClaim {
  vin: string;
  mileage: number;
  checkInDate: string;
  caseDescription: string;
  assignedTechnicians: Technician[];
  model: string;
  serviceCenter: string;
  submissionDate: string;
  estimatedCost: number;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  issueType: string;
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
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<string>('');
  const [showClaimDetailModal, setShowClaimDetailModal] = useState(false);
  const [selectedClaimForDetail, setSelectedClaimForDetail] = useState<WarrantyClaim | null>(null);
  const [customerSearchPhone, setCustomerSearchPhone] = useState('');
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [hasSearchedCustomer, setHasSearchedCustomer] = useState(false);
  const { user, logout } = useAuth();

  // Load warranty claims and technicians data
  useEffect(() => {
    // Mock technicians data
    const mockTechnicians: Technician[] = [
      { id: 'tech-001', name: 'Trần Minh Quân', specialty: 'Battery Systems', experience: 8, rating: 4.8, workload: 3, isAvailable: true },
      { id: 'tech-002', name: 'Nguyễn Thị Bảo An', specialty: 'Battery Systems', experience: 6, rating: 4.7, workload: 2, isAvailable: true },
      { id: 'tech-003', name: 'Lê Thị Hoa', specialty: 'Motor & Drivetrain', experience: 10, rating: 4.9, workload: 2, isAvailable: true },
      { id: 'tech-004', name: 'Phạm Văn Thành', specialty: 'Motor & Drivetrain', experience: 7, rating: 4.6, workload: 4, isAvailable: true },
      { id: 'tech-005', name: 'Võ Minh Tuấn', specialty: 'Electronics & Software', experience: 5, rating: 4.8, workload: 1, isAvailable: true },
      { id: 'tech-006', name: 'Đỗ Thị Kim Loan', specialty: 'Electronics & Software', experience: 4, rating: 4.5, workload: 3, isAvailable: true },
      { id: 'tech-007', name: 'Nguyễn Văn Đức', specialty: 'Charging Systems', experience: 6, rating: 4.7, workload: 1, isAvailable: true },
      { id: 'tech-008', name: 'Lý Thị Phương', specialty: 'Charging Systems', experience: 3, rating: 4.4, workload: 2, isAvailable: true },
      { id: 'tech-009', name: 'Võ Thị Mai', specialty: 'General Diagnostics', experience: 12, rating: 4.9, workload: 2, isAvailable: true },
      { id: 'tech-010', name: 'Hoàng Văn Long', specialty: 'General Diagnostics', experience: 8, rating: 4.6, workload: 3, isAvailable: true }
    ];

    const mockClaims: WarrantyClaim[] = [
      {
        vin: '1HGBH41JXMN109186',
        mileage: 15000,
        checkInDate: '2025-10-05',
        caseDescription: 'Pin EV bị suy giảm hiệu suất, không sạc được đầy',
        assignedTechnicians: [mockTechnicians[0]], // Trần Minh Quân
        model: 'VinFast VF8 Plus',
        serviceCenter: 'SC Hà Nội',
        submissionDate: '2025-09-25',
        estimatedCost: 15000000,
        priority: 'High',
        issueType: 'Pin EV'
      },
      {
        vin: '2HGBH41JXMN109187',
        mileage: 8500,
        checkInDate: '2025-10-04',
        caseDescription: 'Hệ thống điện bị lỗi, đèn cảnh báo liên tục sáng',
        assignedTechnicians: [mockTechnicians[4]], // Võ Minh Tuấn
        model: 'VinFast VF9 Premium',
        serviceCenter: 'SC TP.HCM',
        submissionDate: '2025-09-24',
        estimatedCost: 8500000,
        priority: 'Medium',
        issueType: 'Hệ thống điện'
      },
      {
        vin: 'JH4KA7532MC123456',
        mileage: 95000,
        checkInDate: '2025-10-03',
        caseDescription: 'Cảm biến áp suất lốp không hoạt động, hiển thị sai thông tin',
        assignedTechnicians: [], // Chưa assign
        model: 'VinFast VF5 Basic',
        serviceCenter: 'SC Đà Nẵng',
        submissionDate: '2025-09-23',
        estimatedCost: 12000000,
        priority: 'Low',
        issueType: 'Cảm biến'
      },
      {
        vin: '4HGBH41JXMN109189',
        mileage: 42000,
        checkInDate: '2025-10-06',
        caseDescription: 'Hệ thống phanh bị rung lắc, tiếng kêu bất thường khi phanh',
        assignedTechnicians: [mockTechnicians[8], mockTechnicians[9]], // Võ Thị Mai + Hoàng Văn Long
        model: 'VinFast VF8 City',
        serviceCenter: 'SC Hà Nội',
        submissionDate: '2025-09-26',
        estimatedCost: 6000000,
        priority: 'Urgent',
        issueType: 'Phanh'
      },
      {
        vin: 'KMHGH4JH3EA123789',
        mileage: 165000,
        checkInDate: '2025-10-02',
        caseDescription: 'Động cơ điện phát ra tiếng ồn bất thường, giảm công suất',
        assignedTechnicians: [mockTechnicians[2]], // Lê Thị Hoa
        model: 'VinFast VF9 Luxury',
        serviceCenter: 'SC TP.HCM',
        submissionDate: '2025-09-27',
        estimatedCost: 9200000,
        priority: 'High',
        issueType: 'Động cơ'
      }
    ];
    setWarrantyClaims(mockClaims);
    setAvailableTechnicians(mockTechnicians);
  }, []);

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

    const requiredSpecialties = specialtyMapping[issueType] || ['General Diagnostics'];

    return availableTechnicians
      .filter(tech =>
        tech.isAvailable &&
        requiredSpecialties.includes(tech.specialty)
      )
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        if (a.workload !== b.workload) return a.workload - b.workload;
        return b.experience - a.experience;
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
                <TabsTrigger value="vehicles">Vehicle Management</TabsTrigger>
              )}
              <TabsTrigger value="repairs">Active Repairs</TabsTrigger>
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
                  {/* Test Button */}
                  <div className="mb-4">
                    <Button
                      onClick={() => {
                        console.log('Test button clicked');
                        if (warrantyClaims.length > 0) {
                          handleViewClaimDetail(warrantyClaims[0].vin);
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Test Modal (First Claim)
                    </Button>
                  </div>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>VIN</TableHead>
                          <TableHead>Mileage</TableHead>
                          <TableHead>Check-in Date</TableHead>
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
                            <TableCell className="max-w-xs">
                              <div className="space-y-1">
                                <div className="font-medium text-sm">{claim.issueType}</div>
                                <div className="text-xs text-muted-foreground line-clamp-2">
                                  {claim.caseDescription}
                                </div>
                                <Badge variant={getPriorityBadgeVariant(claim.priority)} className="text-xs">
                                  {claim.priority === 'Urgent' && '🚨 '}
                                  {claim.priority === 'High' && '🔥 '}
                                  {claim.priority === 'Medium' && '📋 '}
                                  {claim.priority === 'Low' && '📝 '}
                                  {claim.priority}
                                </Badge>
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
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
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

            <TabsContent value="vehicles" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Vehicle & Customer Management</CardTitle>
                  <CardDescription>
                    Register vehicles, manage customer profiles and service history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    {hasPermission(user, 'register_vehicle') && (
                      <Button variant="gradient" onClick={() => setShowRegisterVehicle(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Register New Vehicle
                      </Button>
                    )}
                    {hasPermission(user, 'add_customer') && (
                      <Button variant="outline" onClick={() => setShowAddCustomer(true)}>
                        <User className="mr-2 h-4 w-4" />
                        Add Customer
                      </Button>
                    )}
                    {hasPermission(user, 'attach_parts') && (
                      <Button variant="secondary" onClick={() => setShowAttachParts(true)}>
                        <Car className="mr-2 h-4 w-4" />
                        Attach Parts
                      </Button>
                    )}
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Vehicle Info</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          VIN registration, model details, warranty dates
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Customer Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Personal information, contact details, history
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Service History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Timeline of services, repairs, and maintenance
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="repairs" className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Active Repairs</CardTitle>
                  <CardDescription>
                    Track repair progress and technician assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-warning">
                      <CardHeader>
                        <CardTitle className="text-base text-warning">Pending Parts</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">5 repairs waiting for parts delivery</p>
                      </CardContent>
                    </Card>
                    <Card className="border-primary">
                      <CardHeader>
                        <CardTitle className="text-base text-primary">In Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">7 vehicles currently being repaired</p>
                      </CardContent>
                    </Card>
                    <Card className="border-success">
                      <CardHeader>
                        <CardTitle className="text-base text-success">Ready for Handover</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">3 repairs completed and ready</p>
                      </CardContent>
                    </Card>
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
                          <Badge variant={getPriorityBadgeVariant(selectedClaimForDetail.priority)} className="text-sm">
                            {selectedClaimForDetail.priority === 'Urgent' && '🚨 '}
                            {selectedClaimForDetail.priority === 'High' && '🔥 '}
                            {selectedClaimForDetail.priority === 'Medium' && '📋 '}
                            {selectedClaimForDetail.priority === 'Low' && '📝 '}
                            {selectedClaimForDetail.priority}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Case Description</label>
                        <div className="mt-2 p-4 bg-muted rounded-lg">
                          <p className="text-base leading-relaxed">{selectedClaimForDetail.caseDescription}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assigned Technicians */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      Assigned Technicians ({selectedClaimForDetail.assignedTechnicians.length})
                    </CardTitle>
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
                                  <p className="text-sm text-muted-foreground">{tech.specialty}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {tech.experience} years exp.
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      ⭐ {tech.rating}/5
                                    </Badge>
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
            <DialogHeader>
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
            </DialogHeader>

            <div className="space-y-4">
              {/* Currently Assigned */}
              {selectedCaseForAssignment && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-sm mb-2">Currently Assigned:</h4>
                  <div className="flex flex-wrap gap-2">
                    {warrantyClaims.find(c => c.vin === selectedCaseForAssignment)?.assignedTechnicians.map((tech) => (
                      <Badge key={tech.id} variant="default" className="text-sm p-2">
                        {tech.name} ({tech.specialty})
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-4 w-4 p-0 hover:bg-red-100"
                          onClick={() => removeTechnicianFromCase(selectedCaseForAssignment, tech.id)}
                        >
                          ×
                        </Button>
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
                              <Badge variant="outline" className="text-xs">
                                {tech.specialty}
                              </Badge>
                              <Badge variant={tech.workload <= 2 ? "default" : tech.workload <= 4 ? "secondary" : "destructive"} className="text-xs">
                                Workload: {tech.workload}/5
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>⭐ {tech.rating} rating</span>
                              <span>📅 {tech.experience} years experience</span>
                              <span className={`${tech.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                {tech.isAvailable ? '✅ Available' : '❌ Busy'}
                              </span>
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
      </div>
    </div>
  );
};

export default ServiceCenterDashboard;