import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Filter, Eye, Plus, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface CaseManagementProps {
  onViewCase?: (caseId: string) => void;
  onCreateCase?: () => void;
}

const CaseManagement = ({ onViewCase, onCreateCase }: CaseManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();

  const mockCases = [
    {
      id: "WC-2024-001",
      customer: "Nguyễn Văn A",
      vin: "1HGBH41JXMN109186",
      status: "pending",
      dateCreated: "2024-01-15",
      lastUpdated: "2024-01-16",
      assignedTech: "Trần Minh B",
      finalCost: null,
      issue: "Battery Performance Issue",
      priority: "high"
    },
    {
      id: "WC-2024-002",
      customer: "Lê Thị C",
      vin: "WVWZZZ1JZ3W386752",
      status: "approved",
      dateCreated: "2024-01-14",
      lastUpdated: "2024-01-16",
      assignedTech: "Phạm Văn D",
      finalCost: 2500000,
      issue: "Motor Controller Fault",
      priority: "critical"
    },
    {
      id: "WC-2024-003",
      customer: "Hoàng Minh E",
      vin: "1N4AL11D75C109151",
      status: "in-progress",
      dateCreated: "2024-01-13",
      lastUpdated: "2024-01-16",
      assignedTech: "Võ Thị F",
      finalCost: null,
      issue: "Charging System Error",
      priority: "medium"
    },
    {
      id: "WC-2024-004",
      customer: "Trần Văn G",
      vin: "JM1BK32F781234567",
      status: "completed",
      dateCreated: "2024-01-10",
      lastUpdated: "2024-01-15",
      assignedTech: "Nguyễn Thị H",
      finalCost: 1800000,
      issue: "DC-DC Converter Replacement",
      priority: "low"
    },
    {
      id: "WC-2024-005",
      customer: "Phạm Thị I",
      vin: "WVWZZZ1JZ3W123456",
      status: "rejected",
      dateCreated: "2024-01-12",
      lastUpdated: "2024-01-14",
      assignedTech: "Lê Văn K",
      finalCost: null,
      issue: "Cosmetic Paint Issue",
      priority: "low"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "pending" as const, text: "Chờ duyệt" },
      approved: { variant: "approved" as const, text: "Đã duyệt" },
      rejected: { variant: "rejected" as const, text: "Từ chối" },
      "in-progress": { variant: "warning" as const, text: "Đang sửa" },
      completed: { variant: "success" as const, text: "Hoàn thành" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge variant={config.variant}>
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

    return (
      <Badge variant={config.variant} className="text-xs">
        {config.text}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const filteredCases = mockCases.filter(caseItem => {
    const matchesSearch = 
      caseItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.customer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || caseItem.status === statusFilter;
    const matchesTechnician = technicianFilter === "all" || caseItem.assignedTech === technicianFilter;
    
    return matchesSearch && matchesStatus && matchesTechnician;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Case Management</h1>
          <p className="text-muted-foreground">
            Comprehensive warranty case tracking and management
          </p>
        </div>
        <Button variant="gradient" onClick={onCreateCase}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Case
        </Button>
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
                placeholder="Search Case ID, VIN, Customer..."
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
                <SelectItem value="pending">Chờ duyệt</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="in-progress">Đang sửa</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>

            {/* Technician Filter */}
            <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Technician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Technicians</SelectItem>
                <SelectItem value="Trần Minh B">Trần Minh B</SelectItem>
                <SelectItem value="Phạm Văn D">Phạm Văn D</SelectItem>
                <SelectItem value="Võ Thị F">Võ Thị F</SelectItem>
                <SelectItem value="Nguyễn Thị H">Nguyễn Thị H</SelectItem>
                <SelectItem value="Lê Văn K">Lê Văn K</SelectItem>
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
          Showing {filteredCases.length} of {mockCases.length} cases
        </span>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4" />
          <span>Results filtered by: {statusFilter !== "all" ? `Status (${statusFilter})` : "All"}</span>
        </div>
      </div>

      {/* Cases Table */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>All Warranty Cases</CardTitle>
          <CardDescription>
            Complete list of warranty cases with detailed information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>VIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Assigned Tech</TableHead>
                <TableHead>Final Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((caseItem) => (
                <TableRow key={caseItem.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{caseItem.id}</TableCell>
                  <TableCell>{caseItem.customer}</TableCell>
                  <TableCell className="font-mono text-xs">{caseItem.vin}</TableCell>
                  <TableCell>
                    {getStatusBadge(caseItem.status)}
                  </TableCell>
                  <TableCell>
                    {getPriorityBadge(caseItem.priority)}
                  </TableCell>
                  <TableCell className="text-sm">{caseItem.dateCreated}</TableCell>
                  <TableCell className="text-sm">{caseItem.lastUpdated}</TableCell>
                  <TableCell className="text-sm">{caseItem.assignedTech}</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(caseItem.finalCost)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewCase?.(caseItem.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
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

export default CaseManagement;