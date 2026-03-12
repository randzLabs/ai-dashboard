# ⚡ AI Dashboard Platform — Complete Development Guide
> **Stack:** Next.js 14 · Node.js + Express · PostgreSQL + pgvector · Redis · BullMQ · OpenAI  
> **Timeline:** 6 Bulan · 7 Phase · 30+ Tasks · 150+ Subtasks

---

## 📊 Progress Overview

| Phase | Label | Duration | KPI Target |
|-------|-------|----------|------------|
| Phase 0 | Setup & Persiapan | Minggu 1–2 | Semua dev bisa run project < 5 menit |
| Phase 1 | MVP — Auth & Dashboard | Bulan 1 | 10 beta user bisa login & chat AI dummy |
| Phase 2 | AI Real Integration | Bulan 2–2.5 | AI < 5s, 0 data leakage, cache hit > 30% |
| Phase 3 | Reports & Notifications | Bulan 3 | PDF < 30s, email digest tepat waktu |
| Phase 4 | SaaS & Multi-Tenant | Bulan 4 | 5 paying orgs, 3 API integrations aktif |
| Phase 5 | Optimization & Security | Bulan 5 | API p95 < 2s, 0 OWASP critical, Lighthouse > 85 |
| Phase 6 | Growth & Go-to-Market | Bulan 6 | 80 paying orgs, NPS > 30, Product Hunt launch |

---

# ⚙️ PHASE 0 — Setup & Persiapan
> **Durasi:** Minggu 1–2  
> **KPI:** Semua developer bisa run project dalam < 5 menit setelah clone repo

---

## Task 0.1 — Initialize Repository & Branching

