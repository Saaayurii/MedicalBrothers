import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { requireApiAuth, requireApiRole } from '@/lib/api-auth';

/**
 * @swagger
 * /api/reminders:
 *   get:
 *     summary: Get reminders for appointments
 *     tags: [Reminders]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: appointmentId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent, failed]
 *     responses:
 *       200:
 *         description: List of reminders
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');
    const status = searchParams.get('status');

    const where: any = {};

    // Regular users can only see their own reminders
    if (user.role !== 'admin' && user.role !== 'doctor') {
      where.patientId = parseInt(user.id);
    }

    if (appointmentId) {
      where.appointmentId = parseInt(appointmentId);
    }

    if (status) {
      where.status = status;
    }

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            appointmentTime: true,
            doctor: {
              select: {
                name: true,
                specialty: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/reminders:
 *   post:
 *     summary: Create a reminder for an appointment
 *     tags: [Reminders]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - appointmentId
 *               - reminderType
 *               - scheduledFor
 *             properties:
 *               appointmentId:
 *                 type: integer
 *               reminderType:
 *                 type: string
 *                 enum: [email, sms, push]
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Reminder created successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Appointment not found
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { appointmentId, reminderType, scheduledFor, message } = body;

    // Validate required fields
    if (!appointmentId || !reminderType || !scheduledFor) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate reminder type
    const validTypes = ['email', 'sms', 'push'];
    if (!validTypes.includes(reminderType)) {
      return NextResponse.json(
        { error: 'Invalid reminder type' },
        { status: 400 }
      );
    }

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to create reminder for this appointment
    if (
      user.role !== 'admin' &&
      user.role !== 'doctor' &&
      appointment.patientId !== parseInt(user.id)
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to create reminders for this appointment' },
        { status: 403 }
      );
    }

    // Generate default message if not provided
    const defaultMessage = message || `Reminder: You have an appointment with Dr. ${appointment.doctor.name} on ${new Date(appointment.appointmentDate).toLocaleDateString()} at ${new Date(appointment.appointmentTime).toLocaleTimeString()}`;

    // Create reminder
    const reminder = await prisma.reminder.create({
      data: {
        appointmentId: parseInt(appointmentId),
        patientId: appointment.patientId!,
        reminderType,
        scheduledFor: new Date(scheduledFor),
        message: defaultMessage,
        status: 'pending',
      },
      include: {
        appointment: {
          select: {
            appointmentDate: true,
            appointmentTime: true,
            doctor: {
              select: {
                name: true,
                specialty: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { reminder, message: 'Reminder created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}
