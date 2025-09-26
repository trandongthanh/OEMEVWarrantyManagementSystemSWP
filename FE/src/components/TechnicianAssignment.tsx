import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Star, Clock, CheckCircle, User } from 'lucide-react';

interface Technician {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  workload: number;
  rating: number;
  avatar?: string;
  isAvailable: boolean;
}

interface TechnicianAssignmentProps {
  claimId: string;
  issueCategory: string;
  onAssignmentComplete: (assignment: TechnicianAssignment) => void;
  onClose: () => void;
}

interface TechnicianAssignment {
  mainTechnician: Technician;
  assistantTechnicians: Technician[];
  estimatedTime: string;
  specialInstructions: string;
}

const TechnicianAssignment = ({ claimId, issueCategory, onAssignmentComplete, onClose }: TechnicianAssignmentProps) => {
  const [selectedMainTech, setSelectedMainTech] = useState<Technician | null>(null);
  const [selectedAssistants, setSelectedAssistants] = useState<Technician[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const { toast } = useToast();

  // Mock technicians database
  // const technicians: Technician[] = [
  //   {
  //     id: 'tech-1',
  //     name: 'Trần Minh Quân',
  //     specialty: 'Battery Systems',
  //     experience: 8,
  //     workload: 3,
  //     rating: 4.8,
  //     isAvailable: true
  //   },
  //   {
  //     id: 'tech-2',
  //     name: 'Lê Thị Hoa',
  //     specialty: 'Motor & Drivetrain',
  //     experience: 6,
  //     workload: 2,
  //     rating: 4.7,
  //     isAvailable: true
  //   },
  //   {
  //     id: 'tech-3',
  //     name: 'Phạm Văn Nam',
  //     specialty: 'Electronics & Software',
  //     experience: 5,
  //     workload: 4,
  //     rating: 4.6,
  //     isAvailable: true
  //   },
  //   {
  //     id: 'tech-4',
  //     name: 'Võ Thị Mai',
  //     specialty: 'General Diagnostics',
  //     experience: 10,
  //     workload: 2,
  //     rating: 4.9,
  //     isAvailable: true
  //   },
  //   {
  //     id: 'tech-5',
  //     name: 'Nguyễn Văn Đức',
  //     specialty: 'Charging Systems',
  //     experience: 4,
  //     workload: 1,
  //     rating: 4.5,
  //     isAvailable: true
  //   },
  //   {
  //     id: 'tech-6',
  //     name: 'Trần Thị Linh',
  //     specialty: 'Body & Interior',
  //     experience: 7,
  //     workload: 5,
  //     rating: 4.4,
  //     isAvailable: false
  //   }
  // ];

  // Get recommended technicians based on issue category
  const getRecommendedTechnicians = () => {
    const categorySpecialtyMap: Record<string, string[]> = {
      'battery-performance': ['Battery Systems', 'General Diagnostics'],
      'motor-controller': ['Motor & Drivetrain', 'Electronics & Software'],
      'charging-system': ['Charging Systems', 'Electronics & Software'],
      'electronics': ['Electronics & Software', 'General Diagnostics'],
      'software': ['Electronics & Software'],
      'other': ['General Diagnostics']
    };

    const relevantSpecialties = categorySpecialtyMap[issueCategory] || ['General Diagnostics'];
    
    // return technicians
    //   .filter(tech => tech.isAvailable)
    //   .sort((a, b) => {
    //     // Priority: specialty match > rating > lower workload
    //     const aSpecialtyMatch = relevantSpecialties.includes(a.specialty);
    //     const bSpecialtyMatch = relevantSpecialties.includes(b.specialty);
        
    //     if (aSpecialtyMatch && !bSpecialtyMatch) return -1;
    //     if (!aSpecialtyMatch && bSpecialtyMatch) return 1;
        
    //     if (b.rating !== a.rating) return b.rating - a.rating;
    //     return a.workload - b.workload;
    //   });
  };

  const recommendedTechs = getRecommendedTechnicians();
  const availableTechs =  undefined//technicians.filter(tech => tech.isAvailable);

  const getWorkloadColor = (workload: number) => {
    if (workload <= 2) return 'text-green-600';
    if (workload <= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWorkloadText = (workload: number) => {
    if (workload <= 2) return 'Available'
    if (workload <= 4) return 'Normal';
    return 'Busy';
  };

  const handleMainTechSelect = (tech: Technician) => {
    if (selectedMainTech?.id === tech.id) {
      setSelectedMainTech(null);
    } else {
      setSelectedMainTech(tech);
      // Remove from assistants if selected as main
      setSelectedAssistants(prev => prev.filter(t => t.id !== tech.id));
    }
  };

  const handleAssistantSelect = (tech: Technician) => {
    if (selectedMainTech?.id === tech.id) return; // Can't be assistant if main
    
    const isSelected = selectedAssistants.some(t => t.id === tech.id);
    if (isSelected) {
      setSelectedAssistants(prev => prev.filter(t => t.id !== tech.id));
    } else {
      setSelectedAssistants(prev => [...prev, tech]);
    }
  };

  const handleAssignment = () => {
    if (!selectedMainTech) {
      toast({
        title: "No main technician selected",
        description: "Please select a main technician to handle this request.",
        variant: "destructive"
      });
      return;
    }

    const assignment: TechnicianAssignment = {
      mainTechnician: selectedMainTech,
      assistantTechnicians: selectedAssistants,
      estimatedTime: estimatedTime || '2-4 hours',
      specialInstructions
    };

    toast({
      title: "Assignment Successful",
      description: `Assigned ${selectedMainTech.name} as the main technician${selectedAssistants.length > 0 ? ` and ${selectedAssistants.length} assistant technicians` : ''}.`
    });

    onAssignmentComplete(assignment);
  };

  const TechnicianCard = ({ tech, isRecommended = false }: { tech: Technician; isRecommended?: boolean }) => {
    const isMainSelected = selectedMainTech?.id === tech.id;
    const isAssistantSelected = selectedAssistants.some(t => t.id === tech.id);
    
    return (
      <Card className={`cursor-pointer transition-all relative ${
        isMainSelected 
          ? 'border-primary bg-primary/5' 
          : isAssistantSelected
          ? 'border-blue-300 bg-blue-50'
          : 'hover:border-primary/50'
      }`}>
        {isRecommended && (
          <div className="absolute -top-2 -right-2">
            <Badge variant="default" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Recommended
            </Badge>
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-medium">{tech.name}</h4>
                <p className="text-sm text-muted-foreground">{tech.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm font-medium">{tech.rating}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Experience:</span>
              <p className="font-medium">{tech.experience} years</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className={`font-medium ${getWorkloadColor(tech.workload)}`}>
                {getWorkloadText(tech.workload)}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant={isMainSelected ? "default" : "outline"}
              onClick={() => handleMainTechSelect(tech)}
              className="flex-1"
            >
              {isMainSelected ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Main Technician
                </>
              ) : (
                'Select as Main'
              )}
            </Button>
            
            {!isMainSelected && (
              <Button
                size="sm"
                variant={isAssistantSelected ? "secondary" : "outline"}
                onClick={() => handleAssistantSelect(tech)}
              >
                {isAssistantSelected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Assistant
                  </>
                ) : (
                  'Select as Assistant'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Technician Assignment
          </CardTitle>
          <CardDescription>
            Select the main technician and assistant technicians for warranty request #{claimId}
          </CardDescription>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
          {/* Recommended Technicians */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Recommended Technicians
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {/* {recommendedTechs.slice(0, 4).map((tech) => (
                <TechnicianCard key={tech.id} tech={tech} isRecommended={true} />
              ))} */}
            </div>
          </div>

          {/* All Available Technicians */}
          <div>
            <h3 className="font-semibold mb-3">All Available Technicians</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTechs.map((tech) => (
                <TechnicianCard key={tech.id} tech={tech} />
              ))}
            </div>
          </div>

          {/* Assignment Summary */}
          {selectedMainTech && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Assignment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="font-medium">Main Technician:</Label>
                  <p className="text-sm mt-1">{selectedMainTech.name} - {selectedMainTech.specialty}</p>
                </div>
                
                {selectedAssistants.length > 0 && (
                  <div>
                    <Label className="font-medium">Assistant Technicians:</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedAssistants.map((tech) => (
                        <Badge key={tech.id} variant="outline">
                          {tech.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="estimated-time">Estimated Time</Label>
                  <input
                    id="estimated-time"
                    type="text"
                    placeholder="e.g., 2-4 hours"
                    value={estimatedTime}
                    onChange={(e) => setEstimatedTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="instructions">Special Instructions (optional)</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Enter any special notes or instructions for the technician..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAssignment} disabled={!selectedMainTech}>
              Confirm Assignment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicianAssignment;