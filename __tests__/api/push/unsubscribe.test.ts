import { POST } from '@/app/api/push/unsubscribe/route';
import { NextRequest } from 'next/server';

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

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('POST /api/push/unsubscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should successfully unsubscribe from push notifications', async () => {
    const mockEndpoint = 'https://example.com/push/subscription123';

    const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: mockEndpoint }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    request.json = jest.fn().mockResolvedValue({ endpoint: mockEndpoint });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.message).toBe('Unsubscribed successfully');
    expect(response.status).toBe(200);
  });

  it('should log unsubscribe endpoint', async () => {
    const mockEndpoint = 'https://example.com/push/subscription456';

    const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: mockEndpoint }),
    });

    request.json = jest.fn().mockResolvedValue({ endpoint: mockEndpoint });

    await POST(request);

    expect(console.log).toHaveBeenCalledWith(
      'Push unsubscription received:',
      mockEndpoint
    );
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error');

    const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
      method: 'POST',
    });

    request.json = jest.fn().mockRejectedValue(mockError);

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to unsubscribe');
    expect(response.status).toBe(500);
  });

  it('should log errors to console', async () => {
    const mockError = new Error('Parse error');

    const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
      method: 'POST',
    });

    request.json = jest.fn().mockRejectedValue(mockError);

    await POST(request);

    expect(console.error).toHaveBeenCalledWith(
      'Error removing push subscription:',
      mockError
    );
  });

  it('should handle missing endpoint field', async () => {
    const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    request.json = jest.fn().mockResolvedValue({});

    const response = await POST(request);

    // Should still succeed but log undefined endpoint
    expect(console.log).toHaveBeenCalledWith(
      'Push unsubscription received:',
      undefined
    );
  });

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
      method: 'POST',
      body: 'invalid json',
    });

    request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(response.status).toBe(500);
  });

  it('should accept valid FCM endpoint', async () => {
    const fcmEndpoint = 'https://fcm.googleapis.com/fcm/send/abc123xyz';

    const request = new NextRequest('http://localhost:3000/api/push/unsubscribe', {
      method: 'POST',
      body: JSON.stringify({ endpoint: fcmEndpoint }),
    });

    request.json = jest.fn().mockResolvedValue({ endpoint: fcmEndpoint });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(response.ok).toBe(true);
  });
});
