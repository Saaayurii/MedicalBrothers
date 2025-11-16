import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Медицинский Голосовой Помощник',
  description: 'Интеллектуальный голосовой помощник для медицинской клиники',
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
      </body>
    </html>
  );
}
