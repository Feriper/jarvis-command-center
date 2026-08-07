import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, CheckCircle, AlertCircle, ShieldCheck, Zap } from "lucide-react";

interface AuthGateProps {
  onAuthSuccess: () => void;
}

export function JarvisAuthGate({ onAuthSuccess }: AuthGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Whitelist de e-mails autorizados
  const AUTHORIZED_EMAILS = [
    "seu-email@example.com",
    "familia@example.com",
    "amigo-confiavel@example.com",
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setScanProgress(0);

    // Efeito de Scan Biométrico
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 50);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
      setError("ACESSO NEGADO: Identidade não reconhecida no banco de dados Stark.");
      setIsLoading(false);
      setScanProgress(0);
      return;
    }

    if (password !== "jarvis2026") {
      setError("ERRO DE CRIPTOGRAFIA: Senha incorreta.");
      setIsLoading(false);
      setScanProgress(0);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onAuthSuccess();
    }, 1500);
  };

  return (
    <div className="w-full h-screen bg-black flex items-center justify-center overflow-hidden font-mono">
      {/* HUD Background - Efeito de Grade Futurista */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{ 
          backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', 
          backgroundSize: '30px 30px' 
        }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
      </div>

      {/* Partículas de Luz Flutuantes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%", 
              opacity: Math.random() 
            }}
            animate={{ 
              y: [null, "-100%"],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 5 + 5, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 5
            }}
          />
        ))}
      </div>

      {/* Main Portal Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 w-full max-w-lg mx-4"
      >
        {/* Glow Outer Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        
        <div className="relative bg-slate-900/80 backdrop-blur-2xl border border-blue-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
          
          {/* Top Bar Decoration */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
          
          {/* JARVIS Identity */}
          <div className="flex flex-col items-center mb-10">
            <motion.div
              animate={{ 
                boxShadow: ["0 0 0px rgba(59,130,246,0.2)", "0 0 20px rgba(59,130,246,0.6)", "0 0 0px rgba(59,130,246,0.2)"]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 rounded-full border-2 border-blue-500/50 flex items-center justify-center relative mb-4"
            >
              <Zap className="w-10 h-10 text-blue-400" />
              {/* Spinning Rings */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-t-2 border-blue-400 rounded-full"
              ></motion.div>
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 border-b-2 border-cyan-400/30 rounded-full"
              ></motion.div>
            </motion.div>
            
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 tracking-[0.2em]">JARVIS</h1>
            <div className="flex items-center gap-2 mt-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] text-blue-400/70 uppercase tracking-widest">Protocolo de Segurança Ativo</span>
            </div>
          </div>

          {/* Login Interface */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-500/50 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full bg-black/40 border border-blue-900/50 rounded-lg py-4 pl-10 pr-3 text-blue-100 placeholder-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-sm"
                  placeholder="IDENTIFICAÇÃO DE E-MAIL"
                  required
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-blue-500/50 group-focus-within:text-blue-400 transition-colors" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full bg-black/40 border border-blue-900/50 rounded-lg py-4 pl-10 pr-3 text-blue-100 placeholder-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all text-sm"
                  placeholder="CÓDIGO DE ACESSO"
                  required
                />
              </div>
            </div>

            {/* Scan Progress Bar */}
            {isLoading && (
              <div className="w-full h-1 bg-blue-900/30 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${scanProgress}%` }}
                  className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                />
              </div>
            )}

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-red-950/30 border border-red-900/50 rounded-lg text-red-400 text-xs"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-3 p-4 bg-green-950/30 border border-green-900/50 rounded-lg text-green-400 text-xs"
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p>IDENTIDADE CONFIRMADA. BEM-VINDO DE VOLTA, SENHOR.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading || success}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 text-white font-bold rounded-lg shadow-lg transition-all uppercase tracking-widest text-sm relative overflow-hidden group"
            >
              <span className="relative z-10">{isLoading ? "ANALISANDO..." : "INICIAR SISTEMA"}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            </motion.button>
          </form>

          {/* Footer Terminal Style */}
          <div className="mt-8 pt-6 border-t border-blue-900/30 flex justify-between items-center text-[9px] text-blue-900 uppercase tracking-tighter">
            <span>SISTEMA: V4.0.0-ULTRA</span>
            <span>STATUS: VIGILÂNCIA ATIVA</span>
            <span>ESTADO: PROTEGIDO</span>
          </div>
        </div>
      </motion.div>
      
      {/* Corner Decorations */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-blue-500/20"></div>
      <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-blue-500/20"></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-blue-500/20"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-blue-500/20"></div>
    </div>
  );
}

export default JarvisAuthGate;
