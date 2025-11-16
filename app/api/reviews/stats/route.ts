import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/reviews/stats:
 *   get:
 *     summary: Get review statistics for a doctor
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Doctor ID to get statistics for
 *     responses:
 *       200:
 *         description: Review statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 averageRating:
 *                   type: number
 *                 totalReviews:
 *                   type: number
 *                 verifiedReviews:
 *                   type: number
 *                 ratingDistribution:
 *                   type: object
 *                   properties:
 *                     5:
 *                       type: number
 *                     4:
 *                       type: number
 *                     3:
 *                       type: number
 *                     2:
 *                       type: number
 *                     1:
 *                       type: number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        doctorId: parseInt(doctorId),
        isApproved: true,
      },
      select: {
        rating: true,
        isVerified: true,
      },
    });

    const totalReviews = reviews.length;
    const verifiedReviews = reviews.filter(r => r.isVerified).length;

    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    // Calculate rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length,
    };

    return NextResponse.json({
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      verifiedReviews,
      ratingDistribution,
    });
  } catch (error) {
    console.error('Error fetching review statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
