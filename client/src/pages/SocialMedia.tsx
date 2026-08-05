import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Share2, Users, MessageCircle, Heart, TrendingUp, BarChart2, Smile, Meh, Frown } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function SocialMedia() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const { data: accountsList } = trpc.social.listAccounts.useQuery();
  const { data: sentimentData } = trpc.analytics.getSentiment.useQuery({ 
    accountId: selectedAccount?.id || 0 
  });

  useEffect(() => {
    if (accountsList) {
      setAccounts(accountsList);
      if (accountsList.length > 0) {
        setSelectedAccount(accountsList[0]);
      }
      setLoading(false);
    }
  }, [accountsList]);

  const mockMetrics = [
    { date: "Seg", followers: 1200, engagement: 45, reach: 3200 },
    { date: "Ter", followers: 1350, engagement: 52, reach: 3800 },
    { date: "Qua", followers: 1400, engagement: 48, reach: 3500 },
    { date: "Qui", followers: 1550, engagement: 61, reach: 4200 },
    { date: "Sex", followers: 1680, engagement: 58, reach: 4100 },
    { date: "Sab", followers: 1750, engagement: 72, reach: 4800 },
    { date: "Dom", followers: 1820, engagement: 68, reach: 4600 },
  ];

  const sentimentPie = [
    { name: 'Positivo', value: 65, color: '#00ff88' },
    { name: 'Neutro', value: 25, color: '#00ffff' },
    { name: 'Negativo', value: 10, color: '#ff0055' },
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

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold neon-glow bracket-left bracket-right">
            SOCIAL HUB & SENTIMENTO
          </h1>
          <p className="text-sm terminal-text opacity-70 mt-2">
            [SOCIAL_ENGINE_ONLINE] | {accounts.length} canais conectados
          </p>
        </div>
        <Button className="bg-accent text-accent-foreground">
          <Share2 className="w-4 h-4 mr-2" /> Agendar Post
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canais */}
        <div className="space-y-4">
          <h3 className="font-semibold terminal-text">[CANAIS_ATIVOS]</h3>
          {loading ? (
            <Card className="bg-card border-accent/30 p-4 text-center text-muted-foreground text-xs">Carregando...</Card>
          ) : (
            accounts.map((acc) => (
              <Card
                key={acc.id}
                onClick={() => setSelectedAccount(acc)}
                className={`bg-card border-2 p-4 cursor-pointer transition-all ${
                  selectedAccount?.id === acc.id ? "border-accent" : "border-accent/30 hover:border-accent/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{platformIcons[acc.platform as keyof typeof platformIcons]}</span>
                  <div>
                    <h4 className="font-bold text-xs">@{acc.accountHandle}</h4>
                    <p className="text-[8px] opacity-70 uppercase">{acc.platform}</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Dashboards Centrais */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card border-accent/30 p-4">
              <div className="flex justify-between items-center mb-2">
                <Users className="w-5 h-5 text-accent" />
                <Badge variant="outline" className="text-[8px] border-green-500/50 text-green-500">+12%</Badge>
              </div>
              <p className="text-2xl font-bold">{selectedAccount?.followers?.toLocaleString() || "0"}</p>
              <p className="text-[10px] terminal-text opacity-70">SEGUIDORES TOTAIS</p>
            </Card>
            <Card className="bg-card border-accent/30 p-4">
              <div className="flex justify-between items-center mb-2">
                <Heart className="w-5 h-5 text-pink-500" />
                <Badge variant="outline" className="text-[8px] border-green-500/50 text-green-500">+8%</Badge>
              </div>
              <p className="text-2xl font-bold">{selectedAccount?.engagementRate || "0"}%</p>
              <p className="text-[10px] terminal-text opacity-70">TAXA DE ENGAJAMENTO</p>
            </Card>
            <Card className="bg-card border-accent/30 p-4">
              <div className="flex justify-between items-center mb-2">
                <Smile className="w-5 h-5 text-green-400" />
                <Badge variant="outline" className="text-[8px] border-accent/50 text-accent">ESTÁVEL</Badge>
              </div>
              <p className="text-2xl font-bold">0.85</p>
              <p className="text-[10px] terminal-text opacity-70">SCORE DE SENTIMENTO</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-accent/30 p-6">
              <h3 className="font-semibold mb-6 text-xs terminal-text">[CRESCIMENTO_DE_AUDIÊNCIA]</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockMetrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" fontSize={10} />
                  <YAxis stroke="#666" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #00ffff" }} />
                  <Line type="monotone" dataKey="followers" stroke="#00ffff" strokeWidth={3} dot={{ fill: "#00ffff", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-card border-accent/30 p-6">
              <h3 className="font-semibold mb-6 text-xs terminal-text">[ANÁLISE_DE_SENTIMENTO_PÚBLICO]</h3>
              <div className="flex items-center justify-between">
                <ResponsiveContainer width="60%" height={200}>
                  <PieChart>
                    <Pie
                      data={sentimentPie}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4 w-[40%]">
                  <div className="flex items-center gap-2 text-[10px]">
                    <Smile className="w-3 h-3 text-green-400" />
                    <span>65% Positivo</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <Meh className="w-3 h-3 text-cyan-400" />
                    <span>25% Neutro</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <Frown className="w-3 h-3 text-pink-500" />
                    <span>10% Negativo</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="bg-card border-accent/30 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-accent" />
              Tendências & Tópicos Quentes (2026)
            </h3>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px]">#IA_Autônoma</Badge>
              <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px]">#Finanças_2026</Badge>
              <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px]">#Jarvis_Swarm</Badge>
              <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px]">#Web3_Social</Badge>
              <Badge className="bg-accent/10 text-accent border-accent/30 text-[10px]">#Marketing_Preditivo</Badge>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
