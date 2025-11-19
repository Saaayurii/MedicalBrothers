import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await connection();

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find patient with this token
    const patient = await prisma.patient.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token expired
    if (patient.emailVerificationExpiry && patient.emailVerificationExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    // Verify email
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify email' },
      { status: 500 }
    );
  }
}

// Also support GET for email verification links
export async function GET(request: NextRequest) {
  try {
    await connection();

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find patient with this token
    const patient = await prisma.patient.findFirst({
      where: {
        emailVerificationToken: token,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token expired
    if (patient.emailVerificationExpiry && patient.emailVerificationExpiry < new Date()) {
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    // Verify email
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify email' },
      { status: 500 }
    );
  }
}
