import { NextResponse } from 'next/server';
import { destroyPatientSession } from '@/lib/auth';

/**
 * @swagger
 * /api/auth/patient/logout:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Patient logout
 *     description: |
 *       Destroy patient session and clear session cookie.
 *       Can be called even if session is invalid/expired.
 *     operationId: logoutPatient
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: Clears session cookie
 *             schema:
 *               type: string
 *               example: patient_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Выход выполнен успешно
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
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
