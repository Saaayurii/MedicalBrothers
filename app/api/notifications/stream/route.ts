import { NextRequest } from 'next/server';
import { notificationEmitter } from '@/lib/events/notification-emitter';
import { Notification } from '@/lib/types/notification';
import { getSession } from '@/lib/auth';

/**
 * @swagger
 * /api/notifications/stream:
 *   get:
 *     summary: Server-Sent Events stream for real-time notifications
 *     description: Establishes an SSE connection for receiving real-time notifications
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: SSE stream established
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: NextRequest) {
  // Check authentication
  const session = await getSession();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { adminId, role } = session;

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({
        type: 'connected',
        message: 'Real-time notifications connected',
        userId: adminId,
        role,
      })}\n\n`;

      controller.enqueue(encoder.encode(initialMessage));

      // Subscribe to notifications
      const unsubscribe = notificationEmitter.subscribeUser(
        adminId,
        role,
        (notification: Notification) => {
          const message = `data: ${JSON.stringify(notification)}\n\n`;
          controller.enqueue(encoder.encode(message));
        }
      );

      // Keep-alive ping every 30 seconds
      const keepAliveInterval = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 30000);

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
