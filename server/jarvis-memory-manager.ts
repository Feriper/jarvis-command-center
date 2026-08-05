/**
 * JARVIS Memory Manager - Gerenciador de Memória Integrado
 * Carrega, gerencia e integra memória episódica, semântica e procedural
 * ao contexto de cada conversa
 */

import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export interface MemoryFact {
  id: string;
  userId: number;
  type: "preference" | "goal" | "contact" | "decision" | "insight" | "pattern";
  content: string;
  importance: 1 | 2 | 3 | 4 | 5; // 5 = crítico
  createdAt: Date;
  lastReferencedAt?: Date;
  relatedFacts?: string[];
}

export interface ConversationSummary {
  conversationId: number;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  nextSteps: string[];
  createdAt: Date;
}

export interface MemoryWindow {
  recentMessages: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>;
  importantFacts: MemoryFact[];
  conversationSummary?: ConversationSummary;
  contextualAlerts: Array<{
    type: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
  }>;
}

/**
 * Gerenciador de Memória do JARVIS
 */
export class JarvisMemoryManager {
  private userId: number;
  private conversationId: number;

  constructor(userId: number, conversationId: number) {
    this.userId = userId;
    this.conversationId = conversationId;
  }

  /**
   * Carregar janela de memória completa para uma conversa
   * Inclui: histórico recente, fatos importantes, resumo anterior, alertas
   */
  async loadMemoryWindow(maxMessages: number = 20): Promise<MemoryWindow> {
    try {
      // 1. Carregar mensagens recentes
      const recentMessages = await this.loadRecentMessages(maxMessages);

      // 2. Carregar fatos importantes
      const importantFacts = await this.loadImportantFacts();

      // 3. Carregar resumo de conversa anterior
      const conversationSummary = await this.loadConversationSummary();

      // 4. Carregar alertas contextuais
      const contextualAlerts = await this.loadContextualAlerts();

      return {
        recentMessages,
        importantFacts,
        conversationSummary,
        contextualAlerts,
      };
    } catch (error) {
      console.error("[JARVIS_MEMORY] Erro ao carregar janela de memória:", error);
      return {
        recentMessages: [],
        importantFacts: [],
        contextualAlerts: [],
      };
    }
  }

