import "dotenv/config";
import { jarvisUnifiedRouter } from "./routers.jarvis-unified";
import * as db from "./db";
import { vi } from "vitest";

// Mock do contexto do tRPC
const mockCtx = {
  user: {
    id: 1,
    name: "Tony Stark",
    openId: "tony-stark-id",
    email: "tony@starkindustries.com",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

async function runIntegrationTest() {
  console.log("🚀 Iniciando Teste de Integração do JARVIS Unified Router...\n");

  try {
    const caller = jarvisUnifiedRouter.createCaller(mockCtx as any);

    console.log("--- TESTE 1: Enviar mensagem com contexto de memória ---");
    const response1 = await caller.sendMessageWithContext({
      content: "Olá JARVIS, lembre-se que minha meta para este trimestre é aumentar o ROI em 20%.",
    });

    console.log("Resposta do JARVIS:");
    console.log(response1.content);
    console.log(`\nMemória carregada: ${response1.memoryLoaded}`);
    console.log(`Objetivos ativos: ${response1.objectivesActive}`);
    console.log(`Confiança estimada: ${response1.confidenceScore}`);
    console.log("\n---------------------------------------------------\n");

    console.log("--- TESTE 2: Verificar se o JARVIS lembra da meta ---");
    const response2 = await caller.sendMessageWithContext({
      conversationId: response1.conversationId,
      content: "Qual é minha meta mesmo?",
    });

    console.log("Resposta do JARVIS:");
    console.log(response2.content);
    console.log("\n---------------------------------------------------\n");

    console.log("--- TESTE 3: Verificar segurança e ferramentas aprendidas ---");
    const security = await caller.getSecurityStatus();
    const tools = await caller.getLearnedTools();
    console.log(`Status de segurança: ${security.status}`);
    console.log(`Ferramentas aprendidas: ${tools.length}`);

  } catch (error) {
    console.error("❌ Erro no teste de integração:", error);
  }
}

runIntegrationTest();
