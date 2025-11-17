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

/**
 * @swagger
 * /api/auth/patient/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register new patient
 *     description: |
 *       Register a new patient account with credentials. Upon successful registration:
 *       - Creates patient account with hashed password
 *       - Automatically creates a session (sets patient_session cookie)
 *       - Awards 100 welcome loyalty points
 *       - Initializes loyalty tier as Bronze
 *     operationId: registerPatient
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 description: Patient's full name
 *                 example: Иван Иванов
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Patient's email address (optional)
 *                 example: ivan@example.com
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 description: Patient's phone number (required, must be unique)
 *                 example: "+79991234567"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 format: password
 *                 description: Account password (min 6 characters)
 *                 example: securePassword123
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Patient's date of birth (optional)
 *                 example: "1990-01-15"
 *               address:
 *                 type: string
 *                 description: Patient's address (optional)
 *                 example: "Москва, ул. Ленина, д. 1"
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *         headers:
 *           Set-Cookie:
 *             description: Session cookie (patient_session)
 *             schema:
 *               type: string
 *               example: patient_session=abc123; Path=/; HttpOnly; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Регистрация успешна
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
 *                       example: ivan@example.com
 *                     phone:
 *                       type: string
 *                       example: "+79991234567"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         description: Conflict - Patient with this phone/email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Пациент с таким телефоном уже зарегистрирован
 *       429:
 *         description: Too many registration attempts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Слишком много попыток регистрации. Попробуйте позже.
 *                 retryAfter:
 *                   type: integer
 *                   description: Seconds to wait before retry
 *                   example: 60
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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
