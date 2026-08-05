/**
 * JARVIS Proactive Engine - Engine de Proatividade Inteligente
 * Detecta oportunidades, anomalias e comunica proativamente ao usuário
 * Integra-se ao chat para sugestões contextuais
 */

import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export interface ProactiveInsight {
  id: string;
  userId: number;
  type: "opportunity" | "anomaly" | "alert" | "suggestion" | "prediction";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  supportingData?: Record<string, any>;
  recommendedAction?: string;
  confidence?: number; // 0-100
  createdAt: Date;
  communicatedAt?: Date;
  actionTaken?: boolean;
}

export interface ProactiveContext {
  insights: ProactiveInsight[];
  suggestedActions: string[];
  urgentItems: ProactiveInsight[];
  opportunityItems: ProactiveInsight[];
}

/**
 * Engine de Proatividade do JARVIS
 */
export class JarvisProactiveEngine {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Analisar contexto do usuário e gerar insights proativos
   */
  async analyzeAndGenerateInsights(): Promise<ProactiveContext> {
    try {
      console.log(`[JARVIS_PROACTIVE] Analisando contexto para usuário ${this.userId}`);

      const insights: ProactiveInsight[] = [];

      // 1. Detectar anomalias em campanhas de Ads
      const adAnomalies = await this.detectAdAnomalies();
      insights.push(...adAnomalies);

      // 2. Detectar oportunidades de crescimento
      const opportunities = await this.identifyOpportunities();
      insights.push(...opportunities);

      // 3. Verificar tarefas vencidas
      const overdueAlerts = await this.checkOverdueTasks();
      insights.push(...overdueAlerts);

      // 4. Analisar padrões comportamentais
      const patterns = await this.analyzeUserPatterns();
      insights.push(...patterns);

      // 5. Gerar sugestões baseadas em IA
      const aiSuggestions = await this.generateAISuggestions(insights);
      insights.push(...aiSuggestions);

      // Separar por tipo
      const urgentItems = insights.filter(
        (i) => i.severity === "critical" || i.severity === "high"
      );
      const opportunityItems = insights.filter((i) => i.type === "opportunity");

      // Gerar ações sugeridas
      const suggestedActions = this.generateSuggestedActions(insights);

      return {
        insights,
        suggestedActions,
        urgentItems,
        opportunityItems,
      };
    } catch (error) {
      console.error("[JARVIS_PROACTIVE] Erro ao analisar contexto:", error);
      return {
        insights: [],
        suggestedActions: [],
        urgentItems: [],
        opportunityItems: [],
      };
    }
  }

