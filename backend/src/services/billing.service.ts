// src/services/billing.service.ts
export const PLAN_FEATURES = {
  starter: {
    aiQueriesPerMonth: 100,
    reports: 3,
    apiAccess: false,
    maxUsers: 1,
  },
  professional: {
    aiQueriesPerMonth: 2000,
    reports: Infinity,
    apiAccess: true,
    maxUsers: 5,
  },
  enterprise: {
    aiQueriesPerMonth: Infinity,
    reports: Infinity,
    apiAccess: true,
    maxUsers: Infinity,
  },
};

export const requirePlanFeature =
  (feature: keyof typeof PLAN_FEATURES.starter) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const org = await prisma.organization.findUnique({
      where: { id: req.user!.orgId },
    });
    const features = PLAN_FEATURES[org!.plan as keyof typeof PLAN_FEATURES];

    if (!features || !features[feature]) {
      return res.status(403).json({
        error: "Fitur ini tidak tersedia di plan Anda.",
        upgradeUrl: "/settings/billing",
      });
    }
    next();
  };
