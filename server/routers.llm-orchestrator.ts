/**
 * Roteadores para o Orchestrador de LLMs Multimodal
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { llmOrchestrator, LLMProvider, TaskType } from "./llm-orchestrator";
import * as db from "./db";

export const llmOrchestratorRouter = router({
  /**
   * Invocar um modelo específico
   */
  invokeModel: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["manus", "chatgpt", "deepseek", "grok", "claude"]),
        query: z.string(),
        conversationId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await llmOrchestrator.multimodalConversation(
          input.provider as LLMProvider,
          input.query,
          input.conversationId ? `conv_${input.conversationId}` : undefined
        );

        // Salvar na conversa se fornecido
        if (input.conversationId) {
          await db.saveMessage({
            conversationId: input.conversationId,
            role: "assistant",
            content: response.content,
            metadata: {
              provider: input.provider,
              model: response.model,
              executionTime: response.executionTime,
            },
          });
        }

        return {
          success: true,
          response: {
            provider: input.provider,
            content: response.content,
            executionTime: response.executionTime,
            tokensUsed: response.tokensUsed,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: `Erro ao invocar ${input.provider}: ${error}`,
        };
      }
    }),

  /**
   * Roteamento automático para o melhor modelo
   */
  autoRoute: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        taskType: z
          .enum([
            "general",
            "coding",
            "analysis",
            "creative",
            "research",
            "reasoning",
            "summarization",
          ])
          .optional(),
        conversationId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const taskType = (input.taskType || "general") as TaskType;
        const response = await llmOrchestrator.routeToOptimalModel(
          input.query,
          taskType
        );

        // Salvar na conversa
        if (input.conversationId) {
          await db.saveMessage({
            conversationId: input.conversationId,
            role: "assistant",
            content: response.content,
            metadata: {
              provider: response.provider,
              model: response.model,
              taskType,
              autoRouted: true,
            },
          });
        }

        return {
          success: true,
          response: {
            provider: response.provider,
            model: response.model,
            content: response.content,
            executionTime: response.executionTime,
            taskType,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: `Erro no roteamento automático: ${error}`,
        };
      }
    }),

  /**
   * Comparar respostas de múltiplos modelos
   */
  compareModels: protectedProcedure
    .input(
      z.object({
        query: z.string(),
        providers: z
          .array(z.enum(["manus", "chatgpt", "deepseek", "grok", "claude"]))
          .optional(),
        taskType: z
          .enum([
            "general",
            "coding",
            "analysis",
            "creative",
            "research",
            "reasoning",
            "summarization",
          ])
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const taskType = (input.taskType || "general") as TaskType;
        const providers = input.providers as LLMProvider[] | undefined;

        const comparison = await llmOrchestrator.compareModels(
          input.query,
          providers,
          taskType
        );

        // Salvar comparação na memória
        await db.saveMemory({
          userId: ctx.user.id,
          key: `llm_comparison_${Date.now()}`,
          value: JSON.stringify({
            query: input.query,
            bestProvider: comparison.bestResponse.provider,
            responses: comparison.responses.map((r) => ({
              provider: r.provider,
              model: r.model,
              executionTime: r.executionTime,
            })),
          }),
          category: "llm_comparisons",
          importance: 7,
        });

        return {
          success: true,
          comparison: {
            query: input.query,
            responses: comparison.responses.map((r) => ({
              provider: r.provider,
              model: r.model,
              content: r.content.substring(0, 200) + "...",
              executionTime: r.executionTime,
            })),
            bestResponse: {
              provider: comparison.bestResponse.provider,
              content: comparison.bestResponse.content,
            },
            analysis: comparison.analysis,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: `Erro ao comparar modelos: ${error}`,
        };
      }
    }),

  /**
   * Obter status de todos os modelos
   */
  getModelsStatus: protectedProcedure.query(async ({ ctx }) => {
    const status = llmOrchestrator.getModelsStatus();

    return {
      models: status,
      totalAvailable: status.filter((m) => m.available).length,
      timestamp: new Date(),
    };
  }),

  /**
   * Configurar API key para um provedor
   */
  configureProvider: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["manus", "chatgpt", "deepseek", "grok", "claude"]),
        apiKey: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        llmOrchestrator.setProviderApiKey(
          input.provider as LLMProvider,
          input.apiKey
        );

        // Salvar configuração na memória do usuário
        await db.saveMemory({
          userId: ctx.user.id,
          key: `provider_config_${input.provider}`,
          value: JSON.stringify({ configured: true, timestamp: new Date() }),
          category: "provider_configs",
          importance: 9,
        });

        return {
          success: true,
          message: `Provedor ${input.provider} configurado com sucesso`,
          provider: input.provider,
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: `Erro ao configurar provedor: ${error}`,
        };
      }
    }),

  /**
   * Conversa contínua com um modelo específico
   */
  continuousConversation: protectedProcedure
    .input(
      z.object({
        provider: z.enum(["manus", "chatgpt", "deepseek", "grok", "claude"]),
        message: z.string(),
        conversationId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await llmOrchestrator.multimodalConversation(
          input.provider as LLMProvider,
          input.message,
          `conv_${input.conversationId}`
        );

        // Salvar mensagem na conversa
        await db.saveMessage({
          conversationId: input.conversationId,
          role: "user",
          content: input.message,
        });

        await db.saveMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: response.content,
          metadata: {
            provider: input.provider,
            model: response.model,
          },
        });

        return {
          success: true,
          response: {
            provider: input.provider,
            content: response.content,
            executionTime: response.executionTime,
          },
          timestamp: new Date(),
        };
      } catch (error) {
        return {
          success: false,
          error: `Erro na conversa contínua: ${error}`,
        };
      }
    }),

  /**
   * Limpar cache de respostas
   */
  clearCache: protectedProcedure.mutation(async ({ ctx }) => {
    llmOrchestrator.clearCache();

    return {
      success: true,
      message: "Cache de respostas limpo",
      timestamp: new Date(),
    };
  }),

  /**
   * Obter recomendação de melhor modelo para uma tarefa
   */
  getModelRecommendation: protectedProcedure
    .input(
      z.object({
        taskType: z.enum([
          "general",
          "coding",
          "analysis",
          "creative",
          "research",
          "reasoning",
          "summarization",
        ]),
      })
    )
    .query(async ({ ctx, input }) => {
      const recommendations: Record<string, string> = {
        coding: "DeepSeek (especializado em código)",
        analysis: "Manus (análise integrada)",
        creative: "Grok (criatividade e inovação)",
        research: "Manus (pesquisa profunda)",
        reasoning: "Claude (raciocínio avançado)",
        summarization: "Manus (síntese eficiente)",
        general: "Manus (uso geral)",
      };

      return {
        taskType: input.taskType,
        recommendation: recommendations[input.taskType],
        description: `Modelo recomendado para tarefas de ${input.taskType}`,
        timestamp: new Date(),
      };
    }),
});
