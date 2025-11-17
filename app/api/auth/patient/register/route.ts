import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createPatientSession } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit, getClientIdentifier, RateLimitPresets } from '@/lib/rate-limit';

// Валидация данных регистрации
const registerSchema = z.object({
  name: z.string().min(2, 'Имя должно быть не менее 2 символов'),
  email: z.string().email('Некорректный email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Некорректный номер телефона'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for registration
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(identifier, RateLimitPresets.AUTH);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Слишком много попыток регистрации. Попробуйте позже.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Валидация входных данных
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { name, email, phone, password, dateOfBirth, address } = validationResult.data;

    // Проверяем, существует ли уже пациент с таким телефоном
    const existingPatient = await prisma.patient.findFirst({
      where: {
        OR: [
          { phone },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingPatient) {
      if (existingPatient.phone === phone) {
        return NextResponse.json(
          { error: 'Пациент с таким телефоном уже зарегистрирован' },
          { status: 409 }
        );
      }
      if (email && existingPatient.email === email) {
        return NextResponse.json(
          { error: 'Пациент с таким email уже зарегистрирован' },
          { status: 409 }
        );
      }
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(password);

    // Создаем нового пациента
    const patient = await prisma.patient.create({
      data: {
        name,
        email: email || null,
        phone,
        passwordHash,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    // Создаем сессию для пациента
    await createPatientSession(patient.id);

    // Создаем запись в программе лояльности
    await prisma.loyaltyPoints.create({
      data: {
        patientId: patient.id,
        points: 100, // Приветственные баллы
        tier: 'bronze',
        totalEarned: 100,
      },
    });

    return NextResponse.json(
      {
        message: 'Регистрация успешна',
        patient: {
          id: patient.id,
          name: patient.name,
          email: patient.email,
          phone: patient.phone,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Ошибка регистрации. Попробуйте позже.' },
      { status: 500 }
    );
  }
}
