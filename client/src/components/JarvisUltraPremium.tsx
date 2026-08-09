import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, Brain, Shield, Sparkles, User, Bot, Terminal, Activity, Cpu, Globe, Search, ArrowRight } from "lucide-react";
import { trpc } from "../lib/trpc";
import { JarvisHUD } from "./JarvisHUD";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  deepThinking?: boolean;
  confidence?: number;
  sources?: string[];
}

interface AgencyStep {
  step: number;
  action: string;
  status: "pending" | "executing" | "completed";
}

export function JarvisUltraPremium() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agencySteps, setAgencySteps] = useState<AgencyStep[]>([]);
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [systemStatus, setSystemStatus] = useState<"nominal" | "processing" | "alert">("nominal");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = trpc.jarvisUnified.sendMessageWithContext.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agencySteps]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userContent = input.trim();
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setSystemStatus("processing");

    // Simular passos de agência com foco em Pesquisa e Conectividade
    setAgencySteps([
      { step: 1, action: "INICIALIZANDO PROTOCOLO NET-SYNC...", status: "executing" },
      { step: 2, action: "VARRENDO FONTES GLOBAIS (SEARCH_MODE)...", status: "pending" },
      { step: 3, action: "SINTETIZANDO CONHECIMENTO STARK...", status: "pending" },
    ]);

    try {
      const response = await sendMessageMutation.mutateAsync({
        content: userContent,
        conversationId: conversationId,
        deepThinking: deepThinkingEnabled,
      });

      setAgencySteps((prev) => prev.map(s => ({ ...s, status: "completed" })));

      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: response.content,
        timestamp: new Date(),
        confidence: response.confidenceScore,
        deepThinking: response.deepThinkingPerformed,
        sources: (response as any).sources || []
      };

      if (response.conversationId) {
        setConversationId(response.conversationId);
      }

      setMessages((prev) => [...prev, assistantMessage]);
      setSystemStatus("nominal");
    } catch (error) {
      console.error("Erro JARVIS:", error);
      setSystemStatus("alert");
      const errorMessage: Message = {
        id: `msg_err_${Date.now()}`,
        role: "assistant",
        content: "Senhor, detectei uma falha na conexão com o núcleo central. O Protocolo Guardian sugere uma reinicialização de rede.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => setAgencySteps([]), 1500);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black text-blue-100 font-mono overflow-hidden">
      {/* JARVIS HUD - Camada Superior de UI */}
      <JarvisHUD 
        status={systemStatus} 
        workload={isLoading ? 85 : 12} 
        activeObjectives={3} 
      />

      {/* Background HUD Grid & Scanline */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent animate-[scanline_8s_linear_infinite]"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-full max-w-5xl mx-auto border-x border-blue-500/10">
        
        {/* Header HUD - Minimalista e Funcional */}
        <motion.header 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-8 py-6 flex items-center justify-between bg-black/40 backdrop-blur-sm border-b border-blue-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
            <h1 className="text-lg font-black tracking-[0.3em] text-blue-400">JARVIS <span className="text-[9px] text-blue-500/50 tracking-widest">NET-SYNC V4</span></h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-[9px] text-blue-500/40">
              <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> WEB_SYNC: ON</span>
              <span className="flex items-center gap-1"><Brain className="w-3 h-3" /> NEURAL: STABLE</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, borderColor: "rgba(59, 130, 246, 0.5)" }}
              onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
              className={`px-3 py-1.5 border rounded text-[10px] font-bold transition-all ${
                deepThinkingEnabled ? "border-blue-400 text-blue-400 bg-blue-400/5" : "border-blue-900 text-blue-900"
              }`}
            >
              {deepThinkingEnabled ? "DEEP_THINK: ON" : "FAST_MODE: ON"}
            </motion.button>
          </div>
        </motion.header>

        {/* Chat Area - Imersiva */}
        <main className="flex-1 overflow-y-auto px-8 py-10 space-y-10 scrollbar-hide">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center"
              >
                <div className="relative mb-8">
                  <Search className="w-16 h-16 text-blue-500/20" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute inset-0 border-2 border-blue-500/10 rounded-full scale-150"
                  ></motion.div>
                </div>
                <p className="text-[11px] tracking-[0.5em] uppercase text-blue-500/40 text-center">
                  SISTEMA PRONTO PARA PESQUISA E EXECUÇÃO
                </p>
              </motion.div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-6 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-8 h-8 rounded border flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "border-blue-500/40 bg-blue-500/5" : "border-cyan-500/40 bg-cyan-500/5"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4 text-blue-400" /> : <Bot className="w-4 h-4 text-cyan-400" />}
                </div>
                
                <div className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-6 border bg-black/40 backdrop-blur-xl ${
                    msg.role === "user" 
                      ? "border-blue-500/20 rounded-tr-none text-blue-100" 
                      : "border-cyan-500/20 rounded-tl-none text-cyan-50"
                  }`}>
                    <p className="leading-relaxed text-sm whitespace-pre-wrap">{msg.content}</p>
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                        <p className="text-[9px] text-blue-500/50 uppercase tracking-widest">Fontes Verificadas:</p>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((source, i) => (
                            <a key={i} href={source} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                              <Globe className="w-3 h-3" /> FONT_{i+1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-2 flex items-center gap-4 text-[8px] uppercase tracking-widest text-blue-500/30">
                    <span>{msg.timestamp.toLocaleTimeString()}</span>
                    {msg.confidence && <span>CONFIDÊNCIA: {msg.confidence}%</span>}
                    {msg.deepThinking && <span className="text-blue-400 animate-pulse">REFLEXÃO_ATIVA</span>}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Agência Autônoma HUD Element */}
            {agencySteps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="ml-14 p-6 border-l-2 border-blue-500/20 bg-blue-500/5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-3 h-3 text-blue-400 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Execução em Tempo Real</span>
                </div>
                <div className="space-y-3">
                  {agencySteps.map((step) => (
                    <div key={step.step} className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        step.status === "completed" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" :
                        step.status === "executing" ? "bg-blue-400 animate-ping" : "bg-white/10"
                      }`}></div>
                      <span className={`text-[9px] tracking-widest ${step.status === "completed" ? "text-green-400/70" : step.status === "executing" ? "text-blue-300" : "text-white/20"}`}>
                        {step.action}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </main>

        {/* Input Terminal - Design Industrial Stark */}
        <footer className="px-8 py-8 border-t border-blue-500/10 bg-black/60">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-1000"></div>
            <div className="relative flex items-center bg-black border border-blue-500/20 rounded-xl overflow-hidden">
              <div className="pl-6 text-blue-500/40">
                <Terminal className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="INSIRA COMANDO OU CONSULTA ESTRATÉGICA..."
                className="w-full bg-transparent py-5 px-4 text-blue-100 placeholder-blue-900/50 focus:outline-none text-xs tracking-widest"
              />
              <motion.button
                whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                className="pr-6 pl-4 py-5 flex items-center gap-3 text-blue-400 disabled:text-blue-900 transition-colors group/btn"
              >
                <span className="text-[10px] font-black tracking-widest group-hover/btn:mr-1 transition-all">EXECUTAR</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center text-[7px] text-blue-900 uppercase tracking-widest">
            <span>STARK_INDUSTRIES // NEURAL_LINK_ESTABLISHED</span>
            <div className="flex gap-6">
              <span>LATÊNCIA: 12ms</span>
              <span>CRIPTOGRAFIA: AES_256_ACTIVE</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default JarvisUltraPremium;
