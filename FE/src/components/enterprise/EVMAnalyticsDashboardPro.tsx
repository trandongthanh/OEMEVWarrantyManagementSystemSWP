import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Car,
  DollarSign,
  Activity,
  Download,
  Filter,
  Search,
  MoreHorizontal
} from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
}

const KPICard = ({ title, value, change, trend, icon: Icon }: KPICardProps) => (
  <Card className="hover:shadow-elegant transition-all duration-200">
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
                {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
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

const EVMAnalyticsDashboardPro = () => {
  const [filterPartType, setFilterPartType] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for charts
  const warrantyCostData = [
    { month: 'Jan', cost: 245000 },
    { month: 'Feb', cost: 289000 },
    { month: 'Mar', cost: 267000 },
    { month: 'Apr', cost: 234000 },
    { month: 'May', cost: 298000 },
    { month: 'Jun', cost: 312000 },
    { month: 'Jul', cost: 289000 },
    { month: 'Aug', cost: 267000 },
    { month: 'Sep', cost: 278000 },
    { month: 'Oct', cost: 234000 },
    { month: 'Nov', cost: 256000 },
    { month: 'Dec', cost: 289000 }
  ];

  const claimsByStatusData = [
    { name: 'Approved', value: 156, color: '#10B981' },
    { name: 'Pending', value: 89, color: '#F59E0B' },
    { name: 'Rejected', value: 23, color: '#EF4444' },
    { name: 'In Review', value: 67, color: '#3B82F6' }
  ];

  const topFailingPartsData = [
    { part: 'Battery Module', failures: 89, model: 'VF8 Plus' },
    { part: 'Charging Port', failures: 67, model: 'VF9 Eco' },
    { part: 'Inverter Unit', failures: 54, model: 'VF8 Plus' },
    { part: 'Cooling System', failures: 43, model: 'VF9 Premium' },
    { part: 'Door Actuator', failures: 38, model: 'VF8 Eco' }
  ];

  // Critical failure rate statistics data
  const failureRateData = [
    {
      partType: "Battery Module",
      vehicleModel: "VF8 Plus",
      region: "North",
      failureCount: 89,
      totalUnits: 1250,
      failureRate: 7.12
    },
    {
      partType: "Charging Port",
      vehicleModel: "VF9 Eco", 
      region: "South",
      failureCount: 67,
      totalUnits: 980,
      failureRate: 6.84
    },
    {
      partType: "Inverter Unit",
      vehicleModel: "VF8 Plus",
      region: "Central",
      failureCount: 54,
      totalUnits: 890,
      failureRate: 6.07
    },
    {
      partType: "Cooling System",
      vehicleModel: "VF9 Premium",
      region: "North",
      failureCount: 43,
      totalUnits: 780,
      failureRate: 5.51
    },
    {
      partType: "Door Actuator", 
      vehicleModel: "VF8 Eco",
      region: "South",
      failureCount: 38,
      totalUnits: 720,
      failureRate: 5.28
    },
    {
      partType: "Infotainment",
      vehicleModel: "VF9 Premium",
      region: "Central", 
      failureCount: 32,
      totalUnits: 650,
      failureRate: 4.92
    },
    {
      partType: "Brake System",
      vehicleModel: "VF8 Plus",
      region: "North",
      failureCount: 28,
      totalUnits: 920,
      failureRate: 3.04
    },
    {
      partType: "Suspension",
      vehicleModel: "VF9 Eco",
      region: "South", 
      failureCount: 25,
      totalUnits: 850,
      failureRate: 2.94
    }
  ];

  const filteredFailureData = failureRateData.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.partType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vehicleModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.region.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPartType = filterPartType === "" || item.partType === filterPartType;
    const matchesModel = filterModel === "" || item.vehicleModel === filterModel;
    const matchesRegion = filterRegion === "" || item.region === filterRegion;
    
    return matchesSearch && matchesPartType && matchesModel && matchesRegion;
  });

  const getFailureRateColor = (rate: number) => {
    if (rate > 6) return "text-destructive";
    if (rate > 4) return "text-warning"; 
    return "text-success";
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">EVM Analytics Dashboard</h1>
          <p className="text-muted-foreground text-lg mt-1">Warranty network insights and business intelligence</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="lg">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Open Claims"
          value={335}
          change="+12%"
          trend="up"
          icon={Car}
        />
        <KPICard
          title="Claims Pending Review"
          value={89}
          change="+8%"
          trend="up"
          icon={AlertTriangle}
        />
        <KPICard
          title="Network Approval Rate"
          value="87.3%"
          change="+2.1%"
          trend="up"
          icon={Activity}
        />
        <KPICard
          title="Total Warranty Cost (MTD)"
          value="$289K"
          change="-5.4%"
          trend="down"
          icon={DollarSign}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Warranty Costs Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Warranty Costs Over Last 12 Months</CardTitle>
            <CardDescription>Monthly warranty claim costs in USD</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={warrantyCostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Cost']} />
                <Line 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Claims by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Claims by Status</CardTitle>
            <CardDescription>Current distribution of warranty claims</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={claimsByStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {claimsByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Failing Components Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Failing Components</CardTitle>
          <CardDescription>Components with the highest failure counts</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topFailingPartsData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="part" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="failures" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Critical Failure Rate Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Failure Rate Statistics</CardTitle>
              <CardDescription>Core data for business decisions and quality analysis</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search parts, models, regions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={filterPartType} onValueChange={setFilterPartType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Part Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Parts</SelectItem>
                  <SelectItem value="Battery Module">Battery Module</SelectItem>
                  <SelectItem value="Charging Port">Charging Port</SelectItem>
                  <SelectItem value="Inverter Unit">Inverter Unit</SelectItem>
                  <SelectItem value="Cooling System">Cooling System</SelectItem>
                  <SelectItem value="Door Actuator">Door Actuator</SelectItem>
                  <SelectItem value="Infotainment">Infotainment</SelectItem>
                  <SelectItem value="Brake System">Brake System</SelectItem>
                  <SelectItem value="Suspension">Suspension</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterModel} onValueChange={setFilterModel}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Vehicle Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Models</SelectItem>
                  <SelectItem value="VF8 Plus">VF8 Plus</SelectItem>
                  <SelectItem value="VF8 Eco">VF8 Eco</SelectItem>
                  <SelectItem value="VF9 Eco">VF9 Eco</SelectItem>
                  <SelectItem value="VF9 Premium">VF9 Premium</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRegion} onValueChange={setFilterRegion}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Regions</SelectItem>
                  <SelectItem value="North">North</SelectItem>
                  <SelectItem value="Central">Central</SelectItem>
                  <SelectItem value="South">South</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-semibold">Part Type</TableHead>
                    <TableHead className="font-semibold">Vehicle Model</TableHead>
                    <TableHead className="font-semibold">Region</TableHead>
                    <TableHead className="font-semibold text-right">Failure Count</TableHead>
                    <TableHead className="font-semibold text-right">Total Units</TableHead>
                    <TableHead className="font-semibold text-right">Failure Rate</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFailureData.map((item, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.partType}</TableCell>
                      <TableCell>{item.vehicleModel}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {item.region}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{item.failureCount}</TableCell>
                      <TableCell className="text-right font-mono">{item.totalUnits.toLocaleString()}</TableCell>
                      <TableCell className={`text-right font-mono font-semibold ${getFailureRateColor(item.failureRate)}`}>
                        {item.failureRate}%
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredFailureData.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No data matches your current filters</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EVMAnalyticsDashboardPro;