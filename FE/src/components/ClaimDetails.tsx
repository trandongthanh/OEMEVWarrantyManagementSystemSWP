import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  X,
  Car,
  User,
  Wrench,
  Calendar,
  Eye,
  Download,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Package,
  Users
} from 'lucide-react';

interface ClaimDetailsProps {
  claimId: string;
  onClose: () => void;
  onUpdateStatus?: () => void;
}

const ClaimDetails = ({ claimId, onClose, onUpdateStatus }: ClaimDetailsProps) => {
  const { user } = useAuth();

  // Mock claim data - in real app would fetch by claimId
  const claimData = {
    id: claimId,
    vin: '1HGBH41JXMN109186',
    customer: {
      name: 'Nguyễn Văn Minh',
      phone: '0901234567',
      email: 'minh.nguyen@email.com',
      address: '123 Đường ABC, Quận 1, TP.HCM'
    },
    vehicle: {
      model: 'EV Model X Pro',
      year: '2023',
      color: 'Trắng Ngọc Trai',
      batteryCapacity: '75 kWh',
      motorType: 'Dual Motor AWD',
      purchaseDate: '2023-03-15',
      warrantyStatus: 'Active - 7.2 years remaining'
    },
    issue: {
      category: 'Battery Performance Issue',
      description: 'Khách hàng báo cáo pin sạc chậm và giảm dung lượng đáng kể. Thời gian sạc từ 20% lên 80% mất 45 phút thay vì 25 phút như ban đầu. Range thực tế chỉ đạt 320km thay vì 450km như công bố.',
      reportedDate: '2024-01-15',
      priority: 'high'
    },
    technicians: [
      { id: 'tech-1', name: 'Trần Minh Quân', role: 'Lead Technician', specialty: 'Battery Systems' },
      { id: 'tech-2', name: 'Lê Thị Hoa', role: 'Support Technician', specialty: 'Diagnostics' }
    ],
    diagnosis: {
      summary: 'Sau kiểm tra chi tiết, phát hiện 3 cell pin trong module B2 có dấu hiệu suy giảm nghiêm trọng. BMS báo lỗi mã P0A80 - High voltage battery pack degradation. Cần thay thế toàn bộ battery pack.',
      errorCodes: ['P0A80', 'P0A7F', 'P3009'],
      testResults: [
        { test: 'Battery Capacity Test', result: '68.2 kWh', expected: '75 kWh', status: 'fail' },
        { test: 'Cell Voltage Balance', result: 'Unbalanced', expected: 'Balanced', status: 'fail' },
        { test: 'Charging Current', result: '45A', expected: '125A', status: 'fail' },
        { test: 'Battery Temperature', result: '32°C', expected: '<30°C', status: 'pass' }
      ],
      recommendation: 'Thay thế battery pack theo quy trình warranty. Estimated cost: 15,000,000 VND.'
    },
    attachments: [
      { name: 'Battery_Diagnostic_Report.pdf', size: '2.4 MB', type: 'pdf', uploadDate: '2024-01-15' },
      { name: 'Error_Code_Screenshot.jpg', size: '856 KB', type: 'image', uploadDate: '2024-01-15' },
      { name: 'Cell_Voltage_Chart.xlsx', size: '1.2 MB', type: 'excel', uploadDate: '2024-01-16' },
      { name: 'Battery_Photos_1.jpg', size: '3.1 MB', type: 'image', uploadDate: '2024-01-16' }
    ],
    status: 'pending',
    timeline: [
      { date: '2024-01-15 09:30', event: 'Claim Created', user: 'Nguyễn Văn A (Staff)', status: 'created' },
      { date: '2024-01-15 10:15', event: 'Technician Assigned', user: 'System', status: 'assigned' },
      { date: '2024-01-15 14:30', event: 'Diagnostic Started', user: 'Trần Minh Quân', status: 'diagnosing' },
      { date: '2024-01-16 11:20', event: 'Diagnostic Complete', user: 'Trần Minh Quân', status: 'diagnosed' },
      { date: '2024-01-16 16:45', event: 'Submitted to Manufacturer', user: 'Nguyễn Văn A (Staff)', status: 'pending' }
    ],
    estimatedCost: '15,000,000 VND',
    createdBy: 'Nguyễn Văn A',
    createdDate: '2024-01-15'
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "pending" as const, icon: Clock, text: "Chờ duyệt" },
      approved: { variant: "approved" as const, icon: CheckCircle, text: "Đã duyệt" },
      rejected: { variant: "rejected" as const, icon: XCircle, text: "Từ chối" },
      "in-progress": { variant: "warning" as const, icon: Wrench, text: "Đang sửa" },
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

  const getTestStatusBadge = (status: string) => {
    return status === 'pass' ? 
      <Badge variant="success">Pass</Badge> : 
      <Badge variant="destructive">Fail</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Warranty Claim Details</span>
              </CardTitle>
              <CardDescription>
                Claim ID: {claimData.id} | Created: {claimData.createdDate}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(claimData.status)}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="overview" className="h-full">
            <div className="border-b px-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
                <TabsTrigger value="attachments">Files</TabsTrigger>
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Customer & Vehicle Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <User className="h-4 w-4" />
                        <span>Customer Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{claimData.customer.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Contact</p>
                        <p className="font-medium">{claimData.customer.phone}</p>
                        <p className="text-sm text-muted-foreground">{claimData.customer.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{claimData.customer.address}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <Car className="h-4 w-4" />
                        <span>Vehicle Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Model & Year</p>
                        <p className="font-medium">{claimData.vehicle.model} ({claimData.vehicle.year})</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">VIN</p>
                        <p className="font-medium font-mono">{claimData.vin}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Color</p>
                          <p className="font-medium">{claimData.vehicle.color}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Battery</p>
                          <p className="font-medium">{claimData.vehicle.batteryCapacity}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Warranty Status</p>
                        <Badge variant="success">{claimData.vehicle.warrantyStatus}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Issue Details */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Issue Details</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getPriorityBadge(claimData.issue.priority)}
                          <Badge variant="outline">{claimData.issue.category}</Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Reported Date</p>
                          <p className="font-medium">{new Date(claimData.issue.reportedDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p className="text-sm leading-relaxed">{claimData.issue.description}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Estimated Cost</p>
                          <p className="font-semibold text-lg text-primary">{claimData.estimatedCost}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Assigned Technicians */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 text-base">
                        <Users className="h-4 w-4" />
                        <span>Assigned Technicians</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {claimData.technicians.map((tech) => (
                          <div key={tech.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                              <Wrench className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{tech.name}</p>
                              <p className="text-sm text-muted-foreground">{tech.role}</p>
                              <p className="text-xs text-muted-foreground">{tech.specialty}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Diagnosis Tab */}
              <TabsContent value="diagnosis" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Technical Diagnosis Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{claimData.diagnosis.summary}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Error Codes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {claimData.diagnosis.errorCodes.map((code) => (
                        <Badge key={code} variant="destructive" className="font-mono">{code}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {claimData.diagnosis.testResults.map((test, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{test.test}</p>
                            <p className="text-sm text-muted-foreground">
                              Result: <span className="font-mono">{test.result}</span> | 
                              Expected: <span className="font-mono">{test.expected}</span>
                            </p>
                          </div>
                          {getTestStatusBadge(test.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recommendation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{claimData.diagnosis.recommendation}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attachments Tab */}
              <TabsContent value="attachments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Supporting Documents ({claimData.attachments.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {claimData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded bg-accent flex items-center justify-center">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {file.size} | Uploaded: {new Date(file.uploadDate).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Claim Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {claimData.timeline.map((event, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium">{event.event}</p>
                              <p className="text-sm text-muted-foreground">{event.date}</p>
                            </div>
                            <p className="text-sm text-muted-foreground">by {event.user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Available Actions</CardTitle>
                    <CardDescription>
                      Actions available for this claim based on current status and your role
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Button 
                        className="w-full" 
                        onClick={onUpdateStatus}
                        disabled={user?.role !== 'service_center_staff'}
                      >
                        Update Status
                      </Button>
                      <Button variant="outline" className="w-full">
                        Add Notes
                      </Button>
                      <Button variant="outline" className="w-full">
                        Upload Files
                      </Button>
                      <Button variant="outline" className="w-full">
                        Print Report
                      </Button>
                    </div>
                    
                    {user?.role !== 'service_center_staff' && (
                      <p className="text-sm text-muted-foreground mt-4">
                        * Some actions are restricted to Staff members
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClaimDetails;