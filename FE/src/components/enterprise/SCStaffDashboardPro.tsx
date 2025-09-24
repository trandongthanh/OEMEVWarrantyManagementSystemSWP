import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Car, 
  Users, 
  Package, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Activity,
  FileText,
  ClipboardList,
  HandHeart
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
  isLoading?: boolean;
}

const KPICard = ({ title, value, change, trend, icon: Icon, isLoading }: KPICardProps) => {
  if (isLoading) {
    return (
      <Card className="hover:shadow-elegant transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-elegant transition-all duration-200 border-l-4 border-l-primary">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-center space-x-2 mt-2">
              <h3 className="text-3xl font-bold text-foreground">{value}</h3>
              {change && (
                <span className={`text-sm flex items-center font-medium ${
                  trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
                }`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {change}
                </span>
              )}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    "pending": { variant: "secondary" as const, text: "Pending", className: "" },
    "in-repair": { variant: "default" as const, text: "In Repair", className: "" },
    "awaiting-parts": { variant: "outline" as const, text: "Awaiting Parts", className: "border-warning text-warning" },
    "awaiting-handover": { variant: "outline" as const, text: "Awaiting Handover", className: "border-info text-info bg-info/5" },
    "manufacturer-review": { variant: "outline" as const, text: "Manufacturer Review", className: "border-warning text-warning bg-warning/5" },
    "approved": { variant: "outline" as const, text: "Approved", className: "border-success text-success bg-success/5" },
    "completed": { variant: "outline" as const, text: "Completed", className: "border-success text-success bg-success/10" }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig];
  return config ? (
    <Badge variant={config.variant} className={config.className}>
      {config.text}
    </Badge>
  ) : (
    <Badge variant="secondary">{status}</Badge>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <ClipboardList className="h-16 w-16 text-muted-foreground/50 mb-4" />
    <h3 className="text-lg font-medium text-foreground mb-2">No active cases</h3>
    <p className="text-sm text-muted-foreground mb-6">Get started by creating your first warranty case</p>
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Create New Case
    </Button>
  </div>
);

const SCStaffDashboardPro = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for active cases
  const activeCases = [
    {
      id: "WC-25-09-001",
      customer: "Nguyễn Văn An",
      vin: "VF8ABC123456789",
      status: "manufacturer-review",
      assignedTech: "Trần Minh Bảo",
      dateCreated: "2025-01-15",
      model: "VF8 Plus"
    },
    {
      id: "WC-25-09-002", 
      customer: "Lê Thị Cẩm",
      vin: "VF9DEF987654321",
      status: "awaiting-parts",
      assignedTech: "Phạm Văn Đức",
      dateCreated: "2025-01-14",
      model: "VF9 Eco"
    },
    {
      id: "WC-25-09-003",
      customer: "Hoàng Minh Elip",
      vin: "VF8GHI456789123",
      status: "awaiting-handover",
      assignedTech: "Nguyễn Thị Phương",
      dateCreated: "2025-01-13",
      model: "VF8 Plus"
    },
    {
      id: "WC-25-09-004",
      customer: "Trần Quốc Huy",
      vin: "VF9JKL789012345",
      status: "in-repair",
      assignedTech: "Lê Văn Giang",
      dateCreated: "2025-01-12",
      model: "VF9 Premium"
    }
  ];

  const filteredCases = activeCases.filter(case_ => 
    case_.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    case_.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    case_.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Service Center Dashboard</h1>
          <p className="text-muted-foreground text-lg mt-1">Monitor warranty cases and service operations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="lg">
            <FileText className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
          <Button size="lg" className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create New Case
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Open Cases"
          value={24}
          change="+3 today"
          trend="up"
          icon={Car}
          isLoading={isLoading}
        />
        <KPICard
          title="Pending Manufacturer Approval"
          value={8}
          change="+2 this week"
          trend="up"
          icon={Clock}
          isLoading={isLoading}
        />
        <KPICard
          title="Awaiting Parts"
          value={6}
          change="-1 today"
          trend="down"
          icon={Package}
          isLoading={isLoading}
        />
        <KPICard
          title="Awaiting Customer Handover"
          value={3}
          change="+1 today"
          trend="up"
          icon={HandHeart}
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content - Active Cases */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Active Cases</CardTitle>
                  <CardDescription className="text-base">
                    Cases currently being processed in your service center
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-primary">
                  View All Cases
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by Case ID, VIN, or customer..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>
                
                {filteredCases.length === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="font-semibold">Case ID</TableHead>
                          <TableHead className="font-semibold">Customer</TableHead>
                          <TableHead className="font-semibold">Vehicle</TableHead>
                          <TableHead className="font-semibold">Status</TableHead>
                          <TableHead className="font-semibold">Assigned Tech</TableHead>
                          <TableHead className="font-semibold">Date Created</TableHead>
                          <TableHead className="font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCases.map((case_) => (
                          <TableRow 
                            key={case_.id} 
                            className="hover:bg-muted/50 cursor-pointer transition-colors"
                          >
                            <TableCell className="font-mono font-medium text-primary">
                              {case_.id}
                            </TableCell>
                            <TableCell className="font-medium">{case_.customer}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{case_.model}</div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  {case_.vin}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={case_.status} />
                            </TableCell>
                            <TableCell className="text-sm">{case_.assignedTech}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {case_.dateCreated}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start h-12 text-left">
                <Car className="mr-3 h-4 w-4" />
                Register New Vehicle
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-left">
                <FileText className="mr-3 h-4 w-4" />
                Create Warranty Case
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-left">
                <Users className="mr-3 h-4 w-4" />
                Assign Technician
              </Button>
              <Button variant="outline" className="w-full justify-start h-12 text-left">
                <Package className="mr-3 h-4 w-4" />
                Track Part Shipment
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-success rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">Case WC-25-09-001 approved by manufacturer</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-warning rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">Parts shipment PS-2025-001 in transit</p>
                    <p className="text-xs text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">New technician assigned to Case WC-25-09-003</p>
                    <p className="text-xs text-muted-foreground">6 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SCStaffDashboardPro;