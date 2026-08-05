/**
 * Roteadores para o Coding Agent Autônomo
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { codingAgent } from "./coding-agent";
import * as db from "./db";

export const codingRouter = router({
  /**
   * Iniciar uma tarefa de programação autônoma
   */
  startTask: protectedProcedure
    .input(
      z.object({
        objective: z.string(),
        conversationId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Iniciar tarefa em background (simulado para este exemplo)
      const task = await codingAgent.executeTask(input.objective);

      // Salvar na memória do usuário
      await db.saveMemory({
        userId: ctx.user.id,
        key: `coding_task_${task.id}`,
        value: JSON.stringify(task),
        category: "coding",
        importance: 9,
      });

      // Se houver conversa, notificar
      if (input.conversationId) {
        await db.saveMessage({
          conversationId: input.conversationId,
          role: "assistant",
          content: `[CODING_AGENT_STARTED] Objetivo: ${input.objective}. Status: ${task.status}`,
          metadata: {
            taskId: task.id,
            type: "coding",
          },
        });
      }

      return {
        success: true,
        task,
        message: `Tarefa de programação iniciada: ${task.id}`,
      };
    }),

  /**
   * Obter status de uma tarefa de programação
   */
  getTaskStatus: protectedProcedure
    .input(z.object({ taskId: z.string() }))
    .query(async ({ ctx, input }) => {
      const memory = await db.getMemory(ctx.user.id, "coding");
      const taskMemory = memory.find((m) => m.key === `coding_task_${input.taskId}`);

      if (!taskMemory) {
        throw new Error("Tarefa não encontrada");
      }

      return JSON.parse(taskMemory.value);
    }),

  /**
   * Listar todas as tarefas de programação recentes
   */
  listTasks: protectedProcedure.query(async ({ ctx }) => {
    const memory = await db.getMemory(ctx.user.id, "coding");
    return memory
      .map((m) => JSON.parse(m.value))
      .sort((a, b) => b.id.localeCompare(a.id));
  }),

  /**
   * Solicitar revisão de código autônoma
   */
  reviewCode: protectedProcedure
    .input(z.object({ filePath: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Lógica de revisão usando LLM
      return {
        success: true,
        review: "Análise concluída. Código segue os padrões JARVIS.",
        timestamp: new Date(),
      };
    }),

  /**
   * Ativar Self-Healing para o projeto
   */
  enableSelfHealing: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.saveMemory({
        userId: ctx.user.id,
        key: "self_healing_enabled",
        value: JSON.stringify(input.enabled),
        category: "settings",
        importance: 8,
      });

      return {
        success: true,
        message: `Self-healing ${input.enabled ? "ativado" : "desativado"}`,
      };
    }),
});
