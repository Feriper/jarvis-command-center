import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, Brain, Shield, Sparkles, User, Bot, Terminal, Activity, Cpu } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  deepThinking?: boolean;
  confidence?: number;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, agencySteps]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simular agência multi-etapas para comandos complexos
    if (input.toLowerCase().includes("pesquise") || input.toLowerCase().includes("analise") || input.length > 30) {
      setAgencySteps([
        { step: 1, action: "ACESSANDO REDE GLOBAL...", status: "executing" },
        { step: 2, action: "PROCESSANDO DADOS EM NÚCLEO NEURAL...", status: "pending" },
        { step: 3, action: "SINTETIZANDO RESPOSTA ESTRATÉGICA...", status: "pending" },
      ]);

      setTimeout(() => {
        setAgencySteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i === 0 ? "completed" : i === 1 ? "executing" : "pending",
          }))
        );
      }, 1500);

      setTimeout(() => {
        setAgencySteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i <= 1 ? "completed" : i === 2 ? "executing" : "pending",
          }))
        );
      }, 3000);
    }

    // Resposta do JARVIS
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: `Senhor, a análise foi concluída. ${
          deepThinkingEnabled
            ? "Executei um ciclo de raciocínio profundo para garantir a máxima precisão estratégica em sua solicitação."
            : "Processei sua solicitação com eficiência nominal."
        }`,
        timestamp: new Date(),
        confidence: deepThinkingEnabled ? 99 : 92,
        deepThinking: deepThinkingEnabled
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      setAgencySteps([]);
    }, 4500);
  };

  return (
    <div className="relative w-full h-screen bg-black text-blue-100 font-mono overflow-hidden">
      {/* Background HUD Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', 
          backgroundSize: '50px 50px' 
        }}></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-full border-x border-blue-500/20 max-w-6xl mx-auto shadow-[0_0_100px_rgba(0,0,0,1)]">
        
        {/* Header HUD */}
        <motion.header 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="p-6 border-b border-blue-500/30 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full border-2 border-blue-500/50 flex items-center justify-center"
              >
                <Zap className="w-6 h-6 text-blue-400" />
              </motion.div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest text-blue-400">JARVIS <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-300 ml-2">ULTRA-PREMIUM</span></h1>
              <div className="flex items-center gap-2 text-[10px] text-blue-500/60 uppercase">
                <Activity className="w-3 h-3" />
                <span>Núcleo Central: Online</span>
                <span className="mx-1">|</span>
                <Cpu className="w-3 h-3" />
                <span>Processamento: 98%</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: "rgba(59, 130, 246, 0.2)" }}
              onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
              className={`px-4 py-2 rounded border transition-all flex items-center gap-2 text-xs font-bold ${
                deepThinkingEnabled ? "border-blue-400 text-blue-400 bg-blue-400/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]" : "border-blue-900 text-blue-900"
              }`}
            >
              <Brain className="w-4 h-4" />
              {deepThinkingEnabled ? "RACIOCÍNIO PROFUNDO: ON" : "MODO RÁPIDO: ON"}
            </motion.button>
            <div className="px-4 py-2 border border-blue-900 rounded text-blue-900 text-xs font-bold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              CRIPTOGRAFIA: AES-256
            </div>
          </div>
        </motion.header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center opacity-40"
              >
                <Terminal className="w-20 h-20 mb-6 text-blue-500/50" />
                <p className="text-sm tracking-widest uppercase">Aguardando comando de voz ou texto...</p>
                <div className="mt-4 flex gap-2">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </motion.div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ x: msg.role === "user" ? 20 : -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                  msg.role === "user" ? "border-blue-500 bg-blue-500/10" : "border-cyan-500 bg-cyan-500/10"
                }`}>
                  {msg.role === "user" ? <User className="w-5 h-5 text-blue-400" /> : <Bot className="w-5 h-5 text-cyan-400" />}
                </div>
                <div className={`flex flex-col max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-5 rounded-2xl border backdrop-blur-md ${
                    msg.role === "user" 
                      ? "bg-blue-900/20 border-blue-500/30 rounded-tr-none text-blue-50 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                      : "bg-slate-900/60 border-cyan-500/30 rounded-tl-none text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
                  }`}>
                    <p className="leading-relaxed text-sm">{msg.content}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[9px] uppercase tracking-tighter text-blue-500/50">
                    <span>{msg.timestamp.toLocaleTimeString()}</span>
                    {msg.confidence && <span>• Confiança: {msg.confidence}%</span>}
                    {msg.deepThinking && <span className="text-purple-400 animate-pulse">• Raciocínio Profundo Ativado</span>}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Autonomous Execution Steps */}
            {agencySteps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-6 backdrop-blur-md"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-blue-300">Agência Autônoma em Execução</h3>
                </div>
                <div className="space-y-4">
                  {agencySteps.map((step) => (
                    <div key={step.step} className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${
                        step.status === "completed" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" :
                        step.status === "executing" ? "bg-blue-400 animate-ping" : "bg-slate-700"
                      }`}></div>
                      <span className={`text-[10px] ${step.status === "completed" ? "text-green-400" : step.status === "executing" ? "text-blue-300" : "text-slate-500"}`}>
                        {step.action}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {isLoading && (
              <div className="flex items-center gap-3 text-blue-400/50 text-[10px] tracking-widest uppercase ml-14">
                <div className="flex gap-1">
                  <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-blue-400 rounded-full"></motion.div>
                  <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-blue-400 rounded-full"></motion.div>
                  <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-blue-400 rounded-full"></motion.div>
                </div>
                Sincronizando Resposta...
              </div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </main>

        {/* Footer Input */}
        <footer className="p-6 border-t border-blue-500/20 bg-slate-900/50 backdrop-blur-xl">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="DIGITE UM COMANDO PARA O JARVIS..."
              className="w-full bg-black/60 border border-blue-900/50 rounded-xl py-5 px-6 pl-14 text-blue-100 placeholder-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-400 transition-all text-sm tracking-widest"
            />
            <Terminal className="absolute left-5 top-5 w-5 h-5 text-blue-900 group-focus-within:text-blue-500 transition-colors" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-2.5 bottom-2.5 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/30 text-white rounded-lg flex items-center gap-2 font-black text-xs transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              <Send className="w-4 h-4" />
              EXECUTAR
            </motion.button>
          </div>
          <div className="mt-4 flex justify-between items-center text-[8px] text-blue-900 uppercase tracking-tighter">
            <span>Sessão Protegida por Stark Industries</span>
            <div className="flex gap-4">
              <span>Ping: 14ms</span>
              <span>Buffer: Limpo</span>
              <span>Memória: Persistente</span>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Decorative HUD Elements */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
    </div>
  );
}

export default JarvisUltraPremium;
