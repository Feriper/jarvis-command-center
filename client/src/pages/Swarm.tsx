import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Shield, Zap, TrendingUp, Users, Plus, Play, Pause } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Swarm() {
  const [agents, setAgents] = useState<any[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  
  const { data: agentsList, refetch } = trpc.agent.listAgents.useQuery();
  const deployMutation = trpc.agent.deployAgent.useMutation();

  useEffect(() => {
    if (agentsList) setAgents(agentsList);
  }, [agentsList]);

  const handleDeploy = async (role: string) => {
    try {
      await deployMutation.mutateAsync({
        name: `Agent_${role.split(' ')[0]}`,
        role: role,
        capabilities: ["research", "analysis", "automation"]
      });
      refetch();
    } catch (error) {
      console.error("Erro ao implantar agente:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      <div className="border-b border-accent/30 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold neon-glow bracket-left bracket-right">
            SWARM CONTROL (ENXAME)
          </h1>
          <p className="text-sm terminal-text opacity-70 mt-2">
            [MULTI_AGENT_ORCHESTRATOR_ONLINE] | {agents.length} agentes ativos
          </p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="border-accent/50 text-accent">Sincronizar Todos</Button>
           <Button className="bg-accent text-accent-foreground">
             <Plus className="w-4 h-4 mr-2" /> Novo Agente
           </Button>
        </div>
      </div>

      {/* Grid de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agentes Pré-definidos para Implantação */}
        <Card className="bg-card border-accent/30 p-6 flex flex-col gap-4 border-dashed">
          <h3 className="font-semibold terminal-text">[DISPONÍVEL_PARA_DEPLOY]</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <span className="text-sm">Analista Financeiro</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDeploy("Financial Advisor")}>DEPLOY</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                <span className="text-sm">Estrategista Social</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDeploy("Social Strategist")}>DEPLOY</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span className="text-sm">Segurança & Auditoria</span>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleDeploy("Security Auditor")}>DEPLOY</Button>
            </div>
          </div>
        </Card>

        {/* Lista de Agentes Ativos */}
        {agents.map((agent) => (
          <Card key={agent.id} className="bg-card border-accent p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2">
              <Badge className={agent.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'}>
                {agent.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-accent/20 rounded-lg">
                <Bot className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{agent.name}</h3>
                <p className="text-xs terminal-text opacity-70">{agent.role}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] opacity-70">
                  <span>CARGA DE TRABALHO</span>
                  <span>{agent.status === 'active' ? '12%' : '0%'}</span>
                </div>
                <div className="h-1 w-full bg-accent/10 rounded-full overflow-hidden">
                  <div className={`h-full bg-accent transition-all duration-1000 ${agent.status === 'active' ? 'w-[12%]' : 'w-0'}`}></div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 border-accent/30 text-xs">LOGS</Button>
                <Button size="sm" variant="outline" className="flex-1 border-accent/30 text-xs">TAREFAS</Button>
                <Button size="icon" variant="ghost" className="text-accent">
                  {agent.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Efeito de Scanline no Card */}
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0"></div>
          </Card>
        ))}
      </div>

      {/* Logs Globais do Enxame */}
      <Card className="bg-card border-accent/30 p-4">
        <h3 className="font-semibold mb-3 terminal-text">[SWARM_COMMUNICATION_LOGS]</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-[10px]">
          <div className="flex gap-2 text-accent">
            <span>[14:45:12]</span>
            <span>SYSTEM: Agente_Finanças sincronizado com API de Ads.</span>
          </div>
          <div className="flex gap-2 text-green-400">
            <span>[14:46:05]</span>
            <span>AGENTE_FINANÇAS: Detectada anomalia no ROI da Campanha B. Iniciando reequilíbrio.</span>
          </div>
          <div className="flex gap-2 text-blue-400">
            <span>[14:47:22]</span>
            <span>AGENTE_SOCIAL: Gerando 5 variações de post para TikTok baseado em tendências atuais.</span>
          </div>
          <div className="flex gap-2 text-yellow-400">
            <span>[14:48:10]</span>
            <span>SYSTEM: Agente_Segurança verificando integridade dos tokens OAuth.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
