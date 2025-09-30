import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ClaimStatistics {
  totalClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  approvalRate: number;
  rejectionRate: number;
  totalApprovedCost: number;
  averageProcessingTime: number;
}

interface ModelStatistics {
  model: string;
  totalClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalCost: number;
  commonIssues: string[];
}

interface ServiceCenterPerformance {
  id: string;
  name: string;
  totalSubmitted: number;
  approvedClaims: number;
  rejectedClaims: number;
  successRate: number;
  averageCost: number;
  responseTime: number;
  rating: 'Xuất sắc' | 'Tốt' | 'Trung bình' | 'Cần cải thiện';
}

interface MonthlyTrend {
  month: string;
  totalClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  totalCost: number;
}

const WarrantyDashboard: React.FC = () => {
  const [statistics, setStatistics] = useState<ClaimStatistics | null>(null);
  const [modelStats, setModelStats] = useState<ModelStatistics[]>([]);
  const [centerPerformance, setCenterPerformance] = useState<ServiceCenterPerformance[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('this-quarter');

  useEffect(() => {
    // Mock data
    const mockStatistics: ClaimStatistics = {
      totalClaims: 156,
      pendingClaims: 23,
      approvedClaims: 98,
      rejectedClaims: 35,
      approvalRate: 73.7,
      rejectionRate: 26.3,
      totalApprovedCost: 1250000000,
      averageProcessingTime: 2.5
    };

    const mockModelStats: ModelStatistics[] = [
      {
        model: 'Model X',
        totalClaims: 45,
        approvedClaims: 32,
        rejectedClaims: 13,
        totalCost: 450000000,
        commonIssues: ['Pin EV', 'Hệ thống điện', 'Cảm biến']
      },
      {
        model: 'Model Y',
        totalClaims: 38,
        approvedClaims: 29,
        rejectedClaims: 9,
        totalCost: 380000000,
        commonIssues: ['Động cơ', 'Phanh', 'Hệ thống làm mát']
      },
      {
        model: 'Model S',
        totalClaims: 42,
        approvedClaims: 25,
        rejectedClaims: 17,
        totalCost: 320000000,
        commonIssues: ['Hệ thống điện', 'Cảm biến', 'Nội thất']
      },
      {
        model: 'Model 3',
        totalClaims: 31,
        approvedClaims: 12,
        rejectedClaims: 19,
        totalCost: 100000000,
        commonIssues: ['Phanh', 'Lốp xe', 'Hệ thống âm thanh']
      }
    ];

    const mockCenterPerformance: ServiceCenterPerformance[] = [
      {
        id: '1',
        name: 'SC Hà Nội',
        totalSubmitted: 52,
        approvedClaims: 41,
        rejectedClaims: 11,
        successRate: 78.8,
        averageCost: 12500000,
        responseTime: 1.8,
        rating: 'Xuất sắc'
      },
      {
        id: '2',
        name: 'SC TP.HCM',
        totalSubmitted: 48,
        approvedClaims: 35,
        rejectedClaims: 13,
        successRate: 72.9,
        averageCost: 11200000,
        responseTime: 2.1,
        rating: 'Tốt'
      },
      {
        id: '3',
        name: 'SC Đà Nẵng',
        totalSubmitted: 32,
        approvedClaims: 15,
        rejectedClaims: 17,
        successRate: 46.9,
        averageCost: 8500000,
        responseTime: 3.2,
        rating: 'Cần cải thiện'
      },
      {
        id: '4',
        name: 'SC Cần Thơ',
        totalSubmitted: 24,
        approvedClaims: 7,
        rejectedClaims: 17,
        successRate: 29.2,
        averageCost: 6200000,
        responseTime: 4.1,
        rating: 'Cần cải thiện'
      }
    ];

    const mockMonthlyTrends: MonthlyTrend[] = [
      { month: '2025-06', totalClaims: 18, approvedClaims: 13, rejectedClaims: 5, totalCost: 180000000 },
      { month: '2025-07', totalClaims: 22, approvedClaims: 16, rejectedClaims: 6, totalCost: 220000000 },
      { month: '2025-08', totalClaims: 28, approvedClaims: 20, rejectedClaims: 8, totalCost: 285000000 },
      { month: '2025-09', totalClaims: 31, approvedClaims: 23, rejectedClaims: 8, totalCost: 315000000 }
    ];

    setStatistics(mockStatistics);
    setModelStats(mockModelStats);
    setCenterPerformance(mockCenterPerformance);
    setMonthlyTrends(mockMonthlyTrends);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getRatingColor = (rating: ServiceCenterPerformance['rating']) => {
    switch (rating) {
      case 'Xuất sắc': return 'text-green-600';
      case 'Tốt': return 'text-blue-600';
      case 'Trung bình': return 'text-yellow-600';
      case 'Cần cải thiện': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (!statistics) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Theo dõi Bảo hành</h1>
          <p className="text-gray-600 mt-1">Tổng quan về tình hình xét duyệt và chi phí bảo hành</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Chọn kỳ báo cáo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">Tháng này</SelectItem>
              <SelectItem value="this-quarter">Quý này</SelectItem>
              <SelectItem value="this-year">Năm này</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng yêu cầu</CardTitle>
            <span className="text-2xl">📋</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              yêu cầu bảo hành
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ chấp nhận</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.approvalRate}%</div>
            <Progress value={statistics.approvalRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.approvedClaims}/{statistics.totalClaims} được chấp nhận
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ từ chối</CardTitle>
            <span className="text-2xl">❌</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.rejectionRate}%</div>
            <Progress value={statistics.rejectionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.rejectedClaims}/{statistics.totalClaims} bị từ chối
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chi phí đã duyệt</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(statistics.totalApprovedCost / 1000000000).toFixed(1)}B
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics.totalApprovedCost)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Claims by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê theo Model xe</CardTitle>
          <CardDescription>Phân tích yêu cầu bảo hành theo từng model</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Tổng yêu cầu</TableHead>
                <TableHead>Đã duyệt</TableHead>
                <TableHead>Từ chối</TableHead>
                <TableHead>Tỷ lệ duyệt</TableHead>
                <TableHead>Chi phí</TableHead>
                <TableHead>Vấn đề thường gặp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelStats.map((model) => (
                <TableRow key={model.model}>
                  <TableCell className="font-medium">{model.model}</TableCell>
                  <TableCell>{model.totalClaims}</TableCell>
                  <TableCell className="text-green-600">{model.approvedClaims}</TableCell>
                  <TableCell className="text-red-600">{model.rejectedClaims}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {((model.approvedClaims / model.totalClaims) * 100).toFixed(1)}%
                      </span>
                      <Progress 
                        value={(model.approvedClaims / model.totalClaims) * 100} 
                        className="w-16 h-2" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(model.totalCost)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {model.commonIssues.slice(0, 2).map((issue, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                      {model.commonIssues.length > 2 && (
                        <span className="text-xs text-gray-500">+{model.commonIssues.length - 2}</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Service Center Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Hiệu suất Trung tâm Dịch vụ</CardTitle>
          <CardDescription>Đánh giá hiệu suất các trung tâm dịch vụ trong việc gửi yêu cầu bảo hành</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trung tâm</TableHead>
                <TableHead>Tổng gửi</TableHead>
                <TableHead>Được duyệt</TableHead>
                <TableHead>Tỷ lệ thành công</TableHead>
                <TableHead>Chi phí TB</TableHead>
                <TableHead>Thời gian xử lý</TableHead>
                <TableHead>Đánh giá</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centerPerformance.map((center) => (
                <TableRow key={center.id}>
                  <TableCell className="font-medium">{center.name}</TableCell>
                  <TableCell>{center.totalSubmitted}</TableCell>
                  <TableCell className="text-green-600">{center.approvedClaims}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{center.successRate.toFixed(1)}%</span>
                      <Progress value={center.successRate} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(center.averageCost)}</TableCell>
                  <TableCell>{center.responseTime} ngày</TableCell>
                  <TableCell>
                    <span className={`font-medium ${getRatingColor(center.rating)}`}>
                      {center.rating === 'Xuất sắc' && '🏆 '}
                      {center.rating === 'Tốt' && '👍 '}
                      {center.rating === 'Trung bình' && '📊 '}
                      {center.rating === 'Cần cải thiện' && '⚠️ '}
                      {center.rating}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng theo Tháng</CardTitle>
          <CardDescription>Biến động yêu cầu bảo hành và chi phí theo thời gian</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyTrends.map((trend, index) => (
              <div key={trend.month} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Tháng</div>
                    <div className="font-bold">
                      {new Date(trend.month + '-01').toLocaleDateString('vi-VN', { month: 'short' })}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <div className="text-sm text-gray-500">Tổng yêu cầu</div>
                      <div className="font-bold">{trend.totalClaims}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Đã duyệt</div>
                      <div className="font-bold text-green-600">{trend.approvedClaims}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Từ chối</div>
                      <div className="font-bold text-red-600">{trend.rejectedClaims}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Chi phí</div>
                      <div className="font-bold text-blue-600">
                        {(trend.totalCost / 1000000).toFixed(0)}M
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {index > 0 && (
                    <div className="text-sm">
                      {trend.totalClaims > monthlyTrends[index - 1].totalClaims ? (
                        <span className="text-green-600">📈 +{((trend.totalClaims - monthlyTrends[index - 1].totalClaims) / monthlyTrends[index - 1].totalClaims * 100).toFixed(1)}%</span>
                      ) : (
                        <span className="text-red-600">📉 {((trend.totalClaims - monthlyTrends[index - 1].totalClaims) / monthlyTrends[index - 1].totalClaims * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex items-center gap-2">
          📊 Xuất báo cáo chi tiết
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          📧 Gửi báo cáo định kỳ
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          📈 Phân tích xu hướng
        </Button>
      </div>
    </div>
  );
};

export default WarrantyDashboard;