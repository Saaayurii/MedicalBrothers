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
          description: 'Admin and patient authentication endpoints',
        },
        {
          name: 'Patients',
          description: 'Patient management operations',
        },
        {
          name: 'Doctors',
          description: 'Doctor profiles and schedules',
        },
        {
          name: 'Appointments',
          description: 'Appointment booking and management',
        },
        {
          name: 'Consultations',
          description: 'AI-powered medical consultations',
        },
        {
          name: 'Emergency',
          description: 'Emergency call handling',
        },
        {
          name: 'Push Notifications',
          description: 'Push notification subscription management',
        },
        {
          name: 'Analytics',
          description: 'Reports and analytics',
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
