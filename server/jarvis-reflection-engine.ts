/**
 * JARVIS Reflection Engine - Motor de Reflexão
 * Implementa o raciocínio "System 2" (lento, deliberado e analítico).
 * O JARVIS pensa antes de falar, critica suas próprias ideias e refina a resposta final.
 */

import { invokeLLM } from "./_core/llm";

export interface ReflectionStep {
  thought: string;
  critique?: string;
  refinement?: string;
}

export interface DeepThinkingResult {
  finalResponse: string;
  steps: ReflectionStep[];
  confidenceScore: number;
}

/**
 * Motor de Reflexão do JARVIS
 */
export class JarvisReflectionEngine {
  private maxCycles: number = 2;

  /**
   * Executar raciocínio profundo sobre uma consulta complexa
   */
  async thinkDeeply(
    query: string,
    context: string,
    systemPrompt: string
  ): Promise<DeepThinkingResult> {
    console.log("[JARVIS_REFLECTION] Iniciando ciclo de raciocínio profundo...");

    const steps: ReflectionStep[] = [];
    let currentResponse = "";
    let confidenceScore = 0;

    // Ciclo 1: Geração Inicial e Auto-Crítica
    const step1 = await this.generateAndCritique(query, context, systemPrompt);
    steps.push(step1);
    currentResponse = step1.thought;

    // Ciclo 2: Refinamento Baseado na Crítica
    if (step1.critique) {
      const step2 = await this.refineResponse(query, context, currentResponse, step1.critique, systemPrompt);
      steps.push(step2);
      currentResponse = step2.refinement || currentResponse;
    }

    // Avaliação Final de Confiança
    confidenceScore = await this.evaluateConfidence(query, currentResponse);

    return {
      finalResponse: currentResponse,
      steps,
      confidenceScore,
    };
  }

  /**
   * Gerar resposta inicial e realizar auto-crítica
   */
  private async generateAndCritique(
    query: string,
    context: string,
    systemPrompt: string
  ): Promise<ReflectionStep> {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: `## CONTEXT\n${context}` },
        { 
          role: "system", 
          content: "Generate a detailed internal draft for the user's request. Then, act as a 'Critical Reviewer' and point out potential flaws, missing information, or tone inconsistencies." 
        },
        { role: "user", content: query },
      ],
    });

    const content = response.choices[0]?.message?.content || "";
    const [thought, critique] = this.splitThoughtAndCritique(content);

    return { thought, critique };
  }

  /**
   * Refinar a resposta com base na crítica
   */
  private async refineResponse(
    query: string,
    context: string,
    originalResponse: string,
    critique: string,
    systemPrompt: string
  ): Promise<ReflectionStep> {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: `## CONTEXT\n${context}` },
        { role: "system", content: `## ORIGINAL DRAFT\n${originalResponse}` },
        { role: "system", content: `## CRITIQUE\n${critique}` },
        { 
          role: "system", 
          content: "Refine the original draft by addressing all points in the critique. Ensure the final response is impeccable, strategic, and maintains the JARVIS persona perfectly." 
        },
        { role: "user", content: query },
      ],
    });

    const refinement = response.choices[0]?.message?.content || "";
    return { thought: originalResponse, critique, refinement };
  }

  /**
   * Avaliar o nível de confiança na resposta final
   */
  private async evaluateConfidence(query: string, response: string): Promise<number> {
    const evaluation = await invokeLLM({
      messages: [
        { 
          role: "system", 
          content: "Evaluate the quality and accuracy of the following AI response to the user's query. Return ONLY a number between 0 and 100 representing the confidence score." 
        },
        { role: "user", content: `Query: ${query}\nResponse: ${response}` },
      ],
    });

    const scoreStr = evaluation.choices[0]?.message?.content || "0";
    return parseInt(scoreStr.replace(/[^0-9]/g, "")) || 70;
  }

  /**
   * Separar pensamento e crítica da saída do LLM
   */
  private splitThoughtAndCritique(content: string): [string, string] {
    if (content.includes("Critique:") || content.includes("CRITICAL REVIEW:")) {
      const parts = content.split(/Critique:|CRITICAL REVIEW:/i);
      return [parts[0].trim(), parts[1].trim()];
    }
    return [content, "No major flaws detected."];
  }
}

/**
 * Factory para o Reflection Engine
 */
export function createReflectionEngine() {
  return new JarvisReflectionEngine();
}
