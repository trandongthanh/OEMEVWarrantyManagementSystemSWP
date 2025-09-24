import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Package, 
  Scan, 
  CheckCircle, 
  AlertTriangle, 
  Truck, 
  Eye,
  Search,
  Plus,
  Calendar
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PartShipmentReceptionProps {
  onClose?: () => void;
}

const PartShipmentReception = ({ onClose }: PartShipmentReceptionProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [scannedParts, setScannedParts] = useState<Record<string, string>>({});
  const [verifiedParts, setVerifiedParts] = useState<Set<string>>(new Set());

  const incomingShipments = [
    {
      id: "PS-001",
      caseId: "WC-2024-001",
      status: "in-transit",
      shippedDate: "2024-01-14",
      expectedArrival: "2024-01-18",
      trackingNumber: "VF2024001234",
      supplier: "VinFast Parts Center",
      priority: "high",
      parts: [
        {
          id: "BP-001",
          name: "Battery Cell Module",
          partType: "Battery Component",
          expectedSerial: "BCM-2024-001234",
          quantity: 2,
          verified: false
        },
        {
          id: "TS-001", 
          name: "Thermal Sensor",
          partType: "Sensor",
          expectedSerial: "TS-2024-005678",
          quantity: 1,
          verified: false
        }
      ]
    },
    {
      id: "PS-003",
      caseId: "WC-2024-003",
      status: "arrived",
      shippedDate: "2024-01-15",
      expectedArrival: "2024-01-17",
      trackingNumber: "VF2024001236",
      supplier: "VinFast Parts Center",
      priority: "medium",
      parts: [
        {
          id: "CC-001",
          name: "Charge Controller",
          partType: "Electronic Module",
          expectedSerial: "CC-2024-009876",
          quantity: 1,
          verified: false
        },
        {
          id: "CB-001",
          name: "Charging Cable",
          partType: "Accessory",
          expectedSerial: "CB-2024-005432",
          quantity: 1,
          verified: false
        }
      ]
    },
    {
      id: "PS-004",
      caseId: "WC-2024-002",
      status: "delivered",
      shippedDate: "2024-01-13",
      expectedArrival: "2024-01-16",
      trackingNumber: "VF2024001237",
      supplier: "VinFast Parts Center", 
      priority: "critical",
      parts: [
        {
          id: "MC-001",
          name: "Motor Controller Unit",
          partType: "Drive System",
          expectedSerial: "MCU-2024-001111",
          quantity: 1,
          verified: true
        }
      ]
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "in-transit": { variant: "warning" as const, text: "Đang vận chuyển", icon: Truck },
      "arrived": { variant: "secondary" as const, text: "Đã đến", icon: Package },
      "delivered": { variant: "success" as const, text: "Đã giao", icon: CheckCircle }
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
      critical: { variant: "destructive" as const, text: "Khẩn cấp" },
      high: { variant: "warning" as const, text: "Cao" },
      medium: { variant: "secondary" as const, text: "Trung bình" }
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig];
    if (!config) return null;

    return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>;
  };

  const handleScanPart = (partId: string, scannedSerial: string) => {
    setScannedParts(prev => ({ ...prev, [partId]: scannedSerial }));
  };

  const handleVerifyPart = (partId: string, expectedSerial: string) => {
    const scannedSerial = scannedParts[partId];
    
    if (!scannedSerial) {
      toast({
        title: "Error",
        description: "Please scan or enter the serial number first",
        variant: "destructive"
      });
      return;
    }

    if (scannedSerial === expectedSerial) {
      setVerifiedParts(prev => new Set([...prev, partId]));
      toast({
        title: "Part Verified",
        description: `Part ${partId} has been successfully verified`,
        variant: "default"
      });
    } else {
      toast({
        title: "Verification Failed",
        description: "Serial number does not match expected value",
        variant: "destructive"
      });
    }
  };

  const handleConfirmReception = (shipmentId: string) => {
    const shipment = incomingShipments.find(s => s.id === shipmentId);
    if (!shipment) return;

    const allPartsVerified = shipment.parts.every(part => 
      verifiedParts.has(part.id) || part.verified
    );

    if (!allPartsVerified) {
      toast({
        title: "Cannot Confirm Reception",
        description: "Please verify all parts before confirming reception",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Reception Confirmed",
      description: `Shipment ${shipmentId} has been successfully received`,
      variant: "default"
    });
    setSelectedShipment(null);
  };

  const filteredShipments = incomingShipments.filter(shipment =>
    shipment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedShipmentData = incomingShipments.find(s => s.id === selectedShipment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Part Shipment Reception</h1>
          <p className="text-muted-foreground">
            Receive and verify incoming part shipments
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Shipment ID, Case ID, or Tracking Number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-warning" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-xs text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-secondary" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Arrived</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-success" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Incoming Shipments Table */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Incoming Shipments</CardTitle>
          <CardDescription>
            Track and process all incoming part shipments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment ID</TableHead>
                <TableHead>Case ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Shipped Date</TableHead>
                <TableHead>Expected</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => (
                <TableRow key={shipment.id}>
                  <TableCell className="font-medium">{shipment.id}</TableCell>
                  <TableCell>{shipment.caseId}</TableCell>
                  <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                  <TableCell>{getPriorityBadge(shipment.priority)}</TableCell>
                  <TableCell className="text-sm">{shipment.shippedDate}</TableCell>
                  <TableCell className="text-sm">{shipment.expectedArrival}</TableCell>
                  <TableCell className="font-mono text-xs">{shipment.trackingNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Dialog open={selectedShipment === shipment.id} onOpenChange={(open) => setSelectedShipment(open ? shipment.id : null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Process
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Shipment Details - {shipment.id}</DialogTitle>
                            <DialogDescription>
                              Verify and process incoming parts for Case {shipment.caseId}
                            </DialogDescription>
                          </DialogHeader>

                          {selectedShipmentData && (
                            <div className="space-y-6">
                              {/* Shipment Info */}
                              <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center space-x-2">
                                      <Package className="h-5 w-5 text-primary" />
                                      <div>
                                        <p className="text-sm font-medium">Shipment Status</p>
                                        {getStatusBadge(selectedShipmentData.status)}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-5 w-5 text-primary" />
                                      <div>
                                        <p className="text-sm font-medium">Expected Arrival</p>
                                        <p className="text-sm text-muted-foreground">{selectedShipmentData.expectedArrival}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                                
                                <Card>
                                  <CardContent className="p-4">
                                    <div className="flex items-center space-x-2">
                                      <Truck className="h-5 w-5 text-primary" />
                                      <div>
                                        <p className="text-sm font-medium">Tracking Number</p>
                                        <p className="text-sm font-mono">{selectedShipmentData.trackingNumber}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Parts List */}
                              <Card>
                                <CardHeader>
                                  <CardTitle>Parts to Verify</CardTitle>
                                  <CardDescription>
                                    Scan or enter serial numbers to verify each part
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <div className="space-y-4">
                                    {selectedShipmentData.parts.map((part) => {
                                      const isVerified = verifiedParts.has(part.id) || part.verified;
                                      const scannedSerial = scannedParts[part.id];
                                      
                                      return (
                                        <div key={part.id} className={`border rounded-lg p-4 ${isVerified ? 'border-success bg-success/5' : 'border-border'}`}>
                                          <div className="grid gap-4 md:grid-cols-6 items-center">
                                            <div className="md:col-span-2">
                                              <p className="font-medium">{part.name}</p>
                                              <p className="text-sm text-muted-foreground">{part.partType}</p>
                                              <Badge variant="outline" className="text-xs mt-1">
                                                Qty: {part.quantity}
                                              </Badge>
                                            </div>
                                            
                                            <div>
                                              <p className="text-xs text-muted-foreground">Expected Serial</p>
                                              <p className="text-sm font-mono">{part.expectedSerial}</p>
                                            </div>
                                            
                                            <div className="md:col-span-2">
                                              <div className="flex space-x-2">
                                                <Input
                                                  placeholder="Scan or enter serial number"
                                                  value={scannedSerial || ''}
                                                  onChange={(e) => handleScanPart(part.id, e.target.value)}
                                                  className="font-mono text-xs"
                                                  disabled={isVerified}
                                                />
                                                <Button 
                                                  variant="outline" 
                                                  size="sm"
                                                  disabled={isVerified}
                                                >
                                                  <Scan className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                              {isVerified ? (
                                                <Badge variant="success">
                                                  <CheckCircle className="mr-1 h-3 w-3" />
                                                  Verified
                                                </Badge>
                                              ) : (
                                                <Button
                                                  variant="gradient"
                                                  size="sm"
                                                  onClick={() => handleVerifyPart(part.id, part.expectedSerial)}
                                                  disabled={!scannedSerial}
                                                >
                                                  Verify & Add
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </CardContent>
                              </Card>

                              {/* Actions */}
                              <div className="flex items-center justify-between">
                                <Button variant="outline" onClick={() => setSelectedShipment(null)}>
                                  Cancel
                                </Button>
                                <Button
                                  variant="gradient"
                                  onClick={() => handleConfirmReception(selectedShipmentData.id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Confirm Full Reception
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartShipmentReception;