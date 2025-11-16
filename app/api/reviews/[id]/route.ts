import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
// Auth handled by api-auth
import { requireApiAuth, requireApiRole } from '@/lib/api-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Only admins can update reviews
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can update reviews' },
        { status: 403 }
      );
    }

    const { isApproved } = await request.json();
    const { id } = await params;
    const reviewId = parseInt(id);

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireApiAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    // Only admins can delete reviews
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete reviews' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const reviewId = parseInt(id);

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
