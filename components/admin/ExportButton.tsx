'use client';

import { useState } from 'react';

interface ExportButtonProps {
  onExport: () => Promise<void>;
  label?: string;
  icon?: string;
}

export default function ExportButton({
  onExport,
  label = 'Экспорт в PDF',
  icon = '📄',
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } catch (error) {
      console.error('Export error:', error);
      alert('Ошибка при экспорте. Проверьте консоль для деталей.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
    >
      {isExporting ? (
        <>
          <span className="animate-spin">⏳</span>
          Экспорт...
        </>
      ) : (
        <>
          <span>{icon}</span>
          {label}
        </>
      )}
    </button>
  );
}
