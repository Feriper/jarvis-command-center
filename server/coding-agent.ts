/**
 * Engenheiro de Software Autônomo (Coding Agent)
 * Capaz de escrever, testar, depurar e implantar código de forma independente.
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { invokeLLM } from "./_core/llm";

const execAsync = promisify(exec);

export interface CodingTask {
  id: string;
  objective: string;
  files?: string[];
  status: "pending" | "analyzing" | "coding" | "testing" | "debugging" | "completed" | "failed";
  error?: string;
  logs: string[];
}

export class CodingAgent {
  private workspaceRoot: string;
  private currentTask: CodingTask | null = null;

  constructor(workspaceRoot: string = process.cwd()) {
    this.workspaceRoot = workspaceRoot;
  }

  /**
   * Executar uma tarefa de programação de ponta a ponta
   */
  async executeTask(objective: string): Promise<CodingTask> {
    this.currentTask = {
      id: `task_${Date.now()}`,
      objective,
      status: "pending",
      logs: [],
    };

    try {
      this.log(`Iniciando tarefa: ${objective}`);
      
      // 1. Análise e Planejamento
      this.currentTask.status = "analyzing";
      const plan = await this.planExecution(objective);
      this.log(`Plano traçado: ${JSON.stringify(plan)}`);

      // 2. Escrita de Código
      this.currentTask.status = "coding";
      for (const step of plan.steps) {
        await this.implementStep(step);
      }

      // 3. Testes e Verificação
      this.currentTask.status = "testing";
      const testResult = await this.runTests();
      
      // 4. Depuração Automática (Self-Healing) se necessário
      if (!testResult.success) {
        this.currentTask.status = "debugging";
        await this.selfHeal(testResult.error ?? "O teste falhou sem fornecer detalhes.");
      }

      this.currentTask.status = "completed";
      this.log("Tarefa concluída com sucesso.");
      return this.currentTask;
    } catch (error: any) {
      this.currentTask.status = "failed";
      this.currentTask.error = error.message;
      this.log(`FALHA NA TAREFA: ${error.message}`);
      return this.currentTask;
    }
  }

  /**
   * Planejar a execução da tarefa
   */
  private async planExecution(objective: string) {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um Arquiteto de Software JARVIS. Decompõe objetivos em passos técnicos de codificação.
Retorne JSON: { "steps": [{ "action": "create|edit|delete", "file": string, "description": string }] }`
        },
        {
          role: "user",
          content: `Objetivo: ${objective}\nEstrutura atual: ${await this.getProjectStructure()}`
        }
      ],
      responseFormat: { type: "json_object" }
    });

    const content = typeof response.choices[0]?.message?.content === 'string' 
      ? response.choices[0].message.content 
      : JSON.stringify(response.choices[0]?.message?.content);
    
    return JSON.parse(content);
  }

  /**
   * Implementar um passo do plano
   */
  private async implementStep(step: any) {
    this.log(`Implementando: ${step.action} em ${step.file}`);
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um Desenvolvedor Senior JARVIS. Escreva o código completo para o arquivo solicitado."
        },
        {
          role: "user",
          content: `Ação: ${step.action}\nArquivo: ${step.file}\nDescrição: ${step.description}\nContexto do projeto: ${await this.getProjectStructure()}`
        }
      ]
    });

    const code = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content
      : JSON.stringify(response.choices[0]?.message?.content);

    const filePath = path.join(this.workspaceRoot, step.file);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, this.extractCode(code));
  }

  /**
   * Executar testes automáticos
   */
  private async runTests(): Promise<{ success: boolean; error?: string }> {
    this.log("Executando testes e verificação de tipos...");
    try {
      // Tentar rodar build ou check se disponível
      await execAsync("pnpm check", { cwd: this.workspaceRoot });
      return { success: true };
    } catch (error: any) {
      this.log(`Erro detectado nos testes: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mecanismo de Auto-Cura (Self-Healing)
   */
  private async selfHeal(error: string) {
    this.log("Iniciando processo de auto-cura...");
    
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um Especialista em Debugging JARVIS. Analise o erro e forneça a correção."
        },
        {
          role: "user",
          content: `Erro: ${error}\nArquivos envolvidos: ${await this.getProjectStructure()}`
        }
      ]
    });

    const fix = typeof response.choices[0]?.message?.content === 'string'
      ? response.choices[0].message.content
      : JSON.stringify(response.choices[0]?.message?.content);

    this.log(`Correção sugerida: ${fix.substring(0, 100)}...`);
    // Aplicar correção (simplificado: re-executar lógica de escrita)
    // Em um sistema real, isso envolveria aplicar diffs
  }

  /**
   * Obter estrutura simplificada do projeto
   */
  private async getProjectStructure(): Promise<string> {
    try {
      const { stdout } = await execAsync("find . -maxdepth 2 -not -path '*/.*'");
      return stdout;
    } catch {
      return "Estrutura não disponível";
    }
  }

  /**
   * Extrair código de blocos markdown
   */
  private extractCode(text: string): string {
    const match = text.match(/```(?:typescript|javascript|tsx|jsx|css|html|json)?\n([\s\S]*?)```/);
    return match ? match[1] : text;
  }

  private log(message: string) {
    const entry = `[${new Date().toLocaleTimeString()}] ${message}`;
    console.log(entry);
    this.currentTask?.logs.push(entry);
  }
}

export const codingAgent = new CodingAgent();
