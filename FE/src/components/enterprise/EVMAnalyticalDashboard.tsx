import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Car,
  Factory,
  MapPin,
  BarChart3,
  Download,
  Filter
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from "recharts";

// Mock data for charts
const warrantyCostData = [
  { month: 'Jan', cost: 120000000, claims: 45 },
  { month: 'Feb', cost: 150000000, claims: 52 },
  { month: 'Mar', cost: 180000000, claims: 68 },
  { month: 'Apr', cost: 140000000, claims: 51 },
  { month: 'May', cost: 190000000, claims: 72 },
  { month: 'Jun', cost: 220000000, claims: 89 },
  { month: 'Jul', cost: 200000000, claims: 76 },
  { month: 'Aug', cost: 175000000, claims: 63 },
  { month: 'Sep', cost: 210000000, claims: 81 },
  { month: 'Oct', cost: 195000000, claims: 74 },
  { month: 'Nov', cost: 180000000, claims: 67 },
  { month: 'Dec', cost: 165000000, claims: 59 }
];

const claimStatusData = [
  { name: 'Approved', value: 65, color: '#10B981' },
  { name: 'Pending Review', value: 20, color: '#F59E0B' },
  { name: 'Rejected', value: 10, color: '#EF4444' },
  { name: 'Under Investigation', value: 5, color: '#3B82F6' }
];

const failingComponentsData = [
  { component: 'Battery Pack', failures: 45, cost: 89000000 },
  { component: 'Charging System', failures: 32, cost: 45000000 },
  { component: 'Display Unit', failures: 28, cost: 25000000 },
  { component: 'Air Conditioning', failures: 24, cost: 18000000 },
  { component: 'Door Mechanisms', failures: 19, cost: 12000000 }
];

const regionData = [
  { region: 'Ho Chi Minh City', claims: 125, cost: 245000000, centers: 8 },
  { region: 'Hanoi', claims: 98, cost: 189000000, centers: 6 },
  { region: 'Da Nang', claims: 45, cost: 85000000, centers: 3 },
  { region: 'Can Tho', claims: 32, cost: 62000000, centers: 2 },
  { region: 'Nha Trang', claims: 28, cost: 51000000, centers: 2 }
];

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ElementType;
  subtitle?: string;
}

const KPICard = ({ title, value, change, trend, icon: Icon, subtitle }: KPICardProps) => (
  <Card className="hover:shadow-elegant transition-all duration-200">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {change && (
              <div className={`flex items-center text-sm ${
                trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'
              }`}>
                {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : 
                 trend === 'down' ? <TrendingDown className="h-3 w-3 mr-1" /> : null}
                {change}
              </div>
            )}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-primary/10">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const EVMAnalyticalDashboard = () => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const totalClaims = warrantyCostData.reduce((sum, month) => sum + month.claims, 0);
  const totalCost = warrantyCostData.reduce((sum, month) => sum + month.cost, 0);
  const avgApprovalRate = 85.2; // Mock data
  const monthlyAverage = totalCost / 12;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">EVM Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive warranty management overview</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter Data
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button variant="gradient">
            <BarChart3 className="mr-2 h-4 w-4" />
            Advanced Analytics
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Open Claims"
          value={328}
          change="+12% this month"
          trend="up"
          icon={FileText}
          subtitle="Across all service centers"
        />
        <KPICard
          title="Claims Pending Review"
          value={67}
          change="+8 today"
          trend="up"
          icon={Clock}
          subtitle="Requiring immediate attention"
        />
        <KPICard
          title="Network Approval Rate"
          value={`${avgApprovalRate}%`}
          change="+2.1% vs last month"
          trend="up"
          icon={CheckCircle}
          subtitle="Industry leading performance"
        />
        <KPICard
          title="Monthly Warranty Cost"
          value={formatCurrency(monthlyAverage)}
          change="-5.2% vs last month"
          trend="down"
          icon={DollarSign}
          subtitle="December 2024"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Warranty Cost Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Warranty Costs Over Last 12 Months</span>
            </CardTitle>
            <CardDescription>
              Monthly warranty costs and claim volumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={warrantyCostData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'cost' ? formatCurrency(Number(value)) : value,
                    name === 'cost' ? 'Warranty Cost' : 'Claims'
                  ]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
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
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span>Claims by Status</span>
            </CardTitle>
            <CardDescription>
              Current distribution of claim statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={claimStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {claimStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Percentage']}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {claimStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Failing Components */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-destructive" />
              <span>Top 5 Failing Components</span>
            </CardTitle>
            <CardDescription>
              Components with highest failure rates and associated costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={failingComponentsData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  type="category" 
                  dataKey="component" 
                  stroke="hsl(var(--muted-foreground))"
                  width={100}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'cost' ? formatCurrency(Number(value)) : value,
                    name === 'cost' ? 'Total Cost' : 'Failures'
                  ]}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                />
                <Bar 
                  dataKey="failures" 
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Claims by Region */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-success" />
              <span>Claims by Region</span>
            </CardTitle>
            <CardDescription>
              Regional distribution of warranty claims
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {regionData.map((region, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Factory className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{region.region}</p>
                        <p className="text-xs text-muted-foreground">{region.centers} service centers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{region.claims} claims</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(region.cost)}</p>
                    </div>
                  </div>
                  <Progress 
                    value={(region.claims / Math.max(...regionData.map(r => r.claims))) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claims Needing Immediate Attention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Claims Needing Immediate Attention</span>
          </CardTitle>
          <CardDescription>
            High priority cases requiring urgent review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { id: "WC-25-09-001", center: "SC Ho Chi Minh 1", days: 5, priority: "high" },
              { id: "WC-25-09-008", center: "SC Hanoi 2", days: 4, priority: "high" }, 
              { id: "WC-25-09-015", center: "SC Da Nang 1", days: 3, priority: "medium" }
            ].map((claim, index) => (
              <Card key={index} className="border-l-4 border-l-destructive">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-medium text-sm">{claim.id}</span>
                    <Badge variant="destructive" className="text-xs">
                      {claim.days} days overdue
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{claim.center}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Review Case
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EVMAnalyticalDashboard;