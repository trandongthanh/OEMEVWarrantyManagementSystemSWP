import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Campaign {
  id: string;
  code: string;
  name: string;
  vehicleType: string;
  startDate: string;
  endDate: string;
  vehicleCount: number;
  completionPercentage: number;
  status: 'Mới nhận' | 'Đang triển khai' | 'Hoàn thành';
}

const CampaignList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');

  // Mock data
  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        code: 'CAM-2025-001',
        name: 'Chiến dịch kiểm tra pin EV Model X',
        vehicleType: 'Model X',
        startDate: '2025-01-15',
        endDate: '2025-03-15',
        vehicleCount: 150,
        completionPercentage: 65,
        status: 'Đang triển khai'
      },
      {
        id: '2',
        code: 'CAM-2025-002',
        name: 'Cập nhật phần mềm điều khiển Model Y',
        vehicleType: 'Model Y',
        startDate: '2025-02-01',
        endDate: '2025-04-01',
        vehicleCount: 200,
        completionPercentage: 30,
        status: 'Mới nhận'
      },
      {
        id: '3',
        code: 'CAM-2024-045',
        name: 'Thay thế cảm biến áp suất lốp Model S',
        vehicleType: 'Model S',
        startDate: '2024-12-01',
        endDate: '2025-02-01',
        vehicleCount: 85,
        completionPercentage: 100,
        status: 'Hoàn thành'
      }
    ];
    setCampaigns(mockCampaigns);
    setFilteredCampaigns(mockCampaigns);
  }, []);

  // Filter campaigns based on search and filters
  useEffect(() => {
    const filtered = campaigns.filter(campaign => {
      const matchesSearch = 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
      const matchesVehicleType = vehicleTypeFilter === 'all' || campaign.vehicleType === vehicleTypeFilter;
      
      return matchesSearch && matchesStatus && matchesVehicleType;
    });

    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, statusFilter, vehicleTypeFilter]);

  const getStatusBadgeVariant = (status: Campaign['status']) => {
    switch (status) {
      case 'Mới nhận':
        return 'secondary';
      case 'Đang triển khai':
        return 'default';
      case 'Hoàn thành':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Chiến dịch</h1>
          <p className="text-gray-600 mt-1">Danh sách các chiến dịch được giao từ hãng xe</p>
        </div>
        <Button className="flex items-center gap-2">
          ➕ Tạo chiến dịch mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã chiến dịch..."
                className="pl-4"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Mới nhận">Mới nhận</SelectItem>
                <SelectItem value="Đang triển khai">Đang triển khai</SelectItem>
                <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>

            {/* Vehicle Type Filter */}
            <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Loại xe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại xe</SelectItem>
                <SelectItem value="Model S">Model S</SelectItem>
                <SelectItem value="Model X">Model X</SelectItem>
                <SelectItem value="Model Y">Model Y</SelectItem>
                <SelectItem value="Model 3">Model 3</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter Placeholder */}
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thời gian</SelectItem>
                <SelectItem value="this-month">Tháng này</SelectItem>
                <SelectItem value="this-quarter">Quý này</SelectItem>
                <SelectItem value="this-year">Năm này</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách chiến dịch ({filteredCampaigns.length})</CardTitle>
          <CardDescription>
            Quản lý và theo dõi các chiến dịch được giao từ hãng xe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã chiến dịch</TableHead>
                  <TableHead>Tên chiến dịch</TableHead>
                  <TableHead>Loại xe</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Số lượng xe</TableHead>
                  <TableHead>Tiến độ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.code}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium text-gray-900">{campaign.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{campaign.vehicleType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{campaign.startDate}</p>
                        <p className="text-gray-500">đến {campaign.endDate}</p>
                      </div>
                    </TableCell>
                    <TableCell>{campaign.vehicleCount} xe</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{campaign.completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(campaign.completionPercentage)}`}
                            style={{ width: `${campaign.completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          // Navigate to campaign detail
                          console.log('View campaign details:', campaign.id);
                        }}
                      >
                        👁️ Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Không tìm thấy chiến dịch phù hợp với bộ lọc</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignList;