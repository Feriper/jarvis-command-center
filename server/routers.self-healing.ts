/**
 * Roteadores para Self-Healing e Automação de Testes
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { selfHealingEngine } from "./self-healing";
import * as db from "./db";

export const selfHealingRouter = router({
  /**
   * Executar testes e iniciar detecção de bugs
   */
  runTests: protectedProcedure
    .input(z.object({ projectPath: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const testResult = await selfHealingEngine.runTestsAndDetectBugs(
          input.projectPath || process.cwd()
        );

        // Salvar resultado na memória
        await db.saveMemory({
          userId: ctx.user.id,
          key: `test_result_${Date.now()}`,
          value: JSON.stringify(testResult),
          category: "testing",
          importance: 8,
        });

        return {
          success: true,
          testResult,
          timestamp: new Date(),
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Obter relatório de bugs e status de self-healing
   */
  getReport: protectedProcedure.query(async ({ ctx }) => {
    const report = selfHealingEngine.getReport();

    return {
      report,
      timestamp: new Date(),
    };
  }),

  /**
   * Ativar/desativar self-healing automático
   */
  setAutoHealing: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.saveMemory({
        userId: ctx.user.id,
        key: "auto_healing_enabled",
        value: JSON.stringify(input.enabled),
        category: "settings",
        importance: 9,
      });

      return {
        success: true,
        message: `Auto-healing ${input.enabled ? "ativado" : "desativado"}`,
        enabled: input.enabled,
      };
    }),

  /**
   * Obter histórico de testes
   */
  getTestHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const memory = await db.getMemory(ctx.user.id, "testing");
      const limit = input.limit || 10;

      return {
        history: memory
          .slice(0, limit)
          .map((m) => JSON.parse(m.value)),
        total: memory.length,
      };
    }),

  /**
   * Limpar histórico de bugs
   */
  clearBugHistory: protectedProcedure.mutation(async ({ ctx }) => {
    selfHealingEngine.clearHistory();

    return {
      success: true,
      message: "Histórico de bugs limpo",
    };
  }),

  /**
   * Gerar relatório de cobertura de testes
   */
  getCoverageReport: protectedProcedure.query(async ({ ctx }) => {
    const report = selfHealingEngine.getReport();
    const avgCoverage =
      report.testResults.length > 0
        ? report.testResults.reduce((sum, r) => sum + r.coverage, 0) /
          report.testResults.length
        : 0;

    return {
      averageCoverage: avgCoverage.toFixed(2),
      totalTests: report.testResults.reduce((sum, r) => sum + r.passed, 0),
      totalFailures: report.totalBugs,
      fixedBugs: report.fixedBugs,
      timestamp: new Date(),
    };
  }),
});
