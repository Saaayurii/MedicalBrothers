import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import TwoFactorSetup from '@/components/TwoFactorSetup';

async function getAdminData(adminId: number) {
  await connection();

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      twoFactorEnabled: true,
    },
  });

  return admin;
}

export default async function AdminSecuritySettingsPage() {
  const session = await requireAuth();
  const admin = await getAdminData(session.adminId);

  if (!admin) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Security Settings</h1>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Account Information</h2>
          <div className="bg-white p-4 rounded-lg shadow">
            <p>
              <strong>Username:</strong> {admin.username}
            </p>
            <p>
              <strong>Full Name:</strong> {admin.fullName}
            </p>
            <p>
              <strong>Email:</strong> {admin.email}
            </p>
          </div>
        </div>

        <TwoFactorSetup userType="admin" isEnabled={admin.twoFactorEnabled} />

        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Security Tips</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>Enable two-factor authentication for better account protection</li>
            <li>Use a strong, unique password</li>
            <li>Never share your backup codes</li>
            <li>Keep your authenticator app up to date</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
