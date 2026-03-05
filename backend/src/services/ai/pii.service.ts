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