import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Mic, Volume2 } from "lucide-react";

export default function JarvisChat() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content: "[JARVIS_INITIALIZED] Sistema de IA pessoal ativado. Pronto para assistência.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);

    // Simular resposta da IA
    setTimeout(() => {
      const aiResponse = {
        role: "assistant",
        content: `[JARVIS_RESPONSE] Processando: "${input}". Análise concluída.`,
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 500);

    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground scanlines">
      {/* Header */}
      <div className="border-b border-accent/30 p-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
            <h1 className="text-xl font-semibold neon-glow bracket-left bracket-right">
              JARVIS
            </h1>
          </div>
          <div className="text-xs terminal-text opacity-70">
            [SYS_ACTIVE] | [AI_ONLINE]
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <Card
              className={`max-w-xs lg:max-w-md px-4 py-2 ${
                msg.role === "user"
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-card border-accent/50"
              }`}
            >
              <p className="text-sm font-mono">{msg.content}</p>
            </Card>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-accent/30 p-4 bg-card/50 space-y-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="[INPUT_COMMAND]..."
            className="bg-input border-accent/30 text-foreground placeholder-muted-foreground/50"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setIsListening(!isListening)}
            variant={isListening ? "default" : "outline"}
            size="icon"
            className={isListening ? "bg-accent" : ""}
          >
            <Mic className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Volume2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs terminal-text opacity-50 text-center">
          [VOICE_ENABLED] | [STT_READY] | [TTS_ACTIVE]
        </div>
      </div>
    </div>
  );
}
