import { Suspense } from 'react';
import { query } from '@/lib/db';
import AppointmentsList from '@/components/admin/AppointmentsList';
import DoctorsList from '@/components/admin/DoctorsList';
import EmergencyCalls from '@/components/admin/EmergencyCalls';
import Statistics from '@/components/admin/Statistics';

export const dynamic = 'force-dynamic';

async function getAdminData() {
  try {
    const [appointments, doctors, emergencies, stats] = await Promise.all([
      query(`
        SELECT a.*, d.name as doctor_name, d.specialty, p.name as patient_name, p.phone
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN patients p ON a.patient_id = p.id
        WHERE a.appointment_date >= CURRENT_DATE
        ORDER BY a.appointment_date, a.appointment_time
        LIMIT 20
      `),
      query('SELECT * FROM doctors ORDER BY name'),
      query(`
        SELECT * FROM emergency_calls
        WHERE status != 'completed'
        ORDER BY created_at DESC
        LIMIT 10
      `),
      query(`
        SELECT
          (SELECT COUNT(*) FROM appointments WHERE appointment_date = CURRENT_DATE) as today_appointments,
          (SELECT COUNT(*) FROM doctors WHERE is_active = true) as active_doctors,
          (SELECT COUNT(*) FROM consultations WHERE DATE(created_at) = CURRENT_DATE) as today_consultations,
          (SELECT COUNT(*) FROM emergency_calls WHERE status = 'pending') as pending_emergencies
      `),
    ]);

    return {
      appointments: appointments.rows,
      doctors: doctors.rows,
      emergencies: emergencies.rows,
      stats: stats.rows[0],
    };
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return {
      appointments: [],
      doctors: [],
      emergencies: [],
      stats: { today_appointments: 0, active_doctors: 0, today_consultations: 0, pending_emergencies: 0 },
    };
  }
}

export default async function AdminPage() {
  const data = await getAdminData();

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="cyber-card p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-600">
                Админ-панель
              </h1>
              <p className="text-gray-400 mt-2">Управление клиникой MedicalBrothers</p>
            </div>
            <a
              href="/"
              className="neon-button"
            >
              ← Назад на главную
            </a>
          </div>
        </div>

        {/* Statistics */}
        <Suspense fallback={<div className="cyber-card p-6 animate-pulse">Загрузка статистики...</div>}>
          <Statistics stats={data.stats} />
        </Suspense>

        {/* Emergency Calls */}
        {data.emergencies.length > 0 && (
          <Suspense fallback={<div className="cyber-card p-6 animate-pulse">Загрузка вызовов...</div>}>
            <EmergencyCalls emergencies={data.emergencies} />
          </Suspense>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointments */}
          <Suspense fallback={<div className="cyber-card p-6 animate-pulse">Загрузка записей...</div>}>
            <AppointmentsList appointments={data.appointments} />
          </Suspense>

          {/* Doctors */}
          <Suspense fallback={<div className="cyber-card p-6 animate-pulse">Загрузка врачей...</div>}>
            <DoctorsList doctors={data.doctors} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
