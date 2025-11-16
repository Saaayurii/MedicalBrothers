import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

import { requireApiAuth, requireApiRole } from '@/lib/api-auth';

/**
 * @swagger
 * /api/loyalty:
 *   get:
 *     summary: Get loyalty points for a patient
 *     tags: [Loyalty Program]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: integer
 *         description: Patient ID (admin only)
 *     responses:
 *       200:
 *         description: Loyalty points information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 points:
 *                   type: integer
 *                 tier:
 *                   type: string
 *                 totalEarned:
 *                   type: integer
 *                 totalSpent:
 *                   type: integer
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

    let patientId: number;

    // Admin can view any patient's loyalty points
    if (user.role === 'admin' && patientIdParam) {
      patientId = parseInt(patientIdParam);
    } else {
      // Regular users can only view their own loyalty points
      patientId = parseInt(user.id);
    }

    // Get or create loyalty points record
    let loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { patientId },
    });

    if (!loyaltyPoints) {
      // Create initial loyalty points record
      loyaltyPoints = await prisma.loyaltyPoints.create({
        data: {
          patientId,
          points: 0,
          tier: 'bronze',
          totalEarned: 0,
          totalSpent: 0,
        },
      });
    }

    return NextResponse.json(loyaltyPoints);
  } catch (error) {
    console.error('Error fetching loyalty points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty points' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/loyalty:
 *   post:
 *     summary: Add or redeem loyalty points
 *     tags: [Loyalty Program]
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
 *               - amount
 *               - type
 *               - description
 *             properties:
 *               patientId:
 *                 type: integer
 *               amount:
 *                 type: integer
 *                 description: Positive for earning, negative for spending
 *               type:
 *                 type: string
 *                 enum: [appointment_completed, referral, reward_redeemed]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Points updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const body = await request.json();
    const { patientId, amount, type, description } = body;

    // Validate required fields
    if (!patientId || amount === undefined || !type || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Only admin can modify other users' points
    if (user.role !== 'admin' && parseInt(patientId) !== parseInt(user.id)) {
      return NextResponse.json(
        { error: 'You can only modify your own loyalty points' },
        { status: 403 }
      );
    }

    // Get or create loyalty points record
    let loyaltyPoints = await prisma.loyaltyPoints.findUnique({
      where: { patientId: parseInt(patientId) },
    });

    if (!loyaltyPoints) {
      loyaltyPoints = await prisma.loyaltyPoints.create({
        data: {
          patientId: parseInt(patientId),
          points: 0,
          tier: 'bronze',
          totalEarned: 0,
          totalSpent: 0,
        },
      });
    }

    const pointsAmount = parseInt(amount);

    // Check if user has enough points for redemption
    if (pointsAmount < 0 && loyaltyPoints.points < Math.abs(pointsAmount)) {
      return NextResponse.json(
        { error: 'Insufficient loyalty points' },
        { status: 400 }
      );
    }

    // Calculate new points and totals
    const newPoints = loyaltyPoints.points + pointsAmount;
    const newTotalEarned = pointsAmount > 0 ? loyaltyPoints.totalEarned + pointsAmount : loyaltyPoints.totalEarned;
    const newTotalSpent = pointsAmount < 0 ? loyaltyPoints.totalSpent + Math.abs(pointsAmount) : loyaltyPoints.totalSpent;

    // Determine new tier based on total earned points
    let newTier = 'bronze';
    if (newTotalEarned >= 10000) {
      newTier = 'platinum';
    } else if (newTotalEarned >= 5000) {
      newTier = 'gold';
    } else if (newTotalEarned >= 2000) {
      newTier = 'silver';
    }

    // Update loyalty points in a transaction
    const [updatedLoyaltyPoints, transaction] = await prisma.$transaction([
      prisma.loyaltyPoints.update({
        where: { patientId: parseInt(patientId) },
        data: {
          points: newPoints,
          tier: newTier,
          totalEarned: newTotalEarned,
          totalSpent: newTotalSpent,
        },
      }),
      prisma.pointsTransaction.create({
        data: {
          patientId: parseInt(patientId),
          amount: pointsAmount,
          type,
          description,
        },
      }),
    ]);

    return NextResponse.json({
      loyaltyPoints: updatedLoyaltyPoints,
      transaction,
      message: pointsAmount > 0 ? 'Points added successfully' : 'Points redeemed successfully',
    });
  } catch (error) {
    console.error('Error updating loyalty points:', error);
    return NextResponse.json(
      { error: 'Failed to update loyalty points' },
      { status: 500 }
    );
  }
}
