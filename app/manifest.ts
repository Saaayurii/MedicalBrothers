import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MedicalBrothers - Медицинский Голосовой Помощник',
    short_name: 'MedicalBrothers',
    description: 'Интеллектуальный голосовой помощник для медицинской клиники с AI-консультациями',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#0088e6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
    ],
    categories: ['medical', 'health', 'productivity'],
    lang: 'ru',
    dir: 'ltr',
  };
}
