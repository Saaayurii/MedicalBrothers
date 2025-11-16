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
  createdAt: string;
  doctor: {
    name: string;
    specialty: string;
  } | null;
}

export default function PatientMedicalRecords() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/medical-records');
      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error('Error fetching medical records:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <h2 className="text-2xl font-bold text-white">Мои медицинские карты</h2>

      {records.length === 0 ? (
        <div className="cyber-card p-12 bg-gray-800 border border-gray-700 rounded-lg text-center">
          <p className="text-gray-400 text-lg">У вас пока нет медицинских записей</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="cyber-card p-6 bg-gray-800 border border-gray-700 rounded-lg hover:border-cyan-500 transition cursor-pointer"
              onClick={() => setSelectedRecord(record)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded text-sm ${getRecordTypeColor(record.recordType)}`}>
                      {getRecordTypeLabel(record.recordType)}
                    </span>
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-2">{record.title}</h3>

                  {record.doctor && (
                    <p className="text-gray-400 text-sm mb-2">
                      Врач: {record.doctor.name} ({record.doctor.specialty})
                    </p>
                  )}

                  <p className="text-gray-400 text-sm mb-3">
                    {new Date(record.createdAt).toLocaleDateString('ru-RU')}
                  </p>

                  <p className="text-gray-300 line-clamp-2">{record.description}</p>
                </div>

                <button className="ml-4 px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition">
                  Просмотр
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
                <span className={`px-3 py-1 rounded text-sm ${getRecordTypeColor(selectedRecord.recordType)}`}>
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
                {selectedRecord.doctor && (
                  <div className="mb-2">
                    <p className="text-gray-400 text-sm">Врач</p>
                    <p className="text-white">{selectedRecord.doctor.name}</p>
                    <p className="text-gray-400 text-sm">{selectedRecord.doctor.specialty}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-400 text-sm">Дата создания</p>
                  <p className="text-white">
                    {new Date(selectedRecord.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
