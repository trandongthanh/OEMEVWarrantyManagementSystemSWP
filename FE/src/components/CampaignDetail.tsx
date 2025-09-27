import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Campaign {
  id: string;
  code: string;
  name: string;
  description: string;
  vehicleType: string;
  startDate: string;
  endDate: string;
  vehicleCount: number;
  completionPercentage: number;
  status: 'Mới nhận' | 'Đang triển khai' | 'Hoàn thành';
  documents: Document[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadDate: string;
}

interface Customer {
  id: string;
  vin: string;
  customerName: string;
  phone: string;
  email: string;
  participationStatus: 'Chưa liên hệ' | 'Đã liên hệ' | 'Đã hẹn lịch' | 'Đã xử lý' | 'Từ chối';
  appointmentDate?: string;
  notes?: string;
  refusalReason?: string;
}

const CampaignDetail: React.FC<{ campaignId?: string }> = ({ campaignId = '1' }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);

  // Mock data
  useEffect(() => {
    const mockCampaign: Campaign = {
      id: campaignId,
      code: 'CAM-2025-001',
      name: 'Chiến dịch kiểm tra pin EV Model X',
      description: 'Chiến dịch kiểm tra và thay thế pin EV cho các xe Model X được sản xuất từ tháng 01/2023 đến 06/2023 do phát hiện vấn đề về tuổi thọ pin không đạt tiêu chuẩn.',
      vehicleType: 'Model X',
      startDate: '2025-01-15',
      endDate: '2025-03-15',
      vehicleCount: 150,
      completionPercentage: 65,
      status: 'Đang triển khai',
      documents: [
        {
          id: '1',
          name: 'Hướng dẫn kỹ thuật kiểm tra pin',
          type: 'PDF',
          url: '/documents/battery-check-guide.pdf',
          uploadDate: '2025-01-10'
        },
        {
          id: '2',
          name: 'Quy trình thay thế pin',
          type: 'PDF',
          url: '/documents/battery-replacement.pdf',
          uploadDate: '2025-01-10'
        }
      ]
    };

    const mockCustomers: Customer[] = [
      {
        id: '1',
        vin: '1HGBH41JXMN109186',
        customerName: 'Nguyễn Văn An',
        phone: '0123456789',
        email: 'nguyenvanan@email.com',
        participationStatus: 'Đã hẹn lịch',
        appointmentDate: '2025-02-15T10:00',
        notes: 'Khách hàng đã xác nhận lịch hẹn'
      },
      {
        id: '2',
        vin: '2HGBH41JXMN109187',
        customerName: 'Trần Thị Bình',
        phone: '0987654321',
        email: 'tranthibinh@email.com',
        participationStatus: 'Đã liên hệ',
        notes: 'Đang chờ khách hàng xác nhận thời gian'
      },
      {
        id: '3',
        vin: '3HGBH41JXMN109188',
        customerName: 'Lê Văn Cường',
        phone: '0369852147',
        email: 'levanprovince@email.com',
        participationStatus: 'Từ chối',
        refusalReason: 'Đã bán xe'
      },
      {
        id: '4',
        vin: '4HGBH41JXMN109189',
        customerName: 'Phạm Thị Dung',
        phone: '0147258369',
        email: 'phamthidung@email.com',
        participationStatus: 'Đã xử lý'
      }
    ];

    setCampaign(mockCampaign);
    setCustomers(mockCustomers);
  }, [campaignId]);

  const getStatusBadgeVariant = (status: Customer['participationStatus']) => {
    switch (status) {
      case 'Chưa liên hệ':
        return 'secondary';
      case 'Đã liên hệ':
        return 'default';
      case 'Đã hẹn lịch':
        return 'default';
      case 'Đã xử lý':
        return 'default';
      case 'Từ chối':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleContactCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsContactDialogOpen(true);
  };

  const handleScheduleAppointment = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsAppointmentDialogOpen(true);
  };

  const handleUpdateStatus = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsStatusUpdateDialogOpen(true);
  };

  if (!campaign) {
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
          <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
          <p className="text-gray-600 mt-1">Mã chiến dịch: {campaign.code}</p>
        </div>
        <Badge variant={campaign.status === 'Hoàn thành' ? 'default' : 'default'}>
          {campaign.status}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="customers">Danh sách khách hàng</TabsTrigger>
          <TabsTrigger value="documents">Tài liệu</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Campaign Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng số xe</CardTitle>
                <span className="text-2xl">🚗</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.vehicleCount}</div>
                <p className="text-xs text-muted-foreground">
                  xe cần xử lý
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiến độ</CardTitle>
                <span className="text-2xl">✅</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaign.completionPercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  hoàn thành
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thời hạn</CardTitle>
                <span className="text-2xl">⏰</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.ceil((new Date(campaign.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))}
                </div>
                <p className="text-xs text-muted-foreground">
                  ngày còn lại
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chi tiết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Loại xe áp dụng</label>
                  <p className="mt-1">{campaign.vehicleType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Thời gian thực hiện</label>
                  <p className="mt-1">{campaign.startDate} - {campaign.endDate}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mô tả chiến dịch</label>
                <p className="mt-1 text-gray-600">{campaign.description}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Chưa liên hệ', count: customers.filter(c => c.participationStatus === 'Chưa liên hệ').length, color: 'bg-gray-500' },
              { label: 'Đã liên hệ', count: customers.filter(c => c.participationStatus === 'Đã liên hệ').length, color: 'bg-blue-500' },
              { label: 'Đã hẹn lịch', count: customers.filter(c => c.participationStatus === 'Đã hẹn lịch').length, color: 'bg-yellow-500' },
              { label: 'Đã xử lý', count: customers.filter(c => c.participationStatus === 'Đã xử lý').length, color: 'bg-green-500' },
              { label: 'Từ chối', count: customers.filter(c => c.participationStatus === 'Từ chối').length, color: 'bg-red-500' }
            ].map((stat, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                    <div>
                      <div className="text-2xl font-bold">{stat.count}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Danh sách khách hàng/xe ({customers.length})</CardTitle>
              <CardDescription>
                Quản lý thông tin và trạng thái xử lý của từng khách hàng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>VIN</TableHead>
                      <TableHead>Tên khách hàng</TableHead>
                      <TableHead>Liên hệ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Lịch hẹn</TableHead>
                      <TableHead>Ghi chú</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-mono text-sm">{customer.vin}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            👤 {customer.customerName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p>{customer.phone}</p>
                            <p className="text-gray-500">{customer.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(customer.participationStatus)}>
                            {customer.participationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {customer.appointmentDate ? (
                            <div className="text-sm">
                              <p>{new Date(customer.appointmentDate).toLocaleDateString('vi-VN')}</p>
                              <p className="text-gray-500">{new Date(customer.appointmentDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {customer.notes && <p className="text-sm text-gray-600">{customer.notes}</p>}
                            {customer.refusalReason && (
                              <p className="text-sm text-red-600 flex items-center gap-1">
                                ⚠️ {customer.refusalReason}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleContactCustomer(customer)}
                            >
                              📞
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleScheduleAppointment(customer)}
                            >
                              📅
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStatus(customer)}
                            >
                              ✅
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button className="flex items-center gap-2">
              📤 Gửi báo cáo kết quả cho hãng
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📄 Tài liệu hướng dẫn từ hãng
              </CardTitle>
              <CardDescription>
                Các tài liệu kỹ thuật và hướng dẫn thực hiện chiến dịch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaign.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          Tải lên: {new Date(doc.uploadDate).toLocaleDateString('vi-VN')} • {doc.type}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      ⬇️ Tải xuống
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gọi/Liên hệ khách hàng</DialogTitle>
            <DialogDescription>
              Liên hệ với khách hàng {selectedCustomer?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Số điện thoại</label>
              <Input value={selectedCustomer?.phone} readOnly />
            </div>
            <div>
              <label className="text-sm font-medium">Ghi chú cuộc gọi</label>
              <Textarea placeholder="Ghi chú về cuộc gọi..." />
            </div>
            <div className="flex gap-2">
              <Button>Lưu ghi chú</Button>
              <Button variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Dialog */}
      <Dialog open={isAppointmentDialogOpen} onOpenChange={setIsAppointmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đặt lịch hẹn</DialogTitle>
            <DialogDescription>
              Đặt lịch hẹn cho khách hàng {selectedCustomer?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Ngày hẹn</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium">Giờ hẹn</label>
              <Input type="time" />
            </div>
            <div>
              <label className="text-sm font-medium">Ghi chú</label>
              <Textarea placeholder="Ghi chú về lịch hẹn..." />
            </div>
            <div className="flex gap-2">
              <Button>Xác nhận lịch hẹn</Button>
              <Button variant="outline" onClick={() => setIsAppointmentDialogOpen(false)}>
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusUpdateDialogOpen} onOpenChange={setIsStatusUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
            <DialogDescription>
              Cập nhật trạng thái xử lý cho khách hàng {selectedCustomer?.customerName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Trạng thái mới</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contacted">Đã liên hệ</SelectItem>
                  <SelectItem value="scheduled">Đã hẹn lịch</SelectItem>
                  <SelectItem value="processed">Đã xử lý</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Ghi chú</label>
              <Textarea placeholder="Ghi chú về việc cập nhật trạng thái..." />
            </div>
            <div className="flex gap-2">
              <Button>Cập nhật trạng thái</Button>
              <Button variant="outline" onClick={() => setIsStatusUpdateDialogOpen(false)}>
                Hủy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignDetail;