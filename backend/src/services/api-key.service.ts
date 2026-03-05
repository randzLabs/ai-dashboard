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