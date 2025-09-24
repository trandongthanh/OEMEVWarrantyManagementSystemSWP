import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle,
  X,
  Eye,
  Clock,
  AlertTriangle,
  Car,
  User,
  MapPin,
  Calendar,
  FileText,
  Camera,
  Send,
  ChevronRight
} from "lucide-react";

interface ReportDecision {
  reportId: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
}

const ClaimReviewInterfacePro = () => {
  const [selectedClaim, setSelectedClaim] = useState("WC-25-09-001");
  const [decisions, setDecisions] = useState<Record<string, ReportDecision>>({});
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [pendingRejectReportId, setPendingRejectReportId] = useState("");

  // Mock data for pending claims queue
  const pendingClaims = [
    {
      id: "WC-25-09-001",
      serviceCenter: "VinFast Service Center Hanoi",
      customer: "Nguyễn Văn An",
      vin: "VF8ABC123456789",
      model: "VF8 Plus",
      dateSubmitted: "2025-01-17",
      priority: "high",
      reportsCount: 2
    },
    {
      id: "WC-25-09-006",
      serviceCenter: "VinFast Service Center HCMC",
      customer: "Trần Thị Bích",
      vin: "VF9DEF456789012",
      model: "VF9 Premium",
      dateSubmitted: "2025-01-16",
      priority: "medium",
      reportsCount: 1
    },
    {
      id: "WC-25-09-007",
      serviceCenter: "VinFast Service Center Da Nang",
      customer: "Lê Minh Hoàng",
      vin: "VF8GHI789012345",
      model: "VF8 Eco",
      dateSubmitted: "2025-01-15",
      priority: "low",
      reportsCount: 3
    }
  ];

  // Mock data for selected claim details
  const claimDetails = {
    id: "WC-25-09-001",
    serviceCenter: {
      name: "VinFast Service Center Hanoi",
      address: "123 Cầu Giấy Street, Cầu Giấy District, Hanoi",
      contact: "+84 24 1234 5678"
    },
    customer: {
      name: "Nguyễn Văn An",
      phone: "+84 901 234 567",
      email: "nguyen.van.an@email.com"
    },
    vehicle: {
      model: "VF8 Plus",
      vin: "VF8ABC123456789",
      purchaseDate: "2024-03-15",
      odometer: "12,450 km",
      color: "Arctic White"
    },
    complaint: "Vehicle experiencing reduced battery range and charging issues. Customer reports 40% reduction in driving range.",
    submittedBy: "Nguyễn Thu Hà",
    dateSubmitted: "2025-01-17",
    diagnosticReports: [
      {
        id: "DR-001",
        title: "Battery System Diagnostic",
        technician: "Trần Minh Bảo",
        diagnosis: "Battery pack showing degraded cells in module 3. Thermal runaway protection triggered twice during charging cycles. Cell voltage imbalance detected across 4 cells within module. Recommend immediate replacement of battery module BM-VF8-03 and cooling system gasket to prevent further degradation.",
        requiredParts: ["Battery Module BM-VF8-03 ($2,850)", "Cooling System Gasket CSG-001 ($45)"],
        photos: [
          { id: 1, description: "Battery module thermal imaging showing hot spots" },
          { id: 2, description: "Cell voltage readings display" },
          { id: 3, description: "Physical inspection of battery connections" }
        ],
        estimatedCost: 2895
      },
      {
        id: "DR-002",
        title: "Charging System Analysis",
        technician: "Trần Minh Bảo", 
        diagnosis: "Onboard charger operating within normal parameters. DC-DC converter efficiency at 94.2% (within spec). AC charging tested at 7.2kW with no faults detected. No hardware issues identified in charging system components.",
        requiredParts: [],
        photos: [
          { id: 4, description: "Charging system diagnostic readout" },
          { id: 5, description: "Onboard charger inspection" }
        ],
        estimatedCost: 0
      }
    ]
  };

  const handleApproveReport = (reportId: string) => {
    setDecisions(prev => ({
      ...prev,
      [reportId]: { reportId, status: 'approved' }
    }));
  };

  const handleRejectReport = (reportId: string) => {
    setPendingRejectReportId(reportId);
    setIsRejectDialogOpen(true);
  };

  const confirmRejectReport = () => {
    if (rejectReason.trim() && pendingRejectReportId) {
      setDecisions(prev => ({
        ...prev,
        [pendingRejectReportId]: { 
          reportId: pendingRejectReportId, 
          status: 'rejected',
          rejectReason: rejectReason.trim()
        }
      }));
      
      setRejectReason("");
      setPendingRejectReportId("");
      setIsRejectDialogOpen(false);
    }
  };

  const canFinalize = claimDetails.diagnosticReports.every(report => 
    decisions[report.id]?.status === 'approved' || decisions[report.id]?.status === 'rejected'
  );

  const handleFinalize = () => {
    if (canFinalize) {
      console.log("Finalizing decisions:", decisions);
      // Handle finalization logic
    }
  };

  const getReportStatus = (reportId: string) => {
    const decision = decisions[reportId];
    if (!decision) return 'pending';
    return decision.status;
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { className: "bg-destructive/10 text-destructive border-destructive" },
      medium: { className: "bg-warning/10 text-warning border-warning" },
      low: { className: "bg-muted text-muted-foreground border-muted-foreground" }
    };
    
    const style = config[priority as keyof typeof config] || config.medium;
    return (
      <Badge variant="outline" className={`${style.className} text-xs capitalize`}>
        {priority}
      </Badge>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Claims Queue */}
      <div className="w-80 border-r bg-card">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Claims Pending Review</h2>
          <p className="text-sm text-muted-foreground mt-1">{pendingClaims.length} claims awaiting decision</p>
        </div>
        
        <div className="overflow-y-auto h-full pb-20">
          {pendingClaims.map((claim) => (
            <div
              key={claim.id}
              className={`p-4 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                selectedClaim === claim.id ? 'bg-primary/5 border-r-4 border-r-primary' : ''
              }`}
              onClick={() => setSelectedClaim(claim.id)}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-primary">{claim.id}</span>
                  {getPriorityBadge(claim.priority)}
                </div>
                
                <div>
                  <p className="font-medium text-sm">{claim.customer}</p>
                  <p className="text-xs text-muted-foreground">{claim.model} • {claim.vin}</p>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{claim.serviceCenter}</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>Submitted {claim.dateSubmitted}</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <FileText className="h-3 w-3" />
                    <span>{claim.reportsCount} diagnostic reports</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Claim Details */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{claimDetails.id}</h1>
              <p className="text-muted-foreground">Submitted by {claimDetails.submittedBy} on {claimDetails.dateSubmitted}</p>
            </div>
            <Button 
              size="lg"
              disabled={!canFinalize}
              onClick={handleFinalize}
              className={`${!canFinalize ? 'opacity-50' : 'animate-pulse-glow'}`}
            >
              <Send className="h-4 w-4 mr-2" />
              Finalize & Submit Decisions
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content - Reports */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Customer Complaint</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm bg-muted p-4 rounded-lg">{claimDetails.complaint}</p>
                </CardContent>
              </Card>

              {/* Diagnostic Reports for Review */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Reports for Approval</h2>
                
                {claimDetails.diagnosticReports.map((report, index) => {
                  const status = getReportStatus(report.id);
                  const decision = decisions[report.id];
                  
                  return (
                    <Card key={report.id} className={`border-l-4 ${
                      status === 'approved' ? 'border-l-success bg-success/5' :
                      status === 'rejected' ? 'border-l-destructive bg-destructive/5' :
                      'border-l-warning bg-warning/5'
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <div className="flex items-center space-x-2">
                            {status === 'pending' && (
                              <Badge variant="outline" className="border-warning text-warning bg-warning/5">
                                <Clock className="h-3 w-3 mr-1" />
                                Awaiting Decision
                              </Badge>
                            )}
                            {status === 'approved' && (
                              <Badge variant="outline" className="border-success text-success bg-success/5">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approved
                              </Badge>
                            )}
                            {status === 'rejected' && (
                              <Badge variant="outline" className="border-destructive text-destructive bg-destructive/5">
                                <X className="h-3 w-3 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription>By {report.technician}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Diagnosis</h4>
                          <p className="text-sm bg-muted p-3 rounded-md">{report.diagnosis}</p>
                        </div>

                        {report.requiredParts.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Required Parts & Cost</h4>
                            <div className="space-y-1">
                              {report.requiredParts.map((part, partIndex) => (
                                <div key={partIndex} className="text-sm bg-accent p-2 rounded flex items-center justify-between">
                                  <span>{part}</span>
                                </div>
                              ))}
                              <div className="font-semibold text-right pt-2 border-t">
                                Total: ${report.estimatedCost.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium mb-2 flex items-center">
                            <Camera className="h-4 w-4 mr-2" />
                            Attached Photos ({report.photos.length})
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {report.photos.map((photo) => (
                              <div key={photo.id} className="text-xs bg-muted p-2 rounded flex items-center">
                                <Eye className="h-3 w-3 mr-2" />
                                <span className="truncate">{photo.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {status === 'rejected' && decision?.rejectReason && (
                          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <h4 className="font-medium text-destructive mb-1">Rejection Reason</h4>
                            <p className="text-sm text-destructive">{decision.rejectReason}</p>
                          </div>
                        )}

                        {status === 'pending' && (
                          <div className="flex space-x-3 pt-4 border-t">
                            <Button 
                              onClick={() => handleApproveReport(report.id)}
                              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Approve Report
                            </Button>
                            <Button 
                              variant="destructive" 
                              onClick={() => handleRejectReport(report.id)}
                              className="flex-1"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject Report
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Sidebar - Claim Information */}
            <div className="space-y-6">
              {/* Service Center Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Service Center
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium text-sm">{claimDetails.serviceCenter.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{claimDetails.serviceCenter.address}</p>
                    <p className="text-xs text-muted-foreground">{claimDetails.serviceCenter.contact}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/api/placeholder/40/40" />
                      <AvatarFallback>{claimDetails.customer.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{claimDetails.customer.name}</p>
                      <p className="text-xs text-muted-foreground">{claimDetails.customer.phone}</p>
                      <p className="text-xs text-muted-foreground truncate">{claimDetails.customer.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Vehicle Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Car className="h-4 w-4 mr-2" />
                    Vehicle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{claimDetails.vehicle.model}</p>
                    <p className="text-xs font-mono text-muted-foreground">{claimDetails.vehicle.vin}</p>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Purchase: {claimDetails.vehicle.purchaseDate}</div>
                    <div>Odometer: {claimDetails.vehicle.odometer}</div>
                    <div>Color: {claimDetails.vehicle.color}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Indicator */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Review Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {claimDetails.diagnosticReports.map((report, index) => (
                      <div key={report.id} className="flex items-center justify-between text-sm">
                        <span className="truncate">{report.title}</span>
                        <div className="flex items-center">
                          {getReportStatus(report.id) === 'pending' && <Clock className="h-4 w-4 text-warning" />}
                          {getReportStatus(report.id) === 'approved' && <CheckCircle className="h-4 w-4 text-success" />}
                          {getReportStatus(report.id) === 'rejected' && <X className="h-4 w-4 text-destructive" />}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!canFinalize && (
                    <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <p className="text-xs text-warning-foreground">Review all reports to finalize</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Report Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Diagnostic Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">Reason for rejection *</Label>
              <Textarea
                id="rejectReason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejecting this report..."
                className="mt-2 min-h-[100px]"
                required
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsRejectDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmRejectReport}
                disabled={!rejectReason.trim()}
                className="flex-1"
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

export default ClaimReviewInterfacePro;