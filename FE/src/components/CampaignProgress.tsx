import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface CampaignProgress {
  id: string;
  name: string;
  totalVehicles: number;
  processedVehicles: number;
  completionPercentage: number;
  status: 'Mới nhận' | 'Đang triển khai' | 'Hoàn thành';
}

interface CustomerStatus {
  status: string;
  count: number;
  color: string;
}

interface RefusalReason {
  reason: string;
  count: number;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  customerName: string;
  vin: string;
  phone: string;
  campaignName: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

const CampaignProgress: React.FC = () => {
  const [campaigns, setCampaigns] = useState<CampaignProgress[]>([]);
  const [customerStatuses, setCustomerStatuses] = useState<CustomerStatus[]>([]);
  const [refusalReasons, setRefusalReasons] = useState<RefusalReason[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  // Mock data
  useEffect(() => {
    const mockCampaigns: CampaignProgress[] = [
      {
        id: '1',
        name: 'Chiến dịch kiểm tra pin EV Model X',
        totalVehicles: 150,
        processedVehicles: 98,
        completionPercentage: 65,
        status: 'Đang triển khai'
      },
      {
        id: '2',
        name: 'Cập nhật phần mềm điều khiển Model Y',
        totalVehicles: 200,
        processedVehicles: 60,
        completionPercentage: 30,
        status: 'Mới nhận'
      },
      {
        id: '3',
        name: 'Thay thế cảm biến áp suất lốp Model S',
        totalVehicles: 85,
        processedVehicles: 85,
        completionPercentage: 100,
        status: 'Hoàn thành'
      }
    ];

    const mockCustomerStatuses: CustomerStatus[] = [
      { status: 'Chưa liên hệ', count: 45, color: '#6b7280' },
      { status: 'Đã liên hệ', count: 78, color: '#3b82f6' },
      { status: 'Đã hẹn lịch', count: 65, color: '#eab308' },
      { status: 'Đã xử lý', count: 180, color: '#22c55e' },
      { status: 'Từ chối', count: 67, color: '#ef4444' }
    ];

    const mockRefusalReasons: RefusalReason[] = [
      { reason: 'Đã bán xe', count: 25 },
      { reason: 'Không có thời gian', count: 18 },
      { reason: 'Xe đang sử dụng bình thường', count: 12 },
      { reason: 'Đang ở xa', count: 8 },
      { reason: 'Khác', count: 4 }
    ];

    const mockAppointments: Appointment[] = [
      {
        id: '1',
        date: '2025-09-27',
        time: '09:00',
        customerName: 'Nguyễn Văn An',
        vin: '1HGBH41JXMN109186',
        phone: '0123456789',
        campaignName: 'Chiến dịch kiểm tra pin EV Model X',
        status: 'confirmed'
      },
      {
        id: '2',
        date: '2025-09-27',
        time: '10:30',
        customerName: 'Trần Thị Bình',
        vin: '2HGBH41JXMN109187',
        phone: '0987654321',
        campaignName: 'Cập nhật phần mềm điều khiển Model Y',
        status: 'scheduled'
      },
      {
        id: '3',
        date: '2025-09-27',
        time: '14:00',
        customerName: 'Lê Văn Cường',
        vin: '3HGBH41JXMN109188',
        phone: '0369852147',
        campaignName: 'Chiến dịch kiểm tra pin EV Model X',
        status: 'scheduled'
      },
      {
        id: '4',
        date: '2025-09-28',
        time: '09:30',
        customerName: 'Phạm Thị Dung',
        vin: '4HGBH41JXMN109189',
        phone: '0147258369',
        campaignName: 'Thay thế cảm biến áp suất lốp Model S',
        status: 'confirmed'
      }
    ];

    setCampaigns(mockCampaigns);
    setCustomerStatuses(mockCustomerStatuses);
    setRefusalReasons(mockRefusalReasons);
    setAppointments(mockAppointments);
  }, []);

  const totalVehicles = campaigns.reduce((sum, campaign) => sum + campaign.totalVehicles, 0);
  const totalProcessed = campaigns.reduce((sum, campaign) => sum + campaign.processedVehicles, 0);
  const overallProgress = totalVehicles > 0 ? Math.round((totalProcessed / totalVehicles) * 100) : 0;

  const todayAppointments = appointments.filter(
    appointment => appointment.date === selectedDate.toISOString().split('T')[0]
  );

  const getAppointmentStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAppointmentStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch';
      case 'confirmed': return 'Đã xác nhận';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Theo dõi Tiến độ Chiến dịch</h1>
          <p className="text-gray-600 mt-1">Dashboard tổng quan về tiến độ thực hiện các chiến dịch</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Chọn chiến dịch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chiến dịch</SelectItem>
              {campaigns.map(campaign => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số xe</CardTitle>
            <span className="text-2xl">🚗</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              trong tất cả chiến dịch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã xử lý</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalProcessed}</div>
            <p className="text-xs text-muted-foreground">
              xe đã hoàn thành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chưa xử lý</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalVehicles - totalProcessed}</div>
            <p className="text-xs text-muted-foreground">
              xe còn lại
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallProgress}%</div>
            <Progress value={overallProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Progress by Campaign */}
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ theo Chiến dịch</CardTitle>
          <CardDescription>Tình hình thực hiện của từng chiến dịch</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-gray-500">
                      {campaign.processedVehicles}/{campaign.totalVehicles} xe
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{campaign.completionPercentage}%</span>
                    <Badge variant={campaign.status === 'Hoàn thành' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
                <Progress value={campaign.completionPercentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Status Distribution and Refusal Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Phân bố Trạng thái Khách hàng</CardTitle>
            <CardDescription>Tình hình liên hệ và xử lý khách hàng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customerStatuses.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="text-sm">{status.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{status.count}</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${(status.count / customerStatuses.reduce((sum, s) => sum + s.count, 0)) * 100}%`,
                          backgroundColor: status.color 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lý do Từ chối</CardTitle>
            <CardDescription>Phân tích lý do khách hàng từ chối tham gia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {refusalReasons.map((reason, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{reason.reason}</span>
                  <div className="text-right">
                    <span className="font-bold">{reason.count}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ 
                          width: `${(reason.count / refusalReasons.reduce((sum, r) => sum + r.count, 0)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar View - Simplified */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📅 Lịch hẹn hôm nay ({selectedDate.toLocaleDateString('vi-VN')})
          </CardTitle>
          <CardDescription>
            {todayAppointments.length} lịch hẹn
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {todayAppointments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Không có lịch hẹn nào trong ngày này
              </p>
            ) : (
              todayAppointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{appointment.customerName}</p>
                      <p className="text-sm text-gray-500">VIN: {appointment.vin}</p>
                      <p className="text-sm text-gray-500">{appointment.campaignName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{appointment.time}</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full border ${getAppointmentStatusColor(appointment.status)}`}>
                        {getAppointmentStatusText(appointment.status)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex items-center gap-1">
                      📞 {appointment.phone}
                    </Button>
                    {appointment.status === 'scheduled' && (
                      <Button size="sm" variant="outline">
                        Xác nhận
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex items-center gap-2">
          📊 Xuất báo cáo tiến độ
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          ⚠️ Cảnh báo chậm tiến độ
        </Button>
      </div>
    </div>
  );
};

export default CampaignProgress;