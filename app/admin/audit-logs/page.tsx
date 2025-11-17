import { unstable_noStore as noStore } from 'next/cache';
import { connection } from 'next/server';
import Link from 'next/link';
import { requirePermission } from '@/lib/auth';
import { Permission } from '@/lib/roles';
import { getAuditLogs } from '@/lib/audit';
import AuditLogViewer from '@/components/admin/AuditLogViewer';

export default async function AuditLogsPage() {
  noStore();
  await connection();

  // Require permission to view audit logs
  await requirePermission(Permission.VIEW_AUDIT_LOGS);

  const { logs, total } = await getAuditLogs({ limit: 100 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <Link
              href="/admin"
              className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              MedicalBrothers
            </Link>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Журнал аудита</p>
          </div>

          <Link
            href="/admin"
            className="px-3 py-2 sm:px-4 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all text-sm sm:text-base w-full sm:w-auto text-center"
          >
            ← Назад в админку
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        <div className="cyber-card p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">📜 Журнал аудита</h1>
            <p className="text-sm sm:text-base text-gray-400">
              История всех действий администраторов в системе
            </p>
          </div>

          <AuditLogViewer logs={logs} total={total} />
        </div>
      </div>
    </div>
  );
}
