import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Code2,
  Play,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader,
  FileCode,
  GitBranch,
  Bug,
  Wrench,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function CodingAgent() {
  const [objective, setObjective] = useState("");
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [enableSelfHealing, setEnableSelfHealing] = useState(true);

  const startTaskMutation = trpc.coding.startTask.useMutation();
  const listTasksQuery = trpc.coding.listTasks.useQuery();
  const enableSelfHealingMutation = trpc.coding.enableSelfHealing.useMutation();

  const handleStartTask = async () => {
    if (!objective.trim()) return;

    try {
      const result = await startTaskMutation.mutateAsync({
        objective,
      });

      if (result.success) {
        setSelectedTask(result.task.id);
        setObjective("");
        listTasksQuery.refetch();
      }
    } catch (error) {
      console.error("Erro ao iniciar tarefa:", error);
    }
  };

  const handleToggleSelfHealing = async () => {
    try {
      await enableSelfHealingMutation.mutateAsync({
        enabled: !enableSelfHealing,
      });
      setEnableSelfHealing(!enableSelfHealing);
    } catch (error) {
      console.error("Erro ao alternar self-healing:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 border-green-500/30 text-green-400";
      case "failed":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      case "testing":
      case "debugging":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      default:
        return "bg-accent/10 border-accent/30 text-accent";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      case "coding":
      case "testing":
        return <Loader className="w-4 h-4 animate-spin" />;
      case "debugging":
        return <Bug className="w-4 h-4" />;
      default:
        return <Code2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-accent/30 p-6 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 className="w-8 h-8 text-accent neon-glow" />
            <div>
              <h1 className="text-3xl font-bold neon-glow">ENGENHEIRO DE SOFTWARE AUTÔNOMO</h1>
              <p className="text-xs terminal-text opacity-70 mt-1">
                [AUTONOMOUS_CODING_ENGINE] | [SELF_HEALING_ENABLED] | [AUTO_TEST_RUNNER]
              </p>
            </div>
          </div>
          <Button
            onClick={handleToggleSelfHealing}
            className={
              enableSelfHealing
                ? "bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30"
            }
            variant="outline"
          >
            <Wrench className="w-4 h-4 mr-2" />
            Self-Healing: {enableSelfHealing ? "ON" : "OFF"}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Task Input */}
        <Card className="bg-card border-accent/30 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Nova Tarefa de Programação
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">
                Descreva o que você quer que o JARVIS programe:
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Ex: Criar um componente React de tabela com paginação, ordenação e filtros. Incluir testes unitários."
                className="w-full bg-input border border-accent/30 rounded px-3 py-2 text-foreground placeholder-muted-foreground/50 min-h-24"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleStartTask}
                className="bg-accent hover:bg-accent/90 text-accent-foreground flex-1"
                disabled={!objective.trim() || startTaskMutation.isPending}
              >
                <Play className="w-4 h-4 mr-2" />
                {startTaskMutation.isPending ? "Iniciando..." : "Iniciar Tarefa"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tarefas Recentes */}
        <Card className="bg-card border-accent/30 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-accent" />
            Tarefas Recentes
          </h2>

          {listTasksQuery.data && listTasksQuery.data.length > 0 ? (
            <div className="space-y-3">
              {listTasksQuery.data.slice(0, 10).map((task: any) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task.id)}
                  className={`p-4 rounded border cursor-pointer transition ${
                    selectedTask === task.id
                      ? "bg-accent/20 border-accent"
                      : "bg-card border-accent/20 hover:border-accent/40"
                  } ${getStatusColor(task.status)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{task.objective}</p>
                        <p className="text-xs text-muted-foreground mt-1">{task.id}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>

                  {task.error && (
                    <p className="text-xs text-red-400 mt-2">Erro: {task.error}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma tarefa iniciada ainda.</p>
          )}
        </Card>

        {/* Detalhes da Tarefa Selecionada */}
        {selectedTask && (
          <Card className="bg-card border-accent/30 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-accent" />
              Detalhes da Tarefa
            </h2>

            {listTasksQuery.data && (
              (() => {
                const task = listTasksQuery.data.find((t: any) => t.id === selectedTask);
                return task ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-accent/5 rounded border border-accent/20">
                      <p className="text-xs text-muted-foreground mb-1">OBJETIVO</p>
                      <p className="text-sm">{task.objective}</p>
                    </div>

                    <div className="p-3 bg-accent/5 rounded border border-accent/20">
                      <p className="text-xs text-muted-foreground mb-1">STATUS</p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(task.status)}
                        <Badge variant="outline">{task.status}</Badge>
                      </div>
                    </div>

                    {task.logs && task.logs.length > 0 && (
                      <div className="p-3 bg-black/30 rounded border border-accent/20 font-mono text-xs max-h-48 overflow-y-auto">
                        <p className="text-xs text-muted-foreground mb-2">LOGS</p>
                        {task.logs.map((log: string, idx: number) => (
                          <p key={idx} className="text-green-400">
                            {log}
                          </p>
                        ))}
                      </div>
                    )}

                    {task.error && (
                      <div className="p-3 bg-red-500/10 rounded border border-red-500/30">
                        <p className="text-xs text-red-400 font-semibold mb-1">ERRO</p>
                        <p className="text-sm text-red-300">{task.error}</p>
                      </div>
                    )}
                  </div>
                ) : null;
              })()
            )}
          </Card>
        )}

        {/* Capacidades */}
        <Card className="bg-card border-accent/30 p-6">
          <h2 className="text-lg font-semibold mb-4">Capacidades do JARVIS Engenheiro</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="font-semibold text-sm">✓ Análise e Planejamento</p>
              <p className="text-xs text-muted-foreground mt-1">Decompõe objetivos em arquitetura técnica</p>
            </div>
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="font-semibold text-sm">✓ Escrita de Código</p>
              <p className="text-xs text-muted-foreground mt-1">Gera código TypeScript/React de qualidade</p>
            </div>
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="font-semibold text-sm">✓ Testes Automáticos</p>
              <p className="text-xs text-muted-foreground mt-1">Executa verificação de tipos e testes</p>
            </div>
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="font-semibold text-sm">✓ Self-Healing</p>
              <p className="text-xs text-muted-foreground mt-1">Detecta e corrige bugs automaticamente</p>
            </div>
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="font-semibold text-sm">✓ Revisão de Código</p>
              <p className="text-xs text-muted-foreground mt-1">Análise de qualidade e segurança</p>
            </div>
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="font-semibold text-sm">✓ Documentação</p>
              <p className="text-xs text-muted-foreground mt-1">Gera README e comentários automáticos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-accent/30 p-4 bg-card/50 text-xs terminal-text opacity-50 text-center">
        [CODING_AGENT_READY] | [SELF_HEALING: {enableSelfHealing ? "ACTIVE" : "INACTIVE"}] | [AUTO_TEST_ENABLED]
      </div>
    </div>
  );
}
