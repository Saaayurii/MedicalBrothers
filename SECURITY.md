# Security Features

This document outlines the security measures implemented in MedicalBrothers.

## 🔒 Authentication & Authorization

### Session Management
- **HTTP-only cookies** for session storage
- **7-day session expiration** with automatic cleanup
- **Secure cookies** in production (HTTPS only)
- **SameSite=Lax** protection against CSRF

### Role-Based Access Control (RBAC)
- **5 distinct roles**: super_admin, admin, doctor, registrar, nurse
- **25+ granular permissions** for fine-grained access control
- **Permission checking** at both route and function level
- **Doctor-specific filtering** for appointments and patients

## 🛡️ Security Headers

All responses include comprehensive security headers:

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [comprehensive CSP policy]
```

### Content Security Policy (CSP)
- **Restricted script sources** to prevent XSS
- **No inline scripts** without unsafe-inline (to be removed in production)
- **No object/embed tags** to prevent plugin-based attacks
- **Upgrade insecure requests** to HTTPS
- **Frame ancestors restricted** to same origin

## 🚨 Rate Limiting

Powered by Upstash Redis, with different limits for different endpoints:

### Authentication Endpoints
- **5 requests per 15 minutes** for login attempts
- **3 requests per hour** for password reset
- Automatic lockout on exceeded limits

### API Endpoints
- **100 requests per minute** for general API calls
- **500 requests per minute** for admin actions

### Implementation
```typescript
import { checkRateLimit, authRateLimit } from '@/lib/rate-limit';

const result = await checkRateLimit(identifier, authRateLimit);
if (!result.success) {
  // Rate limit exceeded - deny request
}
```

## 📊 Audit Logging

Complete audit trail of all administrative actions:

### Logged Events
- User login/logout
- Create/Update/Delete operations
- Status changes
- Permission checks
- Failed login attempts

### Stored Information
- **Admin ID** and username
- **Action type** and entity
- **IP address** and user agent
- **Timestamp** with timezone
- **Additional details** in JSON format

### Viewing Audit Logs
Admin users can view audit logs at `/admin/audit-logs` with filtering capabilities.

## 🔍 Intrusion Detection

### Suspicious Activity Monitoring
Automatically detects and logs:
- **Failed login attempts** (wrong username/password)
- **Rate limit violations**
- **SQL injection attempts**
- **XSS (Cross-Site Scripting) attempts**
- **Unauthorized access** to protected routes

### Input Validation
```typescript
import { validateFormData, detectSQLInjection, detectXSS } from '@/lib/security';

const { isValid, errors, sanitized } = validateFormData(formData);
if (!isValid) {
  // Handle validation errors and log suspicious activity
}
```

### Patterns Detected
- SQL keywords: SELECT, INSERT, UPDATE, DELETE, DROP, UNION
- XSS patterns: `<script>`, `javascript:`, event handlers
- Special characters: quotes, semicolons, SQL comments

## 🔐 Password Security

### Password Storage
- **bcrypt** hashing with 10 rounds
- **Salted hashes** for each password
- No plain-text passwords stored

### Password Requirements
Enforced at application level:
- Minimum 6 characters (should be increased to 12+ in production)
- Strong passwords recommended via UI hints

## 🌐 Network Security

### HTTPS Enforcement
- **HSTS header** with 2-year max-age
- **Upgrade insecure requests** via CSP
- **Secure cookies** only in production

### CORS Configuration
- **Same-origin policy** by default
- Trusted origins validated for API requests

## 📝 Data Protection

### Personal Data
- **GDPR-compliant** data handling
- Patient data encrypted at rest (via database)
- Minimal data collection principle

### Data Sanitization
All user inputs are sanitized before storage:
```typescript
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    // ... more sanitization
}
```

## 🚀 Best Practices

### For Developers
1. **Never commit secrets** - use environment variables
2. **Validate all inputs** - server-side validation is mandatory
3. **Use prepared statements** - Prisma ORM prevents SQL injection
4. **Test security features** - include security tests in CI/CD
5. **Keep dependencies updated** - `npm audit` regularly

### For Administrators
1. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
2. **Enable MFA** (to be implemented)
3. **Review audit logs** regularly
4. **Monitor failed login attempts**
5. **Rotate credentials** periodically

### For Production Deployment
1. **Enable HTTPS** (obtain SSL certificate)
2. **Set NODE_ENV=production**
3. **Configure Upstash Redis** for rate limiting
4. **Set secure SMTP** credentials
5. **Configure firewall** rules
6. **Enable database backups**
7. **Set up monitoring** and alerts

## 🔧 Configuration

### Environment Variables (Security)
```bash
# Required for rate limiting
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Application URL (for CORS and CSP)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Set to production for secure cookies
NODE_ENV=production
```

## 📞 Reporting Security Issues

If you discover a security vulnerability, please email: security@medicalbrothers.ru

**Do not** create public GitHub issues for security vulnerabilities.

## 🔄 Updates

Security features are continuously improved. Check this document for updates and best practices.

Last updated: 2025-01-16
