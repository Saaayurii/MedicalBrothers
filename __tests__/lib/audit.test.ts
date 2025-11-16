import {
  AuditAction,
  AuditEntity,
  getActionLabel,
  getEntityLabel
} from '@/lib/audit';

describe('Audit Log System', () => {
  describe('AuditAction enum', () => {
    it('should have all required actions', () => {
      expect(AuditAction.LOGIN).toBe('login');
      expect(AuditAction.LOGOUT).toBe('logout');
      expect(AuditAction.CREATE).toBe('create');
      expect(AuditAction.UPDATE).toBe('update');
      expect(AuditAction.DELETE).toBe('delete');
      expect(AuditAction.VIEW).toBe('view');
      expect(AuditAction.STATUS_CHANGE).toBe('status_change');
      expect(AuditAction.GENERATE_REPORT).toBe('generate_report');
      expect(AuditAction.EXPORT_CSV).toBe('export_csv');
    });
  });

  describe('AuditEntity enum', () => {
    it('should have all required entities', () => {
      expect(AuditEntity.ADMIN).toBe('admin');
      expect(AuditEntity.DOCTOR).toBe('doctor');
      expect(AuditEntity.PATIENT).toBe('patient');
      expect(AuditEntity.APPOINTMENT).toBe('appointment');
      expect(AuditEntity.TIME_SLOT).toBe('time_slot');
      expect(AuditEntity.EMERGENCY_CALL).toBe('emergency_call');
      expect(AuditEntity.CONSULTATION).toBe('consultation');
      expect(AuditEntity.SETTINGS).toBe('settings');
    });
  });

  describe('getActionLabel', () => {
    it('should return correct Russian labels for actions', () => {
      expect(getActionLabel(AuditAction.LOGIN)).toBe('Вход в систему');
      expect(getActionLabel(AuditAction.LOGOUT)).toBe('Выход из системы');
      expect(getActionLabel(AuditAction.CREATE)).toBe('Создание');
      expect(getActionLabel(AuditAction.UPDATE)).toBe('Обновление');
      expect(getActionLabel(AuditAction.DELETE)).toBe('Удаление');
      expect(getActionLabel(AuditAction.STATUS_CHANGE)).toBe('Изменение статуса');
    });

    it('should return the action itself for unknown actions', () => {
      expect(getActionLabel('unknown_action')).toBe('unknown_action');
    });
  });

  describe('getEntityLabel', () => {
    it('should return correct Russian labels for entities', () => {
      expect(getEntityLabel(AuditEntity.ADMIN)).toBe('Администратор');
      expect(getEntityLabel(AuditEntity.DOCTOR)).toBe('Врач');
      expect(getEntityLabel(AuditEntity.PATIENT)).toBe('Пациент');
      expect(getEntityLabel(AuditEntity.APPOINTMENT)).toBe('Запись');
      expect(getEntityLabel(AuditEntity.EMERGENCY_CALL)).toBe('Экстренный вызов');
    });

    it('should return the entity itself for unknown entities', () => {
      expect(getEntityLabel('unknown_entity')).toBe('unknown_entity');
    });
  });
});
