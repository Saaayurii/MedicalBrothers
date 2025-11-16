import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { requireApiAuth, requireApiRole } from '@/lib/api-auth';

/**
 * @swagger
 * /api/lab-orders:
 *   get:
 *     summary: Get lab orders
 *     tags: [Lab Orders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: integer
 *         description: Patient ID (admin/doctor only)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of lab orders
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const patientIdParam = searchParams.get('patientId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let patientId: number;
    const where: any = {};

    // Determine permissions
    if (user.role === 'admin' || user.role === 'doctor') {
      if (patientIdParam) {
        patientId = parseInt(patientIdParam);
        where.patientId = patientId;
      }
      // Doctors can see orders they created
      if (user.role === 'doctor' && !patientIdParam) {
        where.doctorId = parseInt(user.id);
      }
    } else {
      // Regular users can only see their own orders
      where.patientId = parseInt(user.id);
    }

    if (status) {
      where.status = status;
    }

    const labOrders = await prisma.labOrder.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ labOrders });
  } catch (error) {
    console.error('Error fetching lab orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab orders' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/lab-orders:
 *   post:
 *     summary: Create a new lab order
 *     tags: [Lab Orders]
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
 *               - labName
 *               - testType
 *             properties:
 *               patientId:
 *                 type: integer
 *               appointmentId:
 *                 type: integer
 *               labName:
 *                 type: string
 *               testType:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lab order created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only doctors and admins can create lab orders
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Only doctors and admins can create lab orders
    if (user.role !== 'doctor' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only doctors and administrators can create lab orders' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { patientId, appointmentId, labName, testType, notes } = body;

    // Validate required fields
    if (!patientId || !labName || !testType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Generate unique order number
    const orderNumber = `LAB-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create lab order
    const labOrder = await prisma.labOrder.create({
      data: {
        patientId: parseInt(patientId),
        doctorId: parseInt(user.id),
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        orderNumber,
        labName,
        testType,
        notes: notes || null,
        status: 'pending',
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
    });

    return NextResponse.json(
      { labOrder, message: 'Lab order created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating lab order:', error);
    return NextResponse.json(
      { error: 'Failed to create lab order' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/lab-orders:
 *   patch:
 *     summary: Update a lab order status or results
 *     tags: [Lab Orders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, failed]
 *               results:
 *                 type: string
 *               resultFileUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lab order updated successfully
 *       401:
 *         description: Unauthorized
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Only doctors and admins can update lab orders
    if (user.role !== 'doctor' && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only doctors and administrators can update lab orders' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { orderId, status, results, resultFileUrl } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completedAt = new Date();
      }
    }

    if (results !== undefined) {
      updateData.results = results;
    }

    if (resultFileUrl !== undefined) {
      updateData.resultFileUrl = resultFileUrl;
    }

    const labOrder = await prisma.labOrder.update({
      where: { id: parseInt(orderId) },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
      },
    });

    return NextResponse.json({
      labOrder,
      message: 'Lab order updated successfully',
    });
  } catch (error) {
    console.error('Error updating lab order:', error);
    return NextResponse.json(
      { error: 'Failed to update lab order' },
      { status: 500 }
    );
  }
}
