import { GET, POST } from '@/app/api/medical-records/route';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    medicalRecord: {
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
  requireApiRole: jest.fn().mockResolvedValue({
    session: { adminId: 1, role: 'doctor' },
    user: { id: '1', role: 'doctor' },
  }),
}));

describe('GET /api/medical-records', () => {
  it('should fetch medical records for patient', async () => {
    const mockRecords = [
      {
        id: 1,
        patientId: 1,
        recordType: 'prescription',
        diagnosis: 'Flu',
        createdAt: new Date(),
        doctor: { id: 1, name: 'Dr. Smith' },
      },
    ];

    (prisma.medicalRecord.findMany as jest.Mock).mockResolvedValue(mockRecords);

    const request = new NextRequest('http://localhost:3000/api/medical-records');
    const response = await GET(request);
    const data = await response.json();

    expect(data.records).toEqual(mockRecords);
  });
});

describe('POST /api/medical-records', () => {
  it('should create a medical record', async () => {
    const mockRecord = {
      id: 1,
      patientId: 1,
      recordType: 'prescription',
      diagnosis: 'Flu',
      createdAt: new Date(),
    };

    (prisma.medicalRecord.create as jest.Mock).mockResolvedValue(mockRecord);

    const request = new NextRequest('http://localhost:3000/api/medical-records', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 1,
        recordType: 'prescription',
        diagnosis: 'Flu',
      }),
    });

    request.json = jest.fn().mockResolvedValue({
      patientId: 1,
      recordType: 'prescription',
      diagnosis: 'Flu',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.record).toEqual(mockRecord);
    expect(response.status).toBe(201);
  });
});
