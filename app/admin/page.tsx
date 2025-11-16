import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import AppointmentsList from '@/components/admin/AppointmentsList';
import DoctorsList from '@/components/admin/DoctorsList';
import EmergencyCalls from '@/components/admin/EmergencyCalls';
import Statistics from '@/components/admin/Statistics';
import RecentConsultations from '@/components/admin/RecentConsultations';
import QuickActions from '@/components/admin/QuickActions';
import AdminHeader from '@/components/admin/AdminHeader';

async function getAdminData() {
  noStore(); // Disable caching for this page
  await connection(); // Access request data before using new Date()

  // Return mock data during build or when DB is unavailable
  const mockData = {
    appointments: [],
    doctors: [],
    emergencies: [],
    consultations: [],
    stats: {
      today_appointments: 0,
      active_doctors: 0,
      today_consultations: 0,
      pending_emergencies: 0,
      total_patients: 0,
      this_week_appointments: 0,
    },
  };

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [appointments, doctors, emergencies, consultations, stats] = await Promise.all([
      // Get upcoming appointments with relations
      prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: today,
          },
        },
        include: {
          doctor: true,
          patient: true,
        },
        orderBy: [
          { appointmentDate: 'asc' },
          { appointmentTime: 'asc' },
        ],
        take: 20,
      }),

      // Get all active doctors
      prisma.doctor.findMany({
        where: {
          isActive: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),

      // Get pending emergency calls
      prisma.emergencyCall.findMany({
        where: {
          status: {
            not: 'completed',
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      // Get recent consultations
      prisma.consultation.findMany({
        include: {
          patient: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),

      // Get statistics
      Promise.all([
        prisma.appointment.count({
          where: {
            appointmentDate: today,
          },
        }),
        prisma.doctor.count({
          where: {
            isActive: true,
          },
        }),
        prisma.consultation.count({
          where: {
            createdAt: {
              gte: today,
            },
          },
        }),
        prisma.emergencyCall.count({
          where: {
            status: 'pending',
          },
        }),
        prisma.patient.count(),
        prisma.appointment.count({
          where: {
            appointmentDate: {
              gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]).then(([todayAppointments, activeDoctors, todayConsultations, pendingEmergencies, totalPatients, weekAppointments]) => ({
        today_appointments: todayAppointments,
        active_doctors: activeDoctors,
        today_consultations: todayConsultations,
        pending_emergencies: pendingEmergencies,
        total_patients: totalPatients,
        this_week_appointments: weekAppointments,
      })),
    ]);

    return {
      appointments,
      doctors,
      emergencies,
      consultations,
      stats,
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
    <div className="space-y-8">
      {/* Statistics */}
      <Statistics stats={data.stats} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Emergency Calls */}
      {data.emergencies.length > 0 && <EmergencyCalls emergencies={data.emergencies} />}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointments */}
        <AppointmentsList appointments={data.appointments} />

        {/* Doctors */}
        <DoctorsList doctors={data.doctors} />
      </div>

      {/* Recent Consultations */}
      <RecentConsultations consultations={data.consultations} />
    </div>
  );
}

export default async function AdminPage() {
  // Проверяем авторизацию
  const session = await getSession();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <AdminHeader username={session.username} role={session.role} />

      <div className="max-w-7xl mx-auto p-4 md:p-8">

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
