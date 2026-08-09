# API Documentation - Social Manager

Complete API reference for all endpoints.

## Base URL

- **Local Development**: `http://localhost:8787/api`
- **Production**: `https://social.bits.co.id/api`

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens expire after **7 days**. Client stores token in `localStorage`; logout clears client token only. XSS hardening required.

---

## Endpoints

**Error format:** all errors return JSON shape `{ "error": "message" }` unless noted.

### Health Check

#### `GET /api/health`

Check API status. Does **not** require authentication.

**Response:**
```json
{
  "status": "ok",
  "ts": 1723006633027
}
```

---

## Authentication Endpoints

### Register User

#### `POST /api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation:**
- `name`: 2-100 characters, trimmed
- `email`: Valid email format, lowercased, unique
- `password`: 8-128 characters

**Response (201 Created):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
```json
// 400 Bad Request (validation)
{
  "error": "Invalid email format"
}

// 409 Conflict
{
  "error": "Email already registered"
}
```

**Rate Limit:** 10 requests per 15 minutes per IP

---

### Login

#### `POST /api/auth/login`

Authenticate a user and get a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
```json
// 401 Unauthorized (generic — avoids user enumeration)
{
  "error": "Invalid credentials"
}

// 429 Too Many Requests
{
  "error": "Too many requests"
}
```

**Rate Limit:** 10 requests per 15 minutes per IP

---

### Logout

#### `POST /api/auth/logout`

Clears client token only. Server session not stored. Does **not** require valid token.

**Response (200 OK):**
```json
{
  "success": true
}
```

---

## Profile Endpoints

### Get Profile

#### `GET /api/profile`

Get the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Update Profile

#### `PUT /api/profile`

Update the user's name, email, or password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Rules:**
- All fields optional
- To change password: must provide both `currentPassword` and `newPassword`
- To change email: must be a unique, valid email
- `newPassword`: minimum 8 characters

**Response (200 OK):**
```json
{
  "user": {
    "id": "abc123",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

---

## Projects Endpoints

### List Projects

#### `GET /api/projects`

Get all projects owned by the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "projects": [
    {
      "id": "proj123",
      "userId": "abc123",
      "name": "Banten IT Solutions",
      "description": "Social accounts for Banten IT",
      "createdAt": 1723006633027,
      "updatedAt": 1723006633027
    }
  ]
}
```

---

### Create Project

#### `POST /api/projects`

Create a new project.

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Optional description"
}
```

**Validation:**
- `name`: 1-200 characters, required
- `description`: 0-1000 characters, optional

**Response (201 Created):**
```json
{
  "project": {
    "id": "proj789",
    "userId": "abc123",
    "name": "New Project",
    "description": "Optional description",
    "createdAt": 1723006633027,
    "updatedAt": 1723006633027
  }
}
```

---

### Update Project

#### `PUT /api/projects/:id`

Update an existing project.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "project": {
    "id": "proj789",
    "userId": "abc123",
    "name": "Updated Name",
    "description": "Updated description",
    "createdAt": 1723006633027,
    "updatedAt": 1723006645000
  }
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "error": "Project not found"
}

// 404 Not Found (not owned by user)
{
  "error": "Not found"
}
```

---

### Delete Project

#### `DELETE /api/projects/:id`

Delete a project and all of its associated social accounts.

**Response (200 OK):**
```json
{
  "success": true
}
```

**Note:** Cascade-deletes all `social_accounts` rows under this project.

---

## Social Accounts Endpoints

### List Social Accounts

#### `GET /api/accounts?projectId=<id>`

Get all social accounts for an owned project. Passwords are **never** returned in the list; `passwordEncrypted` is stripped.

**Query Parameters:**
- `projectId`: Project ID. Omitting it returns accounts across all of the user's projects.

**Response (200 OK):**
```json
{
  "accounts": [
    {
      "id": "acc123",
      "projectId": "proj789",
      "platform": "Gmail",
      "accountName": "work@company.com",
      "emailHandle": "work@company.com",
      "notes": "Main work email",
      "createdAt": 1723006633027,
      "updatedAt": 1723006633027
    }
  ]
}
```

