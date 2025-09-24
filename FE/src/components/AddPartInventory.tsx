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
  Plus, 
  Save, 
  X, 
  Package, 
  Barcode,
  DollarSign,
  Truck,
  AlertTriangle,
  CheckCircle,
  Upload,
  Search
} from 'lucide-react';

interface AddPartInventoryProps {
  onClose: () => void;
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  rating: number;
}

const AddPartInventory = ({ onClose }: AddPartInventoryProps) => {
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [initialStock, setInitialStock] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [location, setLocation] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [compatibleModels, setCompatibleModels] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const suppliers: Supplier[] = [
    { id: '1', name: 'Advanced Battery Tech Ltd.', contact: 'contact@abt.com', rating: 4.8 },
    { id: '2', name: 'Motor Systems Inc.', contact: 'sales@motorsys.com', rating: 4.5 },
    { id: '3', name: 'EV Components Global', contact: 'info@evcomponents.com', rating: 4.7 },
    { id: '4', name: 'Precision Electronics Co.', contact: 'support@precisionelec.com', rating: 4.3 }
  ];

  const categories = [
    { value: 'battery', label: 'Battery Components', icon: '🔋' },
    { value: 'motor', label: 'Motor & Drivetrain', icon: '⚡' },
    { value: 'electronics', label: 'Electronics', icon: '📱' },
    { value: 'charging', label: 'Charging System', icon: '🔌' },
    { value: 'body', label: 'Body & Exterior', icon: '🚗' },
    { value: 'interior', label: 'Interior Components', icon: '🪑' },
    { value: 'safety', label: 'Safety Systems', icon: '🛡️' },
    { value: 'tools', label: 'Tools & Equipment', icon: '🔧' }
  ];

  const handleSave = async () => {
    if (!partName || !partNumber || !category || !unitPrice || !initialStock || !minimumStock) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields"
      });
      return;
    }

    if (Number(minimumStock) >= Number(initialStock)) {
      toast({
        variant: "destructive",
        title: "Invalid Stock Levels",
        description: "Minimum stock must be less than initial stock"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Success",
        description: `Part "${partName}" has been added to inventory successfully`
      });

      onClose();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add part to inventory. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePartNumber = () => {
    const categoryCode = category.toUpperCase().slice(0, 3);
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const generated = `${categoryCode}-${randomNum}-${new Date().getFullYear()}`;
    setPartNumber(generated);
  };

  const getSelectedCategory = () => {
    return categories.find(cat => cat.value === category);
  };

  const getSelectedSupplier = () => {
    return suppliers.find(sup => sup.id === selectedSupplier);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-primary" />
            <span>Add New Part to Inventory</span>
            <Package className="h-5 w-5 text-muted-foreground" />
          </DialogTitle>
          <DialogDescription>
            Add a new part to the inventory system with all necessary details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partName">Part Name *</Label>
                  <Input
                    id="partName"
                    placeholder="e.g., Li-ion Battery Cell Type A"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partNumber">Part Number *</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="partNumber"
                      placeholder="e.g., BAT-2024-001"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                    />
                    <Button variant="outline" size="sm" onClick={generatePartNumber} disabled={!category}>
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select part category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center space-x-2">
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the part, specifications, and usage..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="compatibleModels">Compatible Vehicle Models</Label>
                <Input
                  id="compatibleModels"
                  placeholder="e.g., EV Model X Pro 2023, EV Compact Plus 2024"
                  value={compatibleModels}
                  onChange={(e) => setCompatibleModels(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Inventory & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Inventory & Pricing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price (VND) *</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    placeholder="e.g., 2500000"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initialStock">Initial Stock *</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    placeholder="e.g., 500"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumStock">Minimum Stock *</Label>
                  <Input
                    id="minimumStock"
                    type="number"
                    placeholder="e.g., 50"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Storage Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warehouse-a">Warehouse A - Hà Nội</SelectItem>
                      <SelectItem value="warehouse-b">Warehouse B - TP.HCM</SelectItem>
                      <SelectItem value="warehouse-c">Warehouse C - Đà Nẵng</SelectItem>
                      <SelectItem value="warehouse-d">Warehouse D - Cần Thơ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leadTime">Lead Time (Days)</Label>
                  <Input
                    id="leadTime"
                    type="number"
                    placeholder="e.g., 14"
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Truck className="h-4 w-4" />
                <span>Supplier Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Primary Supplier</Label>
                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{supplier.name}</div>
                            <div className="text-xs text-muted-foreground">{supplier.contact}</div>
                          </div>
                          <Badge variant="secondary">
                            ⭐ {supplier.rating}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {getSelectedSupplier() && (
                <Card className="bg-accent/5">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{getSelectedSupplier()?.name}</p>
                        <p className="text-sm text-muted-foreground">{getSelectedSupplier()?.contact}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">
                          ⭐ {getSelectedSupplier()?.rating} Rating
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Part Preview */}
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Part Preview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  {getSelectedCategory() && <span>{getSelectedCategory()?.icon}</span>}
                  <p><strong>Part:</strong> {partName || 'Not specified'} ({partNumber || 'Auto-generated'})</p>
                </div>
                <p><strong>Category:</strong> {getSelectedCategory()?.label || 'Not selected'}</p>
                <p><strong>Price:</strong> {unitPrice ? `${Number(unitPrice).toLocaleString()} VND` : 'Not specified'}</p>
                <p><strong>Stock:</strong> {initialStock || '0'} initial, {minimumStock || '0'} minimum</p>
                <p><strong>Lead Time:</strong> {leadTime || 'Not specified'} days</p>
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
                <span>Adding Part...</span>
              </div>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Add to Inventory
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPartInventory;