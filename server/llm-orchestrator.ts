/**
 * Orchestrador de LLMs Multimodal
 * Integra ChatGPT, DeepSeek, Grok, Manus e outros modelos
 * Roteia automaticamente para o modelo mais adequado baseado na tarefa
 */

import { invokeLLM } from "./_core/llm";

export type LLMProvider = "manus" | "chatgpt" | "deepseek" | "grok" | "claude";
export type TaskType =
  | "general"
  | "coding"
  | "analysis"
  | "creative"
  | "research"
  | "reasoning"
  | "summarization";

interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  provider: LLMProvider;
  model: string;
  content: string;
  tokensUsed: number;
  executionTime: number;
  timestamp: Date;
}

interface ComparisonResult {
  taskType: TaskType;
  query: string;
  responses: LLMResponse[];
  bestResponse: LLMResponse;
  analysis: {
    quality: Record<LLMProvider, number>;
    relevance: Record<LLMProvider, number>;
    clarity: Record<LLMProvider, number>;
  };
}

/**
 * Configurações padrão de modelos
 */
const DEFAULT_MODELS: Record<LLMProvider, string> = {
  manus: "manus-gpt-4-turbo",
  chatgpt: "gpt-4-turbo",
  deepseek: "deepseek-coder-33b",
  grok: "grok-2",
  claude: "claude-3-opus",
};

/**
 * Mapeamento de tarefas para modelos ideais
 */
const TASK_TO_MODEL: Record<TaskType, LLMProvider[]> = {
  coding: ["deepseek", "chatgpt", "manus"],
  analysis: ["manus", "chatgpt", "claude"],
  creative: ["grok", "claude", "manus"],
  research: ["manus", "chatgpt", "deepseek"],
  reasoning: ["claude", "manus", "chatgpt"],
  summarization: ["manus", "chatgpt", "grok"],
  general: ["manus", "chatgpt", "grok"],
};

/**
 * Classe do Orchestrador de LLMs
 */
export class LLMOrchestrator {
  private configs: Map<LLMProvider, LLMConfig> = new Map();
  private responseCache: Map<string, LLMResponse> = new Map();
  private conversationHistory: Array<{
    provider: LLMProvider;
    messages: any[];
  }> = [];

  constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * Inicializar configurações padrão
   */
  private initializeDefaultConfigs() {
    // Manus (integrado nativamente)
    this.configs.set("manus", {
      provider: "manus",
      model: DEFAULT_MODELS.manus,
      temperature: 0.7,
      maxTokens: 4096,
    });

    // ChatGPT
    this.configs.set("chatgpt", {
      provider: "chatgpt",
      model: DEFAULT_MODELS.chatgpt,
      apiKey: process.env.OPENAI_API_KEY,
      baseUrl: "https://api.openai.com/v1",
      temperature: 0.7,
      maxTokens: 4096,
    });

    // DeepSeek
    this.configs.set("deepseek", {
      provider: "deepseek",
      model: DEFAULT_MODELS.deepseek,
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseUrl: "https://api.deepseek.com/v1",
      temperature: 0.7,
      maxTokens: 4096,
    });

    // Grok
    this.configs.set("grok", {
      provider: "grok",
      model: DEFAULT_MODELS.grok,
      apiKey: process.env.GROK_API_KEY,
      baseUrl: "https://api.x.ai/v1",
      temperature: 0.7,
      maxTokens: 4096,
    });

    // Claude
    this.configs.set("claude", {
      provider: "claude",
      model: DEFAULT_MODELS.claude,
      apiKey: process.env.ANTHROPIC_API_KEY,
      baseUrl: "https://api.anthropic.com",
      temperature: 0.7,
      maxTokens: 4096,
    });
  }

