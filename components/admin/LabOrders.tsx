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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Заказы анализов</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded ${
              filterStatus === 'all' ? 'bg-cyan-600' : 'bg-gray-700'
            } text-white`}
          >
            Все ({orders.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded ${
              filterStatus === 'pending' ? 'bg-yellow-600' : 'bg-gray-700'
            } text-white`}
          >
            Ожидают ({orders.filter((o) => o.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('processing')}
            className={`px-4 py-2 rounded ${
              filterStatus === 'processing' ? 'bg-blue-600' : 'bg-gray-700'
            } text-white`}
          >
            В процессе ({orders.filter((o) => o.status === 'processing').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-4 py-2 rounded ${
              filterStatus === 'completed' ? 'bg-green-600' : 'bg-gray-700'
            } text-white`}
          >
            Завершены ({orders.filter((o) => o.status === 'completed').length})
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <div
            key={order.id}
            className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl font-mono text-cyan-400">
                    {order.orderNumber}
                  </span>
                  <span className={`px-3 py-1 rounded text-sm ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-400 text-sm">Лаборатория</p>
                    <p className="text-white font-semibold">{order.labName}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Тип анализа</p>
                    <p className="text-white font-semibold">{order.testType}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Пациент</p>
                    <p className="text-white">{order.patient.name || 'Не указано'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Врач</p>
                    <p className="text-white">{order.doctor.name}</p>
                  </div>
                </div>

                <div className="text-gray-400 text-sm">
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
                  <div className="mt-3 p-3 bg-gray-900 rounded">
                    <p className="text-gray-400 text-sm">Заметки:</p>
                    <p className="text-white">{order.notes}</p>
                  </div>
                )}

                {order.results && (
                  <div className="mt-3 p-3 bg-green-900 bg-opacity-20 rounded">
                    <p className="text-green-400 text-sm">Результаты:</p>
                    <p className="text-white whitespace-pre-wrap">{order.results}</p>
                  </div>
                )}
              </div>

              <div className="ml-4 flex flex-col gap-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'processing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    В процесс
                  </button>
                )}
                {order.status === 'processing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    Завершить
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'processing') && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'failed')}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Ошибка
                  </button>
                )}
                {order.resultFileUrl && (
                  <a
                    href={order.resultFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition text-center"
                  >
                    Открыть файл
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">Заказов не найдено</p>
          </div>
        )}
      </div>
    </div>
  );
}
