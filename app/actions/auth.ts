'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';
import { verifyPassword, createSession, destroySession, getSession } from '@/lib/auth';
import { createAuditLog, AuditAction, AuditEntity } from '@/lib/audit';
import { getClientInfo } from '@/lib/audit-helpers';
import { rateLimit, RateLimitPresets, getClientIdentifier } from '@/lib/rate-limit';
import { logSuspiciousActivity } from '@/lib/security';

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
    // Check rate limit
    const headersList = await headers();
    const identifier = getClientIdentifier(headersList);
    const rateLimitResult = rateLimit(identifier, RateLimitPresets.AUTH);

    if (!rateLimitResult.success) {
      await logSuspiciousActivity('failed_login', {
        username,
        reason: 'rate_limit_exceeded',
        remaining: rateLimitResult.remaining,
      });

      return {
        success: false,
        error: `Слишком много попыток входа. Попробуйте через ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000 / 60)} минут`,
      };
    }

    // Находим админа по username
    const admin = await prisma.admin.findFirst({
      where: {
        username: username.trim(),
        isActive: true,
      },
    });

    if (!admin) {
      await logSuspiciousActivity('failed_login', {
        username,
        reason: 'user_not_found',
      });

      return {
        success: false,
        error: 'Неверное имя пользователя или пароль',
      };
    }

    // Проверяем пароль
    const isValidPassword = await verifyPassword(password, admin.passwordHash);

    if (!isValidPassword) {
      await logSuspiciousActivity('failed_login', {
        username,
        adminId: admin.id,
        reason: 'invalid_password',
      });

      return {
        success: false,
        error: 'Неверное имя пользователя или пароль',
      };
    }

    // Check if 2FA is enabled
    if (admin.twoFactorEnabled) {
      return {
        success: false,
        error: 'requires_2fa',
        // @ts-ignore - adding extra fields for 2FA
        requires2FA: true,
        userId: admin.id,
        userType: 'admin',
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