### Subtasks
- [ ] Buat GitHub repository
- [ ] Setup branching: main, develop, feature/*
- [ ] Buat .gitignore yang lengkap
- [ ] Setup GitHub branch protection rules (require PR review untuk main)
- [ ] Buat README.md dengan setup instructions

### Commands

```bash
# 1. Buat repo di GitHub, lalu clone
git clone https://github.com/yourorg/ai-dashboard.git
cd ai-dashboard

# 2. Setup branching strategy
git checkout -b develop
git push -u origin develop

# Branch naming convention:
# main        → production (auto-deploy ke prod)
# develop     → staging (auto-deploy ke staging)
# feature/*   → fitur baru (misal: feature/auth-system)
# fix/*        → bug fix
# hotfix/*    → critical fix ke production

# 3. Setup .gitignore
cat >> .gitignore << 'EOF'
node_modules/
.env
.env.local
.env.production
dist/
.next/
coverage/
*.log
EOF
```

---

## Task 0.2 — Setup Frontend — Next.js 14

### Subtasks
- [ ] Jalankan create-next-app dengan TypeScript + Tailwind
- [ ] Install semua dependency (axios, react-hook-form, recharts, dll)
- [ ] Buat folder structure: app/, components/, lib/, hooks/, types/
- [ ] Setup Prettier config
- [ ] Test: `npm run dev` berjalan di localhost:3000

### Commands

```bash
# Di root folder, buat folder frontend
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd frontend

# Install dependencies tambahan
npm install axios react-hook-form zod @hookform/resolvers \
  recharts lucide-react date-fns react-hot-toast \
  @tanstack/react-query next-intl zustand

npm install -D @types/node prettier eslint-config-prettier
```

### Folder Structure

```
frontend/src/
├── app/
│   ├── (auth)/           # Login, Register pages
│   ├── (dashboard)/      # Protected dashboard routes
│   └── (marketing)/      # Landing page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── charts/           # Chart components
│   └── layouts/          # Layout components
├── lib/
│   ├── api.ts            # Axios client + interceptors
│   └── utils.ts          # Helper functions
├── hooks/                # Custom React hooks
├── stores/               # Zustand state management
└── types/                # TypeScript interfaces
```

---

## Task 0.3 — Setup Backend — Express + TypeScript

### Subtasks
- [ ] Init Node.js project dengan TypeScript
- [ ] Install semua dependencies (express, prisma, redis, bullmq, dll)
- [ ] Setup tsconfig.json
- [ ] Init Prisma dengan PostgreSQL datasource
- [ ] Buat folder structure lengkap
- [ ] Test: `ts-node-dev src/app.ts` berjalan di port 4000

### Commands

```bash
mkdir backend && cd backend
npm init -y

# Core dependencies
npm install express cors helmet morgan dotenv bcryptjs jsonwebtoken \
  @prisma/client redis bullmq nodemailer resend \
  zod express-rate-limit opossum prom-client

# Dev dependencies
npm install -D typescript @types/node @types/express @types/cors \
  @types/bcryptjs @types/jsonwebtoken @types/morgan \
  ts-node ts-node-dev prisma jest @types/jest ts-jest supertest

# Setup TypeScript
npx tsc --init

# Setup Prisma
npx prisma init --datasource-provider postgresql
```

### Folder Structure

```
backend/src/
├── controllers/          # Request handlers
├── routes/               # Express routers
├── services/
│   ├── ai/               # AI service layer (provider abstraction)
│   └── email/            # Email service (Resend)
├── middleware/           # Auth, rate limit, validation
├── models/               # Prisma client wrapper
├── utils/                # Helpers, constants, logger
├── jobs/                 # BullMQ job processors
├── config/               # Config & env validation
└── app.ts                # Express app entry point
```

---

## Task 0.4 — Setup Database — Prisma Schema

### Subtasks
- [ ] Tulis schema: Organization, User, UserSession, DataSource, BusinessData
- [ ] Tulis schema AI: AiConversation, AiMessage, AiInsight, Report
- [ ] Tulis schema security: AuditLog, Notification, ApiKey
- [ ] Jalankan: `npx prisma migrate dev --name init`
- [ ] Jalankan: `npx prisma generate`
- [ ] Seed database dengan data dummy untuk development

### Prisma Schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model Organization {
  id                   String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name                 String    @db.VarChar(255)
  industry             String?   @db.VarChar(100)
  plan                 String    @default("starter") @db.VarChar(50)
  tokenBudgetMonthly   Int       @default(10000)  @map("token_budget_monthly")
  tokensUsedThisMonth  Int       @default(0)       @map("tokens_used_this_month")
  timezone             String    @default("Asia/Jakarta") @db.VarChar(50)
  billingEmail         String?   @db.VarChar(255)  @map("billing_email")
  createdAt            DateTime  @default(now())   @map("created_at")
  updatedAt            DateTime  @updatedAt        @map("updated_at")
  deletedAt            DateTime?                   @map("deleted_at")
  users                User[]
  dataSources          DataSource[]
  businessData         BusinessData[]
  aiConversations      AiConversation[]
  aiInsights           AiInsight[]
  reports              Report[]
  apiKeys              ApiKey[]
  notifications        Notification[]
  @@map("organizations")
}

model User {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String    @db.Uuid   @map("organization_id")
  name             String    @db.VarChar(255)
  email            String    @unique    @db.VarChar(255)
  passwordHash     String               @map("password_hash")
  role             String    @default("viewer") @db.VarChar(50)
  emailVerified    Boolean   @default(false)    @map("email_verified")
  twoFactorEnabled Boolean   @default(false)    @map("two_factor_enabled")
  lastLoginAt      DateTime?                    @map("last_login_at")
  referralCode     String?   @unique            @map("referral_code")
  referredBy       String?   @db.Uuid           @map("referred_by")
  createdAt        DateTime  @default(now())    @map("created_at")
  updatedAt        DateTime  @updatedAt         @map("updated_at")
  deletedAt        DateTime?                    @map("deleted_at")
  organization     Organization @relation(fields: [organizationId], references: [id])
  sessions         UserSession[]
  conversations    AiConversation[]
  @@map("users")
}

model UserSession {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId           String    @db.Uuid   @map("user_id")
  refreshTokenHash String               @map("refresh_token_hash")
  ipAddress        String               @map("ip_address")
  userAgent        String?              @map("user_agent")
  expiresAt        DateTime             @map("expires_at")
  revokedAt        DateTime?            @map("revoked_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  user             User @relation(fields: [userId], references: [id])
  @@map("user_sessions")
}

model BusinessData {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String    @db.Uuid   @map("organization_id")
  dataType         String    @db.VarChar(100) @map("data_type")
  dataPayload      Json                 @map("data_payload")
  validationStatus String    @default("valid") @map("validation_status")
  recordedAt       DateTime             @map("recorded_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  deletedAt        DateTime?            @map("deleted_at")
  organization     Organization @relation(fields: [organizationId], references: [id])
  @@index([organizationId, dataType])
  @@index([recordedAt])
  @@map("business_data")
}

model AiConversation {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String    @db.Uuid @map("organization_id")
  userId         String    @db.Uuid @map("user_id")
  title          String?   @db.VarChar(255)
  totalTokens    Int       @default(0) @map("total_tokens_used")
  createdAt      DateTime  @default(now()) @map("created_at")
  deletedAt      DateTime? @map("deleted_at")
  messages       AiMessage[]
  organization   Organization @relation(fields: [organizationId], references: [id])
  user           User         @relation(fields: [userId], references: [id])
  @@map("ai_conversations")
}

model AiMessage {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  conversationId String    @db.Uuid @map("conversation_id")
  role           String    @db.VarChar(20)
  content        String
  tokensUsed     Int?      @map("tokens_used")
  modelUsed      String?   @db.VarChar(100) @map("model_used")
  responseTimeMs Int?      @map("response_time_ms")
  isFallback     Boolean   @default(false) @map("is_fallback")
  createdAt      DateTime  @default(now()) @map("created_at")
  conversation   AiConversation @relation(fields: [conversationId], references: [id])
  @@index([conversationId])
  @@map("ai_messages")
}

model AiInsight {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String    @db.Uuid @map("organization_id")
  title          String    @db.VarChar(255)
  description    String
  insightType    String    @db.VarChar(100) @map("insight_type")
  confidence     String    @default("medium") @db.VarChar(20)
  isDismissed    Boolean   @default(false) @map("is_dismissed")
  periodStart    DateTime? @map("period_start")
  periodEnd      DateTime? @map("period_end")
  createdAt      DateTime  @default(now()) @map("created_at")
  organization   Organization @relation(fields: [organizationId], references: [id])
  @@map("ai_insights")
}

model Report {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String    @db.Uuid @map("organization_id")
  title          String    @db.VarChar(255)
  reportType     String    @db.VarChar(100) @map("report_type")
  reportContent  String?   @map("report_content")
  fileUrl        String?   @map("file_url")
  status         String    @default("pending") @db.VarChar(50)
  generatedBy    String    @db.Uuid @map("generated_by")
  periodStart    DateTime? @map("period_start")
  periodEnd      DateTime? @map("period_end")
  createdAt      DateTime  @default(now()) @map("created_at")
  deletedAt      DateTime? @map("deleted_at")
  organization   Organization @relation(fields: [organizationId], references: [id])
  @@map("reports")
}

model AuditLog {
  id             BigInt    @id @default(autoincrement())
  organizationId String?   @db.Uuid @map("organization_id")
  userId         String?   @db.Uuid @map("user_id")
  action         String    @db.VarChar(100)
  tableName      String    @db.VarChar(100) @map("table_name")
  recordId       String?   @db.Uuid @map("record_id")
  oldValues      Json?     @map("old_values")
  newValues      Json?     @map("new_values")
  ipAddress      String?   @map("ip_address")
  userAgent      String?   @map("user_agent")
  createdAt      DateTime  @default(now()) @map("created_at")
  @@index([organizationId, createdAt])
  @@index([action])
  @@map("audit_logs")
}

model Notification {
  id             String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String    @db.Uuid @map("user_id")
  organizationId String    @db.Uuid @map("organization_id")
  type           String    @db.VarChar(100)
  title          String    @db.VarChar(255)
  body           String
  actionUrl      String?   @map("action_url")
  isRead         Boolean   @default(false) @map("is_read")
  createdAt      DateTime  @default(now()) @map("created_at")
  organization   Organization @relation(fields: [organizationId], references: [id])
  @@index([userId, isRead])
  @@map("notifications")
}

model ApiKey {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId   String    @db.Uuid @map("organization_id")
  name             String    @db.VarChar(255)
  keyHash          String    @unique @map("key_hash")
  keyPrefix        String    @db.VarChar(10) @map("key_prefix")
  status           String    @default("active") @db.VarChar(50)
  rateLimitPerHour Int       @default(100) @map("rate_limit_per_hour")
  expiresAt        DateTime? @map("expires_at")
  lastUsedAt       DateTime? @map("last_used_at")
  totalRequests    BigInt    @default(0) @map("total_requests")
  permissions      Json      @default("{}")
  createdBy        String    @db.Uuid @map("created_by")
  createdAt        DateTime  @default(now()) @map("created_at")
  revokedAt        DateTime? @map("revoked_at")
  organization     Organization @relation(fields: [organizationId], references: [id])
  @@map("api_keys")
}
```

```bash
# Jalankan migration
npx prisma migrate dev --name init
npx prisma generate

# Seed data dummy
npx prisma db seed
```

---

## Task 0.5 — Docker Compose — Local Development

### Subtasks
- [ ] Buat `docker-compose.yml` dengan postgres (pgvector) + redis
- [ ] Buat `.env.example` untuk semua environment variables
- [ ] Buat `.env` untuk development (jangan commit ke git!)
- [ ] Jalankan: `docker-compose up -d`
- [ ] Test koneksi database dari backend

### docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    container_name: ai_dashboard_db
    environment:
      POSTGRES_DB: ai_dashboard_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: ai_dashboard_redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### .env.example

```env
# Database
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/ai_dashboard_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (min 64 karakter, random)
JWT_SECRET="your-super-secret-jwt-key-min-64-characters-here-use-random-generator"
JWT_REFRESH_SECRET="your-refresh-secret-min-64-characters-here-also-random"

# AI Providers
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# Email
RESEND_API_KEY="re_..."

# Storage (Cloudflare R2)
R2_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
R2_ACCESS_KEY="..."
R2_SECRET_KEY="..."
R2_BUCKET="ai-dashboard-reports"
R2_PUBLIC_URL="https://reports.yourdomain.com"

# Billing
MIDTRANS_SERVER_KEY="Mid-server-..."
MIDTRANS_CLIENT_KEY="Mid-client-..."

# App
NODE_ENV="development"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

```bash
# Jalankan
docker-compose up -d

# Verifikasi
docker-compose ps
# Semua service status: Up
```

---

## Task 0.6 — CI/CD — GitHub Actions

### Subtasks
- [ ] Buat `.github/workflows/ci.yml`
- [ ] Setup GitHub Secrets: OPENAI_API_KEY, DATABASE_URL, dll
- [ ] Connect Railway ke GitHub repo (auto-deploy dari `develop`)
- [ ] Connect Vercel ke GitHub repo (auto-deploy frontend)
- [ ] Setup environment protection rules (production butuh manual approval)
- [ ] Test: push ke develop → pipeline berjalan hijau

### .github/workflows/ci.yml

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ai_dashboard_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports: ['5432:5432']
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install & Test Backend
        working-directory: ./backend
        run: |
          npm ci
          npx prisma generate
          npx prisma migrate deploy
          npm run lint
          npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/ai_dashboard_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-min-64-characters-padding-padding-padding-here

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - name: Install & Build Frontend
        working-directory: ./frontend
        run: |
          npm ci
          npm run lint
          npm run build

  deploy-staging:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway (staging)
        run: echo "Railway auto-deploy dari branch develop"

  deploy-production:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production   # Requires manual approval di GitHub
    steps:
      - name: Deploy to Production
        run: echo "Production deploy after manual approval"
```

---

# 🚀 PHASE 1 — MVP: Auth & Dashboard
> **Durasi:** Bulan 1 (4 minggu)  
> **KPI:** 10 beta user bisa login, lihat dashboard, dan chat dengan AI dummy

---

## Task 1.1 — Backend: Authentication System

### Subtasks
- [ ] Buat `AuthService`: register, login, logout, refreshToken
- [ ] Buat `AuthController` dan route `/api/v1/auth/*`
- [ ] Buat JWT middleware (`verifyToken`)
- [ ] Buat role middleware (`requireRole`)
- [ ] Implementasi reset password via email (Resend)
- [ ] Unit test untuk semua auth flows
- [ ] Test manual via Postman / Thunder Client

### auth.service.ts

```typescript
// src/services/auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../models/prisma';
import { redis } from '../config/redis';

export class AuthService {
  async register(data: {
    name: string;
    email: string;
    password: string;
    organizationName: string;
    industry?: string;
  }) {
    // 1. Cek email sudah ada
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new AppError('Email sudah terdaftar', 409);

    // 2. Buat organization
    const org = await prisma.organization.create({
      data: { name: data.organizationName, industry: data.industry }
    });

    // 3. Hash password & buat user (first user = admin)
    const hash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        name: data.name,
        email: data.email,
        passwordHash: hash,
        role: 'admin'
      }
    });

    // 4. Kirim email verifikasi
    await emailService.sendVerification(user.email, user.id);

    // 5. Audit log
    await auditLog(null, 'CREATE', 'users', user.id, null, { email: user.email });

    return { message: 'Registrasi berhasil. Cek email untuk verifikasi.' };
  }

  async login(email: string, password: string, ipAddress: string) {
    const user = await prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: { organization: true }
    });
    if (!user) throw new AppError('Email atau password salah', 401);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError('Email atau password salah', 401);

    // Generate access token (15 menit)
    const accessToken = jwt.sign(
      { userId: user.id, orgId: user.organizationId, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    // Generate refresh token (30 hari)
    const refreshToken = crypto.randomUUID();
    const refreshHash = await bcrypt.hash(refreshToken, 10);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshTokenHash: refreshHash,
        ipAddress,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, role: user.role, orgId: user.organizationId }
    };
  }

  async logout(refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await prisma.userSession.updateMany({
      where: { refreshTokenHash: hash },
      data: { revokedAt: new Date() }
    });
  }
}
```

### auth.middleware.ts

```typescript
// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { userId: string; orgId: string; role: string };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalid atau expired' });
  }
};

export const requireRole = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Akses tidak diizinkan' });
    }
    next();
  };
```

### Routes

```typescript
// src/routes/auth.routes.ts
import express from 'express';
const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', verifyToken, authController.logout);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

export default router;
```

---

## Task 1.2 — Backend: Organization & User CRUD

### Subtasks
- [ ] Buat `UserController`: list, invite, update role, soft delete
- [ ] Buat `OrganizationController`: get, update settings
- [ ] Tambahkan multi-tenant filter di **semua** query (`organizationId = req.user.orgId`)
- [ ] Audit log untuk semua perubahan user
- [ ] Validasi input dengan Zod schema
- [ ] Routes: GET/POST/PUT/DELETE `/api/v1/users`

```typescript
// src/controllers/user.controller.ts
export class UserController {
  // GET /api/v1/users — Admin only
  async listUsers(req: AuthRequest, res: Response) {
    const users = await prisma.user.findMany({
      where: {
        organizationId: req.user!.orgId,  // ← WAJIB: multi-tenant isolation
        deletedAt: null
      },
      select: { id: true, name: true, email: true, role: true, lastLoginAt: true, createdAt: true }
    });
    return res.json({ data: users });
  }

  // POST /api/v1/users/invite
  async inviteUser(req: AuthRequest, res: Response) {
    const { email, name, role } = inviteSchema.parse(req.body);

    // Cek user sudah ada di org ini
    const exists = await prisma.user.findFirst({
      where: { email, organizationId: req.user!.orgId, deletedAt: null }
    });
    if (exists) throw new AppError('User dengan email ini sudah ada', 409);

    // Buat user dengan temp password
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hash = await bcrypt.hash(tempPassword, 12);

    const user = await prisma.user.create({
      data: { organizationId: req.user!.orgId, name, email, passwordHash: hash, role }
    });

    // Kirim email invitation dengan link set-password
    await emailService.sendInvitation(email, name, req.user!.orgId);
    await auditLog(req.user!.userId, 'CREATE', 'users', user.id, null, { email, role });

    return res.status(201).json({ data: user, message: 'Undangan terkirim' });
  }

  // PUT /api/v1/users/:id/role — Admin only
  async updateRole(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { role } = req.body;

    // Pastikan user berada dalam org yang sama
    const user = await prisma.user.findFirst({
      where: { id, organizationId: req.user!.orgId, deletedAt: null }
    });
    if (!user) throw new AppError('User tidak ditemukan', 404);

    const oldRole = user.role;
    const updated = await prisma.user.update({ where: { id }, data: { role } });
    await auditLog(req.user!.userId, 'UPDATE', 'users', id, { role: oldRole }, { role });

    return res.json({ data: updated });
  }

  // DELETE /api/v1/users/:id — Soft delete
  async deleteUser(req: AuthRequest, res: Response) {
    const { id } = req.params;
    if (id === req.user!.userId) throw new AppError('Tidak bisa hapus akun sendiri', 400);

    const user = await prisma.user.findFirst({
      where: { id, organizationId: req.user!.orgId, deletedAt: null }
    });
    if (!user) throw new AppError('User tidak ditemukan', 404);

    await prisma.user.update({ where: { id }, data: { deletedAt: new Date() } });
    await auditLog(req.user!.userId, 'DELETE', 'users', id, { email: user.email }, null);

    return res.json({ message: 'User berhasil dihapus' });
  }
}
```

---

## Task 1.3 — Backend: Dashboard API + Redis Cache

### Subtasks
- [ ] Buat `DashboardController`: getStats, getCharts
- [ ] Buat `DataController`: upload, list, delete business data
- [ ] Implementasi Redis caching (5 menit TTL untuk dashboard stats)
- [ ] Query aggregation untuk summary cards
- [ ] Routes: GET `/api/v1/dashboard/stats`, `/charts`
- [ ] Route: POST `/api/v1/data` (upload business data)

```typescript
// src/controllers/dashboard.controller.ts
export class DashboardController {
  async getStats(req: AuthRequest, res: Response) {
    const orgId = req.user!.orgId;
    const cacheKey = `dashboard:${orgId}:stats`;

    // Cek cache dulu
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // Query database
    const [totalUsers, totalData, recentSales] = await Promise.all([
      prisma.user.count({ where: { organizationId: orgId, deletedAt: null } }),
      prisma.businessData.count({ where: { organizationId: orgId, deletedAt: null } }),
      prisma.businessData.findMany({
        where: {
          organizationId: orgId,
          dataType: 'sales',
          deletedAt: null,
          recordedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      })
    ]);

    const totalRevenue = recentSales.reduce((sum, d) => {
      const payload = d.dataPayload as any;
      return sum + (payload.amount || payload.total || 0);
    }, 0);

    const result = {
      totalUsers,
      totalData,
      totalRevenue,
      aiQueriesThisMonth: 0,  // TODO: count dari ai_messages
      period: 'last_30_days'
    };

    // Cache 5 menit
    await redis.setex(cacheKey, 300, JSON.stringify(result));

    return res.json(result);
  }
}
```

---

## Task 1.4 — Frontend: Auth Pages

### Subtasks
- [ ] Buat login page dengan `react-hook-form` + `zod` validation
- [ ] Buat register page (nama, email, password, nama organisasi)
- [ ] Buat forgot password + reset password pages
- [ ] Setup Zustand auth store (simpan token + user info)
- [ ] Setup axios `apiClient` dengan interceptor (auto-refresh token)
- [ ] Buat protected route middleware (redirect ke login jika belum auth)

```typescript
// src/lib/api.ts — Axios client dengan auto-refresh
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1',
  withCredentials: true,
});

// Request interceptor: tambah Authorization header
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: auto-refresh jika 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
          { refreshToken });
        useAuthStore.getState().setAccessToken(res.data.accessToken);
        error.config.headers.Authorization = `Bearer ${res.data.accessToken}`;
        return apiClient(error.config);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

```typescript
// src/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  user: { id: string; name: string; role: string; orgId: string } | null;
  setAuth: (accessToken: string, refreshToken: string, user: any) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'auth-storage' }
  )
);
```

---

## Task 1.5 — Frontend: Dashboard Page

### Subtasks
- [ ] Buat dashboard layout dengan sidebar + header
- [ ] Buat `SummaryCard` component (reusable)
- [ ] Implement charts dengan Recharts: LineChart, BarChart, PieChart
- [ ] Setup React Query untuk data fetching + auto-refresh
- [ ] Buat loading skeleton states
- [ ] Buat filter bar (date range picker)
- [ ] Responsive: mobile-friendly dengan grid breakpoints

```tsx
// app/(dashboard)/dashboard/page.tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import { apiClient } from '@/lib/api';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 5 * 60 * 1000  // Auto-refresh setiap 5 menit
  });

  const { data: charts } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: () => apiClient.get('/dashboard/charts').then(r => r.data),
  });

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers, icon: '👥', color: 'bg-blue-50 border-blue-200' },
          { label: 'Revenue (30 hari)', value: `Rp${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: 'bg-green-50 border-green-200' },
          { label: 'AI Queries', value: stats?.aiQueriesThisMonth, icon: '🤖', color: 'bg-purple-50 border-purple-200' },
          { label: 'Data Points', value: stats?.totalData, icon: '📊', color: 'bg-orange-50 border-orange-200' },
        ].map(card => (
          <div key={card.label} className={`rounded-xl p-5 border ${card.color}`}>
            <div className="text-2xl mb-3">{card.icon}</div>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? <div className="h-8 w-24 bg-slate-200 rounded animate-pulse"/> : card.value}
            </div>
            <div className="text-sm text-slate-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Tren Penjualan 30 Hari</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={charts?.salesTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4">Top Produk Bulan Ini</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={charts?.topProducts || []}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="sales" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 1.6 — Frontend: Basic AI Chat Interface

### Subtasks
- [ ] Buat chat UI dengan message bubble (user kanan, AI kiri)
- [ ] Loading indicator (animated dots)
- [ ] Auto-scroll ke bawah saat pesan baru
- [ ] Enter key untuk kirim pesan
- [ ] Copy button di setiap response AI
- [ ] Sidebar conversation history list
- [ ] Backend: POST `/api/v1/ai/chat` (return dummy response untuk Phase 1)

```tsx
// app/(dashboard)/chat/page.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Copy, Check } from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface Message { role: 'user' | 'assistant'; content: string; }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Halo! Saya AI Assistant Anda. Tanyakan apa saja tentang data bisnis Anda.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/ai/chat', { message: input });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch {
      toast.error('Gagal mendapatkan respons AI. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-800'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}/>
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Tanyakan sesuatu tentang data bisnis Anda..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 transition-colors"
          />
          <button onClick={sendMessage} disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-colors">
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          AI membaca data bisnis organisasi Anda · Jangan kirim data sensitif
        </p>
      </div>
    </div>
  );
}
```

---

# 🤖 PHASE 2 — AI Real Integration
> **Durasi:** Bulan 2–2.5  
> **KPI:** AI response < 5 detik, 0 cross-tenant data leakage, cache hit > 30%

---

## Task 2.1 — AI Provider Abstraction Layer

### Subtasks
- [ ] Buat interface `AIProvider` (TypeScript)
- [ ] Implement `OpenAIProvider` (primary)
- [ ] Implement `AnthropicProvider` (fallback)
- [ ] Setup Circuit Breaker dengan `opossum`
- [ ] Alert ke Slack saat circuit OPEN
- [ ] Unit test AIService dengan mock provider

```typescript
// src/services/ai/ai.provider.ts
export interface AIMessage { role: 'user' | 'assistant' | 'system'; content: string; }
export interface AIResponse { content: string; tokensUsed: number; model: string; isFallback: boolean; }

export interface AIProvider {
  chat(messages: AIMessage[], options?: { maxTokens?: number }): Promise<AIResponse>;
  isHealthy(): Promise<boolean>;
}

// src/services/ai/openai.provider.ts
import OpenAI from 'openai';
export class OpenAIProvider implements AIProvider {
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async chat(messages: AIMessage[], opts = {}): Promise<AIResponse> {
    const res = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: messages as any,
      max_tokens: (opts as any).maxTokens || 1000,
      temperature: 0.3,
    });
    return {
      content: res.choices[0].message.content || '',
      tokensUsed: res.usage?.total_tokens || 0,
      model: 'gpt-4o',
      isFallback: false
    };
  }

  async isHealthy() {
    try { await this.client.models.list(); return true; } catch { return false; }
  }
}

// src/services/ai/ai.service.ts — Orchestrator dengan Circuit Breaker
import CircuitBreaker from 'opossum';

export class AIService {
  private primaryCB: CircuitBreaker;
  private fallback = new AnthropicProvider();

  constructor() {
    const primary = new OpenAIProvider();
    this.primaryCB = new CircuitBreaker(
      (msgs: AIMessage[]) => primary.chat(msgs),
      {
        timeout: 10000,
        errorThresholdPercentage: 50,
        resetTimeout: 60000,
      }
    );
    this.primaryCB.fallback((msgs) => this.fallback.chat(msgs));
    this.primaryCB.on('open', () => {
      logger.warn('Circuit breaker OPEN — switching to fallback AI');
      // TODO: alert Slack
    });
  }

  async chat(orgId: string, userId: string, conversationId: string, question: string) {
    // 1. Cek token budget
    await tokenBudgetService.check(orgId);

    // 2. Ambil data relevan via RAG
    const relevantData = await ragService.getRelevantData(orgId, question);

    // 3. PII masking
    const maskedData = piiService.mask(JSON.stringify(relevantData));

    // 4. Ambil history conversation
    const history = await this.getConversationHistory(conversationId);

    // 5. Build prompt
    const messages = this.buildPrompt(orgId, question, maskedData, history);

    // 6. Cek cache
    const cacheKey = `ai:${orgId}:${hash(question)}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // 7. Kirim ke AI via circuit breaker
    const start = Date.now();
    const response = await this.primaryCB.fire(messages) as AIResponse;
    const latencyMs = Date.now() - start;

    // 8. Update token budget
    await tokenBudgetService.update(orgId, response.tokensUsed);

    // 9. Cache 1 jam
    await redis.setex(cacheKey, 3600, JSON.stringify(response));

    // 10. Simpan ke DB
    await prisma.aiMessage.createMany({
      data: [
        { conversationId, role: 'user', content: question },
        { conversationId, role: 'assistant', content: response.content,
          tokensUsed: response.tokensUsed, modelUsed: response.model,
          responseTimeMs: latencyMs, isFallback: response.isFallback }
      ]
    });

    return response;
  }
}
```

---

## Task 2.2 — Token Budget & PII Masking

### Subtasks
- [ ] Implement `TokenBudgetService`: check() dan update()
- [ ] Setup cron job reset token tanggal 1 setiap bulan
- [ ] Implement `PIIService` dengan regex patterns
- [ ] Integrate PII masking di AI pipeline sebelum kirim ke OpenAI
- [ ] Test: verifikasi email/phone tidak muncul di AI logs
- [ ] Notifikasi warning saat budget 80% dan block saat 100%

```typescript
// src/services/ai/pii.service.ts
export class PIIService {
  private patterns = [
    { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      replace: (m: string) => m[0] + '***@***.com' },
    { regex: /(\+62|0)[0-9]{8,12}/g,
      replace: () => '****-****-****' },
    { regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      replace: () => '****-****-****-****' },
    { regex: /\b\d{16}\b/g,
      replace: () => '[NIK DIRAHASIAKAN]' },
  ];

  mask(text: string): string {
    return this.patterns.reduce(
      (result, p) => result.replace(p.regex, p.replace as any),
      text
    );
  }
}

// Cron reset token budget setiap tanggal 1
// src/jobs/token-reset.job.ts
cron.schedule('0 0 1 * *', async () => {
  await prisma.organization.updateMany({ data: { tokensUsedThisMonth: 0 } });
  logger.info('Token budgets reset for all organizations');
});
```

---

## Task 2.3 — RAG dengan pgvector

### Subtasks
- [ ] Enable pgvector extension di PostgreSQL
- [ ] Tambah kolom `embedding vector(1536)` di business_data table
- [ ] Buat `RAGService`: generateEmbedding, indexBusinessData, getRelevantData
- [ ] Hook: saat data diupload, otomatis generate & simpan embedding
- [ ] Test: pertanyaan relevan mendapat similarity > 0.8
- [ ] Monitor: ukur token saving vs tanpa RAG

```typescript
// src/services/ai/rag.service.ts
export class RAGService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',  // $0.02/1M tokens
      input: text.slice(0, 2000),
    });
    return res.data[0].embedding;
  }

  async indexBusinessData(dataId: string, orgId: string, payload: object): Promise<void> {
    const embedding = await this.generateEmbedding(JSON.stringify(payload));
    await prisma.$executeRaw`
      UPDATE business_data
      SET embedding = ${embedding}::vector
      WHERE id = ${dataId}::uuid AND organization_id = ${orgId}::uuid
    `;
  }

  async getRelevantData(orgId: string, question: string, topK = 5): Promise<any[]> {
    const queryEmbedding = await this.generateEmbedding(question);
    const results = await prisma.$queryRaw`
      SELECT id, data_type, data_payload,
        1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
      FROM business_data
      WHERE organization_id = ${orgId}::uuid
        AND deleted_at IS NULL
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${topK}
    `;
    return results as any[];
  }
}
```

---

## Task 2.4 — Streaming AI Response (SSE)

### Subtasks
- [ ] Backend: streaming endpoint dengan OpenAI stream API
- [ ] Frontend: custom hook `useStreamingChat`
- [ ] Implementasi karakter-per-karakter effect di UI
- [ ] Handle SSE disconnection & reconnection
- [ ] Test di Chrome, Firefox, Safari

```typescript
// Backend streaming endpoint
async chatStream(req: AuthRequest, res: Response) {
  const { message, conversationId } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: await buildMessages(req.user!.orgId, message, conversationId),
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ delta, done: false })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ delta: '', done: true })}\n\n`);
    res.end();

    // Simpan ke DB async
    setImmediate(() => saveMessages(req.user!, conversationId, message, fullContent));
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: 'AI tidak tersedia', done: true })}\n\n`);
    res.end();
  }
}
```

---

## Task 2.5 — Insight Generator (BullMQ Scheduler)

### Subtasks
- [ ] Setup BullMQ Queue + Worker untuk 'scheduled-insights'
- [ ] Cron job: Senin jam 07.00 WIB (weekly) dan tanggal 1 (monthly)
- [ ] Buat prompt template untuk weekly & monthly insight
- [ ] Simpan hasil ke tabel ai_insights
- [ ] Trigger notifikasi saat insight selesai
- [ ] Setup Bull Board (dashboard monitoring queue)

```typescript
// src/jobs/insight-generator.job.ts
import { Queue, Worker } from 'bullmq';
import cron from 'node-cron';

const insightQueue = new Queue('scheduled-insights', { connection: redisConfig });

// Setiap Senin jam 07.00 WIB = 00:00 UTC
cron.schedule('0 0 * * 1', async () => {
  const orgs = await prisma.organization.findMany({
    where: { deletedAt: null }
  });

  for (const org of orgs) {
    await insightQueue.add('weekly-insight',
      { orgId: org.id, type: 'weekly' },
      { attempts: 2, backoff: { type: 'exponential', delay: 5000 } }
    );
  }
  logger.info(`Queued weekly insights for ${orgs.length} organizations`);
});

const insightWorker = new Worker('scheduled-insights', async (job) => {
  const { orgId, type } = job.data;
  const endDate = new Date();
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const salesData = await prisma.businessData.findMany({
    where: {
      organizationId: orgId, dataType: 'sales', deletedAt: null,
      recordedAt: { gte: startDate, lte: endDate }
    }
  });

  if (salesData.length === 0) return;

  const prompt = `
Analisis data penjualan minggu ini.
Data: ${JSON.stringify(salesData.slice(0, 20))}

Buat insight dalam format JSON:
{
  "title": "string",
  "highlights": ["3 poin utama"],
  "trend": "naik|turun|stabil",
  "recommendations": ["2 rekomendasi actionable"],
  "confidence": "high|medium|low"
}
Jawab HANYA dengan JSON, tanpa text lain.`;

  const response = await aiService.generateInsight(orgId, prompt);
  const insight = JSON.parse(response.content);

  await prisma.aiInsight.create({
    data: {
      organizationId: orgId,
      title: insight.title,
      description: JSON.stringify(insight),
      insightType: type,
      confidence: insight.confidence,
      periodStart: startDate,
      periodEnd: endDate,
    }
  });

  await notificationService.sendToOrg(orgId, {
    type: 'insight_ready',
    title: 'Insight Mingguan Tersedia',
    body: insight.title,
    actionUrl: '/dashboard'
  });
}, { connection: redisConfig, concurrency: 5 });
```

---

# 📊 PHASE 3 — Reports & Notifications
> **Durasi:** Bulan 3  
> **KPI:** PDF generated < 30 detik, email digest terkirim tepat waktu

---

## Task 3.1 — PDF Report Generator

### Subtasks
- [ ] Install `puppeteer` + `@aws-sdk/client-s3`
- [ ] Setup Cloudflare R2 bucket
- [ ] Buat `ReportService`: generatePDF, getReportData
- [ ] Prompt template untuk generate HTML report yang rapi
- [ ] Upload PDF ke R2, simpan URL ke database
- [ ] BullMQ job untuk async processing
- [ ] Frontend: Reports page dengan status indicator + download button

```typescript
// src/services/report.service.ts
import puppeteer from 'puppeteer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY!,
    secretAccessKey: process.env.R2_SECRET_KEY!,
  }
});

export class ReportService {
  async generatePDF(reportId: string, orgId: string, reportType: string): Promise<string> {
    // 1. Ambil data
    const data = await this.getReportData(orgId, reportType);

    // 2. Generate HTML via AI
    const htmlContent = await aiService.generateReportHTML(orgId, data, reportType);

    // 3. Render PDF dengan Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
    });
    await browser.close();

    // 4. Upload ke R2
    const fileName = `reports/${orgId}/${reportId}.pdf`;
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
    }));

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    // 5. Update status di database
    await prisma.report.update({
      where: { id: reportId },
      data: { status: 'completed', fileUrl }
    });

    return fileUrl;
  }
}
```

---

## Task 3.2 — Notification System

### Subtasks
- [ ] Buat `NotificationService`: send, sendToOrg, sendWeeklyDigest
- [ ] Email template HTML untuk weekly digest (Resend)
- [ ] SSE endpoint untuk real-time push notification
- [ ] Frontend: notification bell icon dengan badge counter
- [ ] Notification center dropdown (list, mark as read, mark all)
- [ ] User bisa toggle notifikasi per tipe di Settings
- [ ] Test email di development dengan Resend sandbox mode

```typescript
// src/services/notification.service.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export class NotificationService {
  async send(userId: string, notif: CreateNotificationDto): Promise<void> {
    const saved = await prisma.notification.create({
      data: { userId, organizationId: notif.orgId, ...notif }
    });
    // Real-time push via Redis pub/sub
    await redis.publish(`notif:${userId}`, JSON.stringify(saved));
  }

  async sendToOrg(orgId: string, notif: any): Promise<void> {
    const users = await prisma.user.findMany({
      where: { organizationId: orgId, deletedAt: null },
      select: { id: true }
    });
    await Promise.all(users.map(u => this.send(u.id, { ...notif, orgId })));
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    await resend.emails.send({
      from: 'AI Dashboard <noreply@yourdomain.com>',
      to, subject, html
    });
  }

  // SSE untuk real-time notification
  async streamNotifications(req: AuthRequest, res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const subscriber = redis.duplicate();
    await subscriber.subscribe(`notif:${req.user!.userId}`);

    subscriber.on('message', (_, message) => {
      res.write(`data: ${message}\n\n`);
    });

    req.on('close', () => {
      subscriber.unsubscribe();
      subscriber.disconnect();
    });
  }
}
```

---

# 💳 PHASE 4 — SaaS & Multi-Tenant
> **Durasi:** Bulan 4  
> **KPI:** 5 paying organizations, 3 API integrations aktif

---

## Task 4.1 — API Key System

### Subtasks
- [ ] Buat `ApiKeyService`: generate, validate, revoke
- [ ] API Key middleware untuk external endpoint
- [ ] Frontend: API Key management page (generate, list, revoke)
- [ ] Tampilkan raw key hanya sekali dengan copy-to-clipboard
- [ ] Rate limiting per API key (Redis sliding window)
- [ ] POST `/api/v1/analyze` endpoint untuk AI Agent
- [ ] Dokumentasi API untuk external developer

```typescript
// src/services/api-key.service.ts
import crypto from 'crypto';

export class ApiKeyService {
  async generate(orgId: string, userId: string, name: string): Promise<string> {
    const rawKey = `sk_prod_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.slice(0, 10);

    await prisma.apiKey.create({
      data: { organizationId: orgId, createdBy: userId, name, keyHash, keyPrefix }
    });

    // Simpan sementara untuk ditampilkan sekali (10 menit)
    await redis.setex(`apikey:reveal:${keyHash}`, 600, rawKey);

    return rawKey;  // Hanya ditampilkan SEKALI
  }

  async validate(rawKey: string): Promise<{ orgId: string }> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash, status: 'active' }
    });

    if (!apiKey) throw new AppError('API Key tidak valid', 401);
    if (apiKey.expiresAt && apiKey.expiresAt < new Date())
      throw new AppError('API Key sudah expired', 401);

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date(), totalRequests: { increment: 1 } }
    });

    return { orgId: apiKey.organizationId };
  }
}
```

---

## Task 4.2 — Billing Integration (Midtrans)

### Subtasks
- [ ] Install `midtrans-client`
- [ ] Buat `BillingService`: createSubscription, handleWebhook
- [ ] Webhook endpoint POST `/api/v1/webhooks/midtrans`
- [ ] Implementasi feature flags per plan (PLAN_FEATURES)
- [ ] Update plan di database saat payment berhasil
- [ ] Frontend: Billing page (current plan, upgrade, invoice history)
- [ ] Test payment flow di Midtrans sandbox

```typescript
// src/services/billing.service.ts
export const PLAN_FEATURES = {
  starter:      { aiQueriesPerMonth: 100,    reports: 3,        apiAccess: false, maxUsers: 1 },
  professional: { aiQueriesPerMonth: 2000,   reports: Infinity, apiAccess: true,  maxUsers: 5 },
  enterprise:   { aiQueriesPerMonth: Infinity, reports: Infinity, apiAccess: true, maxUsers: Infinity }
};

export const requirePlanFeature = (feature: keyof typeof PLAN_FEATURES.starter) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const org = await prisma.organization.findUnique({ where: { id: req.user!.orgId } });
    const features = PLAN_FEATURES[org!.plan as keyof typeof PLAN_FEATURES];

    if (!features || !features[feature]) {
      return res.status(403).json({
        error: 'Fitur ini tidak tersedia di plan Anda.',
        upgradeUrl: '/settings/billing'
      });
    }
    next();
  };
```

---

# 🛡️ PHASE 5 — Optimization & Security
> **Durasi:** Bulan 5  
> **KPI:** API p95 < 2 detik, 0 OWASP critical findings, Lighthouse > 85

---

## Task 5.1 — Database Optimization

### Subtasks
- [ ] Identify top 10 slow queries dengan pg_stat_statements
- [ ] Tambah semua index yang missing (CONCURRENTLY)
- [ ] Analyze query plan dengan EXPLAIN ANALYZE
- [ ] Setup PgBouncer untuk connection pooling
- [ ] Monitor connection pool di Grafana

```sql
-- Enable query monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Cari slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Index yang kritis (tambah yang belum ada)
CREATE INDEX CONCURRENTLY idx_business_data_org_type_date
  ON business_data(organization_id, data_type, recorded_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC)
  WHERE is_read = false;

-- Index HNSW untuk pgvector (lebih cepat dari default IVFFlat)
CREATE INDEX CONCURRENTLY idx_business_data_embedding
  ON business_data USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

---

## Task 5.2 — Load Testing dengan k6

### Subtasks
- [ ] Install k6
- [ ] Buat load test script untuk semua critical endpoints
- [ ] Setup InfluxDB + Grafana untuk visualize hasil
- [ ] Run test di staging environment
- [ ] Identifikasi dan fix bottleneck
- [ ] Run ulang sampai semua threshold terpenuhi

```javascript
// tests/load/main.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 100 },
    { duration: '3m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],  // 95% request < 2 detik
    http_req_failed: ['rate<0.01'],      // Error rate < 1%
  },
};

export default function (data) {
  const headers = { 'Authorization': `Bearer ${data.token}` };

  // Dashboard stats (paling sering dipanggil)
  const res = http.get(`${BASE_URL}/dashboard/stats`, { headers });
  check(res, { 'status 200': r => r.status === 200 });

  sleep(1);
}

// Jalankan:
// k6 run tests/load/main.js
```

---

## Task 5.3 — Security Audit

### Subtasks
- [ ] Jalankan OWASP ZAP API scan di staging
- [ ] `npm audit` dan fix semua high/critical vulnerabilities
- [ ] Manual test: coba akses data org lain (harus gagal)
- [ ] Manual test: prompt injection ke AI chat
- [ ] Manual test: brute force login (pastikan rate limit aktif)
- [ ] Setup Sentry data scrubbing untuk PII
- [ ] Review semua env variables tidak ter-commit ke git

```bash
# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t https://staging.yourdomain.com/api/v1/openapi.json \
  -f openapi -r zap_report.html

# Dependency audit
cd backend && npm audit --audit-level=high
cd frontend && npm audit --audit-level=high

# Check apakah ada secret yang ter-commit
git log --all --full-history -- '**/.env*'
```

### Security Checklist

```
✅ AUTHENTICATION
□ JWT secret > 64 karakter (random dari crypto)
□ Refresh token di httpOnly cookie (bukan localStorage)
□ Password bcrypt dengan cost factor 12
□ Rate limiting login: max 10 req/menit per IP
□ Account lockout setelah 5 gagal login

