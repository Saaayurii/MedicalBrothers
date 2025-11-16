import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: Get all reviews or reviews for a specific doctor
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: integer
 *         description: Filter reviews by doctor ID
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Filter only verified reviews
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of reviews to return
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reviews:
 *                   type: array
 *                   items:
 *                     type: object
 *                 averageRating:
 *                   type: number
 *                 totalCount:
 *                   type: number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const verified = searchParams.get('verified');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {
      isApproved: true,
    };

    if (doctorId) {
      where.doctorId = parseInt(doctorId);
    }

    if (verified === 'true') {
      where.isVerified = true;
    }

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalCount,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review for a doctor
 *     tags: [Reviews]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctorId
 *               - rating
 *             properties:
 *               doctorId:
 *                 type: integer
 *               appointmentId:
 *                 type: integer
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       409:
 *         description: Review already exists for this appointment
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

    const body = await request.json();
    const { doctorId, appointmentId, rating, comment } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: parseInt(doctorId) },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // If appointmentId is provided, check if patient had appointment with this doctor
    let isVerified = false;
    if (appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: parseInt(appointmentId),
          patientId: parseInt(session.user.id),
          doctorId: parseInt(doctorId),
          status: 'completed',
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: 'Appointment not found or not completed' },
          { status: 404 }
        );
      }

      // Check if review already exists for this appointment
      const existingReview = await prisma.review.findUnique({
        where: { appointmentId: parseInt(appointmentId) },
      });

      if (existingReview) {
        return NextResponse.json(
          { error: 'Review already exists for this appointment' },
          { status: 409 }
        );
      }

      isVerified = true;
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        doctorId: parseInt(doctorId),
        patientId: parseInt(session.user.id),
        appointmentId: appointmentId ? parseInt(appointmentId) : null,
        rating: parseInt(rating),
        comment,
        isVerified,
        isApproved: true, // Auto-approve for now, can add moderation later
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
      { review, message: 'Review created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
