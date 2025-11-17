import { NextResponse } from 'next/server';
import { destroyPatientSession } from '@/lib/auth';

export async function POST() {
  try {
    await destroyPatientSession();

    return NextResponse.json({
      message: 'Выход выполнен успешно',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Ошибка выхода' },
      { status: 500 }
    );
  }
}
