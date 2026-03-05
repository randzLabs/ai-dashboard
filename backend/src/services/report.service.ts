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