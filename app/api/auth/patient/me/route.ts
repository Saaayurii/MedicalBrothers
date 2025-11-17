import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/auth/patient/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current patient info
 *     description: |
 *       Retrieve authenticated patient's profile information including:
 *       - Personal details (name, email, phone, etc.)
 *       - Loyalty points and tier
 *       - Account creation date
 *
 *       Requires valid patient session cookie.
 *     operationId: getCurrentPatient
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Patient information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
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
 *                     dateOfBirth:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: "1990-01-15T00:00:00.000Z"
 *                     address:
 *                       type: string
 *                       nullable: true
 *                       example: "Москва, ул. Ленина, д. 1"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-01T10:00:00.000Z"
 *                     loyaltyPoints:
 *                       type: integer
 *                       description: Available loyalty points
 *                       example: 250
 *                     loyaltyTier:
 *                       type: string
 *                       enum: [bronze, silver, gold, platinum]
 *                       description: Current loyalty tier
 *                       example: bronze
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Patient not found (session exists but patient deleted)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Patient not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET() {
  try {
    const session = await getPatientSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Получаем полную информацию о пациенте
    const patient = await prisma.patient.findUnique({
      where: { id: session.patientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        address: true,
        createdAt: true,
        loyaltyPoints: {
          select: {
            points: true,
            tier: true,
            totalEarned: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      patient: {
        ...patient,
        loyaltyPoints: patient.loyaltyPoints?.points || 0,
        loyaltyTier: patient.loyaltyPoints?.tier || 'bronze',
      },
    });
  } catch (error) {
    console.error('Get patient info error:', error);
    return NextResponse.json(
      { error: 'Failed to get patient information' },
      { status: 500 }
    );
  }
}
