import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createPatientSession } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit';

// Валидация данных логина
const loginSchema = z.object({
  identifier: z.string().min(1, 'Введите email или телефон'),
  password: z.string().min(1, 'Введите пароль'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for auth endpoints
    const clientId = getClientIdentifier(request);
    const rateLimitResult = rateLimit(clientId, RateLimitPresets.AUTH);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Слишком много попыток входа. Попробуйте позже.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Валидация входных данных
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { identifier, password } = validationResult.data;

    // Ищем пациента по email или телефону
    const patient = await prisma.patient.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
        ],
        isActive: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Неверный email/телефон или пароль' },
        { status: 401 }
      );
    }

    // Проверяем пароль
    if (!patient.passwordHash) {
      return NextResponse.json(
        { error: 'Пароль не установлен. Обратитесь к администратору.' },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, patient.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Неверный email/телефон или пароль' },
        { status: 401 }
      );
    }

    // Создаем сессию
    await createPatientSession(patient.id);

    return NextResponse.json({
      message: 'Вход выполнен успешно',
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Ошибка входа. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
