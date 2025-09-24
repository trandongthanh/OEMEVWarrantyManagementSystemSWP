import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Plus,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Camera,
  QrCode,
  Wrench,
  Upload
} from "lucide-react";

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    "new": { variant: "outline" as const, text: "New Assignment", className: "border-info text-info bg-info/5" },
    "in-progress": { variant: "default" as const, text: "In Progress", className: "bg-primary text-primary-foreground" },
    "awaiting-parts": { variant: "outline" as const, text: "Awaiting Parts", className: "border-warning text-warning bg-warning/5" },
    "ready-check": { variant: "outline" as const, text: "Ready for Final Check", className: "border-success text-success bg-success/5" }
  };
  
  const config = statusConfig[status as keyof typeof statusConfig];
  return config ? (
    <Badge variant={config.variant} className={`${config.className} text-xs`}>
      {config.text}
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-xs">{status}</Badge>
  );
};

const TechnicianWorkspacePro = () => {
  const [selectedCase, setSelectedCase] = useState<string | null>("WC-25-09-001");
  const [logType, setLogType] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [oldPartSerial, setOldPartSerial] = useState("");
  const [newPartSerial, setNewPartSerial] = useState("");
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [isDiagnosticDialogOpen, setIsDiagnosticDialogOpen] = useState(false);

  // Mock data
  const myTasks = [
    {
      id: "WC-25-09-001",
      customer: "Nguyễn Văn An",
      model: "VF8 Plus",
      vin: "VF8ABC123456789",
      status: "in-progress",
      complaint: "Battery charging issues",
      priority: "high"
    },
    {
      id: "WC-25-09-004",
      customer: "Trần Quốc Huy", 
      model: "VF9 Premium",
      vin: "VF9JKL789012345",
      status: "new",
      complaint: "Air conditioning not working",
      priority: "medium"
    },
    {
      id: "WC-25-09-005",
      customer: "Lê Thu Minh",
      model: "VF8 Eco",
      vin: "VF8MNO345678901", 
      status: "awaiting-parts",
      complaint: "Infotainment system malfunction",
      priority: "low"
    }
  ];

  const selectedCaseData = myTasks.find(task => task.id === selectedCase);

  const handleLogProgress = () => {
    if (logType && progressNote.trim()) {
      // Handle progress logging
      console.log("Logging progress:", { logType, progressNote, oldPartSerial, newPartSerial });
      
      // Reset form
      setLogType("");
      setProgressNote("");
      setOldPartSerial("");
      setNewPartSerial("");
      setIsProgressDialogOpen(false);
    }
  };

  const handleMarkComplete = () => {
    if (selectedCase) {
      // Handle marking work as complete
      console.log("Marking technical work as complete for:", selectedCase);
    }
  };

  const canMarkComplete = selectedCaseData?.status === "ready-check";

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Workspace</h1>
        <p className="text-muted-foreground text-lg mt-1">Manage your assigned warranty cases</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Task List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">My Tasks</CardTitle>
              <CardDescription>Cases assigned to you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {myTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedCase === task.id ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedCase(task.id)}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium text-primary">{task.id}</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{task.customer}</p>
                      <p className="text-xs text-muted-foreground">{task.model}</p>
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      {task.complaint}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Case Workspace */}
        <div className="lg:col-span-2">
          {selectedCaseData ? (
            <div className="space-y-6">
              {/* Case Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedCaseData.id}</CardTitle>
                      <CardDescription className="text-base mt-1">
                        {selectedCaseData.customer} • {selectedCaseData.model}
                      </CardDescription>
                    </div>
                    <StatusBadge status={selectedCaseData.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">VIN</Label>
                      <p className="font-mono text-sm">{selectedCaseData.vin}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Customer Complaint</Label>
                      <p className="text-sm">{selectedCaseData.complaint}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid gap-4 md:grid-cols-3">
                <Dialog open={isDiagnosticDialogOpen} onOpenChange={setIsDiagnosticDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="h-16">
                      <FileText className="h-5 w-5 mr-2" />
                      Add Diagnostic Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add Diagnostic Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="diagnosis">Diagnosis Details</Label>
                        <Textarea
                          id="diagnosis"
                          placeholder="Describe your findings and diagnosis..."
                          className="mt-2 min-h-[120px]"
                        />
                      </div>
                      
                      <div>
                        <Label>Photo/Video Upload</Label>
                        <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
                          <Button variant="outline" size="sm">
                            <Camera className="h-4 w-4 mr-2" />
                            Choose Files
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Required Parts</Label>
                        <Select>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select required parts..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="battery-module">Battery Module BM-VF8-03</SelectItem>
                            <SelectItem value="cooling-gasket">Cooling System Gasket CSG-001</SelectItem>
                            <SelectItem value="inverter">Inverter Unit IV-VF8-01</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex space-x-3 pt-4">
                        <Button variant="outline" className="flex-1">Save as Draft</Button>
                        <Button className="flex-1">Submit Report</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg" className="h-16">
                      <Wrench className="h-5 w-5 mr-2" />
                      Log Progress
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Log Progress / Record Installation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="logType">Log Type</Label>
                        <Select value={logType} onValueChange={setLogType}>
                          <SelectTrigger className="mt-2">
                            <SelectValue placeholder="Select log type..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General Update</SelectItem>
                            <SelectItem value="installation">Part Installation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="progressNote">Progress Note</Label>
                        <Textarea
                          id="progressNote"
                          value={progressNote}
                          onChange={(e) => setProgressNote(e.target.value)}
                          placeholder="Describe the work completed or progress made..."
                          className="mt-2 min-h-[100px]"
                        />
                      </div>

                      {logType === "installation" && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                          <h4 className="font-medium">Part Installation Details</h4>
                          
                          <div>
                            <Label htmlFor="oldSerial">Old Part Serial Number (Removed)</Label>
                            <div className="flex space-x-2 mt-2">
                              <Input
                                id="oldSerial"
                                value={oldPartSerial}
                                onChange={(e) => setOldPartSerial(e.target.value)}
                                placeholder="Enter or scan serial number"
                              />
                              <Button variant="outline" size="icon">
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="newSerial">New Part Serial Number (Installed)</Label>
                            <div className="flex space-x-2 mt-2">
                              <Input
                                id="newSerial"
                                value={newPartSerial}
                                onChange={(e) => setNewPartSerial(e.target.value)}
                                placeholder="Enter or scan serial number"
                              />
                              <Button variant="outline" size="icon">
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex space-x-3 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsProgressDialogOpen(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleLogProgress}
                          disabled={!logType || !progressNote.trim()}
                          className="flex-1"
                        >
                          Log Progress
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  size="lg"
                  className={`h-16 ${!canMarkComplete ? 'opacity-50' : ''}`}
                  disabled={!canMarkComplete}
                  onClick={handleMarkComplete}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Mark Complete
                </Button>
              </div>

              {/* Progress Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Work Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedCaseData.status !== 'new' ? 'bg-success' : 'bg-muted-foreground'
                      }`} />
                      <span className={`text-sm ${
                        selectedCaseData.status !== 'new' ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}>
                        Initial diagnostic completed
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        ['in-progress', 'awaiting-parts', 'ready-check'].includes(selectedCaseData.status) ? 'bg-success' : 'bg-muted-foreground'
                      }`} />
                      <span className={`text-sm ${
                        ['in-progress', 'awaiting-parts', 'ready-check'].includes(selectedCaseData.status) ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}>
                        Repair work in progress
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedCaseData.status === 'ready-check' ? 'bg-warning' : 'bg-muted-foreground'
                      }`} />
                      <span className={`text-sm ${
                        selectedCaseData.status === 'ready-check' ? 'text-foreground font-medium' : 'text-muted-foreground'
                      }`}>
                        Ready for final verification
                      </span>
                    </div>
                  </div>
                  
                  {!canMarkComplete && (
                    <div className="mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <p className="text-sm text-warning-foreground">
                          Complete all repair work before marking as finished
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No case selected</h3>
                <p className="text-muted-foreground">Select a case from your task list to begin working</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianWorkspacePro;