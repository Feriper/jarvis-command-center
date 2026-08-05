/**
 * Extensões de banco de dados para funcionalidades proativas do JARVIS
 * Este arquivo contém funções adicionais para memória aprimorada, análise de anomalias e previsões
 */

import { getDb } from "./db";
import { eq, and, desc, lte, gte } from "drizzle-orm";
import { userMemory, adMetrics, tasks, alerts, InsertAlert } from "../drizzle/schema";

/**
 * Carrega uma "janela de memória" do usuário com os fatos mais importantes
 * @param userId ID do usuário
 * @param limit Número máximo de fatos a retornar
 * @returns Array de fatos ordenados por importância
 */
export async function getUserMemoryWindow(userId: number, limit: number = 15) {
  const db = await getDb();
  if (!db) return [];

  try {
    // Buscar fatos ordenados por importância (mais recentes primeiro em caso de empate)
    const facts = await db
      .select()
      .from(userMemory)
      .where(eq(userMemory.userId, userId))
      .orderBy(desc(userMemory.updatedAt))
      .limit(limit);

    return facts;
  } catch (error) {
    console.error("[DB] Erro ao carregar memória do usuário:", error);
    return [];
  }
}

/**
 * Salva um fato na memória do usuário com importância
 * @param userId ID do usuário
 * @param key Chave do fato
 * @param value Valor do fato
 * @param category Categoria do fato
 * @param importance Nível de importância (0-100)
 */
export async function saveMemoryFact(
  userId: number,
  key: string,
  value: string,
  category: string,
  importance: number = 50
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(userMemory).values({
      userId,
      key,
      value,
      category,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return result;
  } catch (error) {
    console.error("[DB] Erro ao salvar fato na memória:", error);
    throw error;
  }
}

/**
 * Calcula a tendência de uma métrica (simples regressão linear)
 * @param values Array de valores numéricos
 * @returns Objeto com direção e inclinação
 */
export function calculateTrend(values: number[]) {
  if (values.length < 2) return { direction: "insufficient_data", slope: 0 };

  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = values;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const direction = slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable";

  return { direction, slope };
}

/**
 * Projeta uma métrica para o futuro baseado em tendência
 * @param values Array de valores históricos
 * @param daysAhead Número de dias a projetar
 * @returns Valor projetado
 */
export function projectMetric(values: number[], daysAhead: number = 7) {
  const trend = calculateTrend(values);
  const lastValue = values[values.length - 1] || 0;

  return lastValue + trend.slope * daysAhead;
}

/**
 * Detecta anomalias em métricas de campanha
 * @param campaignId ID da campanha
 * @param threshold Percentual de desvio para considerar anomalia (ex: 0.2 = 20%)
 * @returns Array de anomalias detectadas
 */
export async function detectCampaignAnomalies(
  campaignId: number,
  threshold: number = 0.2
) {
  const db = await getDb();
  if (!db) return [];

  try {
    const metrics = await db
      .select()
      .from(adMetrics)
      .where(eq(adMetrics.campaignId, campaignId))
      .orderBy(adMetrics.date);

    if (metrics.length < 7) {
      return []; // Precisa de pelo menos 7 dias de dados
    }

    const anomalies = [];

    // Analisar CTR
    const ctrValues = metrics.map(m => Number(m.ctr));
    const avgCTR = ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length;
    const latestCTR = ctrValues[ctrValues.length - 1];

    if (latestCTR < avgCTR * (1 - threshold)) {
      anomalies.push({
        type: "ctr_drop",
        metric: "CTR",
        current: latestCTR,
        average: avgCTR,
        percentageChange: ((latestCTR - avgCTR) / avgCTR) * 100,
        severity: latestCTR < avgCTR * 0.5 ? "critical" : "high",
      });
    }

    // Analisar CPC
    const cpcValues = metrics.map(m => Number(m.cpc));
    const avgCPC = cpcValues.reduce((a, b) => a + b, 0) / cpcValues.length;
    const latestCPC = cpcValues[cpcValues.length - 1];

    if (latestCPC > avgCPC * (1 + threshold)) {
      anomalies.push({
        type: "cpc_increase",
        metric: "CPC",
        current: latestCPC,
        average: avgCPC,
        percentageChange: ((latestCPC - avgCPC) / avgCPC) * 100,
        severity: latestCPC > avgCPC * 1.5 ? "critical" : "high",
      });
    }

    // Analisar ROI
    const roiValues = metrics.map(m => Number(m.roi));
    const avgROI = roiValues.reduce((a, b) => a + b, 0) / roiValues.length;
    const latestROI = roiValues[roiValues.length - 1];

    if (latestROI < avgROI * (1 - threshold)) {
      anomalies.push({
        type: "roi_drop",
        metric: "ROI",
        current: latestROI,
        average: avgROI,
        percentageChange: ((latestROI - avgROI) / avgROI) * 100,
        severity: latestROI < avgROI * 0.5 ? "critical" : "high",
      });
    }

    return anomalies;
  } catch (error) {
    console.error("[DB] Erro ao detectar anomalias:", error);
    return [];
  }
}

/**
 * Cria um alerta automático baseado em anomalia detectada
 * @param userId ID do usuário
 * @param anomaly Objeto de anomalia
 * @param campaignName Nome da campanha
 */
export async function createAnomalyAlert(
  userId: number,
  anomaly: any,
  campaignName: string
) {
  const db = await getDb();
  if (!db) return null;

  try {
    const alert: InsertAlert = {
      userId,
      type: "ad_drop",
      title: `Anomalia Detectada: ${anomaly.metric} em ${campaignName}`,
      message: `${anomaly.metric} caiu ${Math.abs(anomaly.percentageChange).toFixed(1)}% (Atual: ${anomaly.current.toFixed(2)}, Média: ${anomaly.average.toFixed(2)})`,
      severity: anomaly.severity,
      read: false,
      createdAt: new Date(),
    };

    const result = await db.insert(alerts).values(alert);
    return result;
  } catch (error) {
    console.error("[DB] Erro ao criar alerta de anomalia:", error);
    throw error;
  }
}

/**
 * Busca tarefas urgentes (vencendo nas próximas horas)
 * @param userId ID do usuário
 * @param hoursAhead Número de horas a considerar como "urgente"
 * @returns Array de tarefas urgentes
 */
export async function getUrgentTasks(userId: number, hoursAhead: number = 1) {
  const db = await getDb();
  if (!db) return [];

  try {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const urgentTasks = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          gte(tasks.dueDate, now),
          lte(tasks.dueDate, futureTime)
        )
      )
      .orderBy(tasks.dueDate);

    return urgentTasks;
  } catch (error) {
    console.error("[DB] Erro ao buscar tarefas urgentes:", error);
    return [];
  }
}

