import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Target, Zap, AlertTriangle, Brain } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Ads() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);

  const { data: campaignsList } = trpc.ads.listCampaigns.useQuery();
  const { data: projections, refetch: refetchProjections } = trpc.analytics.getProjections.useQuery({ type: "ad_roi" });
  const runProjectionMutation = trpc.analytics.runPredictiveAnalysis.useMutation();

  useEffect(() => {
    if (campaignsList) {
      setCampaigns(campaignsList);
      if (campaignsList.length > 0) {
        setSelectedCampaign(campaignsList[0]);
      }
      setLoading(false);
    }
  }, [campaignsList]);

  const handleRunIA = async () => {
    try {
      await runProjectionMutation.mutateAsync({ type: "ad_roi" });
      refetchProjections();
    } catch (error) {
      console.error("Erro ao executar análise preditiva:", error);
    }
  };

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

  const statusColors = {
    active: "bg-green-500/20 text-green-300",
    paused: "bg-yellow-500/20 text-yellow-300",
    ended: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold neon-glow bracket-left bracket-right">
            ADS & FINANCEIRO
          </h1>
          <p className="text-sm terminal-text opacity-70 mt-2">
            [ADS_MANAGER_ACTIVE] | {campaigns.length} campanhas ativas
          </p>
        </div>
        <Button 
          className="bg-accent text-accent-foreground animate-pulse"
          onClick={handleRunIA}
          disabled={runProjectionMutation.isPending}
        >
          <Brain className="w-4 h-4 mr-2" />
          {runProjectionMutation.isPending ? "PROCESSANDO..." : "PREDIÇÃO IA TURBO"}
        </Button>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Campanhas */}
        <div className="space-y-4">
          <h3 className="font-semibold terminal-text">[SELECIONAR_CAMPANHA]</h3>
          {loading ? (
            <Card className="bg-card border-accent/30 p-4 text-center text-muted-foreground">Carregando...</Card>
          ) : (
            campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                onClick={() => setSelectedCampaign(campaign)}
                className={`bg-card border-2 p-4 cursor-pointer transition-all ${
                  selectedCampaign?.id === campaign.id ? "border-accent" : "border-accent/30 hover:border-accent/60"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{platformIcons[campaign.platform as keyof typeof platformIcons]}</span>
                    <h3 className="font-semibold text-sm">{campaign.campaignName}</h3>
                  </div>
                  <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>{campaign.status}</Badge>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span className="opacity-70">ROI:</span>
                  <span className="text-accent font-bold">245%</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Dashboards e Gráficos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-card border-accent/30 p-4 text-center">
              <Target className="w-5 h-5 text-accent mx-auto mb-2" />
              <p className="text-xl font-bold">8.2K</p>
              <p className="text-[10px] terminal-text opacity-70">IMPRESSÕES</p>
            </Card>
            <Card className="bg-card border-accent/30 p-4 text-center">
              <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-2" />
              <p className="text-xl font-bold">3.2%</p>
              <p className="text-[10px] terminal-text opacity-70">CTR</p>
            </Card>
            <Card className="bg-card border-accent/30 p-4 text-center">
              <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-2" />
              <p className="text-xl font-bold">R$ 12.50</p>
              <p className="text-[10px] terminal-text opacity-70">CPC</p>
            </Card>
            <Card className="bg-card border-accent/30 p-4 text-center">
              <TrendingUp className="w-5 h-5 text-blue-400 mx-auto mb-2" />
              <p className="text-xl font-bold">245%</p>
              <p className="text-[10px] terminal-text opacity-70">ROI</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-accent/30 p-4">
              <h3 className="font-semibold mb-4 text-xs terminal-text">[PERFORMANCE_REAL]</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={mockPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#666" fontSize={10} />
                  <YAxis stroke="#666" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #00ffff" }} />
                  <Line type="monotone" dataKey="clicks" stroke="#00ffff" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="conversions" stroke="#ff00ff" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="bg-card border-accent/30 p-4 relative">
              <h3 className="font-semibold mb-4 text-xs terminal-text text-yellow-400">[PROJEÇÃO_IA_ROI]</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={projections || []}>
                  <defs>
                    <linearGradient id="colorRoi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00ffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="projectionDate" stroke="#666" fontSize={8} tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                  <YAxis stroke="#666" fontSize={8} />
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #00ffff" }} />
                  <Area type="monotone" dataKey="predictedValue" stroke="#00ffff" fillOpacity={1} fill="url(#colorRoi)" name="ROI Previsto (%)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="absolute top-12 right-6">
                <Badge variant="outline" className="text-[8px] border-yellow-500/50 text-yellow-500">CONFIANÇA: 92%</Badge>
              </div>
            </Card>
          </div>

          <Card className="bg-card border-accent/30 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              Insights do Analista IA
            </h3>
            <div className="space-y-2 text-xs">
              <div className="bg-accent/5 border-l-2 border-accent p-2">
                <p>O ROI da campanha <strong>{selectedCampaign?.campaignName}</strong> deve crescer 15% na próxima semana devido a tendências sazonais.</p>
              </div>
              <div className="bg-yellow-500/5 border-l-2 border-yellow-500 p-2">
                <p>Alerta: O CPC do Google Ads está subindo. Recomendado redistribuir 20% do orçamento para TikTok Ads.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
