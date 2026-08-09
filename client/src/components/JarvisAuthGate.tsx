import React from "react";
import { ShieldCheck, Zap } from "lucide-react";
import { startLogin } from "@/const";

interface AuthGateProps {
  onAuthSuccess?: () => void;
}

export function JarvisAuthGate({ onAuthSuccess }: AuthGateProps) {
  const handleLogin = () => {
    onAuthSuccess?.();
    startLogin();
  };

  return (
    <main className="w-full min-h-screen bg-black text-blue-100 flex items-center justify-center p-6 font-mono">
      <section className="w-full max-w-lg rounded-2xl border border-blue-500/30 bg-slate-900/80 p-8 text-center shadow-[0_0_50px_rgba(59,130,246,0.2)]">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border-2 border-blue-500/50">
          <Zap className="h-10 w-10 text-blue-400" />
        </div>
        <h1 className="text-4xl font-black tracking-[0.2em] text-blue-300">JARVIS</h1>
        <div className="mt-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-blue-400/80">
          <ShieldCheck className="h-4 w-4" /> Autenticação oficial protegida
        </div>
        <p className="mt-8 text-sm leading-6 text-slate-300">
          Entre usando a sessão oficial do sistema. O Jarvis não armazena senha, chave Pix ou segredo de conta no navegador.
        </p>
        <button
          type="button"
          onClick={handleLogin}
          className="mt-8 w-full rounded-lg bg-blue-600 py-4 font-bold uppercase tracking-widest text-white transition hover:bg-blue-500"
        >
          Entrar com autenticação oficial
        </button>
        <p className="mt-6 text-[10px] uppercase tracking-widest text-blue-900">
          Ações financeiras e publicações permanecem bloqueadas até aprovação
        </p>
      </section>
    </main>
  );
}

export default JarvisAuthGate;
