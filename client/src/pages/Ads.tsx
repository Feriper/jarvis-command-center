import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BarChart3, DollarSign, TrendingDown, AlertTriangle } from "lucide-react";

const campaigns = [
  {
    id: 1,
    name: "Google Ads - Search",
    platform: "Google Ads",
    budget: 500,
    spent: 385.50,
    impressions: 12500,
    clicks: 450,
    conversions: 28,
    roi: 145.2,
  },
  {
    id: 2,
    name: "Meta Ads - Instagram",
    platform: "Meta Ads",
    budget: 300,
    spent: 298.75,
    impressions: 8900,
    clicks: 320,
    conversions: 15,
    roi: 89.5,
  },
  {
    id: 3,
    name: "TikTok Ads",
    platform: "TikTok Ads",
    budget: 200,
    spent: 145.20,
    impressions: 5600,
    clicks: 180,
    conversions: 8,
    roi: 62.3,
  },
];

export default function Ads() {
  const [selectedCampaign, setSelectedCampaign] = useState(0);
  const campaign = campaigns[selectedCampaign];

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.spent, 0);
  const totalROI = campaigns.reduce((sum, c) => sum + c.roi, 0) / campaigns.length;

  return (
    <div className="h-full bg-background text-foreground scanlines p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4">
        <h1 className="text-2xl font-semibold neon-glow bracket-left bracket-right">
          CAMPANHA_ADS
        </h1>
        <p className="text-xs terminal-text opacity-50 mt-2">
          [AD_MANAGEMENT] | [{campaigns.length}_CAMPANHAS_ATIVAS]
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 border-accent/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs terminal-text opacity-50">ORÇAMENTO_TOTAL</p>
              <p className="text-xl font-semibold text-accent">R$ {totalBudget}</p>
            </div>
            <DollarSign className="w-8 h-8 text-accent/50" />
          </div>
        </Card>
        <Card className="bg-card/50 border-accent/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs terminal-text opacity-50">GASTO</p>
              <p className="text-xl font-semibold text-accent">R$ {totalSpent.toFixed(2)}</p>
            </div>
            <BarChart3 className="w-8 h-8 text-accent/50" />
          </div>
        </Card>
        <Card className="bg-card/50 border-accent/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs terminal-text opacity-50">ROI_MÉDIO</p>
              <p className="text-xl font-semibold text-accent">{totalROI.toFixed(1)}%</p>
            </div>
            <TrendingDown className="w-8 h-8 text-accent/50" />
          </div>
        </Card>
      </div>

      {/* Campaign Selector */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold terminal-text">CAMPANHAS</h2>
        <div className="space-y-2">
          {campaigns.map((c, idx) => (
            <Card
              key={c.id}
              onClick={() => setSelectedCampaign(idx)}
              className={`p-3 cursor-pointer transition-colors ${
                selectedCampaign === idx
                  ? "bg-accent/20 border-accent"
                  : "bg-card/50 border-accent/30 hover:bg-card/70"
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{c.name}</p>
                  <p className="text-xs terminal-text opacity-50">{c.platform}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent">
                    {((c.spent / c.budget) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs terminal-text opacity-50">
                    R$ {c.spent.toFixed(2)} / R$ {c.budget}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Campaign Details */}
      <Card className="bg-card/50 border-accent/30 p-4">
        <div className="space-y-4">
          <div>
            <p className="text-xs terminal-text opacity-50">CAMPANHA_SELECIONADA</p>
            <p className="text-lg font-semibold text-accent">{campaign.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs terminal-text opacity-50">IMPRESSÕES</p>
              <p className="text-xl font-semibold">{campaign.impressions.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs terminal-text opacity-50">CLIQUES</p>
              <p className="text-xl font-semibold">{campaign.clicks}</p>
            </div>
            <div>
              <p className="text-xs terminal-text opacity-50">CONVERSÕES</p>
              <p className="text-xl font-semibold text-accent">{campaign.conversions}</p>
            </div>
            <div>
              <p className="text-xs terminal-text opacity-50">ROI</p>
              <p className="text-xl font-semibold text-accent">{campaign.roi}%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Alert */}
      <Card className="bg-destructive/10 border-destructive/30 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm">ALERTA: Queda de Performance</p>
          <p className="text-xs terminal-text opacity-70 mt-1">
            ROI da campanha Google Ads caiu 12% nos últimos 3 dias.
          </p>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-auto">
        <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
          Otimizar Campanha
        </Button>
        <Button variant="outline" className="flex-1 border-accent/30">
          Ver Relatório
        </Button>
      </div>
    </div>
  );
}
