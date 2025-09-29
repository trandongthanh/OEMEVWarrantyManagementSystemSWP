import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface WarrantyClaim {
  id: string;
  requestCode: string;
  vin: string;
  model: string;
  serviceCenter: string;
  submissionDate: string;
  status: 'Chờ duyệt' | 'Đồng ý' | 'Từ chối';
  estimatedCost: number;
  priority: 'Thấp' | 'Trung bình' | 'Cao' | 'Khẩn cấp';
  issueType: string;
}

const WarrantyClaims: React.FC = () => {
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<WarrantyClaim[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [serviceCenterFilter, setServiceCenterFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Mock data
  useEffect(() => {
    const mockClaims: WarrantyClaim[] = [
      {
        id: '1',
        requestCode: 'WR-2025-001',
        vin: '1HGBH41JXMN109186',
        model: 'Model X',
        serviceCenter: 'SC Hà Nội',
        submissionDate: '2025-09-25',
        status: 'Chờ duyệt',
        estimatedCost: 15000000,
        priority: 'Cao',
        issueType: 'Pin EV'
      },
      {
        id: '2',
        requestCode: 'WR-2025-002',
        vin: '2HGBH41JXMN109187',
        model: 'Model Y',
        serviceCenter: 'SC TP.HCM',
        submissionDate: '2025-09-24',
        status: 'Đồng ý',
        estimatedCost: 8500000,
        priority: 'Trung bình',
        issueType: 'Hệ thống điện'
      },
      {
        id: '3',
        requestCode: 'WR-2025-003',
        vin: '3HGBH41JXMN109188',
        model: 'Model S',
        serviceCenter: 'SC Đà Nẵng',
        submissionDate: '2025-09-23',
        status: 'Từ chối',
        estimatedCost: 12000000,
        priority: 'Thấp',
        issueType: 'Cảm biến'
      },
      {
        id: '4',
        requestCode: 'WR-2025-004',
        vin: '4HGBH41JXMN109189',
        model: 'Model 3',
        serviceCenter: 'SC Hà Nội',
        submissionDate: '2025-09-26',
        status: 'Chờ duyệt',
        estimatedCost: 6000000,
        priority: 'Khẩn cấp',
        issueType: 'Phanh'
      },
      {
        id: '5',
        requestCode: 'WR-2025-005',
        vin: '5HGBH41JXMN109190',
        model: 'Model Y',
        serviceCenter: 'SC TP.HCM',
        submissionDate: '2025-09-27',
        status: 'Chờ duyệt',
        estimatedCost: 9200000,
        priority: 'Cao',
        issueType: 'Động cơ'
      }
    ];
    setClaims(mockClaims);
    setFilteredClaims(mockClaims);
  }, []);

  // Filter claims based on search and filters
  useEffect(() => {
    const filtered = claims.filter(claim => {
      const matchesSearch = 
        claim.requestCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.vin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.serviceCenter.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModel = modelFilter === 'all' || claim.model === modelFilter;
      const matchesServiceCenter = serviceCenterFilter === 'all' || claim.serviceCenter === serviceCenterFilter;
      const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
      
      // Date filter logic could be implemented here
      const matchesDate = dateFilter === 'all' || true; // Simplified for demo
      
      return matchesSearch && matchesModel && matchesServiceCenter && matchesStatus && matchesDate;
    });

    setFilteredClaims(filtered);
  }, [claims, searchTerm, modelFilter, serviceCenterFilter, statusFilter, dateFilter]);

  const getStatusBadgeVariant = (status: WarrantyClaim['status']) => {
    switch (status) {
      case 'Chờ duyệt':
        return 'secondary';
      case 'Đồng ý':
        return 'default';
      case 'Từ chối':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPriorityBadgeVariant = (priority: WarrantyClaim['priority']) => {
    switch (priority) {
      case 'Thấp':
        return 'outline';
      case 'Trung bình':
        return 'secondary';
      case 'Cao':
        return 'default';
      case 'Khẩn cấp':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleViewDetail = (claimId: string) => {
    console.log('View claim details:', claimId);
    // Navigate to claim detail page
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Xét duyệt Bảo hành</h1>
          <p className="text-gray-600 mt-1">Quản lý và xét duyệt các yêu cầu bảo hành từ trung tâm dịch vụ</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            📋 {claims.filter(c => c.status === 'Chờ duyệt').length} chờ duyệt
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng yêu cầu</CardTitle>
            <span className="text-2xl">📄</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims.length}</div>
            <p className="text-xs text-muted-foreground">
              yêu cầu bảo hành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {claims.filter(c => c.status === 'Chờ duyệt').length}
            </div>
            <p className="text-xs text-muted-foreground">
              cần xét duyệt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {claims.filter(c => c.status === 'Đồng ý').length}
            </div>
            <p className="text-xs text-muted-foreground">
              đã chấp nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Từ chối</CardTitle>
            <span className="text-2xl">❌</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {claims.filter(c => c.status === 'Từ chối').length}
            </div>
            <p className="text-xs text-muted-foreground">
              đã từ chối
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔍 Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <Input
                placeholder="Tìm kiếm theo mã, VIN, trung tâm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Model Filter */}
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Model xe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả model</SelectItem>
                <SelectItem value="Model S">Model S</SelectItem>
                <SelectItem value="Model X">Model X</SelectItem>
                <SelectItem value="Model Y">Model Y</SelectItem>
                <SelectItem value="Model 3">Model 3</SelectItem>
              </SelectContent>
            </Select>

            {/* Service Center Filter */}
            <Select value={serviceCenterFilter} onValueChange={setServiceCenterFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trung tâm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trung tâm</SelectItem>
                <SelectItem value="SC Hà Nội">SC Hà Nội</SelectItem>
                <SelectItem value="SC TP.HCM">SC TP.HCM</SelectItem>
                <SelectItem value="SC Đà Nẵng">SC Đà Nẵng</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Chờ duyệt">Chờ duyệt</SelectItem>
                <SelectItem value="Đồng ý">Đồng ý</SelectItem>
                <SelectItem value="Từ chối">Từ chối</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thời gian</SelectItem>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="this-week">Tuần này</SelectItem>
                <SelectItem value="this-month">Tháng này</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu bảo hành ({filteredClaims.length})</CardTitle>
          <CardDescription>
            Quản lý và xét duyệt các yêu cầu bảo hành từ trung tâm dịch vụ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã yêu cầu</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Trung tâm gửi</TableHead>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Vấn đề</TableHead>
                  <TableHead>Độ ưu tiên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ước tính chi phí</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">{claim.requestCode}</TableCell>
                    <TableCell className="font-mono text-sm">{claim.vin}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{claim.model}</Badge>
                    </TableCell>
                    <TableCell>{claim.serviceCenter}</TableCell>
                    <TableCell>
                      {new Date(claim.submissionDate).toLocaleDateString('vi-VN')}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{claim.issueType}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityBadgeVariant(claim.priority)}>
                        {claim.priority === 'Khẩn cấp' && '🚨 '}
                        {claim.priority === 'Cao' && '🔥 '}
                        {claim.priority === 'Trung bình' && '📋 '}
                        {claim.priority === 'Thấp' && '📝 '}
                        {claim.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatCurrency(claim.estimatedCost)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => handleViewDetail(claim.id)}
                      >
                        👁️ Xem chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClaims.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Không tìm thấy yêu cầu bảo hành phù hợp với bộ lọc</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WarrantyClaims;