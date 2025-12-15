import { ImageResponse } from 'next/og';

// Make this route dynamic to avoid build-time font fetching issues
export const runtime = 'edge';

// Image metadata
export const alt = 'MedicalBrothers - Медицинский Голосовой Помощник';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #581c87 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle at 50% 50%, #00f5ff 0%, transparent 50%)',
          }}
        />

        {/* Medical Icon */}
        <div
          style={{
            fontSize: 120,
            marginBottom: 20,
          }}
        >
          🏥
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #22d3ee 0%, #3b82f6 50%, #a855f7 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: 10,
          }}
        >
          MedicalBrothers
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 36,
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: 900,
          }}
        >
          Медицинский Голосовой Помощник с AI
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: 40,
            marginTop: 40,
            fontSize: 24,
            color: '#cbd5e1',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            🎤 Голосовое управление
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            🤖 AI консультант
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            📅 Запись на приём
          </div>
        </div>

        {/* Tech Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 20,
            color: '#64748b',
            padding: '10px 20px',
            borderRadius: 25,
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(34, 211, 238, 0.3)',
          }}
        >
          <span>⚡</span>
          <span>Next.js 16 • React 19 • Qwen AI</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