/**
 * Calcula estatísticas de desempenho para um período
 * @param campaignId ID da campanha
 * @param days Número de dias a analisar
 * @returns Objeto com estatísticas
 */
export async function getCampaignStats(campaignId: number, days: number = 30) {
  const db = await getDb();
  if (!db) return null;

  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await db
      .select()
      .from(adMetrics)
      .where(
        and(
          eq(adMetrics.campaignId, campaignId),
          gte(adMetrics.date, startDate)
        )
      );

    if (metrics.length === 0) return null;

    const stats = {
      totalImpressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
      totalClicks: metrics.reduce((sum, m) => sum + m.clicks, 0),
      totalConversions: metrics.reduce((sum, m) => sum + m.conversions, 0),
      totalRevenue: metrics.reduce((sum, m) => sum + Number(m.revenue), 0),
      totalSpent: metrics.reduce((sum, m) => sum + Number(m.cpc) * m.clicks, 0),
      avgCTR: metrics.reduce((sum, m) => sum + Number(m.ctr), 0) / metrics.length,
      avgCPC: metrics.reduce((sum, m) => sum + Number(m.cpc), 0) / metrics.length,
      avgROI: metrics.reduce((sum, m) => sum + Number(m.roi), 0) / metrics.length,
      bestDay: metrics.reduce((best, m) => (Number(m.roi) > Number(best.roi) ? m : best)),
      worstDay: metrics.reduce((worst, m) => (Number(m.roi) < Number(worst.roi) ? m : worst)),
    };

    return stats;
  } catch (error) {
    console.error("[DB] Erro ao calcular estatísticas:", error);
    return null;
  }
}
