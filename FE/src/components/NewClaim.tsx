import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import {
  FileText,
  ArrowLeft,
  ArrowRight,
  X,
  CheckCircle,
  Shield,
  Users,
  ClipboardList,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';

// Component for individual technician assignment card
const TechnicianAssignmentCard = React.memo(({
  issue,
  index,
  recommendedTechnicians,
  availableTechnicians,
  onAssignTechnicians,
  onRemoveTechnician,
  getIssueTypeLabel
}: {
  issue: IssueCase;
  index: number;
  recommendedTechnicians: Technician[];
  availableTechnicians: Technician[];
  onAssignTechnicians: (issueId: string, technicians: Technician[], estimatedTime: string) => void;
  onRemoveTechnician: (issueId: string, technicianId: string) => void;
  getIssueTypeLabel: (type: string) => string;
}) => {
  const [selectedTechnicians, setSelectedTechnicians] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [showTechnicianSelection, setShowTechnicianSelection] = useState(false);
  const { toast } = useToast();

  // Sync with issue data when it changes
  useEffect(() => {
    setSelectedTechnicians(issue.assignedTechnicians.map(tech => tech.id));
    setEstimatedTime(issue.estimatedTime || '');
  }, [issue.assignedTechnicians, issue.estimatedTime]);

  const handleTechnicianToggle = (techId: string) => {
    setSelectedTechnicians(prev =>
      prev.includes(techId)
        ? prev.filter(id => id !== techId)
        : [...prev, techId]
    );
  };

  const handleSaveAssignment = () => {
    if (selectedTechnicians.length === 0) {
      toast({
        title: "No technicians selected",
        description: "Please select at least one technician for this case.",
        variant: "destructive"
      });
      return;
    }

    if (!estimatedTime.trim()) {
      toast({
        title: "Missing estimated time",
        description: "Please enter estimated completion time.",
        variant: "destructive"
      });
      return;
    }

    const selectedTechObjects = availableTechnicians.filter(tech =>
      selectedTechnicians.includes(tech.id)
    );

    onAssignTechnicians(issue.id, selectedTechObjects, estimatedTime);
    setShowTechnicianSelection(false);
  };

  const handleCancel = () => {
    // Reset to current assigned technicians
    setSelectedTechnicians(issue.assignedTechnicians.map(tech => tech.id));
    setEstimatedTime(issue.estimatedTime || '');
    setShowTechnicianSelection(false);
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Case #{index + 1}: {getIssueTypeLabel(issue.type)}
          </CardTitle>
          <Badge variant={issue.priority === 'high' ? 'destructive' : issue.priority === 'medium' ? 'default' : 'secondary'}>
            {issue.priority.toUpperCase()}
          </Badge>
        </div>
        <CardDescription>{issue.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Assignments */}
        {issue.assignedTechnicians.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Assigned Technicians ({issue.assignedTechnicians.length})</h4>
            <div className="space-y-2">
              {issue.assignedTechnicians.map(tech => (
                <div key={tech.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <div>
                      <p className="font-medium text-sm">{tech.name}</p>
                      <p className="text-xs text-muted-foreground">{tech.specialty} • {tech.experience}y exp • ⭐{tech.rating}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveTechnician(issue.id, tech.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {issue.estimatedTime && (
                <p className="text-sm text-muted-foreground">⏱️ Estimated time: {issue.estimatedTime}</p>
              )}
            </div>
          </div>
        )}

        {/* Assignment Interface */}
        {showTechnicianSelection ? (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium">Select Technicians</h4>

            {/* Recommended Technicians */}
            {recommendedTechnicians.length > 0 && (
              <div>
                <Label className="text-sm text-green-700 font-medium">🎯 Recommended Specialists</Label>
                <div className="grid gap-2 mt-2">
                  {recommendedTechnicians.map(tech => (
                    <div key={tech.id} className="flex items-center space-x-2 p-2 border border-green-200 bg-green-50 rounded">
                      <Checkbox
                        checked={selectedTechnicians.includes(tech.id)}
                        onCheckedChange={() => handleTechnicianToggle(tech.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tech.name}</p>
                        <p className="text-xs text-muted-foreground">{tech.specialty} • {tech.experience}y • ⭐{tech.rating} • Workload: {tech.workload}/5</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Available Technicians */}
            <div>
              <Label className="text-sm font-medium">👥 Other Available Technicians</Label>
              <div className="grid gap-2 mt-2 max-h-32 overflow-y-auto">
                {availableTechnicians
                  .filter(tech => !recommendedTechnicians.some(rec => rec.id === tech.id))
                  .map(tech => (
                    <div key={tech.id} className="flex items-center space-x-2 p-2 border rounded">
                      <Checkbox
                        checked={selectedTechnicians.includes(tech.id)}
                        onCheckedChange={() => handleTechnicianToggle(tech.id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{tech.name}</p>
                        <p className="text-xs text-muted-foreground">{tech.specialty} • {tech.experience}y • ⭐{tech.rating} • Workload: {tech.workload}/5</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Estimated Time */}
            <div>
              <Label htmlFor={`estimated-time-${issue.id}`} className="text-sm font-medium">Estimated Completion Time</Label>
              <Input
                id={`estimated-time-${issue.id}`}
                placeholder="e.g., 2-3 hours, 1 day, 2-3 days"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Button onClick={handleSaveAssignment} size="sm">
                Save Assignment
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowTechnicianSelection(true)}
            variant={issue.assignedTechnicians.length > 0 ? "outline" : "default"}
            className="w-full"
          >
            <Users className="h-4 w-4 mr-2" />
            {issue.assignedTechnicians.length > 0 ? 'Modify Assignment' : 'Assign Technicians'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
});

TechnicianAssignmentCard.displayName = 'TechnicianAssignmentCard';

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

interface Technician {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  workload: number;
  isAvailable: boolean;
}

interface IssueCase {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignedTechnicians: Technician[];
  estimatedTime: string;
}

interface ClaimData {
  vehicleInfo: VehicleWarrantyInfo | null;
  issues: IssueCase[];
}

const NewClaim = ({ onClose }: { onClose: () => void }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showVinInputForm, setShowVinInputForm] = useState(false);
  const [vinInput, setVinInput] = useState('');
  const [mileageInput, setMileageInput] = useState('');
  const [currentIssueType, setCurrentIssueType] = useState('');
  const [currentIssueDescription, setCurrentIssueDescription] = useState('');
  const [currentIssuePriority, setCurrentIssuePriority] = useState<'low' | 'medium' | 'high'>('medium');
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock technicians database
  const availableTechnicians: Technician[] = [
    { id: 'tech-001', name: 'Trần Minh Quân', specialty: 'Battery Systems', experience: 8, rating: 4.8, workload: 3, isAvailable: true },
    { id: 'tech-002', name: 'Nguyễn Thị Bảo An', specialty: 'Battery Systems', experience: 6, rating: 4.7, workload: 2, isAvailable: true },
    { id: 'tech-003', name: 'Lê Thị Hoa', specialty: 'Motor & Drivetrain', experience: 10, rating: 4.9, workload: 2, isAvailable: true },
    { id: 'tech-004', name: 'Phạm Văn Thành', specialty: 'Motor & Drivetrain', experience: 7, rating: 4.6, workload: 4, isAvailable: true },
    { id: 'tech-005', name: 'Võ Minh Tuấn', specialty: 'Electronics & Software', experience: 5, rating: 4.8, workload: 1, isAvailable: true },
    { id: 'tech-006', name: 'Đỗ Thị Kim Loan', specialty: 'Electronics & Software', experience: 4, rating: 4.5, workload: 3, isAvailable: true },
    { id: 'tech-007', name: 'Nguyễn Văn Đức', specialty: 'Charging Systems', experience: 6, rating: 4.7, workload: 1, isAvailable: true },
    { id: 'tech-008', name: 'Lý Thị Phương', specialty: 'Charging Systems', experience: 3, rating: 4.4, workload: 2, isAvailable: true },
    { id: 'tech-009', name: 'Võ Thị Mai', specialty: 'General Diagnostics', experience: 12, rating: 4.9, workload: 2, isAvailable: true },
    { id: 'tech-010', name: 'Hoàng Văn Long', specialty: 'General Diagnostics', experience: 8, rating: 4.6, workload: 3, isAvailable: true },
    { id: 'tech-011', name: 'Trần Thị Linh', specialty: 'Body & Interior', experience: 7, rating: 4.5, workload: 4, isAvailable: true },
    { id: 'tech-012', name: 'Bùi Minh Đức', specialty: 'Body & Interior', experience: 5, rating: 4.3, workload: 2, isAvailable: true },
  ];

  const [claimData, setClaimData] = useState<ClaimData>({
    vehicleInfo: null,
    issues: []
  });

  const steps = [
    { number: 1, title: 'Warranty Validation', description: 'Validate vehicle warranty status' },
    { number: 2, title: 'Issue Description', description: 'Describe the problem in detail' },
    { number: 3, title: 'Technician Assignment', description: 'Assign qualified technicians' },
    { number: 4, title: 'Review & Create', description: 'Review and create warranty claim' }
  ];

  const handleVinFormSubmit = () => {
    if (!vinInput.trim() || !mileageInput.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both VIN and mileage.",
        variant: "destructive"
      });
      return;
    }

    // Validate mileage is a number
    if (isNaN(Number(mileageInput))) {
      toast({
        title: "Invalid mileage",
        description: "Please enter a valid number for mileage.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setShowVinInputForm(false);

    // Simulate API call để check warranty
    setTimeout(() => {
      const vehicleInfo = validateVehicleWarranty(vinInput, Number(mileageInput));
      handleWarrantyValidation(vehicleInfo);
      setIsLoading(false);
    }, 1500);
  };

  // Function để validate warranty dựa trên VIN và mileage
  const validateVehicleWarranty = (vin: string, currentMileage: number): VehicleWarrantyInfo | null => {
    // Mock database từ test data
    const vehicleDatabase: VehicleWarrantyInfo[] = [
      {
        vin: '1HGBH41JXMN109186',
        model: 'VinFast VF8 Plus',
        year: '2023',
        purchaseDate: '2023-03-15',
        warrantyStartDate: '2023-03-15',
        warrantyEndDate: '2031-03-15',
        mileage: currentMileage,
        maxMileage: 160000,
        warrantyStatus: 'valid',
        customer: {
          name: 'Nguyễn Văn Minh',
          phone: '0901234567',
          email: 'minh.nguyen@gmail.com'
        }
      },
      {
        vin: 'JH4KA7532MC123456',
        model: 'VinFast VF5 Basic',
        year: '2016',
        purchaseDate: '2016-05-20',
        warrantyStartDate: '2016-05-20',
        warrantyEndDate: '2024-05-20',
        mileage: currentMileage,
        maxMileage: 160000,
        warrantyStatus: 'expired_time',
        customer: {
          name: 'Phạm Văn Hùng',
          phone: '0912888999',
          email: 'hung.pham@yahoo.com'
        }
      },
      {
        vin: 'KMHGH4JH3EA123789',
        model: 'VinFast VF8 City',
        year: '2022',
        purchaseDate: '2022-01-10',
        warrantyStartDate: '2022-01-10',
        warrantyEndDate: '2030-01-10',
        mileage: currentMileage,
        maxMileage: 160000,
        warrantyStatus: 'expired_mileage',
        customer: {
          name: 'Võ Thị Mai Phương',
          phone: '0934567890',
          email: 'mai.vo@company.com'
        }
      },
      {
        vin: 'WVWZZZ1JZ3W386752',
        model: 'VinFast VF9 Premium',
        year: '2024',
        purchaseDate: '2024-02-10',
        warrantyStartDate: '2024-02-10',
        warrantyEndDate: '2032-02-10',
        mileage: currentMileage,
        maxMileage: 160000,
        warrantyStatus: 'valid',
        customer: {
          name: 'Trần Thị Lan Anh',
          phone: '0987654321',
          email: 'lan.tran@vinfast.vn'
        }
      },
      {
        vin: 'VF8ABC123DEF456789',
        model: 'VinFast VF8 Eco',
        year: '2023',
        purchaseDate: '2023-07-20',
        warrantyStartDate: '2023-07-20',
        warrantyEndDate: '2031-07-20',
        mileage: currentMileage,
        maxMileage: 160000,
        warrantyStatus: 'valid',
        customer: {
          name: 'Lê Hoàng Nam',
          phone: '0912345678',
          email: 'nam.le@email.com'
        }
      }
    ];

    const vehicle = vehicleDatabase.find(v => v.vin === vin);

    if (!vehicle) {
      return null;
    }

    // Update warranty status dựa trên current mileage và time
    const now = new Date();
    const warrantyEndDate = new Date(vehicle.warrantyEndDate);
    const isTimeExpired = now > warrantyEndDate;
    const isMileageExpired = currentMileage > vehicle.maxMileage;

    let warrantyStatus: 'valid' | 'expired_time' | 'expired_mileage' | 'not_found';

    if (isTimeExpired && isMileageExpired) {
      warrantyStatus = 'expired_time'; // Prioritize time expiry
    } else if (isTimeExpired) {
      warrantyStatus = 'expired_time';
    } else if (isMileageExpired) {
      warrantyStatus = 'expired_mileage';
    } else {
      warrantyStatus = 'valid';
    }

    return {
      ...vehicle,
      mileage: currentMileage,
      warrantyStatus
    };
  };

  const handleWarrantyValidation = (vehicleInfo: VehicleWarrantyInfo | null) => {
    setClaimData(prev => ({ ...prev, vehicleInfo }));

    if (vehicleInfo) {
      if (vehicleInfo.warrantyStatus === 'valid') {
        toast({
          title: "✅ Vehicle under warranty",
          description: "A warranty request can be created for this vehicle.",
        });
      } else {
        toast({
          title: "⚠️ Vehicle out of warranty",
          description: "A paid service request will be recorded.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "❌ Vehicle not found",
        description: "No vehicle found with the provided VIN.",
        variant: "destructive"
      });
    }
  };





  const addIssue = () => {
    if (!currentIssueType || !currentIssueDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please select issue type and enter description.",
        variant: "destructive"
      });
      return;
    }

    const newIssue: IssueCase = {
      id: `issue-${Date.now()}`,
      type: currentIssueType,
      description: currentIssueDescription,
      priority: currentIssuePriority,
      assignedTechnicians: [],
      estimatedTime: ''
    };

    setClaimData(prev => ({
      ...prev,
      issues: [...prev.issues, newIssue]
    }));

    // Reset form
    setCurrentIssueType('');
    setCurrentIssueDescription('');
    setCurrentIssuePriority('medium');

    toast({
      title: "Issue added",
      description: "Warranty case has been added to the claim.",
    });
  };

  const removeIssue = (issueId: string) => {
    setClaimData(prev => ({
      ...prev,
      issues: prev.issues.filter(issue => issue.id !== issueId)
    }));

    toast({
      title: "Issue removed",
      description: "Warranty case has been removed from the claim.",
    });
  };

  const getIssueTypeLabel = useCallback((type: string) => {
    const labels: { [key: string]: string } = {
      'battery-performance': '🔋 Battery Performance',
      'motor-controller': '⚡ Motor Controller Failure',
      'charging-system': '🔌 Charging System Malfunction',
      'electronics': '📱 Electronics Issue',
      'software': '💻 Software Bug',
      'braking-system': '🛑 Braking System',
      'suspension': '🏃 Suspension System',
      'body-interior': '🚗 Body & Interior',
      'other': '❓ Other Issue'
    };
    return labels[type] || type;
  }, []);

  const getRecommendedTechnicians = (issueType: string) => {
    const specialtyMap: { [key: string]: string[] } = {
      'battery-performance': ['Battery Systems'],
      'motor-controller': ['Motor & Drivetrain', 'Electronics & Software'],
      'charging-system': ['Charging Systems', 'Electronics & Software'],
      'electronics': ['Electronics & Software'],
      'software': ['Electronics & Software'],
      'braking-system': ['General Diagnostics', 'Motor & Drivetrain'],
      'suspension': ['General Diagnostics'],
      'body-interior': ['Body & Interior'],
      'other': ['General Diagnostics']
    };

    const recommendedSpecialties = specialtyMap[issueType] || ['General Diagnostics'];
    return availableTechnicians
      .filter(tech => recommendedSpecialties.includes(tech.specialty) && tech.isAvailable)
      .sort((a, b) => b.rating - a.rating);
  };

  const assignTechniciansToIssue = useCallback((issueId: string, technicians: Technician[], estimatedTime: string) => {
    setClaimData(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? { ...issue, assignedTechnicians: technicians, estimatedTime }
          : issue
      )
    }));

    toast({
      title: "Technicians assigned",
      description: `${technicians.length} technician(s) assigned to this case.`,
    });
  }, [toast]);

  const removeTechnicianFromIssue = useCallback((issueId: string, technicianId: string) => {
    setClaimData(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId
          ? {
            ...issue,
            assignedTechnicians: issue.assignedTechnicians.filter(tech => tech.id !== technicianId)
          }
          : issue
      )
    }));
  }, []);

  const handleSubmit = () => {
    setIsLoading(true);
    setTimeout(() => {
      const claimId = `WC-${Date.now()}`;
      toast({
        title: "Warranty claim created successfully!",
        description: `Claim ${claimId} has been created and assigned to a technician.`,
      });
      setIsLoading(false);
      onClose();
    }, 2000);
  };

  const nextStep = () => {
    if (currentStep === 2 && claimData.issues.length > 0) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceedFromStep2 = claimData.issues.length > 0;
  const allIssuesHaveTechnicians = claimData.issues.every(issue => issue.assignedTechnicians.length > 0);
  const canSubmit = claimData.vehicleInfo && claimData.issues.length > 0 && allIssuesHaveTechnicians;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>Create new warranty request</span>
              </CardTitle>
              <CardDescription className='ml-4 mt-1'>
                Follow the steps to create a complete warranty request
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
                <div className={`flex h-16 w-8 items-center justify-center rounded-full text-sm font-medium ${currentStep >= step.number
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
                <h3 className="text-xl font-semibold mb-2">Check vehicle warranty</h3>
                <p className="text-muted-foreground mb-6">
                  The customer comes to the service center for vehicle warranty.
                  Please check the VIN to verify whether the vehicle is still under warranty.
                </p>

                <Button
                  onClick={() => setShowVinInputForm(true)}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {isLoading ? 'Checking warranty...' : 'Check VIN and warranty status'}
                </Button>
              </div>

              {/* Display result if vehicle info exists */}
              {claimData.vehicleInfo && (
                <Card className={`max-w-3xl mx-auto ${claimData.vehicleInfo.warrantyStatus === 'valid'
                  ? 'border-green-200 bg-green-50'
                  : 'border-amber-200 bg-amber-50'
                  }`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold">Warranty Check Result</h4>
                      <Badge variant={claimData.vehicleInfo.warrantyStatus === 'valid' ? 'success' : 'destructive'}>
                        {claimData.vehicleInfo.warrantyStatus === 'valid' ? '✅ Under Warranty' :
                          claimData.vehicleInfo.warrantyStatus === 'expired_time' ? '❌ Expired (Time)' :
                            claimData.vehicleInfo.warrantyStatus === 'expired_mileage' ? '❌ Expired (Mileage)' :
                              '❓ Not Found'}
                      </Badge>
                    </div>

                    {/* Vehicle Information */}
                    <div className="grid md:grid-cols-2 gap-6 text-sm mb-4">
                      <div className="space-y-2">
                        <h5 className="font-medium text-base mb-3">🚗 Vehicle Information</h5>
                        <p><strong>Model:</strong> {claimData.vehicleInfo.model}</p>
                        <p><strong>Year:</strong> {claimData.vehicleInfo.year}</p>
                        <p><strong>VIN:</strong> {claimData.vehicleInfo.vin}</p>
                        <p><strong>Purchase Date:</strong> {new Date(claimData.vehicleInfo.purchaseDate).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium text-base mb-3">👤 Customer Information</h5>
                        <p><strong>Name:</strong> {claimData.vehicleInfo.customer.name}</p>
                        <p><strong>Phone:</strong> {claimData.vehicleInfo.customer.phone}</p>
                        <p><strong>Email:</strong> {claimData.vehicleInfo.customer.email}</p>
                      </div>
                    </div>

                    {/* Warranty Status Details */}
                    <div className="border-t pt-4 mt-4">
                      <h5 className="font-medium text-base mb-3">🛡️ Warranty Details</h5>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><strong>Warranty Period:</strong></p>
                          <p className="ml-2">{new Date(claimData.vehicleInfo.warrantyStartDate).toLocaleDateString()} - {new Date(claimData.vehicleInfo.warrantyEndDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p><strong>Mileage Status:</strong></p>
                          <p className="ml-2">{claimData.vehicleInfo.mileage.toLocaleString()} km / {claimData.vehicleInfo.maxMileage.toLocaleString()} km</p>
                        </div>
                      </div>

                      {/* Progress bars for warranty status */}
                      <div className="mt-4 space-y-3">
                        {/* Time Progress */}
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Time Remaining</span>
                            <span>{(() => {
                              const now = new Date();
                              const end = new Date(claimData.vehicleInfo.warrantyEndDate);
                              const start = new Date(claimData.vehicleInfo.warrantyStartDate);
                              const total = end.getTime() - start.getTime();
                              const remaining = end.getTime() - now.getTime();
                              const percentage = Math.max(0, Math.min(100, (remaining / total) * 100));
                              return percentage > 0 ? `${percentage.toFixed(0)}%` : 'Expired';
                            })()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${(() => {
                                const now = new Date();
                                const end = new Date(claimData.vehicleInfo.warrantyEndDate);
                                const start = new Date(claimData.vehicleInfo.warrantyStartDate);
                                const total = end.getTime() - start.getTime();
                                const remaining = end.getTime() - now.getTime();
                                const percentage = Math.max(0, Math.min(100, (remaining / total) * 100));
                                return percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500';
                              })()}`}
                              style={{
                                width: `${(() => {
                                  const now = new Date();
                                  const end = new Date(claimData.vehicleInfo.warrantyEndDate);
                                  const start = new Date(claimData.vehicleInfo.warrantyStartDate);
                                  const total = end.getTime() - start.getTime();
                                  const remaining = end.getTime() - now.getTime();
                                  return Math.max(0, Math.min(100, (remaining / total) * 100));
                                })()}%`
                              }}
                            />
                          </div>
                        </div>

                        {/* Mileage Progress */}
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Mileage Remaining</span>
                            <span>{Math.max(0, 100 - (claimData.vehicleInfo.mileage / claimData.vehicleInfo.maxMileage * 100)).toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${(() => {
                                const percentage = (claimData.vehicleInfo.mileage / claimData.vehicleInfo.maxMileage) * 100;
                                return percentage < 50 ? 'bg-green-500' : percentage < 80 ? 'bg-yellow-500' : 'bg-red-500';
                              })()}`}
                              style={{ width: `${Math.min(100, (claimData.vehicleInfo.mileage / claimData.vehicleInfo.maxMileage) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions based on warranty status */}
                    {claimData.vehicleInfo.warrantyStatus !== 'valid' && (
                      <div className="mt-4 p-3 bg-amber-100 border border-amber-300 rounded">
                        <p className="text-sm text-amber-800">
                          <strong>💡 Suggestion:</strong> {
                            claimData.vehicleInfo.warrantyStatus === 'expired_time'
                              ? 'Vehicle warranty has expired due to time. You may suggest the customer extend the warranty or use paid repair services.'
                              : claimData.vehicleInfo.warrantyStatus === 'expired_mileage'
                                ? 'Vehicle warranty has expired due to exceeding mileage limit. You may suggest the customer extend the warranty or use paid repair services.'
                                : 'Vehicle not found in system. Please verify the VIN or contact support.'
                          }
                        </p>
                      </div>
                    )}

                    {claimData.vehicleInfo.warrantyStatus === 'valid' && (
                      <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded">
                        <p className="text-sm text-green-800">
                          <strong>✅ Great!</strong> This vehicle is still under warranty. You can proceed to create a warranty claim.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Multiple Issue Cases */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Warranty Issue Cases</h3>
                <p className="text-muted-foreground">
                  Add one or more warranty cases for this claim. You can describe multiple issues that need to be addressed.
                </p>
              </div>

              {/* Current Issues List */}
              {claimData.issues.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Added Issues ({claimData.issues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {claimData.issues.map((issue, index) => (
                      <div key={issue.id} className="flex items-start justify-between p-3 bg-white border rounded-lg">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">Case #{index + 1}</Badge>
                            <Badge variant={issue.priority === 'high' ? 'destructive' : issue.priority === 'medium' ? 'default' : 'secondary'}>
                              {issue.priority.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm">{getIssueTypeLabel(issue.type)}</p>
                          <p className="text-sm text-muted-foreground">{issue.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIssue(issue.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Add New Issue Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Issue Case
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="issue-type" className="text-sm font-medium">Issue Type</Label>
                      <Select value={currentIssueType} onValueChange={setCurrentIssueType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="battery-performance">🔋 Battery Performance</SelectItem>
                          <SelectItem value="motor-controller">⚡ Motor Controller Failure</SelectItem>
                          <SelectItem value="charging-system">🔌 Charging System Malfunction</SelectItem>
                          <SelectItem value="electronics">📱 Electronics Issue</SelectItem>
                          <SelectItem value="software">💻 Software Bug</SelectItem>
                          <SelectItem value="braking-system">🛑 Braking System</SelectItem>
                          <SelectItem value="suspension">🏃 Suspension System</SelectItem>
                          <SelectItem value="body-interior">🚗 Body & Interior</SelectItem>
                          <SelectItem value="other">❓ Other Issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="issue-priority" className="text-sm font-medium">Priority Level</Label>
                      <Select value={currentIssuePriority} onValueChange={(value: 'low' | 'medium' | 'high') => setCurrentIssuePriority(value)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">🟢 Low Priority</SelectItem>
                          <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                          <SelectItem value="high">🔴 High Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="issue-description" className="text-sm font-medium">Detailed Description</Label>
                    <Textarea
                      id="issue-description"
                      placeholder="Describe this specific issue in detail, including when it started, symptoms, and any relevant circumstances..."
                      value={currentIssueDescription}
                      onChange={(e) => setCurrentIssueDescription(e.target.value)}
                      className="mt-1 min-h-[120px]"
                    />
                  </div>

                  <Button
                    onClick={addIssue}
                    className="w-full"
                    disabled={!currentIssueType || !currentIssueDescription.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add This Issue to Claim
                  </Button>
                </CardContent>
              </Card>

              {/* Summary */}
              {claimData.issues.length > 0 && (
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ <strong>{claimData.issues.length}</strong> warranty case{claimData.issues.length > 1 ? 's' : ''} added.
                    You can add more issues or proceed to technician assignment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Technician Assignment per Case */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Users className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Assign Technicians to Cases</h3>
                <p className="text-muted-foreground">
                  Assign one or more technicians to each warranty case based on their expertise.
                </p>
              </div>

              {claimData.issues.map((issue, index) => (
                <TechnicianAssignmentCard
                  key={issue.id}
                  issue={issue}
                  index={index}
                  recommendedTechnicians={getRecommendedTechnicians(issue.type)}
                  availableTechnicians={availableTechnicians}
                  onAssignTechnicians={assignTechniciansToIssue}
                  onRemoveTechnician={removeTechnicianFromIssue}
                  getIssueTypeLabel={getIssueTypeLabel}
                />
              ))}

              {/* Summary */}
              <div className={`text-center p-4 border rounded-lg ${allIssuesHaveTechnicians
                ? 'bg-green-50 border-green-200'
                : 'bg-amber-50 border-amber-200'
                }`}>
                <p className={`text-sm ${allIssuesHaveTechnicians ? 'text-green-800' : 'text-amber-800'
                  }`}>
                  {allIssuesHaveTechnicians
                    ? '✅ All warranty cases have been assigned technicians. You can proceed to review.'
                    : '⚠️ Some warranty cases still need technician assignments.'
                  }
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review & Create */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <ClipboardList className="h-16 w-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Review and Create Claim</h3>
                <p className="text-muted-foreground">
                  Please double-check the information before creating the warranty claim
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid gap-4">
                {/* Vehicle Info */}
                {claimData.vehicleInfo && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Vehicle Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Model:</strong> {claimData.vehicleInfo.model} ({claimData.vehicleInfo.year})</p>
                        <p><strong>VIN:</strong> {claimData.vehicleInfo.vin}</p>
                      </div>
                      <div>
                        <p><strong>Customer:</strong> {claimData.vehicleInfo.customer.name}</p>
                        <p><strong>Warranty Status:</strong>
                          <Badge variant={claimData.vehicleInfo.warrantyStatus === 'valid' ? 'success' : 'destructive'} className="ml-2">
                            {claimData.vehicleInfo.warrantyStatus === 'valid' ? 'Under Warranty' : 'Out of Warranty'}
                          </Badge>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Issues Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Warranty Issue Cases & Assignments ({claimData.issues.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-4">
                    {claimData.issues.map((issue, index) => (
                      <div key={issue.id} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-base">Case #{index + 1}</span>
                          <Badge variant={issue.priority === 'high' ? 'destructive' : issue.priority === 'medium' ? 'default' : 'secondary'}>
                            {issue.priority.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-3">
                          <p><strong>Type:</strong> {getIssueTypeLabel(issue.type)}</p>
                          <p><strong>Description:</strong> {issue.description}</p>
                          <p><strong>Estimated Time:</strong> {issue.estimatedTime}</p>
                        </div>

                        <div>
                          <p className="font-medium mb-2">👥 Assigned Technicians ({issue.assignedTechnicians.length}):</p>
                          {issue.assignedTechnicians.map((tech, techIndex) => (
                            <div key={tech.id} className="ml-4 p-2 bg-white rounded border">
                              <p className="font-medium">{tech.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {tech.specialty} • {tech.experience} years exp • ⭐{tech.rating}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
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
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </Button>

            <div className="flex space-x-2">
              {currentStep === 1 && claimData.vehicleInfo && (
                <Button onClick={() => setCurrentStep(2)}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === 2 && (
                <Button onClick={nextStep} disabled={!canProceedFromStep2}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === 3 && allIssuesHaveTechnicians && (
                <Button onClick={() => setCurrentStep(4)}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}

              {currentStep === 4 && (
                <Button onClick={handleSubmit} disabled={!canSubmit || isLoading}>
                  {isLoading ? 'Creating...' : 'Create warranty request'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showVinInputForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Enter Vehicle Information</span>
              </CardTitle>
              <CardDescription>
                Please enter the VIN and current mileage to check warranty status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vin-input">Vehicle VIN</Label>
                <Input
                  id="vin-input"
                  placeholder="Enter VIN (e.g., 1HGBH41JXMN109186)"
                  value={vinInput}
                  onChange={(e) => setVinInput(e.target.value.toUpperCase())}
                  className="mt-1"
                  maxLength={17}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  VIN should be 17 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="mileage-input">Current Mileage (km)</Label>
                <Input
                  id="mileage-input"
                  type="number"
                  placeholder="Enter current mileage (e.g., 25000)"
                  value={mileageInput}
                  onChange={(e) => setMileageInput(e.target.value)}
                  className="mt-1"
                  min="0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the current odometer reading in kilometers
                </p>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowVinInputForm(false);
                    setVinInput('');
                    setMileageInput('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleVinFormSubmit}
                  className="flex-1"
                >
                  Check Warranty
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}




    </div>
  );
};

export default NewClaim;