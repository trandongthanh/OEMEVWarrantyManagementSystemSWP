import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  AlertTriangle, 
  Plus, 
  Eye, 
  Send, 
  Users, 
  Calendar, 
  CheckCircle, 
  Clock,
  FileText,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';

interface Recall {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedModels: string[];
  affectedVins: string[];
  issueDate: string;
  deadline: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  serviceInstructions: string;
  estimatedVehicles: number;
  completedCount: number;
  notificationsSent: number;
  estimatedCost: number;
  safetyRisk: string;
  correctiveAction: string;
}

interface RecallManagementProps {
  onClose: () => void;
}

const RecallManagement = ({ onClose }: RecallManagementProps) => {
  const [activeTab, setActiveTab] = useState('list');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRecall, setSelectedRecall] = useState<Recall | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium' as Recall['severity'],
    affectedModels: [] as string[],
    vinPattern: '',
    deadline: '',
    safetyRisk: '',
    correctiveAction: '',
    serviceInstructions: '',
    estimatedCost: ''
  });

  // Mock data
  const recalls: Recall[] = [
    {
      id: 'RCL-2024-001',
      title: 'Battery Thermal Management System Recall',
      description: 'Potential overheating in battery thermal management system could lead to fire risk',
      severity: 'critical',
      affectedModels: ['EV Model X Pro 2023', 'EV Model X Pro 2024'],
      affectedVins: ['1HGBH41JXMN109186', 'WVWZZZ1JZ3W386752'],
      issueDate: '2024-01-15',
      deadline: '2024-03-15',
      status: 'active',
      serviceInstructions: 'Replace battery thermal management control unit and update software to version 2.1.4',
      estimatedVehicles: 15420,
      completedCount: 8930,
      notificationsSent: 15420,
      estimatedCost: 2850000000,
      safetyRisk: 'Fire hazard due to overheating - immediate action required',
      correctiveAction: 'Hardware replacement and software update'
    },
    {
      id: 'RCL-2024-002',
      title: 'Motor Controller Software Update',
      description: 'Software bug causing unexpected acceleration behavior',
      severity: 'high',
      affectedModels: ['EV Compact Plus 2022', 'EV Sport Series 2023'],
      affectedVins: ['1N4AL11D75C109151'],
      issueDate: '2024-01-20',
      deadline: '2024-02-28',
      status: 'active',
      serviceInstructions: 'Update motor controller firmware to version 3.2.1',
      estimatedVehicles: 8750,
      completedCount: 2140,
      notificationsSent: 8750,
      estimatedCost: 175000000,
      safetyRisk: 'Potential loss of vehicle control',
      correctiveAction: 'Firmware update and calibration'
    },
    {
      id: 'RCL-2023-045',
      title: 'Charging Port Safety Inspection',
      description: 'Routine safety inspection for charging port assembly',
      severity: 'medium',
      affectedModels: ['EV City Mini 2022'],
      affectedVins: [],
      issueDate: '2023-12-01',
      deadline: '2024-06-01',
      status: 'completed',
      serviceInstructions: 'Inspect charging port for wear and replace if necessary',
      estimatedVehicles: 3200,
      completedCount: 3200,
      notificationsSent: 3200,
      estimatedCost: 96000000,
      safetyRisk: 'Low - preventive measure',
      correctiveAction: 'Inspection and conditional replacement'
    }
  ];

  const vehicleModels = [
    'EV Model X Pro 2024',
    'EV Model X Pro 2023', 
    'EV Compact Plus 2023',
    'EV Compact Plus 2022',
    'EV Sport Series 2023',
    'EV Sport Series 2022',
    'EV City Mini 2023',
    'EV City Mini 2022'
  ];

  const handleCreateRecall = () => {
    if (!formData.title || !formData.description || !formData.deadline) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc.",
        variant: "destructive"
      });
      return;
    }

    // In real app, submit to API
    console.log('Creating recall:', formData);
    
    toast({
      title: "Tạo thu hồi thành công",
      description: `Thu hồi "${formData.title}" đã được tạo và sẽ được gửi đến tất cả trung tâm dịch vụ.`
    });

    setShowCreateForm(false);
    setFormData({
      title: '',
      description: '',
      severity: 'medium',
      affectedModels: [],
      vinPattern: '',
      deadline: '',
      safetyRisk: '',
      correctiveAction: '',
      serviceInstructions: '',
      estimatedCost: ''
    });
  };

  const handleModelToggle = (model: string) => {
    setFormData(prev => ({
      ...prev,
      affectedModels: prev.affectedModels.includes(model)
        ? prev.affectedModels.filter(m => m !== model)
        : [...prev.affectedModels, model]
    }));
  };

  const getSeverityBadge = (severity: Recall['severity']) => {
    const configs = {
      critical: { variant: 'destructive' as const, text: 'Khẩn cấp', icon: AlertTriangle },
      high: { variant: 'destructive' as const, text: 'Cao', icon: AlertTriangle },
      medium: { variant: 'warning' as const, text: 'Trung bình', icon: Clock },
      low: { variant: 'secondary' as const, text: 'Thấp', icon: CheckCircle }
    };
    const config = configs[severity];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const getStatusBadge = (status: Recall['status']) => {
    const configs = {
      draft: { variant: 'secondary' as const, text: 'Nháp' },
      active: { variant: 'warning' as const, text: 'Đang thực hiện' },
      completed: { variant: 'default' as const, text: 'Hoàn thành' },
      cancelled: { variant: 'destructive' as const, text: 'Đã hủy' }
    };
    const config = configs[status];
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (showCreateForm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Tạo thông báo thu hồi mới
            </CardTitle>
            <CardDescription>
              Tạo thông báo thu hồi cho xe có lỗi kỹ thuật hoặc vấn đề an toàn
            </CardDescription>
          </CardHeader>

          <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề thu hồi *</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề thu hồi..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Mức độ nghiêm trọng *</Label>
                <Select value={formData.severity} onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, severity: value as Recall['severity'] }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Khẩn cấp - Nguy hiểm cao</SelectItem>
                    <SelectItem value="high">Cao - Cần xử lý ngay</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="low">Thấp - Không gấp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả vấn đề *</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết vấn đề kỹ thuật và rủi ro..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Dòng xe bị ảnh hưởng *</Label>
              <div className="grid grid-cols-2 gap-2">
                {vehicleModels.map((model) => (
                  <div key={model} className="flex items-center space-x-2">
                    <Checkbox
                      checked={formData.affectedModels.includes(model)}
                      onCheckedChange={() => handleModelToggle(model)}
                    />
                    <label className="text-sm">{model}</label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vinPattern">Pattern VIN (tùy chọn)</Label>
                <Input
                  id="vinPattern"
                  placeholder="Ví dụ: 1HGBH41JXMN*"
                  value={formData.vinPattern}
                  onChange={(e) => setFormData(prev => ({ ...prev, vinPattern: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Hạn chót thực hiện *</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="safetyRisk">Rủi ro an toàn</Label>
              <Textarea
                id="safetyRisk"
                placeholder="Mô tả rủi ro an toàn và tác động tiềm ẩn..."
                value={formData.safetyRisk}
                onChange={(e) => setFormData(prev => ({ ...prev, safetyRisk: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="correctiveAction">Biện pháp khắc phục</Label>
              <Textarea
                id="correctiveAction"
                placeholder="Mô tả biện pháp khắc phục..."
                value={formData.correctiveAction}
                onChange={(e) => setFormData(prev => ({ ...prev, correctiveAction: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceInstructions">Hướng dẫn kỹ thuật</Label>
              <Textarea
                id="serviceInstructions"
                placeholder="Hướng dẫn chi tiết cho kỹ thuật viên..."
                value={formData.serviceInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceInstructions: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Chi phí ước tính (VND)</Label>
              <Input
                id="estimatedCost"
                type="number"
                placeholder="0"
                value={formData.estimatedCost}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
              />
            </div>
          </CardContent>

          <div className="flex justify-between p-6 border-t">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Hủy
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary">Lưu nháp</Button>
              <Button onClick={handleCreateRecall} className="bg-destructive hover:bg-destructive/90">
                <Send className="h-4 w-4 mr-2" />
                Tạo & Gửi thu hồi
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Quản lý Thu hồi & Recall
              </CardTitle>
              <CardDescription>
                Quản lý thông báo thu hồi bắt buộc và chiến dịch bảo dưỡng
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Đóng</Button>
              <Button onClick={() => setShowCreateForm(true)} className="bg-destructive hover:bg-destructive/90">
                <Plus className="h-4 w-4 mr-2" />
                Tạo thu hồi mới
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="list">Danh sách thu hồi</TabsTrigger>
              <TabsTrigger value="active">Đang thực hiện</TabsTrigger>
              <TabsTrigger value="completed">Đã hoàn thành</TabsTrigger>
              <TabsTrigger value="statistics">Thống kê</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
              {recalls.map((recall) => (
                <Card key={recall.id} className="border-l-4 border-l-destructive">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{recall.title}</h3>
                          {getSeverityBadge(recall.severity)}
                          {getStatusBadge(recall.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{recall.description}</p>
                        <p className="text-xs text-muted-foreground">#{recall.id} - Phát hành: {new Date(recall.issueDate).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedRecall(recall)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Chi tiết
                      </Button>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Xe ảnh hưởng</p>
                        <p className="text-muted-foreground">{recall.estimatedVehicles.toLocaleString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="font-medium">Đã hoàn thành</p>
                        <p className="text-muted-foreground">{recall.completedCount.toLocaleString('vi-VN')} ({Math.round(recall.completedCount / recall.estimatedVehicles * 100)}%)</p>
                      </div>
                      <div>
                        <p className="font-medium">Hạn chót</p>
                        <p className="text-muted-foreground">{new Date(recall.deadline).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <div>
                        <p className="font-medium">Chi phí ước tính</p>
                        <p className="text-muted-foreground">{formatCurrency(recall.estimatedCost)}</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium mb-1">Tiến độ hoàn thành:</p>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(recall.completedCount / recall.estimatedVehicles) * 100}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {recalls.filter(r => r.status === 'active').map((recall) => (
                <Card key={recall.id} className="border-l-4 border-l-warning">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{recall.title}</h3>
                          {getSeverityBadge(recall.severity)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{recall.description}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="font-medium">Tiến độ</p>
                            <p className="text-muted-foreground">{recall.completedCount}/{recall.estimatedVehicles} xe</p>
                          </div>
                          <div>
                            <p className="font-medium">Thông báo đã gửi</p>
                            <p className="text-muted-foreground">{recall.notificationsSent.toLocaleString('vi-VN')}</p>
                          </div>
                          <div>
                            <p className="font-medium">Thời gian còn lại</p>
                            <p className="text-muted-foreground">
                              {Math.ceil((new Date(recall.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} ngày
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Mail className="h-3 w-3 mr-1" />
                          Gửi nhắc nhở
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedRecall(recall)}>
                          <Eye className="h-3 w-3 mr-1" />
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {recalls.filter(r => r.status === 'completed').map((recall) => (
                <Card key={recall.id} className="border-l-4 border-l-success">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{recall.title}</h3>
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Hoàn thành
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{recall.description}</p>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                          <div>
                            <p className="font-medium">Hoàn thành</p>
                            <p className="text-success">100% ({recall.completedCount.toLocaleString('vi-VN')} xe)</p>
                          </div>
                          <div>
                            <p className="font-medium">Chi phí thực tế</p>
                            <p className="text-muted-foreground">{formatCurrency(recall.estimatedCost)}</p>
                          </div>
                          <div>
                            <p className="font-medium">Hoàn thành trước hạn</p>
                            <p className="text-success">15 ngày</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" onClick={() => setSelectedRecall(recall)}>
                        <FileText className="h-3 w-3 mr-1" />
                        Báo cáo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="statistics" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-destructive">3</p>
                      <p className="text-sm text-muted-foreground">Thu hồi khẩn cấp</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-warning">2</p>
                      <p className="text-sm text-muted-foreground">Đang thực hiện</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">15</p>
                      <p className="text-sm text-muted-foreground">Hoàn thành</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">27,370</p>
                      <p className="text-sm text-muted-foreground">Xe được thu hồi</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Hiệu quả thu hồi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Tỷ lệ hoàn thành đúng hạn</span>
                        <span className="font-medium">92.3%</span>
                      </div>
                      <div className="mt-1 h-2 bg-muted rounded-full">
                        <div className="h-2 bg-success rounded-full" style={{ width: "92.3%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Thời gian phản hồi trung bình</span>
                        <span className="font-medium">3.2 ngày</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Chi phí thu hồi năm nay</span>
                        <span className="font-medium">{formatCurrency(3200000000)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Detail Modal */}
          {selectedRecall && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getSeverityBadge(selectedRecall.severity)}
                        {selectedRecall.title}
                      </CardTitle>
                      <CardDescription>#{selectedRecall.id}</CardDescription>
                    </div>
                    <Button variant="outline" onClick={() => setSelectedRecall(null)}>
                      Đóng
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">Thông tin thu hồi</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Mô tả:</strong> {selectedRecall.description}</p>
                        <p><strong>Rủi ro an toàn:</strong> {selectedRecall.safetyRisk}</p>
                        <p><strong>Biện pháp khắc phục:</strong> {selectedRecall.correctiveAction}</p>
                        <p><strong>Ngày phát hành:</strong> {new Date(selectedRecall.issueDate).toLocaleDateString('vi-VN')}</p>
                        <p><strong>Hạn chót:</strong> {new Date(selectedRecall.deadline).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Thống kê tiến độ</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Xe ảnh hưởng:</strong> {selectedRecall.estimatedVehicles.toLocaleString('vi-VN')}</p>
                        <p><strong>Đã hoàn thành:</strong> {selectedRecall.completedCount.toLocaleString('vi-VN')}</p>
                        <p><strong>Tỷ lệ hoàn thành:</strong> {Math.round(selectedRecall.completedCount / selectedRecall.estimatedVehicles * 100)}%</p>
                        <p><strong>Thông báo đã gửi:</strong> {selectedRecall.notificationsSent.toLocaleString('vi-VN')}</p>
                        <p><strong>Chi phí ước tính:</strong> {formatCurrency(selectedRecall.estimatedCost)}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Dòng xe bị ảnh hưởng</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecall.affectedModels.map((model) => (
                        <Badge key={model} variant="outline">{model}</Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Hướng dẫn kỹ thuật</h4>
                    <div className="bg-muted p-4 rounded text-sm">
                      {selectedRecall.serviceInstructions}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Gửi nhắc nhở
                    </Button>
                    <Button variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      Liên hệ trung tâm
                    </Button>
                    <Button variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Xuất báo cáo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecallManagement;