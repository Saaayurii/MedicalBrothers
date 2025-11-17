import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPatientSession } from '@/lib/patient-auth';
import { verify2FAToken, generateBackupCodes } from '@/lib/two-factor';
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

    const { secret, token } = await request.json();

    if (!secret || !token) {
      return NextResponse.json(
        { error: 'Secret and token are required' },
        { status: 400 }
      );
    }

    // Verify the token
    const isValid = verify2FAToken(secret, token);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Enable 2FA for user
    if (adminSession) {
      await prisma.admin.update({
        where: { id: adminSession.adminId },
        data: {
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          twoFactorBackupCodes: JSON.stringify(backupCodes),
        },
      });
    } else if (patientSession) {
      await prisma.patient.update({
        where: { id: patientSession.id },
        data: {
          twoFactorSecret: secret,
          twoFactorEnabled: true,
          twoFactorBackupCodes: JSON.stringify(backupCodes),
        },
      });
    }

    return NextResponse.json({
      success: true,
      backupCodes,
      message: '2FA enabled successfully',
    });
  } catch (error: any) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}
