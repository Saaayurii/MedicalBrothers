import { unstable_noStore as noStore } from 'next/cache';
import { connection } from 'next/server';
import Link from 'next/link';
import { requirePatientAuth } from '@/lib/patient-auth';
import prisma from '@/lib/prisma';
import { logoutAction } from '@/app/actions/patient';
import AppointmentCard from '@/components/AppointmentCard';
import PatientReviews from '@/components/patient/Reviews';
import PatientMedicalRecords from '@/components/patient/MedicalRecords';
import LoyaltyPoints from '@/components/patient/LoyaltyPoints';

async function getPatientData(patientId: number) {
  noStore();
  await connection();

  try {
    const [patient, appointments, consultations] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
      }),

      prisma.appointment.findMany({
        where: { patientId },
        include: {
          doctor: true,
          patient: true,
        },
        orderBy: [
          { appointmentDate: 'desc' },
          { appointmentTime: 'desc' },
        ],
        take: 10,
      }),

      prisma.consultation.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return { patient, appointments, consultations };
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return {
      patient: null,
      appointments: [],
      consultations: [],
    };
  }
}

export default async function PatientDashboardPage() {
  await connection(); // Access request data before auth
  const session = await requirePatientAuth();
  const { patient, appointments, consultations } = await getPatientData(session.id);

  if (!patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <p className="text-white">Ошибка загрузки данных пациента</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Шапка */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <Link href="/" className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              MedicalBrothers
            </Link>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">Личный кабинет</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-left sm:text-right">
              <p className="text-sm sm:text-base text-white font-semibold">{patient.name}</p>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">{patient.email}</p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="px-3 py-2 sm:px-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap"
              >
                Выход
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Левая колонка - Информация о пациенте */}
          <div className="lg:col-span-1">
            <div className="cyber-card p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-cyan-400">👤 Мой профиль</h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-xs text-gray-400">ФИО</p>
                  <p className="text-base sm:text-lg font-semibold">{patient.name || 'Не указано'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-sm sm:text-base break-all">{patient.email || 'Не указан'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-400">Телефон</p>
                  <p className="text-sm sm:text-base">{patient.phone || 'Не указан'}</p>
                </div>

                {patient.dateOfBirth && (
                  <div>
                    <p className="text-xs text-gray-400">Дата рождения</p>
                    <p className="text-sm sm:text-base">{new Date(patient.dateOfBirth).toLocaleDateString('ru-RU')}</p>
                  </div>
                )}

                {patient.address && (
                  <div>
                    <p className="text-xs text-gray-400">Адрес</p>
                    <p className="text-sm sm:text-base">{patient.address}</p>
                  </div>
                )}

                <div className="pt-3 sm:pt-4 border-t border-slate-700">
                  <p className="text-xs text-gray-400">Регистрация</p>
                  <p className="text-sm">{new Date(patient.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>

              <Link
                href="/"
                className="w-full mt-4 sm:mt-6 neon-button py-2 block text-center text-sm sm:text-base"
              >
                🎤 Голосовой ассистент
              </Link>

              <Link
                href="/assistant"
                className="w-full mt-3 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-all text-center block text-sm sm:text-base"
              >
                Записаться на приём
              </Link>
            </div>
          </div>

          {/* Правая колонка - Записи */}
          <div className="lg:col-span-2">
            <div className="cyber-card p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-cyan-400">
                📋 Мои записи ({appointments.length})
              </h2>

              {appointments.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">📭</p>
                  <p className="text-sm sm:text-base text-gray-400 mb-4">У вас пока нет записей</p>
                  <Link href="/assistant" className="neon-button px-4 sm:px-6 py-2 inline-block text-sm sm:text-base">
                    Записаться на приём
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {appointments.map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
                </div>
              )}
            </div>

            {/* История консультаций */}
            {consultations.length > 0 && (
              <div className="cyber-card p-4 sm:p-6 mt-4 sm:mt-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-purple-400">
                  💬 История консультаций ({consultations.length})
                </h2>

                <div className="space-y-3 sm:space-y-4">
                  {consultations.map((consultation) => (
                    <div
                      key={consultation.id}
                      className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                        <p className="text-xs sm:text-sm text-gray-400">
                          {new Date(consultation.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {consultation.severityLevel && (
                          <span
                            className={`px-2 py-1 rounded-full text-xs self-start ${
                              consultation.severityLevel === 'emergency'
                                ? 'bg-red-500/20 text-red-400'
                                : consultation.severityLevel === 'high'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}
                          >
                            {consultation.severityLevel}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm mb-2">
                        <strong>Симптомы:</strong> {consultation.symptoms}
                      </p>

                      {consultation.recommendedSpecialty && (
                        <p className="text-xs sm:text-sm text-cyan-400">
                          <strong>Рекомендация:</strong> {consultation.recommendedSpecialty}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loyalty Points */}
            <div className="cyber-card p-4 sm:p-6 mt-4 sm:mt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-yellow-400">🎁 Программа Лояльности</h2>
              <LoyaltyPoints />
            </div>

            {/* Medical Records */}
            <div className="cyber-card p-4 sm:p-6 mt-4 sm:mt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-green-400">📋 Мои Медицинские Карты</h2>
              <PatientMedicalRecords />
            </div>

            {/* Reviews */}
            <div className="cyber-card p-4 sm:p-6 mt-4 sm:mt-6">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-pink-400">⭐ Оставить Отзыв</h2>
              <PatientReviews />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
