import { UserRole } from '@/api/models';

// Utility functions for role-based access control
export const hasRole = (userRole: string | undefined, allowedRoles: string[]): boolean => {
  if (!userRole) return false;
  
  // Convert user role to lowercase and normalize
  const normalizedUserRole = userRole.toLowerCase().replace(/_/g, '-');
  
  // Check against allowed roles (normalize them too)
  return allowedRoles.some(role => {
    const normalizedRole = role.toLowerCase().replace(/_/g, '-');
    return normalizedUserRole === normalizedRole;
  });
};

export const isSuperAdmin = (userRole: string | undefined): boolean => {
  const result = hasRole(userRole, ['super-admin', 'super_admin']);
  console.log('isSuperAdmin check:', userRole, '->', result);
  return result;
};

export const isDispensaryAdmin = (userRole: string | undefined): boolean => {
  return hasRole(userRole, ['dispensary-admin', 'hospital_admin', 'hospital-admin']);
};

export const isDispensaryStaff = (userRole: string | undefined): boolean => {
  return hasRole(userRole, ['dispensary-staff', 'hospital_staff', 'hospital-staff']);
};

export const isDoctor = (userRole: string | undefined): boolean => {
  return hasRole(userRole, ['doctor']);
};

export const isChannelPartner = (userRole: string | undefined): boolean => {
  return hasRole(userRole, ['channel-partner']);
};

export const canManageUsers = (userRole: string | undefined): boolean => {
  return isSuperAdmin(userRole);
};

export const canManageDispensaries = (userRole: string | undefined): boolean => {
  return isSuperAdmin(userRole);
};

export const canManageDoctors = (userRole: string | undefined): boolean => {
  return isSuperAdmin(userRole) || isDispensaryAdmin(userRole);
};

export const canManageTimeslots = (userRole: string | undefined): boolean => {
  return isSuperAdmin(userRole) || isDispensaryAdmin(userRole);
};

export const canManageBookings = (userRole: string | undefined): boolean => {
  return isSuperAdmin(userRole) || isDispensaryAdmin(userRole) || isDispensaryStaff(userRole);
};

export const canCreateBookings = (userRole: string | undefined): boolean => {
  return isSuperAdmin(userRole) || isDispensaryAdmin(userRole) || isDispensaryStaff(userRole) || isChannelPartner(userRole);
};

export const canViewOwnReports = (userRole: string | undefined): boolean => {
  return isChannelPartner(userRole);
};

export const canViewReports = (userRole: string | undefined): boolean => {
  return isSuperAdmin(userRole) || isDispensaryAdmin(userRole);
};

export const canManageFees = (userRole: string | undefined): boolean => {
  return isSuperAdmin(userRole);
};

export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'super-admin': 'Super Administrator',
    'super_admin': 'Super Administrator', 
    'dispensary-admin': 'Dispensary Administrator',
    'hospital_admin': 'Hospital Administrator',
    'dispensary-staff': 'Dispensary Staff',
    'hospital_staff': 'Hospital Staff',
    'doctor': 'Doctor',
    'channel-partner': 'Channel Partner'
  };
  
  return roleMap[role] || role.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};