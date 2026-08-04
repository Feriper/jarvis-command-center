import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, CheckCircle2, AlertCircle, Zap, Calendar, MessageSquare } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksTotal: 0,
    socialFollowers: 0,
    adsSpent: 0,
  });

  const { data: tasks } = trpc.tasks.list.useQuery();
  const { data: campaigns } = trpc.ads.listCampaigns.useQuery();
  const { data: alerts } = trpc.alerts.list.useQuery();

  useEffect(() => {
    if (tasks && campaigns) {
      setStats({
        tasksCompleted: tasks.filter((t: any) => t.status === "completed").length,
        tasksTotal: tasks.length,
        socialFollowers: 45000,
        adsSpent: campaigns.reduce((sum: number, c: any) => sum + (c.spent || 0), 0),
      });
    }
  }, [tasks, campaigns]);

  // Dados simulados para gráficos
  const performanceData = [
    { date: "Seg", tasks: 4, revenue: 1200, engagement: 45 },
    { date: "Ter", tasks: 6, revenue: 1800, engagement: 52 },
    { date: "Qua", tasks: 5, revenue: 1500, engagement: 48 },
    { date: "Qui", tasks: 8, revenue: 2200, engagement: 61 },
    { date: "Sex", tasks: 7, revenue: 2100, engagement: 58 },
    { date: "Sab", tasks: 9, revenue: 2500, engagement: 72 },
    { date: "Dom", tasks: 6, revenue: 2000, engagement: 68 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-accent text-2xl mb-4">⚙️ Inicializando JARVIS...</div>
          <p className="text-muted-foreground">Conectando sistemas...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center">
        <Card className="bg-card border-accent/30 p-8 max-w-md text-center space-y-4">
          <h1 className="text-3xl font-bold neon-glow">JARVIS</h1>
          <p className="text-muted-foreground">Sistema de IA pessoal para gerenciar sua vida social e financeira</p>
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
            Fazer Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4">
        <h1 className="text-3xl font-bold neon-glow bracket-left bracket-right">
          PAINEL PRINCIPAL
        </h1>
        <p className="text-sm terminal-text opacity-70 mt-2">
          [SYSTEM_ONLINE] | Bem-vindo, {user?.name || "Usuário"}
        </p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-accent/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs terminal-text opacity-70">Tarefas Concluídas</p>
              <p className="text-2xl font-bold text-accent mt-1">{stats.tasksCompleted}/{stats.tasksTotal}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-accent opacity-50" />
          </div>
          <div className="w-full bg-accent/20 rounded-full h-2 mt-3">
            <div
              className="bg-accent h-2 rounded-full transition-all"
              style={{ width: `${(stats.tasksCompleted / stats.tasksTotal) * 100 || 0}%` }}
            />
          </div>
        </Card>

        <Card className="bg-card border-accent/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs terminal-text opacity-70">Seguidores Sociais</p>
              <p className="text-2xl font-bold text-pink-400 mt-1">{(stats.socialFollowers / 1000).toFixed(1)}K</p>
            </div>
            <Users className="w-8 h-8 text-pink-400 opacity-50" />
          </div>
          <p className="text-xs text-green-400 mt-3">↑ 2.3% esta semana</p>
        </Card>

        <Card className="bg-card border-accent/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs terminal-text opacity-70">Gasto em Ads</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">R$ {stats.adsSpent.toFixed(0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-400 opacity-50" />
          </div>
          <p className="text-xs text-blue-400 mt-3">ROI: 245%</p>
        </Card>

        <Card className="bg-card border-accent/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs terminal-text opacity-70">Alertas Ativos</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{alerts?.length || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400 opacity-50" />
          </div>
          <p className="text-xs text-orange-400 mt-3">Revisar em breve</p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Semanal */}
        <Card className="bg-card border-accent/30 p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Performance Semanal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #00ffff" }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#00ffff"
                strokeWidth={2}
                dot={{ fill: "#00ffff", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Atividades */}
        <Card className="bg-card border-accent/30 p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            Atividades Recentes
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #00ffff" }} />
              <Bar dataKey="tasks" fill="#ff00ff" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximas Tarefas */}
        <Card className="bg-card border-accent/30 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" />
            Próximas Tarefas
          </h3>
          <div className="space-y-2">
            {tasks?.slice(0, 3).map((task: any) => (
              <div key={task.id} className="text-sm border-l-2 border-accent/50 pl-2 py-1">
                <p className="font-semibold text-foreground">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString("pt-BR") : "Sem data"}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Conversas com Jarvis */}
        <Card className="bg-card border-accent/30 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            Últimas Conversas
          </h3>
          <div className="space-y-2">
            <div className="text-sm border-l-2 border-accent/50 pl-2 py-1">
              <p className="font-semibold text-foreground">Análise de Ads</p>
              <p className="text-xs text-muted-foreground">Há 2 horas</p>
            </div>
            <div className="text-sm border-l-2 border-accent/50 pl-2 py-1">
              <p className="font-semibold text-foreground">Planejamento Semanal</p>
              <p className="text-xs text-muted-foreground">Há 5 horas</p>
            </div>
            <div className="text-sm border-l-2 border-accent/50 pl-2 py-1">
              <p className="font-semibold text-foreground">Pesquisa de Mercado</p>
              <p className="text-xs text-muted-foreground">Ontem</p>
            </div>
          </div>
        </Card>

        {/* Alertas Importantes */}
        <Card className="bg-card border-accent/30 p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            Alertas Importantes
          </h3>
          <div className="space-y-2">
            <div className="text-sm bg-red-500/10 border border-red-500/30 rounded p-2">
              <p className="text-red-300">⚠️ Campanha com baixo CTR</p>
            </div>
            <div className="text-sm bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
              <p className="text-yellow-300">⚡ Orçamento em 60%</p>
            </div>
            <div className="text-sm bg-blue-500/10 border border-blue-500/30 rounded p-2">
              <p className="text-blue-300">ℹ️ Sincronização concluída</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card className="bg-card border-accent/30 p-4">
        <h3 className="font-semibold mb-3">Ações Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
            Nova Tarefa
          </Button>
          <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
            Falar com Jarvis
          </Button>
          <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
            Gerar Relatório
          </Button>
          <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
            Sincronizar Dados
          </Button>
        </div>
      </Card>
    </div>
  );
}
