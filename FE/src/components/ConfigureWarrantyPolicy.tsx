import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Save, 
  X, 
  Shield, 
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2
} from 'lucide-react';

interface ConfigureWarrantyPolicyProps {
  policyType: string;
  onClose: () => void;
}

interface CoverageItem {
  id: string;
  component: string;
  coverage: string;
  exclusions: string[];
}

const ConfigureWarrantyPolicy = ({ policyType, onClose }: ConfigureWarrantyPolicyProps) => {
  const [duration, setDuration] = useState('');
  const [mileage, setMileage] = useState('');
  const [region, setRegion] = useState('');
  const [transferable, setTransferable] = useState('yes');
  const [description, setDescription] = useState('');
  const [newCoverage, setNewCoverage] = useState({ component: '', coverage: '', exclusions: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [coverageItems, setCoverageItems] = useState<CoverageItem[]>([
    {
      id: '1',
      component: policyType === 'battery' ? 'Battery Cells' : policyType === 'motor' ? 'Motor Assembly' : 'Control Units',
      coverage: 'Full replacement for manufacturing defects',
      exclusions: ['Physical damage', 'Water damage', 'Modification damage']
    },
    {
      id: '2', 
      component: policyType === 'battery' ? 'Battery Management System' : policyType === 'motor' ? 'Motor Controller' : 'Display Systems',
      coverage: 'Repair or replacement as needed',
      exclusions: ['Software modifications', 'Unauthorized repairs']
    }
  ]);

  const getDefaultValues = () => {
    const defaults = {
      battery: { duration: '8', mileage: '160000', description: 'Comprehensive battery warranty covering all battery-related components' },
      motor: { duration: '5', mileage: '100000', description: 'Motor and drivetrain warranty covering manufacturing defects' },
      electronics: { duration: '3', mileage: '60000', description: 'Electronics and infotainment system warranty' }
    };
    return defaults[policyType as keyof typeof defaults] || defaults.electronics;
  };

  useState(() => {
    const defaults = getDefaultValues();
    setDuration(defaults.duration);
    setMileage(defaults.mileage);
    setDescription(defaults.description);
    setRegion('vietnam');
  });

  const handleAddCoverage = () => {
    if (!newCoverage.component || !newCoverage.coverage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in component and coverage details"
      });
      return;
    }

    const exclusionsList = newCoverage.exclusions.split(',').map(e => e.trim()).filter(e => e);
    
    setCoverageItems([...coverageItems, {
      id: Date.now().toString(),
      component: newCoverage.component,
      coverage: newCoverage.coverage,
      exclusions: exclusionsList
    }]);

    setNewCoverage({ component: '', coverage: '', exclusions: '' });
  };

  const handleRemoveCoverage = (id: string) => {
    setCoverageItems(coverageItems.filter(item => item.id !== id));
  };

  const handleSave = async () => {
    if (!duration || !mileage) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: `${policyType.charAt(0).toUpperCase() + policyType.slice(1)} warranty policy updated successfully`
      });

      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error", 
        description: "Failed to update warranty policy. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPolicyIcon = () => {
    const icons = {
      battery: '🔋',
      motor: '⚡',
      electronics: '📱'
    };
    return icons[policyType as keyof typeof icons] || '🛡️';
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <span>Configure {policyType.charAt(0).toUpperCase() + policyType.slice(1)} Warranty Policy</span>
            <span className="text-2xl">{getPolicyIcon()}</span>
          </DialogTitle>
          <DialogDescription>
            Set warranty terms, coverage details, and conditions for {policyType} components
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Warranty Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Years) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 8"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Mileage Limit (KM) *</Label>
                  <Input
                    id="mileage"
                    type="number"
                    placeholder="e.g., 160000"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Applicable Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vietnam">Vietnam</SelectItem>
                      <SelectItem value="asean">ASEAN Region</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transferable">Transferable</Label>
                  <Select value={transferable} onValueChange={setTransferable}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="limited">Limited Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Policy Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the warranty policy terms and conditions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Coverage Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Coverage Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {coverageItems.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{item.component}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.coverage}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.exclusions.map((exclusion, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {exclusion}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCoverage(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Coverage */}
              <Card className="border-dashed">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Component name"
                        value={newCoverage.component}
                        onChange={(e) => setNewCoverage({...newCoverage, component: e.target.value})}
                      />
                      <Input
                        placeholder="Coverage description"
                        value={newCoverage.coverage}
                        onChange={(e) => setNewCoverage({...newCoverage, coverage: e.target.value})}
                      />
                    </div>
                    <Input
                      placeholder="Exclusions (comma separated)"
                      value={newCoverage.exclusions}
                      onChange={(e) => setNewCoverage({...newCoverage, exclusions: e.target.value})}
                    />
                    <Button variant="outline" size="sm" onClick={handleAddCoverage}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Coverage Item
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Policy Preview */}
          <Card className="bg-accent/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Policy Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Coverage Period:</strong> {duration} years or {Number(mileage).toLocaleString()} km (whichever comes first)</p>
                <p><strong>Region:</strong> {region.charAt(0).toUpperCase() + region.slice(1)}</p>
                <p><strong>Transferable:</strong> {transferable === 'yes' ? 'Yes' : transferable === 'no' ? 'No' : 'Limited'}</p>
                <p><strong>Components Covered:</strong> {coverageItems.length} items</p>
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
                <span>Saving...</span>
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Policy
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigureWarrantyPolicy;