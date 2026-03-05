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