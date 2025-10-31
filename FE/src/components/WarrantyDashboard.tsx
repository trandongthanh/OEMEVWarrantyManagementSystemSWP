import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
		LogOut,Wrench
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

//base URL for API
const API_BASE_URL = 'http://localhost:3000/api/v1';

interface StockTransferRequest {
  id: number;
  requestingWarehouseId: number;
  requestedByUserId: number;
  requestedAt: string;
  approvedByUserId: number | null;
  status: string;
}

interface StockTransferRequestDetail extends StockTransferRequest {
  items?: Array<{
    id: number;
    componentId: number;
    requestedQuantity: number;
    approvedQuantity?: number;
  }>;
  warehouse?: {
    id: number;
    name: string;
    address: string;
  };
  requestedByUser?: {
    id: string;
    name: string;
    email: string;
  };
  approvedByUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

const WarrantyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stockTransferRequests, setStockTransferRequests] = useState<StockTransferRequest[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [status, setStatus] = useState<string>('PENDING_APPROVAL');
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedRequest, setSelectedRequest] = useState<StockTransferRequestDetail | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
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
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status: status
      });
      
      const response = await fetch(`${API_BASE_URL}/stock-transfer-requests?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`API returned status ${response.status}. Using mock data for testing.`);
        // Use mock data for testing
        const mockData: StockTransferRequest[] = [
          {
            id: 1,
            requestingWarehouseId: 3,
            requestedByUserId: 5,
            requestedAt: "2025-10-31T02:22:20.725Z",
            approvedByUserId: null,
            status: "PENDING_APPROVAL"
          },
          {
            id: 2,
            requestingWarehouseId: 7,
            requestedByUserId: 12,
            requestedAt: "2025-10-30T14:15:10.500Z",
            approvedByUserId: 8,
            status: "APPROVED"
          },
          {
            id: 3,
            requestingWarehouseId: 2,
            requestedByUserId: 9,
            requestedAt: "2025-10-29T09:45:30.123Z",
            approvedByUserId: null,
            status: "PENDING_APPROVAL"
          }
        ];
        setStockTransferRequests(mockData);
        setTotalPages(1);
        setIsLoadingTransfers(false);
        return;
      }
      
      const data = await response.json();
      
      // Handle both paginated and non-paginated responses
      if (data.data && Array.isArray(data.data)) {
        setStockTransferRequests(data.data);
        if (data.totalPages) setTotalPages(data.totalPages);
      } else if (Array.isArray(data)) {
        setStockTransferRequests(data);
      } else {
        setStockTransferRequests([]);
      }
    } catch (error) {
      console.error('Error fetching stock transfer requests:', error);
      // Use mock data on error
      const mockData: StockTransferRequest[] = [
        {
          id: 1,
          requestingWarehouseId: 3,
          requestedByUserId: 5,
          requestedAt: "2025-10-31T02:22:20.725Z",
          approvedByUserId: null,
          status: "PENDING_APPROVAL"
        },
        {
          id: 2,
          requestingWarehouseId: 7,
          requestedByUserId: 12,
          requestedAt: "2025-10-30T14:15:10.500Z",
          approvedByUserId: 8,
          status: "APPROVED"
        },
        {
          id: 3,
          requestingWarehouseId: 2,
          requestedByUserId: 9,
          requestedAt: "2025-10-29T09:45:30.123Z",
          approvedByUserId: null,
          status: "PENDING_APPROVAL"
        }
      ];
      setStockTransferRequests(mockData);
      setTotalPages(1);
    } finally {
      setIsLoadingTransfers(false);
    }
  };

  const handleLoadRequests = () => {
    fetchStockTransferRequests();
  };

  const fetchRequestDetail = async (requestId: number) => {
    setIsLoadingDetail(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/stock-transfer-requests/${requestId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`API returned status ${response.status}. Using mock detail data.`);
        // Mock detail data
        const mockDetail: StockTransferRequestDetail = {
          id: requestId,
          requestingWarehouseId: 3,
          requestedByUserId: 5,
          requestedAt: "2025-10-31T02:22:20.725Z",
          approvedByUserId: null,
          status: "PENDING_APPROVAL",
          items: [
            {
              id: 1,
              componentId: 101,
              requestedQuantity: 10,
              approvedQuantity: 0
            },
            {
              id: 2,
              componentId: 205,
              requestedQuantity: 5,
              approvedQuantity: 0
            }
          ],
          warehouse: {
            id: 3,
            name: "Warehouse Hanoi",
            address: "123 Nguyen Trai, Hanoi"
          },
          requestedByUser: {
            id: "761e6148-bc8e-46d7-be4a-f6860ace8f5c",
            name: "Nguyễn Thị Xuân",
            email: "manager_hcm@vinfast.vn"
          },
          approvedByUser: null
        };
        setSelectedRequest(mockDetail);
        setIsDetailDialogOpen(true);
        setIsLoadingDetail(false);
        return;
      }
      
      const data = await response.json();
      setSelectedRequest(data);
      setIsDetailDialogOpen(true);
    } catch (error) {
      console.error('Error fetching request detail:', error);
      // Use mock data on error
      const mockDetail: StockTransferRequestDetail = {
        id: requestId,
        requestingWarehouseId: 3,
        requestedByUserId: 5,
        requestedAt: "2025-10-31T02:22:20.725Z",
        approvedByUserId: null,
        status: "PENDING_APPROVAL",
        items: [
          {
            id: 1,
            componentId: 101,
            requestedQuantity: 10,
            approvedQuantity: 0
          },
          {
            id: 2,
            componentId: 205,
            requestedQuantity: 5,
            approvedQuantity: 0
          }
        ],
        warehouse: {
          id: 3,
          name: "Warehouse Hanoi",
          address: "123 Nguyen Trai, Hanoi"
        },
        requestedByUser: {
          id: "761e6148-bc8e-46d7-be4a-f6860ace8f5c",
          name: "Nguyễn Thị Xuân",
          email: "manager_hcm@vinfast.vn"
        },
        approvedByUser: null
      };
      setSelectedRequest(mockDetail);
      setIsDetailDialogOpen(true);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleViewDetails = (requestId: number) => {
    fetchRequestDetail(requestId);
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
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="">All Status</option>
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
                    <TableCell className="font-medium">#{request.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600">🏢</span>
                        Warehouse #{request.requestingWarehouseId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-purple-600">👤</span>
                        User #{request.requestedByUserId}
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
                          User #{request.approvedByUserId}
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
                        👁️ View Details
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
                    {selectedRequest.warehouse && (
                      <div>
                        <span className="text-xs text-gray-500">Warehouse:</span>
                        <p className="font-medium">🏢 {selectedRequest.warehouse.name}</p>
                        <p className="text-sm text-gray-600">{selectedRequest.warehouse.address}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedRequest.requestedByUser && (
                      <div>
                        <span className="text-xs text-gray-500">Requested By:</span>
                        <p className="font-medium">👤 {selectedRequest.requestedByUser.name}</p>
                        <p className="text-sm text-gray-600">{selectedRequest.requestedByUser.email}</p>
                      </div>
                    )}
                    {selectedRequest.approvedByUser ? (
                      <div>
                        <span className="text-xs text-gray-500">Approved By:</span>
                        <p className="font-medium text-green-600">✓ {selectedRequest.approvedByUser.name}</p>
                        <p className="text-sm text-gray-600">{selectedRequest.approvedByUser.email}</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-xs text-gray-500">Approved By:</span>
                        <p className="text-sm text-gray-400 italic">Pending approval</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Items Table */}
              {selectedRequest.items && selectedRequest.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Requested Items</CardTitle>
                    <CardDescription>Components and quantities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item ID</TableHead>
                          <TableHead>Component ID</TableHead>
                          <TableHead>Requested Quantity</TableHead>
                          <TableHead>Approved Quantity</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequest.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">#{item.id}</TableCell>
                            <TableCell>Component #{item.componentId}</TableCell>
                            <TableCell>
                              <span className="font-semibold text-blue-600">{item.requestedQuantity}</span>
                            </TableCell>
                            <TableCell>
                              {item.approvedQuantity ? (
                                <span className="font-semibold text-green-600">{item.approvedQuantity}</span>
                              ) : (
                                <span className="text-gray-400 italic">Pending</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (!selectedRequest) return;
                    if (!confirm('Are you sure you want to reject this request?')) return;
                    
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(
                        `${API_BASE_URL}/stock-transfer-requests/${selectedRequest.id}/reject`,
                        {
                          method: 'PATCH',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          }
                        }
                      );
                      
                      if (response.ok) {
                        alert('Request rejected successfully!');
                        setIsDetailDialogOpen(false);
                        fetchStockTransferRequests(); // Refresh list
                      } else {
                        alert('Failed to reject request. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error rejecting request:', error);
                      alert('Error rejecting request. Please try again.');
                    }
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  ❌ Reject
                </Button>
                <Button
                  onClick={async () => {
                    if (!selectedRequest) return;
                    if (!confirm('Are you sure you want to approve this request?')) return;
                    
                    try {
                      const token = localStorage.getItem('token');
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
                      
                      if (response.ok) {
                        alert('Request approved successfully!');
                        setIsDetailDialogOpen(false);
                        fetchStockTransferRequests(); // Refresh list
                      } else {
                        alert('Failed to approve request. Please try again.');
                      }
                    } catch (error) {
                      console.error('Error approving request:', error);
                      alert('Error approving request. Please try again.');
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  ✓ Approve
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default WarrantyDashboard;