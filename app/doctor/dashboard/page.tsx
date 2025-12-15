import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { getSession, destroySession } from '@/lib/auth';

import CreateMedicalRecord from '@/components/doctor/CreateMedicalRecord';
import CreateLabOrder from '@/components/doctor/CreateLabOrder';
import ReviewsView from '@/components/doctor/ReviewsView';
import NotificationCenter from '@/components/NotificationCenter';
import { DoctorHeartbeat } from '@/components/DoctorOnlineIndicator';
import Footer from '@/components/Footer';
import DoctorHeader from '@/components/DoctorHeader';

async function getDoctorData(doctorId: number) {
  noStore();
  await connection();

  try {
    const [doctor, appointments, patients, schedules] = await Promise.all([
      prisma.doctor.findUnique({
        where: { id: doctorId },
      }),

      prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: {
            gte: new Date(),
          },
        },
        include: {
          patient: true,
        },
        orderBy: [
          { appointmentDate: 'asc' },
          { appointmentTime: 'asc' },
        ],
        take: 20,
      }),

      prisma.patient.findMany({
        where: {
          appointments: {
            some: {
              doctorId,
            },
          },
        },
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      prisma.doctorSchedule.findMany({
        where: { doctorId },
        orderBy: { dayOfWeek: 'asc' },
      }),
    ]);

    return { doctor, appointments, patients, schedules };
  } catch (error) {
    console.error('Error fetching doctor data:', error);
    return {
      doctor: null,
      appointments: [],
      patients: [],
      schedules: [],
    };
  }
}

async function DoctorContent({ doctorId }: { doctorId: number }) {
  const { doctor, appointments, patients } = await getDoctorData(doctorId);

  if (!doctor) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Профиль врача не найден</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Предстоящие записи</p>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{appointments.length}</p>
        </div>

        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Всего пациентов</p>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{patients.length}</p>
        </div>

        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Специализация</p>
            <span className="text-2xl">🏥</span>
          </div>
          <p className="text-lg font-bold text-purple-400">{doctor.specialty}</p>
        </div>
      </div>

      {/* Reviews */}
      <div className="cyber-card p-6">
        <h2 className="text-2xl font-bold mb-6 text-cyan-400">⭐ Мои Отзывы</h2>
        <ReviewsView doctorId={doctor.id} />
      </div>

      {/* Create Medical Record */}
      <div className="cyber-card p-6">
        <h2 className="text-2xl font-bold mb-6 text-green-400">📋 Создать Медицинскую Карту</h2>
        <CreateMedicalRecord />
      </div>

      {/* Create Lab Order */}
      <div className="cyber-card p-6">
        <h2 className="text-2xl font-bold mb-6 text-orange-400">🧪 Заказать Анализы</h2>
        <CreateLabOrder />
      </div>

      {/* Upcoming Appointments */}
      <div className="cyber-card p-6">
        <h2 className="text-2xl font-bold mb-6 text-blue-400">
          📅 Предстоящие Записи ({appointments.length})
        </h2>

        {appointments.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Нет предстоящих записей</p>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-lg">{appointment.patient?.name || 'Пациент'}</p>
                    <p className="text-sm text-gray-400">{appointment.patient?.email || '-'}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      appointment.status === 'scheduled'
                        ? 'bg-blue-500/20 text-blue-400'
                        : appointment.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {appointment.status}
                  </span>
                </div>
                <div className="flex gap-4 text-sm">
                  <p>
                    📅 {new Date(appointment.appointmentDate).toLocaleDateString('ru-RU')}
                  </p>
                  <p>⏰ {appointment.appointmentTime?.toString() || '-'}</p>
                </div>
                {appointment.notes && (
                  <p className="text-sm text-gray-400 mt-2">{appointment.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Patients */}
      <div className="cyber-card p-6">
        <h2 className="text-2xl font-bold mb-6 text-purple-400">
          👥 Последние Пациенты ({patients.length})
        </h2>

        {patients.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Нет пациентов</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4"
              >
                <p className="font-semibold">{patient.name}</p>
                <p className="text-sm text-gray-400">{patient.email}</p>
                <p className="text-sm text-gray-400">{patient.phone}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

async function handleLogout() {
  'use server';
  await destroySession();
  redirect('/admin/login');
}

export default async function DoctorDashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  // Check if user is a doctor (has doctorId)
  if (!session.doctorId) {
    redirect('/admin');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 pb-20 md:pb-0">
      {/* Online Status Heartbeat */}
      <DoctorHeartbeat />

      {/* Notification Center */}
      <NotificationCenter />

      {/* Header */}
      <DoctorHeader
        username={session.username}
        email={session.email}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        <Suspense
          fallback={
            <div className="space-y-4 sm:space-y-8">
              <div className="cyber-card p-4 sm:p-6 animate-pulse text-sm sm:text-base">Загрузка данных...</div>
            </div>
          }
        >
          <DoctorContent doctorId={session.doctorId} />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
