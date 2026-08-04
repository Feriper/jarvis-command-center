import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Heart } from "lucide-react";

const platforms = [
  { name: "Instagram", handle: "@seu_usuario", followers: 12500, engagement: 4.2 },
  { name: "TikTok", handle: "@seu_usuario", followers: 45000, engagement: 8.5 },
  { name: "YouTube", handle: "Seu Canal", followers: 8300, engagement: 2.1 },
  { name: "X (Twitter)", handle: "@seu_usuario", followers: 3200, engagement: 1.8 },
];

export default function SocialMedia() {
  const [selectedPlatform, setSelectedPlatform] = useState(0);

  return (
    <div className="h-full bg-background text-foreground scanlines p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-accent/30 pb-4">
        <h1 className="text-2xl font-semibold neon-glow bracket-left bracket-right">
          REDES_SOCIAIS
        </h1>
        <p className="text-xs terminal-text opacity-50 mt-2">
          [SOCIAL_MONITORING] | [{platforms.length}_PLATAFORMAS]
        </p>
      </div>

      {/* Platform Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {platforms.map((platform, idx) => (
          <Button
            key={idx}
            onClick={() => setSelectedPlatform(idx)}
            variant={selectedPlatform === idx ? "default" : "outline"}
            className={
              selectedPlatform === idx
                ? "bg-accent text-accent-foreground"
                : "border-accent/30"
            }
          >
            {platform.name}
          </Button>
        ))}
      </div>

      {/* Platform Details */}
      <Card className="bg-card/50 border-accent/30 p-6">
        <div className="space-y-4">
          <div>
            <p className="text-xs terminal-text opacity-50">PLATAFORMA</p>
            <p className="text-xl font-semibold text-accent">
              {platforms[selectedPlatform].name}
            </p>
          </div>
          <div>
            <p className="text-xs terminal-text opacity-50">HANDLE</p>
            <p className="font-mono">{platforms[selectedPlatform].handle}</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-accent/20">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Users className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs terminal-text opacity-50">SEGUIDORES</p>
              <p className="text-2xl font-semibold text-accent">
                {(platforms[selectedPlatform].followers / 1000).toFixed(1)}K
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Heart className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs terminal-text opacity-50">ENGAJAMENTO</p>
              <p className="text-2xl font-semibold text-accent">
                {platforms[selectedPlatform].engagement}%
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <p className="text-xs terminal-text opacity-50">TENDÊNCIA</p>
              <p className="text-2xl font-semibold text-accent">↑ 2.3%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Scheduled Posts */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold terminal-text">POSTS_AGENDADOS</h2>
        <Card className="bg-card/50 border-accent/30 p-4">
          <p className="text-sm text-muted-foreground">
            [INFO] Nenhum post agendado no momento.
          </p>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-auto">
        <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground">
          Agendar Post
        </Button>
        <Button variant="outline" className="flex-1 border-accent/30">
          Sincronizar Dados
        </Button>
      </div>
    </div>
  );
}
