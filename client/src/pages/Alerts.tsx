import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, CheckCircle2, Trash2, Eye, EyeOff } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const { data: alertsList } = trpc.alerts.list.useQuery();

  useEffect(() => {
    if (alertsList) {
      setAlerts(alertsList);
      setLoading(false);
    }
  }, [alertsList]);

  // Dados simulados de alertas
  const mockAlerts = [
    {
      id: 1,
      type: "ad_drop",
      title: "Queda em CTR detectada",
      message: "A campanha 'Produto X' teve uma queda de 15% no CTR nas últimas 24h",
      severity: "high",
      read: false,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 2,
      type: "task_overdue",
      title: "Tarefa atrasada",
      message: "A tarefa 'Revisar métricas' venceu há 3 horas",
      severity: "critical",
      read: false,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: 3,
      type: "social_alert",
      title: "Novo comentário importante",
      message: "Você recebeu um comentário com muitos likes em seu post",
      severity: "medium",
      read: true,
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: 4,
      type: "system_alert",
      title: "Sincronização concluída",
      message: "Dados de todas as plataformas foram sincronizados com sucesso",
      severity: "low",
      read: true,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: 5,
      type: "ad_drop",
      title: "Orçamento em 70%",
      message: "Sua campanha 'Produto Y' consumiu 70% do orçamento mensal",
      severity: "medium",
      read: false,
      createdAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ];

  const allAlerts = alerts.length > 0 ? alerts : mockAlerts;

  const filteredAlerts = allAlerts.filter((alert) => {
    if (filterType !== "all" && alert.type !== filterType) return false;
    if (filterSeverity !== "all" && alert.severity !== filterSeverity) return false;
    return true;
  });

  const typeIcons = {
    ad_drop: AlertTriangle,
    task_overdue: AlertCircle,
    social_alert: Info,
    system_alert: CheckCircle2,
  };

  const typeColors = {
    ad_drop: "bg-red-500/20 text-red-300",
    task_overdue: "bg-orange-500/20 text-orange-300",
    social_alert: "bg-blue-500/20 text-blue-300",
    system_alert: "bg-green-500/20 text-green-300",
  };

  const severityColors = {
    low: "bg-blue-500/20 text-blue-300",
    medium: "bg-yellow-500/20 text-yellow-300",
    high: "bg-orange-500/20 text-orange-300",
    critical: "bg-red-500/20 text-red-300",
  };

  const typeLabels = {
    ad_drop: "Queda em Ads",
    task_overdue: "Tarefa Atrasada",
    social_alert: "Redes Sociais",
    system_alert: "Sistema",
  };

  const unreadCount = allAlerts.filter((a) => !a.read).length;
  const criticalCount = allAlerts.filter((a) => a.severity === "critical").length;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4">
        <h1 className="text-3xl font-bold neon-glow bracket-left bracket-right">
          ALERTAS & NOTIFICAÇÕES
        </h1>
        <p className="text-sm terminal-text opacity-70 mt-2">
          [ALERT_CENTER_ACTIVE] | {unreadCount} não lidos | {criticalCount} críticos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-accent/30 p-4 text-center">
          <p className="text-2xl font-bold text-accent">{allAlerts.length}</p>
          <p className="text-xs terminal-text opacity-70">Total de Alertas</p>
        </Card>
        <Card className="bg-card border-accent/30 p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{criticalCount}</p>
          <p className="text-xs terminal-text opacity-70">Críticos</p>
        </Card>
        <Card className="bg-card border-accent/30 p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{unreadCount}</p>
          <p className="text-xs terminal-text opacity-70">Não Lidos</p>
        </Card>
        <Card className="bg-card border-accent/30 p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {allAlerts.filter((a) => a.read).length}
          </p>
          <p className="text-xs terminal-text opacity-70">Lidos</p>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="space-y-1">
          <label className="text-xs terminal-text opacity-70">Tipo:</label>
          <div className="flex gap-2">
            {["all", "ad_drop", "task_overdue", "social_alert", "system_alert"].map((type) => (
              <Button
                key={type}
                onClick={() => setFilterType(type)}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                className={filterType === type ? "bg-accent" : "border-accent/50"}
              >
                {type === "all" ? "Todos" : typeLabels[type as keyof typeof typeLabels]}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs terminal-text opacity-70">Severidade:</label>
          <div className="flex gap-2">
            {["all", "low", "medium", "high", "critical"].map((severity) => (
              <Button
                key={severity}
                onClick={() => setFilterSeverity(severity)}
                variant={filterSeverity === severity ? "default" : "outline"}
                size="sm"
                className={filterSeverity === severity ? "bg-accent" : "border-accent/50"}
              >
                {severity === "all" ? "Todos" : severity.charAt(0).toUpperCase() + severity.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {loading ? (
          <Card className="bg-card border-accent/30 p-4 text-center text-muted-foreground">
            Carregando alertas...
          </Card>
        ) : filteredAlerts.length === 0 ? (
          <Card className="bg-card border-accent/30 p-4 text-center text-muted-foreground">
            Nenhum alerta encontrado
          </Card>
        ) : (
          filteredAlerts.map((alert) => {
            const IconComponent = typeIcons[alert.type as keyof typeof typeIcons];
            return (
              <Card
                key={alert.id}
                className={`bg-card border-2 p-4 transition-all ${
                  alert.read ? "border-accent/30 opacity-70" : "border-accent/60"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Ícone */}
                  <div className={`p-2 rounded ${typeColors[alert.type as keyof typeof typeColors]}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className={`font-semibold ${alert.read ? "text-muted-foreground" : "text-foreground"}`}>
                        {alert.title}
                      </h3>
                      <Badge className={typeColors[alert.type as keyof typeof typeColors]}>
                        {typeLabels[alert.type as keyof typeof typeLabels]}
                      </Badge>
                      <Badge className={severityColors[alert.severity as keyof typeof severityColors]}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className={`text-sm ${alert.read ? "text-muted-foreground" : "text-foreground"}`}>
                      {alert.message}
                    </p>
                    <p className="text-xs terminal-text opacity-50 mt-2">
                      {new Date(alert.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {alert.read ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Configurações de Alertas */}
      <Card className="bg-card border-accent/30 p-4 space-y-3">
        <h3 className="font-semibold">Configurações de Alertas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span>Alertas de Ads</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span>Alertas de Tarefas</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span>Alertas de Redes Sociais</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span>Notificações Push</span>
            <input type="checkbox" defaultChecked className="w-4 h-4" />
          </div>
        </div>
      </Card>
    </div>
  );
}
