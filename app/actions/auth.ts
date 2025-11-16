'use server';

import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { verifyPassword, createSession, destroySession, getSession } from '@/lib/auth';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';
import { getClientInfo } from '@/lib/audit-helpers';

export interface LoginResult {
  success: boolean;
  error?: string;
}

export async function loginAction(formData: FormData): Promise<LoginResult> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return {
      success: false,
      error: 'Введите имя пользователя и пароль',
    };
  }

  try {
    // Находим админа по username
    const admin = await prisma.admin.findFirst({
      where: {
        username: username.trim(),
        isActive: true,
      },
    });

    if (!admin) {
      return {
        success: false,
        error: 'Неверное имя пользователя или пароль',
      };
    }

    // Проверяем пароль
    const isValidPassword = await verifyPassword(password, admin.passwordHash);

    if (!isValidPassword) {
      return {
        success: false,
        error: 'Неверное имя пользователя или пароль',
      };
    }

    // Создаём сессию
    await createSession(admin.id);

    // Log the login action
    const clientInfo = await getClientInfo();
    await createAuditLog({
      adminId: admin.id,
      action: AuditAction.LOGIN,
      entity: AuditEntity.ADMIN,
      entityId: admin.id,
      ...clientInfo,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Произошла ошибка при входе. Попробуйте позже.',
    };
  }
}

export async function logoutAction(): Promise<void> {
  // Get session before destroying it to log the logout
  const session = await getSession();
  if (session) {
    const clientInfo = await getClientInfo();
    await createAuditLog({
      adminId: session.adminId,
      action: AuditAction.LOGOUT,
      entity: AuditEntity.ADMIN,
      entityId: session.adminId,
      ...clientInfo,
    });
  }

  await destroySession();
  redirect('/admin/login');
}
