import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import { hasPermission, Permission } from './roles';

const SESSION_COOKIE_NAME = 'admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 дней

export interface AdminSession {
  adminId: number;
  username: string;
  email: string;
  role: string;
  doctorId?: number | null;
}

// Хеширование пароля
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Проверка пароля
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Создание сессии
export async function createSession(adminId: number): Promise<void> {
  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: { id: true, username: true, email: true, role: true, doctorId: true },
  });

  if (!admin) {
    throw new Error('Admin not found');
  }

  const session: AdminSession = {
    adminId: admin.id,
    username: admin.username,
    email: admin.email,
    role: admin.role,
    doctorId: admin.doctorId,
  };

  // Сохраняем в cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });

  // Обновляем lastLoginAt
  await prisma.admin.update({
    where: { id: adminId },
    data: { lastLoginAt: new Date() },
  });
}

// Получение текущей сессии
export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const session: AdminSession = JSON.parse(sessionCookie.value);

    // Проверяем что админ всё ещё активен
    const admin = await prisma.admin.findFirst({
      where: {
        id: session.adminId,
        isActive: true,
      },
    });

    if (!admin) {
      // Сессия недействительна
      await destroySession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error parsing session:', error);
    return null;
  }
}

// Удаление сессии
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Проверка авторизации
export async function requireAuth(): Promise<AdminSession> {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

// Проверка роли
export async function requireRole(role: string | string[]): Promise<AdminSession> {
  const session = await requireAuth();

  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(session.role)) {
    throw new Error('Forbidden');
  }

  return session;
}

// Проверка разрешения
export async function requirePermission(permission: Permission): Promise<AdminSession> {
  const session = await requireAuth();

  if (!hasPermission(session.role, permission)) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return session;
}

// Проверка любого из разрешений
export async function requireAnyPermission(permissions: Permission[]): Promise<AdminSession> {
  const session = await requireAuth();

  const hasAny = permissions.some((permission) => hasPermission(session.role, permission));

  if (!hasAny) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return session;
}
