import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import WarrantyValidator from './WarrantyValidator';
import TechnicianAssignment from './TechnicianAssignment';
import {
  FileText,
  Upload,
  ArrowLeft,
  ArrowRight,
  X,
  Eye,
  CheckCircle,
  Shield,
  Users,
  ClipboardList
} from 'lucide-react';

interface VehicleWarrantyInfo {
  vin: string;
  model: string;
  year: string;
  purchaseDate: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  mileage: number;
  maxMileage: number;
  warrantyStatus: 'valid' | 'expired_time' | 'expired_mileage' | 'not_found';
  customer: {
    name: string;
    phone: string;
    email: string;
  };
}

interface TechAssignment {
  mainTechnician: {
    id: string;
    name: string;
    specialty: string;
  };
  assistantTechnicians: {
    id: string;
    name: string;
    specialty: string;
  }[];
  estimatedTime: string;
  specialInstructions: string;
}

interface ClaimData {
  vehicleInfo: VehicleWarrantyInfo | null;
  issue: string;
  description: string;
  technicianAssignment: TechAssignment | null;
  files: File[];
  initialNotes: string;
}

const NewClaim = ({ onClose }: { onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showWarrantyValidator, setShowWarrantyValidator] = useState(false);
  const [showTechnicianAssignment, setShowTechnicianAssignment] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [claimData, setClaimData] = useState<ClaimData>({
    vehicleInfo: null,
    issue: '',
    description: '',
    technicianAssignment: null,
    files: [],
    initialNotes: ''
  });

  const steps = [
    { number: 1, title: 'Warranty Validation', description: 'Validate vehicle warranty status' },
    { number: 2, title: 'Issue Description', description: 'Describe the problem in detail' },
    { number: 3, title: 'Technician Assignment', description: 'Assign qualified technicians' },
    { number: 4, title: 'Initial Documentation', description: 'Add initial notes and files' },
    { number: 5, title: 'Review & Create', description: 'Review and create warranty claim' }
  ];

  const handleWarrantyValidation = (vehicleInfo: VehicleWarrantyInfo | null) => {
    setClaimData(prev => ({ ...prev, vehicleInfo }));
    setShowWarrantyValidator(false);
    
    if (vehicleInfo) {
      if (vehicleInfo.warrantyStatus === 'valid') {
        toast({
          title: "Xe còn bảo hành",
          description: "Có thể tạo yêu cầu bảo hành cho xe này.",
        });
        setCurrentStep(2);
      } else {
        toast({
          title: "Xe hết bảo hành", 
          description: "Sẽ ghi nhận yêu cầu dịch vụ trả phí.",
          variant: "destructive"
        });
        setCurrentStep(2); // Still allow to proceed for paid service
      }
    }
  };

  const handleTechnicianAssignment = (assignment: any) => {
    setClaimData(prev => ({ ...prev, technicianAssignment: assignment }));
    setShowTechnicianAssignment(false);
    
    toast({
      title: "Phân công thành công",
      description: `Đã phân công ${assignment.mainTechnician.name} và ${assignment.assistantTechnicians.length} kỹ thuật viên hỗ trợ.`,
    });
    setCurrentStep(4);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setClaimData(prev => ({
      ...prev,
      files: [...prev.files, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setClaimData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      const claimId = `WC-${Date.now()}`;
      toast({
        title: "Tạo yêu cầu bảo hành thành công!",
        description: `Yêu cầu ${claimId} đã được tạo và phân công cho kỹ thuật viên.`,
      });
      setIsLoading(false);
      onClose();
    }, 2000);
  };

  const nextStep = () => {
    if (currentStep === 2 && claimData.issue) {
      setCurrentStep(3);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceedFromStep2 = claimData.issue && claimData.description;
  const canProceedFromStep4 = claimData.initialNotes.trim().length > 0;
  const canSubmit = claimData.vehicleInfo && claimData.issue && claimData.technicianAssignment;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Tạo yêu cầu bảo hành mới</span>
              </CardTitle>
              <CardDescription>
                Thực hiện theo các bước để tạo yêu cầu bảo hành hoàn chỉnh
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-6">
            {steps.map((step) => (
              <div key={step.number} className="flex items-center space-x-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  currentStep >= step.number 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {step.number < steps.length && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-4" />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step 1: Warranty Validation */}
          {currentStep === 1 && (
            <div className="space-y-6 text-center">
              <div className="max-w-md mx-auto">
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Kiểm tra bảo hành xe</h3>
                <p className="text-muted-foreground mb-6">
                  Khách hàng đến trung tâm dịch vụ để bảo hành xe. Hãy kiểm tra VIN để 
                  xác nhận xe còn trong thời gian bảo hành hay không.
                </p>
                
                <Button 
                  onClick={() => setShowWarrantyValidator(true)}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Kiểm tra VIN và bảo hành
                </Button>
              </div>

              {/* Display result if vehicle info exists */}
              {claimData.vehicleInfo && (
                <Card className={`max-w-2xl mx-auto ${
                  claimData.vehicleInfo.warrantyStatus === 'valid' 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-amber-200 bg-amber-50'
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Kết quả kiểm tra</h4>
                      <Badge variant={claimData.vehicleInfo.warrantyStatus === 'valid' ? 'success' : 'destructive'}>
                        {claimData.vehicleInfo.warrantyStatus === 'valid' ? 'Còn bảo hành' : 'Hết bảo hành'}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Xe:</strong> {claimData.vehicleInfo.model} ({claimData.vehicleInfo.year})</p>
                        <p><strong>VIN:</strong> {claimData.vehicleInfo.vin}</p>
                      </div>
                      <div>
                        <p><strong>Khách hàng:</strong> {claimData.vehicleInfo.customer.name}</p>
                        <p><strong>SĐT:</strong> {claimData.vehicleInfo.customer.phone}</p>
                      </div>
                    </div>

                    {claimData.vehicleInfo.warrantyStatus !== 'valid' && (
                      <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded">
                        <p className="text-sm text-amber-800">
                          <strong>Gợi ý:</strong> Xe đã hết bảo hành. Có thể đề xuất khách hàng 
                          gia hạn bảo hành hoặc sử dụng dịch vụ sửa chữa trả phí.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Issue Description */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="issue" className="text-base font-semibold">Loại sự cố</Label>
                <Select value={claimData.issue} onValueChange={(value) => setClaimData(prev => ({ ...prev, issue: value }))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Chọn loại sự cố" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="battery-performance">Sự cố hệ thống pin</SelectItem>
                    <SelectItem value="motor-controller">Lỗi bộ điều khiển động cơ</SelectItem>
                    <SelectItem value="charging-system">Lỗi hệ thống sạc</SelectItem>
                    <SelectItem value="electronics">Sự cố thiết bị điện tử</SelectItem>
                    <SelectItem value="software">Lỗi phần mềm</SelectItem>
                    <SelectItem value="other">Sự cố khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-semibold">Mô tả chi tiết</Label>
                <Textarea
                  id="description"
                  placeholder="Mô tả chi tiết sự cố, thời điểm bắt đầu, triệu chứng và các tình huống liên quan..."
                  value={claimData.description}
                  onChange={(e) => setClaimData(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-2 min-h-[120px]"
                />
              </div>
            </div>
          )}

          {/* Step 3: Technician Assignment */}
          {currentStep === 3 && (
            <div className="space-y-6 text-center">
              <div className="max-w-md mx-auto">
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Phân công kỹ thuật viên</h3>
                <p className="text-muted-foreground mb-6">
                  Staff chọn kỹ thuật viên phù hợp dựa trên chuyên môn để xử lý case này.
                  Hệ thống sẽ gợi ý kỹ thuật viên phù hợp nhất.
                </p>
                
                <Button 
                  onClick={() => setShowTechnicianAssignment(true)}
                  className="w-full"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Chọn kỹ thuật viên
                </Button>
              </div>

              {/* Display assignment result */}
              {claimData.technicianAssignment && (
                <Card className="max-w-2xl mx-auto border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold mb-4">Phân công đã hoàn thành</h4>
                    
                    <div className="text-sm space-y-3">
                      <div>
                        <p><strong>Kỹ thuật viên chính:</strong></p>
                        <p className="ml-4">{claimData.technicianAssignment.mainTechnician.name} - {claimData.technicianAssignment.mainTechnician.specialty}</p>
                      </div>
                      
                      {claimData.technicianAssignment.assistantTechnicians.length > 0 && (
                        <div>
                          <p><strong>Kỹ thuật viên hỗ trợ:</strong></p>
                          {claimData.technicianAssignment.assistantTechnicians.map((tech, index) => (
                            <p key={index} className="ml-4">{tech.name} - {tech.specialty}</p>
                          ))}
                        </div>
                      )}
                      
                      <div>
                        <p><strong>Thời gian ước tính:</strong> {claimData.technicianAssignment.estimatedTime}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 4: Initial Documentation */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold">Tài liệu ban đầu</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Tải lên các tài liệu, hình ảnh ban đầu về sự cố
                </p>
                
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Nhấn để tải lên file</p>
                    <p className="text-xs text-muted-foreground">Hỗ trợ: JPG, PNG, PDF, DOC (Tối đa 10MB mỗi file)</p>
                  </label>
                </div>

                {/* File Preview */}
                {claimData.files.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">File đã tải lên:</h4>
                    {claimData.files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeFile(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="initial-notes" className="text-base font-semibold">Ghi chú ban đầu</Label>
                <Textarea
                  id="initial-notes"
                  placeholder="Ghi chú về tình trạng xe khi tiếp nhận, các thông tin bổ sung từ khách hàng..."
                  value={claimData.initialNotes}
                  onChange={(e) => setClaimData(prev => ({ ...prev, initialNotes: e.target.value }))}
                  className="mt-2 min-h-[120px]"
                />
              </div>
            </div>
          )}

          {/* Step 5: Review & Create */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <ClipboardList className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Xem lại và tạo yêu cầu</h3>
                <p className="text-muted-foreground">
                  Vui lòng kiểm tra lại thông tin trước khi tạo yêu cầu bảo hành
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid gap-4">
                {/* Vehicle Info */}
                {claimData.vehicleInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Thông tin xe</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Model:</strong> {claimData.vehicleInfo.model} ({claimData.vehicleInfo.year})</p>
                        <p><strong>VIN:</strong> {claimData.vehicleInfo.vin}</p>
                      </div>
                      <div>
                        <p><strong>Khách hàng:</strong> {claimData.vehicleInfo.customer.name}</p>
                        <p><strong>Trạng thái bảo hành:</strong> 
                          <Badge variant={claimData.vehicleInfo.warrantyStatus === 'valid' ? 'success' : 'destructive'} className="ml-2">
                            {claimData.vehicleInfo.warrantyStatus === 'valid' ? 'Còn bảo hành' : 'Hết bảo hành'}
                          </Badge>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Issue Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Thông tin sự cố</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>Loại sự cố:</strong> {claimData.issue}</p>
                    <p><strong>Mô tả:</strong> {claimData.description}</p>
                  </CardContent>
                </Card>

                {/* Technician Assignment */}
                {claimData.technicianAssignment && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Phân công kỹ thuật viên</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <p><strong>Kỹ thuật viên chính:</strong> {claimData.technicianAssignment.mainTechnician.name}</p>
                      {claimData.technicianAssignment.assistantTechnicians.length > 0 && (
                        <p><strong>Hỗ trợ:</strong> {claimData.technicianAssignment.assistantTechnicians.map(t => t.name).join(', ')}</p>
                      )}
                      <p><strong>Thời gian ước tính:</strong> {claimData.technicianAssignment.estimatedTime}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t mt-6">
            <Button 
              variant="outline" 
              onClick={currentStep === 1 ? onClose : prevStep}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {currentStep === 1 ? 'Hủy' : 'Quay lại'}
            </Button>

            <div className="flex space-x-2">
              {currentStep === 1 && claimData.vehicleInfo && (
                <Button onClick={() => setCurrentStep(2)}>
                  Tiếp theo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {currentStep === 2 && (
                <Button onClick={nextStep} disabled={!canProceedFromStep2}>
                  Tiếp theo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {currentStep === 3 && claimData.technicianAssignment && (
                <Button onClick={() => setCurrentStep(4)}>
                  Tiếp theo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {currentStep === 4 && (
                <Button onClick={nextStep} disabled={!canProceedFromStep4}>
                  Tiếp theo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {currentStep === 5 && (
                <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
                  {isLoading ? 'Đang tạo...' : 'Tạo yêu cầu bảo hành'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showWarrantyValidator && (
        <WarrantyValidator
          onValidationComplete={handleWarrantyValidation}
          onClose={() => setShowWarrantyValidator(false)}
        />
      )}

      {showTechnicianAssignment && (
        <TechnicianAssignment
          claimId="NEW"
          issueCategory={claimData.issue}
          onAssignmentComplete={handleTechnicianAssignment}
          onClose={() => setShowTechnicianAssignment(false)}
        />
      )}
    </div>
  );
};

export default NewClaim;