✅ AUTHORIZATION
□ Semua route authenticated membutuhkan JWT valid
□ Semua query di-filter dengan organizationId dari token
□ Admin endpoint dilindungi requireRole('admin')

✅ INPUT VALIDATION
□ Semua input di-validate dengan Zod
□ File upload: validate type, max size 10MB
□ SQL injection: semua query via Prisma (parameterized)
□ XSS: sanitize semua user-generated content

✅ INFRASTRUCTURE
□ HTTPS/TLS 1.3 aktif
□ Helmet.js dengan CSP ketat
□ CORS hanya allow production domain
□ Database tidak accessible dari publik internet
□ Environment variables di-set via platform secrets (bukan .env)
```

---

## Task 5.4 — Monitoring Setup (Grafana + Prometheus)

### Subtasks
- [ ] Setup Prometheus + Grafana via Docker Compose
- [ ] Install `prom-client` di backend
- [ ] Buat metrics: http latency, AI requests, queue depth, token usage
- [ ] Import Grafana dashboards
- [ ] Setup alerts: AI error > 10%, latency > 3s, disk > 80%
- [ ] Slack integration untuk Grafana alerts
- [ ] Setup Sentry untuk frontend dan backend error tracking

```typescript
// src/config/metrics.ts
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

export const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register]
});

