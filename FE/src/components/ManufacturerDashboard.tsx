import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import ConfigureWarrantyPolicy from "./ConfigureWarrantyPolicy";
import AddPartInventory from "./AddPartInventory";
import CreateCampaign from "./CreateCampaign";
import ManufacturerApproval from "./ManufacturerApproval";
import DashboardStats from "./DashboardStats";
import RecallManagement from "./RecallManagement";
import PartsManagement from "./PartsManagement";
import {
  Building2,
  Package,
  Shield,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Plus,
  Settings,
  FileText,
  Truck,
  LogOut
} from "lucide-react";

const ManufacturerDashboard = () => {
  const [selectedMetric, setSelectedMetric] = useState("overview");
  const [showConfigurePolicy, setShowConfigurePolicy] = useState(false);
  const [selectedPolicyType, setSelectedPolicyType] = useState('');
  const [showAddPart, setShowAddPart] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [showRecallManagement, setShowRecallManagement] = useState(false);
  const [showPartsManagement, setShowPartsManagement] = useState(false);
  const [showDashboardStats, setShowDashboardStats] = useState(false);
  const { user, logout } = useAuth();

  const stats = [
    {
      title: "Pending Claims",
      value: "156",
      change: "+12% from last week",
      trend: "up",
      icon: Clock,
      color: "text-warning"
    },
    {
      title: "Approved Claims",
      value: "324",
      change: "+8% from last week",
      trend: "up",
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Parts Inventory",
      value: "12,450",
      change: "-3% from last week",
      trend: "down",
      icon: Package,
      color: "text-primary"
    },
    {
      title: "Active Warranties",
      value: "8,932",
      change: "+15% from last week",
      trend: "up",
      icon: Shield,
      color: "text-automotive-steel"
    }
  ];

  // Mock data - In real app would be fetched from API
  const recentClaims = [
    // Sample recent claims data - uncomment for testing UI
    /*
    {
      id: "WC-2024-156",
      serviceCenter: "EV Service Hà Nội",
      vin: "1HGBH41JXMN109186",
      issue: "Battery Cell Degradation",
      cost: "15,000,000 VND",
      status: "pending-review",
      priority: "high",
      date: "2024-01-15"
    },
    {
      id: "WC-2024-155",
      serviceCenter: "EV Service TP.HCM", 
      vin: "WVWZZZ1JZ3W386752",
      issue: "Motor Controller Replacement",
      cost: "8,500,000 VND",
      status: "approved",
      priority: "medium",
      date: "2024-01-14"
    },
    {
      id: "WC-2024-154",
      serviceCenter: "EV Service Đà Nẵng",
      vin: "1N4AL11D75C109151", 
      issue: "Charging Port Malfunction",
      cost: "3,200,000 VND",
      status: "in-validation",
      priority: "low",
      date: "2024-01-14"
    }
    */
  ];

  const lowStockItems = [
    { name: "Li-ion Battery Cell Type A", current: 45, minimum: 100, urgency: "critical" },
    { name: "Motor Controller Unit MCU-2024", current: 78, minimum: 150, urgency: "warning" },
    { name: "Charging Port Assembly CPA-V2", current: 234, minimum: 200, urgency: "normal" }
  ];

  // Mock data - In real app would be fetched from API
  const pendingClaims = [
    // Sample pending claims data - uncomment for testing UI
    /*
    {
      id: 'WC-2024-001',
      vehicleInfo: {
        vin: '1HGBH41JXMN109186',
        model: 'EV Model X Pro',
        year: '2023',
        customer: {
          name: 'Nguyễn Văn Minh',
          phone: '0901234567',
          email: 'minh.nguyen@email.com'
        }
      },
      issueCategory: 'Battery Performance',
      issueDescription: 'Pin sạc không đủ dung lượng theo thông số kỹ thuật, giảm 30% so với ban đầu.',
      diagnostic: {
        mainTechnician: 'Trần Minh Quân',
        assistantTechnicians: ['Lê Thị Hoa'],
        finalDiagnosis: 'Pin bị suy giảm dung lượng do lỗi của cell pin số 5 và 12. Cần thay thế module pin hoàn toàn.',
        images: ['image1.jpg', 'image2.jpg', 'image3.jpg'],
        reportDocument: 'diagnostic_report_001.pdf'
      },
      partsNeeded: [
        { partCode: 'BAT-XP-001', partName: 'Module pin chính EV Model X Pro', quantity: 1, estimatedCost: 15000000 },
        { partCode: 'CONN-BAT-05', partName: 'Connector pin 400V', quantity: 2, estimatedCost: 500000 }
      ],
      submittedDate: '2024-01-15',
      serviceCenter: 'Trung tâm dịch vụ Hà Nội',
      status: 'pending_approval'
    },
    {
      id: 'WC-2024-002',
      vehicleInfo: {
        vin: 'WVWZZZ1JZ3W386752',
        model: 'EV Compact Plus',
        year: '2022',
        customer: {
          name: 'Trần Thị Lan',
          phone: '0987654321',
          email: 'lan.tran@email.com'
        }
      },
      issueCategory: 'Motor Controller',
      issueDescription: 'Động cơ bị giật, mất lực khi tăng tốc đột ngột.',
      diagnostic: {
        mainTechnician: 'Phạm Văn Nam',
        assistantTechnicians: [],
        finalDiagnosis: 'IC điều khiển động cơ bị lỗi, cần thay thế bộ điều khiển hoàn toàn.',
        images: ['image4.jpg', 'image5.jpg'],
        reportDocument: 'diagnostic_report_002.pdf'
      },
      partsNeeded: [
        { partCode: 'CTRL-CP-001', partName: 'Bộ điều khiển động cơ EV Compact', quantity: 1, estimatedCost: 8000000 }
      ],
      submittedDate: '2024-01-16',
      serviceCenter: 'Trung tâm dịch vụ TP.HCM',
      status: 'pending_approval'
    }
    */
  ];

  const handleClaimApproval = (claimId: string) => {
    const claim = pendingClaims.find(c => c.id === claimId);
    if (claim) {
      setSelectedClaim(claim);
      setShowApprovalModal(true);
    }
  };

  const handleApprovalDecision = (decision: 'approved' | 'rejected', data: any) => {
    console.log('Approval decision:', decision, data);
    setShowApprovalModal(false);
    setSelectedClaim(null);
    // In real app, update the claim status in backend
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "pending-review": { variant: "pending" as const, icon: Clock, text: "Chờ xem xét" },
      "in-validation": { variant: "warning" as const, icon: AlertTriangle, text: "Đang xác thực" },
      approved: { variant: "approved" as const, icon: CheckCircle, text: "Đã phê duyệt" },
      rejected: { variant: "rejected" as const, icon: XCircle, text: "Từ chối" },
      completed: { variant: "success" as const, icon: CheckCircle, text: "Hoàn thành" }
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
      high: { variant: "destructive" as const, text: "Cao" },
      medium: { variant: "warning" as const, text: "Trung bình" },
      low: { variant: "secondary" as const, text: "Thấp" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getStockBadge = (urgency: string) => {
    const urgencyConfig = {
      critical: { variant: "destructive" as const, text: "Khẩn cấp" },
      warning: { variant: "warning" as const, text: "Cảnh báo" },
      normal: { variant: "success" as const, text: "Bình thường" }
    };

    const config = urgencyConfig[urgency as keyof typeof urgencyConfig];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-elegant">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">EVM Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Xin chào, {user?.name} ({user?.role === 'evm_admin' ? 'Admin' : 'Staff'}) - {user?.department}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </Button>
              <Button variant="outline" onClick={() => setShowDashboardStats(true)}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <Button variant="outline" onClick={() => setShowRecallManagement(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Recalls
              </Button>
              <Button variant="gradient" onClick={() => setShowCreateCampaign(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6">
        {/* Statistics Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
            return (
              <Card key={stat.title} className="shadow-elegant">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-xs flex items-center ${stat.trend === "up" ? "text-success" : "text-destructive"
                        }`}>
                        <TrendIcon className="mr-1 h-3 w-3" />
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

        {/* Main Content */}
        <Tabs defaultValue="claims" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="claims">Claim Management</TabsTrigger>
            <TabsTrigger value="parts">Parts & Inventory</TabsTrigger>
            <TabsTrigger value="policies">Warranty Policies</TabsTrigger>
            <TabsTrigger value="analytics">Reports & Analytics</TabsTrigger>
            <TabsTrigger value="campaigns">Service Campaigns</TabsTrigger>
            <TabsTrigger value="recalls">Recalls & Safety</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle>Yêu cầu bảo hành chờ duyệt</CardTitle>
                    <CardDescription>
                      Xem xét và phê duyệt yêu cầu bảo hành từ trung tâm dịch vụ
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pendingClaims.map((claim) => (
                      <Card key={claim.id} className="border-orange-200">
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">#{claim.id}</h4>
                              <p className="text-sm text-muted-foreground">
                                {claim.vehicleInfo.model} ({claim.vehicleInfo.year}) - {claim.vehicleInfo.customer.name}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              <Clock className="h-3 w-3 mr-1" />
                              Chờ duyệt
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm">
                            <p><strong>Sự cố:</strong> {claim.issueCategory}</p>
                            <p><strong>Trung tâm:</strong> {claim.serviceCenter}</p>
                            <p><strong>Ngày gửi:</strong> {new Date(claim.submittedDate).toLocaleDateString('vi-VN')}</p>
                            <p><strong>Chi phí ước tính:</strong> {
                              claim.partsNeeded.reduce((sum, part) => sum + (part.estimatedCost * part.quantity), 0).toLocaleString('vi-VN')
                            }đ</p>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleClaimApproval(claim.id)}
                              className="flex-1"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Xem chi tiết & Duyệt
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {pendingClaims.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Không có yêu cầu nào chờ duyệt</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle>Thống kê duyệt yêu cầu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Tỷ lệ phê duyệt</span>
                          <span className="font-medium">87.3%</span>
                        </div>
                        <div className="mt-1 h-2 bg-muted rounded-full">
                          <div className="h-2 bg-success rounded-full" style={{ width: "87.3%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Thời gian xử lý TB</span>
                          <span className="font-medium">2.4 ngày</span>
                        </div>
                        <div className="mt-1 h-2 bg-muted rounded-full">
                          <div className="h-2 bg-primary rounded-full" style={{ width: "60%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Chi phí tháng này</span>
                          <span className="font-medium">245M VND</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parts" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="shadow-elegant">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Parts Inventory</CardTitle>
                        <CardDescription>Manage parts stock and supply chain</CardDescription>
                      </div>
                      <Button variant="gradient" onClick={() => setShowPartsManagement(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Manage Parts
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {lowStockItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                              <Package className="h-5 w-5 text-accent-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Current: {item.current} | Min: {item.minimum}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getStockBadge(item.urgency)}
                            <Button variant="outline" size="sm">
                              <Truck className="mr-1 h-4 w-4" />
                              Restock
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="shadow-elegant">
                  <CardHeader>
                    <CardTitle>Supply Chain Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <div>
                          <p className="text-sm font-medium">Critical Stock Low</p>
                          <p className="text-xs text-muted-foreground">3 items need immediate restocking</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-warning/10 rounded-lg">
                        <Clock className="h-4 w-4 text-warning" />
                        <div>
                          <p className="text-sm font-medium">Delayed Shipment</p>
                          <p className="text-xs text-muted-foreground">Motor units delivery delayed by 2 days</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="policies" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Warranty Policy Management</CardTitle>
                <CardDescription>Configure warranty terms and conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Battery Warranty</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">8 years or 160,000 km</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPolicyType('battery');
                          setShowConfigurePolicy(true);
                        }}
                      >
                        <Settings className="mr-1 h-4 w-4" />
                        Configure
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Motor Warranty</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">5 years or 100,000 km</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPolicyType('motor');
                          setShowConfigurePolicy(true);
                        }}
                      >
                        <Settings className="mr-1 h-4 w-4" />
                        Configure
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Electronics Warranty</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">3 years or 60,000 km</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPolicyType('electronics');
                          setShowConfigurePolicy(true);
                        }}
                      >
                        <Settings className="mr-1 h-4 w-4" />
                        Configure
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
                <CardDescription>Failure analysis and predictive insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Failure Rate by Component</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Battery System</span>
                        <span className="font-medium">12.3%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-2 bg-destructive rounded-full" style={{ width: "12.3%" }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Motor Controller</span>
                        <span className="font-medium">8.7%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-2 bg-warning rounded-full" style={{ width: "8.7%" }} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Charging System</span>
                        <span className="font-medium">5.2%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full">
                        <div className="h-2 bg-success rounded-full" style={{ width: "5.2%" }} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Regional Performance</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Northern Region</span>
                        <Badge variant="success">Excellent</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Central Region</span>
                        <Badge variant="warning">Good</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Southern Region</span>
                        <Badge variant="success">Excellent</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-6">
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle>Service Campaign Management</CardTitle>
                <CardDescription>Create and manage recall campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="gradient" className="mb-6">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Campaign
                </Button>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <h3 className="font-semibold">Software Update Campaign 2024-Q1</h3>
                      <p className="text-sm text-muted-foreground">
                        Battery management system update for 2022-2023 models
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Affected vehicles: 2,450 units
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="warning">Active</Badge>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showConfigurePolicy && (
        <ConfigureWarrantyPolicy
          policyType={selectedPolicyType}
          onClose={() => {
            setShowConfigurePolicy(false);
            setSelectedPolicyType('');
          }}
        />
      )}
      {showAddPart && (
        <AddPartInventory
          onClose={() => setShowAddPart(false)}
        />
      )}
      {showCreateCampaign && (
        <CreateCampaign
          onClose={() => setShowCreateCampaign(false)}
        />
      )}

      {showApprovalModal && selectedClaim && (
        <ManufacturerApproval
          claimData={selectedClaim}
          onApproval={handleApprovalDecision}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedClaim(null);
          }}
        />
      )}
    </div>
  );
};

export default ManufacturerDashboard;