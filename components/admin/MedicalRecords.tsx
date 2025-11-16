'use client';

import { useState, useEffect } from 'react';

interface MedicalRecord {
  id: number;
  recordType: string;
  title: string;
  description: string;
  diagnosis: string | null;
  prescription: string | null;
  labResults: string | null;
  isConfidential: boolean;
  createdAt: string;
  patient: {
    id: number;
    name: string | null;
  };
  doctor: {
    id: number;
    name: string;
    specialty: string;
  } | null;
}

export default function MedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/medical-records?limit=50');
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Error fetching medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter((record) => {
    if (selectedType === 'all') return true;
    return record.recordType === selectedType;
  });

  const getRecordTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      diagnosis: 'Диагноз',
      prescription: 'Рецепт',
      lab_result: 'Анализы',
      imaging: 'Снимки',
      note: 'Заметка',
    };
    return labels[type] || type;
  };

  const getRecordTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      diagnosis: 'bg-red-900 text-red-300',
      prescription: 'bg-blue-900 text-blue-300',
      lab_result: 'bg-green-900 text-green-300',
      imaging: 'bg-purple-900 text-purple-300',
      note: 'bg-yellow-900 text-yellow-300',
    };
    return colors[type] || 'bg-gray-900 text-gray-300';
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
        <h2 className="text-2xl font-bold text-white">Медицинские карты</h2>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Все типы</option>
          <option value="diagnosis">Диагнозы</option>
          <option value="prescription">Рецепты</option>
          <option value="lab_result">Анализы</option>
          <option value="imaging">Снимки</option>
          <option value="note">Заметки</option>
        </select>
      </div>

      <div className="grid gap-4">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-cyan-500 transition cursor-pointer"
            onClick={() => setSelectedRecord(record)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-3 py-1 rounded text-sm ${getRecordTypeColor(
                      record.recordType
                    )}`}
                  >
                    {getRecordTypeLabel(record.recordType)}
                  </span>
                  {record.isConfidential && (
                    <span className="px-2 py-1 bg-red-900 text-red-300 text-xs rounded">
                      🔒 Конфиденциально
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  {record.title}
                </h3>

                <div className="text-gray-400 text-sm space-y-1 mb-3">
                  <p>
                    Пациент: <span className="text-white">{record.patient.name || 'Не указано'}</span>
                  </p>
                  {record.doctor && (
                    <p>
                      Врач: <span className="text-white">{record.doctor.name}</span>{' '}
                      ({record.doctor.specialty})
                    </p>
                  )}
                  <p>
                    Дата: {new Date(record.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>

                <p className="text-gray-300 line-clamp-2">{record.description}</p>
              </div>

              <button className="ml-4 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition">
                Открыть
              </button>
            </div>
          </div>
        ))}

        {filteredRecords.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-xl">Записей не найдено</p>
          </div>
        )}
      </div>

      {/* Modal for viewing record details */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-white">{selectedRecord.title}</h2>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span
                  className={`px-3 py-1 rounded text-sm ${getRecordTypeColor(
                    selectedRecord.recordType
                  )}`}
                >
                  {getRecordTypeLabel(selectedRecord.recordType)}
                </span>
              </div>

              <div>
                <h3 className="text-sm text-gray-400 mb-1">Описание</h3>
                <p className="text-white">{selectedRecord.description}</p>
              </div>

              {selectedRecord.diagnosis && (
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Диагноз</h3>
                  <p className="text-white">{selectedRecord.diagnosis}</p>
                </div>
              )}

              {selectedRecord.prescription && (
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Рецепт</h3>
                  <p className="text-white whitespace-pre-wrap">{selectedRecord.prescription}</p>
                </div>
              )}

              {selectedRecord.labResults && (
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">Результаты анализов</h3>
                  <p className="text-white whitespace-pre-wrap">{selectedRecord.labResults}</p>
                </div>
              )}

              <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Пациент</p>
                    <p className="text-white">{selectedRecord.patient.name}</p>
                  </div>
                  {selectedRecord.doctor && (
                    <div>
                      <p className="text-gray-400">Врач</p>
                      <p className="text-white">{selectedRecord.doctor.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-400">Дата создания</p>
                    <p className="text-white">
                      {new Date(selectedRecord.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
