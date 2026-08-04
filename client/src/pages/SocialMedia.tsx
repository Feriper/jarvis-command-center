import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Heart, MessageCircle, Share2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SocialMedia() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const { data: accountsList } = trpc.social.listAccounts.useQuery();

  useEffect(() => {
    if (accountsList) {
      setAccounts(accountsList);
      if (accountsList.length > 0) {
        setSelectedAccount(accountsList[0]);
      }
      setLoading(false);
    }
  }, [accountsList]);

  // Dados simulados de métricas
  const mockMetrics = [
    { date: "Seg", followers: 1200, engagement: 45, reach: 3200 },
    { date: "Ter", followers: 1350, engagement: 52, reach: 3800 },
    { date: "Qua", followers: 1400, engagement: 48, reach: 3500 },
    { date: "Qui", followers: 1550, engagement: 61, reach: 4200 },
    { date: "Sex", followers: 1680, engagement: 58, reach: 4100 },
    { date: "Sab", followers: 1750, engagement: 72, reach: 4800 },
    { date: "Dom", followers: 1820, engagement: 68, reach: 4600 },
  ];

  const platformIcons = {
    instagram: "📷",
    tiktok: "🎵",
    youtube: "📺",
    x: "𝕏",
    linkedin: "💼",
    facebook: "f",
    threads: "🧵",
  };

  const platformColors = {
    instagram: "bg-pink-500/20 text-pink-300",
    tiktok: "bg-black/40 text-white",
    youtube: "bg-red-500/20 text-red-300",
    x: "bg-slate-500/20 text-slate-300",
    linkedin: "bg-blue-500/20 text-blue-300",
    facebook: "bg-blue-600/20 text-blue-300",
    threads: "bg-purple-500/20 text-purple-300",
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4">
        <h1 className="text-3xl font-bold neon-glow bracket-left bracket-right">
          REDES SOCIAIS
        </h1>
        <p className="text-sm terminal-text opacity-70 mt-2">
          [SOCIAL_MONITOR_ACTIVE] | {accounts.length} contas conectadas
        </p>
      </div>

      {/* Contas Conectadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <Card className="bg-card border-accent/30 p-4 col-span-full text-center text-muted-foreground">
            Carregando contas...
          </Card>
        ) : accounts.length === 0 ? (
          <Card className="bg-card border-accent/30 p-4 col-span-full text-center text-muted-foreground">
            Nenhuma conta conectada. Conecte suas redes sociais para começar.
          </Card>
        ) : (
          accounts.map((account) => (
            <Card
              key={account.id}
              onClick={() => setSelectedAccount(account)}
              className={`bg-card border-2 p-4 cursor-pointer transition-all ${
                selectedAccount?.id === account.id
                  ? "border-accent"
                  : "border-accent/30 hover:border-accent/60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {platformIcons[account.platform as keyof typeof platformIcons]}
                  </span>
                  <div>
                    <h3 className="font-semibold capitalize">{account.platform}</h3>
                    <p className="text-xs text-muted-foreground">{account.accountHandle}</p>
                  </div>
                </div>
                <Badge className={platformColors[account.platform as keyof typeof platformColors]}>
                  Ativo
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Seguidores:</span>
                  <span className="font-semibold text-accent">{account.followers?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Engajamento:</span>
                  <span className="font-semibold text-yellow-400">{account.engagementRate}%</span>
                </div>
                <div className="text-xs text-muted-foreground mt-3">
                  Última sincronização: {new Date(account.lastSyncedAt || Date.now()).toLocaleDateString("pt-BR")}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Detalhes da Conta Selecionada */}
      {selectedAccount && (
        <div className="space-y-6">
          {/* Estatísticas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-accent/30 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <p className="text-2xl font-bold text-accent">{selectedAccount.followers?.toLocaleString()}</p>
              <p className="text-xs terminal-text opacity-70">Seguidores</p>
            </Card>

            <Card className="bg-card border-accent/30 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Heart className="w-6 h-6 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-red-400">+2.4K</p>
              <p className="text-xs terminal-text opacity-70">Curtidas (7d)</p>
            </Card>

            <Card className="bg-card border-accent/30 p-4 text-center">
              <div className="flex justify-center mb-2">
                <MessageCircle className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">+580</p>
              <p className="text-xs terminal-text opacity-70">Comentários (7d)</p>
            </Card>

            <Card className="bg-card border-accent/30 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Share2 className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">{selectedAccount.engagementRate}%</p>
              <p className="text-xs terminal-text opacity-70">Taxa Engajamento</p>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crescimento de Seguidores */}
            <Card className="bg-card border-accent/30 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Crescimento de Seguidores
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #00ffff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="followers"
                    stroke="#00ffff"
                    strokeWidth={2}
                    dot={{ fill: "#00ffff", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Engajamento */}
            <Card className="bg-card border-accent/30 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" />
                Engajamento por Dia
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #00ffff" }}
                  />
                  <Bar dataKey="engagement" fill="#ff00ff" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Ações */}
          <Card className="bg-card border-accent/30 p-4 space-y-3">
            <h3 className="font-semibold">Ações Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
                Gerar Post
              </Button>
              <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
                Agendar Postagem
              </Button>
              <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
                Analisar Métricas
              </Button>
              <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
                Sincronizar Dados
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
