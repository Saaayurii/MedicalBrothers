/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize HTML content - escape dangerous characters
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return '';

  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w.@+-]/g, '');
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return '';

  return phone.replace(/[^\d+()-\s]/g, '').trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as T[keyof T];
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === 'string'
          ? sanitizeString(item)
          : typeof item === 'object' && item !== null
          ? sanitizeObject(item)
          : item
      ) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize file name
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return '';

  return fileName
    .replace(/[^\w.-]/g, '_') // Replace special chars with underscore
    .replace(/\.{2,}/g, '.') // Remove multiple dots
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255); // Limit length
}

/**
 * Remove SQL injection patterns
 */
export function removeSqlInjection(input: string): string {
  if (typeof input !== 'string') return '';

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/gi,
    /(--|#|\/\*|\*\/)/g,
    /('|")\s*(OR|AND)\s*('|")\s*=\s*('|")/gi,
  ];

  let sanitized = input;
  sqlPatterns.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, '');
  });

  return sanitized.trim();
}

/**
 * Validate URL
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
}
