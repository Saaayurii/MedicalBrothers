import { GET, POST } from '@/app/api/lab-orders/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    labOrder: {
      findMany: jest.fn(),
      create: jest.fn(),
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

describe('GET /api/lab-orders', () => {
  it('should fetch lab orders', async () => {
    const mockOrders = [
      {
        id: 1,
        patientId: 1,
        orderNumber: 'LAB-001',
        testName: 'Blood Test',
        status: 'pending',
        createdAt: new Date(),
        patient: { id: 1, name: 'John Doe' },
        doctor: { id: 1, name: 'Dr. Smith' },
      },
    ];

    (prisma.labOrder.findMany as jest.Mock).mockResolvedValue(mockOrders);

    const request = new NextRequest('http://localhost:3000/api/lab-orders');
    const response = await GET(request);
    const data = await response.json();

    expect(data.orders).toEqual(mockOrders);
  });
});

describe('POST /api/lab-orders', () => {
  it('should create a lab order', async () => {
    const mockOrder = {
      id: 1,
      patientId: 1,
      orderNumber: 'LAB-001',
      testName: 'Blood Test',
      status: 'pending',
      createdAt: new Date(),
    };

    (prisma.labOrder.create as jest.Mock).mockResolvedValue(mockOrder);

    const request = new NextRequest('http://localhost:3000/api/lab-orders', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 1,
        testName: 'Blood Test',
      }),
    });

    request.json = jest.fn().mockResolvedValue({
      patientId: 1,
      testName: 'Blood Test',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.order).toEqual(mockOrder);
    expect(response.status).toBe(201);
  });
});
