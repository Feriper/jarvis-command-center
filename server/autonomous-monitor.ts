/**
 * Monitor Autônomo 24h do JARVIS
 * Executa vigilância contínua sobre métricas, alertas e oportunidades
 */

import * as db from "./db";
import * as dbProactive from "./db.proactive";
import { invokeLLM } from "./_core/llm";

interface MonitoringConfig {
  userId: number;
  checkIntervalMinutes: number;
  alertThresholds: {
    roiDropPercent: number;
    ctrDropPercent: number;
    engagementDropPercent: number;
  };
}

interface MonitoringResult {
  timestamp: Date;
  anomaliesDetected: number;
  opportunitiesFound: number;
  actionsRecommended: string[];
  alerts: Array<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    message: string;
  }>;
}

/**
 * Classe para gerenciar o monitoramento autônomo
 */
export class AutonomousMonitor {
  private config: MonitoringConfig;
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  /**
   * Iniciar o monitoramento 24h
   */
  async start() {
    if (this.isRunning) {
      console.log(`[JARVIS] Monitoramento já está em execução para usuário ${this.config.userId}`);
      return;
    }

    this.isRunning = true;
    console.log(
      `[JARVIS] Iniciando monitoramento autônomo para usuário ${this.config.userId}`
    );

    // Executar verificação imediata
    await this.performMonitoringCycle();

    // Agendar verificações periódicas
    this.monitoringInterval = setInterval(
      () => this.performMonitoringCycle(),
      this.config.checkIntervalMinutes * 60 * 1000
    );
  }

  /**
   * Parar o monitoramento
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    console.log(`[JARVIS] Monitoramento parado para usuário ${this.config.userId}`);
  }

  /**
   * Executar um ciclo de monitoramento
   */
  private async performMonitoringCycle(): Promise<MonitoringResult> {
    try {
      console.log(
        `[JARVIS] Ciclo de monitoramento iniciado - ${new Date().toISOString()}`
      );

      const result: MonitoringResult = {
        timestamp: new Date(),
        anomaliesDetected: 0,
        opportunitiesFound: 0,
        actionsRecommended: [],
        alerts: [],
      };

      // 1. Verificar anomalias em campanhas de Ads
      const campaigns = await db.getAdCampaigns(this.config.userId);
      for (const campaign of campaigns) {
        const metrics = await db.getAdMetrics(campaign.id);
        const anomalies = await dbProactive.detectCampaignAnomalies(
          campaign.id,
          this.config.alertThresholds.ctrDropPercent / 100
        );

        if (anomalies && anomalies.length > 0) {
          result.anomaliesDetected += anomalies.length;
          for (const anomaly of anomalies) {
            result.alerts.push({
              type: "ads_anomaly",
              severity: "high",
              message: `Anomalia detectada em ${campaign.campaignName}: ${anomaly}`,
            });
          }
        }
      }

      // 2. Verificar oportunidades de crescimento
      const opportunities = await this.identifyOpportunities();
      result.opportunitiesFound = opportunities.length;
      result.actionsRecommended = opportunities;

      // 3. Gerar recomendações usando IA
      if (result.anomaliesDetected > 0 || result.opportunitiesFound > 0) {
        const recommendations = await this.generateRecommendations(result);
        result.actionsRecommended.push(...recommendations);
      }

      // 4. Salvar relatório de monitoramento
      await this.saveMonitoringReport(result);

      // 5. Enviar alertas críticos
      if (result.alerts.some((a) => a.severity === "critical")) {
        await this.sendCriticalAlerts(result);
      }

      console.log(
        `[JARVIS] Ciclo concluído: ${result.anomaliesDetected} anomalias, ${result.opportunitiesFound} oportunidades`
      );

      return result;
    } catch (error) {
      console.error("[JARVIS] Erro durante ciclo de monitoramento:", error);
      throw error;
    }
  }

  /**
   * Identificar oportunidades de crescimento
   */
  private async identifyOpportunities(): Promise<string[]> {
    const opportunities: string[] = [];

    try {
      // Analisar horários de pico
      const campaigns = await db.getAdCampaigns(this.config.userId);
      for (const campaign of campaigns) {
        const metrics = await db.getAdMetrics(campaign.id);
        if (metrics.length > 0) {
          const peakHours = this.analyzePeakHours(metrics);
          if (peakHours.length > 0) {
            opportunities.push(
              `Aumentar orçamento durante horas de pico: ${peakHours.join(", ")}`
            );
          }
        }
      }

      // Analisar crescimento de redes sociais
      const socialAccounts = await db.getSocialAccounts(this.config.userId);
      if (socialAccounts.length > 0) {
        opportunities.push(
          `${socialAccounts.length} contas de redes sociais monitoradas para crescimento`
        );
      }
    } catch (error) {
      console.error("Erro ao identificar oportunidades:", error);
    }

    return opportunities;
  }

