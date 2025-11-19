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

/**
 * @swagger
 * /api/auth/patient/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Patient login
 *     description: |
 *       Authenticate patient using email or phone number with password.
 *       Creates a session upon successful authentication (sets patient_session cookie).
 *       Rate limited to 10 attempts per minute per IP.
 *     operationId: loginPatient
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone number
 *                 example: "+79991234567"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Account password
 *                 example: securePassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie (patient_session)
 *             schema:
 *               type: string
 *               example: patient_session=abc123; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Вход выполнен успешно
 *                 patient:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Иван Иванов
 *                     email:
 *                       type: string
 *                       nullable: true
 *                       example: ivan@example.com
 *                     phone:
 *                       type: string
 *                       example: "+79991234567"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: Unauthorized - Invalid credentials or inactive account
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               invalidCredentials:
 *                 summary: Invalid email/phone or password
 *                 value:
 *                   error: Неверный email/телефон или пароль
 *               noPassword:
 *                 summary: Password not set
 *                 value:
 *                   error: Пароль не установлен. Обратитесь к администратору.
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Слишком много попыток входа. Попробуйте позже.
 *                 retryAfter:
 *                   type: integer
 *                   description: Seconds to wait before retry
 *                   example: 60
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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

    // Check if 2FA is enabled
    if (patient.twoFactorEnabled) {
      // Return a special response indicating 2FA is required
      return NextResponse.json({
        requires2FA: true,
        userId: patient.id,
        userType: 'patient',
        message: 'Введите код двухфакторной аутентификации',
      });
    }

    // Создаем сессию (если 2FA не включена)
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
