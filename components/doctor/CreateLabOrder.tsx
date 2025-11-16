'use client';

import { useState } from 'react';

interface CreateLabOrderProps {
  patientId: number;
  patientName: string;
  appointmentId?: number;
  onSuccess?: () => void;
}

export default function CreateLabOrder({
  patientId,
  patientName,
  appointmentId,
  onSuccess,
}: CreateLabOrderProps) {
  const [formData, setFormData] = useState({
    labName: '',
    testType: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const commonLabs = [
    'Инвитро',
    'Гемотест',
    'KDL',
    'Хеликс',
    'Ситилаб',
  ];

  const commonTests = [
    'Общий анализ крови',
    'Биохимический анализ крови',
    'Общий анализ мочи',
    'ЭКГ',
    'УЗИ',
    'Рентген',
    'МРТ',
    'КТ',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.labName || !formData.testType) {
      alert('Заполните обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/lab-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          appointmentId,
          labName: formData.labName,
          testType: formData.testType,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Заказ создан! Номер: ${data.labOrder.orderNumber}`);
        setFormData({
          labName: '',
          testType: '',
          notes: '',
        });
        if (onSuccess) onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Не удалось создать заказ');
      }
    } catch (error) {
      console.error('Error creating lab order:', error);
      alert('Произошла ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">
        Заказать анализы для {patientName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="labName" className="block text-gray-300 mb-2">
            Лаборатория <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="labName"
            value={formData.labName}
            onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
            list="labs"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500"
            placeholder="Выберите или введите название лаборатории"
            required
          />
          <datalist id="labs">
            {commonLabs.map((lab) => (
              <option key={lab} value={lab} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="testType" className="block text-gray-300 mb-2">
            Тип анализа <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="testType"
            value={formData.testType}
            onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
            list="tests"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500"
            placeholder="Выберите или введите тип анализа"
            required
          />
          <datalist id="tests">
            {commonTests.map((test) => (
              <option key={test} value={test} />
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="notes" className="block text-gray-300 mb-2">
            Дополнительные указания
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500"
            placeholder="Особые указания для лаборатории..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition disabled:bg-gray-600"
        >
          {submitting ? 'Создание заказа...' : 'Создать заказ'}
        </button>
      </form>
    </div>
  );
}
