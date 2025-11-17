import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import prisma from '@/lib/prisma';
import {
  generateVerificationToken,
  generateVerificationURL,
  sendVerificationEmail,
} from '@/lib/email-verification';

export async function POST(request: NextRequest) {
  try {
    await connection();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find patient by email
    const patient = await prisma.patient.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerified: true,
      },
    });

    if (!patient) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a verification link has been sent.',
      });
    }

    if (patient.emailVerified) {
      return NextResponse.json(
        { error: 'Email already verified' },
        { status: 400 }
      );
    }

    // Generate verification token
    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update patient with verification token
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
    await sendVerificationEmail(patient.email!, patient.name || 'User', verificationURL);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('Send verification email error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification email' },
      { status: 500 }
    );
  }
}
