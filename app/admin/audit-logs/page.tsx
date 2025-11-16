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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link
              href="/admin"
              className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              MedicalBrothers
            </Link>
            <p className="text-sm text-gray-400 mt-1">Журнал аудита</p>
          </div>

          <Link
            href="/admin"
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg transition-all"
          >
            ← Назад в админку
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="cyber-card p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">📜 Журнал аудита</h1>
            <p className="text-gray-400">
              История всех действий администраторов в системе
            </p>
          </div>

          <AuditLogViewer logs={logs} total={total} />
        </div>
      </div>
    </div>
  );
}
