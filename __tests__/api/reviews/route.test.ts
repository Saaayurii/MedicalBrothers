import { GET, POST } from '@/app/api/reviews/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    review: {
      findMany: jest.fn(),
      create: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: async () => data,
      status: init?.status || 200,
      ok: !init?.status || init.status < 400,
    })),
  },
  connection: jest.fn().mockResolvedValue(undefined),
}));

// Mock auth
jest.mock('@/lib/api-auth', () => ({
  requireApiAuth: jest.fn().mockResolvedValue({
    session: { adminId: 1, role: 'patient' },
    user: { id: '1', role: 'patient' },
  }),
}));

const originalConsoleError = console.error;

describe('GET /api/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should fetch all reviews', async () => {
    const mockReviews = [
      {
        id: 1,
        doctorId: 1,
        patientId: 1,
        rating: 5,
        comment: 'Great doctor!',
        isApproved: true,
        isVerified: true,
        createdAt: new Date(),
        doctor: { id: 1, name: 'Dr. Smith', specialty: 'Cardiology' },
        patient: { id: 1, name: 'John Doe' },
      },
    ];

    (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);

    const request = new NextRequest('http://localhost:3000/api/reviews');
    const response = await GET(request);
    const data = await response.json();

    expect(data.reviews).toEqual(mockReviews);
    expect(response.status).toBe(200);
  });

  it('should filter reviews by doctorId', async () => {
    const mockReviews = [
      {
        id: 1,
        doctorId: 2,
        patientId: 1,
        rating: 4,
        comment: 'Good service',
        isApproved: true,
        isVerified: true,
        createdAt: new Date(),
        doctor: { id: 2, name: 'Dr. Jones', specialty: 'Neurology' },
        patient: { id: 1, name: 'Jane Doe' },
      },
    ];

    (prisma.review.findMany as jest.Mock).mockResolvedValue(mockReviews);

    const request = new NextRequest('http://localhost:3000/api/reviews?doctorId=2');
    const response = await GET(request);
    const data = await response.json();

    expect(prisma.review.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ doctorId: 2 }),
      })
    );
    expect(data.reviews).toEqual(mockReviews);
  });

  it('should handle errors gracefully', async () => {
    (prisma.review.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost:3000/api/reviews');
    const response = await GET(request);
    const data = await response.json();

    expect(data.error).toBe('Failed to fetch reviews');
    expect(response.status).toBe(500);
  });
});

describe('POST /api/reviews', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should create a new review', async () => {
    const mockReview = {
      id: 1,
      doctorId: 1,
      patientId: 1,
      rating: 5,
      comment: 'Excellent care!',
      isApproved: true,
      isVerified: true,
      createdAt: new Date(),
      doctor: { id: 1, name: 'Dr. Smith', specialty: 'Cardiology' },
      patient: { id: 1, name: 'John Doe' },
    };

    (prisma.review.create as jest.Mock).mockResolvedValue(mockReview);

    const request = new NextRequest('http://localhost:3000/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: 1,
        rating: 5,
        comment: 'Excellent care!',
      }),
    });

    request.json = jest.fn().mockResolvedValue({
      doctorId: 1,
      rating: 5,
      comment: 'Excellent care!',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.review).toEqual(mockReview);
    expect(data.message).toBe('Review created successfully');
    expect(response.status).toBe(201);
  });

  it('should validate rating is between 1 and 5', async () => {
    const request = new NextRequest('http://localhost:3000/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: 1,
        rating: 6,
        comment: 'Test',
      }),
    });

    request.json = jest.fn().mockResolvedValue({
      doctorId: 1,
      rating: 6,
      comment: 'Test',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.error).toBe('Rating must be between 1 and 5');
    expect(response.status).toBe(400);
  });

  it('should handle database errors', async () => {
    (prisma.review.create as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost:3000/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        doctorId: 1,
        rating: 5,
        comment: 'Test',
      }),
    });

    request.json = jest.fn().mockResolvedValue({
      doctorId: 1,
      rating: 5,
      comment: 'Test',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.error).toBe('Failed to create review');
    expect(response.status).toBe(500);
  });
});
