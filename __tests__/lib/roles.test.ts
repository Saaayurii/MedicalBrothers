import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getRoleLabel,
  getAllRoles,
  Role,
  Permission,
  ROLE_PERMISSIONS
} from '@/lib/roles';

describe('Role-based Access Control', () => {
  describe('hasPermission', () => {
    it('should return true for super_admin with any permission', () => {
      expect(hasPermission(Role.SUPER_ADMIN, Permission.VIEW_DOCTORS)).toBe(true);
      expect(hasPermission(Role.SUPER_ADMIN, Permission.DELETE_PATIENT)).toBe(true);
      expect(hasPermission(Role.SUPER_ADMIN, Permission.VIEW_AUDIT_LOGS)).toBe(true);
    });

    it('should return true for admin with allowed permissions', () => {
      expect(hasPermission(Role.ADMIN, Permission.VIEW_DOCTORS)).toBe(true);
      expect(hasPermission(Role.ADMIN, Permission.ADD_PATIENT)).toBe(true);
    });

    it('should return false for admin with restricted permissions', () => {
      expect(hasPermission(Role.ADMIN, Permission.DELETE_USER)).toBe(false);
      expect(hasPermission(Role.ADMIN, Permission.ADD_USER)).toBe(false);
    });

    it('should return false for doctor with unauthorized permissions', () => {
      expect(hasPermission(Role.DOCTOR, Permission.VIEW_ALL_APPOINTMENTS)).toBe(false);
      expect(hasPermission(Role.DOCTOR, Permission.ADD_DOCTOR)).toBe(false);
    });

    it('should return true for doctor with allowed permissions', () => {
      expect(hasPermission(Role.DOCTOR, Permission.VIEW_OWN_APPOINTMENTS)).toBe(true);
      expect(hasPermission(Role.DOCTOR, Permission.CHANGE_APPOINTMENT_STATUS)).toBe(true);
    });

    it('should return true for registrar with patient management permissions', () => {
      expect(hasPermission(Role.REGISTRAR, Permission.ADD_PATIENT)).toBe(true);
      expect(hasPermission(Role.REGISTRAR, Permission.VIEW_PATIENTS)).toBe(true);
      expect(hasPermission(Role.REGISTRAR, Permission.ADD_APPOINTMENT)).toBe(true);
    });

    it('should return false for registrar with admin permissions', () => {
      expect(hasPermission(Role.REGISTRAR, Permission.DELETE_DOCTOR)).toBe(false);
      expect(hasPermission(Role.REGISTRAR, Permission.VIEW_AUDIT_LOGS)).toBe(false);
    });

    it('should return true for nurse with basic permissions', () => {
      expect(hasPermission(Role.NURSE, Permission.VIEW_PATIENTS)).toBe(true);
      expect(hasPermission(Role.NURSE, Permission.CHANGE_APPOINTMENT_STATUS)).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      expect(hasAnyPermission(Role.DOCTOR, [
        Permission.ADD_DOCTOR,
        Permission.VIEW_OWN_APPOINTMENTS
      ])).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(hasAnyPermission(Role.NURSE, [
        Permission.DELETE_PATIENT,
        Permission.ADD_DOCTOR
      ])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      expect(hasAllPermissions(Role.SUPER_ADMIN, [
        Permission.VIEW_DOCTORS,
        Permission.ADD_DOCTOR,
        Permission.DELETE_DOCTOR
      ])).toBe(true);
    });

    it('should return false if user lacks any permission', () => {
      expect(hasAllPermissions(Role.ADMIN, [
        Permission.VIEW_DOCTORS,
        Permission.DELETE_USER
      ])).toBe(false);
    });
  });

  describe('getRoleLabel', () => {
    it('should return correct Russian labels for roles', () => {
      expect(getRoleLabel(Role.SUPER_ADMIN)).toBe('Супер Администратор');
      expect(getRoleLabel(Role.ADMIN)).toBe('Администратор');
      expect(getRoleLabel(Role.DOCTOR)).toBe('Врач');
      expect(getRoleLabel(Role.REGISTRAR)).toBe('Регистратор');
      expect(getRoleLabel(Role.NURSE)).toBe('Медсестра');
    });

    it('should return the role itself for unknown roles', () => {
      expect(getRoleLabel('unknown_role')).toBe('unknown_role');
    });
  });

  describe('getAllRoles', () => {
    it('should return all available roles', () => {
      const roles = getAllRoles();
      expect(roles).toContain(Role.SUPER_ADMIN);
      expect(roles).toContain(Role.ADMIN);
      expect(roles).toContain(Role.DOCTOR);
      expect(roles).toContain(Role.REGISTRAR);
      expect(roles).toContain(Role.NURSE);
      expect(roles).toHaveLength(5);
    });
  });

  describe('ROLE_PERMISSIONS', () => {
    it('should have permissions defined for all roles', () => {
      const roles = getAllRoles();
      roles.forEach(role => {
        expect(ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      });
    });

    it('super_admin should have the most permissions', () => {
      const superAdminPerms = ROLE_PERMISSIONS[Role.SUPER_ADMIN].length;
      const adminPerms = ROLE_PERMISSIONS[Role.ADMIN].length;
      const doctorPerms = ROLE_PERMISSIONS[Role.DOCTOR].length;

      expect(superAdminPerms).toBeGreaterThan(adminPerms);
      expect(adminPerms).toBeGreaterThan(doctorPerms);
    });
  });
});
