import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { processingRecordsService, ProcessingRecord, ProcessingRecordsByStatus } from "@/services/processingRecordsService";
import { caseLineService, CaseLineRequest } from "@/services/caseLineService";
import { RefreshCw, User, Car, Wrench, Calendar, Gauge, FileText, AlertCircle, Eye, Search, X, Camera, Plus } from "lucide-react";

interface CaseLine {
  id: string;
  caseId: string;
  damageLevel: string;
  repairPossibility: string;
  warrantyDecision: string;
  technicianNotes: string;
  photos: string[];
  photoFiles?: File[];
  createdDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
}

interface ProcessingRecordsViewProps {
  onCaseLineCreated?: (caseLine: CaseLine) => void;
}

const ProcessingRecordsView: React.FC<ProcessingRecordsViewProps> = ({ onCaseLineCreated }) => {
  const [recordsByStatus, setRecordsByStatus] = useState<ProcessingRecordsByStatus>({
    CHECKED_IN: [],
    IN_DIAGNOSIS: [],
    WAITING_FOR_PARTS: [],
    IN_REPAIR: [],
    COMPLETED: [],
    PAID: [],
    CANCELLED: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<ProcessingRecord | null>(null);
  const [viewCaseModalOpen, setViewCaseModalOpen] = useState(false);
  const [viewReportModalOpen, setViewReportModalOpen] = useState(false);
  const [createIssueDiagnosisModalOpen, setCreateIssueDiagnosisModalOpen] = useState(false);
  
  // Issue Diagnosis Form State - Match API structure
  const [caseLineForm, setCaseLineForm] = useState<CaseLineRequest>({
    diagnosisText: '',
    correctionText: '',
    componentId: null,
    quantity: 1,
    warrantyStatus: 'ELIGIBLE'
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedFileUrls, setUploadedFileUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      console.log('📡 Fetching records with status: IN_DIAGNOSIS');
      
      // Chỉ lấy records với status IN_DIAGNOSIS
      const inDiagnosisRecords = await processingRecordsService.getProcessingRecordsByStatus('IN_DIAGNOSIS');
      
      console.log('📦 Received records:', inDiagnosisRecords);
      console.log(`✅ Loaded ${inDiagnosisRecords.length} records in diagnosis`);
      
      setRecordsByStatus(prev => ({
        ...prev,
        IN_DIAGNOSIS: inDiagnosisRecords
      }));
      
      console.log('💾 State updated with records');
    } catch (error) {
      console.error('❌ Error fetching records:', error);
      if (error instanceof Error) {
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch records",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'CHECKED_IN':
        return 'secondary';
      case 'IN_DIAGNOSIS':
        return 'default';
      case 'WAITING_FOR_PARTS':
        return 'outline';
      case 'IN_REPAIR':
        return 'default';
      case 'COMPLETED':
        return 'default';
      case 'PAID':
        return 'default';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'CHECKED_IN': 'Checked In',
      'IN_DIAGNOSIS': 'In Diagnosis',
      'WAITING_FOR_PARTS': 'Waiting For Parts',
      'IN_REPAIR': 'In Repair',
      'COMPLETED': 'Completed',
      'PAID': 'Paid',
      'CANCELLED': 'Cancelled',
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Filter records based on search term
  const filteredRecords = (recordsByStatus.IN_DIAGNOSIS || []).filter(record => 
    record.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.vehicle?.model?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.mainTechnician?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.createdByStaff?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles(prev => [...prev, ...files]);
      const newUrls = files.map(file => URL.createObjectURL(file));
      setUploadedFileUrls(prev => [...prev, ...newUrls]);
      toast({
        title: "Photos uploaded",
        description: `${files.length} photo(s) added`,
      });
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(uploadedFileUrls[index]);
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedFileUrls(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "Photo removed",
      description: "Photo has been removed from the upload list",
    });
  };

  const handleCreateIssueDiagnosis = async () => {
    // Validate form
    if (!caseLineForm.diagnosisText || !caseLineForm.correctionText) {
      toast({
        title: "Validation Error",
        description: "Please fill in diagnosis and correction text",
        variant: "destructive"
      });
      return;
    }

    if (!selectedRecord || !selectedRecord.guaranteeCases || selectedRecord.guaranteeCases.length === 0) {
      toast({
        title: "Error",
        description: "No guarantee case found for this record",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Get the first guarantee case (or you could let user select which case)
      const guaranteeCase = selectedRecord.guaranteeCases[0];
      
      console.log('🚀 Creating case line for guarantee case:', guaranteeCase.guaranteeCaseId);

      // Call API to create case line
      const createdCaseLines = await caseLineService.createCaseLines(
        guaranteeCase.guaranteeCaseId,
        [caseLineForm]
      );

      console.log('✅ Case lines created:', createdCaseLines);

      // Convert API response to local format for compatibility
      const newCaseLine: CaseLine = {
        id: createdCaseLines[0].caseLineId,
        caseId: createdCaseLines[0].guaranteeCaseId,
        damageLevel: 'N/A', // Not in API response
        repairPossibility: 'N/A', // Not in API response
        warrantyDecision: createdCaseLines[0].warrantyStatus === 'ELIGIBLE' ? 'approved' : 'rejected',
        technicianNotes: `${createdCaseLines[0].diagnosisText} | ${createdCaseLines[0].correctionText}`,
        photos: [...uploadedFileUrls],
        photoFiles: [...uploadedFiles],
        createdDate: new Date(createdCaseLines[0].createdAt).toLocaleDateString('en-GB'),
        status: createdCaseLines[0].status === 'pending' ? 'submitted' : 'approved'
      };

      // Call parent callback to add to case lines list
      if (onCaseLineCreated) {
        onCaseLineCreated(newCaseLine);
      }

      toast({
        title: "Issue Diagnosis Created",
        description: `Case line ${createdCaseLines[0].caseLineId.slice(-8)} has been created successfully. View it in the Issue Diagnosis tab.`,
      });

      // Reset form and close modal
      setCaseLineForm({
        diagnosisText: '',
        correctionText: '',
        componentId: null,
        quantity: 1,
        warrantyStatus: 'ELIGIBLE'
      });
      setUploadedFiles([]);
      setUploadedFileUrls([]);
      setCreateIssueDiagnosisModalOpen(false);
      
    } catch (error) {
      console.error('❌ Failed to create case line:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create case line",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Processing Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Records</CardTitle>
          <CardDescription>
            View and manage vehicle processing records in diagnosis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>VIN</TableHead>
                <TableHead>Vehicle & Model</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Check-in Date</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cases</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p>No records found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.vin + record.checkInDate}>
                    <TableCell className="font-mono text-sm">
                      {record.vin}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.vehicle.model.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Model ID: {record.vehicle.model.vehicleModelId.substring(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{record.odometer.toLocaleString()} km</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(record.checkInDate)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{record.mainTechnician.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.mainTechnician.userId.substring(0, 8)}...
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(record.status)}>
                        {getStatusLabel(record.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">×{record.guaranteeCases.length}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setViewCaseModalOpen(true);
                          }}
                          title="View Case"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setViewReportModalOpen(true);
                          }}
                          title="View Report"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 flex items-center justify-center"
                          onClick={() => {
                            setSelectedRecord(record);
                            setCreateIssueDiagnosisModalOpen(true);
                          }}
                          title="Create Issue Diagnosis"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Case Modal */}
      <Dialog open={viewCaseModalOpen} onOpenChange={setViewCaseModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Processing Record Details</DialogTitle>
            <DialogDescription>
              Complete information for VIN: {selectedRecord?.vin}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              {/* Vehicle Information */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-white border rounded-lg">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Vehicle Model</p>
                    <p className="text-sm font-semibold">{selectedRecord.vehicle.model.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Odometer</p>
                    <p className="text-sm font-semibold">{selectedRecord.odometer.toLocaleString()} km</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <div>
                    <p className="text-xs text-slate-500">Check-in Date</p>
                    <p className="text-sm font-semibold">{formatDate(selectedRecord.checkInDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(selectedRecord.status)}>
                    {getStatusLabel(selectedRecord.status)}
                  </Badge>
                </div>
              </div>

              {/* Main Technician */}
              <div className="p-4 bg-white border rounded-lg">
                <div className="flex items-start gap-2">
                  <Wrench className="h-4 w-4 text-slate-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-600 font-medium">Main Technician</p>
                    <p className="text-sm font-semibold">{selectedRecord.mainTechnician.name}</p>
                    <p className="text-xs text-slate-500">ID: {selectedRecord.mainTechnician.userId}</p>
                  </div>
                </div>
              </div>

              {/* Created By Staff */}
              <div className="p-4 bg-white border rounded-lg">
                <div className="flex items-start gap-2">
                  <User className="h-4 w-4 text-slate-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-600 font-medium">Created By</p>
                    <p className="text-sm font-semibold">{selectedRecord.createdByStaff.name}</p>
                    <p className="text-xs text-slate-500">ID: {selectedRecord.createdByStaff.userId}</p>
                  </div>
                </div>
              </div>

              {/* Guarantee Cases */}
              {selectedRecord.guaranteeCases && selectedRecord.guaranteeCases.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileText className="h-4 w-4" />
                    Guarantee Cases ({selectedRecord.guaranteeCases.length})
                  </div>
                  {selectedRecord.guaranteeCases.map((guaranteeCase, index) => (
                    <div key={guaranteeCase.guaranteeCaseId} className="p-4 bg-white rounded-lg border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-slate-700">Case #{index + 1}</span>
                        <Badge variant="outline" className="text-xs">
                          {guaranteeCase.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">
                        <span className="font-medium">Content:</span> {guaranteeCase.contentGuarantee}
                      </p>
                      <p className="text-xs text-slate-500">
                        ID: {guaranteeCase.guaranteeCaseId}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Vehicle Model Details */}
              <div className="pt-2 border-t">
                <p className="text-xs text-slate-500">VIN: {selectedRecord.vin}</p>
                <p className="text-xs text-slate-500">Model ID: {selectedRecord.vehicle.model.vehicleModelId}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Report Modal */}
      <Dialog open={viewReportModalOpen} onOpenChange={setViewReportModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-semibold">Warranty Report Preview</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Generated processing report for VIN {selectedRecord?.vin}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="text-center py-4 border-b">
                <h2 className="text-2xl font-bold text-blue-600">Warranty Report</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  📅 Generated on {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* Case Information & Vehicle Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Case Information */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-blue-500 text-white rounded-full p-1.5">
                      <FileText className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-blue-700">Case Information</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Case ID:</span>
                      <span className="font-semibold text-blue-600">{selectedRecord.guaranteeCases[0]?.guaranteeCaseId.substring(0, 8) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={getStatusBadgeVariant(selectedRecord.status)}>{getStatusLabel(selectedRecord.status)}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created Date:</span>
                      <span className="font-medium">{formatDate(selectedRecord.checkInDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">N/A</span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-green-500 text-white rounded-full p-1.5">
                      <Car className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-green-700">Vehicle Information</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VIN:</span>
                      <span className="font-semibold font-mono">{selectedRecord.vin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model:</span>
                      <span className="font-medium">{selectedRecord.vehicle.model.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mileage:</span>
                      <span className="font-medium">{selectedRecord.odometer.toLocaleString()} km</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Center Information */}
              <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-cyan-500 text-white rounded-full p-1.5">
                    <Wrench className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-cyan-700">Service Center Information</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Technician:</span>
                    <p className="font-medium">{selectedRecord.mainTechnician.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Check-in Date:</span>
                    <p className="font-medium">{formatDate(selectedRecord.checkInDate)}</p>
                  </div>
                </div>
              </div>

              {/* Warranty Status */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-purple-500 text-white rounded-full p-1.5">
                    <Badge className="h-4 w-4" />
                  </div>
                  <h3 className="font-semibold text-purple-700">Warranty Status</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-2xl font-bold text-green-600">VALID</p>
                    <p className="text-xs text-muted-foreground mt-1">Warranty Status</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-2xl font-bold text-blue-600">24 months</p>
                    <p className="text-xs text-muted-foreground mt-1">Remaining Period</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-2xl font-bold text-purple-600">Battery</p>
                    <p className="text-xs text-muted-foreground mt-1">Warranty Type</p>
                  </div>
                </div>
              </div>

              {/* Diagnosis Report */}
              {selectedRecord.guaranteeCases.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-orange-500 text-white rounded-full p-1.5">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-orange-700">Diagnosis Report</h3>
                  </div>
                  <p className="text-sm">{selectedRecord.guaranteeCases[0]?.contentGuarantee}</p>
                </div>
              )}

              {/* Technician Notes */}
              <div className="bg-slate-50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Technician Notes</h3>
                <p className="text-sm text-muted-foreground italic">
                  Battery diagnostic shows 85% capacity retention, below warranty threshold
                </p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setViewReportModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Issue Diagnosis Modal */}
      <Dialog open={createIssueDiagnosisModalOpen} onOpenChange={setCreateIssueDiagnosisModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Issue Diagnosis</DialogTitle>
            <DialogDescription>
              Create a new issue diagnosis for VIN: {selectedRecord?.vin}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              {/* Vehicle & Customer Information and Diagnosis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-base">🚗 Vehicle & Customer Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Vehicle VIN</Label>
                        <Input 
                          placeholder="Enter vehicle VIN..." 
                          defaultValue={selectedRecord.vin}
                          disabled
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vehicle Model</Label>
                        <Input 
                          placeholder="Vehicle model..." 
                          defaultValue={selectedRecord.vehicle.model.name}
                          disabled
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: '1.1rem' }}>
                    <div className="space-y-2">
                      <Label>Technician</Label>
                      <Input 
                        placeholder="Technician name..." 
                        defaultValue={selectedRecord.mainTechnician.name}
                        disabled
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Case Line Details */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-base mb-4">🔧 Case Line Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diagnosisText">Diagnosis Text *</Label>
                    <Textarea 
                      id="diagnosisText"
                      value={caseLineForm.diagnosisText}
                      onChange={(e) => setCaseLineForm(prev => ({ ...prev, diagnosisText: e.target.value }))}
                      placeholder="Describe the problem diagnosis..."
                      className="min-h-24"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correctionText">Correction Text *</Label>
                    <Textarea 
                      id="correctionText"
                      value={caseLineForm.correctionText}
                      onChange={(e) => setCaseLineForm(prev => ({ ...prev, correctionText: e.target.value }))}
                      placeholder="Describe the correction action..."
                      className="min-h-24"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="componentId">Component ID (Optional)</Label>
                    <Input 
                      id="componentId"
                      value={caseLineForm.componentId || ''}
                      onChange={(e) => setCaseLineForm(prev => ({ ...prev, componentId: e.target.value || null }))}
                      placeholder="Enter component ID..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      id="quantity"
                      type="number"
                      min="1"
                      value={caseLineForm.quantity}
                      onChange={(e) => setCaseLineForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warrantyStatus">Warranty Status *</Label>
                    <Select 
                      value={caseLineForm.warrantyStatus} 
                      onValueChange={(value: 'ELIGIBLE' | 'INELIGIBLE') => setCaseLineForm(prev => ({ ...prev, warrantyStatus: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ELIGIBLE">✅ Eligible</SelectItem>
                        <SelectItem value="INELIGIBLE">❌ Ineligible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Documentation */}
              <div className="border-t pt-6">
                <h4 className="font-medium text-base mb-4">📷 Documentation</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Upload Photos</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload photos of the issue, components, and diagnostic results
                      </p>
                      <input
                        type="file"
                        id="photo-upload"
                        multiple
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('photo-upload')?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Choose Photos
                      </Button>
                    </div>
                    
                    {/* Display uploaded files */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-sm font-medium">Uploaded Photos ({uploadedFiles.length})</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <div className="bg-gray-100 rounded-lg p-2 border">
                                <div className="aspect-square mb-2 overflow-hidden rounded">
                                  <img 
                                    src={uploadedFileUrls[index]} 
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="text-xs">
                                  <div className="font-medium truncate" title={file.name}>{file.name}</div>
                                  <div className="text-gray-500 mt-1">
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setCreateIssueDiagnosisModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCreateIssueDiagnosis}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Issue Diagnosis"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProcessingRecordsView;