  /**
   * Invocar um LLM específico
   */
  async invokeProvider(
    provider: LLMProvider,
    messages: any[],
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const startTime = Date.now();
    const config = { ...this.configs.get(provider), ...options };

    try {
      let response;

      // Usar o Manus como proxy para todos os provedores
      // (em produção, você teria integrações diretas)
      if (provider === "manus") {
        response = await invokeLLM({
          messages,
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        });
      } else {
        // Simular chamada a outros provedores
        // Em produção, usar bibliotecas específicas (openai, anthropic, etc.)
        response = await this.simulateProviderCall(provider, messages, config);
      }

      const content =
        typeof response.choices?.[0]?.message?.content === "string"
          ? response.choices[0].message.content
          : JSON.stringify(response.choices?.[0]?.message?.content || "");

      const llmResponse: LLMResponse = {
        provider,
        model: config.model,
        content,
        tokensUsed: response.usage?.total_tokens || 0,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };

      // Cachear resposta
      const cacheKey = `${provider}_${messages[messages.length - 1]?.content}`;
      this.responseCache.set(cacheKey, llmResponse);

      return llmResponse;
    } catch (error) {
      console.error(`Erro ao invocar ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Simular chamada a provedores (para desenvolvimento)
   */
  private async simulateProviderCall(
    provider: LLMProvider,
    messages: any[],
    config: LLMConfig
  ) {
    // Em produção, fazer chamadas reais
    const providerResponses: Record<LLMProvider, string> = {
      chatgpt:
        "Resposta do ChatGPT: Esta é uma resposta inteligente e bem estruturada.",
      deepseek:
        "Resposta do DeepSeek: Análise profunda com foco em código e lógica.",
      grok: "Resposta do Grok: Perspectiva criativa e inovadora sobre o tema.",
      claude:
        "Resposta do Claude: Análise equilibrada com considerações éticas.",
      manus: "Resposta do Manus: Integração nativa com recursos avançados.",
    };

    return {
      choices: [
        {
          message: {
            content: providerResponses[provider],
          },
        },
      ],
      usage: {
        total_tokens: Math.floor(Math.random() * 500) + 100,
      },
    };
  }

  /**
   * Rotear automaticamente para o melhor modelo
   */
  async routeToOptimalModel(
    query: string,
    taskType: TaskType = "general"
  ): Promise<LLMResponse> {
    const providers = TASK_TO_MODEL[taskType] || TASK_TO_MODEL.general;
    const primaryProvider = providers[0];

    console.log(
      `[ORCHESTRATOR] Roteando tarefa "${taskType}" para ${primaryProvider}`
    );

    return this.invokeProvider(primaryProvider, [
      {
        role: "user",
        content: query,
      },
    ]);
  }

  /**
   * Comparar respostas de múltiplos modelos
   */
  async compareModels(
    query: string,
    providers?: LLMProvider[],
    taskType: TaskType = "general"
  ): Promise<ComparisonResult> {
    const modelsToCompare = providers || TASK_TO_MODEL[taskType];

    console.log(
      `[ORCHESTRATOR] Comparando ${modelsToCompare.length} modelos para: "${query}"`
    );

    const responses: LLMResponse[] = [];

    for (const provider of modelsToCompare) {
      try {
        const response = await this.invokeProvider(provider, [
          {
            role: "user",
            content: query,
          },
        ]);
        responses.push(response);
      } catch (error) {
        console.error(`Erro ao invocar ${provider}:`, error);
      }
    }

    // Analisar qualidade das respostas
    const analysis = this.analyzeResponses(responses);

    // Encontrar melhor resposta
    const bestResponse = responses.reduce((best, current) => {
      const bestScore = analysis.quality[best.provider];
      const currentScore = analysis.quality[current.provider];
      return currentScore > bestScore ? current : best;
    });

    return {
      taskType,
      query,
      responses,
      bestResponse,
      analysis,
    };
  }

  /**
   * Analisar qualidade das respostas
   */
  private analyzeResponses(responses: LLMResponse[]) {
    const analysis = {
      quality: {} as Record<LLMProvider, number>,
      relevance: {} as Record<LLMProvider, number>,
      clarity: {} as Record<LLMProvider, number>,
    };

    for (const response of responses) {
      // Simular análise (em produção, usar métricas reais)
      analysis.quality[response.provider] = Math.random() * 100;
      analysis.relevance[response.provider] = Math.random() * 100;
      analysis.clarity[response.provider] = Math.random() * 100;
    }

    return analysis;
  }

  /**
   * Conversa multimodal com histórico
   */
  async multimodalConversation(
    provider: LLMProvider,
    userMessage: string,
    conversationId?: string
  ): Promise<LLMResponse> {
    // Recuperar histórico se fornecido
    let messages = [{ role: "user", content: userMessage }];

    if (conversationId) {
      const history = this.conversationHistory.find(
        (h) => h.provider === provider
      );
      if (history) {
        messages = [...history.messages, { role: "user", content: userMessage }];
      }
    }

    // Invocar modelo
    const response = await this.invokeProvider(provider, messages);

    // Salvar no histórico
    if (conversationId) {
      const existingHistory = this.conversationHistory.find(
        (h) => h.provider === provider
      );
      if (existingHistory) {
        existingHistory.messages.push({
          role: "user",
          content: userMessage,
        });
        existingHistory.messages.push({
          role: "assistant",
          content: response.content,
        });
      } else {
        this.conversationHistory.push({
          provider,
          messages: [
            { role: "user", content: userMessage },
            { role: "assistant", content: response.content },
          ],
        });
      }
    }

    return response;
  }

  /**
   * Obter status de todos os modelos
   */
  getModelsStatus() {
    return Array.from(this.configs.entries()).map(([provider, config]) => ({
      provider,
      model: config.model,
      available: !!config.apiKey || provider === "manus",
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    }));
  }

  /**
   * Configurar API key para um provedor
   */
  setProviderApiKey(provider: LLMProvider, apiKey: string) {
    const config = this.configs.get(provider);
    if (config) {
      config.apiKey = apiKey;
      console.log(`[ORCHESTRATOR] API key configurada para ${provider}`);
    }
  }

  /**
   * Limpar cache de respostas
   */
  clearCache() {
    this.responseCache.clear();
    console.log("[ORCHESTRATOR] Cache de respostas limpo");
  }
}

// Exportar instância global
export const llmOrchestrator = new LLMOrchestrator();
