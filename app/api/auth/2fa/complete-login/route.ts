import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { verify2FAToken } from '@/lib/two-factor';
import { createPatientSession } from '@/lib/auth';
import { createSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await connection();

    const { userId, userType, token } = await request.json();

    if (!userId || !userType || !token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    let user;
    if (userType === 'admin') {
      user = await prisma.admin.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          username: true,
          email: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
          twoFactorBackupCodes: true,
        },
      });
    } else if (userType === 'patient') {
      user = await prisma.patient.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          twoFactorSecret: true,
          twoFactorEnabled: true,
          twoFactorBackupCodes: true,
        },
      });
    }

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA not enabled for this user' },
        { status: 400 }
      );
    }

    // Verify token
    let isValid = verify2FAToken(user.twoFactorSecret, token);
    let backupCodeUsed = false;

    if (!isValid && user.twoFactorBackupCodes) {
      // Check backup codes
      const backupCodes = JSON.parse(user.twoFactorBackupCodes);
      const codeIndex = backupCodes.indexOf(token);

      if (codeIndex !== -1) {
        isValid = true;
        backupCodeUsed = true;

        // Remove used backup code
        backupCodes.splice(codeIndex, 1);

        // Update user
        if (userType === 'admin') {
          await prisma.admin.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
          });
        } else {
          await prisma.patient.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
          });
        }
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid token or backup code' },
        { status: 400 }
      );
    }

    // Create session
    if (userType === 'admin') {
      await createSession(user.id);
    } else {
      await createPatientSession(user.id);
    }

    return NextResponse.json({
      success: true,
      message: '2FA verified successfully',
      backupCodeUsed,
      user: {
        id: user.id,
        name: 'username' in user ? user.username : user.name,
        email: user.email,
      },
    });
  } catch (error: any) {
    console.error('2FA complete login error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to complete login' },
      { status: 500 }
    );
  }
}
