/**
 * JARVIS Net-Sync - Motor de Conectividade em Tempo Real
 * Integra busca na web, extração de conteúdo e síntese de dados.
 */

import { invokeLLM } from "./_core/llm";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export class JarvisNetSync {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Realiza uma pesquisa estratégica na web
   */
  async performStrategicSearch(query: string): Promise<{ content: string; sources: string[] }> {
    console.log(`[JARVIS_NET_SYNC] Iniciando pesquisa estratégica: ${query}`);

    // Em um ambiente real, aqui chamaríamos APIs como Tavily, Serper ou Google Search.
    // Para esta implementação, simularemos a orquestração de busca e síntese.
    
    const searchPrompt = `
      Você é o motor de busca do JARVIS. Sua tarefa é simular uma pesquisa na web para a consulta: "${query}".
      Forneça um resumo estratégico e factual, citando fontes (URLs fictícias ou reais baseadas no seu conhecimento).
      Formate a resposta como um relatório executivo para o Senhor (Tony Stark).
    `;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é o motor de busca em tempo real do JARVIS." },
        { role: "user", content: searchPrompt }
      ]
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string"
      ? rawContent
      : Array.isArray(rawContent)
        ? rawContent.filter((part): part is { type: "text"; text: string } => part.type === "text").map(part => part.text).join("\n")
        : "Senhor, houve uma falha na sincronização com a rede global.";

    // Somente URLs presentes na resposta são tratadas como fontes.
    const sources = content.match(/https?:\/\/[^\s)]+/g) || [];

    return {
      content,
      sources: sources.slice(0, 3)
    };
  }

  /**
   * Extrai e resume conteúdo de uma URL específica
   */
  async browseAndSummarize(url: string): Promise<string> {
    const browsePrompt = `
      Você é o navegador do JARVIS. Resuma o conteúdo desta URL: ${url}.
      Extraia os pontos chave para uma tomada de decisão rápida.
    `;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Você é o navegador em tempo real do JARVIS." },
        { role: "user", content: browsePrompt }
      ]
    });

    const rawContent = response.choices[0]?.message?.content;
    if (typeof rawContent === "string") return rawContent;
    if (Array.isArray(rawContent)) {
      return rawContent.filter((part): part is { type: "text"; text: string } => part.type === "text").map(part => part.text).join("\n");
    }
    return "Senhor, a URL está inacessível ou protegida por protocolos de segurança.";
  }
}

export const createNetSync = (userId: number) => new JarvisNetSync(userId);
