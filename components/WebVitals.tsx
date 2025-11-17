'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVital } from '@/lib/performance';

export function WebVitals() {
  useReportWebVitals((metric) => {
    reportWebVital(metric);
  });

  return null;
}
