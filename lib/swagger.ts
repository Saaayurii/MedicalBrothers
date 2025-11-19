import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'MedicalBrothers API Documentation',
        version: '1.0.0',
        description: `
# MedicalBrothers API

Comprehensive API documentation for the MedicalBrothers medical voice assistant platform.

## Features

- 🏥 **Patient Management**: Register patients, manage profiles, book appointments
- 👨‍⚕️ **Doctor Management**: Doctor profiles, schedules, and availability
- 📅 **Appointment System**: Book, update, and manage appointments
- 🤖 **AI Consultations**: Voice-based medical consultations with AI
- 🚨 **Emergency Calls**: Handle emergency medical requests
- 📊 **Analytics & Reports**: Revenue tracking, doctor performance, audit logs
- 🔐 **Authentication**: Secure login for admins, doctors, and patients
- 🔔 **Push Notifications**: Real-time notifications for appointments and updates

## Authentication

Most endpoints require authentication using session cookies.

Admin endpoints require:
- Role: \`super_admin\`, \`admin\`, \`doctor\`, \`registrar\`, or \`nurse\`
- Valid session token

Patient endpoints require:
- Valid patient session token

## Rate Limiting

API requests are rate-limited to prevent abuse:
- Standard endpoints: 100 requests per minute
- Authentication endpoints: 10 requests per minute
        `,
        contact: {
          name: 'MedicalBrothers Support',
          url: 'https://github.com/Saaayurii/MedicalBrothers',
          email: 'support@medicalbrothers.ru',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server',
        },
        {
          url: 'https://medicalbrothers.vercel.app',
          description: 'Production server',
        },
      ],
      tags: [
        {
          name: 'Authentication',
          description: 'Admin and patient authentication endpoints (register, login, logout)',
        },
        {
          name: 'Patients',
          description: 'Patient management operations',
        },
        {
          name: 'Doctors',
          description: 'Doctor profiles, schedules, and online status',
        },
        {
          name: 'Appointments',
          description: 'Appointment booking and management',
        },
        {
          name: 'AI & Voice',
          description: 'AI chat consultations and voice processing (STT, TTS)',
        },
        {
          name: 'Medical Records',
          description: 'Electronic Health Records (EHR) - diagnoses, prescriptions, lab results',
        },
        {
          name: 'Lab Orders',
          description: 'Laboratory test ordering and result management',
        },
        {
          name: 'Reviews',
          description: 'Doctor reviews and ratings system',
        },
        {
          name: 'Loyalty',
          description: 'Loyalty points program and rewards',
        },
        {
          name: 'Reminders',
          description: 'Appointment reminders via email, SMS, and push',
        },
        {
          name: 'Payments',
          description: 'Payment processing (Stripe, YooKassa) and webhooks',
        },
        {
          name: 'Push Notifications',
          description: 'Web Push API subscription and notification delivery',
        },
        {
          name: 'Notifications',
          description: 'Real-time notification streaming (Server-Sent Events)',
        },
        {
          name: 'Analytics',
          description: 'System metrics, reports, and vital statistics',
        },
        {
          name: 'System',
          description: 'Health checks, file uploads, CSRF tokens, and cron jobs',
        },
        {
          name: 'Admin',
          description: 'Admin-only operations',
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'session',
            description: 'Session cookie for authentication',
          },
        },
        schemas: {
          Patient: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              dateOfBirth: { type: 'string', format: 'date' },
              address: { type: 'string', nullable: true },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Doctor: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              specialty: { type: 'string' },
              experienceYears: { type: 'integer' },
              bio: { type: 'string', nullable: true },
              isActive: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Appointment: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              patientId: { type: 'integer' },
              doctorId: { type: 'integer' },
              appointmentDate: { type: 'string', format: 'date' },
              appointmentTime: { type: 'string', format: 'time' },
              status: {
                type: 'string',
                enum: ['scheduled', 'confirmed', 'completed', 'cancelled'],
              },
              symptoms: { type: 'string', nullable: true },
              notes: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Error: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          Success: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: { type: 'object' },
            },
          },
          MedicalRecord: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              patientId: { type: 'integer' },
              doctorId: { type: 'integer', nullable: true },
              appointmentId: { type: 'integer', nullable: true },
              recordType: {
                type: 'string',
                enum: ['diagnosis', 'prescription', 'lab_result', 'imaging', 'note'],
              },
              title: { type: 'string' },
              description: { type: 'string' },
              diagnosis: { type: 'string', nullable: true },
              prescription: { type: 'string', nullable: true },
              labResults: { type: 'string', nullable: true },
              attachments: { type: 'array', items: { type: 'string' }, nullable: true },
              isConfidential: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          LabOrder: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              patientId: { type: 'integer' },
              doctorId: { type: 'integer' },
              testName: { type: 'string' },
              testCode: { type: 'string', nullable: true },
              priority: {
                type: 'string',
                enum: ['routine', 'urgent', 'stat'],
                default: 'routine',
              },
              status: {
                type: 'string',
                enum: ['pending', 'processing', 'completed', 'failed'],
                default: 'pending',
              },
              instructions: { type: 'string', nullable: true },
              results: { type: 'string', nullable: true },
              resultFiles: { type: 'array', items: { type: 'string' }, nullable: true },
              orderedAt: { type: 'string', format: 'date-time' },
              completedAt: { type: 'string', format: 'date-time', nullable: true },
            },
          },
          Review: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              doctorId: { type: 'integer' },
              patientId: { type: 'integer' },
              appointmentId: { type: 'integer', nullable: true },
              rating: { type: 'integer', minimum: 1, maximum: 5 },
              comment: { type: 'string', nullable: true },
              isVerified: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          LoyaltyPoints: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              patientId: { type: 'integer' },
              totalPoints: { type: 'integer' },
              availablePoints: { type: 'integer' },
              tier: {
                type: 'string',
                enum: ['bronze', 'silver', 'gold', 'platinum'],
                default: 'bronze',
              },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          PointsTransaction: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              loyaltyPointsId: { type: 'integer' },
              points: { type: 'integer' },
              type: {
                type: 'string',
                enum: ['earned', 'redeemed', 'expired', 'adjusted'],
              },
              reason: { type: 'string' },
              referenceType: { type: 'string', nullable: true },
              referenceId: { type: 'integer', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Reminder: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              appointmentId: { type: 'integer' },
              type: {
                type: 'string',
                enum: ['email', 'sms', 'push'],
              },
              scheduledFor: { type: 'string', format: 'date-time' },
              status: {
                type: 'string',
                enum: ['pending', 'sent', 'failed'],
                default: 'pending',
              },
              sentAt: { type: 'string', format: 'date-time', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          Payment: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              amount: { type: 'number' },
              currency: { type: 'string', enum: ['RUB', 'USD'] },
              status: {
                type: 'string',
                enum: ['pending', 'succeeded', 'failed', 'canceled'],
              },
              provider: { type: 'string', enum: ['stripe', 'yookassa'] },
              paymentUrl: { type: 'string', nullable: true },
              metadata: { type: 'object' },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
          AIMessage: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['user', 'assistant', 'system'] },
              content: { type: 'string' },
            },
          },
          AIResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              metadata: {
                type: 'object',
                properties: {
                  symptoms: { type: 'array', items: { type: 'string' } },
                  recommendedSpecialty: { type: 'string', nullable: true },
                  severity: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] },
                  appointmentSuggested: { type: 'boolean' },
                },
              },
            },
          },
          HealthCheck: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              version: { type: 'string' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'string', enum: ['up', 'down'] },
                  redis: { type: 'string', enum: ['up', 'down'] },
                },
              },
            },
          },
          PushSubscription: {
            type: 'object',
            properties: {
              endpoint: { type: 'string' },
              keys: {
                type: 'object',
                properties: {
                  p256dh: { type: 'string' },
                  auth: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          Unauthorized: {
            description: 'Unauthorized - Authentication required',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  success: false,
                  error: 'Unauthorized',
                  message: 'Authentication required',
                },
              },
            },
          },
          Forbidden: {
            description: 'Forbidden - Insufficient permissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  success: false,
                  error: 'Forbidden',
                  message: 'Insufficient permissions',
                },
              },
            },
          },
          NotFound: {
            description: 'Resource not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  success: false,
                  error: 'Not Found',
                  message: 'Resource not found',
                },
              },
            },
          },
          BadRequest: {
            description: 'Bad Request - Invalid input',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  success: false,
                  error: 'Bad Request',
                  message: 'Invalid input data',
                },
              },
            },
          },
          InternalServerError: {
            description: 'Internal Server Error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: {
                  success: false,
                  error: 'Internal Server Error',
                  message: 'An unexpected error occurred',
                },
              },
            },
          },
        },
      },
      security: [
        {
          cookieAuth: [],
        },
      ],
    },
  });

  return spec;
};
