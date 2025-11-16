import { cookies } from 'next/headers';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface PatientSession {
  id: number;
  name: string;
  email: string;
}

export async function getPatientSession(): Promise<PatientSession | null> {
  try {
    // Note: connection() should be called before this function at the page level
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('patient_session');

    if (!sessionCookie) {
      return null;
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Проверяем существование пациента
    const patient = await prisma.patient.findUnique({
      where: { id: sessionData.id },
    });

    if (!patient || !patient.isActive) {
      return null;
    }

    return {
      id: patient.id,
      name: patient.name || '',
      email: patient.email || '',
    };
  } catch (error) {
    console.error('Error getting patient session:', error);
    return null;
  }
}

export async function requirePatientAuth(): Promise<PatientSession> {
  const session = await getPatientSession();

  if (!session) {
    redirect('/patient/login');
  }

  return session;
}

export async function loginPatient(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    await connection();
    const patient = await prisma.patient.findUnique({
      where: { email },
    });

    if (!patient || !patient.passwordHash) {
      return {
        success: false,
        error: 'Неверный email или пароль',
      };
    }

    if (!patient.isActive) {
      return {
        success: false,
        error: 'Аккаунт неактивен',
      };
    }

    const passwordValid = await bcrypt.compare(password, patient.passwordHash);

    if (!passwordValid) {
      return {
        success: false,
        error: 'Неверный email или пароль',
      };
    }

    // Обновляем время последнего входа
    await prisma.patient.update({
      where: { id: patient.id },
      data: { lastLoginAt: new Date() },
    });

    // Создаём сессию
    const sessionData = {
      id: patient.id,
      name: patient.name || '',
      email: patient.email || '',
    };

    const cookieStore = await cookies();
    cookieStore.set('patient_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: 'Произошла ошибка при входе',
    };
  }
}

export async function registerPatient(
  name: string,
  email: string,
  phone: string,
  password: string,
  dateOfBirth?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    await connection();
    // Проверяем, существует ли пациент
    const existingPatient = await prisma.patient.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingPatient) {
      if (existingPatient.email === email) {
        return {
          success: false,
          error: 'Пациент с таким email уже зарегистрирован',
        };
      }
      if (existingPatient.phone === phone) {
        return {
          success: false,
          error: 'Пациент с таким телефоном уже зарегистрирован',
        };
      }
    }

    // Хэшируем пароль
    const passwordHash = await bcrypt.hash(password, 10);

    // Создаём пациента
    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        dateOfBirth,
        isActive: true,
      },
    });

    // Автоматически входим
    const sessionData = {
      id: patient.id,
      name: patient.name || '',
      email: patient.email || '',
    };

    const cookieStore = await cookies();
    cookieStore.set('patient_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.code === 'P2002') {
      return {
        success: false,
        error: 'Пациент с такими данными уже существует',
      };
    }

    return {
      success: false,
      error: 'Произошла ошибка при регистрации',
    };
  }
}

export async function logoutPatient() {
  await connection();
  const cookieStore = await cookies();
  cookieStore.delete('patient_session');
}
