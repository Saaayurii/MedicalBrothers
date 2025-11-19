'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    // Verify email
    fetch(`/api/auth/email/verify?token=${token}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');

          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/patient/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email');
        }
      })
      .catch((error) => {
        setStatus('error');
        setMessage('An error occurred during verification');
        console.error('Verification error:', error);
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent inline-block mb-2"
          >
            MedicalBrothers
          </Link>
          <h1 className="text-2xl font-bold text-white">Email Verification</h1>
        </div>

        {/* Status Card */}
        <div className="cyber-card p-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400 mx-auto mb-4"></div>
              <p className="text-gray-300">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="text-green-400 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-green-400 mb-4">Success!</h2>
              <p className="text-gray-300 mb-4">{message}</p>
              <p className="text-sm text-gray-400">Redirecting to login page...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">✕</div>
              <h2 className="text-2xl font-bold text-red-400 mb-4">Verification Failed</h2>
              <p className="text-gray-300 mb-6">{message}</p>

              <div className="space-y-2">
                <Link
                  href="/patient/login"
                  className="block w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded transition-colors"
                >
                  Go to Login
                </Link>
                <Link
                  href="/patient/register"
                  className="block w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Register Again
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
