/**
 * JARVIS Objective Manager - Gerenciador de Objetivos Transcendentes
 * Transforma mensagens em objetivos persistentes de longo prazo.
 * O JARVIS persegue esses objetivos autonomamente, monitorando progresso 24/7.
 */

import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export interface Objective {
  id: string;
  userId: number;
  title: string;
  description: string;
  status: "active" | "completed" | "paused" | "failed";
  priority: 1 | 2 | 3 | 4 | 5;
  progress: number; // 0-100
  plan: string[];
  lastUpdate: Date;
  nextCheckAt: Date;
}

/**
 * Gerenciador de Objetivos do JARVIS
 */
export class JarvisObjectiveManager {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Identificar se uma mensagem do usuário contém um novo objetivo de longo prazo
   */
  async detectNewObjective(message: string): Promise<Objective | null> {
    try {
      console.log("[JARVIS_OBJECTIVE] Analisando mensagem em busca de objetivos de longo prazo...");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the Strategic Objective Manager of JARVIS. 
            Analyze the user's message. Is it a long-term goal or objective that requires persistent effort (e.g., "Improve my business ROI", "Learn a new language", "Optimize my health")?
            
If yes, return a JSON object: { "isObjective": true, "title": string, "description": string, "priority": number, "plan": string[] }
If no, return { "isObjective": false }.`,
          },
          { role: "user", content: message },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : JSON.stringify(content || "");
      const result = JSON.parse(contentStr.match(/\{[\s\S]*\}/)?.[0] || '{"isObjective": false}');

      if (result.isObjective) {
        const objective: Objective = {
          id: `obj_${Date.now()}`,
          userId: this.userId,
          title: result.title,
          description: result.description,
          status: "active",
          priority: result.priority || 3,
          progress: 0,
          plan: result.plan || [],
          lastUpdate: new Date(),
          nextCheckAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Check in 24h by default
        };

        await this.saveObjective(objective);
        console.log(`[JARVIS_OBJECTIVE] Novo objetivo transcendente ativado: ${objective.title}`);
        return objective;
      }

      return null;
    } catch (error) {
      console.error("[JARVIS_OBJECTIVE] Erro ao detectar objetivo:", error);
      return null;
    }
  }

  /**
   * Salvar objetivo no banco de dados
   */
  private async saveObjective(objective: Objective) {
    await db.saveMemory({
      userId: this.userId,
      key: `objective_${objective.id}`,
      value: JSON.stringify(objective),
      category: "goal",
      importance: objective.priority,
    });
  }

  /**
   * Obter todos os objetivos ativos
   */
  async getActiveObjectives(): Promise<Objective[]> {
    const goalsMemory = await db.getMemory(this.userId, "goal");
    if (!goalsMemory) return [];

    return goalsMemory
      .map((m: any) => {
        try {
          return JSON.parse(m.value);
        } catch {
          return null;
        }
      })
      .filter((obj: any) => obj && obj.status === "active");
  }

  /**
   * Atualizar progresso de um objetivo com base em novas evidências
   */
  async updateObjectiveProgress(objectiveId: string, evidence: string): Promise<Objective | null> {
    try {
      const goals = await db.getMemory(this.userId, "goal");
      const memoryEntry = goals.find(m => m.key === `objective_${objectiveId}`);
      if (!memoryEntry) return null;

      const objective: Objective = JSON.parse(memoryEntry.value);

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a Progress Evaluator. Analyze the evidence and the current objective plan to update the progress percentage.",
          },
          {
            role: "user",
            content: `Objective: ${objective.title}\nPlan: ${objective.plan.join(", ")}\nCurrent Progress: ${objective.progress}%\n\nNew Evidence: ${evidence}\n\nUpdate the progress percentage (0-100) and provide a brief status update. Return JSON: { "newProgress": number, "statusUpdate": string }`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : JSON.stringify(content || "");
      const result = JSON.parse(contentStr.match(/\{[\s\S]*\}/)?.[0] || '{"newProgress": 0}');

      objective.progress = result.newProgress;
      objective.lastUpdate = new Date();
      
      await this.saveObjective(objective);
      return objective;
    } catch (error) {
      console.error("[JARVIS_OBJECTIVE] Erro ao atualizar progresso:", error);
      return null;
    }
  }

  /**
   * Formatar objetivos para o prompt do sistema
   */
  formatObjectivesForPrompt(objectives: Objective[]): string {
    if (objectives.length === 0) return "";

    let context = "## ACTIVE TRANSCENDENT OBJECTIVES\n";
    objectives.forEach(obj => {
      context += `- **${obj.title}** (${obj.progress}% complete): ${obj.description}\n`;
      context += `  Next milestone: ${obj.plan.find((_, i) => i === Math.floor(obj.progress / (100 / obj.plan.length))) || "Finalize"}\n`;
    });
    return context + "\n";
  }
}

/**
 * Factory para o Objective Manager
 */
export function createObjectiveManager(userId: number) {
  return new JarvisObjectiveManager(userId);
}
