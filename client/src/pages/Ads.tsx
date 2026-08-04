import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Target, Zap, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Ads() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const { data: campaignsList } = trpc.ads.listCampaigns.useQuery();

  useEffect(() => {
    if (campaignsList) {
      setCampaigns(campaignsList);
      if (campaignsList.length > 0) {
        setSelectedCampaign(campaignsList[0]);
      }
      setLoading(false);
    }
  }, [campaignsList]);

  // Dados simulados de performance
  const mockPerformance = [
    { date: "01", impressions: 15000, clicks: 450, conversions: 45, spent: 250 },
    { date: "02", impressions: 18000, clicks: 540, conversions: 54, spent: 290 },
    { date: "03", impressions: 16500, clicks: 495, conversions: 50, spent: 270 },
    { date: "04", impressions: 22000, clicks: 660, conversions: 66, spent: 350 },
    { date: "05", impressions: 25000, clicks: 750, conversions: 75, spent: 400 },
    { date: "06", impressions: 23000, clicks: 690, conversions: 69, spent: 380 },
    { date: "07", impressions: 28000, clicks: 840, conversions: 84, spent: 450 },
  ];

  const platformIcons = {
    google_ads: "🔍",
    meta_ads: "f",
    tiktok_ads: "🎵",
    other: "📊",
  };

  const platformColors = {
    google_ads: "bg-blue-500/20 text-blue-300",
    meta_ads: "bg-blue-600/20 text-blue-300",
    tiktok_ads: "bg-black/40 text-white",
    other: "bg-gray-500/20 text-gray-300",
  };

  const statusColors = {
    active: "bg-green-500/20 text-green-300",
    paused: "bg-yellow-500/20 text-yellow-300",
    ended: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4">
        <h1 className="text-3xl font-bold neon-glow bracket-left bracket-right">
          CAMPANHAS DE ADS
        </h1>
        <p className="text-sm terminal-text opacity-70 mt-2">
          [ADS_MANAGER_ACTIVE] | {campaigns.length} campanhas
        </p>
      </div>

      {/* Campanhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <Card className="bg-card border-accent/30 p-4 col-span-full text-center text-muted-foreground">
            Carregando campanhas...
          </Card>
        ) : campaigns.length === 0 ? (
          <Card className="bg-card border-accent/30 p-4 col-span-full text-center text-muted-foreground">
            Nenhuma campanha encontrada. Crie uma nova campanha para começar.
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              onClick={() => setSelectedCampaign(campaign)}
              className={`bg-card border-2 p-4 cursor-pointer transition-all ${
                selectedCampaign?.id === campaign.id
                  ? "border-accent"
                  : "border-accent/30 hover:border-accent/60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {platformIcons[campaign.platform as keyof typeof platformIcons]}
                  </span>
                  <div>
                    <h3 className="font-semibold">{campaign.campaignName}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{campaign.platform}</p>
                  </div>
                </div>
                <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                  {campaign.status}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orçamento:</span>
                  <span className="font-semibold text-accent">R$ {campaign.budget?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gasto:</span>
                  <span className="font-semibold text-yellow-400">R$ {campaign.spent?.toFixed(2)}</span>
                </div>
                <div className="w-full bg-accent/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${((campaign.spent || 0) / (campaign.budget || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Detalhes da Campanha Selecionada */}
      {selectedCampaign && (
        <div className="space-y-6">
          {/* Estatísticas Principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-accent/30 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Target className="w-6 h-6 text-accent" />
              </div>
              <p className="text-2xl font-bold text-accent">8.2K</p>
              <p className="text-xs terminal-text opacity-70">Impressões</p>
            </Card>

            <Card className="bg-card border-accent/30 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Zap className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-yellow-400">3.2%</p>
              <p className="text-xs terminal-text opacity-70">CTR (Click-Through)</p>
            </Card>

            <Card className="bg-card border-accent/30 p-4 text-center">
              <div className="flex justify-center mb-2">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-green-400">R$ 12.50</p>
              <p className="text-xs terminal-text opacity-70">CPC (Custo por Clique)</p>
            </Card>

            <Card className="bg-card border-accent/30 p-4 text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-blue-400">245%</p>
              <p className="text-xs terminal-text opacity-70">ROI</p>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance ao Longo do Tempo */}
            <Card className="bg-card border-accent/30 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                Performance (7 dias)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #00ffff" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#00ffff"
                    strokeWidth={2}
                    dot={{ fill: "#00ffff", r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    stroke="#ff00ff"
                    strokeWidth={2}
                    dot={{ fill: "#ff00ff", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Gasto vs Retorno */}
            <Card className="bg-card border-accent/30 p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                Gasto vs Impressões
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #00ffff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="spent"
                    fill="#ff6b6b"
                    stroke="#ff6b6b"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="impressions"
                    fill="#00ffff"
                    stroke="#00ffff"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Alertas e Recomendações */}
          <Card className="bg-card border-accent/30 p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Alertas e Recomendações
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
                <p className="text-yellow-300">⚠️ CTR abaixo da média. Considere revisar o copy do anúncio.</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                <p className="text-green-300">✓ ROI acima de 200%. Campanha performando bem!</p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                <p className="text-blue-300">ℹ️ Orçamento com 60% consumido. Considere aumentar ou pausar em breve.</p>
              </div>
            </div>
          </Card>

          {/* Ações */}
          <Card className="bg-card border-accent/30 p-4 space-y-3">
            <h3 className="font-semibold">Ações Rápidas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
                Editar Campanha
              </Button>
              <Button className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50">
                Pausar/Retomar
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
      )}
    </div>
  );
}
