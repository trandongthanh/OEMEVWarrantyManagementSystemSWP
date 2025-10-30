import { User } from '@/contexts/AuthContext';

export type Permission =
  | 'create_claim'
  | 'register_vehicle'
  | 'add_customer'
  | 'validate_warranty'
  | 'assign_technicians'
  | 'update_diagnostic'
  | 'finalize_diagnosis'
  | 'submit_to_manufacturer'
  | 'approve_reject_claims'
  | 'manage_campaigns'
  | 'view_all_claims'
  | 'attach_parts'
  | 'view_claim_details'
  | 'update_technical_status';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  service_center_staff: [
    'create_claim',
    'register_vehicle',
    'add_customer',
    'validate_warranty',
    'assign_technicians',
    'submit_to_manufacturer',
    'manage_campaigns',
    'view_all_claims',
    'attach_parts',
    'view_claim_details'
  ],
  // Backend has a role named `parts_coordinator_service_center` (seeders). Map it to same permissions as service_center_staff
  parts_coordinator_service_center: [
    'create_claim',
    'register_vehicle',
    'add_customer',
    'validate_warranty',
    'assign_technicians',
    'submit_to_manufacturer',
    'manage_campaigns',
    'view_all_claims',
    'attach_parts',
    'view_claim_details'
  ],
  service_center_manager: [
    'create_claim',
    'register_vehicle',
    'add_customer',
    'validate_warranty',
    'assign_technicians',
    'submit_to_manufacturer',
    'manage_campaigns',
    'view_all_claims',
    'attach_parts',
    'view_claim_details',
    'approve_reject_claims',
    'update_technical_status'
  ],
  service_center_technician: [
    'view_claim_details',
    'update_diagnostic',
    'finalize_diagnosis',
    'attach_parts',
    'view_all_claims',
    'update_technical_status'
  ],
  evm_admin: [
    'approve_reject_claims',
    'view_all_claims',
    'view_claim_details',
    'manage_campaigns'
  ],
  evm_staff: [
    'approve_reject_claims',
    'view_all_claims',
    'view_claim_details'
  ]
};

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
};

export const getAvailableStatuses = (userRole: string, currentStatus: string): string[] => {
  if (userRole === 'service_center_staff') {
    switch (currentStatus) {
      case 'warranty_check':
        return ['warranty_valid', 'warranty_expired'];
      case 'warranty_valid':
        return ['technician_assigned'];
      case 'technician_assigned':
        return ['diagnostic_in_progress'];
      case 'diagnostic_complete':
        return ['submitted_to_manufacturer'];
      case 'submitted_to_manufacturer':
        return ['pending_approval'];
      case 'approved':
        return ['parts_received', 'warranty_in_progress'];
      case 'warranty_complete':
        return ['ready_for_delivery'];
      case 'ready_for_delivery':
        return ['delivered_to_customer'];
      default:
        return [];
    }
  }

  if (userRole === 'service_center_technician') {
    switch (currentStatus) {
      case 'technician_assigned':
        return ['diagnostic_in_progress'];
      case 'diagnostic_in_progress':
        return ['diagnostic_complete'];
      case 'parts_received':
        return ['warranty_in_progress'];
      case 'warranty_in_progress':
        return ['warranty_complete'];
      default:
        return [];
    }
  }

  if (userRole === 'evm_admin' || userRole === 'evm_staff') {
    switch (currentStatus) {
      case 'pending_approval':
        return ['approved', 'rejected'];
      case 'approved':
        return ['parts_shipped'];
      default:
        return [];
    }
  }

  return [];
};

export const canUpdateStatus = (userRole: string, fromStatus: string, toStatus: string): boolean => {
  const availableStatuses = getAvailableStatuses(userRole, fromStatus);
  return availableStatuses.includes(toStatus);
};