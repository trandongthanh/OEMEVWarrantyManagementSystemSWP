import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Save, 
  X, 
  Megaphone, 
  Calendar as CalendarIcon,
  Target,
  AlertTriangle,
  CheckCircle,
  Users,
  MapPin,
  Clock,
  FileText,
  Send
} from 'lucide-react';

interface CreateCampaignProps {
  onClose: () => void;
}

interface AffectedModel {
  model: string;
  years: string;
  vinRange: string;
  estimatedVehicles: number;
}

const CreateCampaign = ({ onClose }: CreateCampaignProps) => {
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [affectedModels, setAffectedModels] = useState<AffectedModel[]>([]);
  const [newModel, setNewModel] = useState({ model: '', years: '', vinRange: '', estimatedVehicles: 0 });
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [serviceInstructions, setServiceInstructions] = useState('');
  const [notificationMethod, setNotificationMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const campaignTypes = [
    { value: 'recall', label: 'Safety Recall', icon: '⚠️', color: 'destructive' },
    { value: 'service', label: 'Service Campaign', icon: '🔧', color: 'warning' },
    { value: 'software', label: 'Software Update', icon: '📱', color: 'primary' },
    { value: 'inspection', label: 'Inspection Campaign', icon: '🔍', color: 'secondary' },
    { value: 'improvement', label: 'Product Improvement', icon: '✨', color: 'success' }
  ];

  const vehicleModels = [
    'EV Model X Pro 2023',
    'EV Model X Pro 2024', 
    'EV Compact Plus 2022',
    'EV Compact Plus 2023',
    'EV Compact Plus 2024',
    'EV SUV Premium 2023',
    'EV SUV Premium 2024'
  ];

  const handleAddModel = () => {
    if (!newModel.model || !newModel.years || !newModel.vinRange) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all model details"
      });
      return;
    }

    setAffectedModels([...affectedModels, newModel]);
    setNewModel({ model: '', years: '', vinRange: '', estimatedVehicles: 0 });
  };

  const handleRemoveModel = (index: number) => {
    setAffectedModels(affectedModels.filter((_, i) => i !== index));
  };

  const getTotalAffectedVehicles = () => {
    return affectedModels.reduce((total, model) => total + model.estimatedVehicles, 0);
  };

  const handleSave = async () => {
    if (!campaignName || !campaignType || !priority || !description || affectedModels.length === 0) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields and add at least one affected model"
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Missing Dates",
        description: "Please select start and end dates for the campaign"
      });
      return;
    }

    if (endDate <= startDate) {
      toast({
        variant: "destructive",
        title: "Invalid Dates",
        description: "End date must be after start date"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      toast({
        title: "Campaign Created Successfully!",
        description: `${campaignName} has been created and will affect ${getTotalAffectedVehicles()} vehicles`
      });

      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create campaign. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCampaignType = () => {
    return campaignTypes.find(type => type.value === campaignType);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Create New Service Campaign</span>
            <Megaphone className="h-5 w-5 text-muted-foreground" />
          </DialogTitle>
          <DialogDescription>
            Create a new service campaign to notify customers and manage service actions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Campaign Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Megaphone className="h-4 w-4" />
                <span>Campaign Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Campaign Name *</Label>
                <Input
                  id="campaignName"
                  placeholder="e.g., Battery Software Update Campaign 2024"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaignType">Campaign Type *</Label>
                  <Select value={campaignType} onValueChange={setCampaignType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center space-x-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">🔴 Critical - Immediate Action</SelectItem>
                      <SelectItem value="high">🟠 High - Within 30 days</SelectItem>
                      <SelectItem value="medium">🟡 Medium - Within 90 days</SelectItem>
                      <SelectItem value="low">🟢 Low - Within 6 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Campaign Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue, safety concerns, and required actions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Campaign Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4" />
                <span>Campaign Timeline</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>End Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Affected Vehicles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Target className="h-4 w-4" />
                <span>Affected Vehicles</span>
              </CardTitle>
              <CardDescription>
                Add vehicle models and VIN ranges affected by this campaign
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {affectedModels.map((model, index) => (
                <Card key={index} className="border-l-4 border-l-warning">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{model.model}</h4>
                        <p className="text-sm text-muted-foreground">Years: {model.years}</p>
                        <p className="text-sm text-muted-foreground">VIN Range: {model.vinRange}</p>
                        <Badge variant="secondary" className="mt-1">
                          <Users className="mr-1 h-3 w-3" />
                          {model.estimatedVehicles.toLocaleString()} vehicles
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveModel(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add Model Form */}
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={newModel.model} onValueChange={(value) => setNewModel({...newModel, model: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle model" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Production years (e.g., 2022-2024)"
                        value={newModel.years}
                        onChange={(e) => setNewModel({...newModel, years: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="VIN range (e.g., 1HGBH41J*-1HGBH45J*)"
                        value={newModel.vinRange}
                        onChange={(e) => setNewModel({...newModel, vinRange: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="Estimated affected vehicles"
                        value={newModel.estimatedVehicles || ''}
                        onChange={(e) => setNewModel({...newModel, estimatedVehicles: Number(e.target.value)})}
                      />
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddModel}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Affected Model
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Service Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Service Instructions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceInstructions">Instructions for Service Centers</Label>
                <Textarea
                  id="serviceInstructions"
                  placeholder="Detailed instructions for technicians on how to perform the service action..."
                  value={serviceInstructions}
                  onChange={(e) => setServiceInstructions(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notificationMethod">Customer Notification Method</Label>
                <Select value={notificationMethod} onValueChange={setNotificationMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select notification method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">📧 Email Only</SelectItem>
                    <SelectItem value="sms">📱 SMS Only</SelectItem>
                    <SelectItem value="both">📧📱 Email + SMS</SelectItem>
                    <SelectItem value="mail">📮 Physical Mail</SelectItem>
                    <SelectItem value="all">📧📱📮 All Methods</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Summary */}
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Campaign Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  {getSelectedCampaignType() && <span>{getSelectedCampaignType()?.icon}</span>}
                  <p><strong>Campaign:</strong> {campaignName || 'Not specified'}</p>
                </div>
                <p><strong>Type:</strong> {getSelectedCampaignType()?.label || 'Not selected'}</p>
                <p><strong>Priority:</strong> {priority.replace('critical', '🔴 Critical').replace('high', '🟠 High').replace('medium', '🟡 Medium').replace('low', '🟢 Low') || 'Not selected'}</p>
                <p><strong>Duration:</strong> {startDate && endDate ? `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}` : 'Not specified'}</p>
                <p><strong>Affected Models:</strong> {affectedModels.length} model(s)</p>
                <p><strong>Total Vehicles:</strong> {getTotalAffectedVehicles().toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button variant="gradient" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                <span>Creating Campaign...</span>
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Campaign
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCampaign;