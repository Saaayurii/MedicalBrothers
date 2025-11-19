import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPatientSession } from '@/lib/patient-auth';
import { verify2FAToken } from '@/lib/two-factor';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await connection();

    // Check for either admin or patient session
    const adminSession = await getSession();
    const patientSession = await getPatientSession();

    if (!adminSession && !patientSession) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Get user from database
    let user;
    let userType: 'admin' | 'patient';

    if (adminSession) {
      userType = 'admin';
      user = await prisma.admin.findUnique({
        where: { id: adminSession.adminId },
        select: {
          id: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });
    } else {
      userType = 'patient';
      user = await prisma.patient.findUnique({
        where: { id: patientSession!.id },
        select: {
          id: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
        },
      });
    }

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA is not enabled' },
        { status: 400 }
      );
    }

    // Verify token before disabling
    const isValid = verify2FAToken(user.twoFactorSecret, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Disable 2FA
    if (userType === 'admin') {
      await prisma.admin.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorBackupCodes: null,
        },
      });
    } else {
      await prisma.patient.update({
        where: { id: user.id },
        data: {
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorBackupCodes: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error: any) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
