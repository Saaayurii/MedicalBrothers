import { GET } from '@/app/api/loyalty/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    loyaltyPoints: {
      findFirst: jest.fn(),
    },
  },
}));

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

jest.mock('@/lib/api-auth', () => ({
  requireApiAuth: jest.fn().mockResolvedValue({
    session: { adminId: 1, role: 'patient' },
    user: { id: '1', role: 'patient' },
  }),
}));

describe('GET /api/loyalty', () => {
  it('should fetch loyalty points for user', async () => {
    const mockLoyalty = {
      id: 1,
      patientId: 1,
      points: 500,
      tier: 'silver',
      createdAt: new Date(),
    };

    (prisma.loyaltyPoints.findFirst as jest.Mock).mockResolvedValue(mockLoyalty);

    const request = new NextRequest('http://localhost:3000/api/loyalty');
    const response = await GET(request);
    const data = await response.json();

    expect(data.loyalty).toEqual(mockLoyalty);
  });

  it('should return null if no loyalty points exist', async () => {
    (prisma.loyaltyPoints.findFirst as jest.Mock).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/loyalty');
    const response = await GET(request);
    const data = await response.json();

    expect(data.loyalty).toBeNull();
  });
});
