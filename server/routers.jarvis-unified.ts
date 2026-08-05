/**
 * JARVIS Unified Router - Versão Transcedente
 * Integra memória, proatividade, persona, contexto, auto-evolução, reflexão e objetivos.
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

/**
 * Router unificado do JARVIS com capacidades "Além da IA"
 */
export const jarvisUnifiedRouter = router({
  /**
   * Enviar mensagem com contexto TRANSCENDENTE
   * Inclui: Memória, Proatividade, Auto-Evolução, Raciocínio Profundo e Objetivos
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

        // 1. Inicializar conversa e salvar mensagem do usuário
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

        // 2. Carregar Motores de Inteligência
        const memoryManager = createMemoryManager(ctx.user.id, convId!);
        const proactiveEngine = createProactiveEngine(ctx.user.id);
        const evolutionCore = createEvolutionCore(ctx.user.id);
        const reflectionEngine = createReflectionEngine();
        const objectiveManager = createObjectiveManager(ctx.user.id);

        // 3. Reunir Contexto Multidimensional
        const memoryWindow = await memoryManager.loadMemoryWindow(15);
        const memoryContext = memoryManager.formatMemoryAsContext(memoryWindow);
        
        const activeObjectives = await objectiveManager.getActiveObjectives();
        const objectiveContext = objectiveManager.formatObjectivesForPrompt(activeObjectives);
        
        const relevantSkills = await evolutionCore.findRelevantSkills(input.content);
        const skillsContext = relevantSkills.length > 0 
          ? `## RELEVANT LEARNED SKILLS\n${relevantSkills.map(s => `- ${s.name}: ${s.description}`).join("\n")}\n\n`
          : "";

        const userContext: UserContext = {
          userId: ctx.user.id,
          userName: ctx.user.name || "Sir",
          workloadLevel: await estimateWorkloadLevel(ctx.user.id),
          recentGoals: await extractRecentGoals(ctx.user.id),
        };

        const systemPrompt = buildJarvisSystemMessage(userContext).content;
        const fullContext = `${memoryContext}${objectiveContext}${skillsContext}`;

        // 4. Executar Raciocínio (Deep Thinking ou Standard)
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

        // 5. Pós-Processamento Autônomo
        // 5.1 Salvar resposta
        await db.saveMessage({
          conversationId: convId!,
          role: "assistant",
          content: aiContent,
        });

        // 5.2 Extrair Fatos e Objetivos
        await memoryManager.extractAndSaveFactsFromMessage(input.content, aiContent);
        await objectiveManager.detectNewObjective(input.content);

        // 5.3 Aprender com a interação (Evolução)
        if (confidenceScore > 90) {
          await evolutionCore.learnSkillFromInteraction(input.content, aiContent);
        }

        // 5.4 Insights Proativos
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
          reflectionSteps: reflectionSteps.length,
          confidenceScore,
          skillsApplied: relevantSkills.length,
          objectivesActive: activeObjectives.length,
        };
      } catch (error) {
        console.error("[JARVIS_UNIFIED] Erro transcendente:", error);
        throw error;
      }
    }),

  // ... outros métodos (loadConversationContext, summarizeConversation, etc.) mantidos ...
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
