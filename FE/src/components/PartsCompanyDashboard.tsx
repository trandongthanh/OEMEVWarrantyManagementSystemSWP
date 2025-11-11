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

const API_BASE_URL = 'http://localhost:3000/api/v1';

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

const PartsCompanyDashboard: React.FC = () => {
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();

  const [stockTransferRequests, setStockTransferRequests] = useState<StockTransferRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<StockTransferRequest[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedStockRequest, setSelectedStockRequest] = useState<StockTransferRequest | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [shippingRequestId, setShippingRequestId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [selectedCaseLine, setSelectedCaseLine] = useState<any | null>(null);
  const [isLoadingCaseLine, setIsLoadingCaseLine] = useState<boolean>(false);
  const [showCaseLineModal, setShowCaseLineModal] = useState<boolean>(false);

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
        title: 'Lỗi khi tải Case Line',
        description: 'Không thể tải chi tiết Case Line. Kiểm tra console để biết thêm thông tin.',
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

  // Filter requests by status
  useEffect(() => {
    if (selectedStatus === 'ALL') {
      setFilteredRequests(stockTransferRequests);
    } else {
      setFilteredRequests(stockTransferRequests.filter(req => req.status === selectedStatus));
    }
  }, [selectedStatus, stockTransferRequests]);

  // Ship stock transfer request
  const handleShipRequest = async (requestId: string) => {
    setShippingRequestId(requestId);
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      setShippingRequestId(null);
      return;
    }
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/stock-transfer-requests/${requestId}/ship`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('✅ Request shipped successfully:', response.data);
      
      // Refresh the list
      await fetchStockTransferRequests();
      
      // If modal is open, refresh the detail
      if (showDetailModal && selectedStockRequest?.id === requestId) {
        await fetchStockTransferRequestDetail(requestId);
      }
      
      toast({
        title: 'Đã gửi hàng',
        description: 'Yêu cầu vận chuyển đã được đánh dấu là shipped.',
        variant: 'default'
      });
    } catch (error: any) {
      console.error('Failed to ship request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to ship request';
      toast({
        title: 'Lỗi khi gửi hàng',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setShippingRequestId(null);
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
              <CardTitle>Stock Transfer Requests</CardTitle>
              <CardDescription>
                Manage stock transfer requests from service centers
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
                              {request.status === 'APPROVED' && (
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleShipRequest(request.id)}
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
              <DialogTitle className="flex items-center justify-between">
                <span>Stock Transfer Request Details</span>
                {selectedStockRequest && selectedStockRequest.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleShipRequest(selectedStockRequest.id)}
                    disabled={shippingRequestId === selectedStockRequest.id}
                  >
                    {shippingRequestId === selectedStockRequest.id ? (
                      <>
                        <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                        Shipping...
                      </>
                    ) : (
                      <>
                        <Truck className="mr-1 h-4 w-4" />
                        Ship Request
                      </>
                    )}
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
                                    <label className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase flex items-center justify-between">
                                      <span>Case Line ID</span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => fetchCaseLineDetail(item.caselineId!)}
                                        disabled={isLoadingCaseLine}
                                        className="h-6 px-2"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
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
      </div>
    </div>
  );
};

export default PartsCompanyDashboard;
