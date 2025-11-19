import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getSession } from '@/lib/auth';
import { getPatientSession } from '@/lib/patient-auth';
import { generate2FASecret, generate2FAQRCode } from '@/lib/two-factor';

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

    const userType = adminSession ? 'admin' : 'patient';
    const userId = adminSession ? adminSession.adminId : patientSession!.id;
    const email = adminSession ? adminSession.email : patientSession!.email;

    // Generate 2FA secret
    const secret = generate2FASecret(email);

    // Generate QR code
    const qrCode = await generate2FAQRCode(secret.otpauth_url);

    return NextResponse.json({
      secret: secret.base32,
      qrCode,
      userType,
    });
  } catch (error: any) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup 2FA' },
      { status: 500 }
    );
  }
}
