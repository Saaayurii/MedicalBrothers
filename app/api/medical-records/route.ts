import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/medical-records:
 *   get:
 *     summary: Get medical records for a patient
 *     tags: [Medical Records]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: integer
 *         description: Patient ID (admin/doctor only)
 *       - in: query
 *         name: recordType
 *         schema:
 *           type: string
 *           enum: [diagnosis, prescription, lab_result, imaging, note]
 *         description: Filter by record type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of medical records
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const patientIdParam = searchParams.get('patientId');
    const recordType = searchParams.get('recordType');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Determine which patient's records to fetch
    let patientId: number;

    if (session.user.role === 'admin' || session.user.role === 'doctor') {
      // Admin or doctor can view any patient's records
      patientId = patientIdParam ? parseInt(patientIdParam) : parseInt(session.user.id);
    } else {
      // Regular users can only view their own records
      patientId = parseInt(session.user.id);
    }

    const where: any = {
      patientId,
    };

    if (recordType) {
      where.recordType = recordType;
    }

    // Non-admin users can't see confidential records unless they're the patient
    if (session.user.role !== 'admin' && session.user.role !== 'doctor') {
      if (patientId !== parseInt(session.user.id)) {
        where.isConfidential = false;
      }
    }

    const records = await prisma.medicalRecord.findMany({
      where,
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching medical records:', error);
    return NextResponse.json(
      { error: 'Failed to fetch medical records' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/medical-records:
 *   post:
 *     summary: Create a new medical record
 *     tags: [Medical Records]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - recordType
 *               - title
 *               - description
 *             properties:
 *               patientId:
 *                 type: integer
 *               appointmentId:
 *                 type: integer
 *               recordType:
 *                 type: string
 *                 enum: [diagnosis, prescription, lab_result, imaging, note]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               diagnosis:
 *                 type: string
 *               prescription:
 *                 type: string
 *               labResults:
 *                 type: string
 *               attachments:
 *                 type: string
 *               isConfidential:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Medical record created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only doctors and admins can create records
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only doctors and admins can create medical records
    if (session.user.role !== 'doctor' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only doctors and administrators can create medical records' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      patientId,
      appointmentId,
      recordType,
      title,
      description,
      diagnosis,
      prescription,
      labResults,
      attachments,
      isConfidential,
    } = body;

    // Validate required fields
    if (!patientId || !recordType || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate record type
    const validTypes = ['diagnosis', 'prescription', 'lab_result', 'imaging', 'note'];
    if (!validTypes.includes(recordType)) {
      return NextResponse.json(
        { error: 'Invalid record type' },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patientId) },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Create medical record
    const record = await prisma.medicalRecord.create({
      data: {
        patientId: parseInt(patientId),
        doctorId: session.user.role === 'doctor' ? parseInt(session.user.id) : null,
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        recordType,
        title,
        description,
        diagnosis: diagnosis || null,
        prescription: prescription || null,
        labResults: labResults || null,
        attachments: attachments || null,
        isConfidential: isConfidential || false,
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      { record, message: 'Medical record created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating medical record:', error);
    return NextResponse.json(
      { error: 'Failed to create medical record' },
      { status: 500 }
    );
  }
}
