import { getSession } from './auth';
import { getPatientSession } from './patient-auth';

export interface UnifiedUser {
  id: string;
  name: string;
  type: 'patient' | 'admin' | 'doctor';
  email: string;
}

/**
 * Get current user session from either patient or admin/doctor
 * Returns null if no session found
 */
export async function getCurrentUser(): Promise<UnifiedUser | null> {
  // Try patient session first
  const patientSession = await getPatientSession();
  if (patientSession) {
    return {
      id: `patient-${patientSession.id}`,
      name: patientSession.name,
      type: 'patient',
      email: patientSession.email,
    };
  }

  // Try admin/doctor session
  const adminSession = await getSession();
  if (adminSession) {
    return {
      id: `admin-${adminSession.adminId}`,
      name: adminSession.username,
      type: adminSession.doctorId ? 'doctor' : 'admin',
      email: adminSession.email,
    };
  }

  return null;
}

/**
 * Require authentication from either patient or admin/doctor
 * Throws error if no session found
 */
export async function requireAnyAuth(): Promise<UnifiedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
