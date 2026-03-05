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