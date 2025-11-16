import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { query } from '@/lib/db';
import AppointmentsList from '@/components/admin/AppointmentsList';
import DoctorsList from '@/components/admin/DoctorsList';
import EmergencyCalls from '@/components/admin/EmergencyCalls';
import Statistics from '@/components/admin/Statistics';

async function getAdminData() {
  noStore(); // Disable caching for this page

  // Return mock data during build or when DB is unavailable
  const mockData = {
    appointments: [],
    doctors: [],
    emergencies: [],
    stats: {
      today_appointments: 0,
      active_doctors: 0,
      today_consultations: 0,
      pending_emergencies: 0
    },
  };

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
      stats: stats.rows[0] || mockData.stats,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching admin data:', error);
    }
    return mockData;
  }
}

// Async Server Component that fetches data
async function AdminContent() {
  const data = await getAdminData();

  return (
    <>
      {/* Statistics */}
      <Statistics stats={data.stats} />

      {/* Emergency Calls */}
      {data.emergencies.length > 0 && <EmergencyCalls emergencies={data.emergencies} />}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointments */}
        <AppointmentsList appointments={data.appointments} />

        {/* Doctors */}
        <DoctorsList doctors={data.doctors} />
      </div>
    </>
  );
}

export default function AdminPage() {
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

        {/* All data fetching wrapped in Suspense */}
        <Suspense
          fallback={
            <div className="space-y-8">
              <div className="cyber-card p-6 animate-pulse">Загрузка данных...</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="cyber-card p-6 animate-pulse">Загрузка записей...</div>
                <div className="cyber-card p-6 animate-pulse">Загрузка врачей...</div>
              </div>
            </div>
          }
        >
          <AdminContent />
        </Suspense>
      </div>
    </main>
  );
}
