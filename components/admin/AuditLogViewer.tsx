'use client';

import { useState } from 'react';
import { getActionLabel, getEntityLabel } from '@/lib/audit';

interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  admin: {
    username: string;
    fullName: string | null;
    role: string;
  };
}

interface AuditLogViewerProps {
  logs: AuditLog[];
  total: number;
}

export default function AuditLogViewer({ logs, total }: AuditLogViewerProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterEntity, setFilterEntity] = useState<string>('');

  const filteredLogs = logs.filter((log) => {
    if (filterAction && log.action !== filterAction) return false;
    if (filterEntity && log.entity !== filterEntity) return false;
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));
  const uniqueEntities = Array.from(new Set(logs.map((log) => log.entity)));

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'update':
      case 'status_change':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delete':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'login':
      case 'logout':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-xs mb-1 text-gray-400">Действие</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="">Все действия</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {getActionLabel(action)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs mb-1 text-gray-400">Сущность</label>
          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="">Все сущности</option>
            {uniqueEntities.map((entity) => (
              <option key={entity} value={entity}>
                {getEntityLabel(entity)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterAction('');
              setFilterEntity('');
            }}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-gray-400">
        <span>Всего логов: {total}</span>
        <span>Показано: {filteredLogs.length}</span>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-3 text-xs font-medium text-gray-400">Дата/Время</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400">Пользователь</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400">Действие</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400">Сущность</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400">ID</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400">IP</th>
              <th className="text-left p-3 text-xs font-medium text-gray-400">Детали</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr
                key={log.id}
                className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <td className="p-3 text-sm">
                  {new Date(log.createdAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
                <td className="p-3 text-sm">
                  <div>
                    <p className="font-medium">{log.admin.fullName || log.admin.username}</p>
                    <p className="text-xs text-gray-400">{log.admin.role}</p>
                  </div>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs border ${getActionColor(log.action)}`}>
                    {getActionLabel(log.action)}
                  </span>
                </td>
                <td className="p-3 text-sm">{getEntityLabel(log.entity)}</td>
                <td className="p-3 text-sm text-gray-400">{log.entityId || '-'}</td>
                <td className="p-3 text-sm text-gray-400 font-mono text-xs">
                  {log.ipAddress || '-'}
                </td>
                <td className="p-3 text-sm">
                  {log.details && Object.keys(log.details).length > 0 ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-xs"
                    >
                      Показать
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p>Нет логов для отображения</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="cyber-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-cyan-400">Детали лога #{selectedLog.id}</h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Дата и время</p>
                <p>
                  {new Date(selectedLog.createdAt).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Пользователь</p>
                <p>
                  {selectedLog.admin.fullName || selectedLog.admin.username} ({selectedLog.admin.role})
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Действие</p>
                <p>{getActionLabel(selectedLog.action)}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Сущность</p>
                <p>
                  {getEntityLabel(selectedLog.entity)}
                  {selectedLog.entityId && ` #${selectedLog.entityId}`}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">IP адрес</p>
                <p className="font-mono">{selectedLog.ipAddress || 'Неизвестно'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">User Agent</p>
                <p className="text-xs break-words">{selectedLog.userAgent || 'Неизвестно'}</p>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Дополнительные данные</p>
                  <pre className="bg-slate-900 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="mt-6 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
