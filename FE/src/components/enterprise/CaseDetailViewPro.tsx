import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft,
  User,
  Car,
  Wrench,
  FileText,
  Package,
  Activity,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  UserPlus,
  X
} from "lucide-react";

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    "pending": { variant: "secondary" as const, text: "Pending", className: "bg-secondary" },
    "in-repair": { variant: "default" as const, text: "In Repair", className: "bg-primary text-primary-foreground" },
    "awaiting-parts": { variant: "outline" as const, text: "Awaiting Parts", className: "border-warning text-warning bg-warning/5" },
    "awaiting-handover": { variant: "outline" as const, text: "Awaiting Handover", className: "border-info text-info bg-info/5" },
    "manufacturer-review": { variant: "outline" as const, text: "Manufacturer Review", className: "border-warning text-warning bg-warning/5" },
    "approved": { variant: "outline" as const, text: "Approved", className: "border-success text-success bg-success/5" },
    "completed": { variant: "outline" as const, text: "Completed", className: "border-success text-success bg-success/10" }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig];
  return config ? (
    <Badge variant={config.variant} className={`${config.className} text-sm px-3 py-1`}>
      {config.text}
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-sm px-3 py-1">{status}</Badge>
  );
};

const ReportStatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    "pending": { text: "Pending Review", className: "bg-warning/10 text-warning border-warning" },
    "approved": { text: "Approved by EVM", className: "bg-success/10 text-success border-success" },
    "rejected": { text: "Rejected", className: "bg-destructive/10 text-destructive border-destructive" }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig];
  return config ? (
    <Badge variant="outline" className={`${config.className} text-xs px-2 py-1`}>
      {config.text}
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-xs px-2 py-1">{status}</Badge>
  );
};

