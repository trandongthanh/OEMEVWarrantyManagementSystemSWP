import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Upload, 
  X, 
  Plus, 
  Search, 
  FileText, 
  Camera, 
  Video,
  Paperclip,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface DiagnosticReportFormProps {
  caseId: string;
  onClose?: () => void;
  onSubmit?: (reportData: any) => void;
}

const DiagnosticReportForm = ({ caseId, onClose, onSubmit }: DiagnosticReportFormProps) => {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    priority: "medium",
    diagnosis: "",
    symptoms: "",
    testsPerformed: "",
    findings: "",
    recommendedActions: "",
    requiredParts: [] as string[],
    estimatedCost: "",
    laborHours: "",
    customerApprovalRequired: false
  });

  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDraft, setIsDraft] = useState(false);

  // Mock parts catalog
  const availableParts = [
    { id: "BP-001", name: "Battery Cell Module", category: "Battery", price: 15000000 },
    { id: "TS-001", name: "Thermal Sensor", category: "Sensor", price: 800000 },
    { id: "CC-001", name: "Charge Controller", category: "Electronic", price: 5000000 },
    { id: "MCU-001", name: "Motor Controller Unit", category: "Drive System", price: 20000000 },
    { id: "CB-001", name: "Charging Cable", category: "Accessory", price: 1200000 },
    { id: "BMS-001", name: "Battery Management System", category: "Battery", price: 8000000 },
    { id: "INV-001", name: "DC-DC Inverter", category: "Power", price: 6500000 },
    { id: "CCS-001", name: "Climate Control Sensor", category: "Sensor", price: 600000 }
  ];

  const categories = [
    "Battery System",
    "Charging System", 
    "Motor & Drivetrain",
    "Electronics & Software",
    "Climate Control",
    "Safety Systems",
    "Body & Interior",
    "Other"
  ];

  const filteredParts = availableParts.filter(part =>
    part.name.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
    part.id.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
    part.category.toLowerCase().includes(partSearchTerm.toLowerCase())
  );

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePartSelect = (partId: string) => {
    if (!selectedParts.includes(partId)) {
      setSelectedParts(prev => [...prev, partId]);
      handleInputChange('requiredParts', [...selectedParts, partId]);
    }
    setPartSearchTerm("");
  };

  const handlePartRemove = (partId: string) => {
    const updatedParts = selectedParts.filter(id => id !== partId);
    setSelectedParts(updatedParts);
    handleInputChange('requiredParts', updatedParts);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (attachments.length + files.length > 10) {
      toast({
        title: "Too many files",
        description: "Maximum 10 files allowed per report",
        variant: "destructive"
      });
      return;
    }
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Camera;
    if (file.type.startsWith('video/')) return Video;
    return Paperclip;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateTotalCost = () => {
    const partsCost = selectedParts.reduce((total, partId) => {
      const part = availableParts.find(p => p.id === partId);
      return total + (part ? part.price : 0);
    }, 0);
    
    const laborCost = parseFloat(formData.laborHours) * 150000 || 0; // 150k per hour
    const additionalCost = parseFloat(formData.estimatedCost) || 0;
    
    return partsCost + laborCost + additionalCost;
  };

  const handleSubmit = (asDraft: boolean = false) => {
    if (!asDraft) {
      // Validation for final submission
      if (!formData.title || !formData.category || !formData.diagnosis) {
        toast({
          title: "Required fields missing",
          description: "Please fill in title, category, and diagnosis",
          variant: "destructive"
        });
        return;
      }
    }

    const reportData = {
      ...formData,
      caseId,
      attachments,
      totalCost: calculateTotalCost(),
      status: asDraft ? 'draft' : 'submitted',
      submittedAt: new Date().toISOString(),
      reportId: `DR-${Date.now()}`
    };

    toast({
      title: asDraft ? "Draft saved" : "Report submitted",
      description: asDraft ? "Your diagnostic report has been saved as draft" : "Your diagnostic report has been submitted for review",
      variant: "default"
    });

    onSubmit?.(reportData);
    onClose?.();
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose?.()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Diagnostic Report - {caseId}</DialogTitle>
          <DialogDescription>
            Create a comprehensive diagnostic report for this warranty case
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Report Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief summary of the issue"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Diagnostic Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="symptoms">Reported Symptoms</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Describe the symptoms reported by the customer"
                  value={formData.symptoms}
                  onChange={(e) => handleInputChange('symptoms', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="testsPerformed">Tests Performed</Label>
                <Textarea
                  id="testsPerformed"
                  placeholder="List all diagnostic tests and procedures performed"
                  value={formData.testsPerformed}
                  onChange={(e) => handleInputChange('testsPerformed', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="findings">Findings *</Label>
                <Textarea
                  id="findings"
                  placeholder="Detailed technical findings and root cause analysis"
                  value={formData.findings}
                  onChange={(e) => handleInputChange('findings', e.target.value)}
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="diagnosis">Final Diagnosis *</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Final diagnosis and technical conclusion"
                  value={formData.diagnosis}
                  onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="recommendedActions">Recommended Actions</Label>
                <Textarea
                  id="recommendedActions"
                  placeholder="Recommended repair actions and procedures"
                  value={formData.recommendedActions}
                  onChange={(e) => handleInputChange('recommendedActions', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Required Parts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Required Parts</CardTitle>
              <CardDescription>
                Search and select parts needed for this repair
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search parts by name, ID, or category..."
                  value={partSearchTerm}
                  onChange={(e) => setPartSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {partSearchTerm && (
                <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
                  {filteredParts.map((part) => (
                    <div 
                      key={part.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => handlePartSelect(part.id)}
                    >
                      <div>
                        <p className="font-medium text-sm">{part.name}</p>
                        <p className="text-xs text-muted-foreground">{part.id} - {part.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(part.price)}
                        </p>
                        <Button variant="ghost" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedParts.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Parts:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedParts.map((partId) => {
                      const part = availableParts.find(p => p.id === partId);
                      if (!part) return null;
                      
                      return (
                        <Badge key={partId} variant="secondary" className="flex items-center gap-2">
                          {part.name} - {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(part.price)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePartRemove(partId)}
                            className="h-4 w-4 p-0 hover:bg-transparent"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cost Estimation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Estimation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="laborHours">Labor Hours</Label>
                  <Input
                    id="laborHours"
                    type="number"
                    step="0.5"
                    placeholder="Estimated labor hours"
                    value={formData.laborHours}
                    onChange={(e) => handleInputChange('laborHours', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedCost">Additional Costs (VND)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    placeholder="Miscellaneous costs"
                    value={formData.estimatedCost}
                    onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Parts Cost:</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    selectedParts.reduce((total, partId) => {
                      const part = availableParts.find(p => p.id === partId);
                      return total + (part ? part.price : 0);
                    }, 0)
                  )}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Labor Cost:</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    (parseFloat(formData.laborHours) * 150000) || 0
                  )}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Additional:</span>
                  <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                    parseFloat(formData.estimatedCost) || 0
                  )}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between font-medium">
                    <span>Total Estimated Cost:</span>
                    <span>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      calculateTotalCost()
                    )}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customerApproval"
                  checked={formData.customerApprovalRequired}
                  onCheckedChange={(checked) => handleInputChange('customerApprovalRequired', checked)}
                />
                <Label htmlFor="customerApproval" className="text-sm">
                  Customer approval required before proceeding
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attachments</CardTitle>
              <CardDescription>
                Upload photos, videos, and documents (Max 10 files, 5MB each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop files here
                  </p>
                </label>
              </div>
              
              {attachments.length > 0 && (
                <div className="grid gap-2 md:grid-cols-2">
                  {attachments.map((file, index) => {
                    const Icon = getFileIcon(file);
                    return (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => handleSubmit(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button 
                variant="gradient"
                onClick={() => handleSubmit(false)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DiagnosticReportForm;