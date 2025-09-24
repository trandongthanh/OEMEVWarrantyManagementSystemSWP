import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Search,
  Filter,
  CalendarIcon,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  FileText,
  Building,
  Car
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface EVMClaimReviewQueueProps {
  onReviewClaim?: (claimId: string) => void;
}

const EVMClaimReviewQueue = ({ onReviewClaim }: EVMClaimReviewQueueProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceCenterFilter, setServiceCenterFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  // Mock data - In real app would come from API
  const pendingClaims = [
    // Sample claims pending review data - uncomment for testing UI
    /*
    {
      id: "WC-2024-001",
      serviceCenter: "VinFast Service Center HCM",
      serviceCenterCode: "VSC-HCM-01",
      customerName: "Nguyễn Văn A",
      vin: "1HGBH41JXMN109186",
      vehicleModel: "VinFast VF8 2023",
      issue: "Battery Performance Issue", 
      status: "pending-review",
      priority: "high",
      dateSubmitted: "2024-01-16",
      lastUpdated: "2024-01-16 14:30",
      estimatedCost: 18500000,
      reportsCount: 2,
      partsRequired: 3,
      warrantyValid: true,
      daysInQueue: 2
    },
    {
      id: "WC-2024-003",
      serviceCenter: "VinFast Service Center Da Nang",
      serviceCenterCode: "VSC-DN-01", 
      customerName: "Hoàng Minh E",
      vin: "1N4AL11D75C109151",
      vehicleModel: "VinFast VF9 2023",
      issue: "Charging System Error",
      status: "pending-review",
      priority: "medium",
      dateSubmitted: "2024-01-15",
      lastUpdated: "2024-01-15 16:45",
      estimatedCost: 12000000,
      reportsCount: 1,
      partsRequired: 2,
      warrantyValid: true,
      daysInQueue: 3
    },
    {
      id: "WC-2024-007",
      serviceCenter: "VinFast Service Center Hanoi",
      serviceCenterCode: "VSC-HN-01",
      customerName: "Trần Thị B",
      vin: "WVWZZZ1JZ3W987654",
      vehicleModel: "VinFast VF8 2023",
      issue: "Motor Controller Malfunction",
      status: "under-review",
      priority: "critical",
      dateSubmitted: "2024-01-14",
      lastUpdated: "2024-01-16 10:20",
      estimatedCost: 25000000,
      reportsCount: 3,
      partsRequired: 1,
      warrantyValid: true,
      daysInQueue: 4
    },
    {
      id: "WC-2024-008",
      serviceCenter: "VinFast Service Center Can Tho",
      serviceCenterCode: "VSC-CT-01",
      customerName: "Lê Văn C",
      vin: "JM1BK32F781111111",
      vehicleModel: "VinFast VF9 2023",
      issue: "Software Update Required",
      status: "pending-review",
      priority: "low",
      dateSubmitted: "2024-01-13",
      lastUpdated: "2024-01-13 09:30",
      estimatedCost: 500000,
      reportsCount: 1,
      partsRequired: 0,
      warrantyValid: true,
      daysInQueue: 5
    },
    {
      id: "WC-2024-009",
      serviceCenter: "VinFast Service Center HCM",
      serviceCenterCode: "VSC-HCM-02",
      customerName: "Phạm Thị D",
      vin: "WVWZZZ1JZ3W555555",
      vehicleModel: "VinFast VF8 2023",
      issue: "Climate Control Issue",
      status: "pending-review",
      priority: "medium",
      dateSubmitted: "2024-01-16",
      lastUpdated: "2024-01-16 08:15",
      estimatedCost: 3200000,
      reportsCount: 1,
      partsRequired: 2,
      warrantyValid: false,
      daysInQueue: 2
    }
    */
  ];

  const serviceCenters = [
    "VinFast Service Center HCM",
    "VinFast Service Center Hanoi",
    "VinFast Service Center Da Nang",
    "VinFast Service Center Can Tho"
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "pending-review": { variant: "warning" as const, text: "Chờ duyệt", icon: Clock },
      "under-review": { variant: "secondary" as const, text: "Đang duyệt", icon: Eye },
      "approved": { variant: "success" as const, text: "Đã duyệt", icon: CheckCircle },
      "rejected": { variant: "destructive" as const, text: "Từ chối", icon: XCircle }
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
      critical: { variant: "destructive" as const, text: "Khẩn cấp" },
      high: { variant: "warning" as const, text: "Cao" },
      medium: { variant: "secondary" as const, text: "Trung bình" },
      low: { variant: "outline" as const, text: "Thấp" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;

    return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const filteredClaims = pendingClaims.filter(claim => {
    const matchesSearch =
      claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.serviceCenter.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || claim.status === statusFilter;
    const matchesServiceCenter = serviceCenterFilter === "all" || claim.serviceCenter === serviceCenterFilter;

    return matchesSearch && matchesStatus && matchesServiceCenter;
  });

  const stats = [
    {
      title: "Total Pending",
      value: pendingClaims.filter(c => c.status === "pending-review").length.toString(),
      change: "+3 today",
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Under Review",
      value: pendingClaims.filter(c => c.status === "under-review").length.toString(),
      change: "In progress",
      icon: Eye,
      color: "text-primary"
    },
    {
      title: "High Priority",
      value: pendingClaims.filter(c => c.priority === "critical" || c.priority === "high").length.toString(),
      change: "Urgent attention",
      icon: AlertCircle,
      color: "text-destructive"
    },
    {
      title: "Total Value",
      value: "₫" + (pendingClaims.reduce((sum, c) => sum + c.estimatedCost, 0) / 1000000).toFixed(1) + "M",
      change: "Estimated costs",
      icon: FileText,
      color: "text-success"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Claim Review Queue</h1>
          <p className="text-muted-foreground">
            Review and approve warranty claims from service centers
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-elegant">
              <CardContent className="p-4">
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

      {/* Filters */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search Case, VIN, Customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending-review">Chờ duyệt</SelectItem>
                <SelectItem value="under-review">Đang duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>

            {/* Service Center Filter */}
            <Select value={serviceCenterFilter} onValueChange={setServiceCenterFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Service Center" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Service Centers</SelectItem>
                {serviceCenters.map((center) => (
                  <SelectItem key={center} value={center}>
                    {center}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date From */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "From Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>

            {/* Date To */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "To Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filteredClaims.length} of {pendingClaims.length} claims
        </span>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Active filters: {[statusFilter, serviceCenterFilter].filter(f => f !== "all").length}</span>
        </div>
      </div>

      {/* Claims Table */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Claims Pending Review</CardTitle>
          <CardDescription>
            Comprehensive list of warranty claims requiring manufacturer approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Service Center</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead>Est. Cost</TableHead>
                <TableHead>Days in Queue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClaims.map((claim) => (
                <TableRow key={claim.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{claim.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{claim.serviceCenterCode}</p>
                        <p className="text-xs text-muted-foreground">{claim.serviceCenter}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div>
                        <p className="text-sm font-medium">{claim.customerName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{claim.vin}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{claim.vehicleModel}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{claim.issue}</p>
                      <p className="text-xs text-muted-foreground">
                        {claim.reportsCount} reports, {claim.partsRequired} parts
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(claim.status)}
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(claim.priority)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={claim.warrantyValid ? "success" : "destructive"} className="text-xs">
                      {claim.warrantyValid ? "Valid" : "Expired"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(claim.estimatedCost)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={claim.daysInQueue > 3 ? "warning" : "outline"} className="text-xs">
                      {claim.daysInQueue} days
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="gradient"
                      size="sm"
                      onClick={() => onReviewClaim?.(claim.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EVMClaimReviewQueue;