import { describe, expect, it, vi, beforeEach } from "vitest";
import { createToolDiscovery } from "./jarvis-tool-discovery";
import { createGuardianProtocol } from "./jarvis-guardian-protocol";

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
  createAlert: vi.fn(),
}));

// Mock do LLM
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import * as db from "./db";
import { invokeLLM } from "./_core/llm";

describe("JARVIS Beyond - Testes de Capacidades de Fronteira", () => {
  
  describe("ToolDiscoveryEngine", () => {
    it("deve aprender a usar uma nova API autonomamente", async () => {
      const discovery = createToolDiscovery(1);
      (invokeLLM as any).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              name: "Stripe API",
              purpose: "Processamento de pagamentos",
              endpoint: "https://api.stripe.com/v1",
              authType: "apiKey",
              usageExample: "stripe.charges.create(...)"
            })
          }
        }]
      });

      const tool = await discovery.discoverAndLearn("Stripe");
      expect(tool).not.toBeNull();
      expect(tool?.name).toBe("Stripe API");
      expect(db.saveMemory).toHaveBeenCalled();
    });
  });

  describe("GuardianProtocol", () => {
    it("deve detectar e bloquear atividades suspeitas", async () => {
      const guardian = createGuardianProtocol(1);
      const threat = await guardian.monitorActivity("Minha secret_key é 12345", "Chat Test");
      
      expect(threat).not.toBeNull();
      expect(threat?.status).toBe("blocked");
      expect(db.saveMemory).toHaveBeenCalled();
      expect(db.createAlert).toHaveBeenCalled();
    });

    it("deve validar se um recurso é seguro", async () => {
      const guardian = createGuardianProtocol(1);
      const safe = await guardian.validateResource("https://google.com");
      const unsafe = await guardian.validateResource("https://phishing.net/login");
      
      expect(safe.isSafe).toBe(true);
      expect(unsafe.isSafe).toBe(false);
    });
  });
});
