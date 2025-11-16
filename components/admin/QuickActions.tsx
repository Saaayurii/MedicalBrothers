'use client';

import { useState } from 'react';
import AddDoctorModal from './modals/AddDoctorModal';
import GenerateSlotsModal from './modals/GenerateSlotsModal';
import AddPatientModal from './modals/AddPatientModal';
import GenerateReportModal from './modals/GenerateReportModal';
import SettingsModal from './modals/SettingsModal';
import type { Doctor } from '@prisma/client';

interface QuickActionsProps {
  doctors: Doctor[];
}

export default function QuickActions({ doctors }: QuickActionsProps) {
  const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false);
  const [isGenerateSlotsOpen, setIsGenerateSlotsOpen] = useState(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const actions = [
    {
      icon: '➕',
      title: 'Добавить врача',
      description: 'Зарегистрировать нового специалиста',
      color: 'cyan',
      action: () => setIsAddDoctorOpen(true),
    },
    {
      icon: '📅',
      title: 'Создать слоты',
      description: 'Сгенерировать временные слоты',
      color: 'blue',
      action: () => setIsGenerateSlotsOpen(true),
    },
    {
      icon: '👤',
      title: 'Новый пациент',
      description: 'Добавить пациента в базу',
      color: 'purple',
      action: () => setIsAddPatientOpen(true),
    },
    {
      icon: '📊',
      title: 'Отчёты',
      description: 'Генерация аналитики',
      color: 'green',
      action: () => setIsGenerateReportOpen(true),
    },
    {
      icon: '⚙️',
      title: 'Настройки',
      description: 'Конфигурация клиники',
      color: 'orange',
      action: () => setIsSettingsOpen(true),
    },
    {
      icon: '🗄️',
      title: 'База данных',
      description: 'Prisma Studio',
      color: 'pink',
      action: () => window.open('http://localhost:5555', '_blank'),
    },
  ];

  return (
    <>
      <div className="cyber-card p-6">
        <h3 className="text-2xl font-bold mb-4 text-cyan-400">Быстрые действия</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`p-4 rounded-xl bg-gradient-to-br from-${action.color}-500/10 to-${action.color}-600/10
                         border border-${action.color}-500/30 hover:border-${action.color}-400/50
                         transition-all duration-300 hover:scale-105 group`}
            >
              <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <h4 className="font-bold text-sm mb-1">{action.title}</h4>
              <p className="text-xs text-gray-400">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Модальные окна */}
      <AddDoctorModal isOpen={isAddDoctorOpen} onClose={() => setIsAddDoctorOpen(false)} />
      <GenerateSlotsModal
        isOpen={isGenerateSlotsOpen}
        onClose={() => setIsGenerateSlotsOpen(false)}
        doctors={doctors}
      />
      <AddPatientModal isOpen={isAddPatientOpen} onClose={() => setIsAddPatientOpen(false)} />
      <GenerateReportModal isOpen={isGenerateReportOpen} onClose={() => setIsGenerateReportOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
