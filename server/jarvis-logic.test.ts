import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateJarvisSystemPrompt, buildJarvisSystemMessage } from "./jarvis-system-prompt";
import { JarvisMemoryManager } from "./jarvis-memory-manager";
import { JarvisProactiveEngine } from "./jarvis-proactive-engine";

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
  createAgentTask: vi.fn(),
}));

// Mock do LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
  contentToText: (content: unknown) => typeof content === "string" ? content : Array.isArray(content) ? content.filter((part: any) => part?.type === "text").map((part: any) => part.text).join("\n") : "",
}));

import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { jarvisUnifiedRouter } from "./routers.jarvis-unified";

describe("JARVIS Mentalidade - Testes de Lógica", () => {
  
  describe("JarvisSystemPrompt", () => {
    it("deve gerar um prompt de sistema com a persona correta", () => {
      const prompt = generateJarvisSystemPrompt();
      expect(prompt).toContain("You are JARVIS");
      expect(prompt).toContain("Sophistication");
      expect(prompt).toContain("Loyalty");
    });

    it("deve incluir o contexto do usuário no prompt", () => {
      const context = {
        userId: 1,
        userName: "Tony Stark",
        workloadLevel: "heavy" as const,
      };
      const prompt = generateJarvisSystemPrompt(context);
      expect(prompt).toContain("Tony Stark");
      expect(prompt).toContain("heavy");
      expect(prompt).toContain("Be concise and prioritize ruthlessly");
    });
  });

  describe("JarvisMemoryManager", () => {
    const userId = 1;
    const conversationId = 101;
    let memoryManager: JarvisMemoryManager;

    beforeEach(() => {
      memoryManager = new JarvisMemoryManager(userId, conversationId);
      vi.clearAllMocks();
    });

    it("deve carregar a janela de memória corretamente", async () => {
      // Mock das respostas do DB
      (db.getMessages as any).mockResolvedValue([
        { role: "user", content: "Olá JARVIS", createdAt: new Date() },
        { role: "assistant", content: "Olá Senhor", createdAt: new Date() },
      ]);
      (db.getMemory as any).mockResolvedValue([
        { category: "preference", value: "Gosto de café", importance: 5, createdAt: new Date() },
      ]);
      (db.getConversations as any).mockResolvedValue([]);

      const window = await memoryManager.loadMemoryWindow();

      expect(window.recentMessages).toHaveLength(2);
      expect(window.importantFacts).toHaveLength(1);
      expect(window.importantFacts[0].content).toBe("Gosto de café");
    });

    it("deve extrair fatos de uma mensagem usando LLM", async () => {
      (invokeLLM as any).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify([
              { type: "preference", content: "Prefere modo escuro", importance: 4 }
            ])
          }
        }]
      });

      const facts = await memoryManager.extractAndSaveFactsFromMessage("Eu prefiro modo escuro", "Entendido");

      expect(facts).toHaveLength(1);
      expect(facts[0].content).toBe("Prefere modo escuro");
      expect(db.saveMemory).toHaveBeenCalled();
    });
  });

  describe("JarvisProactiveEngine", () => {
    const userId = 1;
    let proactiveEngine: JarvisProactiveEngine;

    beforeEach(() => {
      proactiveEngine = new JarvisProactiveEngine(userId);
      vi.clearAllMocks();
    });

    it("deve detectar anomalias em campanhas de Ads", async () => {
      (db.getAdCampaigns as any).mockResolvedValue([{ id: 1, name: "Campanha Teste" }]);
      (db.getAdMetrics as any).mockResolvedValue([
        { ctr: 0.5, roi: 2.0, date: new Date(Date.now() - 86400000) },
        { ctr: 0.1, roi: 0.5, date: new Date() }, // Queda brusca
      ]);
      (db.getTasks as any).mockResolvedValue([]);
      (invokeLLM as any).mockResolvedValue({ choices: [{ message: { content: "[]" } }] });

      const context = await proactiveEngine.analyzeAndGenerateInsights();

      expect(context.insights.some(i => i.type === "anomaly")).toBe(true);
      expect(context.urgentItems.length).toBeGreaterThan(0);
    });

    it("deve identificar oportunidades de crescimento", async () => {
      (db.getAdCampaigns as any).mockResolvedValue([{ id: 1, name: "Campanha Top" }]);
      (db.getAdMetrics as any).mockResolvedValue([
        { ctr: 4.0, roi: 5.0, date: new Date(), clicks: 100 }, // Alta performance
      ]);
      (db.getTasks as any).mockResolvedValue([]);
      (invokeLLM as any).mockResolvedValue({ choices: [{ message: { content: "[]" } }] });

      const context = await proactiveEngine.analyzeAndGenerateInsights();

      expect(context.opportunityItems.length).toBeGreaterThan(0);
      expect(context.opportunityItems[0].title).toContain("High-Performing Campaign");
    });
  });

  describe("JARVIS Fluxo Completo (Mocked)", () => {
    const mockCtx = {
      user: { id: 1, name: "Tony Stark" },
    };

    it("deve processar uma mensagem, carregar memória e extrair fatos", async () => {
      // 1. Mock do DB para carregar contexto
      (db.createConversation as any).mockResolvedValue({ insertId: 101 });
      (db.getMessages as any).mockResolvedValue([]);
      (db.getMemory as any).mockResolvedValue([
        { key: "pref_1", category: "preference", value: JSON.stringify({ content: "Prefere café forte" }), importance: 5 }
      ]);
      (db.getAdCampaigns as any).mockResolvedValue([]);
      (db.getTasks as any).mockResolvedValue([]);
      (db.saveMessage as any).mockResolvedValue({ insertId: 1 });

      // 2. Mock do LLM para resposta e extração de fatos
      (invokeLLM as any)
        .mockResolvedValueOnce({ // Resposta do Chat
          choices: [{ message: { content: "Entendido, Senhor Stark. Vou preparar seu café forte." } }]
        })
        .mockResolvedValueOnce({ // Extração de fatos
          choices: [{ message: { content: "[]" } }]
        });

      const caller = jarvisUnifiedRouter.createCaller(mockCtx as any);
      
      const result = await caller.sendMessageWithContext({
        content: "Prepare meu café.",
        includeProactiveInsights: false
      });

      expect(result.content).toContain("Entendido, Senhor Stark");
      expect(result.memoryLoaded).toBeGreaterThan(0);
      expect(db.saveMessage).toHaveBeenCalled();
    });
  });
});
