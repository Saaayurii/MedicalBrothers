import prisma from './prisma';

export enum AuditAction {
  // Auth actions
  LOGIN = 'login',
  LOGOUT = 'logout',

  // CRUD actions
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',

  // Status changes
  STATUS_CHANGE = 'status_change',

  // Report generation
  GENERATE_REPORT = 'generate_report',
  EXPORT_CSV = 'export_csv',
}

export enum AuditEntity {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  APPOINTMENT = 'appointment',
  TIME_SLOT = 'time_slot',
  EMERGENCY_CALL = 'emergency_call',
  CONSULTATION = 'consultation',
  SETTINGS = 'settings',
}

interface AuditLogData {
  adminId: number;
  action: AuditAction | string;
  entity: AuditEntity | string;
  entityId?: number | null;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress || 'unknown',
        userAgent: data.userAgent || 'unknown',
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit log failures shouldn't break the main operation
  }
}

export async function logLogin(adminId: number): Promise<void> {
  await createAuditLog({
    adminId,
    action: AuditAction.LOGIN,
    entity: AuditEntity.ADMIN,
    entityId: adminId,
  });
}

export async function logLogout(adminId: number): Promise<void> {
  await createAuditLog({
    adminId,
    action: AuditAction.LOGOUT,
    entity: AuditEntity.ADMIN,
    entityId: adminId,
  });
}

export async function logCreate(
  adminId: number,
  entity: AuditEntity | string,
  entityId: number,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    adminId,
    action: AuditAction.CREATE,
    entity,
    entityId,
    details,
  });
}

export async function logUpdate(
  adminId: number,
  entity: AuditEntity | string,
  entityId: number,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    adminId,
    action: AuditAction.UPDATE,
    entity,
    entityId,
    details,
  });
}

export async function logDelete(
  adminId: number,
  entity: AuditEntity | string,
  entityId: number,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    adminId,
    action: AuditAction.DELETE,
    entity,
    entityId,
    details,
  });
}

export async function logStatusChange(
  adminId: number,
  entity: AuditEntity | string,
  entityId: number,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  await createAuditLog({
    adminId,
    action: AuditAction.STATUS_CHANGE,
    entity,
    entityId,
    details: { oldStatus, newStatus },
  });
}

export async function getAuditLogs(options?: {
  adminId?: number;
  action?: string;
  entity?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (options?.adminId) where.adminId = options.adminId;
  if (options?.action) where.action = options.action;
  if (options?.entity) where.entity = options.entity;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            username: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    [AuditAction.LOGIN]: 'Вход в систему',
    [AuditAction.LOGOUT]: 'Выход из системы',
    [AuditAction.CREATE]: 'Создание',
    [AuditAction.UPDATE]: 'Обновление',
    [AuditAction.DELETE]: 'Удаление',
    [AuditAction.VIEW]: 'Просмотр',
    [AuditAction.STATUS_CHANGE]: 'Изменение статуса',
    [AuditAction.GENERATE_REPORT]: 'Генерация отчёта',
    [AuditAction.EXPORT_CSV]: 'Экспорт CSV',
  };

  return labels[action] || action;
}

export function getEntityLabel(entity: string): string {
  const labels: Record<string, string> = {
    [AuditEntity.ADMIN]: 'Администратор',
    [AuditEntity.DOCTOR]: 'Врач',
    [AuditEntity.PATIENT]: 'Пациент',
    [AuditEntity.APPOINTMENT]: 'Запись',
    [AuditEntity.TIME_SLOT]: 'Временной слот',
    [AuditEntity.EMERGENCY_CALL]: 'Экстренный вызов',
    [AuditEntity.CONSULTATION]: 'Консультация',
    [AuditEntity.SETTINGS]: 'Настройки',
  };

  return labels[entity] || entity;
}
