import { useAuth } from "@/_core/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, DollarSign, CheckCircle2, AlertCircle, Zap, Calendar, MessageSquare, Cpu, Smile } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    tasksCompleted: 0,
    tasksTotal: 0,
    socialFollowers: 0,
    adsSpent: 0,
    activeAgents: 0,
    sentimentScore: 0.85,
  });

  const { data: tasks } = trpc.tasks.list.useQuery();
  const { data: campaigns } = trpc.ads.listCampaigns.useQuery();
  const { data: alerts } = trpc.alerts.list.useQuery();
  const { data: agents } = trpc.agent.listAgents.useQuery();

  useEffect(() => {
    if (tasks && campaigns) {
      setStats({
        tasksCompleted: tasks.filter((t: any) => t.status === "completed").length,
        tasksTotal: tasks.length,
        socialFollowers: 45000,
        adsSpent: campaigns.reduce((sum: number, c: any) => sum + (c.spent || 0), 0),
        activeAgents: agents?.length || 0,
        sentimentScore: 0.85,
      });
    }
  }, [tasks, campaigns, agents]);

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
          <div className="animate-pulse text-accent text-2xl mb-4 text-cyan-400 font-mono">⚙️ INITIALIZING_JARVIS_SYSTEM...</div>
          <p className="text-muted-foreground font-mono text-xs">[CONNECTING_NEURAL_LINKS]</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex items-center justify-center">
        <Card className="bg-card border-accent/30 p-8 max-w-md text-center space-y-4">
          <h1 className="text-4xl font-bold neon-glow tracking-tighter">JARVIS</h1>
          <p className="text-muted-foreground text-sm font-mono">COMMAND_CENTER_V2.0_POTENT</p>
          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold">
            ESTABLISH CONNECTION
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold neon-glow bracket-left bracket-right tracking-tighter">
            PAINEL DE COMANDO
          </h1>
          <p className="text-xs terminal-text opacity-70 mt-2">
            [SYSTEM_STATUS: OPTIMIZED] | BEM-VINDO, AGENTE {user?.name?.toUpperCase() || "ALPHA"}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] terminal-text opacity-50">SWARM_STATUS</p>
            <p className="text-xs font-bold text-green-400">{stats.activeAgents} AGENTES ATIVOS</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] terminal-text opacity-50">SOCIAL_SENTIMENT</p>
            <p className="text-xs font-bold text-cyan-400">STABLE (0.85)</p>
          </div>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-accent/30 p-4 group hover:border-accent transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] terminal-text opacity-70">TAREFAS_PROGRESSO</p>
              <p className="text-2xl font-bold text-accent mt-1">{stats.tasksCompleted}/{stats.tasksTotal}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-accent opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="w-full bg-accent/10 rounded-full h-1 mt-3 overflow-hidden">
            <div
              className="bg-accent h-full transition-all duration-1000"
              style={{ width: `${(stats.tasksCompleted / stats.tasksTotal) * 100 || 0}%` }}
            />
          </div>
        </Card>

        <Card className="bg-card border-accent/30 p-4 group hover:border-pink-500 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] terminal-text opacity-70">SOCIAL_FOLLOWERS</p>
              <p className="text-2xl font-bold text-pink-400 mt-1">{(stats.socialFollowers / 1000).toFixed(1)}K</p>
            </div>
            <Users className="w-8 h-8 text-pink-400 opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-green-400 mt-3 font-mono">↑ 2.3% WEEKLY_GROWTH</p>
        </Card>

        <Card className="bg-card border-accent/30 p-4 group hover:border-yellow-400 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] terminal-text opacity-70">ADS_EXPENDITURE</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">R$ {stats.adsSpent.toFixed(0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-400 opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-cyan-400 mt-3 font-mono">ROI_PREDICTION: 245%</p>
        </Card>

        <Card className="bg-card border-accent/30 p-4 group hover:border-red-400 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] terminal-text opacity-70">SYSTEM_ALERTS</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{alerts?.length || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400 opacity-30 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[10px] text-orange-400 mt-3 font-mono">CRITICAL_ACTION_REQUIRED</p>
        </Card>
      </div>

      {/* Grid de Dashboards Avançados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Performance e Sentimento */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-accent/30 p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2 text-sm terminal-text">
              <TrendingUp className="w-4 h-4 text-accent" />
              [NEURAL_PERFORMANCE_TRACKER]
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#444" fontSize={10} />
                <YAxis stroke="#444" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#000", border: "1px solid #0ff", color: "#0ff" }} />
                <Line type="monotone" dataKey="revenue" stroke="#00ffff" strokeWidth={3} dot={{ fill: "#00ffff", r: 4 }} />
                <Line type="monotone" dataKey="engagement" stroke="#ff00ff" strokeWidth={2} dot={{ fill: "#ff00ff", r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="bg-card border-accent/30 p-4">
                <h3 className="font-semibold mb-4 text-xs terminal-text flex items-center gap-2">
                  <Cpu className="w-3 h-3 text-accent" />
                  [SWARM_OVERVIEW]
                </h3>
                <div className="space-y-3">
                  {agents?.slice(0, 3).map((agent: any) => (
                    <div key={agent.id} className="flex justify-between items-center p-2 bg-accent/5 rounded border border-accent/10">
                      <span className="text-[10px] font-bold">{agent.name}</span>
                      <Badge className="text-[8px] bg-green-500/20 text-green-400 border-green-500/50">{agent.status}</Badge>
                    </div>
                  ))}
                  {(!agents || agents.length === 0) && (
                    <p className="text-[10px] opacity-50 text-center py-4">Nenhum agente implantado.</p>
                  )}
                  <Link href="/swarm">
                    <Button variant="ghost" className="w-full text-[10px] h-6 text-accent hover:bg-accent/10">GERENCIAR ENXAME</Button>
                  </Link>
                </div>
             </Card>

             <Card className="bg-card border-accent/30 p-4">
                <h3 className="font-semibold mb-4 text-xs terminal-text flex items-center gap-2">
                  <Smile className="w-3 h-3 text-cyan-400" />
                  [SENTIMENT_ANALYSIS]
                </h3>
                <div className="flex flex-col items-center justify-center h-[120px] space-y-2">
                   <div className="text-4xl font-bold text-cyan-400">0.85</div>
                   <div className="text-[10px] opacity-70">SCORE_POSITIVO</div>
                   <div className="flex gap-1 w-full max-w-[150px]">
                      <div className="h-1 flex-1 bg-green-500"></div>
                      <div className="h-1 flex-1 bg-green-500"></div>
                      <div className="h-1 flex-1 bg-green-500"></div>
                      <div className="h-1 flex-1 bg-cyan-500"></div>
                      <div className="h-1 flex-1 bg-gray-700"></div>
                   </div>
                </div>
                <Link href="/social">
                  <Button variant="ghost" className="w-full text-[10px] h-6 text-accent hover:bg-accent/10">VER DETALHES SOCIAIS</Button>
                </Link>
             </Card>
          </div>
        </div>

        {/* Coluna 2: Ações e Alertas */}
        <div className="space-y-6">
          <Card className="bg-card border-accent/30 p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-xs terminal-text">
              <Calendar className="w-3 h-3 text-accent" />
              [PRIORITY_QUEUE]
            </h3>
            <div className="space-y-3">
              {tasks?.slice(0, 4).map((task: any) => (
                <div key={task.id} className="text-xs border-l-2 border-accent/30 pl-3 py-1 hover:bg-accent/5 transition-colors cursor-pointer">
                  <p className="font-bold">{task.title}</p>
                  <p className="text-[9px] opacity-50">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'NO_DEADLINE'}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-card border-accent/30 p-4 border-red-500/20">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-xs terminal-text text-red-400">
              <AlertCircle className="w-3 h-3" />
              [CRITICAL_LOGS]
            </h3>
            <div className="space-y-2">
              {alerts?.slice(0, 3).map((alert: any) => (
                <div key={alert.id} className="text-[10px] bg-red-500/5 border border-red-500/20 rounded p-2 text-red-300">
                  <p className="font-bold">[{alert.severity.toUpperCase()}] {alert.title}</p>
                  <p className="opacity-70">{alert.message.substring(0, 40)}...</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-card border-accent/30 p-4">
            <h3 className="font-semibold mb-4 text-xs terminal-text">[QUICK_EXECUTION]</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/chat">
                <Button className="w-full text-[10px] h-8 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground">TALK_TO_JARVIS</Button>
              </Link>
              <Link href="/ads">
                <Button className="w-full text-[10px] h-8 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground">FINANCE_AI</Button>
              </Link>
              <Link href="/automations">
                <Button className="w-full text-[10px] h-8 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground">AUTOMATIONS</Button>
              </Link>
              <Link href="/swarm">
                <Button className="w-full text-[10px] h-8 bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground">SWARM_MODE</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
