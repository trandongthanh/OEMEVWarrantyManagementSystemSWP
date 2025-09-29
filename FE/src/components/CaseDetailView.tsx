import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Car,
  FileText,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Wrench,
  ArrowLeft,
  Settings,
  Send,
  Eye
} from "lucide-react";

interface CaseDetailViewProps {
  caseId: string;
  onClose?: () => void;
  onAssignTechnician?: () => void;
  onSubmitToManufacturer?: () => void;
  onMarkCompleted?: () => void;
}

const CaseDetailView = ({
  caseId,
  onClose,
  onAssignTechnician,
  onSubmitToManufacturer,
  onMarkCompleted
}: CaseDetailViewProps) => {
  const [activeTab, setActiveTab] = useState("summary");

  // In real app, data would be fetched based on caseId
  const caseData = {
    id: caseId,
    status: "pending",
    customer: {
      name: "",
      phone: "",
      email: "",
      address: ""
    },
    vehicle: {
      vin: "",
      model: "",
      purchaseDate: "",
      odometer: "",
      warrantyExpiry: "",
      color: ""
    },
    assignedTech: {
      id: "",
      name: "",
      specialty: "",
      phone: "",
      avatar: ""
    },
    issue: "",
    priority: "low",
    dateCreated: "",
    lastUpdated: ""
  };

  // In real app, data would be fetched from API
  const diagnosticReports: any[] = [];

  // In real app, data would be fetched from API
  const partShipments: any[] = [];

  // In real app, data would be fetched from API
  const activityLog: any[] = [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "pending" as const, text: "Chờ duyệt", icon: Clock },
      approved: { variant: "approved" as const, text: "Đã duyệt", icon: CheckCircle },
      rejected: { variant: "rejected" as const, text: "Từ chối", icon: XCircle },
      "in-progress": { variant: "warning" as const, text: "Đang sửa", icon: Wrench }
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

  const getShipmentStatusBadge = (status: string) => {
    const statusConfig = {
      shipped: { variant: "secondary" as const, text: "Đã gửi" },
      "in-transit": { variant: "warning" as const, text: "Đang vận chuyển" },
      delivered: { variant: "success" as const, text: "Đã giao" }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getActivityIcon = (type: string) => {
    const iconConfig = {
      update: Wrench,
      system: Settings,
      report: FileText,
      assignment: User
    };

    return iconConfig[type as keyof typeof iconConfig] || FileText;
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose?.()}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="text-xl">Case Details - {caseData.id}</DialogTitle>
                <DialogDescription>
                  Comprehensive case information and management
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(caseData.status)}
              <Badge variant="outline" className="text-xs">
                High Priority
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Case Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{caseData.customer.name}</p>
                  <p className="text-xs text-muted-foreground">Customer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Car className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{caseData.vehicle.model}</p>
                  <p className="text-xs text-muted-foreground font-mono">{caseData.vehicle.vin}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Wrench className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{caseData.assignedTech.name}</p>
                  <p className="text-xs text-muted-foreground">{caseData.assignedTech.specialty}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{caseData.dateCreated}</p>
                  <p className="text-xs text-muted-foreground">Created</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 mb-6">
          <Button variant="gradient" onClick={onAssignTechnician}>
            <User className="mr-2 h-4 w-4" />
            Assign Technician
          </Button>
          <Button variant="outline" onClick={onSubmitToManufacturer}>
            <Send className="mr-2 h-4 w-4" />
            Submit to Manufacturer
          </Button>
          <Button variant="success" onClick={onMarkCompleted}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Completed
          </Button>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary & Details</TabsTrigger>
            <TabsTrigger value="diagnostics">Diagnostic Reports</TabsTrigger>
            <TabsTrigger value="parts">Part Shipments</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Customer Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{caseData.customer.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{caseData.customer.email}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{caseData.customer.address}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Car className="h-5 w-5" />
                    <span>Vehicle Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Purchase Date</p>
                      <p className="text-sm font-medium">{caseData.vehicle.purchaseDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Odometer</p>
                      <p className="text-sm font-medium">{caseData.vehicle.odometer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Warranty Expiry</p>
                      <p className="text-sm font-medium">{caseData.vehicle.warrantyExpiry}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Color</p>
                      <p className="text-sm font-medium">{caseData.vehicle.color}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assigned Technician */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wrench className="h-5 w-5" />
                    <span>Assigned Technician</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={onAssignTechnician}>
                    Change Assignment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarFallback>{caseData.assignedTech.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{caseData.assignedTech.name}</p>
                    <p className="text-sm text-muted-foreground">{caseData.assignedTech.specialty}</p>
                    <p className="text-sm text-muted-foreground">{caseData.assignedTech.phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-4">
            {diagnosticReports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{report.id} - {report.summary}</CardTitle>
                      <CardDescription>
                        By {report.technician} on {report.dateSubmitted}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(report.status)}
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{report.details}</p>

                  {report.requiredParts.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2">Required Parts:</p>
                      <div className="flex flex-wrap gap-2">
                        {report.requiredParts.map((part, index) => (
                          <Badge key={index} variant="outline">{part}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{report.attachments} attachments</span>
                    <Button variant="outline" size="sm">View Full Report</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="parts" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shipment ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shipped Date</TableHead>
                  <TableHead>Expected Arrival</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">{shipment.id}</TableCell>
                    <TableCell>{getShipmentStatusBadge(shipment.status)}</TableCell>
                    <TableCell>{shipment.shippedDate}</TableCell>
                    <TableCell>{shipment.expectedArrival}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {shipment.items.map((item, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Track
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  Chronological record of all case activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLog.map((activity) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                          <Icon className="h-4 w-4 text-accent-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{activity.action}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span>{activity.user}</span>
                            <span>•</span>
                            <span>{activity.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default CaseDetailView;