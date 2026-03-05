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