import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WarrantyClaim {
  id: string;
  requestCode: string;
  vin: string;
  model: string;
  purchaseDate: string;
  serviceCenter: string;
  submissionDate: string;
  status: 'Chờ duyệt' | 'Đồng ý' | 'Từ chối';
  estimatedCost: number;
  priority: 'Thấp' | 'Trung bình' | 'Cao' | 'Khẩn cấp';
  issueType: string;
  customerName: string;
  customerPhone: string;
  mileage: number;
}

interface WarrantyHistory {
  id: string;
  date: string;
  serviceCenter: string;
  issueType: string;
  cost: number;
  status: string;
}

interface TechnicalReport {
  id: string;
  technicianName: string;
  diagnosis: string;
  recommendedAction: string;
  estimatedCost: number;
  urgency: string;
  images: string[];
  reportDate: string;
}

interface Part {
  id: string;
  name: string;
  partNumber: string;
  unitPrice: number;
  availableQuantity: number;
  category: string;
}

const WarrantyClaimDetail: React.FC<{ claimId?: string }> = ({ claimId = '1' }) => {
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [warrantyHistory, setWarrantyHistory] = useState<WarrantyHistory[]>([]);
  const [technicalReport, setTechnicalReport] = useState<TechnicalReport | null>(null);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [selectedParts, setSelectedParts] = useState<{partId: string, quantity: number}[]>([]);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Mock data
  useEffect(() => {
    const mockClaim: WarrantyClaim = {
      id: claimId,
      requestCode: 'WR-2025-001',
      vin: '1HGBH41JXMN109186',
      model: 'Model X',
      purchaseDate: '2023-01-15',
      serviceCenter: 'SC Hà Nội',
      submissionDate: '2025-09-25',
      status: 'Chờ duyệt',
      estimatedCost: 15000000,
      priority: 'Cao',
      issueType: 'Pin EV',
      customerName: 'Nguyễn Văn An',
      customerPhone: '0123456789',
      mileage: 25000
    };

    const mockWarrantyHistory: WarrantyHistory[] = [
      {
        id: '1',
        date: '2023-06-15',
        serviceCenter: 'SC Hà Nội',
        issueType: 'Thay dầu định kỳ',
        cost: 1200000,
        status: 'Hoàn thành'
      },
      {
        id: '2',
        date: '2023-12-20',
        serviceCenter: 'SC Hà Nội',
        issueType: 'Kiểm tra hệ thống phanh',
        cost: 800000,
        status: 'Hoàn thành'
      },
      {
        id: '3',
        date: '2024-05-10',
        serviceCenter: 'SC Hà Nội',
        issueType: 'Cập nhật phần mềm',
        cost: 0,
        status: 'Hoàn thành'
      }
    ];

    const mockTechnicalReport: TechnicalReport = {
      id: '1',
      technicianName: 'Trần Văn Bình - Kỹ thuật trưởng',
      diagnosis: 'Pin EV cho thấy dấu hiệu suy giảm dung lượng nghiêm trọng. Dung lượng hiện tại chỉ đạt 65% so với ban đầu. Có thể do lỗi từ nhà sản xuất hoặc điều kiện sử dụng khắc nghiệt.',
      recommendedAction: 'Thay thế hoàn toàn module pin EV. Kiểm tra hệ thống sạc và điều khiển nhiệt độ pin.',
      estimatedCost: 15000000,
      urgency: 'Cao - Ảnh hưởng đến an toàn vận hành',
      images: [
        '/images/battery-diagnostic-1.jpg',
        '/images/battery-diagnostic-2.jpg',
        '/images/battery-test-results.jpg'
      ],
      reportDate: '2025-09-25'
    };

    const mockAvailableParts: Part[] = [
      {
        id: '1',
        name: 'Module pin EV Model X',
        partNumber: 'BAT-MX-001',
        unitPrice: 12000000,
        availableQuantity: 5,
        category: 'Pin & Điện'
      },
      {
        id: '2',
        name: 'Cảm biến nhiệt độ pin',
        partNumber: 'SENS-TEMP-001',
        unitPrice: 800000,
        availableQuantity: 15,
        category: 'Cảm biến'
      },
      {
        id: '3',
        name: 'Dây cáp pin chính',
        partNumber: 'CABLE-BAT-001',
        unitPrice: 1500000,
        availableQuantity: 8,
        category: 'Cáp & Dây dẫn'
      },
      {
        id: '4',
        name: 'Bo mạch điều khiển pin',
        partNumber: 'PCB-BAT-CTRL',
        unitPrice: 2200000,
        availableQuantity: 3,
        category: 'Linh kiện điện tử'
      }
    ];

    setClaim(mockClaim);
    setWarrantyHistory(mockWarrantyHistory);
    setTechnicalReport(mockTechnicalReport);
    setAvailableParts(mockAvailableParts);
  }, [claimId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handlePartQuantityChange = (partId: string, quantity: number) => {
    const existingPartIndex = selectedParts.findIndex(p => p.partId === partId);
    if (existingPartIndex >= 0) {
      const newSelectedParts = [...selectedParts];
      if (quantity === 0) {
        newSelectedParts.splice(existingPartIndex, 1);
      } else {
        newSelectedParts[existingPartIndex].quantity = quantity;
      }
      setSelectedParts(newSelectedParts);
    } else if (quantity > 0) {
      setSelectedParts([...selectedParts, { partId, quantity }]);
    }
  };

  const getSelectedPartQuantity = (partId: string): number => {
    const selectedPart = selectedParts.find(p => p.partId === partId);
    return selectedPart ? selectedPart.quantity : 0;
  };

  const getTotalSelectedCost = (): number => {
    return selectedParts.reduce((total, selected) => {
      const part = availableParts.find(p => p.id === selected.partId);
      return total + (part ? part.unitPrice * selected.quantity : 0);
    }, 0);
  };

  const handleApprove = () => {
    setIsApproveDialogOpen(true);
  };

  const handleReject = () => {
    setIsRejectDialogOpen(true);
  };

  const confirmApproval = () => {
    console.log('Approved with parts:', selectedParts);
    setIsApproveDialogOpen(false);
    // Update claim status and send parts request
  };

  const confirmRejection = () => {
    console.log('Rejected with reason:', rejectReason);
    setIsRejectDialogOpen(false);
    setRejectReason('');
    // Update claim status
  };

  if (!claim || !technicalReport) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          ⬅️ Quay lại
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Chi tiết yêu cầu bảo hành</h1>
          <p className="text-gray-600 mt-1">Mã yêu cầu: {claim.requestCode}</p>
        </div>
        <Badge variant={claim.status === 'Chờ duyệt' ? 'secondary' : 'default'}>
          {claim.status}
        </Badge>
      </div>

      <Tabs defaultValue="vehicle-info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="vehicle-info">Thông tin xe</TabsTrigger>
          <TabsTrigger value="technical-report">Báo cáo kỹ thuật</TabsTrigger>
          <TabsTrigger value="parts-selection">Chọn phụ tùng</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicle-info" className="space-y-6">
          {/* Vehicle Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin xe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">VIN</label>
                    <p className="mt-1 font-mono text-sm">{claim.vin}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Model</label>
                    <p className="mt-1">{claim.model}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ngày mua</label>
                    <p className="mt-1">{new Date(claim.purchaseDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Số km đã đi</label>
                    <p className="mt-1">{claim.mileage.toLocaleString('vi-VN')} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thông tin khách hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tên khách hàng</label>
                    <p className="mt-1">{claim.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                    <p className="mt-1">{claim.customerPhone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Trung tâm dịch vụ</label>
                    <p className="mt-1">{claim.serviceCenter}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Ngày gửi yêu cầu</label>
                    <p className="mt-1">{new Date(claim.submissionDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Warranty History */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử bảo hành</CardTitle>
              <CardDescription>Các lần bảo hành trước đây của xe này</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Trung tâm</TableHead>
                    <TableHead>Loại vấn đề</TableHead>
                    <TableHead>Chi phí</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warrantyHistory.map((history) => (
                    <TableRow key={history.id}>
                      <TableCell>{new Date(history.date).toLocaleDateString('vi-VN')}</TableCell>
                      <TableCell>{history.serviceCenter}</TableCell>
                      <TableCell>{history.issueType}</TableCell>
                      <TableCell>{formatCurrency(history.cost)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{history.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical-report" className="space-y-6">
          {/* Technical Report */}
          <Card>
            <CardHeader>
              <CardTitle>Báo cáo kỹ thuật từ trung tâm dịch vụ</CardTitle>
              <CardDescription>
                Báo cáo chi tiết từ kỹ thuật viên - {technicalReport.reportDate}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Kỹ thuật viên phụ trách</label>
                <p className="mt-1 flex items-center gap-2">
                  👨‍🔧 {technicalReport.technicianName}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Chẩn đoán vấn đề</label>
                <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-800">{technicalReport.diagnosis}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Hành động được đề xuất</label>
                <div className="mt-1 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">{technicalReport.recommendedAction}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Mức độ khẩn cấp</label>
                  <p className="mt-1 text-red-600 font-medium">🚨 {technicalReport.urgency}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Ước tính chi phí</label>
                  <p className="mt-1 text-lg font-bold text-green-600">
                    {formatCurrency(technicalReport.estimatedCost)}
                  </p>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="text-sm font-medium text-gray-700">Hình ảnh chẩn đoán</label>
                <div className="mt-2 grid grid-cols-3 gap-4">
                  {technicalReport.images.map((image, index) => (
                    <div key={index} className="border rounded-lg p-4 text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-sm text-gray-600">Hình ảnh {index + 1}</p>
                      <p className="text-xs text-gray-500 mt-1">{image}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Decision Actions */}
          {claim.status === 'Chờ duyệt' && (
            <Card>
              <CardHeader>
                <CardTitle>Quyết định xét duyệt</CardTitle>
                <CardDescription>
                  Xem xét báo cáo và đưa ra quyết định về yêu cầu bảo hành
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    onClick={handleApprove}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    ✅ Đồng ý bảo hành
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleReject}
                    className="flex items-center gap-2"
                  >
                    ❌ Từ chối bảo hành
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="parts-selection" className="space-y-6">
          {/* Parts Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Chọn phụ tùng cần cấp</CardTitle>
              <CardDescription>
                Chọn các phụ tùng cần thiết để thực hiện bảo hành
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã phụ tùng</TableHead>
                    <TableHead>Tên phụ tùng</TableHead>
                    <TableHead>Danh mục</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Số lượng cần</TableHead>
                    <TableHead>Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableParts.map((part) => (
                    <TableRow key={part.id}>
                      <TableCell className="font-mono text-sm">{part.partNumber}</TableCell>
                      <TableCell>{part.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{part.category}</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(part.unitPrice)}</TableCell>
                      <TableCell>
                        <span className={part.availableQuantity < 5 ? 'text-red-600 font-medium' : 'text-green-600'}>
                          {part.availableQuantity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max={part.availableQuantity}
                          className="w-20"
                          value={getSelectedPartQuantity(part.id)}
                          onChange={(e) => handlePartQuantityChange(part.id, parseInt(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {formatCurrency(part.unitPrice * getSelectedPartQuantity(part.id))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Selected Parts Summary */}
          {selectedParts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt phụ tùng đã chọn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedParts.map((selected) => {
                    const part = availableParts.find(p => p.id === selected.partId);
                    return part ? (
                      <div key={selected.partId} className="flex justify-between items-center py-2 border-b">
                        <div>
                          <span className="font-medium">{part.name}</span>
                          <span className="text-sm text-gray-500 ml-2">x{selected.quantity}</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(part.unitPrice * selected.quantity)}
                        </span>
                      </div>
                    ) : null;
                  })}
                  <div className="flex justify-between items-center py-2 font-bold text-lg border-t-2">
                    <span>Tổng cộng:</span>
                    <span className="text-green-600">{formatCurrency(getTotalSelectedCost())}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối yêu cầu bảo hành</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do từ chối yêu cầu bảo hành này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Lý do từ chối</label>
              <Textarea 
                placeholder="Nhập lý do từ chối..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="destructive"
                onClick={confirmRejection}
                disabled={!rejectReason.trim()}
              >
                Xác nhận từ chối
              </Button>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đồng ý bảo hành</DialogTitle>
            <DialogDescription>
              Xác nhận đồng ý yêu cầu bảo hành và cấp phụ tùng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Mã yêu cầu:</strong> {claim.requestCode}
              </p>
              <p className="text-sm text-green-800">
                <strong>Tổng chi phí phụ tùng:</strong> {formatCurrency(getTotalSelectedCost())}
              </p>
              <p className="text-sm text-green-800">
                <strong>Số loại phụ tùng:</strong> {selectedParts.length} items
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={confirmApproval}
                className="bg-green-600 hover:bg-green-700"
              >
                Xác nhận đồng ý
              </Button>
              <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarrantyClaimDetail;