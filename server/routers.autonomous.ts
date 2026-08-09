/**
 * Roteadores para controlar o assistente autônomo 24h
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { monitoringManager } from "./autonomous-monitor";
import * as db from "./db";

export const autonomousRouter = router({
  /**
   * Iniciar monitoramento autônomo 24h
   */
  startMonitoring: protectedProcedure
    .input(
      z.object({
        checkIntervalMinutes: z.number().min(5).max(120).optional(),
        alertThresholds: z
          .object({
            roiDropPercent: z.number().optional(),
            ctrDropPercent: z.number().optional(),
            engagementDropPercent: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      monitoringManager.startMonitoring(ctx.user.id, {
        checkIntervalMinutes: input.checkIntervalMinutes ?? 15,
        alertThresholds: {
          roiDropPercent: input.alertThresholds?.roiDropPercent ?? 20,
          ctrDropPercent: input.alertThresholds?.ctrDropPercent ?? 20,
          engagementDropPercent: input.alertThresholds?.engagementDropPercent ?? 20,
        },
      });

      return {
        success: true,
        message: `[JARVIS_24H_ACTIVATED] Monitoramento autônomo iniciado. Verificações a cada ${input.checkIntervalMinutes || 15} minutos.`,
        userId: ctx.user.id,
        timestamp: new Date(),
      };
    }),

  /**
   * Parar monitoramento autônomo
   */
  stopMonitoring: protectedProcedure.mutation(async ({ ctx }) => {
    monitoringManager.stopMonitoring(ctx.user.id);

    return {
      success: true,
      message: "[JARVIS_24H_DEACTIVATED] Monitoramento autônomo parado.",
      userId: ctx.user.id,
      timestamp: new Date(),
    };
  }),

  /**
   * Obter status do monitoramento
   */
  getMonitoringStatus: protectedProcedure.query(async ({ ctx }) => {
    const status = monitoringManager.getMonitorStatus(ctx.user.id);

    return {
      isActive: status !== null,
      status,
      userId: ctx.user.id,
      timestamp: new Date(),
    };
  }),

  /**
   * Obter relatório de monitoramento recente
   */
  getMonitoringReport: protectedProcedure.query(async ({ ctx }) => {
    const memory = await db.getMemory(ctx.user.id, "monitoring");

    // Pegar o relatório mais recente
    const latestReport = memory
      .filter((m) => m.key?.startsWith("monitoring_report_"))
      .sort((a, b) => {
        const timeA = parseInt(a.key?.split("_")[2] || "0");
        const timeB = parseInt(b.key?.split("_")[2] || "0");
        return timeB - timeA;
      })[0];

    if (!latestReport) {
      return {
        hasReport: false,
        message: "Nenhum relatório de monitoramento disponível ainda",
      };
    }

    try {
      const report = JSON.parse(latestReport.value);
      return {
        hasReport: true,
        report,
        timestamp: latestReport.updatedAt,
      };
    } catch (error) {
      return {
        hasReport: false,
        message: "Erro ao processar relatório",
      };
    }
  }),

  /**
   * Configurar alertas personalizados
   */
  configureAlerts: protectedProcedure
    .input(
      z.object({
        enableCriticalAlerts: z.boolean().optional(),
        enableEmailNotifications: z.boolean().optional(),
        enablePushNotifications: z.boolean().optional(),
        alertCategories: z
          .array(
            z.enum([
              "ads_performance",
              "social_growth",
              "financial_anomaly",
              "opportunity",
            ])
          )
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Salvar configurações de alerta na memória do usuário
      await db.saveMemory({
        userId: ctx.user.id,
        key: "alert_config",
        value: JSON.stringify(input),
        category: "settings",
        importance: 8,
      });

      return {
        success: true,
        message: "Configurações de alerta atualizadas",
        config: input,
        timestamp: new Date(),
      };
    }),

  /**
   * Obter histórico de alertas
   */
  getAlertHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional(),
        severity: z
          .enum(["low", "medium", "high", "critical"])
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let alerts = await db.getAlerts(ctx.user.id);

      // Filtrar por severidade se especificado
      if (input.severity) {
        alerts = alerts.filter((a) => a.severity === input.severity);
      }

      // Limitar resultados
      const limit = input.limit || 20;
      alerts = alerts.slice(0, limit);

      return {
        total: alerts.length,
        alerts,
        timestamp: new Date(),
      };
    }),

  /**
   * Marcar alerta como lido
   */
  markAlertAsRead: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Implementar lógica de marcar como lido
      return {
        success: true,
        message: "Alerta marcado como lido",
        alertId: input.alertId,
        timestamp: new Date(),
      };
    }),

  /**
   * Obter resumo executivo do dia
   */
  getDailyExecutiveSummary: protectedProcedure.query(async ({ ctx }) => {
    const alerts = await db.getAlerts(ctx.user.id);
    const campaigns = await db.getAdCampaigns(ctx.user.id);
    const tasks = await db.getTasks(ctx.user.id);

    const summary = {
      date: new Date().toLocaleDateString("pt-BR"),
      alertsCount: alerts.length,
      criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
      campaignsActive: campaigns.length,
      tasksCompleted: tasks.filter((t) => t.status === "completed").length,
      tasksPending: tasks.filter((t) => t.status === "pending").length,
      keyMetrics: {
        totalSpent: campaigns.reduce((sum, c) => sum + Number(c.budget ?? 0), 0),
        estimatedROI: Math.random() * 300, // Placeholder
      },
    };

    return {
      summary,
      timestamp: new Date(),
    };
  }),

  /**
   * Ativar modo vigilância máxima
   * Aumenta frequência de verificações e sensibilidade de alertas
   */
  activateMaxSurveillance: protectedProcedure.mutation(async ({ ctx }) => {
    monitoringManager.startMonitoring(ctx.user.id, {
      checkIntervalMinutes: 5, // Verificar a cada 5 minutos
      alertThresholds: {
        roiDropPercent: 10, // Mais sensível
        ctrDropPercent: 8,
        engagementDropPercent: 12,
      },
    });

    return {
      success: true,
      message:
        "[MAXIMUM_SURVEILLANCE_ACTIVATED] JARVIS em modo vigilância máxima. Verificações a cada 5 minutos com sensibilidade aumentada.",
      userId: ctx.user.id,
      timestamp: new Date(),
    };
  }),

  /**
   * Desativar modo vigilância máxima
   */
  deactivateMaxSurveillance: protectedProcedure.mutation(async ({ ctx }) => {
    monitoringManager.stopMonitoring(ctx.user.id);

    return {
      success: true,
      message: "[SURVEILLANCE_DEACTIVATED] Modo vigilância máxima desativado.",
      userId: ctx.user.id,
      timestamp: new Date(),
    };
  }),
});