---

### Get Social Account (decrypt password)

#### `GET /api/accounts/:id`

Fetch a single account. On success the stored password is **decrypted and returned** in the `password` field. This is the endpoint used by the "reveal password" feature.

**Response (200 OK):**
```json
{
  "account": {
    "id": "acc123",
    "projectId": "proj789",
    "platform": "Gmail",
    "accountName": "work@company.com",
    "emailHandle": "work@company.com",
    "password": "PlainTextPassword123!",
    "notes": "Main work email",
    "createdAt": 1783006633027,
    "updatedAt": 1783006633027
  }
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "error": "Not found"
}
```

---

### Create Social Account

#### `POST /api/accounts`

Add a new social account to a project.

**Request Body:**
```json
{
  "projectId": "proj789",
  "platform": "Gmail",
  "accountName": "work@company.com",
  "emailHandle": "work@company.com",
  "password": "PlainTextPassword123!",
  "notes": "Optional notes"
}
```

**Supported Platforms:**
- Gmail
- YouTube
- Facebook
- Instagram
- Threads
- WhatsApp
- Telegram
- TikTok
- Shopee
- X
- LinkedIn
- GitHub

**Validation:**
- `projectId`: Must reference a project owned by the user
- `platform`: Must be one of the supported platforms
- `accountName`: 1-200 characters, trimmed
- `emailHandle`: 1-500 characters, trimmed
- `password`: 1-1000 characters (encrypted with AES-256-GCM before storage)
- `notes`: 0-2000 characters, optional

**Response (201 Created):** The created account (without `passwordEncrypted`).

---

### Update Social Account

#### `PUT /api/accounts/:id`

Update an existing social account.

**Request Body:**
```json
{
  "platform": "Gmail",
  "accountName": "updated@company.com",
  "emailHandle": "updated@company.com",
  "password": "NewPassword456!",
  "notes": "Updated notes"
}
```

**Rules:**
- All fields optional
- Provide `password` to re-encrypt a new password
- `projectId` changes are validated but currently ignored

**Response (200 OK):** The updated account (without `passwordEncrypted`).

---

### Delete Social Account

#### `DELETE /api/accounts/:id`

Delete a social account.

**Response (200 OK):**
```json
{
  "success": true
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "error": "Not found"
}
```

---

## Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `POST /api/auth/register` | 10 requests / 15 min / IP |
| `POST /api/auth/login` | 10 requests / 15 min / IP |
| All other endpoints | No limit |

When rate-limited the API returns HTTP `429` with `Retry-After` header (seconds until retry) and body `{ "error": "Too many requests" }`.

---

## Example cURL Commands

### Register
```bash
curl -X POST https://social.bits.co.id/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123!"}'
```

### Login
```bash
curl -X POST https://social.bits.co.id/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'
```

### Create Project
```bash
curl -X POST https://social.bits.co.id/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"Banten IT Solutions","description":"Social accounts"}'
```

### Create Social Account
```bash
curl -X POST https://social.bits.co.id/api/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId":"proj123",
    "platform":"Gmail",
    "accountName":"work@company.com",
    "emailHandle":"work@company.com",
    "password":"MyPassword123!",
    "notes":"Work email"
  }'
```

### Get Account (decrypt password)
```bash
curl https://social.bits.co.id/api/accounts/acc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## TypeScript Types

All API types live in `src/client/lib/types.ts`:

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: number;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface SocialAccount {
  id: string;
  projectId: string;
  platform: Platform;
  accountName: string;
  emailHandle: string;
  notes?: string | null;
  password?: string; // only returned on GET /:id
  createdAt: number;
  updatedAt: number;
}

export const PLATFORMS = [
  'Gmail', 'YouTube', 'Facebook', 'Instagram', 'Threads',
  'WhatsApp', 'Telegram', 'TikTok', 'Shopee', 'X', 'LinkedIn', 'GitHub',
] as const;
```

---

**Questions?** Check inline code documentation in `src/worker/routes/` for implementation details.
