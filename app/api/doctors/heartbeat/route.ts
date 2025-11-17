import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { setDoctorOnline } from '@/lib/online-status';
import { requireApiAuth } from '@/lib/api-auth';

/**
 * @swagger
 * /api/doctors/heartbeat:
 *   post:
 *     summary: Update doctor online status
 *     description: Sends a heartbeat to mark doctor as online
 *     tags: [Doctors]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  await connection();

  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;

    const { session } = authResult;

    // Only doctors can set their online status
    if (!session.doctorId) {
      return NextResponse.json(
        { error: 'Only doctors can set online status' },
        { status: 403 }
      );
    }

    await setDoctorOnline(session.doctorId);

    return NextResponse.json({
      success: true,
      message: 'Online status updated',
    });
  } catch (error) {
    console.error('Error updating heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
