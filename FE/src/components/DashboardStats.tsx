import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Wrench, 
  AlertTriangle,
  Car,
  Package,
  Clock,
  CheckCircle
} from 'lucide-react';

interface DashboardStatsProps {
  userRole: string;
}

const DashboardStats = ({ userRole }: DashboardStatsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedModel, setSelectedModel] = useState('all');

  // Mock data - replace with real API calls
  const claimsByModel = [
    { model: 'EV Model X Pro', claims: 45, cost: 680000000, failureRate: 3.2 },
    { model: 'EV Compact Plus', claims: 32, cost: 420000000, failureRate: 2.8 },
    { model: 'EV Sport Series', claims: 18, cost: 340000000, failureRate: 4.1 },
    { model: 'EV City Mini', claims: 25, cost: 180000000, failureRate: 1.9 }
  ];

  const claimsByRegion = [
    { region: 'Hà Nội', claims: 38, technicians: 12, avgTime: 2.3 },
    { region: 'TP.HCM', claims: 42, technicians: 15, avgTime: 1.9 },
    { region: 'Đà Nẵng', claims: 18, technicians: 8, avgTime: 2.8 },
    { region: 'Cần Thơ', claims: 22, technicians: 6, avgTime: 3.1 }
  ];

  const topFailureParts = [
    { part: 'Battery Module', failures: 28, cost: 420000000, criticality: 'high' },
    { part: 'Motor Controller', failures: 19, cost: 152000000, criticality: 'medium' },
    { part: 'Charging Port', failures: 15, cost: 48000000, criticality: 'low' },
    { part: 'Display Unit', failures: 12, cost: 36000000, criticality: 'low' },
    { part: 'Cooling System', failures: 8, cost: 64000000, criticality: 'medium' }
  ];

  const technicianPerformance = [
    { name: 'Nguyễn Văn A', completedClaims: 15, avgTime: 1.8, qualityScore: 9.2, efficiency: 95 },
    { name: 'Trần Thị B', completedClaims: 18, avgTime: 2.1, qualityScore: 8.9, efficiency: 92 },
    { name: 'Lê Minh C', completedClaims: 12, avgTime: 2.5, qualityScore: 8.5, efficiency: 88 },
    { name: 'Phạm Thu D', completedClaims: 14, avgTime: 1.9, qualityScore: 9.0, efficiency: 93 }
  ];

  const monthlyTrends = [
    { month: 'T1', claims: 32, cost: 280000000, satisfaction: 8.5 },
    { month: 'T2', claims: 28, cost: 320000000, satisfaction: 8.7 },
    { month: 'T3', claims: 35, cost: 410000000, satisfaction: 8.3 },
    { month: 'T4', claims: 42, cost: 520000000, satisfaction: 8.1 },
    { month: 'T5', claims: 38, cost: 480000000, satisfaction: 8.4 },
    { month: 'T6', claims: 45, cost: 620000000, satisfaction: 8.2 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const getCriticalityBadge = (level: string) => {
    const configs = {
      high: { variant: 'destructive' as const, text: 'Cao' },
      medium: { variant: 'warning' as const, text: 'Trung bình' },
      low: { variant: 'secondary' as const, text: 'Thấp' }
    };
    const config = configs[level as keyof typeof configs];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Period & Model Filters */}
      <div className="flex gap-4">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Tuần này</SelectItem>
            <SelectItem value="month">Tháng này</SelectItem>
            <SelectItem value="quarter">Quý này</SelectItem>
            <SelectItem value="year">Năm này</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả dòng xe</SelectItem>
            <SelectItem value="model-x">EV Model X Pro</SelectItem>
            <SelectItem value="compact">EV Compact Plus</SelectItem>
            <SelectItem value="sport">EV Sport Series</SelectItem>
            <SelectItem value="city">EV City Mini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="claims">Claims theo Model</TabsTrigger>
          <TabsTrigger value="parts">Phụ tùng lỗi</TabsTrigger>
          <TabsTrigger value="technicians">Hiệu suất KTV</TabsTrigger>
          <TabsTrigger value="regions">Theo khu vực</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tổng Claims</p>
                    <p className="text-2xl font-bold">120</p>
                    <p className="text-xs text-success flex items-center">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +12% so với tháng trước
                    </p>
                  </div>
                  <Car className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chi phí bảo hành</p>
                    <p className="text-2xl font-bold">1.64 tỷ</p>
                    <p className="text-xs text-destructive flex items-center">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +18% so với tháng trước
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Thời gian xử lý TB</p>
                    <p className="text-2xl font-bold">2.3 ngày</p>
                    <p className="text-xs text-success flex items-center">
                      <TrendingDown className="mr-1 h-3 w-3" />
                      -8% so với tháng trước
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-automotive-steel" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tỷ lệ hài lòng</p>
                    <p className="text-2xl font-bold">8.4/10</p>
                    <p className="text-xs text-success flex items-center">
                      <TrendingUp className="mr-1 h-3 w-3" />
                      +0.3 điểm
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trends Chart */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Xu hướng theo tháng</CardTitle>
              <CardDescription>Số lượng claims và chi phí bảo hành</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'cost') return [formatCurrency(value as number), 'Chi phí'];
                      if (name === 'claims') return [value, 'Claims'];
                      if (name === 'satisfaction') return [value + '/10', 'Hài lòng'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="claims" fill="hsl(var(--primary))" name="Claims" />
                  <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="hsl(var(--success))" name="Hài lòng" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Phân tích Claims theo Model xe</CardTitle>
              <CardDescription>Thống kê số lượng, chi phí và tỷ lệ hỏng hóc</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={claimsByModel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="model" />
                  <YAxis />
                  <Tooltip formatter={(value) => [value, 'Claims']} />
                  <Legend />
                  <Bar dataKey="claims" fill="hsl(var(--primary))" name="Số Claims" />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid gap-4">
                {claimsByModel.map((model, index) => (
                  <Card key={model.model} className="border-l-4" style={{ borderLeftColor: COLORS[index % COLORS.length] }}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="font-medium">{model.model}</p>
                          <p className="text-sm text-muted-foreground">Model xe</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{model.claims}</p>
                          <p className="text-sm text-muted-foreground">Claims</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{formatCurrency(model.cost)}</p>
                          <p className="text-sm text-muted-foreground">Chi phí</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold">{model.failureRate}%</p>
                          <p className="text-sm text-muted-foreground">Tỷ lệ hỏng hóc</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Top phụ tùng hay hỏng</CardTitle>
              <CardDescription>Phân tích chi tiết các phụ tùng có tỷ lệ hỏng cao</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topFailureParts.map((part, index) => (
                <Card key={part.part} className="border">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{part.part}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{part.failures} lần hỏng</Badge>
                            {getCriticalityBadge(part.criticality)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">{formatCurrency(part.cost)}</p>
                        <p className="text-sm text-muted-foreground">Chi phí thay thế</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technicians" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Hiệu suất Kỹ thuật viên</CardTitle>
              <CardDescription>Đánh giá chất lượng và hiệu quả công việc</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {technicianPerformance.map((tech) => (
                <Card key={tech.name} className="border">
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-5 gap-4">
                      <div>
                        <p className="font-medium">{tech.name}</p>
                        <p className="text-sm text-muted-foreground">Kỹ thuật viên</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{tech.completedClaims}</p>
                        <p className="text-sm text-muted-foreground">Claims hoàn thành</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{tech.avgTime} ngày</p>
                        <p className="text-sm text-muted-foreground">Thời gian TB</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold">{tech.qualityScore}/10</p>
                        <p className="text-sm text-muted-foreground">Điểm chất lượng</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full" 
                              style={{ width: `${tech.efficiency}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{tech.efficiency}%</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Hiệu suất</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regions" className="space-y-6">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Thống kê theo khu vực</CardTitle>
              <CardDescription>Phân tích claims và hiệu suất theo địa lý</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={claimsByRegion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="claims" fill="hsl(var(--primary))" name="Claims" />
                  <Bar dataKey="technicians" fill="hsl(var(--success))" name="Kỹ thuật viên" />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid gap-4 md:grid-cols-2">
                {claimsByRegion.map((region) => (
                  <Card key={region.region}>
                    <CardHeader>
                      <CardTitle className="text-base">{region.region}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Claims:</span>
                        <span className="font-medium">{region.claims}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kỹ thuật viên:</span>
                        <span className="font-medium">{region.technicians}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Thời gian TB:</span>
                        <span className="font-medium">{region.avgTime} ngày</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardStats;