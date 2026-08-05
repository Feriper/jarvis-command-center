/**
 * JARVIS Evolution Core - Núcleo de Auto-Evolução
 * Permite que o JARVIS aprenda novas habilidades, otimize seus próprios prompts
 * e evolua sua lógica interna com base no uso e feedback.
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

export interface Skill {
  name: string;
  description: string;
  code: string;
  usageCount: number;
  successRate: number;
  lastUsed: Date;
}

export interface EvolutionMetrics {
  totalTokensUsed: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  skillsLearned: number;
}

/**
 * Motor de Evolução do JARVIS
 */
export class JarvisEvolutionCore {
  private userId: number;
  private skillsDir: string;

  constructor(userId: number) {
    this.userId = userId;
    this.skillsDir = path.join(process.cwd(), "skills_learned", userId.toString());
  }

  /**
   * Inicializar diretório de habilidades
   */
  async init() {
    try {
      await fs.mkdir(this.skillsDir, { recursive: true });
    } catch (error) {
      console.error("[JARVIS_EVOLUTION] Erro ao inicializar skills:", error);
    }
  }

  /**
   * Aprender uma nova habilidade a partir de uma interação bem-sucedida
   */
  async learnSkillFromInteraction(interaction: string, outcome: string): Promise<Skill | null> {
    try {
      console.log("[JARVIS_EVOLUTION] Analisando interação para aprendizado de habilidade...");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the Evolution Core of JARVIS. Your goal is to extract reusable logic or patterns from successful interactions.
            
If the interaction contains a reusable technical pattern, code snippet, or complex reasoning chain, extract it as a "Skill".
Return a JSON object: { "name": string, "description": string, "code": string, "isReusable": boolean }
If not reusable, set isReusable to false.`,
          },
          {
            role: "user",
            content: `Interaction: ${interaction}\nOutcome: ${outcome}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : JSON.stringify(content || "");
      const result = JSON.parse(contentStr.match(/\{[\s\S]*\}/)?.[0] || '{"isReusable": false}');

      if (result.isReusable) {
        const skill: Skill = {
          name: result.name,
          description: result.description,
          code: result.code,
          usageCount: 1,
          successRate: 100,
          lastUsed: new Date(),
        };

        await this.saveSkill(skill);
        console.log(`[JARVIS_EVOLUTION] Nova habilidade aprendida: ${skill.name}`);
        return skill;
      }

      return null;
    } catch (error) {
      console.error("[JARVIS_EVOLUTION] Erro ao aprender habilidade:", error);
      return null;
    }
  }

  /**
   * Salvar habilidade aprendida
   */
  private async saveSkill(skill: Skill) {
    await this.init(); // Garantir que o diretório existe
    const fileName = `${skill.name.toLowerCase().replace(/\s+/g, "_")}.json`;
    const filePath = path.join(this.skillsDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(skill, null, 2));
    
    // Registrar no banco de dados para persistência e busca rápida
    await db.saveMemory({
      userId: this.userId,
      key: `skill_${skill.name}`,
      value: JSON.stringify(skill),
      category: "procedural",
      importance: 4,
    });
  }

  /**
   * Buscar habilidades relevantes para o contexto atual
   */
  async findRelevantSkills(query: string): Promise<Skill[]> {
    try {
      const skillsMemory = await db.getMemory(this.userId, "procedural");
      if (!skillsMemory || skillsMemory.length === 0) return [];

      const skills: Skill[] = skillsMemory.map(m => JSON.parse(m.value));
      
      // Simular busca semântica simples (em produção, usar embeddings)
      return skills.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) || 
        s.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 3);
    } catch (error) {
      console.error("[JARVIS_EVOLUTION] Erro ao buscar habilidades:", error);
      return [];
    }
  }

  /**
   * Auto-Otimizar Prompt de Sistema
   * O JARVIS analisa seu próprio prompt e sugere melhorias com base no feedback do usuário
   */
  async selfOptimizePrompt(currentPrompt: string, userFeedback: string): Promise<string> {
    try {
      console.log("[JARVIS_EVOLUTION] Iniciando auto-otimização de prompt...");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a Meta-Prompt Engineer. Analyze the current prompt and user feedback to create a superior version of the JARVIS system prompt.",
          },
          {
            role: "user",
            content: `Current Prompt: ${currentPrompt}\nUser Feedback: ${userFeedback}\n\nGenerate an optimized prompt that addresses the feedback while maintaining the JARVIS persona.`,
          },
        ],
      });

      const optimizedPrompt = response.choices[0]?.message?.content;
      if (typeof optimizedPrompt === "string") {
        // Salvar versão otimizada
        await db.saveMemory({
          userId: this.userId,
          key: "optimized_system_prompt",
          value: optimizedPrompt,
          category: "meta",
          importance: 5,
        });
        return optimizedPrompt;
      }
      return currentPrompt;
    } catch (error) {
      console.error("[JARVIS_EVOLUTION] Erro ao otimizar prompt:", error);
      return currentPrompt;
    }
  }

  /**
   * Gerar relatório de evolução
   */
  async getEvolutionReport(): Promise<EvolutionMetrics> {
    const skills = await db.getMemory(this.userId, "procedural");
    
    // Em um sistema real, estas métricas seriam agregadas de logs de telemetria
    return {
      totalTokensUsed: 1250000, // Exemplo
      averageResponseTime: 1.8, // Exemplo
      userSatisfactionScore: 9.2, // Exemplo
      skillsLearned: skills.length,
    };
  }
}

/**
 * Factory para o Evolution Core
 */
export function createEvolutionCore(userId: number) {
  return new JarvisEvolutionCore(userId);
}
