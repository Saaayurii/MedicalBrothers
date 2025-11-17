import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { requirePatientAuth } from '@/lib/patient-auth';
import prisma from '@/lib/prisma';
import TwoFactorSetup from '@/components/TwoFactorSetup';

async function getPatientData(patientId: number) {
  await connection();

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      name: true,
      email: true,
      twoFactorEnabled: true,
    },
  });

  return patient;
}

export default async function PatientSecuritySettingsPage() {
  const session = await requirePatientAuth();
  const patient = await getPatientData(session.id);

  if (!patient) {
    redirect('/patient/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Security Settings</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Account Information</h2>
          <div className="bg-white p-4 rounded-lg shadow">
            <p>
              <strong>Name:</strong> {patient.name}
            </p>
            <p>
              <strong>Email:</strong> {patient.email}
            </p>
          </div>
        </div>

        <TwoFactorSetup userType="patient" isEnabled={patient.twoFactorEnabled} />
      </div>
    </div>
  );
}
