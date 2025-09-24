import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Package,
  Search,
  Plus,
  X,
  Save,
  Car,
  Wrench,
  Battery,
  Zap,
  Trash2,
  CheckCircle
} from 'lucide-react';

interface PartData {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  installationDate: string;
  warrantyPeriod: string;
}

interface VehicleInfo {
  vin: string;
  model: string;
  customer: string;
}

const AttachParts = ({ onClose }: { onClose: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [vinSearch, setVinSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInfo | null>(null);
  const [attachedParts, setAttachedParts] = useState<PartData[]>([]);
  const [newPart, setNewPart] = useState({
    category: '',
    partId: '',
    serialNumber: '',
    installationDate: ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Mock vehicles
  const mockVehicles = [
    {
      vin: '1HGBH41JXMN109186',
      model: 'EV Model X Pro 2023',
      customer: 'Nguyễn Văn Minh'
    },
    {
      vin: 'WVWZZZ1JZ3W386752', 
      model: 'EV Compact Plus 2022',
      customer: 'Trần Thị Lan'
    }
  ];

  // Part categories and available parts
  const partCategories = [
    {
      id: 'battery',
      name: 'Battery System',
      icon: Battery,
      parts: [
        { id: 'BAT-001', name: 'Li-ion Battery Pack 75kWh', warranty: '8 years' },
        { id: 'BAT-002', name: 'Battery Management System', warranty: '5 years' },
        { id: 'BAT-003', name: 'Battery Cooling System', warranty: '3 years' }
      ]
    },
    {
      id: 'motor',
      name: 'Motor & Drivetrain',
      icon: Wrench,
      parts: [
        { id: 'MOT-001', name: 'Electric Motor - Front', warranty: '5 years' },
        { id: 'MOT-002', name: 'Electric Motor - Rear', warranty: '5 years' },
        { id: 'MOT-003', name: 'Gearbox Assembly', warranty: '5 years' },
        { id: 'MOT-004', name: 'Inverter Unit', warranty: '3 years' }
      ]
    },
    {
      id: 'charging',
      name: 'Charging System',
      icon: Zap,
      parts: [
        { id: 'CHG-001', name: 'Onboard Charger 11kW', warranty: '3 years' },
        { id: 'CHG-002', name: 'DC Fast Charge Port', warranty: '3 years' },
        { id: 'CHG-003', name: 'Charging Control Unit', warranty: '3 years' }
      ]
    },
    {
      id: 'electronics',
      name: 'Electronics & Software',
      icon: Package,
      parts: [
        { id: 'ECU-001', name: 'Main Control Unit', warranty: '3 years' },
        { id: 'ECU-002', name: 'Display & Infotainment', warranty: '2 years' },
        { id: 'ECU-003', name: 'ADAS Controller', warranty: '3 years' }
      ]
    }
  ];

  const searchVehicle = () => {
    const vehicle = mockVehicles.find(v => v.vin === vinSearch);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      toast({
        title: "Vehicle Found!",
        description: `Found ${vehicle.model} for ${vehicle.customer}`,
      });
    } else {
      toast({
        title: "Vehicle Not Found",
        description: "Please check the VIN number and try again",
        variant: "destructive"
      });
    }
  };

  const getPartsForCategory = (categoryId: string) => {
    return partCategories.find(cat => cat.id === categoryId)?.parts || [];
  };

  const getPartDetails = (partId: string) => {
    for (const category of partCategories) {
      const part = category.parts.find(p => p.id === partId);
      if (part) return part;
    }
    return null;
  };

  const addPart = () => {
    if (!newPart.category || !newPart.partId || !newPart.serialNumber || !newPart.installationDate) {
      toast({
        title: "Missing Information",
        description: "Please fill all part details",
        variant: "destructive"
      });
      return;
    }

    const partDetails = getPartDetails(newPart.partId);
    if (!partDetails) return;

    const part: PartData = {
      id: `${newPart.partId}-${Date.now()}`,
      name: partDetails.name,
      category: newPart.category,
      serialNumber: newPart.serialNumber,
      installationDate: newPart.installationDate,
      warrantyPeriod: partDetails.warranty
    };

    setAttachedParts(prev => [...prev, part]);
    setNewPart({ category: '', partId: '', serialNumber: '', installationDate: '' });
    
    toast({
      title: "Part Added!",
      description: `${partDetails.name} has been added to the vehicle`,
    });
  };

  const removePart = (partId: string) => {
    setAttachedParts(prev => prev.filter(part => part.id !== partId));
    toast({
      title: "Part Removed",
      description: "Part has been removed from the list",
    });
  };

  const handleSave = () => {
    if (!selectedVehicle || attachedParts.length === 0) {
      toast({
        title: "Cannot Save",
        description: "Please select a vehicle and add at least one part",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      toast({
        title: "Parts Attached Successfully!",
        description: `${attachedParts.length} parts have been attached to ${selectedVehicle.vin}`,
      });
      setIsLoading(false);
      onClose();
    }, 2000);
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = partCategories.find(cat => cat.id === categoryId);
    return category?.icon || Package;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-primary" />
                <span>Attach Parts to Vehicle</span>
              </CardTitle>
              <CardDescription>
                Attach serial parts to a specific vehicle for warranty tracking
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Vehicle Search */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-base">
                  <Car className="h-4 w-4" />
                  <span>Select Vehicle</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter VIN number"
                      value={vinSearch}
                      onChange={(e) => setVinSearch(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={searchVehicle} disabled={!vinSearch}>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                  </div>

                  {selectedVehicle && (
                    <Card className="border-success">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{selectedVehicle.model}</h3>
                            <p className="text-sm text-muted-foreground">VIN: {selectedVehicle.vin}</p>
                            <p className="text-sm text-muted-foreground">Customer: {selectedVehicle.customer}</p>
                          </div>
                          <Badge variant="success">Selected</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Demo VINs */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Demo VINs:</span>
                    {mockVehicles.map((vehicle) => (
                      <Badge 
                        key={vehicle.vin}
                        variant="outline" 
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setVinSearch(vehicle.vin)}
                      >
                        {vehicle.vin}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add New Part */}
            {selectedVehicle && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Plus className="h-4 w-4" />
                    <span>Add New Part</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Part Category</Label>
                        <Select 
                          value={newPart.category} 
                          onValueChange={(value) => setNewPart(prev => ({ ...prev, category: value, partId: '' }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {partCategories.map((category) => {
                              const Icon = category.icon;
                              return (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center space-x-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{category.name}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Specific Part</Label>
                        <Select 
                          value={newPart.partId} 
                          onValueChange={(value) => setNewPart(prev => ({ ...prev, partId: value }))}
                          disabled={!newPart.category}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select part" />
                          </SelectTrigger>
                          <SelectContent>
                            {getPartsForCategory(newPart.category).map((part) => (
                              <SelectItem key={part.id} value={part.id}>
                                <div>
                                  <div>{part.name}</div>
                                  <div className="text-xs text-muted-foreground">Warranty: {part.warranty}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="serial">Serial Number</Label>
                        <Input
                          id="serial"
                          placeholder="Enter serial number"
                          value={newPart.serialNumber}
                          onChange={(e) => setNewPart(prev => ({ ...prev, serialNumber: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="installation">Installation Date</Label>
                        <Input
                          id="installation"
                          type="date"
                          value={newPart.installationDate}
                          onChange={(e) => setNewPart(prev => ({ ...prev, installationDate: e.target.value }))}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={addPart}
                      disabled={!newPart.category || !newPart.partId || !newPart.serialNumber || !newPart.installationDate}
                      className="w-fit"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Part
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attached Parts List */}
            {attachedParts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>Attached Parts ({attachedParts.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {attachedParts.map((part) => {
                      const Icon = getCategoryIcon(part.category);
                      return (
                        <div 
                          key={part.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">{part.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Serial: {part.serialNumber}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Installed: {new Date(part.installationDate).toLocaleDateString('vi-VN')} | 
                                Warranty: {part.warrantyPeriod}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePart(part.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            {selectedVehicle && attachedParts.length > 0 && (
              <Card className="bg-accent/20">
                <CardHeader>
                  <CardTitle className="text-base">Attachment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Vehicle:</strong> {selectedVehicle.model}</p>
                      <p><strong>VIN:</strong> {selectedVehicle.vin}</p>
                      <p><strong>Customer:</strong> {selectedVehicle.customer}</p>
                    </div>
                    <div>
                      <p><strong>Parts Count:</strong> {attachedParts.length}</p>
                      <p><strong>Processed by:</strong> {user?.name}</p>
                      <p><strong>Date:</strong> {new Date().toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-between">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="gradient"
              onClick={handleSave}
              disabled={!selectedVehicle || attachedParts.length === 0 || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Attachments
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AttachParts;