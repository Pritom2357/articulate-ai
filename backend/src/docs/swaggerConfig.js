const path = require('path');

const swaggerJsdocOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Auth Template API',
      version: '1.0.0',
      description: 'Reusable Node.js authentication & user management template.'
    },
    servers: [
      { url: 'http://localhost:8000', description: 'Local Dev' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Add access token: Bearer <token>'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            gender: { type: 'string' },
            date_of_birth: { type: 'string', format: 'date' },
            role: { type: 'string' },
            is_active: { type: 'boolean' },
            profile_photo: { type: 'string' },
            mic_verified: { type: 'boolean' },
            mic_quality_score: { type: 'integer' },
            guide_preference: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        AuthLoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' }
          }
        },
        AuthLoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password', 'phone'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' },
            phone: { type: 'string' },
            gender: { type: 'string' },
            date_of_birth: { type: 'string', format: 'date' }
          }
        },
        BasicSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        },
        PasswordChangeRequest: {
          type: 'object',
          required: ['oldPassword', 'newPassword'],
          properties: {
            oldPassword: { type: 'string', format: 'password' },
            newPassword: { type: 'string', format: 'password' }
          }
        },
        UserUpdateRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            gender: { type: 'string' },
            date_of_birth: { type: 'string', format: 'date' },
            guide_preference: { type: 'string' }
          }
        },
        AvatarUploadResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            profile_photo: { type: 'string' }
          }
        }
      }
    },
    security: [
      { BearerAuth: [] }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & tokens' },
      { name: 'User', description: 'User profile & settings' }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

module.exports = {
  swaggerJsdocOptions
};