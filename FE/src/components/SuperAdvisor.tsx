

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  LogOut,
  Calendar,
  Plus,
  Edit,
  Eye,
  FileText,
  Wrench,
  CheckCircle,
  Users,
  Car
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WarrantyRecord {
  id: string;
  vinNumber: string;
  customerName: string;
  mileage: number;
  description: string;
  purchaseDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

const SuperAdvisor = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WarrantyRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state for new record
  const [newRecord, setNewRecord] = useState({
    vinNumber: '',
    mileage: '',
    customerName: '',
    description: '',
    purchaseDate: ''
  });

  // Form state for editing record
  const [editRecord, setEditRecord] = useState({
    vinNumber: '',
    mileage: '',
    customerName: '',
    description: '',
    purchaseDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed'
  });

  // Mock data - replace with actual API call
  const [records, setRecords] = useState<WarrantyRecord[]>([
    {
      id: 'CLM-001',
      vinNumber: '1HGCM82633A123456',
      customerName: 'Nguyễn Văn An',
      mileage: 15000,
      description: 'Battery charging issue',
      purchaseDate: '2023-01-15',
      status: 'pending',
      createdAt: '2024-10-01'
    },
    {
      id: 'CLM-002',
      vinNumber: '2T1BURHE0JC234567',
      customerName: 'Trần Thị Bình',
      mileage: 8500,
      description: 'Motor controller malfunction',
      purchaseDate: '2023-06-20',
      status: 'in-progress',
      createdAt: '2024-10-02'
    },
    {
      id: 'CLM-003',
      vinNumber: '3VW2K7AJ9EM345678',
      customerName: 'Lê Minh Cường',
      mileage: 22000,
      description: 'Display unit not working',
      purchaseDate: '2022-11-10',
      status: 'completed',
      createdAt: '2024-10-03'
    }
  ]);

  const handleAddRecord = () => {
    // Validation
    if (!newRecord.vinNumber || !newRecord.customerName || !newRecord.mileage || !newRecord.description || !newRecord.purchaseDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const record: WarrantyRecord = {
      id: `CLM-${String(records.length + 1).padStart(3, '0')}`,
      vinNumber: newRecord.vinNumber.toUpperCase(),
      customerName: newRecord.customerName,
      mileage: parseInt(newRecord.mileage),
      description: newRecord.description,
      purchaseDate: newRecord.purchaseDate,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRecords([...records, record]);
    setIsAddDialogOpen(false);
    
    

    toast({
      title: 'Record Created Successfully',
      description: `New warranty claim ${record.id} has been created`,
    });
  };



  const handleEditRecord = (record: WarrantyRecord) => {
    setSelectedRecord(record);
    setEditRecord({
      vinNumber: record.vinNumber,
      mileage: record.mileage.toString(),
      customerName: record.customerName,
      description: record.description,
      purchaseDate: record.purchaseDate,
      status: record.status
    });
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!editRecord.vinNumber || !editRecord.customerName || !editRecord.mileage || !editRecord.description || !editRecord.purchaseDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    //update record
    const updatedRecords = records.map(record => {
      if (record.id === selectedRecord?.id) {
        return {
          ...record,
          vinNumber: editRecord.vinNumber.toUpperCase(),
          customerName: editRecord.customerName,
          mileage: parseInt(editRecord.mileage),
          description: editRecord.description,
          purchaseDate: editRecord.purchaseDate,
          status: editRecord.status
        };
      }
      return record;
    });

    setRecords(updatedRecords);
    setIsEditMode(false);

    toast({
      title: 'Record Updated Successfully',
      description: `Warranty claim ${selectedRecord?.id} has been updated`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'pending' as const, text: 'Pending', class: 'bg-yellow-100 text-yellow-800' },
      'in-progress': { variant: 'warning' as const, text: 'In Progress', class: 'bg-blue-100 text-blue-800' },
      completed: { variant: 'success' as const, text: 'Completed', class: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <Badge variant={config.variant} className={config.class}>
        {config.text}
      </Badge>
    );
  };

  //search bang filter
  const filteredRecords = records.filter(record =>
    record.vinNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Super Advisor Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome, {user?.name || 'Super Advisor '}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
             

               <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
             

          

              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Search Box */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search by VIN"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Records Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Recent Warranty Records</CardTitle>
            <CardDescription>Manage warranty records and track their progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Record ID</TableHead>
                    <TableHead>VIN Number</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No warranty records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.vinNumber}</TableCell>
                        <TableCell className="max-w-xs truncate">{record.description}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                           
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditRecord(record)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {filteredRecords.length > 0 && (
              <div className="mt-4 text-center">
                <Button variant="outline">View All Records</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add Record Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>Create New Warranty Record</span>
            </DialogTitle>
            <DialogDescription>
              Enter vehicle and customer information to create a new warranty record
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="vinNumber">VIN Number *</Label>
              <Input
                id="vinNumber"
                placeholder="Enter VIN (17 characters)"
                value={newRecord.vinNumber}
                onChange={(e) => setNewRecord({ ...newRecord, vinNumber: e.target.value })}
                maxLength={17}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer full name"
                value={newRecord.customerName}
                onChange={(e) => setNewRecord({ ...newRecord, customerName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mileage">Mileage (km) *</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="Enter current mileage"
                value={newRecord.mileage}
                onChange={(e) => setNewRecord({ ...newRecord, mileage: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="purchaseDate">Purchase Date *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={newRecord.purchaseDate}
                onChange={(e) => setNewRecord({ ...newRecord, purchaseDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the warranty issue..."
                value={newRecord.description}
                onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            
            <Button onClick={handleAddRecord}>
              <Plus className="h-4 w-4 mr-2" />
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Record Dialog */}
      <Dialog open={isEditMode} onOpenChange={(open) => {
        if (!open) setIsEditMode(false);
      }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Edit Warranty</span>
            </DialogTitle>
            <DialogDescription>
              Update warranty claim information
            </DialogDescription>
          </DialogHeader>

          {isEditMode && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Record ID</Label>
                <p className="font-medium">{selectedRecord?.id}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-vinNumber">VIN Number *</Label>
                <Input
                  id="edit-vinNumber"
                  placeholder="Enter VIN (17 characters)"
                  value={editRecord.vinNumber}
                  onChange={(e) => setEditRecord({ ...editRecord, vinNumber: e.target.value })}
                  maxLength={17}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-customerName">Customer Name *</Label>
                <Input
                  id="edit-customerName"
                  placeholder="Enter customer full name"
                  value={editRecord.customerName}
                  onChange={(e) => setEditRecord({ ...editRecord, customerName: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-mileage">Mileage (km) *</Label>
                <Input
                  id="edit-mileage"
                  type="number"
                  placeholder="Enter current mileage"
                  value={editRecord.mileage}
                  onChange={(e) => setEditRecord({ ...editRecord, mileage: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-purchaseDate">Purchase Date *</Label>
                <Input
                  id="edit-purchaseDate"
                  type="date"
                  value={editRecord.purchaseDate}
                  onChange={(e) => setEditRecord({ ...editRecord, purchaseDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status *</Label>
                <select
                  id="edit-status"
                  value={editRecord.status}
                  onChange={(e) => setEditRecord({ ...editRecord, status: e.target.value as 'pending' | 'in-progress' | 'completed' })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Describe the warranty issue..."
                  value={editRecord.description}
                  onChange={(e) => setEditRecord({ ...editRecord, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid gap-2">
                <Label className="text-muted-foreground">Created Date</Label>
                <p className="text-sm">{selectedRecord && new Date(selectedRecord.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          <DialogFooter>
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdvisor;