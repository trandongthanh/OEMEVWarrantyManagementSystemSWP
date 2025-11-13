import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
		LogOut,Wrench
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

//base URL for API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface StockTransferRequest {
  id: string; // UUID from API
  requestingWarehouseId: string; // UUID from API
  requestedByUserId: string; // UUID from API
  requestedAt: string;
  approvedByUserId: string | null; // UUID from API
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
  const [stockTransferRequests, setStockTransferRequests] = useState<StockTransferRequest[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [status, setStatus] = useState<string>('');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedRequest, setSelectedRequest] = useState<StockTransferRequestDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState<boolean>(false);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const { user } = useAuth();
  
  useEffect(() => {
    // Auto-fetch when page changes
    if (user) {
      fetchStockTransferRequests();
    }
  }, [user, page]);

  const fetchStockTransferRequests = async () => {
    setIsLoadingTransfers(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      
      if (!token) {
        console.error('❌ No authentication token found');
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
      
      console.log('🔍 Fetching stock transfer requests:', {
        page,
        limit,
        status
      });
      
      const response = await fetch(`${API_BASE_URL}/stock-transfer-requests?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📦 API Response:', data);
      
      if (!response.ok) {
        console.error('❌ API Error:', response.status, data);
        throw new Error(data.message || `API returned status ${response.status}`);
      }
      
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
      console.log(`🔍 Fetching caseline info for: ${caselineId}`);
      
      const response = await fetch(`${API_BASE_URL}/case-lines/${caselineId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`📋 Caseline API Response for ${caselineId}:`, data);
      
      if (!response.ok) {
        console.warn(`⚠️ Failed to fetch caseline ${caselineId}:`, response.status, data);
        return null;
      }
      
      // Extract caseline info from API response (backend returns 'caseLine' not 'caseline')
      if (data.status === 'success' && data.data?.caseLine) {
        const caseline = data.data.caseLine;
        console.log(`✅ Caseline data:`, caseline);
        console.log(`📦 TypeComponent:`, caseline.typeComponent);
        
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
      
      console.warn(`⚠️ Unexpected caseline response structure:`, data);
      return null;
    } catch (error) {
      return null;
    }
  };

  const fetchRequestDetail = async (requestId: string) => {
    setIsLoadingDetail(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      
      console.log('🔍 Fetching request detail for ID:', requestId);
      
      const response = await fetch(`${API_BASE_URL}/stock-transfer-requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📋 Detail API Response:', data);
      
      if (!response.ok) {
        console.error('❌ Detail API Error:', response.status, data);
        throw new Error(data.message || `API returned status ${response.status}`);
      }
      
      // Handle API response structure: { status: "success", data: { stockTransferRequest: {...} } }
      if (data.status === 'success' && data.data?.stockTransferRequest) {
        const requestDetail = data.data.stockTransferRequest;
        
        console.log('✅ Request detail loaded:', {
          id: requestDetail.id,
          requester: requestDetail.requester,
          requestingWarehouse: requestDetail.requestingWarehouse,
          itemsCount: requestDetail.items?.length || 0,
          items: requestDetail.items
        });
        
        // Fetch caseline info for each item that has a caselineId
        if (requestDetail.items && requestDetail.items.length > 0) {
          console.log('🔄 Fetching caseline info for items...');
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
          console.log('✅ Caseline info loaded for items');
        }
        
        setSelectedRequest(requestDetail);
        setIsDetailDialogOpen(true);
      } else {
        console.warn('⚠️ Unexpected detail response structure:', data);
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

  const handleRejectClick = () => {
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleApproveClick = () => {
    setIsApproveDialogOpen(true);
  };

  const handleApproveSubmit = async () => {
    if (!selectedRequest) return;
    
    setIsApproving(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      const response = await fetch(
        `${API_BASE_URL}/stock-transfer-requests/${selectedRequest.id}/approve`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
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
          description: data.message || 'Failed to approve request. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while approving the request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!selectedRequest) return;
    
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please enter a reason for rejecting this request.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsRejecting(true);
    try {
      const token = localStorage.getItem('ev_warranty_token');
      const response = await fetch(
        `${API_BASE_URL}/stock-transfer-requests/${selectedRequest.id}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            rejectionReason: rejectionReason.trim()
          })
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Request Rejected ❌',
          description: 'The stock transfer request has been rejected.',
        });
        setIsRejectDialogOpen(false);
        setIsDetailDialogOpen(false);
        setRejectionReason('');
        fetchStockTransferRequests();
      } else {
        toast({
          title: 'Rejection Failed',
          description: data.message || 'Failed to reject request. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while rejecting the request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsRejecting(false);
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

      {/* Stock Transfer Requests */}
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
                          User #{request.approvedByUserId.substring(0, 8)}
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
                        <p className="font-medium text-green-600">✓ User #{selectedRequest.approvedByUserId.substring(0, 8)}...</p>
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
                      {selectedRequest.items.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow bg-white">
                          {/* Request ID */}
                          <div className="pb-2 border-b">
                            <span className="text-xs text-gray-500">Request ID:</span>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              #{item.id.substring(0, 8)}...
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
                                <span className="text-xs text-gray-600">� Correction:</span>
                                <p className="text-sm text-gray-700 mt-1">{item.caselineInfo.correctionText}</p>
                              </div>
                              
                            </div>
                          ) : (
                            <div className="bg-gray-100 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 italic">Component information not available</p>
                            </div>
                          )}

                          {/* Quantity Requested & Caseline ID */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-gray-500">Quantity Requested:</span>
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-blue-600 text-lg">{item.quantityRequested}</span>
                                {item.quantityApproved !== null && item.quantityApproved !== undefined && (
                                  <span className="text-xs text-green-600 font-medium">✓ Approved: {item.quantityApproved}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-gray-500">Caseline ID:</span>
                              {item.caselineId ? (
                                <span className="text-sm font-medium text-gray-900">
                                  #{item.caselineId.substring(0, 8)}...
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400 italic">N/A</span>
                              )}
                            </div>
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
                    variant="destructive"
                    onClick={handleRejectClick}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    ❌ Reject
                  </Button>
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

      {/* Reject Confirmation Dialog */}
      {isRejectDialogOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Dialog Header */}
            <div className="bg-red-50 border-b border-red-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚠️</span>
                <div>
                  <h2 className="text-xl font-bold text-red-900">Reject Request</h2>
                  <p className="text-sm text-red-600 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setIsRejectDialogOpen(false)}
                className="text-red-400 hover:text-red-600 text-2xl font-bold"
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
                <p className="text-sm text-gray-600">
                  Requested by: <span className="font-semibold">{selectedRequest.requester?.name || 'Unknown'}</span>
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-900 mb-2 block">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a clear reason for rejection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={4}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rejectionReason.trim().length} / 500 characters
                </p>
              </div>

              {rejectionReason.trim().length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    ℹ️ Please enter a rejection reason to proceed
                  </p>
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="bg-gray-50 border-t px-6 py-4 flex justify-end gap-3 rounded-b-lg">
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(false)}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectSubmit}
                disabled={isRejecting || !rejectionReason.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                {isRejecting ? '🔄 Rejecting...' : '❌ Confirm Reject'}
              </Button>
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

      </div>
    </div>
  );
};

export default WarrantyDashboard;