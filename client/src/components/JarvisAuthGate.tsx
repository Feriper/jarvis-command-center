/**
 * JARVIS Auth Gate - Controle de Acesso Familiar
 * Whitelist de e-mails para círculo de confiança
 */

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, CheckCircle, AlertCircle } from "lucide-react";

interface AuthGateProps {
  onAuthSuccess: () => void;
}

export function JarvisAuthGate({ onAuthSuccess }: AuthGateProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Whitelist de e-mails autorizados (simulado)
  const AUTHORIZED_EMAILS = [
    "seu-email@example.com",
    "familia@example.com",
    "amigo-confiavel@example.com",
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simular verificação
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (!AUTHORIZED_EMAILS.includes(email.toLowerCase())) {
      setError("E-mail não autorizado. Apenas familiares e amigos de confiança têm acesso.");
      setIsLoading(false);
      return;
    }

    if (password !== "jarvis2026") {
      setError("Senha incorreta.");
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onAuthSuccess();
    }, 1500);
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center overflow-hidden">
      {/* Fundo Animado */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.4) 0%, transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute inset-0"
        />
      </div>

      {/* Card de Login */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <Lock className="w-12 h-12 text-blue-400" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">JARVIS</h1>
            <p className="text-gray-400">Acesso Exclusivo - Círculo de Confiança</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-email@example.com"
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:bg-white/15 transition-all"
              />
            </motion.div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-red-500/20 border border-red-400/30 rounded-lg p-3 text-red-300 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-lg p-3 text-green-300 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Autenticação bem-sucedida! Bem-vindo ao JARVIS.
              </motion.div>
            )}

            {/* Login Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading || success}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {isLoading ? "Verificando..." : success ? "Redirecionando..." : "Acessar JARVIS"}
            </motion.button>
          </form>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-gray-400"
          >
            <p>Acesso restrito ao círculo de confiança familiar.</p>
            <p className="mt-2">Todos os acessos são registrados e auditados.</p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default JarvisAuthGate;
