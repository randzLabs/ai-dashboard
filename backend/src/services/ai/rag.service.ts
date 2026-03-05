// src/services/ai/rag.service.ts
export class RAGService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await this.openai.embeddings.create({
      model: "text-embedding-3-small", // $0.02/1M tokens
      input: text.slice(0, 2000),
    });
    return res.data[0].embedding;
  }

  async indexBusinessData(
    dataId: string,
    orgId: string,
    payload: object,
  ): Promise<void> {
    const embedding = await this.generateEmbedding(JSON.stringify(payload));
    await prisma.$executeRaw`
      UPDATE business_data
      SET embedding = ${embedding}::vector
      WHERE id = ${dataId}::uuid AND organization_id = ${orgId}::uuid
    `;
  }

  async getRelevantData(
    orgId: string,
    question: string,
    topK = 5,
  ): Promise<any[]> {
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
