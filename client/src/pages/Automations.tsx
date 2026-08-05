import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Zap, Bell, TrendingUp, Calendar, Trash2, Play, Pause, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Automations() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTrigger, setNewTrigger] = useState({
    name: "",
    type: "ad_performance",
    condition: { metric: "ctr", operator: "lt", value: 2 },
    action: { type: "alert", severity: "critical", message: "CTR baixo detectado!" }
  });

  const { data: triggersList, refetch } = trpc.automation.listTriggers.useQuery();
  const createTriggerMutation = trpc.automation.createTrigger.useMutation();
  const updateTriggerMutation = trpc.automation.updateTrigger.useMutation();

  useEffect(() => {
    if (triggersList) {
      setTriggers(triggersList);
      setLoading(false);
    }
  }, [triggersList]);

  const handleAddTrigger = async () => {
    if (!newTrigger.name) return;
    try {
      await createTriggerMutation.mutateAsync(newTrigger as any);
      setIsAdding(false);
      setNewTrigger({
        name: "",
        type: "ad_performance",
        condition: { metric: "ctr", operator: "lt", value: 2 },
        action: { type: "alert", severity: "critical", message: "CTR baixo detectado!" }
      });
      refetch();
    } catch (error) {
      console.error("Erro ao criar gatilho:", error);
    }
  };

  const handleToggleTrigger = async (id: number, currentStatus: boolean) => {
    try {
      await updateTriggerMutation.mutateAsync({ id, isEnabled: !currentStatus });
      refetch();
    } catch (error) {
      console.error("Erro ao atualizar gatilho:", error);
    }
  };

  const typeIcons = {
    ad_performance: TrendingUp,
    social_growth: Zap,
    task_deadline: Calendar,
    scheduled: Bell,
  };

  const typeLabels = {
    ad_performance: "Performance de Ads",
    social_growth: "Crescimento Social",
    task_deadline: "Prazo de Tarefa",
    scheduled: "Agendado",
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold neon-glow bracket-left bracket-right">
            AUTOMAÇÕES & GATILHOS
          </h1>
          <p className="text-sm terminal-text opacity-70 mt-2">
            [AUTOMATION_ENGINE_ACTIVE] | {triggers.length} regras ativas
          </p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Formulário de Adição */}
      {isAdding && (
        <Card className="bg-card border-accent p-6 space-y-4 fade-in">
          <h3 className="font-semibold terminal-text">[NOVA_REGRA]</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs opacity-70">Nome da Regra</label>
              <Input 
                value={newTrigger.name}
                onChange={(e) => setNewTrigger({...newTrigger, name: e.target.value})}
                placeholder="Ex: Alerta de CTR Baixo"
                className="bg-input border-accent/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs opacity-70">Tipo de Gatilho</label>
              <select 
                value={newTrigger.type}
                onChange={(e) => setNewTrigger({...newTrigger, type: e.target.value as any})}
                className="w-full h-10 bg-input border border-accent/30 rounded px-3 text-sm"
              >
                <option value="ad_performance">Performance de Ads</option>
                <option value="social_growth">Crescimento Social</option>
                <option value="task_deadline">Prazo de Tarefa</option>
                <option value="scheduled">Agendado</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button onClick={handleAddTrigger} className="bg-accent text-accent-foreground">Salvar Regra</Button>
          </div>
        </Card>
      )}

      {/* Lista de Gatilhos */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <Card className="p-8 text-center opacity-50">Carregando motores de automação...</Card>
        ) : triggers.length === 0 && !isAdding ? (
          <Card className="p-8 text-center border-dashed border-accent/30">
            <p className="text-muted-foreground mb-4">Nenhuma regra de automação configurada.</p>
            <Button variant="outline" onClick={() => setIsAdding(true)}>Criar Primeira Regra</Button>
          </Card>
        ) : (
          triggers.map((trigger) => {
            const Icon = typeIcons[trigger.type as keyof typeof typeIcons] || Zap;
            return (
              <Card key={trigger.id} className={`bg-card border-2 p-4 transition-all ${trigger.isEnabled ? "border-accent/50" : "border-accent/10 opacity-60"}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${trigger.isEnabled ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{trigger.name}</h3>
                      <Badge variant="outline" className="text-[10px] opacity-70">{typeLabels[trigger.type as keyof typeof typeLabels]}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{trigger.description || "Sem descrição adicional"}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-[10px] terminal-text opacity-50">
                        CONDIÇÃO: {JSON.stringify(trigger.condition)}
                      </span>
                      <span className="text-[10px] terminal-text opacity-50">
                        AÇÃO: {JSON.stringify(trigger.action)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleToggleTrigger(trigger.id, trigger.isEnabled)}
                      className={trigger.isEnabled ? "text-accent" : "text-muted-foreground"}
                    >
                      {trigger.isEnabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Logs de Automação */}
      <Card className="bg-card border-accent/30 p-4">
        <h3 className="font-semibold mb-3 terminal-text">[AUTOMATION_LOGS]</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-[10px]">
          <div className="flex gap-2 text-green-400">
            <span>[2026-08-04 14:20:01]</span>
            <span>Gatilho 'CTR Baixo' verificado. Status: NORMAL (2.4%)</span>
          </div>
          <div className="flex gap-2 text-yellow-400">
            <span>[2026-08-04 12:00:00]</span>
            <span>Relatório semanal gerado e enviado para processamento.</span>
          </div>
          <div className="flex gap-2 text-accent">
            <span>[2026-08-04 10:15:32]</span>
            <span>Sincronização de métricas sociais concluída com sucesso.</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
