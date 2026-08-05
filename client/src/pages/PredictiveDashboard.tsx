import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Eye,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Target,
  Lightbulb,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PredictiveDashboard() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const startMonitoringMutation = trpc.autonomous.startMonitoring.useMutation();
  const stopMonitoringMutation = trpc.autonomous.stopMonitoring.useMutation();
  const monitoringStatusQuery = trpc.autonomous.getMonitoringStatus.useQuery();
  const reportQuery = trpc.autonomous.getMonitoringReport.useQuery();
  const summaryQuery = trpc.autonomous.getDailyExecutiveSummary.useQuery();

  const handleStartMonitoring = async () => {
    try {
      await startMonitoringMutation.mutateAsync({
        checkIntervalMinutes: 15,
      });
      setIsMonitoring(true);
      monitoringStatusQuery.refetch();
    } catch (error) {
      console.error("Erro ao iniciar monitoramento:", error);
    }
  };

  const handleStopMonitoring = async () => {
    try {
      await stopMonitoringMutation.mutateAsync();
      setIsMonitoring(false);
      monitoringStatusQuery.refetch();
    } catch (error) {
      console.error("Erro ao parar monitoramento:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-accent/30 p-6 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-accent neon-glow" />
            <div>
              <h1 className="text-3xl font-bold neon-glow">DASHBOARD PREDITIVO</h1>
              <p className="text-xs terminal-text opacity-70 mt-1">
                [PREDICTIVE_ANALYTICS_ENGINE] | [REAL_TIME_MONITORING]
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={
                isMonitoring || monitoringStatusQuery.data?.isActive
                  ? handleStopMonitoring
                  : handleStartMonitoring
              }
              className={
                isMonitoring || monitoringStatusQuery.data?.isActive
                  ? "bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30"
                  : "bg-accent hover:bg-accent/90 text-accent-foreground"
              }
              variant={
                isMonitoring || monitoringStatusQuery.data?.isActive
                  ? "outline"
                  : "default"
              }
            >
              <Eye className="w-4 h-4 mr-2" />
              {isMonitoring || monitoringStatusQuery.data?.isActive
                ? "Parar Vigilância"
                : "Iniciar Vigilância 24h"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Alerts */}
          <Card className="bg-card border-accent/30 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ALERTAS CRÍTICOS</p>
                <p className="text-3xl font-bold text-red-400">
                  {reportQuery.data?.report?.alerts?.filter(
                    (a: any) => a.severity === "critical"
                  ).length || 0}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
          </Card>

          {/* Anomalies */}
          <Card className="bg-card border-accent/30 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ANOMALIAS DETECTADAS</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {reportQuery.data?.report?.anomaliesDetected || 0}
                </p>
              </div>
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
          </Card>

          {/* Opportunities */}
          <Card className="bg-card border-accent/30 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">OPORTUNIDADES</p>
                <p className="text-3xl font-bold text-green-400">
                  {reportQuery.data?.report?.opportunitiesFound || 0}
                </p>
              </div>
              <Lightbulb className="w-6 h-6 text-green-400" />
            </div>
          </Card>

          {/* ROI Estimado */}
          <Card className="bg-card border-accent/30 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">ROI ESTIMADO</p>
                <p className="text-3xl font-bold text-accent">
                  {(summaryQuery.data?.summary?.keyMetrics?.estimatedROI || 0).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
          </Card>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tendências de Ads */}
          <Card className="bg-card border-accent/30 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-accent" />
              Tendências de Ads
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20">
                <span className="text-sm">CTR (Click-Through Rate)</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">2.45%</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20">
                <span className="text-sm">CPC (Custo por Clique)</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">$1.23</span>
                  <TrendingDown className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20">
                <span className="text-sm">ROI Campanha</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">285%</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </div>
            </div>
          </Card>

          {/* Crescimento Social */}
          <Card className="bg-card border-accent/30 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Crescimento Social
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20">
                <span className="text-sm">Engajamento Médio</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">4.2%</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20">
                <span className="text-sm">Novos Seguidores</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">+1,245</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-accent/5 rounded border border-accent/20">
                <span className="text-sm">Taxa de Retenção</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">92%</span>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Recomendações */}
        <Card className="bg-card border-accent/30 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Recomendações Estratégicas
          </h2>
          <div className="space-y-2">
            {reportQuery.data?.report?.actionsRecommended?.slice(0, 5).map(
              (action: string, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-green-500/10 border border-green-500/30 rounded flex items-start gap-3"
                >
                  <Badge className="mt-1 bg-green-500/20 text-green-400 border-green-500/50">
                    {idx + 1}
                  </Badge>
                  <p className="text-sm text-green-300">{action}</p>
                </div>
              )
            ) || (
              <p className="text-sm text-muted-foreground">
                Aguardando análise de dados...
              </p>
            )}
          </div>
        </Card>

        {/* Resumo Executivo */}
        <Card className="bg-card border-accent/30 p-6">
          <h2 className="text-lg font-semibold mb-4">Resumo Executivo do Dia</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="text-xs text-muted-foreground mb-1">Campanhas Ativas</p>
              <p className="text-2xl font-bold text-accent">
                {summaryQuery.data?.summary?.campaignsActive || 0}
              </p>
            </div>
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="text-xs text-muted-foreground mb-1">Tarefas Concluídas</p>
              <p className="text-2xl font-bold text-green-400">
                {summaryQuery.data?.summary?.tasksCompleted || 0}
              </p>
            </div>
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="text-xs text-muted-foreground mb-1">Tarefas Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400">
                {summaryQuery.data?.summary?.tasksPending || 0}
              </p>
            </div>
            <div className="p-3 bg-accent/5 rounded border border-accent/20">
              <p className="text-xs text-muted-foreground mb-1">Gasto Total</p>
              <p className="text-2xl font-bold text-accent">
                ${(summaryQuery.data?.summary?.keyMetrics?.totalSpent || 0).toFixed(0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-accent/30 p-4 bg-card/50 text-xs terminal-text opacity-50 text-center">
        [MONITORING_STATUS: {isMonitoring || monitoringStatusQuery.data?.isActive ? "ACTIVE" : "INACTIVE"}] |
        [LAST_UPDATE: {new Date().toLocaleTimeString()}] | [PREDICTIONS_ENABLED]
      </div>
    </div>
  );
}
