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

const postStatusProperty = {
  type: 'string',
  enum: ['draft', 'scheduled', 'published', 'cancelled'],
  default: 'draft',
};

const postCreateMultipart = {
  type: 'object',
  required: ['title'],
  properties: {
    title: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string' },
    scheduledAt: { type: 'string', format: 'date-time' },
    status: postStatusProperty,
    attachmentUrl: { type: 'string', format: 'uri' },
    video: { type: 'string', format: 'binary', description: 'Max 50 MB' },
  },
};

const postUpdateMultipart = {
  type: 'object',
  properties: { ...postCreateMultipart.properties, accountId: { type: 'string' } },
};

const postCreateBody = {
  required: true,
  content: {
    'application/json': { schema: { $ref: '#/components/schemas/PostCreateInput' } },
    'multipart/form-data': { schema: postCreateMultipart },
  },
};

const postUpdateBody = {
  required: true,
  content: {
    'application/json': { schema: { $ref: '#/components/schemas/PostUpdateInput' } },
    'multipart/form-data': { schema: postUpdateMultipart },
  },
};

const unauthorized = errorRes('Token tidak valid atau kadaluarsa');
const notFound = errorRes('Not found');
const validationError = errorRes('Body tidak valid');
const tooManyRequests = errorRes('Terlalu banyak permintaan (10 / 15 menit per IP)');

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'BITS Social Manager API',
    version: '1.0.0',
    description:
      'REST API untuk mengelola project dan akun media sosial. ' +
      'Semua endpoint kecuali Auth, callback OAuth Google (`/api/integrations/google/callback`), ' +
      'dan Health memerlukan header `Authorization: Bearer <token>`. ' +
      'Data selalu di-scope ke user pemilik token.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth', description: 'Registrasi, login, logout' },
    { name: 'Profile', description: 'Profil user' },
    { name: 'Projects', description: 'Kelola project' },
    { name: 'Accounts', description: 'Kelola akun media sosial' },
    { name: 'Posts', description: 'Content plan: post per akun sosial + video Google Drive' },
    { name: 'Drive', description: 'Koneksi Google Drive per user (OAuth, scope drive.file)' },
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
          driveFolderId: {
            type: 'string',
            nullable: true,
            description: 'Subfolder Google Drive akun (dibuat lazy saat upload pertama)',
          },
          scheduledPosts: {
            type: 'integer',
            description: 'Jumlah post berstatus scheduled (list endpoint)',
          },
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
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          userId: { type: 'string' },
          accountId: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          scheduledAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'null = belum dijadwalkan',
          },
          status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'cancelled'] },
          driveFileId: { type: 'string', nullable: true },
          attachmentName: { type: 'string', nullable: true, description: 'Nama file asli' },
          attachmentUrl: {
            type: 'string',
            nullable: true,
            description: 'Link Drive (webViewLink) atau tautan eksternal',
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          account: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              projectId: { type: 'string' },
              platform: { type: 'string', enum: [...platforms] },
              accountName: { type: 'string' },
              projectName: { type: 'string' },
            },
            required: ['id', 'projectId', 'platform', 'accountName'],
          },
        },
        required: ['id', 'userId', 'accountId', 'title', 'status', 'createdAt', 'updatedAt'],
      },
      PostCreateInput: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 5000, nullable: true },
          scheduledAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Wajib jika status = scheduled',
          },
          status: postStatusProperty,
          attachmentUrl: { type: 'string', format: 'uri', nullable: true },
        },
        required: ['title'],
      },
      PostUpdateInput: {
        type: 'object',
        description: 'Semua field opsional — kirim yang mau diubah.',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 5000, nullable: true },
          scheduledAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            description: 'Wajib jika status berubah menjadi scheduled dan belum ada tanggal',
          },
          status: { type: 'string', enum: ['draft', 'scheduled', 'published', 'cancelled'] },
          attachmentUrl: { type: 'string', format: 'uri', nullable: true },
          accountId: { type: 'string', description: 'Pindah post ke akun sosial lain' },
        },
      },
      DriveConnection: {
        type: 'object',
        properties: {
          googleEmail: { type: 'string', format: 'email' },
          connectedAt: { type: 'string', format: 'date-time' },
          rootFolderId: { type: 'string', nullable: true },
        },
        required: ['googleEmail', 'connectedAt'],
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
          '429': tooManyRequests,
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
          '429': tooManyRequests,
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
          '404': notFound,
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
          '400': errorRes('Body tidak valid / password lama salah'),
          '401': unauthorized,
          '404': notFound,
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
    '/api/drive': {
      get: {
        tags: ['Drive'],
        summary: 'Status koneksi Google Drive user',
        description: 'Satu koneksi per user aplikasi (bukan per akun sosial).',
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: {
              connection: {
                oneOf: [{ $ref: '#/components/schemas/DriveConnection' }, { type: 'null' }],
              },
            },
            required: ['connection'],
          }),
          '401': unauthorized,
        },
      },
      delete: {
        tags: ['Drive'],
        summary: 'Putuskan koneksi Google Drive (token dicabut, file tetap di Drive user)',
        responses: {
          '200': okRes('Terputus', { $ref: '#/components/schemas/Success' }),
          '401': unauthorized,
        },
      },
    },
    '/api/drive/connect': {
      post: {
        tags: ['Drive'],
        summary: 'Buat URL consent Google OAuth',
        description:
          '`state` = JWT anti-CSRF berumur 10 menit. Redirect URI wajib terdaftar di Google Cloud Console.',
        responses: {
          '200': okRes('URL consent', {
            type: 'object',
            properties: { url: { type: 'string', format: 'uri' } },
            required: ['url'],
          }),
          '401': unauthorized,
          '503': errorRes('Kredensial OAuth Google belum dikonfigurasi di server'),
        },
      },
    },
    '/api/integrations/google/callback': {
      get: {
        tags: ['Drive'],
        summary: 'Callback OAuth Google (publik)',
        description:
          'Menukar code dengan token (disimpan terenkripsi), membuat folder root "BITS Social Manager", lalu redirect ke /profile?drive=connected.',
        security: [],
        parameters: [
          { name: 'code', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'state', in: 'query', required: false, schema: { type: 'string' } },
          { name: 'error', in: 'query', required: false, schema: { type: 'string' } },
        ],
        responses: {
          '302': {
            description: 'Redirect ke /profile?drive=connected atau /profile?drive=error&reason=…',
          },
        },
      },
    },
    '/api/posts': {
      get: {
        tags: ['Posts'],
        summary: 'Semua post user (lintas akun, untuk halaman Content)',
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: {
              posts: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
            },
            required: ['posts'],
          }),
          '401': unauthorized,
        },
      },
    },
    '/api/accounts/{accountId}/posts': {
      parameters: [
        {
          name: 'accountId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID akun sosial',
        },
      ],
      get: {
        tags: ['Posts'],
        summary: 'Daftar post satu akun',
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: {
              posts: { type: 'array', items: { $ref: '#/components/schemas/Post' } },
            },
            required: ['posts'],
          }),
          '401': unauthorized,
          '404': notFound,
        },
      },
      post: {
        tags: ['Posts'],
        summary: 'Buat post — JSON atau multipart dengan video',
        description:
          'Multipart: field `video` (maks 50 MB) diunggah ke subfolder Drive akun, dibuat lazy saat upload pertama. File di-share `anyone/reader` agar iframe preview dapat diputar. Jika video dikirim, Google Drive wajib terhubung.',
        requestBody: postCreateBody,
        responses: {
          '201': okRes('Dibuat', {
            type: 'object',
            properties: { post: { $ref: '#/components/schemas/Post' } },
            required: ['post'],
          }),
          '400': validationError,
          '401': unauthorized,
          '404': notFound,
          '409': errorRes('Google Drive belum terhubung / koneksi kedaluwarsa'),
          '413': errorRes('Video melebihi 50 MB'),
          '502': errorRes('Operasi Google Drive gagal'),
        },
      },
    },
    '/api/accounts/{accountId}/posts/{postId}': {
      parameters: [
        {
          name: 'accountId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID akun sosial',
        },
        {
          name: 'postId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'ID post',
        },
      ],
      get: {
        tags: ['Posts'],
        summary: 'Detail post',
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: { post: { $ref: '#/components/schemas/Post' } },
            required: ['post'],
          }),
          '401': unauthorized,
          '404': notFound,
        },
      },
      put: {
        tags: ['Posts'],
        summary: 'Ubah post — ganti video / pindah akun / ubah metadata',
        description:
          'Semua field opsional. Video baru pada fileId yang sama = replace konten (link & permission tetap); fallback upload baru jika file 404. Mengubah `accountId` memindahkan file antar subfolder Drive.',
        requestBody: postUpdateBody,
        responses: {
          '200': okRes('Berhasil', {
            type: 'object',
            properties: { post: { $ref: '#/components/schemas/Post' } },
            required: ['post'],
          }),
          '400': validationError,
          '401': unauthorized,
          '404': notFound,
          '409': errorRes('Google Drive belum terhubung / koneksi kedaluwarsa'),
          '413': errorRes('Video melebihi 50 MB'),
          '502': errorRes('Operasi Google Drive gagal'),
        },
      },
      delete: {
        tags: ['Posts'],
        summary: 'Hapus post (video TIDAK dihapus dari Google Drive)',
        description: 'File video tetap tersimpan di Drive user sebagai arsip.',
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