  /**
   * Analisar horas de pico
   */
  private analyzePeakHours(metrics: any[]): string[] {
    const hourlyData: Record<number, number> = {};

    for (const metric of metrics) {
      const hour = new Date(metric.date).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + (metric.clicks || 0);
    }

    const sorted = Object.entries(hourlyData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return sorted;
  }

  /**
   * Gerar recomendações usando IA
   */
  private async generateRecommendations(
    result: MonitoringResult
  ): Promise<string[]> {
    try {
      const alertSummary = result.alerts
        .map((a) => `${a.type}: ${a.message}`)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um estrategista de negócios. Forneça 3 recomendações acionáveis e prioritárias.",
          },
          {
            role: "user",
            content: `Baseado nestes alertas e oportunidades:\n${alertSummary}\n\nForneça recomendações específicas e mensuráveis.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const contentStr =
        typeof content === "string" ? content : JSON.stringify(content || "");

      return contentStr.split("\n").filter((r) => r.trim().length > 0);
    } catch (error) {
      console.error("Erro ao gerar recomendações:", error);
      return [];
    }
  }

  /**
   * Salvar relatório de monitoramento
   */
  private async saveMonitoringReport(result: MonitoringResult) {
    try {
      await db.saveMemory({
        userId: this.config.userId,
        key: `monitoring_report_${Date.now()}`,
        value: JSON.stringify(result),
        category: "monitoring",
        importance: result.alerts.some((a) => a.severity === "critical")
          ? 10
          : 5,
      });
    } catch (error) {
      console.error("Erro ao salvar relatório:", error);
    }
  }

  /**
   * Enviar alertas críticos
   */
  private async sendCriticalAlerts(result: MonitoringResult) {
    try {
      const criticalAlerts = result.alerts.filter(
        (a) => a.severity === "critical"
      );

      for (const alert of criticalAlerts) {
        await db.createAlert({
          userId: this.config.userId,
          type: alert.type,
          title: "Alerta crítico do monitor autônomo",
          message: alert.message,
          severity: "critical",
          read: false,
        });
      }

      console.log(
        `[JARVIS] ${criticalAlerts.length} alertas críticos enviados`
      );
    } catch (error) {
      console.error("Erro ao enviar alertas críticos:", error);
    }
  }

  /**
   * Obter status do monitoramento
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      userId: this.config.userId,
      checkIntervalMinutes: this.config.checkIntervalMinutes,
      lastCheck: new Date(),
    };
  }
}

/**
 * Gerenciador global de monitores
 */
export class MonitoringManager {
  private monitors: Map<number, AutonomousMonitor> = new Map();

  /**
   * Iniciar monitoramento para um usuário
   */
  startMonitoring(userId: number, config: Partial<MonitoringConfig> = {}) {
    if (this.monitors.has(userId)) {
      console.log(`[JARVIS] Monitoramento já ativo para usuário ${userId}`);
      return;
    }

    const fullConfig: MonitoringConfig = {
      userId,
      checkIntervalMinutes: config.checkIntervalMinutes || 15,
      alertThresholds: {
        roiDropPercent: config.alertThresholds?.roiDropPercent || 20,
        ctrDropPercent: config.alertThresholds?.ctrDropPercent || 15,
        engagementDropPercent:
          config.alertThresholds?.engagementDropPercent || 25,
      },
    };

    const monitor = new AutonomousMonitor(fullConfig);
    monitor.start();
    this.monitors.set(userId, monitor);
  }

  /**
   * Parar monitoramento para um usuário
   */
  stopMonitoring(userId: number) {
    const monitor = this.monitors.get(userId);
    if (monitor) {
      monitor.stop();
      this.monitors.delete(userId);
    }
  }

  /**
   * Obter status de um monitor
   */
  getMonitorStatus(userId: number) {
    const monitor = this.monitors.get(userId);
    return monitor ? monitor.getStatus() : null;
  }

  /**
   * Obter todos os monitores ativos
   */
  getAllActiveMonitors() {
    return Array.from(this.monitors.entries()).map(([userId, monitor]) => ({
      userId,
      status: monitor.getStatus(),
    }));
  }
}

// Exportar instância global
export const monitoringManager = new MonitoringManager();
