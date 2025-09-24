import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Truck, 
  Scan, 
  CheckCircle, 
  Clock, 
  MapPin,
  Printer,
  AlertTriangle,
  Search,
  Camera,
  BarcodeIcon as Barcode,
  Factory,
  Phone
} from "lucide-react";

interface DispatchItem {
  partId: string;
  partName: string;
  partType: string;
  quantity: number;
  serialNumbers: string[];
  scannedSerials: string[];
  requiresSerial: boolean;
}

interface DispatchOrder {
  id: string;
  caseId: string;
  serviceCenter: {
    name: string;
    address: string;
    contactPerson: string;
    phone: string;
  };
  dateApproved: string;
  priority: "high" | "medium" | "low";
  items: DispatchItem[];
  status: "pending" | "in-progress" | "ready-ship" | "shipped";
}

const WarehouseDispatchInterface = () => {
  const [selectedOrder, setSelectedOrder] = useState<string>("DO-2025-001");
  const [scanningMode, setScanningMode] = useState<string | null>(null);
  const [tempSerial, setTempSerial] = useState("");
  const [showShipDialog, setShowShipDialog] = useState(false);

  // Mock dispatch orders
  const dispatchOrders: DispatchOrder[] = [
    {
      id: "DO-2025-001",
      caseId: "WC-25-09-001",
      serviceCenter: {
        name: "Service Center Ho Chi Minh 1",
        address: "123 Nguyễn Văn Cừ, Quận 1, TP.HCM",
        contactPerson: "Nguyễn Thị Manager",
        phone: "+84 901 234 567"
      },
      dateApproved: "2025-01-16 14:30",
      priority: "high",
      status: "pending",
      items: [
        {
          partId: "BP-VF8-001",
          partName: "Battery Cell Module",
          partType: "Critical Component",
          quantity: 2,
          serialNumbers: ["BP240115001", "BP240115002"],
          scannedSerials: [],
          requiresSerial: true
        },
        {
          partId: "TS-VF8-003", 
          partName: "Thermal Management Sensor",
          partType: "Sensor",
          quantity: 1,
          serialNumbers: ["TS240116001"],
          scannedSerials: [],
          requiresSerial: true
        }
      ]
    },
    {
      id: "DO-2025-002",
      caseId: "WC-25-09-008",
      serviceCenter: {
        name: "Service Center Hanoi 2",
        address: "456 Láng Hạ, Ba Đình, Hà Nội", 
        contactPerson: "Trần Văn Supervisor",
        phone: "+84 902 345 678"
      },
      dateApproved: "2025-01-15 16:45",
      priority: "medium",
      status: "in-progress",
      items: [
        {
          partId: "CP-VF9-002",
          partName: "Charging Port Protection Kit",
          partType: "Accessory",
          quantity: 1,
          serialNumbers: ["CP240115003"],
          scannedSerials: ["CP240115003"],
          requiresSerial: true
        },
        {
          partId: "DS-VF9-001",
          partName: "Display Screen Assembly",
          partType: "Electronic Component",
          quantity: 1,
          serialNumbers: ["DS240116004"],
          scannedSerials: [],
          requiresSerial: true
        }
      ]
    }
  ];

  const selectedOrderData = dispatchOrders.find(order => order.id === selectedOrder);

  const getPriorityBadge = (priority: string) => {
    const config = {
      high: { variant: "destructive" as const, text: "High Priority" },
      medium: { variant: "warning" as const, text: "Medium Priority" },
      low: { variant: "secondary" as const, text: "Low Priority" }
    };
    
    const priorityConfig = config[priority as keyof typeof config];
    return priorityConfig ? <Badge variant={priorityConfig.variant} className="text-xs">{priorityConfig.text}</Badge> : null;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "warning" as const, text: "Pending", icon: Clock },
      "in-progress": { variant: "default" as const, text: "In Progress", icon: Package },
      "ready-ship": { variant: "success" as const, text: "Ready to Ship", icon: Truck },
      shipped: { variant: "secondary" as const, text: "Shipped", icon: CheckCircle }
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

  const handleScanSerial = (itemId: string, serial: string) => {
    // Update scanned serials for the item
    if (selectedOrderData) {
      const updatedOrder = {
        ...selectedOrderData,
        items: selectedOrderData.items.map(item => 
          item.partId === itemId 
            ? { ...item, scannedSerials: [...item.scannedSerials, serial] }
            : item
        )
      };
      // In real app, would update state/database
      console.log("Updated order:", updatedOrder);
    }
    setScanningMode(null);
    setTempSerial("");
  };

  const getItemCompletionStatus = (item: DispatchItem) => {
    if (!item.requiresSerial) return "complete";
    const scannedCount = item.scannedSerials.length;
    const requiredCount = item.quantity;
    
    if (scannedCount === 0) return "pending";
    if (scannedCount < requiredCount) return "partial";
    return "complete";
  };

  const isOrderComplete = () => {
    return selectedOrderData?.items.every(item => 
      getItemCompletionStatus(item) === "complete"
    ) || false;
  };

  const handleConfirmShipment = () => {
    console.log("Confirming shipment for order:", selectedOrder);
    setShowShipDialog(false);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Orders Queue */}
      <div className="w-80 border-r border-border bg-muted/20">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Dispatch Queue</h2>
          <p className="text-sm text-muted-foreground">Orders ready for processing</p>
        </div>
        
        <div className="overflow-y-auto h-full pb-20">
          {dispatchOrders.map((order) => (
            <Card 
              key={order.id}
              className={`m-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedOrder === order.id ? 'ring-2 ring-primary border-primary' : ''
              }`}
              onClick={() => setSelectedOrder(order.id)}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-sm">{order.id}</span>
                    {getPriorityBadge(order.priority)}
                  </div>
                  
                  <div>
                    <p className="font-medium text-sm">{order.serviceCenter.name}</p>
                    <p className="text-xs text-muted-foreground">Case: {order.caseId}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-muted-foreground">
                      {order.items.length} items
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Panel - Order Processing */}
      <div className="flex-1 overflow-y-auto">
        {selectedOrderData && (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Dispatch Order - {selectedOrderData.id}</h1>
                <p className="text-muted-foreground">Case {selectedOrderData.caseId} - {selectedOrderData.serviceCenter.name}</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  Check Inventory
                </Button>
                <Button 
                  variant="gradient" 
                  disabled={!isOrderComplete()}
                  onClick={() => setShowShipDialog(true)}
                >
                  <Truck className="mr-2 h-4 w-4" />
                  Confirm Shipment & Print Label
                </Button>
              </div>
            </div>

            {/* Destination Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-success" />
                  <span>Destination Service Center</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="font-medium text-lg">{selectedOrderData.serviceCenter.name}</p>
                    <p className="text-muted-foreground">{selectedOrderData.serviceCenter.address}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Factory className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Contact: {selectedOrderData.serviceCenter.contactPerson}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedOrderData.serviceCenter.phone}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items Processing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Items to Ship ({selectedOrderData.items.length})</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedOrderData.items.filter(item => getItemCompletionStatus(item) === "complete").length} of {selectedOrderData.items.length} ready
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedOrderData.items.map((item, index) => {
                    const completionStatus = getItemCompletionStatus(item);
                    
                    return (
                      <Card key={item.partId} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            {/* Item Header */}
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{item.partName}</p>
                                <p className="text-sm text-muted-foreground">{item.partType} - {item.partId}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">Qty: {item.quantity}</Badge>
                                <Badge variant={
                                  completionStatus === "complete" ? "success" :
                                  completionStatus === "partial" ? "warning" : "secondary"
                                }>
                                  {completionStatus === "complete" ? "Ready" :
                                   completionStatus === "partial" ? "Partial" : "Pending"}
                                </Badge>
                              </div>
                            </div>

                            {/* Serial Number Scanning */}
                            {item.requiresSerial && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">Serial Numbers Required:</p>
                                  <span className="text-sm text-muted-foreground">
                                    {item.scannedSerials.length} of {item.quantity} scanned
                                  </span>
                                </div>

                                {/* Expected Serial Numbers */}
                                <div className="grid gap-2 md:grid-cols-2">
                                  {item.serialNumbers.map((serial, serialIndex) => {
                                    const isScanned = item.scannedSerials.includes(serial);
                                    
                                    return (
                                      <div key={serialIndex} className={`p-3 rounded-lg border-2 ${
                                        isScanned ? 'border-success bg-success/10' : 'border-border bg-muted/30'
                                      }`}>
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <p className="font-mono text-sm font-medium">{serial}</p>
                                            <p className="text-xs text-muted-foreground">Expected Serial #{serialIndex + 1}</p>
                                          </div>
                                          {isScanned ? (
                                            <CheckCircle className="h-5 w-5 text-success" />
                                          ) : (
                                            <div className="flex space-x-1">
                                              <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => setScanningMode(`${item.partId}-${serialIndex}`)}
                                              >
                                                <Camera className="h-3 w-3 mr-1" />
                                                Scan
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {/* Manual Serial Input */}
                                        {scanningMode === `${item.partId}-${serialIndex}` && (
                                          <div className="mt-3 pt-3 border-t border-border">
                                            <div className="flex space-x-2">
                                              <Input
                                                placeholder="Scan or enter serial number..."
                                                value={tempSerial}
                                                onChange={(e) => setTempSerial(e.target.value)}
                                                className="font-mono"
                                              />
                                              <Button 
                                                size="sm"
                                                onClick={() => handleScanSerial(item.partId, tempSerial)}
                                                disabled={!tempSerial.trim()}
                                              >
                                                Confirm
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="ghost"
                                                onClick={() => {
                                                  setScanningMode(null);
                                                  setTempSerial("");
                                                }}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className={`${isOrderComplete() ? 'border-success bg-success/5' : 'border-warning bg-warning/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isOrderComplete() ? (
                      <CheckCircle className="h-6 w-6 text-success" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-warning" />
                    )}
                    <div>
                      <p className="font-medium">
                        {isOrderComplete() ? "Order Ready for Shipment" : "Order Incomplete"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isOrderComplete() 
                          ? "All items have been scanned and verified"
                          : "Please complete serial number scanning for all items"
                        }
                      </p>
                    </div>
                  </div>
                  
                  {isOrderComplete() && (
                    <Button variant="gradient" onClick={() => setShowShipDialog(true)}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Shipping Label
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Shipment Confirmation Dialog */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Shipment</DialogTitle>
            <DialogDescription>
              Please review and confirm the shipment details before proceeding.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrderData && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="font-medium text-sm mb-1">Dispatch Order</p>
                  <p className="font-mono text-lg font-bold">{selectedOrderData.id}</p>
                </div>
                <div>
                  <p className="font-medium text-sm mb-1">Destination</p>
                  <p>{selectedOrderData.serviceCenter.name}</p>
                </div>
              </div>
              
              <div>
                <p className="font-medium text-sm mb-2">Items Summary</p>
                <div className="bg-muted/50 p-3 rounded-lg">
                  {selectedOrderData.items.map(item => (
                    <div key={item.partId} className="flex justify-between text-sm">
                      <span>{item.partName}</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowShipDialog(false)}>
                  Cancel
                </Button>
                <Button variant="gradient" onClick={handleConfirmShipment}>
                  <Truck className="mr-2 h-4 w-4" />
                  Confirm Shipment & Print Label
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarehouseDispatchInterface;