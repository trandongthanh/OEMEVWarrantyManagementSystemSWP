import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Truck
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
  requester?: {
    userId: string;
    name: string;
    serviceCenterId: string;
  };
  requestingWarehouse?: {
    warehouseId: string;
    name: string;
    serviceCenterId: string | null;
    vehicleCompanyId: string | null;
  };
  items?: Array<{
    id: string;
    requestId: string;
    typeComponentId: string;
    quantityRequested: number;
    caselineId?: string | null;
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
      
      alert('Request shipped successfully!');
    } catch (error: any) {
      console.error('Failed to ship request:', error);
      const errorMessage = error.response?.data?.message || 'Failed to ship request';
      alert(`Error: ${errorMessage}`);
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
                            {request.requester?.name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDate(request.requestedAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {request.items?.length || 0} items
                            </Badge>
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
                                  disabled={shippingRequestId !== null}
                                >
                                  {shippingRequestId !== null ? (
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
                    disabled={shippingRequestId !== null}
                  >
                    {shippingRequestId !== null ? (
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
                          Requester Name
                        </label>
                        <p className="text-sm font-semibold">{selectedStockRequest.requester?.name || '---'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Requester ID</label>
                        <p className="font-mono text-xs">{selectedStockRequest.requester?.userId ? `#${selectedStockRequest.requester.userId.substring(0, 8)}...` : '---'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground flex items-center">
                          <Warehouse className="mr-1 h-3 w-3" />
                          Requesting Warehouse
                        </label>
                        <p className="text-sm font-semibold">{selectedStockRequest.requestingWarehouse?.name || '---'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Warehouse ID</label>
                        <p className="font-mono text-xs">{selectedStockRequest.requestingWarehouse?.warehouseId ? `#${selectedStockRequest.requestingWarehouse.warehouseId.substring(0, 8)}...` : '---'}</p>
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
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">#</TableHead>
                              <TableHead>Item ID</TableHead>
                              <TableHead>Type Component ID</TableHead>
                              <TableHead className="text-right w-24">Quantity</TableHead>
                              <TableHead>Caseline ID</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedStockRequest.items.map((item, index) => (
                              <TableRow key={item.id || index}>
                                <TableCell className="font-medium">
                                  {index + 1}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {item.id ? `#${item.id.substring(0, 8)}...` : '---'}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {item.typeComponentId ? `#${item.typeComponentId.substring(0, 8)}...` : '---'}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant="outline">{item.quantityRequested || 0}</Badge>
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {item.caselineId ? `#${item.caselineId.substring(0, 8)}...` : '---'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
      </div>
    </div>
  );
};

export default PartsCompanyDashboard;
