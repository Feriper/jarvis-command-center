/**
 * Extensões de roteadores para funcionalidades proativas do JARVIS
 * Este arquivo contém novos endpoints e lógica para proatividade aprimorada
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import * as dbProactive from "./db.proactive";

/**
 * Roteador para funcionalidades proativas
 */
export const proactiveRouter = router({
  /**
   * Orquestra um enxame de agentes para resolver um objetivo complexo
   */
  orchestrateSwarm: protectedProcedure
    .input(z.object({ objective: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Decompor o objetivo em subtarefas usando o JARVIS Central
      const decomposition = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é o Orquestrador JARVIS. Decompõe objetivos complexos em tarefas para agentes especialistas.
Agentes Disponíveis:
- Financial Advisor: Analisa Ads, ROI e finanças.
- Social Strategist: Planeja conteúdo e analisa engajamento.
- Executive Assistant: Gerencia tarefas e agenda.
Retorne JSON: { "tasks": [{ "agent": string, "task": string, "priority": number }] }`
          },
          {
            role: "user",
            content: `Objetivo: ${input.objective}`
          }
        ],
        responseFormat: { type: "json_object" }
      });

      const content = decomposition.choices[0]?.message?.content;
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content || '{"tasks":[]}');
      const plan = JSON.parse(contentStr);

      // 2. Criar tarefas de agente no banco de dados
      const createdTasks = [];
      for (const task of plan.tasks) {
        const agentTask = await db.createAgentTask({
          userId: ctx.user.id,
          objective: `${task.agent}: ${task.task}`,
          status: "pending",
        });
        if (!agentTask) {
          throw new Error("Não foi possível persistir a tarefa do agente.");
        }
        createdTasks.push({ ...task, id: agentTask.insertId });
      }

      return {
        message: `Senhor, o plano de ação foi traçado. ${createdTasks.length} sub-agentes foram mobilizados para o objetivo: "${input.objective}".`,
        plan: createdTasks
      };
    }),

  /**
   * Gera um relatório executivo proativo com anomalias e recomendações
   */
  generateProactiveReport: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await db.getTasks(ctx.user.id);
    const campaigns = await db.getAdCampaigns(ctx.user.id);
    const userMemory = await dbProactive.getUserMemoryWindow(ctx.user.id, 10);

    // Detectar anomalias em todas as campanhas
    const anomalies = [];
    for (const campaign of campaigns) {
      const campaignAnomalies = await dbProactive.detectCampaignAnomalies(
        campaign.id,
        0.2
      );
      anomalies.push(...campaignAnomalies.map(a => ({ ...a, campaign: campaign.campaignName })));
    }

    // Buscar tarefas urgentes
    const urgentTasks = await dbProactive.getUrgentTasks(ctx.user.id, 2);

    // Construir contexto para LLM
    const contextStr = userMemory
      .map(m => `${m.category}: ${m.value}`)
      .join("\n");

    const anomaliesStr = anomalies
      .map(
        a =>
          `- ${a.campaign}: ${a.type} (${a.metric} ${a.percentageChange > 0 ? "+" : ""}${a.percentageChange.toFixed(1)}%)`
      )
      .join("\n");

    const urgentTasksStr = urgentTasks
      .map(
        t =>
          `- ${t.title} (vence em ${Math.round((t.dueDate!.getTime() - Date.now()) / 60000)} min)`
      )
      .join("\n");

    // Gerar relatório com LLM
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é o JARVIS, assistente executivo retro-futurista. 
Forneça um relatório executivo conciso, priorizado e acionável.
Tom: Sofisticado, britânico, com toque de humor seco.
Formato: Markdown com seções claras.`,
        },
        {
          role: "user",
          content: `Analise esta situação e forneça recomendações prioritárias:

CONTEXTO DO USUÁRIO:
${contextStr || "Sem contexto salvo"}

ANOMALIAS DETECTADAS:
${anomaliesStr || "Nenhuma anomalia detectada"}

TAREFAS URGENTES:
${urgentTasksStr || "Nenhuma tarefa urgente"}

Forneça:
1. Resumo executivo (2-3 linhas)
2. Top 3 ações imediatas
3. Recomendações estratégicas
4. Métricas a monitorar`,
        },
      ],
    });

    return {
      report: response.choices[0]?.message?.content,
      anomalies,
      urgentTasks,
      timestamp: new Date(),
    };
  }),

  /**
   * Analisa tendências e faz previsões para campanhas
   */
  predictCampaignTrend: protectedProcedure
    .input(z.object({ campaignId: z.number(), daysAhead: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const daysAhead = input.daysAhead || 7;
      const metrics = await db.getAdMetrics(input.campaignId);

      if (metrics.length < 7) {
        return {
          error: "Dados insuficientes para previsão (mínimo 7 dias)",
          confidence: 0,
        };
      }

      // Calcular tendências
      const ctrValues = metrics.map(m => Number(m.ctr));
      const ctrTrend = dbProactive.calculateTrend(ctrValues);
      const ctrProjection = dbProactive.projectMetric(ctrValues, daysAhead);

      const roiValues = metrics.map(m => Number(m.roi));
      const roiTrend = dbProactive.calculateTrend(roiValues);
      const roiProjection = dbProactive.projectMetric(roiValues, daysAhead);

      // Calcular confiança (baseado em consistência de dados)
      const confidence = Math.min(100, (metrics.length / 30) * 100);

      // Gerar insights com LLM
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um analista de dados. Forneça previsões e recomendações baseadas em tendências.",
          },
          {
            role: "user",
            content: `Analise estas tendências de campanha para os próximos ${daysAhead} dias:

CTR: Tendência ${ctrTrend.direction} (${ctrTrend.slope.toFixed(4)}/dia)
Projeção: ${ctrProjection.toFixed(2)}%

ROI: Tendência ${roiTrend.direction} (${roiTrend.slope.toFixed(2)}/dia)
Projeção: ${roiProjection.toFixed(2)}%

Confiança da previsão: ${confidence.toFixed(0)}%

Forneça:
1. Interpretação das tendências
2. Riscos identificados
3. Oportunidades
4. Ações recomendadas (máximo 3)`,
          },
        ],
      });

      return {
        ctrTrend,
        ctrProjection,
        roiTrend,
        roiProjection,
        confidence,
        insights: response.choices[0]?.message?.content,
        daysAhead,
      };
    }),

  /**
   * Obtém sugestões de otimização baseadas em dados históricos
   */
  getOptimizationSuggestions: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const stats = await dbProactive.getCampaignStats(input.campaignId, 30);

      if (!stats) {
        return { error: "Dados insuficientes para análise" };
      }

      // Identificar problemas
      const issues = [];

      if (stats.avgCTR < 1) {
        issues.push("CTR muito baixo (< 1%)");
      }
      if (stats.avgCPC > 5) {
        issues.push("CPC elevado (> $5)");
      }
      if (stats.avgROI < 100) {
        issues.push("ROI abaixo de 100%");
      }

      // Gerar sugestões com LLM
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em publicidade digital. Forneça recomendações práticas e acionáveis.",
          },
          {
            role: "user",
            content: `Baseado nestes dados de campanha dos últimos 30 dias:

Impressões: ${stats.totalImpressions}
Cliques: ${stats.totalClicks}
Conversões: ${stats.totalConversions}
CTR Médio: ${stats.avgCTR.toFixed(2)}%
CPC Médio: $${stats.avgCPC.toFixed(2)}
ROI Médio: ${stats.avgROI.toFixed(0)}%
Receita Total: $${stats.totalRevenue.toFixed(2)}

Problemas Identificados:
${issues.map(i => `- ${i}`).join("\n") || "- Nenhum problema crítico"}

Forneça 5 recomendações específicas e mensuráveis para melhorar o desempenho.`,
          },
        ],
      });

      return {
        stats,
        issues,
        suggestions: response.choices[0]?.message?.content,
      };
    }),

  /**
   * Salva um fato importante na memória do JARVIS
   */
  rememberFact: protectedProcedure
    .input(
      z.object({
        fact: z.string(),
        category: z.string().optional(),
        importance: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = input.category || "general";
      const importance = input.importance || 50;

      const result = await dbProactive.saveMemoryFact(
        ctx.user.id,
        `fact_${Date.now()}`,
        input.fact,
        category,
        importance
      );

      return {
        success: true,
        message: `Fato salvo na memória: "${input.fact}"`,
        importance,
        category,
      };
    }),

  /**
   * Obtém a memória atual do usuário
   */
  getMemory: protectedProcedure.query(async ({ ctx }) => {
    const memory = await dbProactive.getUserMemoryWindow(ctx.user.id, 20);

    // Agrupar por categoria
    const grouped = memory.reduce(
      (acc, m) => {
        const cat = m.category || "general";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(m);
        return acc;
      },
      {} as Record<string, typeof memory>
    );

    return {
      total: memory.length,
      byCategory: grouped,
      memory,
    };
  }),

  /**
   * Gera um resumo diário proativo
   */
  generateDailySummary: protectedProcedure.query(async ({ ctx }) => {
    const tasks = await db.getTasks(ctx.user.id);
    const campaigns = await db.getAdCampaigns(ctx.user.id);
    const alerts = await db.getAlerts(ctx.user.id);

    // Contar por status
    const taskStats = {
      pending: tasks.filter(t => t.status === "pending").length,
      inProgress: tasks.filter(t => t.status === "in_progress").length,
      completed: tasks.filter(t => t.status === "completed").length,
    };

    const alertStats = {
      unread: alerts.filter(a => !a.read).length,
      critical: alerts.filter(a => a.severity === "critical" && !a.read).length,
    };

    const now = new Date();
    const activeTasks = tasks.filter(task => task.status !== "completed" && task.status !== "cancelled");
    const overdueTasks = activeTasks.filter(task => task.dueDate && task.dueDate < now);
    const dueTodayTasks = activeTasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= now && due.toDateString() === now.toDateString();
    });

    const fallbackSummary = [
      `Você tem ${activeTasks.length} tarefa(s) ativa(s): ${taskStats.pending} pendente(s) e ${taskStats.inProgress} em andamento.`,
      overdueTasks.length > 0 ? `${overdueTasks.length} tarefa(s) estão atrasadas e merecem prioridade.` : "Nenhuma tarefa está atrasada.",
      dueTodayTasks.length > 0 ? `${dueTodayTasks.length} tarefa(s) vencem hoje.` : "Não há tarefas vencendo hoje.",
      alertStats.critical > 0 ? `${alertStats.critical} alerta(s) crítico(s) não lido(s).` : "Não há alertas críticos não lidos.",
    ].join(" ");

    let summary = fallbackSummary;
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "Você é um assistente executivo. Forneça um resumo diário conciso e motivador.",
          },
          {
            role: "user",
            content: `Crie um resumo diário baseado nesta situação:\n\nTAREFAS:\n- Pendentes: ${taskStats.pending}\n- Em Progresso: ${taskStats.inProgress}\n- Concluídas: ${taskStats.completed}\n- Atrasadas: ${overdueTasks.length}\n- Vencendo hoje: ${dueTodayTasks.length}\n\nCAMPANHAS: ${campaigns.length} ativas\n\nALERTAS:\n- Não lidos: ${alertStats.unread}\n- Críticos: ${alertStats.critical}\n\nForneça um resumo motivador em 3-4 linhas, reconhecendo o progresso e destacando prioridades.`,
          },
        ],
      });
      const generated = response.choices[0]?.message?.content;
      summary = typeof generated === "string" && generated.trim().length > 0 ? generated : fallbackSummary;
    } catch (error) {
      console.warn("[JARVIS_PROACTIVE] IA indisponível; usando resumo local:", error instanceof Error ? error.message : error);
    }

    return {
      summary,
      taskStats,
      alertStats,
      campaignCount: campaigns.length,
      overdueCount: overdueTasks.length,
      dueTodayCount: dueTodayTasks.length,
      timestamp: new Date(),
    };
  }),
});
