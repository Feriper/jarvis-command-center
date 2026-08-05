import { describe, expect, it, vi, beforeEach } from "vitest";
import { createEvolutionCore } from "./jarvis-evolution-core";
import { createReflectionEngine } from "./jarvis-reflection-engine";
import { createObjectiveManager } from "./jarvis-objective-manager";

// Mock do banco de dados
vi.mock("./db", () => ({
  getMessages: vi.fn(),
  getMemory: vi.fn(),
  getConversations: vi.fn(),
  getAlerts: vi.fn(),
  saveMemory: vi.fn(),
  getAdCampaigns: vi.fn(),
  getAdMetrics: vi.fn(),
  getTasks: vi.fn(),
  createConversation: vi.fn(),
  saveMessage: vi.fn(),
  updateConversation: vi.fn(),
}));

// Mock do LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import * as db from "./db";
import { invokeLLM } from "./_core/llm";

describe("JARVIS Transcendência - Testes de Capacidades Avançadas", () => {
  
  describe("EvolutionCore", () => {
    it("deve aprender uma nova habilidade a partir de uma interação", async () => {
      const core = createEvolutionCore(1);
      (invokeLLM as any).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              name: "Análise de ROI",
              description: "Habilidade de calcular ROI complexo",
              code: "const roi = (gain - cost) / cost;",
              isReusable: true
            })
          }
        }]
      });

      const skill = await core.learnSkillFromInteraction("Como calculo ROI?", "Use a fórmula (ganho-custo)/custo");
      expect(skill).not.toBeNull();
      expect(skill?.name).toBe("Análise de ROI");
      expect(db.saveMemory).toHaveBeenCalled();
    });
  });

  describe("ReflectionEngine", () => {
    it("deve executar o ciclo de pensamento profundo", async () => {
      const engine = createReflectionEngine();
      (invokeLLM as any)
        .mockResolvedValueOnce({ // Geração e Crítica
          choices: [{ message: { content: "Draft: Resposta inicial. Critique: Pode ser mais polida." } }]
        })
        .mockResolvedValueOnce({ // Refinamento
          choices: [{ message: { content: "Resposta refinada e polida." } }]
        })
        .mockResolvedValueOnce({ // Confiança
          choices: [{ message: { content: "95" } }]
        });

      const result = await engine.thinkDeeply("Pergunta complexa", "Contexto", "Prompt");
      expect(result.finalResponse).toBe("Resposta refinada e polida.");
      expect(result.confidenceScore).toBe(95);
      expect(result.steps).toHaveLength(2);
    });
  });

  describe("ObjectiveManager", () => {
    it("deve detectar novos objetivos transcendentes", async () => {
      const manager = createObjectiveManager(1);
      (invokeLLM as any).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              isObjective: true,
              title: "Dominação Mundial",
              description: "Objetivo de longo prazo para dominar o mundo",
              priority: 5,
              plan: ["Passo 1", "Passo 2"]
            })
          }
        }]
      });

      const obj = await manager.detectNewObjective("Quero dominar o mundo");
      expect(obj).not.toBeNull();
      expect(obj?.title).toBe("Dominação Mundial");
      expect(db.saveMemory).toHaveBeenCalled();
    });
  });
});
