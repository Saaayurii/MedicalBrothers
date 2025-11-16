'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface RealTimeUpdaterProps {
  /**
   * Interval in milliseconds for polling updates
   * @default 30000 (30 seconds)
   */
  interval?: number;

  /**
   * Enable/disable real-time updates
   * @default true
   */
  enabled?: boolean;
}

export default function RealTimeUpdater({
  interval = 30000,
  enabled = true
}: RealTimeUpdaterProps) {
  const router = useRouter();

  const refreshData = useCallback(() => {
    // Refresh the current page data
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!enabled) return;

    // Initial refresh after a short delay
    const initialTimeout = setTimeout(refreshData, 5000);

    // Set up polling interval
    const intervalId = setInterval(refreshData, interval);

    // Handle visibility change - refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval, refreshData]);

  // This component doesn't render anything
  return null;
}
