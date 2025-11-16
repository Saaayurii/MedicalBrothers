import redis from './redis';

// Cache TTL in seconds
const CACHE_TTL = {
  DOCTORS_LIST: 300, // 5 minutes
  DOCTOR_DETAIL: 600, // 10 minutes
  SCHEDULES: 300, // 5 minutes
  TIME_SLOTS: 180, // 3 minutes
  CLINIC_INFO: 3600, // 1 hour
  APPOINTMENTS: 60, // 1 minute
  REVIEWS_STATS: 300, // 5 minutes
};

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

/**
 * Generic cache get function
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (!redis) return null;
    const cached = await redis.get(key);
    if (!cached || typeof cached !== 'string') return null;
    return JSON.parse(cached) as T;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Generic cache set function
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  try {
    if (!redis) return;
    const ttl = options.ttl || 300; // Default 5 minutes
    await redis.setex(key, ttl, JSON.stringify(value));

    // Store tags for cache invalidation
    if (options.tags && options.tags.length > 0) {
      for (const tag of options.tags) {
        await redis.sadd(`tag:${tag}`, key);
      }
    }
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
  }
}

/**
 * Delete cache by key
 */
export async function cacheDelete(key: string): Promise<void> {
  try {
    if (!redis) return;
    await redis.del(key);
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
  }
}

/**
 * Invalidate cache by tag
 */
export async function cacheInvalidateByTag(tag: string): Promise<void> {
  try {
    if (!redis) return;
    const keys = await redis.smembers(`tag:${tag}`);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
      await redis.del(`tag:${tag}`);
    }
  } catch (error) {
    console.error(`Cache invalidate by tag error for tag ${tag}:`, error);
  }
}

/**
 * Wrapper for cached database queries
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, fetch from database
  const data = await fetchFn();

  // Store in cache
  await cacheSet(key, data, options);

  return data;
}

// Specific cache functions for common use cases

/**
 * Cache doctors list
 */
export async function cacheDoctorsList(specialty?: string) {
  const key = specialty ? `doctors:list:${specialty}` : 'doctors:list:all';
  return { key, ttl: CACHE_TTL.DOCTORS_LIST, tags: ['doctors'] };
}

/**
 * Cache doctor detail
 */
export async function cacheDoctorDetail(doctorId: number) {
  return {
    key: `doctor:${doctorId}`,
    ttl: CACHE_TTL.DOCTOR_DETAIL,
    tags: ['doctors', `doctor:${doctorId}`],
  };
}

/**
 * Cache doctor schedules
 */
export async function cacheDoctorSchedules(doctorId: number) {
  return {
    key: `doctor:${doctorId}:schedules`,
    ttl: CACHE_TTL.SCHEDULES,
    tags: ['schedules', `doctor:${doctorId}`],
  };
}

/**
 * Cache time slots
 */
export async function cacheTimeSlots(doctorId: number, date: string) {
  return {
    key: `doctor:${doctorId}:slots:${date}`,
    ttl: CACHE_TTL.TIME_SLOTS,
    tags: ['time_slots', `doctor:${doctorId}`],
  };
}

/**
 * Cache clinic info
 */
export async function cacheClinicInfo(category?: string) {
  const key = category ? `clinic:info:${category}` : 'clinic:info:all';
  return { key, ttl: CACHE_TTL.CLINIC_INFO, tags: ['clinic_info'] };
}

/**
 * Cache appointments for a patient
 */
export async function cachePatientAppointments(patientId: number) {
  return {
    key: `patient:${patientId}:appointments`,
    ttl: CACHE_TTL.APPOINTMENTS,
    tags: ['appointments', `patient:${patientId}`],
  };
}

/**
 * Cache review statistics for a doctor
 */
export async function cacheReviewStats(doctorId: number) {
  return {
    key: `doctor:${doctorId}:review_stats`,
    ttl: CACHE_TTL.REVIEWS_STATS,
    tags: ['reviews', `doctor:${doctorId}`],
  };
}

/**
 * Invalidate all doctor-related caches
 */
export async function invalidateDoctorCache(doctorId: number): Promise<void> {
  await cacheInvalidateByTag(`doctor:${doctorId}`);
  await cacheInvalidateByTag('doctors');
}

/**
 * Invalidate all appointment-related caches
 */
export async function invalidateAppointmentCache(
  patientId?: number,
  doctorId?: number
): Promise<void> {
  await cacheInvalidateByTag('appointments');
  if (patientId) {
    await cacheInvalidateByTag(`patient:${patientId}`);
  }
  if (doctorId) {
    await cacheInvalidateByTag(`doctor:${doctorId}`);
  }
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  try {
    if (!redis) return;
    await redis.flushdb();
  } catch (error) {
    console.error('Clear all cache error:', error);
  }
}
