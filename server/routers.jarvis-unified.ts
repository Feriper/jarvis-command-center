/**
 * JARVIS Unified Router
 * Integra memória, proatividade, persona e contexto em um único ponto de entrada
 * Substitui o router.ts chat.sendMessage com versão aprimorada
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import {
  buildJarvisSystemMessage,
  UserContext,
  generateJarvisSystemPrompt,
} from "./jarvis-system-prompt";
import { createMemoryManager } from "./jarvis-memory-manager";
import { createProactiveEngine } from "./jarvis-proactive-engine";

/**
 * Router unificado do JARVIS
 * Combina chat, memória, proatividade e persona
 */
export const jarvisUnifiedRouter = router({
  /**
   * Enviar mensagem com contexto completo do JARVIS
   * Carrega memória, detecta proatividade, aplica persona
   */
  sendMessageWithContext: protectedProcedure
    .input(
      z.object({
        conversationId: z.number().optional(),
        content: z.string(),
        imageUrl: z.string().optional(),
        includeProactiveInsights: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let convId = input.conversationId;

        // 1. Criar conversa se necessário
        if (!convId) {
          const result = await db.createConversation({
            userId: ctx.user.id,
            title: input.content.substring(0, 30) + "...",
          });
          convId = (result as any).insertId;
        }

        // 2. Salvar mensagem do usuário
        await db.saveMessage({
          conversationId: convId!,
          role: "user",
          content: input.content,
          metadata: input.imageUrl ? { imageUrl: input.imageUrl } : undefined,
        });

        // 3. Carregar contexto de memória
        const memoryManager = createMemoryManager(ctx.user.id, convId!);
        const memoryWindow = await memoryManager.loadMemoryWindow(15);
        const memoryContext = memoryManager.formatMemoryAsContext(memoryWindow);

        // 4. Gerar contexto do usuário
        const userContext: UserContext = {
          userId: ctx.user.id,
          userName: ctx.user.name || "Sir",
          workloadLevel: await estimateWorkloadLevel(ctx.user.id),
          recentGoals: await extractRecentGoals(ctx.user.id),
          preferences: {
            formalityLevel: "professional",
            responseLength: "balanced",
            alertThreshold: "moderate",
          },
        };

        // 5. Construir mensagens com sistema JARVIS
        const messages: any[] = [
          buildJarvisSystemMessage(userContext),
        ];

        // Adicionar contexto de memória se houver
        if (memoryContext.trim()) {
          messages.push({
            role: "system",
            content: `## MEMORY CONTEXT\n${memoryContext}`,
          });
        }

        // Adicionar histórico recente
        for (const msg of memoryWindow.recentMessages) {
          messages.push({
            role: msg.role,
            content: msg.content,
          });
        }

        // Adicionar mensagem atual com imagem se houver
        if (input.imageUrl) {
          messages.push({
            role: "user",
            content: [
              { type: "text", text: input.content },
              { type: "image_url", image_url: { url: input.imageUrl } },
            ],
          });
        } else {
          messages.push({
            role: "user",
            content: input.content,
          });
        }

        // 6. Chamar LLM com contexto completo
        const response = await invokeLLM({ messages });
        const aiContent =
          response.choices[0]?.message?.content ||
          "Desculpe, senhor. Tive um erro no processamento.";

        // 7. Salvar resposta da IA
        await db.saveMessage({
          conversationId: convId!,
          role: "assistant",
          content:
            typeof aiContent === "string"
              ? aiContent
              : JSON.stringify(aiContent),
        });

        // 8. Extrair e salvar fatos automaticamente
        const extractedFacts = await memoryManager.extractAndSaveFactsFromMessage(
          input.content,
          typeof aiContent === "string" ? aiContent : JSON.stringify(aiContent)
        );

        // 9. Gerar insights proativos se solicitado
        let proactiveMessage = "";
        if (input.includeProactiveInsights) {
          const proactiveEngine = createProactiveEngine(ctx.user.id);
          const proactiveContext = await proactiveEngine.analyzeAndGenerateInsights();

          // Comunicar apenas insights críticos ou oportunidades relevantes
          if (
            proactiveContext.urgentItems.length > 0 ||
            proactiveContext.opportunityItems.length > 0
          ) {
            proactiveMessage = proactiveEngine.formatInsightsAsMessage(
              proactiveContext
            );
          }
        }

        // 10. Combinar resposta com insights proativos
        let finalResponse = typeof aiContent === "string" ? aiContent : JSON.stringify(aiContent);

        if (proactiveMessage) {
          finalResponse += `\n\n---\n\n${proactiveMessage}`;
        }

        return {
          content: finalResponse,
          conversationId: convId,
          factsExtracted: extractedFacts.length,
          memoryLoaded: memoryWindow.importantFacts.length,
          proactiveInsightsIncluded: proactiveMessage ? true : false,
        };
      } catch (error) {
        console.error("[JARVIS_UNIFIED] Erro ao enviar mensagem:", error);
        throw error;
      }
    }),

  /**
   * Carregar contexto completo de uma conversa
   * Útil para UI pré-carregar memória
   */
  loadConversationContext: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const memoryManager = createMemoryManager(ctx.user.id, input.conversationId);
        const memoryWindow = await memoryManager.loadMemoryWindow(20);

        return {
          recentMessages: memoryWindow.recentMessages,
          importantFacts: memoryWindow.importantFacts,
          conversationSummary: memoryWindow.conversationSummary,
          contextualAlerts: memoryWindow.contextualAlerts,
        };
      } catch (error) {
        console.error("[JARVIS_UNIFIED] Erro ao carregar contexto:", error);
        return {
          recentMessages: [],
          importantFacts: [],
          contextualAlerts: [],
        };
      }
    }),

  /**
   * Gerar resumo automático de uma conversa
   */
  summarizeConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const messages = await db.getMessages(input.conversationId);

        if (messages.length === 0) {
          return { success: false, message: "No messages to summarize" };
        }

        const memoryManager = createMemoryManager(ctx.user.id, input.conversationId);
        const summary = await memoryManager.generateConversationSummary(messages);

        // Salvar resumo na conversa
        await db.updateConversation(input.conversationId, {
          summary: JSON.stringify(summary),
        });

        return {
          success: true,
          summary: summary.summary,
          keyPoints: summary.keyPoints,
          decisions: summary.decisions,
          nextSteps: summary.nextSteps,
        };
      } catch (error) {
        console.error("[JARVIS_UNIFIED] Erro ao resumir conversa:", error);
        return { success: false, message: "Error summarizing conversation" };
      }
    }),

  /**
   * Obter insights proativos para o usuário
   */
  getProactiveInsights: protectedProcedure.query(async ({ ctx }) => {
    try {
      const proactiveEngine = createProactiveEngine(ctx.user.id);
      const context = await proactiveEngine.analyzeAndGenerateInsights();

      return {
        urgentItems: context.urgentItems,
        opportunityItems: context.opportunityItems,
        suggestedActions: context.suggestedActions,
        totalInsights: context.insights.length,
      };
    } catch (error) {
      console.error("[JARVIS_UNIFIED] Erro ao obter insights:", error);
      return {
        urgentItems: [],
        opportunityItems: [],
        suggestedActions: [],
        totalInsights: 0,
      };
    }
  }),

  /**
   * Obter fatos salvos sobre o usuário
   */
  getUserFacts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const facts = await db.getMemory(ctx.user.id);

      if (!facts) {
        return [];
      }

      return facts
        .filter((f: any) => f.importance >= 2)
        .sort((a: any, b: any) => b.importance - a.importance)
        .map((f: any) => ({
          id: f.id,
          type: f.category,
          content: f.value,
          importance: f.importance,
          createdAt: f.createdAt,
        }));
    } catch (error) {
      console.error("[JARVIS_UNIFIED] Erro ao obter fatos:", error);
      return [];
    }
  }),

  /**
   * Salvar preferência do usuário
   */
  updateUserPreference: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.any(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.saveMemory({
          userId: ctx.user.id,
          key: `preference_${input.key}`,
          value: JSON.stringify(input.value),
          category: "preference",
          importance: 4,
        });

        return { success: true };
      } catch (error) {
        console.error("[JARVIS_UNIFIED] Erro ao atualizar preferência:", error);
        return { success: false };
      }
    }),
});

/**
 * Métodos auxiliares privados
 */

/**
 * Estimar nível de carga de trabalho do usuário
 */
async function estimateWorkloadLevel(
  userId: number
): Promise<"light" | "normal" | "heavy" | "critical"> {
  try {
    const tasks = await db.getTasks?.(userId);
    const incompleteTasks = tasks?.filter((t: any) => !t.completed) || [];

    if (incompleteTasks.length > 10) return "critical";
    if (incompleteTasks.length > 5) return "heavy";
    if (incompleteTasks.length > 2) return "normal";
    return "light";
  } catch {
    return "normal";
  }
}

/**
 * Extrair metas recentes do usuário
 */
async function extractRecentGoals(userId: number): Promise<string[]> {
  try {
    const facts = await db.getMemory(userId);

    if (!facts) return [];

    return facts
      .filter((f: any) => f.category === "goal")
      .slice(0, 3)
      .map((f: any) => f.value);
  } catch {
    return [];
  }
}
