/**
 * JARVIS Guardian Protocol - Protocolo de Segurança Ativa
 * Monitora ameaças, protege dados sensíveis e garante a integridade do sistema.
 */

import * as db from "./db";

export interface SecurityThreat {
  id: string;
  type: "unauthorized_access" | "suspicious_activity" | "data_leak" | "malicious_content";
  severity: "low" | "medium" | "high" | "critical";
  source: string;
  timestamp: Date;
  status: "detected" | "blocked" | "resolved";
  actionTaken: string;
}

/**
 * Protocolo de Segurança do JARVIS
 */
export class JarvisGuardianProtocol {
  private userId: number;

  constructor(userId: number) {
    this.userId = userId;
  }

  /**
   * Monitorar atividades e detectar ameaças em tempo real
   */
  async monitorActivity(activity: string, source: string): Promise<SecurityThreat | null> {
    console.log(`[JARVIS_GUARDIAN] Monitorando atividade de: ${source}`);

    // Lógica simplificada de detecção de ameaças (em produção, usaria heurísticas complexas e IA)
    if (activity.toLowerCase().includes("password") || activity.toLowerCase().includes("secret_key")) {
      const threat: SecurityThreat = {
        id: `threat_${Date.now()}`,
        type: "suspicious_activity",
        severity: "high",
        source,
        timestamp: new Date(),
        status: "blocked",
        actionTaken: "Acesso a dados sensíveis bloqueado e registrado para análise.",
      };

      await this.logThreat(threat);
      console.warn(`[JARVIS_GUARDIAN] Ameaça detectada e bloqueada: ${threat.type}`);
      return threat;
    }

    return null;
  }

  /**
   * Validar segurança de um recurso (URL, arquivo, domínio)
   */
  async validateResource(resource: string): Promise<{ isSafe: boolean; reason?: string }> {
    // Simular verificação de reputação
    const suspiciousDomains = ["malware.com", "phishing.net", "scam.io"];
    
    for (const domain of suspiciousDomains) {
      if (resource.includes(domain)) {
        return { isSafe: false, reason: "Recurso associado a domínios de baixa reputação." };
      }
    }

    return { isSafe: true };
  }

  /**
   * Registrar ameaça no banco de dados
   */
  private async logThreat(threat: SecurityThreat) {
    await db.saveMemory({
      userId: this.userId,
      key: `threat_${threat.id}`,
      value: JSON.stringify(threat),
      category: "monitoring",
      importance: threat.severity === "critical" ? 10 : 5,
    });

    // Criar alerta imediato
    await db.createAlert?.({
      userId: this.userId,
      type: "system_alert",
      title: "Alerta de segurança do Guardian",
      message: `[GUARDIAN] Ameaça ${threat.severity} detectada: ${threat.actionTaken}`,
      severity: threat.severity,
      read: false,
    });
  }

  /**
   * Obter histórico de ameaças recentes
   */
  async getRecentThreats(): Promise<SecurityThreat[]> {
    const memory = await db.getMemory(this.userId, "monitoring");
    if (!memory) return [];

    return memory
      .filter(m => m.key.startsWith("threat_"))
      .map(m => JSON.parse(m.value))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

/**
 * Factory para o Guardian Protocol
 */
export function createGuardianProtocol(userId: number) {
  return new JarvisGuardianProtocol(userId);
}
