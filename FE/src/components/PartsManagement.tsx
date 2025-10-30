import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Truck,
  Eye,
  Download
} from 'lucide-react';

interface Part {
  id: string;
  partCode: string;
  partName: string;
  category: string;
  compatibleModels: string[];
  description: string;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  supplier: string;
  leadTime: number; // days
  status: 'active' | 'discontinued' | 'development';
  lastUpdated: string;
  stockMovements: StockMovement[];
}

interface StockMovement {
  id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  reference: string;
}

interface PartsManagementProps {
  onClose: () => void;
}

const PartsManagement = ({ onClose }: PartsManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    partCode: '',
    partName: '',
    category: '',
    compatibleModels: [] as string[],
    description: '',
    unitPrice: '',
    currentStock: '',
    minStock: '',
    maxStock: '',
    supplier: '',
    leadTime: ''
  });

  // Mock data
  const parts: Part[] = [
    {
      id: 'P001',
      partCode: 'BAT-XP-001',
      partName: 'Battery Module Main - EV Model X Pro',
      category: 'Battery System',
      compatibleModels: ['EV Model X Pro 2023', 'EV Model X Pro 2024'],
      description: 'High-capacity lithium-ion battery module for main power system',
      unitPrice: 15000000,
      currentStock: 45,
      minStock: 20,
      maxStock: 100,
      supplier: 'BatteryTech Vietnam',
      leadTime: 14,
      status: 'active',
      lastUpdated: '2024-01-15',
      stockMovements: [
        { id: 'SM001', type: 'out', quantity: 5, reason: 'Warranty claim', date: '2024-01-15', reference: 'WC-2024-001' },
        { id: 'SM002', type: 'in', quantity: 20, reason: 'Stock replenishment', date: '2024-01-10', reference: 'PO-2024-015' }
      ]
    },
    {
      id: 'P002',
      partCode: 'CTRL-CP-001',
      partName: 'Motor Controller Unit - EV Compact',
      category: 'Motor Control',
      compatibleModels: ['EV Compact Plus 2022', 'EV Compact Plus 2023'],
      description: 'Advanced motor control unit with regenerative braking',
      unitPrice: 8000000,
      currentStock: 78,
      minStock: 30,
      maxStock: 150,
      supplier: 'MotorControl Systems',
      leadTime: 10,
      status: 'active',
      lastUpdated: '2024-01-14',
      stockMovements: [
        { id: 'SM003', type: 'out', quantity: 3, reason: 'Warranty claim', date: '2024-01-14', reference: 'WC-2024-002' },
        { id: 'SM004', type: 'in', quantity: 50, reason: 'Stock replenishment', date: '2024-01-05', reference: 'PO-2024-012' }
      ]
    },
    {
      id: 'P003',
      partCode: 'CHG-PORT-V2',
      partName: 'Charging Port Assembly V2',
      category: 'Charging System',
      compatibleModels: ['EV Model X Pro 2023', 'EV Compact Plus 2023', 'EV Sport Series 2023'],
      description: 'Universal fast-charging port with weather sealing',
      unitPrice: 3200000,
      currentStock: 234,
      minStock: 50,
      maxStock: 300,
      supplier: 'ChargeTech International',
      leadTime: 7,
      status: 'active',
      lastUpdated: '2024-01-16',
      stockMovements: [
        { id: 'SM005', type: 'out', quantity: 12, reason: 'Preventive maintenance', date: '2024-01-12', reference: 'PM-2024-008' }
      ]
    },
    {
      id: 'P004',
      partCode: 'DISP-UNIT-HD',
      partName: 'HD Display Unit 12.3 inch',
      category: 'Electronics',
      compatibleModels: ['EV Model X Pro 2024', 'EV Sport Series 2023'],
      description: 'High-definition touchscreen display unit',
      unitPrice: 5500000,
      currentStock: 15,
      minStock: 25,
      maxStock: 80,
      supplier: 'DisplayTech Corp',
      leadTime: 21,
      status: 'active',
      lastUpdated: '2024-01-13',
      stockMovements: [
        { id: 'SM006', type: 'out', quantity: 8, reason: 'Warranty claim', date: '2024-01-10', reference: 'WC-2024-005' }
      ]
    }
  ];

  const categories = [
    'Battery System',
    'Motor Control', 
    'Charging System',
    'Electronics',
    'Cooling System',
    'Safety Systems',
    'Body & Interior',
    'Suspension',
    'Braking System'
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

  const filteredParts = parts.filter(part => {
    const matchesSearch = part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         part.partCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || part.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const lowStockParts = parts.filter(part => part.currentStock <= part.minStock);

  const handleAddPart = () => {
    if (!formData.partCode || !formData.partName || !formData.category) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc.",
        variant: "destructive"
      });
      return;
    }

    // In real app, submit to API
    console.log('Adding part:', formData);
    
    toast({
      title: "Thêm phụ tùng thành công",
      description: `Phụ tùng ${formData.partName} đã được thêm vào hệ thống.`
    });

    setShowAddForm(false);
    resetForm();
  };

  const handleEditPart = () => {
    if (!selectedPart) return;

    // In real app, submit to API
    console.log('Updating part:', selectedPart.id, formData);
    
    toast({
      title: "Cập nhật thành công",
      description: `Thông tin phụ tùng đã được cập nhật.`
    });

    setShowEditForm(false);
    setSelectedPart(null);
    resetForm();
  };

  const handleDeletePart = (partId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phụ tùng này?')) {
      // In real app, call API
      console.log('Deleting part:', partId);
      
      toast({
        title: "Đã xóa phụ tùng",
        description: "Phụ tùng đã được xóa khỏi hệ thống."
      });
    }
  };

  const resetForm = () => {
    setFormData({
      partCode: '',
      partName: '',
      category: '',
      compatibleModels: [],
      description: '',
      unitPrice: '',
      currentStock: '',
      minStock: '',
      maxStock: '',
      supplier: '',
      leadTime: ''
    });
  };

  const openEditForm = (part: Part) => {
    setSelectedPart(part);
    setFormData({
      partCode: part.partCode,
      partName: part.partName,
      category: part.category,
      compatibleModels: part.compatibleModels,
      description: part.description,
      unitPrice: part.unitPrice.toString(),
      currentStock: part.currentStock.toString(),
      minStock: part.minStock.toString(),
      maxStock: part.maxStock.toString(),
      supplier: part.supplier,
      leadTime: part.leadTime.toString()
    });
    setShowEditForm(true);
  };

  const getStockStatus = (part: Part) => {
    if (part.currentStock <= part.minStock) {
      return { status: 'low', color: 'destructive', icon: AlertTriangle, text: 'Thiếu hàng' };
    } else if (part.currentStock >= part.maxStock * 0.8) {
      return { status: 'high', color: 'success', icon: CheckCircle, text: 'Đầy đủ' };
    } else {
      return { status: 'normal', color: 'secondary', icon: Package, text: 'Bình thường' };
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const PartForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle>{isEdit ? 'Chỉnh sửa' : 'Thêm'} phụ tùng</CardTitle>
          <CardDescription>
            {isEdit ? 'Cập nhật thông tin phụ tùng' : 'Thêm phụ tùng mới vào kho'}
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="partCode">Mã phụ tùng *</Label>
              <Input
                id="partCode"
                placeholder="Ví dụ: BAT-XP-001"
                value={formData.partCode}
                onChange={(e) => setFormData(prev => ({ ...prev, partCode: e.target.value }))}
                disabled={isEdit}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục *</Label>
              <Select value={formData.category} onValueChange={(value) => 
                setFormData(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partName">Tên phụ tùng *</Label>
            <Input
              id="partName"
              placeholder="Nhập tên phụ tùng..."
              value={formData.partName}
              onChange={(e) => setFormData(prev => ({ ...prev, partName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Dòng xe tương thích</Label>
            <div className="grid grid-cols-2 gap-2">
              {vehicleModels.map((model) => (
                <div key={model} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.compatibleModels.includes(model)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          compatibleModels: [...prev.compatibleModels, model]
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          compatibleModels: prev.compatibleModels.filter(m => m !== model)
                        }));
                      }
                    }}
                  />
                  <label className="text-sm">{model}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về phụ tùng..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Đơn giá (VND) *</Label>
              <Input
                id="unitPrice"
                type="number"
                placeholder="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Nhà cung cấp</Label>
              <Input
                id="supplier"
                placeholder="Tên nhà cung cấp"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentStock">Tồn kho hiện tại</Label>
              <Input
                id="currentStock"
                type="number"
                placeholder="0"
                value={formData.currentStock}
                onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Tồn kho tối thiểu</Label>
              <Input
                id="minStock"
                type="number"
                placeholder="0"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStock">Tồn kho tối đa</Label>
              <Input
                id="maxStock"
                type="number"
                placeholder="0"
                value={formData.maxStock}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStock: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadTime">Thời gian giao (ngày)</Label>
              <Input
                id="leadTime"
                type="number"
                placeholder="0"
                value={formData.leadTime}
                onChange={(e) => setFormData(prev => ({ ...prev, leadTime: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>

        <div className="flex justify-between p-6 border-t">
          <Button variant="outline" onClick={() => {
            if (isEdit) {
              setShowEditForm(false);
            } else {
              setShowAddForm(false);
            }
            setSelectedPart(null);
            resetForm();
          }}>
            Hủy
          </Button>
          <Button onClick={isEdit ? handleEditPart : handleAddPart}>
            {isEdit ? 'Cập nhật' : 'Thêm phụ tùng'}
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Quản lý Phụ tùng & Kho
              </CardTitle>
              <CardDescription>
                Quản lý tồn kho, cập nhật giá và theo dõi cảnh báo thiếu hàng
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Đóng</Button>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm phụ tùng
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <Tabs defaultValue="inventory" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="inventory">Kho hàng</TabsTrigger>
              <TabsTrigger value="alerts">Cảnh báo thiếu</TabsTrigger>
              <TabsTrigger value="movements">Xuất nhập kho</TabsTrigger>
              <TabsTrigger value="analytics">Phân tích</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên hoặc mã phụ tùng..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Parts List */}
              <div className="space-y-4">
                {filteredParts.map((part) => {
                  const stockStatus = getStockStatus(part);
                  const StatusIcon = stockStatus.icon;
                  
                  return (
                    <Card key={part.id} className="border">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{part.partName}</h3>
                              <Badge variant="outline">{part.partCode}</Badge>
                              <Badge variant={stockStatus.color as React.ComponentProps<typeof Badge>['variant']}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {stockStatus.text}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">{part.description}</p>
                            
                            <div className="grid grid-cols-5 gap-4 text-sm">
                              <div>
                                <p className="font-medium">Danh mục</p>
                                <p className="text-muted-foreground">{part.category}</p>
                              </div>
                              <div>
                                <p className="font-medium">Tồn kho</p>
                                <p className="text-muted-foreground">{part.currentStock}/{part.maxStock}</p>
                              </div>
                              <div>
                                <p className="font-medium">Đơn giá</p>
                                <p className="text-muted-foreground">{formatCurrency(part.unitPrice)}</p>
                              </div>
                              <div>
                                <p className="font-medium">Nhà cung cấp</p>
                                <p className="text-muted-foreground">{part.supplier}</p>
                              </div>
                              <div>
                                <p className="font-medium">Lead time</p>
                                <p className="text-muted-foreground">{part.leadTime} ngày</p>
                              </div>
                            </div>

                            <div className="mt-3">
                              <p className="text-sm font-medium mb-1">Tương thích:</p>
                              <div className="flex flex-wrap gap-1">
                                {part.compatibleModels.map(model => (
                                  <Badge key={model} variant="secondary" className="text-xs">{model}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm" onClick={() => setSelectedPart(part)}>
                              <Eye className="h-3 w-3 mr-1" />
                              Chi tiết
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openEditForm(part)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Sửa
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeletePart(part.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Cảnh báo thiếu hàng ({lowStockParts.length} phụ tùng)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {lowStockParts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between p-4 border border-destructive/20 rounded">
                      <div>
                        <h3 className="font-medium">{part.partName}</h3>
                        <p className="text-sm text-muted-foreground">Mã: {part.partCode}</p>
                        <p className="text-sm">
                          <span className="text-destructive font-medium">Còn: {part.currentStock}</span> / 
                          Tối thiểu: {part.minStock}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Truck className="h-3 w-3 mr-1" />
                          Đặt hàng
                        </Button>
                        <Button size="sm">
                          Liên hệ NCC
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {lowStockParts.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                      <p className="text-muted-foreground">Tất cả phụ tùng đều đủ hàng</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="movements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử xuất nhập kho</CardTitle>
                  <CardDescription>Theo dõi tất cả hoạt động xuất nhập kho</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {parts.flatMap(part => 
                      part.stockMovements.map(movement => (
                        <div key={movement.id} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded ${
                              movement.type === 'in' ? 'bg-success/20' : 'bg-destructive/20'
                            }`}>
                              {movement.type === 'in' ? 
                                <TrendingUp className="h-4 w-4 text-success" /> :
                                <TrendingDown className="h-4 w-4 text-destructive" />
                              }
                            </div>
                            <div>
                              <p className="font-medium">{part.partName}</p>
                              <p className="text-sm text-muted-foreground">
                                {movement.type === 'in' ? 'Nhập' : 'Xuất'} {movement.quantity} cái - {movement.reason}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(movement.date).toLocaleDateString('vi-VN')} - Ref: {movement.reference}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{parts.length}</p>
                      <p className="text-sm text-muted-foreground">Tổng phụ tùng</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-destructive">{lowStockParts.length}</p>
                      <p className="text-sm text-muted-foreground">Thiếu hàng</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{formatCurrency(parts.reduce((sum, part) => sum + (part.unitPrice * part.currentStock), 0))}</p>
                      <p className="text-sm text-muted-foreground">Giá trị tồn kho</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold">15</p>
                      <p className="text-sm text-muted-foreground">Nhà cung cấp</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Modals */}
        {showAddForm && <PartForm />}
        {showEditForm && <PartForm isEdit={true} />}

        {/* Part Detail Modal */}
        {selectedPart && !showEditForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedPart.partName}</CardTitle>
                    <CardDescription>Mã: {selectedPart.partCode}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedPart(null)}>
                    Đóng
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Thông tin cơ bản</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Danh mục:</strong> {selectedPart.category}</p>
                      <p><strong>Mô tả:</strong> {selectedPart.description}</p>
                      <p><strong>Đơn giá:</strong> {formatCurrency(selectedPart.unitPrice)}</p>
                      <p><strong>Nhà cung cấp:</strong> {selectedPart.supplier}</p>
                      <p><strong>Thời gian giao:</strong> {selectedPart.leadTime} ngày</p>
                      <p><strong>Cập nhật lần cuối:</strong> {new Date(selectedPart.lastUpdated).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Tồn kho</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Hiện tại:</strong> {selectedPart.currentStock}</p>
                      <p><strong>Tối thiểu:</strong> {selectedPart.minStock}</p>
                      <p><strong>Tối đa:</strong> {selectedPart.maxStock}</p>
                      <p><strong>Giá trị tồn kho:</strong> {formatCurrency(selectedPart.unitPrice * selectedPart.currentStock)}</p>
                      <div className="mt-3">
                        <p className="font-medium mb-1">Mức tồn kho:</p>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(selectedPart.currentStock / selectedPart.maxStock) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dòng xe tương thích</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPart.compatibleModels.map((model) => (
                      <Badge key={model} variant="outline">{model}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Lịch sử xuất nhập kho gần đây</h4>
                  <div className="space-y-2">
                    {selectedPart.stockMovements.map((movement) => (
                      <div key={movement.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded ${
                            movement.type === 'in' ? 'bg-success/20' : 'bg-destructive/20'
                          }`}>
                            {movement.type === 'in' ? 
                              <TrendingUp className="h-3 w-3 text-success" /> :
                              <TrendingDown className="h-3 w-3 text-destructive" />
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {movement.type === 'in' ? 'Nhập' : 'Xuất'} {movement.quantity} cái
                            </p>
                            <p className="text-xs text-muted-foreground">{movement.reason}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>{new Date(movement.date).toLocaleDateString('vi-VN')}</p>
                          <p>Ref: {movement.reference}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => openEditForm(selectedPart)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Xuất báo cáo
                  </Button>
                  <Button variant="outline">
                    <Truck className="h-4 w-4 mr-2" />
                    Đặt hàng
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PartsManagement;