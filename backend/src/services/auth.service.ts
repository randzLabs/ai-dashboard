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