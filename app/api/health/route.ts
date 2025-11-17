import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import redis from '@/lib/redis';

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns health status of the application and its dependencies
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                 services:
 *                   type: object
 *       503:
 *         description: System is unhealthy
 */
export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};

  // Check Database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      status: 'ok',
      latency: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    if (redis) {
      await redis.ping();
      checks.redis = {
        status: 'ok',
        latency: Date.now() - redisStart,
      };
    } else {
      checks.redis = {
        status: 'disabled',
      };
    }
  } catch (error) {
    checks.redis = {
      status: 'error',
      error: error instanceof Error ? error.message : 'Redis connection failed',
    };
  }

  // Overall status
  const allHealthy = Object.values(checks).every(
    (check) => check.status === 'ok' || check.status === 'disabled'
  );

  const response = {
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    services: checks,
    responseTime: Date.now() - startTime,
  };

  return NextResponse.json(response, {
    status: allHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

export const dynamic = 'force-dynamic';
