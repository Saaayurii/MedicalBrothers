'use server';

import { redirect } from 'next/navigation';
import { loginPatient, registerPatient, logoutPatient } from '@/lib/patient-auth';

export interface ActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return {
      success: false,
      error: 'Email и пароль обязательны',
    };
  }

  const result = await loginPatient(email, password);

  if (!result.success) {
    return result;
  }

  redirect('/patient/dashboard');
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const dateOfBirth = formData.get('dateOfBirth') as string;

  if (!name || !email || !phone || !password) {
    return {
      success: false,
      error: 'Все поля обязательны',
    };
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      error: 'Пароли не совпадают',
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: 'Пароль должен быть не менее 6 символов',
    };
  }

  const result = await registerPatient(
    name,
    email,
    phone,
    password,
    dateOfBirth ? new Date(dateOfBirth) : undefined
  );

  if (!result.success) {
    return result;
  }

  redirect('/patient/dashboard');
}

export async function logoutAction() {
  await logoutPatient();
  redirect('/patient/login');
}