  /**
   * Detectar anomalias em campanhas de Ads
   */
  private async detectAdAnomalies(): Promise<ProactiveInsight[]> {
    try {
      const campaigns = await db.getAdCampaigns(this.userId);
      const anomalies: ProactiveInsight[] = [];

      for (const campaign of campaigns) {
        const metrics = await db.getAdMetrics(campaign.id);

        if (metrics.length < 2) continue;

        // Calcular mudanças percentuais
        const latest = metrics[metrics.length - 1];
        const previous = metrics[metrics.length - 2];

        const ctrChange =
          ((latest.ctr - previous.ctr) / previous.ctr) * 100;
        const roiChange =
          ((latest.roi - previous.roi) / previous.roi) * 100;

        // Detectar quedas significativas
        if (ctrChange < -20) {
          anomalies.push({
            id: `anomaly_${Date.now()}`,
            userId: this.userId,
            type: "anomaly",
            severity: ctrChange < -40 ? "high" : "medium",
            title: `CTR Drop in Campaign "${campaign.name}"`,
            description: `CTR decreased by ${Math.abs(ctrChange).toFixed(1)}% (${previous.ctr.toFixed(2)}% → ${latest.ctr.toFixed(2)}%)`,
            supportingData: {
              campaignId: campaign.id,
              campaignName: campaign.name,
              previousCTR: previous.ctr,
              currentCTR: latest.ctr,
              changePercent: ctrChange,
            },
            recommendedAction: "Review ad creative and audience targeting",
            confidence: 95,
            createdAt: new Date(),
          });
        }

        if (roiChange < -25) {
          anomalies.push({
            id: `anomaly_${Date.now()}`,
            userId: this.userId,
            type: "anomaly",
            severity: roiChange < -50 ? "critical" : "high",
            title: `ROI Drop in Campaign "${campaign.name}"`,
            description: `ROI decreased by ${Math.abs(roiChange).toFixed(1)}%`,
            supportingData: {
              campaignId: campaign.id,
              previousROI: previous.roi,
              currentROI: latest.roi,
              changePercent: roiChange,
            },
            recommendedAction: "Investigate conversion funnel and optimize bid strategy",
            confidence: 90,
            createdAt: new Date(),
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error("[JARVIS_PROACTIVE] Erro ao detectar anomalias:", error);
      return [];
    }
  }

  /**
   * Identificar oportunidades de crescimento
   */
  private async identifyOpportunities(): Promise<ProactiveInsight[]> {
    try {
      const opportunities: ProactiveInsight[] = [];
      const campaigns = await db.getAdCampaigns(this.userId);

      for (const campaign of campaigns) {
        const metrics = await db.getAdMetrics(campaign.id);

        if (metrics.length === 0) continue;

        const latest = metrics[metrics.length - 1];

        // Oportunidade: CTR acima da média
        if (latest.ctr > 3.5) {
          opportunities.push({
            id: `opp_${Date.now()}`,
            userId: this.userId,
            type: "opportunity",
            severity: "low",
            title: `High-Performing Campaign: "${campaign.name}"`,
            description: `Campaign CTR is ${latest.ctr.toFixed(2)}%, which is above industry average (3.0%)`,
            supportingData: {
              campaignId: campaign.id,
              currentCTR: latest.ctr,
              industryAverage: 3.0,
            },
            recommendedAction: "Consider scaling budget to maximize ROI on this high-performer",
            confidence: 85,
            createdAt: new Date(),
          });
        }

        // Oportunidade: Horários de pico
        const peakHours = this.analyzePeakHours(metrics);
        if (peakHours.length > 0) {
          opportunities.push({
            id: `opp_${Date.now()}`,
            userId: this.userId,
            type: "opportunity",
            severity: "low",
            title: `Peak Hours Identified for "${campaign.name}"`,
            description: `Highest engagement during hours: ${peakHours.join(", ")}`,
            supportingData: {
              campaignId: campaign.id,
              peakHours,
            },
            recommendedAction: "Increase bid multipliers during peak hours",
            confidence: 80,
            createdAt: new Date(),
          });
        }
      }

      return opportunities;
    } catch (error) {
      console.error("[JARVIS_PROACTIVE] Erro ao identificar oportunidades:", error);
      return [];
    }
  }

  /**
   * Verificar tarefas vencidas
   */
  private async checkOverdueTasks(): Promise<ProactiveInsight[]> {
    try {
      const alerts: ProactiveInsight[] = [];
      const tasks = await db.getTasks?.(this.userId);

      if (!tasks) return [];

      const now = new Date();

      for (const task of tasks) {
        if (task.dueDate && new Date(task.dueDate) < now && !task.completed) {
          const hoursOverdue = Math.floor(
            (now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60)
          );

          alerts.push({
            id: `alert_${Date.now()}`,
            userId: this.userId,
            type: "alert",
            severity: hoursOverdue > 24 ? "high" : "medium",
            title: `Overdue Task: "${task.title}"`,
            description: `This task was due ${hoursOverdue} hours ago`,
            supportingData: {
              taskId: task.id,
              dueDate: task.dueDate,
              hoursOverdue,
            },
            recommendedAction: "Complete or reschedule this task",
            confidence: 100,
            createdAt: new Date(),
          });
        }
      }

      return alerts;
    } catch (error) {
      console.error("[JARVIS_PROACTIVE] Erro ao verificar tarefas:", error);
      return [];
    }
  }

  /**
   * Analisar padrões comportamentais do usuário
   */
  private async analyzeUserPatterns(): Promise<ProactiveInsight[]> {
    try {
      const patterns: ProactiveInsight[] = [];

      // Analisar frequência de atividade
      const conversations = await db.getConversations(this.userId);
      const recentConversations = conversations.filter(
        (c: any) =>
          new Date(c.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      );

      if (recentConversations.length > 10) {
        patterns.push({
          id: `pattern_${Date.now()}`,
          userId: this.userId,
          type: "prediction",
          severity: "low",
          title: "High Activity Pattern Detected",
          description: `You've had ${recentConversations.length} conversations in the last 7 days`,
          supportingData: {
            conversationCount: recentConversations.length,
            period: "7 days",
          },
          recommendedAction: "Consider setting up automation to reduce manual work",
          confidence: 75,
          createdAt: new Date(),
        });
      }

      return patterns;
    } catch (error) {
      console.error("[JARVIS_PROACTIVE] Erro ao analisar padrões:", error);
      return [];
    }
  }

  /**
   * Gerar sugestões baseadas em IA
   */
  private async generateAISuggestions(
    insights: ProactiveInsight[]
  ): Promise<ProactiveInsight[]> {
    try {
      if (insights.length === 0) return [];

      // Preparar contexto dos insights
      const insightsSummary = insights
        .map((i) => `${i.type}: ${i.title} - ${i.description}`)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a strategic business advisor. Based on the insights provided, generate 2-3 actionable suggestions.
Return a JSON array with objects: { type: "suggestion", title, description, recommendedAction, confidence (0-100) }`,
          },
          {
            role: "user",
            content: `Based on these insights:\n${insightsSummary}\n\nGenerate strategic suggestions.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : JSON.stringify(content || "");

      const jsonMatch = contentStr.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const suggestions = JSON.parse(jsonMatch[0]);

      return suggestions.map((s: any) => ({
        id: `suggestion_${Date.now()}`,
        userId: this.userId,
        type: "suggestion",
        severity: "low",
        title: s.title,
        description: s.description,
        recommendedAction: s.recommendedAction,
        confidence: s.confidence,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error("[JARVIS_PROACTIVE] Erro ao gerar sugestões IA:", error);
      return [];
    }
  }

  /**
   * Analisar horas de pico
   */
  private analyzePeakHours(metrics: any[]): number[] {
    const hourlyData: Record<number, number> = {};

    for (const metric of metrics) {
      const hour = new Date(metric.date).getHours();
      hourlyData[hour] = (hourlyData[hour] || 0) + (metric.clicks || 0);
    }

    return Object.entries(hourlyData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  /**
   * Gerar ações sugeridas a partir dos insights
   */
  private generateSuggestedActions(insights: ProactiveInsight[]): string[] {
    const actions: string[] = [];

    for (const insight of insights) {
      if (insight.recommendedAction && insight.severity !== "low") {
        actions.push(insight.recommendedAction);
      }
    }

    // Remover duplicatas
    return [...new Set(actions)].slice(0, 5);
  }

  /**
   * Formatar insights como mensagem para o chat
   */
  formatInsightsAsMessage(context: ProactiveContext): string {
    let message = "";

    // Alertas urgentes
    if (context.urgentItems.length > 0) {
      message += "**🚨 Urgent Items:**\n";
      context.urgentItems.slice(0, 3).forEach((item) => {
        message += `- ${item.title}: ${item.description}\n`;
      });
      message += "\n";
    }

    // Oportunidades
    if (context.opportunityItems.length > 0) {
      message += "**💡 Opportunities:**\n";
      context.opportunityItems.slice(0, 3).forEach((item) => {
        message += `- ${item.title}: ${item.description}\n`;
      });
      message += "\n";
    }

    // Ações sugeridas
    if (context.suggestedActions.length > 0) {
      message += "**Suggested Actions:**\n";
      context.suggestedActions.forEach((action) => {
        message += `- ${action}\n`;
      });
    }

    return message || "No immediate insights at this moment.";
  }
}

/**
 * Factory para criar engine de proatividade
 */
export function createProactiveEngine(userId: number) {
  return new JarvisProactiveEngine(userId);
}
