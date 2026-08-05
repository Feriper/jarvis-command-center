import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Brain,
  Send,
  GitCompare,
  Settings,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AIModelsHub() {
  const [selectedProvider, setSelectedProvider] = useState<string>("manus");
  const [query, setQuery] = useState("");
  const [taskType, setTaskType] = useState<string>("general");
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any>(null);

  const modelsStatusQuery = trpc.llmOrchestrator.getModelsStatus.useQuery();
  const invokeModelMutation = trpc.llmOrchestrator.invokeModel.useMutation();
  const autoRouteMutation = trpc.llmOrchestrator.autoRoute.useMutation();
  const compareModelsMutation = trpc.llmOrchestrator.compareModels.useMutation();
  const getRecommendationQuery = trpc.llmOrchestrator.getModelRecommendation.useQuery(
    { taskType: taskType as any }
  );

  const handleInvokeModel = async () => {
    if (!query.trim()) return;

    try {
      const result = await invokeModelMutation.mutateAsync({
        provider: selectedProvider as any,
        query,
      });

      if (result.success) {
        alert(`Resposta de ${selectedProvider}:\n\n${result.response?.content}`);
        setQuery("");
      }
    } catch (error) {
      console.error("Erro ao invocar modelo:", error);
    }
  };

  const handleAutoRoute = async () => {
    if (!query.trim()) return;

    try {
      const result = await autoRouteMutation.mutateAsync({
        query,
        taskType: taskType as any,
      });

      if (result.success) {
        alert(
          `Roteado para ${result.response?.provider}:\n\n${result.response?.content}`
        );
        setQuery("");
      }
    } catch (error) {
      console.error("Erro no roteamento automático:", error);
    }
  };

  const handleCompareModels = async () => {
    if (!query.trim()) return;

    setIsComparing(true);
    try {
      const result = await compareModelsMutation.mutateAsync({
        query,
        taskType: taskType as any,
      });

      if (result.success) {
        setComparisonResult(result.comparison);
      }
    } catch (error) {
      console.error("Erro ao comparar modelos:", error);
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-accent/30 p-6 bg-card/50">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-accent neon-glow" />
          <div>
            <h1 className="text-3xl font-bold neon-glow">HUB DE MODELOS DE IA</h1>
            <p className="text-xs terminal-text opacity-70 mt-1">
              [MULTI_MODEL_ORCHESTRATOR] | [ChatGPT | DeepSeek | Grok | Manus | Claude]
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status dos Modelos */}
        <Card className="bg-card border-accent/30 p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Status dos Modelos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {modelsStatusQuery.data?.models?.map((model: any) => (
              <div
                key={model.provider}
                className={`p-4 rounded border ${
                  model.available
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-sm capitalize">{model.provider}</p>
                  {model.available ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{model.model}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  T: {model.temperature}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Seleção de Modelo */}
        <Card className="bg-card border-accent/30 p-6">
          <h2 className="text-lg font-semibold mb-4">Selecione um Modelo</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-2 block">Tipo de Tarefa</label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full bg-input border border-accent/30 rounded px-3 py-2 text-foreground"
              >
                <option value="general">Geral</option>
                <option value="coding">Programação</option>
                <option value="analysis">Análise</option>
                <option value="creative">Criativo</option>
                <option value="research">Pesquisa</option>
                <option value="reasoning">Raciocínio</option>
                <option value="summarization">Resumo</option>
              </select>
              {getRecommendationQuery.data && (
                <p className="text-xs text-accent mt-2">
                  ✓ Recomendação: {getRecommendationQuery.data.recommendation}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Modelo</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {["manus", "chatgpt", "deepseek", "grok", "claude"].map((provider) => (
                  <Button
                    key={provider}
                    onClick={() => setSelectedProvider(provider)}
                    variant={selectedProvider === provider ? "default" : "outline"}
                    className={
                      selectedProvider === provider
                        ? "bg-accent text-accent-foreground"
                        : "border-accent/50 text-accent"
                    }
                  >
                    {provider.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Sua Pergunta</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite sua pergunta ou tarefa..."
                className="bg-input border-accent/30 text-foreground placeholder-muted-foreground/50"
                onKeyPress={(e) => e.key === "Enter" && handleInvokeModel()}
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleInvokeModel}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={!query.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                Invocar {selectedProvider.toUpperCase()}
              </Button>

              <Button
                onClick={handleAutoRoute}
                variant="outline"
                className="border-accent/50 text-accent hover:bg-accent/10"
                disabled={!query.trim()}
              >
                <Zap className="w-4 h-4 mr-2" />
                Roteamento Automático
              </Button>

              <Button
                onClick={handleCompareModels}
                variant="outline"
                className="border-accent/50 text-accent hover:bg-accent/10"
                disabled={!query.trim() || isComparing}
              >
                <GitCompare className="w-4 h-4 mr-2" />
                {isComparing ? "Comparando..." : "Comparar Modelos"}
              </Button>
            </div>
          </div>
        </Card>

        {/* Resultado da Comparação */}
        {comparisonResult && (
          <Card className="bg-card border-accent/30 p-6">
            <h2 className="text-lg font-semibold mb-4">Resultado da Comparação</h2>
            <div className="space-y-4">
              {comparisonResult.responses?.map((response: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-4 rounded border ${
                    response.provider === comparisonResult.bestResponse?.provider
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-accent/5 border-accent/20"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold capitalize">{response.provider}</p>
                      <p className="text-xs text-muted-foreground">{response.model}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        response.provider === comparisonResult.bestResponse?.provider
                          ? "bg-green-500/20 text-green-400"
                          : ""
                      }
                    >
                      {response.executionTime}ms
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{response.content}</p>
                </div>
              ))}

              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded">
                <p className="font-semibold text-green-400 mb-2">Melhor Resposta</p>
                <p className="text-sm">{comparisonResult.bestResponse?.content}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-accent/30 p-4 bg-card/50 text-xs terminal-text opacity-50 text-center">
        [ORCHESTRATOR_ACTIVE] | [MODELS_READY] | [AUTO_ROUTING_ENABLED]
      </div>
    </div>
  );
}
