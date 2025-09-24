import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  Camera,
  Package,
  Car,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  MessageSquare,
  Send
} from "lucide-react";

interface DiagnosticReport {
  id: string;
  summary: string;
  technician: string;
  dateSubmitted: string;
  details: string;
  attachments: number;
  requiredParts: string[];
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
}

interface ClaimData {
  id: string;
  serviceCenter: string;
  dateSubmitted: string;
  status: "pending-review" | "in-review" | "completed";
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  vehicle: {
    vin: string;
    model: string;
    purchaseDate: string;
    odometer: string;
    warrantyExpiry: string;
  };
  reports: DiagnosticReport[];
}

const ClaimReviewInterface = () => {
  const [selectedClaim, setSelectedClaim] = useState<string>("WC-25-09-001");
  const [reportDecisions, setReportDecisions] = useState<Record<string, { status: "approved" | "rejected", reason?: string }>>({});
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // In real app, data would be fetched from API
  const pendingClaims: any[] = [];

  // Mock detailed claim data
  const claimData: ClaimData = {
    id: selectedClaim,
    serviceCenter: "Service Center Ho Chi Minh 1",
    dateSubmitted: "2025-01-15 14:30",
    status: "pending-review",
    customer: {
      name: "Nguyễn Văn A",
      phone: "+84 901 234 567",
      email: "nguyen.van.a@email.com",
      address: "123 Lê Lợi, Quận 1, TP.HCM"
    },
    vehicle: {
      vin: "VF8ABC123456789",
      model: "VinFast VF8 2023",
      purchaseDate: "2023-06-15",
      odometer: "15,420 km",
      warrantyExpiry: "2026-06-15"
    },
    reports: [
      {
        id: "DR-001",
        summary: "Battery capacity degradation detected",
        technician: "Trần Minh B",
        dateSubmitted: "2025-01-15 10:30",
        details: "Initial diagnostic shows 15% capacity loss in battery cells 3-6. Temperature monitoring indicates overheating in charging cycles. Requires battery module replacement and cooling system inspection.",
        attachments: 8,
        requiredParts: ["Battery Cell Module x2", "Thermal Management Sensor"],
        status: "pending"
      },
      {
        id: "DR-002",
        summary: "Thermal management system inspection",
        technician: "Trần Minh B",
        dateSubmitted: "2025-01-15 16:45",
        details: "Cooling system functioning within normal parameters. Thermal sensors show consistent readings. No immediate issues detected with cooling pump or radiator systems.",
        attachments: 4,
        requiredParts: [],
        status: "pending"
      },
      {
        id: "DR-003",
        summary: "Charging port connection analysis",
        technician: "Lê Thị C",
        dateSubmitted: "2025-01-16 09:15",
        details: "Charging port shows signs of wear but connections are secure. Minor corrosion detected on pins 2 and 5. Recommend cleaning and protective coating application.",
        attachments: 3,
        requiredParts: ["Charging Port Protection Kit"],
        status: "pending"
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "pending-review": { variant: "warning" as const, text: "Pending Review", icon: Clock },
      "in-review": { variant: "default" as const, text: "In Review", icon: Eye },
      "completed": { variant: "success" as const, text: "Completed", icon: CheckCircle }
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
    const config = {
      high: { variant: "destructive" as const, text: "High Priority" },
      medium: { variant: "warning" as const, text: "Medium Priority" },
      low: { variant: "secondary" as const, text: "Low Priority" }
    };

    const priorityConfig = config[priority as keyof typeof config];
    return priorityConfig ? <Badge variant={priorityConfig.variant} className="text-xs">{priorityConfig.text}</Badge> : null;
  };

  const getReportStatusBadge = (reportId: string, originalStatus: string) => {
    const decision = reportDecisions[reportId];
    if (decision) {
      return decision.status === "approved" ?
        <Badge variant="success">Approved</Badge> :
        <Badge variant="destructive">Rejected</Badge>;
    }
    return <Badge variant="warning">Pending Decision</Badge>;
  };

  const handleApproveReport = (reportId: string) => {
    setReportDecisions(prev => ({
      ...prev,
      [reportId]: { status: "approved" }
    }));
  };

  const handleRejectReport = (reportId: string) => {
    setShowRejectDialog(reportId);
  };

  const confirmRejectReport = () => {
    if (showRejectDialog && rejectionReason.trim()) {
      setReportDecisions(prev => ({
        ...prev,
        [showRejectDialog]: { status: "rejected", reason: rejectionReason.trim() }
      }));
      setShowRejectDialog(null);
      setRejectionReason("");
    }
  };

  const canFinalize = claimData.reports.every(report => reportDecisions[report.id]);

  const handleFinalizeDecisions = () => {
    // Handle submission of all decisions
    console.log("Finalizing decisions:", reportDecisions);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Claims Queue */}
      <div className="w-80 border-r border-border bg-muted/20">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Claims Review Queue</h2>
          <p className="text-sm text-muted-foreground">Pending manufacturer approval</p>
        </div>

        <div className="overflow-y-auto h-full pb-20">
          {pendingClaims.map((claim) => (
            <Card
              key={claim.id}
              className={`m-2 cursor-pointer transition-all duration-200 hover:shadow-md ${selectedClaim === claim.id ? 'ring-2 ring-primary border-primary' : ''
                }`}
              onClick={() => setSelectedClaim(claim.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-sm">{claim.id}</span>
                    {getPriorityBadge(claim.priority)}
                  </div>

                  <div>
                    <p className="font-medium text-sm">{claim.serviceCenter}</p>
                    <p className="text-xs text-muted-foreground">Submitted {claim.dateSubmitted}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    {getStatusBadge(claim.status)}
                    <span className="text-xs text-muted-foreground">
                      {claim.daysWaiting} days waiting
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Panel - Claim Details */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Claim Review - {claimData.id}</h1>
              <p className="text-muted-foreground">Submitted by {claimData.serviceCenter}</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Request More Info
              </Button>
              <Button
                variant="gradient"
                disabled={!canFinalize}
                onClick={handleFinalizeDecisions}
              >
                <Send className="mr-2 h-4 w-4" />
                Finalize & Submit Decisions
              </Button>
            </div>
          </div>

          {/* Status Overview */}
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{Object.values(reportDecisions).filter(d => d.status === "approved").length}</p>
                  <p className="text-sm text-muted-foreground">Reports Approved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{Object.values(reportDecisions).filter(d => d.status === "rejected").length}</p>
                  <p className="text-sm text-muted-foreground">Reports Rejected</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{claimData.reports.length - Object.keys(reportDecisions).length}</p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="reports" className="space-y-4">
            <TabsList>
              <TabsTrigger value="reports">Diagnostic Reports ({claimData.reports.length})</TabsTrigger>
              <TabsTrigger value="details">Case Details</TabsTrigger>
              <TabsTrigger value="history">Review History</TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-4">
              {claimData.reports.map((report) => (
                <Card key={report.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">{report.id} - {report.summary}</CardTitle>
                          <CardDescription>
                            By {report.technician} on {report.dateSubmitted}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getReportStatusBadge(report.id, report.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm">{report.details}</p>
                    </div>

                    {report.requiredParts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Required Parts:</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {report.requiredParts.map((part, index) => (
                            <Badge key={index} variant="outline">{part}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Camera className="h-4 w-4" />
                          <span>{report.attachments} attachments</span>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>

                      {!reportDecisions[report.id] && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectReport(report.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApproveReport(report.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}

                      {reportDecisions[report.id]?.status === "rejected" && (
                        <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                          <p className="text-sm font-medium text-destructive mb-1">Rejection Reason:</p>
                          <p className="text-sm">{reportDecisions[report.id].reason}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
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
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">{claimData.customer.name}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{claimData.customer.phone}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{claimData.customer.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{claimData.customer.address}</span>
                      </div>
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
                        <p className="text-xs text-muted-foreground">Model</p>
                        <p className="text-sm font-medium">{claimData.vehicle.model}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">VIN</p>
                        <p className="text-sm font-medium font-mono">{claimData.vehicle.vin}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Purchase Date</p>
                        <p className="text-sm font-medium">{claimData.vehicle.purchaseDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Odometer</p>
                        <p className="text-sm font-medium">{claimData.vehicle.odometer}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Warranty Expiry</p>
                        <p className="text-sm font-medium">{claimData.vehicle.warrantyExpiry}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Review History</CardTitle>
                  <CardDescription>Timeline of review activities for this claim</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">SY</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">Claim submitted for review</p>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>Service Center Staff</span>
                          <span>•</span>
                          <span>{claimData.dateSubmitted}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!showRejectDialog} onOpenChange={() => setShowRejectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Diagnostic Report</DialogTitle>
            <DialogDescription>
              Please provide a detailed reason for rejecting this diagnostic report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRejectReport}
                disabled={!rejectionReason.trim()}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClaimReviewInterface;