import redis from './redis';

// In-memory fallback for when Redis is unavailable
const inMemoryStatus = new Map<string, number>();

const ONLINE_TTL = 60; // 60 seconds - user considered offline if no heartbeat

export async function setDoctorOnline(doctorId: number): Promise<void> {
  const key = `doctor:online:${doctorId}`;

  try {
    if (redis) {
      await redis.setex(key, ONLINE_TTL, Date.now().toString());
    } else {
      inMemoryStatus.set(key, Date.now());
    }
  } catch (error) {
    console.error('Error setting doctor online status:', error);
    // Fallback to in-memory
    inMemoryStatus.set(key, Date.now());
  }
}

export async function isDoctorOnline(doctorId: number): Promise<boolean> {
  const key = `doctor:online:${doctorId}`;

  try {
    if (redis) {
      const status = await redis.get(key);
      return status !== null;
    } else {
      const lastSeen = inMemoryStatus.get(key);
      if (!lastSeen) return false;

      // Check if timestamp is within TTL
      const isOnline = Date.now() - lastSeen < ONLINE_TTL * 1000;

      // Clean up old entries
      if (!isOnline) {
        inMemoryStatus.delete(key);
      }

      return isOnline;
    }
  } catch (error) {
    console.error('Error checking doctor online status:', error);

    // Fallback to in-memory
    const lastSeen = inMemoryStatus.get(key);
    if (!lastSeen) return false;

    const isOnline = Date.now() - lastSeen < ONLINE_TTL * 1000;
    if (!isOnline) inMemoryStatus.delete(key);

    return isOnline;
  }
}

export async function getOnlineDoctors(doctorIds: number[]): Promise<number[]> {
  const onlineStatuses = await Promise.all(
    doctorIds.map(async (id) => ({
      id,
      isOnline: await isDoctorOnline(id),
    }))
  );

  return onlineStatuses.filter((d) => d.isOnline).map((d) => d.id);
}

// Cleanup old in-memory entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamp] of inMemoryStatus.entries()) {
      if (now - timestamp > ONLINE_TTL * 1000) {
        inMemoryStatus.delete(key);
      }
    }
  }, 30000); // Clean every 30 seconds
}
