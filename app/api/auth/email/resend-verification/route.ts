import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getPatientSession } from '@/lib/patient-auth';
import prisma from '@/lib/prisma';
import {
  generateVerificationToken,
  generateVerificationURL,
  sendVerificationEmail,
} from '@/lib/email-verification';

export async function POST(request: NextRequest) {
  try {
    await connection();

    // Get current patient session
    const session = await getPatientSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!patient || !patient.email) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (patient.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update patient with new verification token
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiry: expiresAt,
      },
    });

    // Generate verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationURL = generateVerificationURL(baseUrl, token);

    // Send verification email
    await sendVerificationEmail(patient.email, verificationURL);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('Resend verification email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to resend verification email' },
      { status: 500 }
    );
  }
}
