/**
 * JARVIS Ultra-Premium Chat Interface
 * Glassmorphism Dark Mode com Animações Fluidas e Agência Autônoma
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Zap, Brain, Shield, Sparkles } from "lucide-react";

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
  }, [messages]);

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

    // Simular agência multi-etapas
    if (input.toLowerCase().includes("pesquise") || input.toLowerCase().includes("analise")) {
      setAgencySteps([
        { step: 1, action: "🔍 Pesquisando na web...", status: "executing" },
        { step: 2, action: "🧠 Analisando dados...", status: "pending" },
        { step: 3, action: "✨ Gerando insights...", status: "pending" },
      ]);

      // Simular progresso
      setTimeout(() => {
        setAgencySteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i === 0 ? "completed" : i === 1 ? "executing" : "pending",
          }))
        );
      }, 2000);

      setTimeout(() => {
        setAgencySteps((prev) =>
          prev.map((s, i) => ({
            ...s,
            status: i <= 1 ? "completed" : i === 2 ? "executing" : "pending",
          }))
        );
      }, 4000);
    }

    // Simular resposta do JARVIS
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: "assistant",
        content: `Senhor, processei sua solicitação com sucesso. ${
          deepThinkingEnabled
            ? "Utilizei raciocínio profundo (System 2) para análise estratégica."
            : "Resposta gerada com precisão."
        }`,
        timestamp: new Date(),
        confidence: deepThinkingEnabled ? 95 : 85,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      setAgencySteps([]);
    }, 6000);
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Fundo Animado */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0"
        />
      </div>

      {/* Container Principal */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/5 border-b border-white/10 px-6 py-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-6 h-6 text-blue-400" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-white">JARVIS Ultra-Premium</h1>
                <p className="text-sm text-gray-400">Agência Autônoma de Elite</p>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDeepThinkingEnabled(!deepThinkingEnabled)}
                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  deepThinkingEnabled
                    ? "bg-purple-500/30 text-purple-300 border border-purple-400"
                    : "bg-white/5 text-gray-400 border border-white/10"
                }`}
              >
                <Brain className="w-4 h-4" />
                {deepThinkingEnabled ? "Raciocínio Profundo" : "Modo Rápido"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 rounded-lg bg-white/5 text-gray-400 border border-white/10 font-semibold flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Privado
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Área de Mensagens */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <AnimatePresence>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col items-center justify-center text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Zap className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo, Senhor</h2>
                <p className="text-gray-400 max-w-md">
                  Sou o JARVIS Ultra-Premium. Pronto para executar suas ordens com agência autônoma,
                  pesquisa em tempo real e raciocínio estratégico de elite.
                </p>
              </motion.div>
            )}

            {messages.map((msg, idx) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-2xl px-6 py-4 rounded-2xl backdrop-blur-md border ${
                    msg.role === "user"
                      ? "bg-blue-500/20 border-blue-400/30 text-white rounded-br-none"
                      : "bg-white/5 border-white/10 text-gray-100 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  {msg.confidence && (
                    <p className="text-xs text-gray-400 mt-2">
                      Confiança: {msg.confidence}% {msg.deepThinking && "| Raciocínio Profundo"}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Passos de Agência */}
            {agencySteps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md"
              >
                <h3 className="text-sm font-semibold text-white mb-4">Execução Autônoma</h3>
                <div className="space-y-3">
                  {agencySteps.map((step) => (
                    <motion.div
                      key={step.step}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <motion.div
                        animate={
                          step.status === "executing"
                            ? { rotate: 360 }
                            : step.status === "completed"
                              ? { scale: 1 }
                              : { opacity: 0.5 }
                        }
                        transition={
                          step.status === "executing"
                            ? { duration: 1, repeat: Infinity }
                            : {}
                        }
                        className={`w-5 h-5 rounded-full border-2 ${
                          step.status === "completed"
                            ? "bg-green-500/30 border-green-400"
                            : step.status === "executing"
                              ? "border-blue-400"
                              : "border-gray-600"
                        }`}
                      />
                      <span className="text-sm text-gray-300">{step.action}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-gray-400"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
                />
                <span className="text-sm">JARVIS pensando...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-md bg-white/5 border-t border-white/10 px-6 py-6"
        >
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Fale com o JARVIS..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all"
            >
              <Send className="w-4 h-4" />
              Enviar
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default JarvisUltraPremium;