const CaseDetailViewPro = () => {
  const [activeTab, setActiveTab] = useState("reports");

  // Mock case data
  const caseData = {
    id: "WC-25-09-001",
    status: "manufacturer-review",
    customer: {
      name: "Nguyễn Văn An",
      phone: "+84 901 234 567",
      email: "nguyen.van.an@email.com",
      avatar: "/api/placeholder/40/40"
    },
    vehicle: {
      model: "VF8 Plus",
      vin: "VF8ABC123456789",
      purchaseDate: "2024-03-15",
      odometer: "12,450 km",
      color: "Arctic White"
    },
    assignedTech: {
      name: "Trần Minh Bảo",
      phone: "+84 902 345 678",
      expertise: "Battery Systems",
      avatar: "/api/placeholder/40/40"
    },
    dateCreated: "2025-01-15",
    complaint: "Vehicle experiencing reduced battery range and charging issues"
  };

  const diagnosticReports = [
    {
      id: "DR-001",
      title: "Battery System Diagnostic",
      technician: "Trần Minh Bảo",
      status: "approved",
      dateCreated: "2025-01-16",
      diagnosis: "Battery pack showing degraded cells in module 3. Recommend replacement of affected battery module.",
      requiredParts: ["Battery Module BM-VF8-03", "Cooling System Gasket CSG-001"],
      photos: 3
    },
    {
      id: "DR-002", 
      title: "Charging System Analysis",
      technician: "Trần Minh Bảo",
      status: "pending",
      dateCreated: "2025-01-17",
      diagnosis: "Onboard charger operating within normal parameters. No hardware issues detected.",
      requiredParts: [],
      photos: 2
    }
  ];

  const partShipments = [
    {
      id: "PS-2025-001",
      status: "shipped",
      shippedDate: "2025-01-18",
      expectedArrival: "2025-01-20",
      items: ["Battery Module BM-VF8-03", "Cooling System Gasket CSG-001"],
      trackingNumber: "VT987654321"
    }
  ];

  const activityLog = [
    {
      id: "1",
      user: "System",
      action: "Case status updated to 'Manufacturer Review'",
      timestamp: "2025-01-17 14:30",
      type: "status"
    },
    {
      id: "2",
      user: "Trần Minh Bảo",
      action: "Added charging system diagnostic report",
      timestamp: "2025-01-17 10:45",
      type: "report"
    },
    {
      id: "3",
      user: "Nguyễn Thu Hà",
      action: "Submitted case to manufacturer for approval",
      timestamp: "2025-01-16 16:20",
      type: "submission"
    },
    {
      id: "4",
      user: "Trần Minh Bảo",
      action: "Completed initial battery system diagnostic",
      timestamp: "2025-01-16 11:30",
      type: "progress"
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cases
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-foreground">{caseData.id}</h1>
              <StatusBadge status={caseData.status} />
            </div>
            <p className="text-muted-foreground mt-1">Created on {caseData.dateCreated}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reports" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Diagnostic Reports</span>
              </TabsTrigger>
              <TabsTrigger value="shipments" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Part Shipments</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Activity Log</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-4">
              {diagnosticReports.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No diagnostic reports</h3>
                    <p className="text-muted-foreground">Waiting for technician to add diagnostic reports</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {diagnosticReports.map((report) => (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                            <ReportStatusBadge status={report.status} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {report.dateCreated}
                          </div>
                        </div>
                        <CardDescription className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4" />
                          <span>By {report.technician}</span>
                          {report.photos > 0 && (
                            <>
                              <span>•</span>
                              <span>{report.photos} photos attached</span>
                            </>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Diagnosis</h4>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                              {report.diagnosis}
                            </p>
                          </div>
                          
                          {report.requiredParts.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2">Required Parts</h4>
                              <div className="flex flex-wrap gap-2">
                                {report.requiredParts.map((part, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {part}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shipments" className="space-y-4">
              {partShipments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No part shipments</h3>
                    <p className="text-muted-foreground">No parts have been shipped for this case yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {partShipments.map((shipment) => (
                    <Card key={shipment.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{shipment.id}</CardTitle>
                          <Badge variant="outline" className="capitalize border-success text-success bg-success/5">
                            {shipment.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-1">
                              <Calendar className="h-4 w-4" />
                              <span>Shipped: {shipment.shippedDate}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Expected: {shipment.expectedArrival}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Tracking: {shipment.trackingNumber}</p>
                            <p className="text-xs text-muted-foreground">{shipment.items.join(", ")}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Case Activity Timeline</CardTitle>
                  <CardDescription>Chronological history of all case activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activityLog.map((activity, index) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            activity.type === 'status' ? 'bg-primary' :
                            activity.type === 'report' ? 'bg-success' :
                            activity.type === 'submission' ? 'bg-warning' :
                            'bg-muted-foreground'
                          }`} />
                          {index < activityLog.length - 1 && (
                            <div className="w-px h-8 bg-border mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">
                              {activity.action}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.timestamp}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            by {activity.user}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Customer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={caseData.customer.avatar} />
                  <AvatarFallback>{caseData.customer.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{caseData.customer.name}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{caseData.customer.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{caseData.customer.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Car className="h-4 w-4" />
                <span>Vehicle</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{caseData.vehicle.model}</p>
                <p className="text-xs font-mono text-muted-foreground">{caseData.vehicle.vin}</p>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Purchase: {caseData.vehicle.purchaseDate}</div>
                <div>Odometer: {caseData.vehicle.odometer}</div>
                <div>Color: {caseData.vehicle.color}</div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Technician */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Wrench className="h-4 w-4" />
                <span>Assigned Technician</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={caseData.assignedTech.avatar} />
                  <AvatarFallback>{caseData.assignedTech.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{caseData.assignedTech.name}</p>
                  <p className="text-xs text-muted-foreground">{caseData.assignedTech.expertise}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                <UserPlus className="h-3 w-3 mr-2" />
                Reassign
              </Button>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" size="sm">
                <Send className="h-4 w-4 mr-2" />
                Submit to Manufacturer
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
              <Button variant="destructive" className="w-full" size="sm">
                <X className="h-4 w-4 mr-2" />
                Close Case
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CaseDetailViewPro;