// Role-based access control system

export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  REGISTRAR = 'registrar',
  NURSE = 'nurse',
}

export const ROLE_LABELS: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Супер Администратор',
  [Role.ADMIN]: 'Администратор',
  [Role.DOCTOR]: 'Врач',
  [Role.REGISTRAR]: 'Регистратор',
  [Role.NURSE]: 'Медсестра',
};

export enum Permission {
  // Doctor management
  VIEW_DOCTORS = 'view_doctors',
  ADD_DOCTOR = 'add_doctor',
  EDIT_DOCTOR = 'edit_doctor',
  DELETE_DOCTOR = 'delete_doctor',

  // Patient management
  VIEW_PATIENTS = 'view_patients',
  ADD_PATIENT = 'add_patient',
  EDIT_PATIENT = 'edit_patient',
  DELETE_PATIENT = 'delete_patient',

  // Appointment management
  VIEW_ALL_APPOINTMENTS = 'view_all_appointments',
  VIEW_OWN_APPOINTMENTS = 'view_own_appointments',
  ADD_APPOINTMENT = 'add_appointment',
  EDIT_APPOINTMENT = 'edit_appointment',
  DELETE_APPOINTMENT = 'delete_appointment',
  CHANGE_APPOINTMENT_STATUS = 'change_appointment_status',

  // Time slots management
  GENERATE_SLOTS = 'generate_slots',
  EDIT_SLOTS = 'edit_slots',

  // Reports and analytics
  VIEW_REPORTS = 'view_reports',
  GENERATE_REPORTS = 'generate_reports',

  // Settings and configuration
  VIEW_SETTINGS = 'view_settings',
  EDIT_SETTINGS = 'edit_settings',

  // User management
  VIEW_USERS = 'view_users',
  ADD_USER = 'add_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',

  // Audit logs
  VIEW_AUDIT_LOGS = 'view_audit_logs',

  // Emergency calls
  VIEW_EMERGENCY_CALLS = 'view_emergency_calls',
  MANAGE_EMERGENCY_CALLS = 'manage_emergency_calls',
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // All permissions
    Permission.VIEW_DOCTORS,
    Permission.ADD_DOCTOR,
    Permission.EDIT_DOCTOR,
    Permission.DELETE_DOCTOR,
    Permission.VIEW_PATIENTS,
    Permission.ADD_PATIENT,
    Permission.EDIT_PATIENT,
    Permission.DELETE_PATIENT,
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.ADD_APPOINTMENT,
    Permission.EDIT_APPOINTMENT,
    Permission.DELETE_APPOINTMENT,
    Permission.CHANGE_APPOINTMENT_STATUS,
    Permission.GENERATE_SLOTS,
    Permission.EDIT_SLOTS,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.EDIT_SETTINGS,
    Permission.VIEW_USERS,
    Permission.ADD_USER,
    Permission.EDIT_USER,
    Permission.DELETE_USER,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_EMERGENCY_CALLS,
    Permission.MANAGE_EMERGENCY_CALLS,
  ],

  [Role.ADMIN]: [
    // Almost all permissions except user management
    Permission.VIEW_DOCTORS,
    Permission.ADD_DOCTOR,
    Permission.EDIT_DOCTOR,
    Permission.VIEW_PATIENTS,
    Permission.ADD_PATIENT,
    Permission.EDIT_PATIENT,
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.ADD_APPOINTMENT,
    Permission.EDIT_APPOINTMENT,
    Permission.CHANGE_APPOINTMENT_STATUS,
    Permission.GENERATE_SLOTS,
    Permission.EDIT_SLOTS,
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_SETTINGS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.VIEW_EMERGENCY_CALLS,
    Permission.MANAGE_EMERGENCY_CALLS,
  ],

  [Role.DOCTOR]: [
    // Can only view their own appointments and patients
    Permission.VIEW_PATIENTS,
    Permission.VIEW_OWN_APPOINTMENTS,
    Permission.CHANGE_APPOINTMENT_STATUS,
    Permission.VIEW_REPORTS, // Only their own performance
  ],

  [Role.REGISTRAR]: [
    // Can manage patients and appointments
    Permission.VIEW_DOCTORS,
    Permission.VIEW_PATIENTS,
    Permission.ADD_PATIENT,
    Permission.EDIT_PATIENT,
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.ADD_APPOINTMENT,
    Permission.EDIT_APPOINTMENT,
    Permission.CHANGE_APPOINTMENT_STATUS,
  ],

  [Role.NURSE]: [
    // Can view and update appointment status
    Permission.VIEW_DOCTORS,
    Permission.VIEW_PATIENTS,
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.CHANGE_APPOINTMENT_STATUS,
  ],
};

export function hasPermission(role: string, permission: Permission): boolean {
  const userRole = role as Role;
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions ? permissions.includes(permission) : false;
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role as Role] || role;
}

export function getAllRoles(): Role[] {
  return Object.values(Role);
}
