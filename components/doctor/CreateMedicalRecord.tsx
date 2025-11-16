'use client';

import { useState } from 'react';

interface CreateMedicalRecordProps {
  patientId: number;
  patientName: string;
  appointmentId?: number;
  onSuccess?: () => void;
}

export default function CreateMedicalRecord({
  patientId,
  patientName,
  appointmentId,
  onSuccess,
}: CreateMedicalRecordProps) {
  const [formData, setFormData] = useState({
    recordType: 'note',
    title: '',
    description: '',
    diagnosis: '',
    prescription: '',
    labResults: '',
    isConfidential: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
      alert('Заполните обязательные поля');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          appointmentId,
          recordType: formData.recordType,
          title: formData.title,
          description: formData.description,
          diagnosis: formData.diagnosis || null,
          prescription: formData.prescription || null,
          labResults: formData.labResults || null,
          isConfidential: formData.isConfidential,
        }),
      });

      if (response.ok) {
        alert('Медицинская карта успешно создана');
        setFormData({
          recordType: 'note',
          title: '',
          description: '',
          diagnosis: '',
          prescription: '',
          labResults: '',
          isConfidential: false,
        });
        if (onSuccess) onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Не удалось создать запись');
      }
    } catch (error) {
      console.error('Error creating medical record:', error);
      alert('Произошла ошибка');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg">
      <h3 className="text-xl font-bold text-white mb-4">
        Создать медицинскую запись для {patientName}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="recordType" className="block text-gray-300 mb-2">
            Тип записи <span className="text-red-500">*</span>
          </label>
          <select
            id="recordType"
            value={formData.recordType}
            onChange={(e) => setFormData({ ...formData, recordType: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="note">Заметка</option>
            <option value="diagnosis">Диагноз</option>
            <option value="prescription">Рецепт</option>
            <option value="lab_result">Результаты анализов</option>
            <option value="imaging">Снимки</option>
          </select>
        </div>

        <div>
          <label htmlFor="title" className="block text-gray-300 mb-2">
            Заголовок <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500"
            placeholder="Краткое название записи"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-gray-300 mb-2">
            Описание <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500"
            placeholder="Подробное описание"
            required
          />
        </div>

        {formData.recordType === 'diagnosis' && (
          <div>
            <label htmlFor="diagnosis" className="block text-gray-300 mb-2">
              Диагноз
            </label>
            <textarea
              id="diagnosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500"
              placeholder="Диагноз по МКБ-10"
            />
          </div>
        )}

        {formData.recordType === 'prescription' && (
          <div>
            <label htmlFor="prescription" className="block text-gray-300 mb-2">
              Рецепт
            </label>
            <textarea
              id="prescription"
              value={formData.prescription}
              onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500"
              placeholder="Название препарата, дозировка, длительность..."
            />
          </div>
        )}

        {formData.recordType === 'lab_result' && (
          <div>
            <label htmlFor="labResults" className="block text-gray-300 mb-2">
              Результаты анализов
            </label>
            <textarea
              id="labResults"
              value={formData.labResults}
              onChange={(e) => setFormData({ ...formData, labResults: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
              placeholder="Результаты анализов..."
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isConfidential"
            checked={formData.isConfidential}
            onChange={(e) => setFormData({ ...formData, isConfidential: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="isConfidential" className="text-gray-300">
            Конфиденциально (доступно только врачам и администраторам)
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-6 py-3 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition disabled:bg-gray-600"
        >
          {submitting ? 'Сохранение...' : 'Создать запись'}
        </button>
      </form>
    </div>
  );
}
