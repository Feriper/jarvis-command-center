import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Mic, Volume2, Upload, Sparkles, Copy, Trash2, Loader } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useVoiceChat } from "@/hooks/useVoiceChat";

export default function JarvisChat() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content: "[JARVIS_INITIALIZED] Sistema de IA pessoal ativado. Pronto para assistência. Digite uma mensagem ou use os comandos especiais.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const voiceChat = useVoiceChat({ conversationId: conversationId || undefined });

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const generateImageMutation = trpc.chat.generateImage.useMutation();
  const analyzeImageMutation = trpc.chat.analyzeImage.useMutation();
  const researchTopicMutation = trpc.chat.researchTopic.useMutation();
  const createAgentTaskMutation = trpc.agent.createTask.useMutation();
  const saveFactMutation = trpc.memory.saveFact.useMutation();

  const [isAutonomous, setIsAutonomous] = useState(false);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && !selectedImage) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (isAutonomous) {
        // Criar tarefa autônoma
        await createAgentTaskMutation.mutateAsync({
          objective: input,
          conversationId: conversationId || undefined,
        });
        
        setMessages((prev) => [...prev, { 
          role: "assistant", 
          content: `[AGENT_DEPLOYED] Iniciando execução autônoma para: "${input}". Acompanhe o progresso no log do sistema.` 
        }]);
      } else {
        const result = await sendMessageMutation.mutateAsync({
          conversationId: conversationId || undefined,
          content: input,
          imageUrl: selectedImage || undefined,
        });

        if (!conversationId && result.conversationId) {
          setConversationId(result.conversationId);
        }

        // Tentar extrair fatos importantes (simulação de memória)
        if (input.toLowerCase().includes("lembre-se") || input.toLowerCase().includes("minha meta")) {
          await saveFactMutation.mutateAsync({
            key: `fact_${Date.now()}`,
            value: input,
            category: "user_preference"
          });
        }

        const aiMessage = {
          role: "assistant",
          content: typeof result.content === "string" ? result.content : JSON.stringify(result.content),
        };
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "[ERRO] Falha na comunicação com JARVIS. Tente novamente." },
      ]);
    } finally {
      setInput("");
      setSelectedImage(null);
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const result = await generateImageMutation.mutateAsync({
        prompt: input,
        conversationId: conversationId || undefined,
      });

      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Gerar imagem: ${input}` },
        { role: "assistant", content: `[IMAGE_GENERATED] ${result.message}\n${result.imageUrl}` },
      ]);
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
    } finally {
      setInput("");
      setIsLoading(false);
    }
  };

  const handleResearch = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    try {
      const result = await researchTopicMutation.mutateAsync({
        topic: input,
        depth: "standard",
        conversationId: conversationId || undefined,
      });

      setMessages((prev) => [
        ...prev,
        { role: "user", content: `Pesquisar: ${input}` },
        { role: "assistant", content: `[RESEARCH_COMPLETE]\n${result.research}` },
      ]);
    } catch (error) {
      console.error("Erro na pesquisa:", error);
    } finally {
      setInput("");
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "[JARVIS_RESET] Chat limpo. Pronto para nova conversa.",
      },
    ]);
    setConversationId(null);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-accent/30 p-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
            <h1 className="text-xl font-semibold neon-glow bracket-left bracket-right">
              JARVIS
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs terminal-text opacity-70">
              [SYS_ACTIVE] | [AI_ONLINE] | [LLM_READY]
            </span>
            <Button
              onClick={clearChat}
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-xs lg:max-w-md px-4 py-2 ${
                msg.role === "user"
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card border-accent/50"
              }`}
            >
              <p className="text-sm font-mono whitespace-pre-wrap break-words">{msg.content}</p>
              {msg.role === "assistant" && (
                <Button
                  onClick={() => copyToClipboard(msg.content)}
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              )}
            </Card>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="bg-card border-accent/50 px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-accent/30 p-4 bg-card/50 space-y-3">
        {selectedImage && (
          <div className="relative w-20 h-20 rounded border border-accent/50">
            <img src={selectedImage} alt="preview" className="w-full h-full object-cover rounded" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center text-white text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {voiceChat.transcript && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded">
            <p className="text-xs text-blue-400 font-semibold mb-1">Transcrição de Voz:</p>
            <p className="text-sm text-blue-300">{voiceChat.transcript}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="[INPUT_COMMAND]..."
            className="bg-input border-accent/30 text-foreground placeholder-muted-foreground/50"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isLoading}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
          <div className="relative">
            {isListening && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-card border border-accent/50 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg z-10">
                <div className="voice-visualizer">
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                  <div className="voice-bar"></div>
                </div>
                <span className="text-[10px] terminal-text animate-pulse">OUVINDO...</span>
              </div>
            )}
            <Button
              onClick={() => {
                if (voiceChat.isListening) {
                  voiceChat.stopListening();
                } else {
                  voiceChat.startListening();
                }
              }}
              variant={voiceChat.isListening ? "default" : "outline"}
              size="icon"
              className={voiceChat.isListening ? "bg-accent pulse-glow" : ""}
              disabled={isLoading || voiceChat.isProcessing}
            >
              {voiceChat.isProcessing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            disabled={isLoading}
            className="relative"
          >
            <label className="cursor-pointer">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </Button>
        </div>

        {/* Ações Rápidas */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setIsAutonomous(!isAutonomous)}
            variant={isAutonomous ? "default" : "outline"}
            size="sm"
            className={isAutonomous ? "bg-red-500/20 text-red-400 border-red-500/50" : "border-accent/50 text-accent"}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Modo Autônomo: {isAutonomous ? "ON" : "OFF"}
          </Button>
          <Button
            onClick={handleGenerateImage}
            variant="outline"
            size="sm"
            className="border-accent/50 text-accent hover:bg-accent/10"
            disabled={isLoading || !input.trim()}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Gerar Imagem
          </Button>
          <Button
            onClick={handleResearch}
            variant="outline"
            size="sm"
            className="border-accent/50 text-accent hover:bg-accent/10"
            disabled={isLoading || !input.trim()}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Pesquisar
          </Button>
          <Button
            onClick={() => {
              if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                if (lastMessage.role === "assistant") {
                  voiceChat.speak(lastMessage.content, "professional");
                }
              }
            }}
            variant="outline"
            size="sm"
            className="border-accent/50 text-accent hover:bg-accent/10"
            disabled={isLoading || messages.length === 0}
          >
            <Volume2 className="w-3 h-3 mr-1" />
            Falar Resposta
          </Button>
        </div>

        <div className="text-xs terminal-text opacity-50 text-center">
          [VOICE_ENABLED] | [STT_READY] | [TTS_ACTIVE] | [IMAGE_GEN_READY]
        </div>
      </div>
    </div>
  );
}
