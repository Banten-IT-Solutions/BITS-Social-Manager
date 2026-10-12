// Hand-written OpenAPI spec (not generated from Zod).
// ponytail: regenerating from Zod schemas only worth it when routes churn often;
// upgrade path = @hono/zod-openapi route rewrite.
const platforms = [
  'Gmail',
  'YouTube',
  'Facebook',
  'Instagram',
  'Threads',
  'WhatsApp',
  'Telegram',
  'TikTok',
  'Shopee',
  'X',
  'LinkedIn',
  'GitHub',
] as const;

const bearerAuth = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'Token dari /api/auth/login atau /api/auth/register',
} as const;

const jsonBody = (schema: object) => ({
  required: true,
  content: { 'application/json': { schema } },
});

const jsonResponse = (description: string, schema?: object) => ({
  description,
  ...(schema ? { content: { 'application/json': { schema } } } : {}),
});

const errorRes = (description: string) =>
  jsonResponse(description, { $ref: '#/components/schemas/Error' });

const okRes = (description: string, schema: object) => jsonResponse(description, schema);

const unauthorized = errorRes('Token tidak valid atau kadaluarsa');
const notFound = errorRes('Not found');
const validationError = errorRes('Body tidak valid');

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'BITS Social Manager API',
    version: '1.0.0',
    description:
      'REST API untuk mengelola project dan akun media sosial. ' +
      'Semua endpoint kecuali Auth dan Health memerlukan header `Authorization: Bearer <token>`. ' +
      'Data selalu di-scope ke user pemilik token.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth', description: 'Registrasi, login, logout' },
    { name: 'Profile', description: 'Profil user' },
    { name: 'Projects', description: 'Kelola project' },
    { name: 'Accounts', description: 'Kelola akun media sosial' },
    { name: 'Health', description: 'Cek status API' },
  ],
  components: {
    securitySchemes: { bearerAuth },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
        required: ['error'],
      },
      Success: {
        type: 'object',
        properties: { success: { type: 'boolean', example: true } },
        required: ['success'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '3f9c2a1b8d4e4f6091a2c3d4e5f60718' },
          name: { type: 'string', example: 'Budi' },
          email: { type: 'string', format: 'email', example: 'budi@example.com' },
        },
        required: ['id', 'name', 'email'],
      },
      UserWithDates: {
        allOf: [
          { $ref: '#/components/schemas/User' },
          {
            type: 'object',
            properties: {
              createdAt: { type: 'string', format: 'date-time' },
            },
            required: ['createdAt'],
          },
        ],
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', description: 'JWT, kirim sebagai Bearer token' },
          user: { $ref: '#/components/schemas/User' },
        },
        required: ['token', 'user'],
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'a1b2c3d4e5f60718293a4b5c6d7e8f90' },
          userId: { type: 'string' },
          name: { type: 'string', example: 'Klien Toko A' },
          description: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'userId', 'name', 'createdAt', 'updatedAt'],
      },
      Account: {
        type: 'object',
        description: 'Password tidak pernah dikembalikan di list — lihat GET /api/accounts/{id}',
        properties: {
          id: { type: 'string' },
          projectId: { type: 'string' },
          platform: { type: 'string', enum: [...platforms] },
          accountName: { type: 'string' },
          emailHandle: { type: 'string', description: 'Email atau username akun' },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'projectId',
          'platform',
          'accountName',
          'emailHandle',
          'createdAt',
          'updatedAt',
        ],
      },
      AccountWithPassword: {
        allOf: [
          { $ref: '#/components/schemas/Account' },
          {
            type: 'object',
            properties: { password: { type: 'string', description: 'Sudah didekripsi' } },
            required: ['password'],
          },
        ],
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrasi user baru',
        description: 'Rate limit 10 request / 15 menit.',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8, maxLength: 128 },
          },
          required: ['name', 'email', 'password'],
        }),
        responses: {
          '201': okRes('Berhasil, langsung login', { $ref: '#/components/schemas/AuthResponse' }),
          '400': validationError,
          '409': errorRes('Email sudah terdaftar'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Rate limit 10 request / 15 menit.',
        security: [],
        requestBody: jsonBody({
          type: 'object',
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
          },
          required: ['email', 'password'],
        }),
        responses: {
          '200': okRes('Berhasil', { $ref: '#/components/schemas/AuthResponse' }),
          '400': validationError,
          '401': errorRes('Kredensial salah'),
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout (no-op, token dihapus di sisi client)',
        security: [],
        responses: { '200': okRes('Berhasil', { $ref: '#/components/schemas/Success' }) },
      },
    },
    '/api/profile': {
      get: {
        tags: ['Profile'],
        summary: 'Profil user saat ini',
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/UserWithDates' } },
            required: ['user'],
          }),
          '401': unauthorized,
        },
      },
      put: {
        tags: ['Profile'],
        summary: 'Ubah profil / ganti password',
        requestBody: jsonBody({
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' },
            currentPassword: { type: 'string', description: 'Wajib jika mengganti password' },
            newPassword: { type: 'string', minLength: 8, maxLength: 128 },
          },
        }),
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: { user: { $ref: '#/components/schemas/User' } },
            required: ['user'],
          }),
          '400': validationError,
          '401': unauthorized,
          '409': errorRes('Email sudah dipakai user lain'),
        },
      },
    },
    '/api/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Daftar project milik user',
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: {
              projects: { type: 'array', items: { $ref: '#/components/schemas/Project' } },
            },
            required: ['projects'],
          }),
          '401': unauthorized,
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Buat project',
        requestBody: jsonBody({
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 200 },
            description: { type: 'string', maxLength: 1000 },
          },
          required: ['name'],
        }),
        responses: {
          '201': okRes('Dibuat', {
            type: 'object',
            properties: { project: { $ref: '#/components/schemas/Project' } },
            required: ['project'],
          }),
          '400': validationError,
          '401': unauthorized,
        },
      },
    },
    '/api/projects/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID project',
        },
      ],
      get: {
        tags: ['Projects'],
        summary: 'Detail project',
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: { project: { $ref: '#/components/schemas/Project' } },
            required: ['project'],
          }),
          '401': unauthorized,
          '404': notFound,
        },
      },
      put: {
        tags: ['Projects'],
        summary: 'Ubah project',
        requestBody: jsonBody({
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 200 },
            description: { type: 'string', maxLength: 1000 },
          },
        }),
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: { project: { $ref: '#/components/schemas/Project' } },
            required: ['project'],
          }),
          '400': validationError,
          '401': unauthorized,
          '404': notFound,
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Hapus project (beserta semua akun di dalamnya)',
        responses: {
          '200': okRes('Terhapus', { $ref: '#/components/schemas/Success' }),
          '401': unauthorized,
          '404': notFound,
        },
      },
    },
    '/api/accounts': {
      get: {
        tags: ['Accounts'],
        summary: 'Daftar akun',
        description:
          'Tanpa query: semua akun dari semua project user. Dengan `projectId`: akun project tsb.',
        parameters: [
          {
            name: 'projectId',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'Filter per project',
          },
        ],
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: {
              accounts: { type: 'array', items: { $ref: '#/components/schemas/Account' } },
            },
            required: ['accounts'],
          }),
          '401': unauthorized,
          '404': errorRes('Project tidak ditemukan / bukan milik user'),
        },
      },
      post: {
        tags: ['Accounts'],
        summary: 'Buat akun (password dienkripsi di sisi server)',
        requestBody: jsonBody({
          type: 'object',
          properties: {
            projectId: { type: 'string' },
            platform: { type: 'string', enum: [...platforms] },
            accountName: { type: 'string', minLength: 1, maxLength: 200 },
            emailHandle: { type: 'string', maxLength: 500 },
            password: { type: 'string', maxLength: 1000 },
            notes: { type: 'string', maxLength: 2000 },
          },
          required: ['projectId', 'platform', 'accountName', 'emailHandle', 'password'],
        }),
        responses: {
          '201': okRes('Dibuat', {
            type: 'object',
            properties: { account: { $ref: '#/components/schemas/Account' } },
            required: ['account'],
          }),
          '400': validationError,
          '401': unauthorized,
          '404': errorRes('Project tidak ditemukan'),
        },
      },
    },
    '/api/accounts/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID akun',
        },
      ],
      get: {
        tags: ['Accounts'],
        summary: 'Detail akun dengan password terdekripsi (reveal)',
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: { account: { $ref: '#/components/schemas/AccountWithPassword' } },
            required: ['account'],
          }),
          '401': unauthorized,
          '404': notFound,
          '422': errorRes('Password tersimpan tidak bisa didekripsi (key berubah / data korup)'),
        },
      },
      put: {
        tags: ['Accounts'],
        summary: 'Ubah akun (field opsional, kirim yang mau diubah)',
        requestBody: jsonBody({
          type: 'object',
          properties: {
            platform: { type: 'string', enum: [...platforms] },
            accountName: { type: 'string', minLength: 1, maxLength: 200 },
            emailHandle: { type: 'string', maxLength: 500 },
            password: {
              type: 'string',
              maxLength: 1000,
              description: 'Dienkripsi ulang jika dikirim',
            },
            notes: { type: 'string', maxLength: 2000 },
            projectId: { type: 'string', description: 'Diterima tapi belum diproses server' },
          },
        }),
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: { account: { $ref: '#/components/schemas/Account' } },
            required: ['account'],
          }),
          '400': validationError,
          '401': unauthorized,
          '404': notFound,
        },
      },
      delete: {
        tags: ['Accounts'],
        summary: 'Hapus akun',
        responses: {
          '200': okRes('Terhapus', { $ref: '#/components/schemas/Success' }),
          '401': unauthorized,
          '404': notFound,
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        security: [],
        responses: {
          '200': okRes('OK', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              ts: { type: 'integer', description: 'Unix epoch ms' },
            },
            required: ['status', 'ts'],
          }),
        },
      },
    },
  },
};
