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