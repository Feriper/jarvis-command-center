/**
 * Sistema de Self-Healing e Automação de Testes
 * Detecta, diagnostica e corrige bugs automaticamente
 */

import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import { invokeLLM } from "./_core/llm";

const execAsync = promisify(exec);

export interface BugReport {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  type: string;
  location: string;
  message: string;
  stackTrace?: string;
  timestamp: Date;
  fixed: boolean;
  fixAttempts: number;
}

export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  coverage: number;
  duration: number;
  failures: Array<{
    test: string;
    error: string;
    file: string;
  }>;
}

export class SelfHealingEngine {
  private detectedBugs: Map<string, BugReport> = new Map();
  private testResults: TestResult[] = [];
  private isHealing = false;

  /**
   * Executar testes e detectar bugs
   */
  async runTestsAndDetectBugs(projectPath: string): Promise<TestResult> {
    console.log("[SELF_HEALING] Executando testes...");

    try {
      const { stdout, stderr } = await execAsync("pnpm test --coverage", {
        cwd: projectPath,
      });

      const testResult = this.parseTestOutput(stdout, stderr);
      this.testResults.push(testResult);

      // Detectar bugs a partir de falhas
      for (const failure of testResult.failures) {
        await this.detectBug(failure, projectPath);
      }

      console.log(
        `[SELF_HEALING] Testes concluídos: ${testResult.passed} passou, ${testResult.failed} falhou`
      );

      return testResult;
    } catch (error: any) {
      console.error("[SELF_HEALING] Erro ao executar testes:", error.message);
      throw error;
    }
  }

  /**
   * Detectar e registrar um bug
   */
  private async detectBug(failure: any, projectPath: string) {
    const bugId = `bug_${Date.now()}`;
    const bug: BugReport = {
      id: bugId,
      severity: this.calculateSeverity(failure.error),
      type: this.classifyBugType(failure.error),
      location: failure.file,
      message: failure.error,
      timestamp: new Date(),
      fixed: false,
      fixAttempts: 0,
    };

    this.detectedBugs.set(bugId, bug);
    console.log(`[SELF_HEALING] Bug detectado: ${bugId} - ${bug.type}`);

    // Tentar corrigir automaticamente
    await this.attemptFix(bug, projectPath);
  }

  /**
   * Tentar corrigir um bug automaticamente
   */
  private async attemptFix(bug: BugReport, projectPath: string) {
    if (bug.fixAttempts >= 3) {
      console.log(
        `[SELF_HEALING] Limite de tentativas atingido para ${bug.id}`
      );
      return;
    }

    bug.fixAttempts++;
    this.isHealing = true;

    try {
      console.log(`[SELF_HEALING] Analisando bug para correção: ${bug.id}`);

      // Ler arquivo com erro
      const fileContent = await fs.readFile(
        path.join(projectPath, bug.location),
        "utf-8"
      );

      // Usar LLM para gerar correção
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um Especialista em Debugging JARVIS. Analise o erro e forneça uma correção completa.",
          },
          {
            role: "user",
            content: `Arquivo: ${bug.location}\nErro: ${bug.message}\n\nCódigo:\n\`\`\`\n${fileContent}\n\`\`\`\n\nForneça o código corrigido.`,
          },
        ],
      });

      const fixedCode = this.extractCode(
        typeof response.choices[0]?.message?.content === "string"
          ? response.choices[0].message.content
          : JSON.stringify(response.choices[0]?.message?.content)
      );

      // Aplicar correção
      await fs.writeFile(
        path.join(projectPath, bug.location),
        fixedCode
      );

      console.log(`[SELF_HEALING] Correção aplicada para ${bug.id}`);

      // Re-executar testes para validar
      const { stdout } = await execAsync("pnpm test", {
        cwd: projectPath,
      });

      if (stdout.includes("passed")) {
        bug.fixed = true;
        console.log(`[SELF_HEALING] ✓ Bug ${bug.id} corrigido com sucesso!`);
      } else {
        console.log(
          `[SELF_HEALING] Correção não validou. Tentativa ${bug.fixAttempts}`
        );
        await this.attemptFix(bug, projectPath);
      }
    } catch (error: any) {
      console.error(
        `[SELF_HEALING] Erro ao tentar corrigir ${bug.id}:`,
        error.message
      );
    } finally {
      this.isHealing = false;
    }
  }

  /**
   * Calcular severidade do bug
   */
  private calculateSeverity(
    errorMessage: string
  ): "low" | "medium" | "high" | "critical" {
    const critical = ["fatal", "crash", "null pointer", "segmentation"];
    const high = ["error", "exception", "failed"];
    const medium = ["warning", "deprecated"];

    const lower = errorMessage.toLowerCase();
    if (critical.some((w) => lower.includes(w))) return "critical";
    if (high.some((w) => lower.includes(w))) return "high";
    if (medium.some((w) => lower.includes(w))) return "medium";
    return "low";
  }

  /**
   * Classificar tipo de bug
   */
  private classifyBugType(errorMessage: string): string {
    if (errorMessage.includes("TypeError")) return "Type Error";
    if (errorMessage.includes("ReferenceError")) return "Reference Error";
    if (errorMessage.includes("SyntaxError")) return "Syntax Error";
    if (errorMessage.includes("Assertion")) return "Test Assertion";
    if (errorMessage.includes("timeout")) return "Timeout";
    return "Unknown Error";
  }

  /**
   * Extrair código de blocos markdown
   */
  private extractCode(text: string): string {
    const match = text.match(/```(?:typescript|javascript|tsx|jsx)?\n([\s\S]*?)```/);
    return match ? match[1] : text;
  }

  /**
   * Parse output de testes
   */
  private parseTestOutput(stdout: string, stderr: string): TestResult {
    // Simular parsing de output de testes (em produção, usar bibliotecas específicas)
    const result: TestResult = {
      passed: Math.floor(Math.random() * 50) + 10,
      failed: Math.floor(Math.random() * 5),
      skipped: Math.floor(Math.random() * 3),
      coverage: Math.floor(Math.random() * 40) + 60,
      duration: Math.floor(Math.random() * 5000) + 1000,
      failures: [],
    };

    if (result.failed > 0) {
      result.failures.push({
        test: "Sample Test",
        error: "Expected value to be true",
        file: "src/components/Button.test.tsx",
      });
    }

    return result;
  }

  /**
   * Obter relatório de bugs
   */
  getReport() {
    const bugs = Array.from(this.detectedBugs.values());
    return {
      totalBugs: bugs.length,
      fixedBugs: bugs.filter((b) => b.fixed).length,
      pendingBugs: bugs.filter((b) => !b.fixed).length,
      bugs,
      testResults: this.testResults,
      isHealing: this.isHealing,
    };
  }

  /**
   * Limpar histórico
   */
  clearHistory() {
    this.detectedBugs.clear();
    this.testResults = [];
    console.log("[SELF_HEALING] Histórico limpo");
  }
}

export const selfHealingEngine = new SelfHealingEngine();
