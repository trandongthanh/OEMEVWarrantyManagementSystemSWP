import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus, 
  Download, 
  Calendar as CalendarIcon,
  Eye,
  MoreHorizontal,
  ArrowUpDown,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface CaseData {
  id: string;
  customer: string;
  vin: string;
  status: string;
  dateCreated: string;
  lastUpdated: string;
  assignedTech: string;
  finalCost: number | null;
  priority: "high" | "medium" | "low";
  vehicleModel: string;
}

const EnhancedCaseManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [techFilter, setTechFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortField, setSortField] = useState("dateCreated");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Mock case data
  const mockCases: CaseData[] = [
    {
      id: "WC-25-09-001",
      customer: "Nguyễn Văn A",
      vin: "VF8ABC123456789",
      status: "pending-manufacturer",
      dateCreated: "2025-01-15",
      lastUpdated: "2025-01-16 14:30",
      assignedTech: "Trần Minh B",
      finalCost: null,
      priority: "high",
      vehicleModel: "VinFast VF8"
    },
    {
      id: "WC-25-09-002", 
      customer: "Lê Thị C",
      vin: "VF9DEF987654321",
      status: "in-progress",
      dateCreated: "2025-01-14",
      lastUpdated: "2025-01-15 16:45",
      assignedTech: "Phạm Văn D",
      finalCost: null,
      priority: "medium",
      vehicleModel: "VinFast VF9"
    },
    {
      id: "WC-25-09-003",
      customer: "Hoàng Minh E",
      vin: "VF8GHI456789123",
      status: "completed",
      dateCreated: "2025-01-13",
      lastUpdated: "2025-01-16 10:20",
      assignedTech: "Nguyễn Thị F",
      finalCost: 2500000,
      priority: "low",
      vehicleModel: "VinFast VF8"
    },
    {
      id: "WC-25-09-004",
      customer: "Trần Văn G",
      vin: "VF9JKL789123456",
      status: "awaiting-parts",
      dateCreated: "2025-01-12",
      lastUpdated: "2025-01-14 09:15",
      assignedTech: "Lê Minh H",
      finalCost: null,
      priority: "high",
      vehicleModel: "VinFast VF9"
    },
    {
      id: "WC-25-09-005",
      customer: "Phạm Thị I",
      vin: "VF8MNO123456789",
      status: "rejected",
      dateCreated: "2025-01-10",
      lastUpdated: "2025-01-11 11:30",
      assignedTech: "Võ Văn J",
      finalCost: 0,
      priority: "medium",
      vehicleModel: "VinFast VF8"
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "pending-manufacturer": { variant: "pending" as const, text: "Pending Manufacturer" },
      "awaiting-parts": { variant: "warning" as const, text: "Awaiting Parts" },
      "in-progress": { variant: "default" as const, text: "In Progress" },
      "completed": { variant: "success" as const, text: "Completed" },
      "rejected": { variant: "destructive" as const, text: "Rejected" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <Badge variant={config.variant}>{config.text}</Badge> : null;
  };

  const getPriorityBadge = (priority: "high" | "medium" | "low") => {
    const priorityConfig = {
      high: { variant: "destructive" as const, text: "High", className: "bg-destructive/10 text-destructive" },
      medium: { variant: "warning" as const, text: "Medium", className: "bg-warning/10 text-warning-foreground" },
      low: { variant: "secondary" as const, text: "Low", className: "bg-muted text-muted-foreground" }
    };
    
    const config = priorityConfig[priority];
    return (
      <Badge variant="outline" className={`text-xs ${config.className}`}>
        {config.text}
      </Badge>
    );
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedCases = mockCases
    .filter(case_ => {
      const matchesSearch = searchQuery === "" || 
        case_.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.vin.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || case_.status === statusFilter;
      const matchesTech = techFilter === "all" || case_.assignedTech === techFilter;
      const matchesPriority = priorityFilter === "all" || case_.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesTech && matchesPriority;
    })
    .sort((a, b) => {
      const aValue = a[sortField as keyof CaseData];
      const bValue = b[sortField as keyof CaseData];
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warranty Cases</h1>
          <p className="text-muted-foreground">Manage and track all warranty cases</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="gradient">
            <Plus className="mr-2 h-4 w-4" />
            Create New Case
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Advanced Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Case ID, VIN, or Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending-manufacturer">Pending Manufacturer</SelectItem>
                  <SelectItem value="awaiting-parts">Awaiting Parts</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tech Filter */}
            <div>
              <Select value={techFilter} onValueChange={setTechFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  <SelectItem value="Trần Minh B">Trần Minh B</SelectItem>
                  <SelectItem value="Phạm Văn D">Phạm Văn D</SelectItem>
                  <SelectItem value="Nguyễn Thị F">Nguyễn Thị F</SelectItem>
                  <SelectItem value="Lê Minh H">Lê Minh H</SelectItem>
                  <SelectItem value="Võ Văn J">Võ Văn J</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority Filter */}
            <div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PPP") : "Date Range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Cases ({filteredAndSortedCases.length})</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Showing {filteredAndSortedCases.length} of {mockCases.length} cases</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Case ID</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("customer")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Customer</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Vehicle & VIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("dateCreated")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Date Created</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("lastUpdated")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Last Updated</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Assigned Tech</TableHead>
                <TableHead className="text-right">Final Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedCases.map((case_) => (
                <TableRow key={case_.id} className="hover:bg-muted/50 cursor-pointer">
                  <TableCell className="font-medium font-mono">{case_.id}</TableCell>
                  <TableCell className="font-medium">{case_.customer}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{case_.vehicleModel}</p>
                      <p className="font-mono text-xs text-muted-foreground">{case_.vin}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(case_.status)}</TableCell>
                  <TableCell>{getPriorityBadge(case_.priority)}</TableCell>
                  <TableCell>{case_.dateCreated}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{case_.lastUpdated}</TableCell>
                  <TableCell>{case_.assignedTech}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(case_.finalCost)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button variant="ghost" size="sm">
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

export default EnhancedCaseManagement;