export const aiRequestCounter = new Counter({
  name: 'ai_request_total',
  help: 'Total AI API requests',
  labelNames: ['provider', 'status'],
  registers: [register]
});

export const aiTokensCounter = new Counter({
  name: 'ai_tokens_total',
  help: 'Total AI tokens consumed',
  labelNames: ['org_plan'],
  registers: [register]
});

export const queueDepthGauge = new Gauge({
  name: 'job_queue_depth',
  help: 'Current queue depth',
  labelNames: ['queue_name'],
  registers: [register]
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

# 🚀 PHASE 6 — Growth & Go-to-Market
> **Durasi:** Bulan 6  
> **KPI:** 80 paying organizations, NPS > 30, Product Hunt launch

---

## Task 6.1 — Landing Page Marketing

### Subtasks
- [ ] Desain dan build landing page: Hero, Features, Pricing, FAQ
- [ ] Pricing page dengan feature comparison table
- [ ] Embed product demo video (Loom/screen recording)
- [ ] Setup waitlist form (simpan email ke database)
- [ ] SEO: meta tags, Open Graph, sitemap.xml, robots.txt
- [ ] Google Analytics 4 + PostHog event tracking
- [ ] Lighthouse score > 90 semua kategori

### SEO Checklist

```
✅ SEO CHECKLIST
□ Meta title unik per halaman (max 60 char)
□ Meta description (max 160 char)
□ Open Graph tags (og:title, og:image, og:description)
□ Twitter Card tags
□ Canonical URL
□ Structured data JSON-LD (SoftwareApplication)
□ Sitemap.xml otomatis (next-sitemap)
□ robots.txt
□ Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1
□ Alt text semua gambar
□ Heading hierarchy (H1 → H2 → H3)
```

---

## Task 6.2 — Referral Program & Analytics

### Subtasks
- [ ] Buat `ReferralService`: generate code, track conversion
- [ ] Tambah kolom `referralCode` + `referredBy` di users table
- [ ] Setup PostHog (self-hosted atau cloud)
- [ ] Track semua key events: signup, first_ai_query, plan_upgrade
- [ ] Dashboard referral: berapa user diajak, berapa convert
- [ ] Email otomatis saat referral berhasil convert (reward notification)

```typescript
// Key analytics events yang harus di-track
const ANALYTICS_EVENTS = {
  // Acquisition
  USER_REGISTERED: 'user_registered',
  REFERRAL_APPLIED: 'referral_applied',

  // Activation
  ONBOARDING_COMPLETED: 'onboarding_completed',
  FIRST_DATA_UPLOADED: 'first_data_uploaded',
  FIRST_AI_QUERY: 'first_ai_query',

  // Engagement
  DASHBOARD_VIEWED: 'dashboard_viewed',
  AI_CHAT_SENT: 'ai_chat_sent',
  REPORT_GENERATED: 'report_generated',
  REPORT_DOWNLOADED: 'report_downloaded',

  // Revenue
  PLAN_UPGRADED: 'plan_upgraded',
  PLAN_DOWNGRADED: 'plan_downgraded',

  // API
  API_KEY_CREATED: 'api_key_created',
  API_KEY_USED: 'api_key_used',
};
```

---

## Task 6.3 — Pre-Launch Checklist

### Subtasks
- [ ] Setup custom domain + SSL di Vercel + Railway
- [ ] Verify email domain di Resend (SPF, DKIM, DMARC)
- [ ] Buat halaman Terms of Service + Privacy Policy
- [ ] Setup uptime monitoring (Better Uptime — ada free plan)
- [ ] Test full user journey end-to-end
- [ ] Briefing tim support: FAQ, escalation path
- [ ] Product Hunt submission preparation

### Final Go-Live Checklist

```
✅ INFRASTRUCTURE
□ Custom domain + SSL aktif
□ CDN untuk aset statis
□ Database backup otomatis (daily)
□ Monitoring Grafana aktif dengan alerts
□ Sentry error tracking aktif
□ Uptime monitoring (Better Uptime)

✅ SECURITY
□ Semua env vars di production sudah di-set
□ OWASP ZAP: 0 critical findings
□ npm audit: 0 high/critical vulnerabilities
□ Rate limiting aktif
□ CORS hanya allow production domain

✅ PERFORMANCE
□ API p95 < 2 detik (k6 test passed)
□ Lighthouse > 85 semua kategori
□ AI p95 < 5 detik
□ Redis cache aktif

✅ BUSINESS
□ Payment gateway production credentials aktif
□ Email domain verified (SPF, DKIM, DMARC)
□ Terms of Service + Privacy Policy halaman ada
□ Cookie consent banner
□ Contact/support aktif

✅ USER EXPERIENCE
□ Onboarding wizard berjalan mulus
□ Error messages user-friendly
□ Loading states di semua halaman
□ Mobile responsive semua halaman
□ Email templates OK di Gmail & Outlook

# 🚀 LAUNCH!
```

---

# 📋 Quick Reference Commands

```bash
# Development startup
docker-compose up -d                    # Start PostgreSQL + Redis
cd backend && ts-node-dev src/app.ts   # Start backend (port 4000)
cd frontend && npm run dev              # Start frontend (port 3000)

# Database
npx prisma migrate dev --name <name>   # Buat migration baru
npx prisma migrate deploy              # Apply migrations (production)
npx prisma studio                      # GUI database browser
npx prisma db seed                     # Run seed data

# Testing
npm test                               # Unit tests
npm test -- --coverage                 # Dengan coverage report
npx jest --watch                       # Watch mode

# Load testing
k6 run tests/load/main.js             # Jalankan load test

# Security scan
npm audit --audit-level=high          # Dependency vulnerabilities
docker run -t owasp/zap2docker-stable zap-api-scan.py -t <url> -f openapi

# Monitoring
docker-compose -f docker-compose.monitoring.yml up -d  # Start Grafana + Prometheus
# Akses Grafana: http://localhost:3001 (admin/admin123)
# Akses Prometheus: http://localhost:9090
```

---

*AI Dashboard Platform — Development Guide v2.0 · March 2026*
