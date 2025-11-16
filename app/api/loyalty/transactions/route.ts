import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * @swagger
 * /api/loyalty/transactions:
 *   get:
 *     summary: Get loyalty points transaction history
 *     tags: [Loyalty Program]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: integer
 *         description: Patient ID (admin only)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of transactions to return
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
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
    const limit = parseInt(searchParams.get('limit') || '20');

    let patientId: number;

    // Admin can view any patient's transactions
    if (session.user.role === 'admin' && patientIdParam) {
      patientId = parseInt(patientIdParam);
    } else {
      // Regular users can only view their own transactions
      patientId = parseInt(session.user.id);
    }

    const transactions = await prisma.pointsTransaction.findMany({
      where: {
        patientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Error fetching loyalty transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
