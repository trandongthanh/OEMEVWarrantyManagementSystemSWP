import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { hasPermission } from '@/utils/permissions';
import ClaimDetails from '@/components/ClaimDetails';
import UpdateClaimStatus from '@/components/UpdateClaimStatus';
import {
  FileText,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
  Download,
  Calendar,
  User,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  Wrench,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

interface Claim {
  id: string;
  vin: string;
  customer: string;
  customerPhone: string;
  vehicle: string;
  issue: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  technician: string;
  createdDate: string;
  updatedDate: string;
  estimatedCost: string;
  serviceCenter: string;
}

const AllClaims = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showClaimDetails, setShowClaimDetails] = useState(false);
  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState('');
  const [selectedClaimStatus, setSelectedClaimStatus] = useState('');

  // In real app, data would come from API
  const allClaims: Claim[] = [];

  // Filtering and sorting logic
  const filteredAndSortedClaims = useMemo(() => {
    let filtered = allClaims.filter(claim => {
      // Search filter
      const searchMatch = !searchTerm ||
        claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.issue.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === 'all' || claim.status === statusFilter;

      // Priority filter
      const priorityMatch = priorityFilter === 'all' || claim.priority === priorityFilter;

      // Category filter
      const categoryMatch = categoryFilter === 'all' || claim.category === categoryFilter;

      return searchMatch && statusMatch && priorityMatch && categoryMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Claim];
      let bValue: any = b[sortBy as keyof Claim];

      // Handle date sorting
      if (sortBy === 'createdDate' || sortBy === 'updatedDate') {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allClaims, searchTerm, statusFilter, priorityFilter, categoryFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedClaims.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedClaims = filteredAndSortedClaims.slice(startIndex, startIndex + pageSize);

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "pending" as const, icon: Clock, text: "Chờ duyệt" },
      approved: { variant: "approved" as const, icon: CheckCircle, text: "Đã duyệt" },
      rejected: { variant: "rejected" as const, icon: XCircle, text: "Từ chối" },
      "in-progress": { variant: "warning" as const, icon: Wrench, text: "Đang sửa" },
      completed: { variant: "success" as const, icon: CheckCircle, text: "Hoàn thành" },
      cancelled: { variant: "secondary" as const, icon: XCircle, text: "Hủy bỏ" }
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

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { variant: "destructive" as const, text: "Cao", color: "text-destructive" },
      medium: { variant: "warning" as const, text: "TB", color: "text-warning" },
      low: { variant: "secondary" as const, text: "Thấp", color: "text-muted-foreground" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleViewDetails = (claimId: string) => {
    setSelectedClaimId(claimId);
    setShowClaimDetails(true);
  };

  const handleUpdateStatus = (claimId: string, currentStatus: string) => {
    setSelectedClaimId(claimId);
    setSelectedClaimStatus(currentStatus);
    setShowUpdateStatus(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSortBy('createdDate');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">All Warranty Claims</h1>
                <p className="text-sm text-muted-foreground">
                  {user?.role === 'technician'
                    ? `Showing claims you can work on (${filteredAndSortedClaims.length} of ${allClaims.length})`
                    : `Showing ${filteredAndSortedClaims.length} of ${allClaims.length} claims`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID, VIN, Customer, or Issue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                  <SelectItem value="in-progress">Đang sửa</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Hủy bỏ</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="battery">Battery</SelectItem>
                  <SelectItem value="motor">Motor</SelectItem>
                  <SelectItem value="charging">Charging</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <div className="text-sm text-muted-foreground">
                  {filteredAndSortedClaims.length} claims found
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Page size:</span>
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claims Table */}
        <Card>
          <CardHeader>
            <CardTitle>Claims List</CardTitle>
            <CardDescription>
              Comprehensive view of all warranty claims with sorting and filtering
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('id')}
                        className="h-8 justify-start font-semibold"
                      >
                        Claim ID
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-left p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('customer')}
                        className="h-8 justify-start font-semibold"
                      >
                        Customer
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-left p-2">Vehicle</th>
                    <th className="text-left p-2">Issue</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Priority</th>
                    <th className="text-left p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('createdDate')}
                        className="h-8 justify-start font-semibold"
                      >
                        Created
                        <ArrowUpDown className="ml-2 h-3 w-3" />
                      </Button>
                    </th>
                    <th className="text-left p-2">Cost</th>
                    <th className="text-right p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedClaims.map((claim) => (
                    <tr key={claim.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <span className="font-mono font-semibold">{claim.id}</span>
                          <div className="text-xs text-muted-foreground">{claim.vin}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <span className="font-medium">{claim.customer}</span>
                          <div className="text-xs text-muted-foreground">{claim.customerPhone}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="text-sm">{claim.vehicle}</span>
                      </td>
                      <td className="p-2">
                        <div className="max-w-40">
                          <span className="text-sm">{claim.issue}</span>
                          <div className="text-xs text-muted-foreground capitalize">{claim.category}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        {getStatusBadge(claim.status)}
                      </td>
                      <td className="p-2">
                        {getPriorityBadge(claim.priority)}
                      </td>
                      <td className="p-2">
                        <div>
                          <span className="text-sm">{new Date(claim.createdDate).toLocaleDateString('vi-VN')}</span>
                          <div className="text-xs text-muted-foreground">
                            by {claim.technician}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className="font-semibold text-primary">{claim.estimatedCost}</span>
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex space-x-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(claim.id)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(hasPermission(user, 'approve_reject_claims') || hasPermission(user, 'update_technical_status')) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStatus(claim.id, claim.status)}
                              title={user?.role === 'technician' ? 'Update Progress' : 'Update Status'}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredAndSortedClaims.length)} of {filteredAndSortedClaims.length} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      {currentPage < totalPages - 2 && <span className="px-2">...</span>}
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
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
          onStatusUpdated={() => {
            setShowUpdateStatus(false);
          }}
        />
      )}
    </div>
  );
};

export default AllClaims;