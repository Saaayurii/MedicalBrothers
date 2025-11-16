'use client';

import { useState, useMemo } from 'react';
import type { Doctor } from '@prisma/client';

export default function DoctorsList({ doctors }: { doctors: Doctor[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      // Фильтр по статусу активности
      if (activeFilter === 'active' && !doctor.isActive) return false;
      if (activeFilter === 'inactive' && doctor.isActive) return false;

      // Поиск по имени и специальности
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = doctor.name.toLowerCase();
        const specialty = doctor.specialty.toLowerCase();

        return name.includes(query) || specialty.includes(query);
      }

      return true;
    });
  }, [doctors, searchQuery, activeFilter]);

  return (
    <div className="cyber-card p-6">
      <h2 className="text-2xl font-bold mb-6 text-purple-400">
        👨‍⚕️ Врачи клиники ({filteredDoctors.length})
      </h2>

      {/* Поиск и фильтры */}
      <div className="mb-4 space-y-3">
        {/* Поиск */}
        <input
          type="text"
          placeholder="🔍 Поиск по имени или специальности..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
        />

        {/* Фильтр по активности */}
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
        >
          <option value="all">Все врачи</option>
          <option value="active">Только активные</option>
          <option value="inactive">Неактивные</option>
        </select>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {filteredDoctors.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-4xl mb-4">👨‍⚕️</p>
            <p>{searchQuery || activeFilter !== 'all' ? 'Не найдено врачей' : 'Нет врачей'}</p>
          </div>
        ) : (
          filteredDoctors.map((doctor) => (
          <div
            key={doctor.id}
            className={`bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4 hover:border-purple-400/50 transition-all ${
              !doctor.isActive ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {doctor.name}
                  {doctor.isActive && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </h3>
                <p className="text-sm text-gray-400">{doctor.specialty}</p>
              </div>
              <span className="text-xs text-gray-500">
                {doctor.experienceYears} лет опыта
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
              {doctor.phone && (
                <div>
                  <span className="text-gray-400">Телефон:</span>
                  <p className="font-semibold">{doctor.phone}</p>
                </div>
              )}
              {doctor.email && (
                <div>
                  <span className="text-gray-400">Email:</span>
                  <p className="font-semibold text-xs">{doctor.email}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <button className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg text-sm transition-all">
                📅 Расписание
              </button>
              <button className="flex-1 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-sm transition-all">
                ✏️ Изменить
              </button>
            </div>
          </div>
          ))
        )}
      </div>

      <button className="w-full mt-6 neon-button">
        ➕ Добавить врача
      </button>
    </div>
  );
}
