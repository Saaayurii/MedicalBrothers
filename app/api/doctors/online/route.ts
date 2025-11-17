import { NextRequest, NextResponse } from 'next/server';
import { connection } from 'next/server';
import { getOnlineDoctors } from '@/lib/online-status';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/doctors/online:
 *   get:
 *     summary: Get list of online doctors
 *     description: Returns IDs of currently online doctors
 *     tags: [Doctors]
 *     responses:
 *       200:
 *         description: List of online doctor IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 onlineDoctors:
 *                   type: array
 *                   items:
 *                     type: number
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest) {
  await connection();

  try {
    // Get all active doctors
    const doctors = await prisma.doctor.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const doctorIds = doctors.map((d) => d.id);
    const onlineDoctorIds = await getOnlineDoctors(doctorIds);

    return NextResponse.json({
      onlineDoctors: onlineDoctorIds,
      total: onlineDoctorIds.length,
    });
  } catch (error) {
    console.error('Error fetching online doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch online doctors' },
      { status: 500 }
    );
  }
}
