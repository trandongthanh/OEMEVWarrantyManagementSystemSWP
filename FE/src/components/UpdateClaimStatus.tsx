import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailableStatuses, canUpdateStatus } from '@/utils/permissions';
import {
  RefreshCw,
  X,
  Save,
  Clock,
  CheckCircle,
  XCircle,
  Wrench,
  AlertTriangle,
  FileText,
  Send
} from 'lucide-react';

interface UpdateClaimStatusProps {
  claimId: string;
  currentStatus: string;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

const UpdateClaimStatus = ({ claimId, currentStatus, onClose, onStatusUpdated }: UpdateClaimStatusProps) => {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const statusOptions = [
    {
      value: 'pending',
      label: 'Chờ duyệt',
      description: 'Claim đang chờ manufacturer xem xét',
      icon: Clock,
      color: 'text-warning'
    },
    {
      value: 'approved',
      label: 'Đã duyệt',
      description: 'Manufacturer đã phê duyệt claim',
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      value: 'rejected',
      label: 'Từ chối',
      description: 'Claim bị từ chối với lý do cụ thể',
      icon: XCircle,
      color: 'text-destructive'
    },
    {
      value: 'in-progress',
      label: 'Đang sửa chữa',
      description: 'Technician đang thực hiện sửa chữa',
      icon: Wrench,
      color: 'text-primary'
    },
    {
      value: 'completed',
      label: 'Hoàn thành',
      description: 'Sửa chữa hoàn tất, sẵn sàng bàn giao',
      icon: CheckCircle,
      color: 'text-success'
    },
    {
      value: 'cancelled',
      label: 'Hủy bỏ',
      description: 'Claim bị hủy bỏ',
      icon: XCircle,
      color: 'text-muted-foreground'
    }
  ];

  // Get available statuses based on user role and current status
  const availableStatuses = getAvailableStatuses(user?.role || '', currentStatus);
  const filteredStatusOptions = statusOptions.filter(option => 
    availableStatuses.includes(option.value) || option.value === currentStatus
  );

  const getStatusConfig = (status: string) => {
    return statusOptions.find(option => option.value === status);
  };

  const getCurrentStatusConfig = () => getStatusConfig(currentStatus);
  const getNewStatusConfig = () => getStatusConfig(newStatus);

  const validateStatusChange = () => {
    // Use the permission system instead of hardcoded rules
    return canUpdateStatus(user?.role || '', currentStatus, newStatus) || currentStatus === newStatus;
  };

  const getRequiredFields = () => {
    const requirements: Record<string, string[]> = {
      'rejected': ['notes'], // Must provide reason for rejection
      'completed': ['notes'], // Must provide completion notes
      'cancelled': ['notes'] // Must provide cancellation reason
    };

    return requirements[newStatus] || [];
  };

  const handleStatusUpdate = () => {
    if (!validateStatusChange()) {
      toast({
        title: "Invalid Status Change",
        description: "This status transition is not allowed",
        variant: "destructive"
      });
      return;
    }

    const requiredFields = getRequiredFields();
    if (requiredFields.includes('notes') && !notes.trim()) {
      toast({
        title: "Notes Required",
        description: `Please provide notes for this status change`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Status Updated Successfully!",
        description: `Claim ${claimId} status changed to ${getNewStatusConfig()?.label}`,
      });
      
      setIsLoading(false);
      onStatusUpdated?.();
      onClose();
    }, 2000);
  };

  const getStatusBadge = (status: string) => {
    const config = getStatusConfig(status);
    if (!config) return null;

    const Icon = config.icon;
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isStatusChanged = currentStatus !== newStatus;
  const canUpdate = validateStatusChange() && (isStatusChanged || notes.trim());

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
                <CardTitle className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5 text-primary" />
                  <span>
                    {user?.role === 'technician' ? 'Update Repair Progress' : 'Update Claim Status'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {user?.role === 'technician' 
                    ? `Update repair progress for claim ${claimId}`
                    : `Change status for claim ${claimId}`
                  }
                </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(currentStatus)}
                  <p className="text-xs text-muted-foreground mt-1">
                    {getCurrentStatusConfig()?.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Status Selection */}
          <div className="space-y-3">
            <Label>New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {filteredStatusOptions.map((option) => {
                  const Icon = option.icon;
                  const isCurrentStatus = option.value === currentStatus;
                  
                  return (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${option.color}`} />
                        <div>
                          <div>{option.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {isStatusChanged && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Status Change Preview</span>
                  </div>
                  <div className="flex items-center space-x-3 mt-2">
                    {getStatusBadge(currentStatus)}
                    <span>→</span>
                    {getStatusBadge(newStatus)}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notes">
                Status Notes
                {getRequiredFields().includes('notes') && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </Label>
              {getRequiredFields().includes('notes') && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
            </div>
            <Textarea
              id="notes"
              placeholder={
                newStatus === 'rejected' ? "Provide reason for rejection..." :
                newStatus === 'completed' ? "Describe what was completed..." :
                newStatus === 'cancelled' ? "Provide reason for cancellation..." :
                "Add any additional notes about this status change..."
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Additional Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notify-customer"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="notify-customer" className="text-sm">
                  Send notification to customer
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Customer will receive email/SMS about this status update
              </p>
            </CardContent>
          </Card>

          {/* Status Change Rules */}
          {!validateStatusChange() && isStatusChanged && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Invalid Status Change</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cannot change from "{getCurrentStatusConfig()?.label}" to "{getNewStatusConfig()?.label}". 
                  Please follow the proper workflow sequence.
                </p>
              </CardContent>
            </Card>
          )}

          {/* User Info */}
          <div className="text-xs text-muted-foreground border-t pt-4">
            <div className="flex items-center justify-between">
              <span>Status will be updated by: {user?.name} ({user?.role})</span>
              {user?.role === 'technician' && (
                <Badge variant="outline" className="text-xs">
                  Limited to technical progress only
                </Badge>
              )}
            </div>
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
              onClick={handleStatusUpdate}
              disabled={!canUpdate || isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  <span>Updating...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Status
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UpdateClaimStatus;