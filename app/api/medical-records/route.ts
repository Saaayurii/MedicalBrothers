import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { requireApiAuth, requireApiRole } from '@/lib/api-auth';

/**
 * @swagger
 * /api/medical-records:
 *   get:
 *     summary: Get medical records for a patient
 *     description: |
 *       Retrieve Electronic Health Records (EHR) for patients.
 *
 *       Access control:
 *       - Patients: Can view only their own records (non-confidential)
 *       - Doctors/Admins: Can view any patient's records including confidential ones
 *
 *       Record types: diagnosis, prescription, lab_result, imaging, note
 *       Returns records with doctor and patient information
 *       Sorted by most recent first
 *     tags:
 *       - Medical Records
 *     operationId: getMedicalRecords
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: integer
 *         description: Patient ID to fetch records for (admin/doctor only, defaults to current user)
 *         example: 1
 *       - in: query
 *         name: recordType
 *         schema:
 *           type: string
 *           enum: [diagnosis, prescription, lab_result, imaging, note]
 *         description: Filter by specific record type
 *         example: diagnosis
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           minimum: 1
 *           maximum: 100
 *         description: Maximum number of records to return
 *         example: 20
 *     responses:
 *       200:
 *         description: Medical records retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 records:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/MedicalRecord'
 *                       - type: object
 *                         properties:
 *                           doctor:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *                               specialty:
 *                                 type: string
 *                           patient:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               name:
 *                                 type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const patientIdParam = searchParams.get('patientId');
    const recordType = searchParams.get('recordType');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Determine which patient's records to fetch
    let patientId: number;

    if (user.role === 'admin' || user.role === 'doctor') {
      // Admin or doctor can view any patient's records
      patientId = patientIdParam ? parseInt(patientIdParam) : parseInt(user.id);
    } else {
      // Regular users can only view their own records
      patientId = parseInt(user.id);
    }

    const where: any = {
      patientId,
    };

    if (recordType) {
      where.recordType = recordType;
    }

    // Non-admin users can't see confidential records unless they're the patient
    if (user.role !== 'admin' && user.role !== 'doctor') {
      if (patientId !== parseInt(user.id)) {
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
 *     description: |
 *       Create Electronic Health Record (EHR) entry for a patient.
 *
 *       Permissions:
 *       - Only doctors and admins can create medical records
 *       - Doctor ID is automatically set from authenticated user
 *
 *       Record types and fields:
 *       - diagnosis: Use diagnosis field
 *       - prescription: Use prescription field
 *       - lab_result: Use labResults field
 *       - imaging: Use attachments for image URLs
 *       - note: General medical note
 *
 *       Confidential records are hidden from patients viewing other's records
 *     tags:
 *       - Medical Records
 *     operationId: createMedicalRecord
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
 *                 description: ID of the patient
 *                 example: 1
 *               appointmentId:
 *                 type: integer
 *                 description: Associated appointment ID (optional)
 *                 example: 5
 *               recordType:
 *                 type: string
 *                 enum: [diagnosis, prescription, lab_result, imaging, note]
 *                 description: Type of medical record
 *                 example: diagnosis
 *               title:
 *                 type: string
 *                 description: Record title/summary
 *                 example: "Острая респираторная инфекция"
 *               description:
 *                 type: string
 *                 description: Detailed description
 *                 example: "Пациент жалуется на кашель, температуру 38°C"
 *               diagnosis:
 *                 type: string
 *                 description: Medical diagnosis (for diagnosis type)
 *                 example: "ОРВИ, J06.9 по МКБ-10"
 *               prescription:
 *                 type: string
 *                 description: Prescribed medications (for prescription type)
 *                 example: "Парацетамол 500мг 3 раза в день, 5 дней"
 *               labResults:
 *                 type: string
 *                 description: Laboratory test results (for lab_result type)
 *                 example: "Лейкоциты: 12.5 x10^9/л (повышены)"
 *               attachments:
 *                 type: string
 *                 description: File URLs or paths (JSON string or comma-separated)
 *                 example: "/uploads/xray-12345.jpg"
 *               isConfidential:
 *                 type: boolean
 *                 description: Mark as confidential (hidden from non-authorized users)
 *                 default: false
 *                 example: false
 *     responses:
 *       201:
 *         description: Medical record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 record:
 *                   $ref: '#/components/schemas/MedicalRecord'
 *                 message:
 *                   type: string
 *                   example: Medical record created successfully
 *       400:
 *         description: Bad request - missing fields or invalid record type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   error: Missing required fields
 *               invalidType:
 *                 summary: Invalid record type
 *                 value:
 *                   error: Invalid record type
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - only doctors and admins can create records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Only doctors and administrators can create medical records
 *       404:
 *         description: Patient not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Patient not found
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Only doctors and admins can create medical records
    if (user.role !== 'doctor' && user.role !== 'admin') {
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
        doctorId: user.role === 'doctor' ? parseInt(user.id) : null,
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
