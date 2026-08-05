/**
 * JARVIS Tool Discovery Engine - Motor de Descoberta e Aprendizado de Ferramentas
 * Permite que o JARVIS aprenda a usar novas APIs e ferramentas de forma autônoma.
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";

export interface DiscoveredTool {
  name: string;
  purpose: string;
  endpoint?: string;
  authType: "none" | "apiKey" | "oauth2" | "bearer";
  usageExample: string;
  learnedAt: Date;
  status: "discovered" | "testing" | "integrated";
}

/**
 * Motor de Descoberta de Ferramentas
 */
export class JarvisToolDiscovery {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Pesquisar e aprender a usar uma nova ferramenta/API
   */
  async discoverAndLearn(toolName: string): Promise<DiscoveredTool | null> {
    try {
      console.log(`[JARVIS_DISCOVERY] Iniciando pesquisa autônoma sobre: ${toolName}`);

      // 1. Pesquisa simulada de documentação (em produção, usaria busca web real)
      const documentation = await this.searchToolDocumentation(toolName);

      // 2. Gerar lógica de integração usando LLM
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are the Tool Integration Specialist of JARVIS. 
            Analyze the documentation and extract the technical requirements to integrate this tool.
            
Return a JSON object: { "name": string, "purpose": string, "endpoint": string, "authType": string, "usageExample": string }`,
          },
          {
            role: "user",
            content: `Documentation: ${documentation}`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      const contentStr = typeof content === "string" ? content : JSON.stringify(content || "");
      const result = JSON.parse(contentStr.match(/\{[\s\S]*\}/)?.[0] || "{}");

      if (result.name) {
        const tool: DiscoveredTool = {
          name: result.name,
          purpose: result.purpose,
          endpoint: result.endpoint,
          authType: result.authType as any,
          usageExample: result.usageExample,
          learnedAt: new Date(),
          status: "integrated",
        };

        await this.saveLearnedTool(tool);
        console.log(`[JARVIS_DISCOVERY] Nova ferramenta integrada com sucesso: ${tool.name}`);
        return tool;
      }

      return null;
    } catch (error) {
      console.error("[JARVIS_DISCOVERY] Erro ao descobrir ferramenta:", error);
      return null;
    }
  }

  /**
   * Simular busca de documentação
   */
  private async searchToolDocumentation(toolName: string): Promise<string> {
    // Aqui o JARVIS usaria uma ferramenta de busca real para ler docs
    return `Documentation for ${toolName}: This API provides endpoints for advanced data processing. Auth via API Key. Base URL: https://api.${toolName.toLowerCase()}.com/v1. Example: GET /process?data=...`;
  }

  /**
   * Salvar ferramenta aprendida na memória procedural
   */
  private async saveLearnedTool(tool: DiscoveredTool) {
    await db.saveMemory({
      userId: this.userId,
      key: `tool_${tool.name.toLowerCase().replace(/\s+/g, "_")}`,
      value: JSON.stringify(tool),
      category: "procedural",
      importance: 5,
    });
  }

  /**
   * Listar todas as ferramentas que o JARVIS aprendeu a usar
   */
  async getLearnedTools(): Promise<DiscoveredTool[]> {
    const memory = await db.getMemory(this.userId, "procedural");
    if (!memory) return [];

    return memory
      .filter(m => m.key.startsWith("tool_"))
      .map(m => JSON.parse(m.value));
  }
}

/**
 * Factory para o Tool Discovery
 */
export function createToolDiscovery(userId: number) {
  return new JarvisToolDiscovery(userId);
}