  /**
   * Carregar mensagens recentes da conversa
   */
  private async loadRecentMessages(
    maxMessages: number
  ): Promise<MemoryWindow["recentMessages"]> {
    try {
      const messages = await db.getMessages(this.conversationId);

      // Retornar apenas as últimas N mensagens
      return messages
        .slice(-maxMessages)
        .map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        }));
    } catch (error) {
      console.error("[JARVIS_MEMORY] Erro ao carregar mensagens recentes:", error);
      return [];
    }
  }

  /**
   * Carregar fatos importantes do usuário
   */
  private async loadImportantFacts(): Promise<MemoryFact[]> {
    try {
      const allFacts = await db.getMemory(this.userId);

      if (!allFacts || allFacts.length === 0) {
        return [];
      }

      // Filtrar e ordenar por importância
      return allFacts
        .filter((fact: any) => fact.importance >= 3) // Apenas fatos importantes
        .sort((a: any, b: any) => {
          // Ordenar por: importância (desc), data (desc)
          if (b.importance !== a.importance) {
            return b.importance - a.importance;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, 10) // Top 10 fatos
        .map((fact: any) => ({
          id: fact.id,
          userId: fact.userId,
          type: fact.category,
          content: fact.value,
          importance: fact.importance,
          createdAt: new Date(fact.createdAt),
          lastReferencedAt: fact.lastReferencedAt ? new Date(fact.lastReferencedAt) : undefined,
        }));
    } catch (error) {
      console.error("[JARVIS_MEMORY] Erro ao carregar fatos importantes:", error);
      return [];
    }
  }

  /**
   * Carregar resumo de conversa anterior
   */
  private async loadConversationSummary(): Promise<ConversationSummary | undefined> {
    try {
      // Buscar conversa anterior
      const conversations = await db.getConversations(this.userId);
      const previousConversation = conversations
        .filter((c: any) => c.id !== this.conversationId)
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .at(0);

      if (!previousConversation || !previousConversation.summary) {
        return undefined;
      }

      // Parsear resumo salvo
      try {
        const summary = JSON.parse(previousConversation.summary);
        return {
          conversationId: previousConversation.id,
          summary: summary.summary || "",
          keyPoints: summary.keyPoints || [],
          decisions: summary.decisions || [],
          nextSteps: summary.nextSteps || [],
          createdAt: new Date(previousConversation.createdAt),
        };
      } catch {
        return {
          conversationId: previousConversation.id,
          summary: previousConversation.summary,
          keyPoints: [],
          decisions: [],
          nextSteps: [],
          createdAt: new Date(previousConversation.createdAt),
        };
      }
    } catch (error) {
      console.error("[JARVIS_MEMORY] Erro ao carregar resumo de conversa:", error);
      return undefined;
    }
  }

  /**
   * Carregar alertas contextuais
   */
  private async loadContextualAlerts(): Promise<MemoryWindow["contextualAlerts"]> {
    try {
      const alerts = await db.getAlerts?.(this.userId);

      if (!alerts || alerts.length === 0) {
        return [];
      }

      // Retornar apenas alertas não lidos ou críticos
      return alerts
        .filter((alert: any) => !alert.isRead || alert.severity === "critical")
        .slice(0, 5) // Top 5 alertas
        .map((alert: any) => ({
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
        }));
    } catch (error) {
      console.error("[JARVIS_MEMORY] Erro ao carregar alertas contextuais:", error);
      return [];
    }
  }

  /**
   * Extrair e salvar fatos automaticamente de uma mensagem
   */
  async extractAndSaveFactsFromMessage(
    userMessage: string,
    assistantResponse: string
  ): Promise<MemoryFact[]> {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a fact extraction specialist. Analyze the conversation and extract key facts about the user.
            
Extract facts in these categories:
- preference: User's likes, dislikes, working style
- goal: User's stated objectives or aspirations
- contact: Important people, companies, or resources mentioned
- decision: Decisions the user has made
- insight: Important insights or patterns discovered
- pattern: Behavioral or business patterns

Return a JSON array with objects: { type, content, importance (1-5) }
Only extract facts that are clearly stated or strongly implied.
Return empty array if no facts found.`,
          },
          {
            role: "user",
            content: `User message: "${userMessage}"
Assistant response: "${assistantResponse}"

Extract facts from this conversation.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : JSON.stringify(content || "");

      // Parsear resposta JSON
      const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const extractedFacts = JSON.parse(jsonMatch[0]);
      const savedFacts: MemoryFact[] = [];

      for (const fact of extractedFacts) {
        try {
          await db.saveMemory({
            userId: this.userId,
            key: `fact_${Date.now()}_${Math.random()}`,
            value: fact.content,
            category: fact.type,
            importance: fact.importance || 2,
          });

          savedFacts.push({
            id: `fact_${Date.now()}`,
            userId: this.userId,
            type: fact.type,
            content: fact.content,
            importance: fact.importance || 2,
            createdAt: new Date(),
          });
        } catch (error) {
          console.error("[JARVIS_MEMORY] Erro ao salvar fato:", error);
        }
      }

      if (savedFacts.length > 0) {
        console.log(`[JARVIS_MEMORY] ${savedFacts.length} fatos extraídos e salvos`);
      }

      return savedFacts;
    } catch (error) {
      console.error("[JARVIS_MEMORY] Erro ao extrair fatos:", error);
      return [];
    }
  }

  /**
   * Gerar resumo automático de uma conversa longa
   */
  async generateConversationSummary(messages: any[]): Promise<ConversationSummary> {
    try {
      // Construir histórico de conversa
      const conversationText = messages
        .map((msg: any) => `${msg.role}: ${msg.content}`)
        .join("\n\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a conversation summarizer. Create a concise summary of the conversation.
            
Return a JSON object with:
- summary: 2-3 sentence overview
- keyPoints: Array of 3-5 key points discussed
- decisions: Array of decisions made
- nextSteps: Array of next steps or action items

Be concise and focus on actionable information.`,
          },
          {
            role: "user",
            content: `Summarize this conversation:\n\n${conversationText}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : JSON.stringify(content || "");

      const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          conversationId: this.conversationId,
          summary: "Conversa realizada",
          keyPoints: [],
          decisions: [],
          nextSteps: [],
          createdAt: new Date(),
        };
      }

      const summaryData = JSON.parse(jsonMatch[0]);

      return {
        conversationId: this.conversationId,
        summary: summaryData.summary,
        keyPoints: summaryData.keyPoints || [],
        decisions: summaryData.decisions || [],
        nextSteps: summaryData.nextSteps || [],
        createdAt: new Date(),
      };
    } catch (error) {
      console.error("[JARVIS_MEMORY] Erro ao gerar resumo:", error);
      return {
        conversationId: this.conversationId,
        summary: "Erro ao gerar resumo",
        keyPoints: [],
        decisions: [],
        nextSteps: [],
        createdAt: new Date(),
      };
    }
  }

  /**
   * Formatar memória como contexto de texto para o prompt
   */
  formatMemoryAsContext(memoryWindow: MemoryWindow): string {
    let context = "";

    // Adicionar fatos importantes
    if (memoryWindow.importantFacts.length > 0) {
      context += "## IMPORTANT FACTS ABOUT THE USER\n";
      memoryWindow.importantFacts.forEach((fact) => {
        context += `- [${fact.type}] ${fact.content}\n`;
      });
      context += "\n";
    }

    // Adicionar resumo de conversa anterior
    if (memoryWindow.conversationSummary) {
      context += "## PREVIOUS CONVERSATION SUMMARY\n";
      context += `${memoryWindow.conversationSummary.summary}\n`;
      if (memoryWindow.conversationSummary.nextSteps.length > 0) {
        context += `Next steps from last conversation: ${memoryWindow.conversationSummary.nextSteps.join(", ")}\n`;
      }
      context += "\n";
    }

    // Adicionar alertas contextuais
    if (memoryWindow.contextualAlerts.length > 0) {
      context += "## CONTEXTUAL ALERTS\n";
      memoryWindow.contextualAlerts.forEach((alert) => {
        context += `- [${alert.severity.toUpperCase()}] ${alert.message}\n`;
      });
      context += "\n";
    }

    return context;
  }
}

/**
 * Factory para criar gerenciador de memória
 */
export function createMemoryManager(userId: number, conversationId: number) {
  return new JarvisMemoryManager(userId, conversationId);
}
