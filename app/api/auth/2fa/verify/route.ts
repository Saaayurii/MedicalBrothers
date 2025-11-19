import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { verify2FAToken } from '@/lib/two-factor';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await connection();

    const { userId, userType, token } = await request.json();

    if (!userId || !userType || !token) {
      return NextResponse.json(
        { error: 'User ID, user type, and token are required' },
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
    const isValid = verify2FAToken(user.twoFactorSecret, token);

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: '2FA verified successfully',
      });
    }

    // Check backup codes
    if (user.twoFactorBackupCodes) {
      const backupCodes = JSON.parse(user.twoFactorBackupCodes);
      const codeIndex = backupCodes.indexOf(token);

      if (codeIndex !== -1) {
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

        return NextResponse.json({
          success: true,
          message: 'Backup code verified successfully',
          backupCodeUsed: true,
        });
      }
    }

    return NextResponse.json(
      { error: 'Invalid token or backup code' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify 2FA' },
      { status: 500 }
    );
  }
}
