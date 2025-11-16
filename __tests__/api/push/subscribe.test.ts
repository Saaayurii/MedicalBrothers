import { POST } from '@/app/api/push/subscribe/route';
import { NextRequest } from 'next/server';

// Mock next/server connection
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

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('POST /api/push/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should successfully save push subscription', async () => {
    const mockSubscription = {
      endpoint: 'https://example.com/push/subscription123',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
      },
    };

    const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(mockSubscription),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Mock request.json()
    request.json = jest.fn().mockResolvedValue(mockSubscription);

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.message).toBe('Subscription saved');
    expect(response.status).toBe(200);
  });

  it('should log subscription endpoint', async () => {
    const mockSubscription = {
      endpoint: 'https://example.com/push/subscription456',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key',
      },
    };

    const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(mockSubscription),
    });

    request.json = jest.fn().mockResolvedValue(mockSubscription);

    await POST(request);

    expect(console.log).toHaveBeenCalledWith(
      'Push subscription received:',
      mockSubscription.endpoint
    );
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database connection failed');

    const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
    });

    request.json = jest.fn().mockRejectedValue(mockError);

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(data.error).toBe('Failed to save subscription');
    expect(response.status).toBe(500);
  });

  it('should log errors to console', async () => {
    const mockError = new Error('Parse error');

    const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
    });

    request.json = jest.fn().mockRejectedValue(mockError);

    await POST(request);

    expect(console.error).toHaveBeenCalledWith(
      'Error saving push subscription:',
      mockError
    );
  });

  it('should accept subscription with all required fields', async () => {
    const completeSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
      expirationTime: null,
      keys: {
        p256dh: 'BMtL3L...truncated',
        auth: 'xY7Z8A...truncated',
      },
    };

    const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(completeSubscription),
    });

    request.json = jest.fn().mockResolvedValue(completeSubscription);

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(response.ok).toBe(true);
  });

  it('should handle malformed JSON', async () => {
    const request = new NextRequest('http://localhost:3000/api/push/subscribe', {
      method: 'POST',
      body: 'invalid json',
    });

    request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(false);
    expect(response.status).toBe(500);
  });
});
