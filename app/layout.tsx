import type { Metadata } from 'next';
import './globals.css';
import PWAInstaller from '@/components/PWAInstaller';
import PushNotificationManager from '@/components/PushNotificationManager';

export const metadata: Metadata = {
  title: {
    default: 'MedicalBrothers - Медицинский Голосовой Помощник',
    template: '%s | MedicalBrothers',
  },
  description: 'Интеллектуальный голосовой помощник для медицинской клиники с AI-консультациями, записью на приём и экстренными вызовами. Работает на Next.js 16 и Qwen AI.',
  keywords: ['медицинская клиника', 'голосовой помощник', 'AI', 'запись к врачу', 'телемедицина', 'консультация онлайн', 'Qwen', 'Next.js'],
  authors: [{ name: 'MedicalBrothers Team', url: 'https://github.com/Saaayurii/MedicalBrothers' }],
  creator: 'MedicalBrothers',
  publisher: 'MedicalBrothers',
  applicationName: 'MedicalBrothers Voice Assistant',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: '/',
    title: 'MedicalBrothers - Медицинский Голосовой Помощник',
    description: 'Интеллектуальный голосовой помощник для медицинской клиники с AI-консультациями',
    siteName: 'MedicalBrothers',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MedicalBrothers - Медицинский Голосовой Помощник',
    description: 'Интеллектуальный голосовой помощник для медицинской клиники с AI-консультациями',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.svg',
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">
        {children}
        <PWAInstaller />
        <PushNotificationManager />
      </body>
    </html>
  );
}
