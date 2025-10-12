

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
  Plus,
  Edit,
  Wrench,
  CheckCircle,
  Car,
  Trash2
} from 'lucide-react';

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return dateString;
  }
};

interface CaseNote {
  id: string;
  text: string;
  createdAt: string;
}

interface WarrantyRecord {
  id: string;
  vinNumber: string;
  customerName: string;
  mileage: number;
  cases?: CaseNote[];
  purchaseDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
}

interface VinDataState {
  vinNumber: string;
  purchaseDate: string;
  warrantyStatus: string;
}

const SuperAdvisor = () => {
  const { user, logout, getToken } = useAuth();
  const { toast } = useToast();
  
  const [searchVin, setSearchVin] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<WarrantyRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddNewcaseOpen, setIsAddNewcaseOpen] = useState(false);
  const [currentCaseText, setCurrentCaseText] = useState('');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [isDialogSearch, setIsDialogSearch] = useState(false);
  // Form state for new record
  const [newRecord, setNewRecord] = useState({
    vinNumber: '',
    mileage: '',
    customerName: '',
    cases: [] as CaseNote[],
    purchaseDate: ''
  });

  const [vinData, setVinData] = useState<VinDataState>({
    vinNumber: "",
    purchaseDate: "",
    warrantyStatus: ""
  });

  // Form state for editing record
  const [editRecord, setEditRecord] = useState({
    vinNumber: '',
    mileage: '',
    customerName: '',
    cases: [] as CaseNote[],
    purchaseDate: '',
    status: 'pending' as 'pending' | 'in-progress' | 'completed'
  });

  const [records, setRecords] = useState<WarrantyRecord[]>([]);

  // Helper: Validate record data
  const validateRecord = (record: { vinNumber: string; customerName: string; mileage: string; cases: CaseNote[]; purchaseDate: string }) => {
    return record.vinNumber && record.customerName && record.mileage && record.cases.length > 0 && record.purchaseDate;
  };

  // Helper: Calculate warranty status
  const calculateWarrantyStatus = (durationStatus?: string, mileageStatus?: string) => {
    if (durationStatus === 'ACTIVE' && mileageStatus === 'ACTIVE') return 'Active';
    if (durationStatus === 'INACTIVE' && mileageStatus === 'INACTIVE') return 'Expired (Time & Mileage)';
    if (durationStatus === 'INACTIVE') return 'Expired (Time)';
    if (mileageStatus === 'INACTIVE') return 'Expired (Mileage)';
    return 'N/A';
  };

  const handleSearchWarranty = async () => {
  try {
    if (!searchVin.trim()) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng nhập VIN',
        variant: 'destructive'
      });
      return;
    }

    const vin = searchVin.trim();
    const odometer = 0;

    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
    if (!token) {
      console.error("No token found (checked AuthContext.getToken and localStorage 'ev_warranty_token')");
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy token đăng nhập',
        variant: 'destructive'
      });
      return;
    }

    const url = `http://localhost:3000/api/v1/vehicles/${vin}/warranty?odometer=${odometer}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok || data.status !== 'success') {
      toast({
        title: 'Unable to find warranty',
        variant: 'destructive'
      });
      return;
    }    if (data && data.status === 'success' && data.data && data.data.vehicle) {
      const vehicle = data.data.vehicle;
      const warrantyStatus = vehicle.generalWarranty && vehicle.purchaseDate
        ? calculateWarrantyStatus(
            vehicle.generalWarranty.duration?.status,
            vehicle.generalWarranty.mileage?.status
          )
        : 'N/A';
      
      setVinData({
        vinNumber: vehicle.vin || '',
        purchaseDate: vehicle.purchaseDate ? new Date(vehicle.purchaseDate).toLocaleDateString('vi-VN') : '',
        warrantyStatus
      });

      setIsDialogSearch(true);

      toast({
        title: 'Thành công',
        description: 'Đã tải thông tin VIN',
      });
    } else {
      toast({
        title: 'Không có dữ liệu',
        description: 'Không tìm thấy thông tin xe',
        variant: 'destructive'
      });
    }

  } catch (error) {
    console.error("Failed to fetch VIN warranty info:", error);
    
  }
};

  const handleAddRecord = () => {
    if (!validateRecord(newRecord)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and add at least one case',
        variant: 'destructive'
      });
      return;
    }

    const record: WarrantyRecord = {
      id: `CLM-${String(records.length + 1).padStart(3, '0')}`,
      vinNumber: newRecord.vinNumber.toUpperCase(),
      customerName: newRecord.customerName,
      mileage: parseInt(newRecord.mileage),
      cases: newRecord.cases,
      purchaseDate: newRecord.purchaseDate,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setRecords([...records, record]);
    setIsAddDialogOpen(false);
    setNewRecord({ vinNumber: '', mileage: '', customerName: '', cases: [], purchaseDate: '' });

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
      cases: record.cases || [],
      purchaseDate: record.purchaseDate,
      status: record.status
    });
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (!validateRecord(editRecord)) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and have at least one case',
        variant: 'destructive'
      });
      return;
    }

    const updatedRecords = records.map(record => {
      if (record.id === selectedRecord?.id) {
        return {
          ...record,
          vinNumber: editRecord.vinNumber.toUpperCase(),
          customerName: editRecord.customerName,
          mileage: parseInt(editRecord.mileage),
          cases: editRecord.cases,
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
                <p className="text-sm text-muted-foreground">Welcome, Super Advisor </p>
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
                  placeholder="Enter VIN"
                  className="pl-10 h-11"
                  value={searchVin}
                  onChange={(e) => setSearchVin(e.target.value)}
                />
              </div>
              <Button 
                size="sm" 
                className="bg-primary hover:bg-primary/90"
                onClick={handleSearchWarranty}
              >
                Search
              </Button>
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
                    <TableHead>Case</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No warranty records found
                      </TableCell>
                    </TableRow>
                  ) : (
                    records.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell className="font-mono text-sm">{record.vinNumber}</TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{record.cases?.length || 0} cases</Badge>
                            {record.cases && record.cases.length > 0 && (
                              <span className="text-sm truncate">{record.cases[0].text}</span>
                            )}
                          </div>
                        </TableCell>
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

              {records.length > 0 && (
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
              <Label htmlFor="purchaseDate">Release Date *</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={newRecord.purchaseDate}
                onChange={(e) => setNewRecord({ ...newRecord, purchaseDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between mb-2">
                <Label>Cases * ({newRecord.cases.length})</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCurrentCaseText('');
                    setEditingCaseId(null);
                    setIsAddNewcaseOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New Case
                </Button>
              </div>
              {newRecord.cases.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newRecord.cases.map((caseNote, index) => (
                    <div key={caseNote.id} className="p-3 bg-muted/50 rounded-md border flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">Case {index + 1}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(caseNote.createdAt)}</span>
                        </div>
                        <p className="text-sm break-words">{caseNote.text}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setCurrentCaseText(caseNote.text);
                            setEditingCaseId(caseNote.id);
                            setIsAddNewcaseOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewRecord({
                              ...newRecord,
                              cases: newRecord.cases.filter(c => c.id !== caseNote.id)
                            });
                            toast({ title: 'Case deleted' });
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-muted/20 rounded-md border border-dashed">
                  <p className="text-sm text-muted-foreground italic">No cases added yet. Click "New Case" to add one.</p>
                </div>
              )}
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

      {/* dialog search */}
      <Dialog open={isDialogSearch} onOpenChange={setIsDialogSearch}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Car className="h-5 w-5" />
              <span>VIN Warranty</span>
            </DialogTitle>
            <DialogDescription>
              Vehicle warranty information and coverage details
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4" >
            <div className="grid gap-2">
              <Label>VIN Number</Label>
              <Input
                id="vinNumber"
                placeholder="VIN" 
                value={vinData.vinNumber}
                readOnly              
              />
            </div>

            <div className="grid gap-2">
              <Label>Purchase Date</Label>
              <Input
                id="purchaseDate"
                placeholder="Purchase Date" 
                value={vinData.purchaseDate}
                readOnly             
              />
            </div>

            <div className="grid gap-2">
              <Label>Warranty Status</Label>
              <Input
                id="Status"
                placeholder="Warranty status"
                value={vinData.warrantyStatus}
                readOnly
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      

      {/* Nested New Case Dialog */}
      <Dialog open={isAddNewcaseOpen} onOpenChange={(open) => {
        setIsAddNewcaseOpen(open);
        if (!open) {
          setCurrentCaseText('');
          setEditingCaseId(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCaseId ? 'Edit Case' : 'New Case'}</DialogTitle>
            <DialogDescription>
              {editingCaseId ? 'Update the case details' : 'Enter case details for this warranty record'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="caseText">Case Description *</Label>
              <Textarea
                id="caseText"
                placeholder="Describe the case..."
                value={currentCaseText}
                onChange={(e) => setCurrentCaseText(e.target.value)}
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddNewcaseOpen(false);
              setCurrentCaseText('');
              setEditingCaseId(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (!currentCaseText.trim()) {
                toast({
                  title: 'Validation Error',
                  description: 'Please enter case description',
                  variant: 'destructive'
                });
                return;
              }

              if (isEditMode) {
                // Working with edit dialog
                if (editingCaseId) {
                  // Edit existing case in edit mode
                  setEditRecord({
                    ...editRecord,
                    cases: editRecord.cases.map(c => 
                      c.id === editingCaseId 
                        ? { ...c, text: currentCaseText } 
                        : c
                    )
                  });
                  toast({ title: 'Case updated successfully' });
                } else {
                  // Add new case in edit mode
                  const newCase: CaseNote = {
                    id: Date.now().toString(),
                    text: currentCaseText,
                    createdAt: new Date().toISOString()
                  };
                  setEditRecord({
                    ...editRecord,
                    cases: [...editRecord.cases, newCase]
                  });
                  toast({ title: 'Case added successfully' });
                }
              } else {
                // Working with add dialog
                if (editingCaseId) {
                  // Edit existing case
                  setNewRecord({
                    ...newRecord,
                    cases: newRecord.cases.map(c => 
                      c.id === editingCaseId 
                        ? { ...c, text: currentCaseText } 
                        : c
                    )
                  });
                  toast({ title: 'Case updated successfully' });
                } else {
                  // Add new case
                  const newCase: CaseNote = {
                    id: Date.now().toString(),
                    text: currentCaseText,
                    createdAt: new Date().toISOString()
                  };
                  setNewRecord({
                    ...newRecord,
                    cases: [...newRecord.cases, newCase]
                  });
                  toast({ title: 'Case added successfully' });
                }
              }

              setIsAddNewcaseOpen(false);
              setCurrentCaseText('');
              setEditingCaseId(null);
            }}>
              {editingCaseId ? 'Update Case' : 'Add Case'}
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
                <div className="flex items-center justify-between mb-2">
                  <Label>Cases * ({editRecord.cases.length})</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCurrentCaseText('');
                      setEditingCaseId(null);
                      setIsAddNewcaseOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    New Case
                  </Button>
                </div>
                {editRecord.cases.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {editRecord.cases.map((caseNote, index) => (
                      <div key={caseNote.id} className="p-3 bg-muted/50 rounded-md border flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">Case {index + 1}</Badge>
                            <span className="text-xs text-muted-foreground">{formatDate(caseNote.createdAt)}</span>
                          </div>
                          <p className="text-sm break-words">{caseNote.text}</p>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setCurrentCaseText(caseNote.text);
                              setEditingCaseId(caseNote.id);
                              setIsAddNewcaseOpen(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditRecord({
                                ...editRecord,
                                cases: editRecord.cases.filter(c => c.id !== caseNote.id)
                              });
                              toast({ title: 'Case deleted' });
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/20 rounded-md border border-dashed">
                    <p className="text-sm text-muted-foreground italic">No cases added yet. Click "New Case" to add one.</p>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label className="text-muted-foreground">Created Date</Label>
                <p className="text-sm">{selectedRecord && formatDate(selectedRecord.createdAt)}</p>
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