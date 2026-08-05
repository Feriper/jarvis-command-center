/**
 * JARVIS Unified Router - Versão Beyond (Final)
 * Integra memória, proatividade, persona, contexto, auto-evolução, reflexão, objetivos, descoberta de ferramentas e segurança ativa.
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";
import {
  buildJarvisSystemMessage,
  UserContext,
} from "./jarvis-system-prompt";
import { createMemoryManager } from "./jarvis-memory-manager";
import { createProactiveEngine } from "./jarvis-proactive-engine";
import { createEvolutionCore } from "./jarvis-evolution-core";
import { createReflectionEngine } from "./jarvis-reflection-engine";
import { createObjectiveManager } from "./jarvis-objective-manager";
import { createToolDiscovery } from "./jarvis-tool-discovery";
import { createGuardianProtocol } from "./jarvis-guardian-protocol";

/**
 * Router unificado do JARVIS com capacidades "Além da IA" (Beyond)
 */
export const jarvisUnifiedRouter = router({
  /**
   * Enviar mensagem com contexto BEYOND
   */
  sendMessageWithContext: protectedProcedure
    .input(
      z.object({
        conversationId: z.number().optional(),
        content: z.string(),
        imageUrl: z.string().optional(),
        deepThinking: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        let convId = input.conversationId;

        // 1. Inicializar Motores de Inteligência e Segurança
        const memoryManager = createMemoryManager(ctx.user.id, convId || 0);
        const proactiveEngine = createProactiveEngine(ctx.user.id);
        const evolutionCore = createEvolutionCore(ctx.user.id);
        const reflectionEngine = createReflectionEngine();
        const objectiveManager = createObjectiveManager(ctx.user.id);
        const toolDiscovery = createToolDiscovery(ctx.user.id);
        const guardian = createGuardianProtocol(ctx.user.id);

        // 2. Protocolo Guardian: Verificar Segurança da Entrada
        const threat = await guardian.monitorActivity(input.content, "User Chat");
        if (threat && threat.severity === "critical") {
          return {
            content: "Senhor, o Protocolo Guardian detectou uma atividade crítica de segurança nesta entrada. A operação foi interrompida para proteger seus dados.",
            securityAlert: true,
          };
        }

        // 3. Inicializar conversa se necessário
        if (!convId) {
          const result = await db.createConversation({
            userId: ctx.user.id,
            title: input.content.substring(0, 30) + "...",
          });
          convId = (result as any).insertId;
        }

        await db.saveMessage({
          conversationId: convId!,
          role: "user",
          content: input.content,
          metadata: input.imageUrl ? { imageUrl: input.imageUrl } : undefined,
        });

        // 4. Reunir Contexto Multidimensional (Incluindo novas ferramentas aprendidas)
        const memoryWindow = await memoryManager.loadMemoryWindow(15);
        const memoryContext = memoryManager.formatMemoryAsContext(memoryWindow);
        
        const activeObjectives = await objectiveManager.getActiveObjectives();
        const objectiveContext = objectiveManager.formatObjectivesForPrompt(activeObjectives);
        
        const learnedTools = await toolDiscovery.getLearnedTools();
        const toolsContext = learnedTools.length > 0
          ? `## LEARNED AUTONOMOUS TOOLS\n${learnedTools.map(t => `- ${t.name}: ${t.purpose}`).join("\n")}\n\n`
          : "";

        const userContext: UserContext = {
          userId: ctx.user.id,
          userName: ctx.user.name || "Sir",
          workloadLevel: await estimateWorkloadLevel(ctx.user.id),
          recentGoals: await extractRecentGoals(ctx.user.id),
        };

        const systemPrompt = buildJarvisSystemMessage(userContext).content;
        const fullContext = `${memoryContext}${objectiveContext}${toolsContext}`;

        // 5. Executar Raciocínio (Deep Thinking ou Standard)
        let aiContent = "";
        let reflectionSteps: any[] = [];
        let confidenceScore = 100;

        if (input.deepThinking) {
          const deepResult = await reflectionEngine.thinkDeeply(input.content, fullContext, systemPrompt);
          aiContent = deepResult.finalResponse;
          reflectionSteps = deepResult.steps;
          confidenceScore = deepResult.confidenceScore;
        } else {
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "system", content: `## CONTEXT\n${fullContext}` },
              { role: "user", content: input.content }
            ]
          });
          aiContent = response.choices[0]?.message?.content || "Desculpe, senhor. Erro no processamento.";
        }

        // 6. Pós-Processamento Autônomo
        await db.saveMessage({
          conversationId: convId!,
          role: "assistant",
          content: aiContent,
        });

        // 6.1 Descoberta de Ferramentas: Identificar se o usuário quer integrar algo novo
        if (input.content.toLowerCase().includes("integrar") || input.content.toLowerCase().includes("usar a api")) {
          const toolMatch = input.content.match(/api (?:de |da )?(\w+)/i) || input.content.match(/serviço (\w+)/i);
          if (toolMatch?.[1]) {
            await toolDiscovery.discoverAndLearn(toolMatch[1]);
          }
        }

        // 6.2 Extrair Fatos e Objetivos
        await memoryManager.extractAndSaveFactsFromMessage(input.content, aiContent);
        await objectiveManager.detectNewObjective(input.content);

        // 6.3 Aprender com a interação (Evolução)
        if (confidenceScore > 90) {
          await evolutionCore.learnSkillFromInteraction(input.content, aiContent);
        }

        // 6.4 Insights Proativos
        const proactiveContext = await proactiveEngine.analyzeAndGenerateInsights();
        const proactiveMessage = proactiveEngine.formatInsightsAsMessage(proactiveContext);

        let finalResponse = aiContent;
        if (proactiveMessage && proactiveMessage !== "No immediate insights at this moment.") {
          finalResponse += `\n\n---\n\n${proactiveMessage}`;
        }

        return {
          content: finalResponse,
          conversationId: convId,
          deepThinkingPerformed: input.deepThinking,
          confidenceScore,
          securityStatus: threat ? "threat_blocked" : "safe",
          toolsDiscovered: learnedTools.length,
          memoryLoaded: memoryWindow.importantFacts.length,
          objectivesActive: activeObjectives.length,
        };
      } catch (error) {
        console.error("[JARVIS_UNIFIED] Erro Beyond:", error);
        throw error;
      }
    }),

  /**
   * Obter Status de Segurança do Protocolo Guardian
   */
  getSecurityStatus: protectedProcedure.query(async ({ ctx }) => {
    const guardian = createGuardianProtocol(ctx.user.id);
    const threats = await guardian.getRecentThreats();
    return {
      status: threats.length > 0 ? "warning" : "nominal",
      recentThreats: threats.slice(0, 5),
      lastCheck: new Date(),
    };
  }),

  /**
   * Listar Ferramentas Aprendidas Autonomamente
   */
  getLearnedTools: protectedProcedure.query(async ({ ctx }) => {
    const toolDiscovery = createToolDiscovery(ctx.user.id);
    return await toolDiscovery.getLearnedTools();
  }),
});

/**
 * Métodos auxiliares
 */
async function estimateWorkloadLevel(userId: number): Promise<"light" | "normal" | "heavy" | "critical"> {
  const tasks = await db.getTasks?.(userId);
  const incomplete = tasks?.filter((t: any) => !t.completed).length || 0;
  if (incomplete > 10) return "critical";
  if (incomplete > 5) return "heavy";
  if (incomplete > 2) return "normal";
  return "light";
}

async function extractRecentGoals(userId: number): Promise<string[]> {
  const facts = await db.getMemory(userId, "goal");
  return facts?.slice(0, 3).map((f: any) => f.value) || [];
}
