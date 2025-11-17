import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Allowed origins for CORS
const getAllowedOrigins = () => {
  const origins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  return [...origins, 'http://localhost:3000'];
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get('origin');

  // Create response
  let response: NextResponse;

  // Проверяем админ роуты (кроме /admin/login)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionCookie = request.cookies.get('admin_session');

    // Если нет сессии - редирект на логин
    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      response = NextResponse.redirect(loginUrl);
    } else {
      // Проверяем валидность сессии
      try {
        JSON.parse(sessionCookie.value);
        response = NextResponse.next();
      } catch (error) {
        // Невалидная сессия - редирект на логин
        const loginUrl = new URL('/admin/login', request.url);
        response = NextResponse.redirect(loginUrl);
        response.cookies.delete('admin_session');
      }
    }
  }
  // Проверяем пациентские роуты (кроме /patient/login и /patient/register)
  else if (
    pathname.startsWith('/patient/dashboard') ||
    pathname.startsWith('/appointments') ||
    pathname.startsWith('/chat/') ||
    pathname.startsWith('/video/')
  ) {
    const patientSessionCookie = request.cookies.get('patient_session');

    // Если нет сессии - редирект на логин
    if (!patientSessionCookie) {
      const loginUrl = new URL('/patient/login', request.url);
      response = NextResponse.redirect(loginUrl);
    } else {
      // Проверяем валидность сессии
      try {
        JSON.parse(patientSessionCookie.value);
        response = NextResponse.next();
      } catch (error) {
        // Невалидная сессия - редирект на логин
        const loginUrl = new URL('/patient/login', request.url);
        response = NextResponse.redirect(loginUrl);
        response.cookies.delete('patient_session');
      }
    }
  } else {
    response = NextResponse.next();
  }

  // Add Security Headers
  const headers = response.headers;

  // CORS
  const allowedOrigins = getAllowedOrigins();
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (request.method === 'OPTIONS') {
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    headers.set('Access-Control-Max-Age', '86400');
    return new NextResponse(null, { status: 204, headers });
  }

  // Security Headers
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    connect-src 'self' https://dashscope.aliyuncs.com;
    media-src 'self';
    object-src 'none';
    frame-ancestors 'self';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|robots.txt|sitemap.xml).*)',
  ],
};
