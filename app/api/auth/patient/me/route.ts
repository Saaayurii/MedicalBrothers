import { NextResponse } from 'next/server';
import { getPatientSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
