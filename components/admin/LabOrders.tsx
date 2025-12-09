'use client';

import { useState, useEffect } from 'react';

interface LabOrder {
  id: number;
  orderNumber: string;
  labName: string;
  testType: string;
  status: string;
  orderedAt: string;
  completedAt: string | null;
  results: string | null;
  resultFileUrl: string | null;
  notes: string | null;
  patient: {
    id: number;
    name: string | null;
  };
  doctor: {
    id: number;
    name: string;
    specialty: string;
  };
}

export default function LabOrders() {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lab-orders?limit=100');
      const data = await response.json();
      setOrders(data.labOrders || []);
    } catch (error) {
      console.error('Error fetching lab orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch('/api/lab-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });

      if (response.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    return order.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-900 text-yellow-300',
      processing: 'bg-blue-900 text-blue-300',
      completed: 'bg-green-900 text-green-300',
      failed: 'bg-red-900 text-red-300',
    };
    return colors[status] || 'bg-gray-900 text-gray-300';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Ожидает',
      processing: 'В процессе',
      completed: 'Завершен',
      failed: 'Ошибка',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters - responsive */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm ${
            filterStatus === 'all' ? 'bg-cyan-600' : 'bg-gray-700'
          } text-white transition-colors`}
        >
          Все ({orders.length})
        </button>
        <button
          onClick={() => setFilterStatus('pending')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm ${
            filterStatus === 'pending' ? 'bg-yellow-600' : 'bg-gray-700'
          } text-white transition-colors`}
        >
          Ожидают ({orders.filter((o) => o.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilterStatus('processing')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm ${
            filterStatus === 'processing' ? 'bg-blue-600' : 'bg-gray-700'
          } text-white transition-colors`}
        >
          В процессе ({orders.filter((o) => o.status === 'processing').length})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded text-xs sm:text-sm ${
            filterStatus === 'completed' ? 'bg-green-600' : 'bg-gray-700'
          } text-white transition-colors`}
        >
          Готовы ({orders.filter((o) => o.status === 'completed').length})
        </button>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="cyber-card p-3 sm:p-4 md:p-6 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Header with order number and status */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-base sm:text-xl font-mono text-cyan-400">
                  {order.orderNumber}
                </span>
                <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded text-xs sm:text-sm ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {/* Order info grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <p className="text-gray-400 text-[10px] sm:text-sm">Лаборатория</p>
                  <p className="text-white font-semibold text-xs sm:text-base truncate">{order.labName}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] sm:text-sm">Тип анализа</p>
                  <p className="text-white font-semibold text-xs sm:text-base truncate">{order.testType}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] sm:text-sm">Пациент</p>
                  <p className="text-white text-xs sm:text-base truncate">{order.patient.name || 'Не указано'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] sm:text-sm">Врач</p>
                  <p className="text-white text-xs sm:text-base truncate">{order.doctor.name}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="text-gray-400 text-[10px] sm:text-sm">
                <p>
                  Заказан: {new Date(order.orderedAt).toLocaleString('ru-RU')}
                </p>
                {order.completedAt && (
                  <p>
                    Завершен: {new Date(order.completedAt).toLocaleString('ru-RU')}
                  </p>
                )}
              </div>

              {order.notes && (
                <div className="p-2 sm:p-3 bg-gray-900 rounded">
                  <p className="text-gray-400 text-[10px] sm:text-sm">Заметки:</p>
                  <p className="text-white text-xs sm:text-sm">{order.notes}</p>
                </div>
              )}

              {order.results && (
                <div className="p-2 sm:p-3 bg-green-900 bg-opacity-20 rounded">
                  <p className="text-green-400 text-[10px] sm:text-sm">Результаты:</p>
                  <p className="text-white text-xs sm:text-sm whitespace-pre-wrap">{order.results}</p>
                </div>
              )}

              {/* Action buttons - responsive */}
              <div className="flex flex-wrap gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                    className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 transition"
                  >
                    В процесс
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 transition"
                  >
                    Завершить
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'processing') && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'failed')}
                    className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 transition"
                  >
                    Ошибка
                  </button>
                )}
                {order.resultFileUrl && (
                  <a
                    href={order.resultFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 sm:flex-none px-3 py-1.5 sm:px-4 sm:py-2 bg-cyan-600 text-white rounded text-xs sm:text-sm hover:bg-cyan-700 transition text-center"
                  >
                    Открыть файл
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 sm:py-12 text-gray-400">
            <p className="text-base sm:text-xl">Заказов не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
