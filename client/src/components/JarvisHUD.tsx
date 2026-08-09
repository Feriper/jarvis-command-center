import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Shield, Cpu, Wifi, Zap, Terminal, Layers } from "lucide-react";

interface HUDProps {
  status: "nominal" | "processing" | "alert";
  workload: number;
  activeObjectives: number;
}

export function JarvisHUD({ status, workload, activeObjectives }: HUDProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const statusColors = {
    nominal: "text-blue-400 border-blue-500/30",
    processing: "text-cyan-400 border-cyan-500/30",
    alert: "text-red-400 border-red-500/30",
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden font-mono text-[10px] uppercase tracking-widest">
      {/* Top Left: System Time & Core Status */}
      <motion.div 
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-6 left-6 flex flex-col gap-2"
      >
        <div className={`border-l-2 pl-3 py-1 ${statusColors[status]}`}>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>SISTEMA: {status}</span>
          </div>
          <div className="text-white/40">{time.toLocaleTimeString()} | UTC-3</div>
        </div>
        <div className="flex gap-4 text-white/20">
          <div className="flex items-center gap-1">
            <Cpu className="w-3 h-3" /> {workload}%
          </div>
          <div className="flex items-center gap-1">
            <Layers className="w-3 h-3" /> {activeObjectives} OBJ
          </div>
        </div>
      </motion.div>

      {/* Top Right: Security & Network */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-6 right-6 flex flex-col items-end gap-2"
      >
        <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-full px-4 py-1">
          <Shield className="w-3 h-3 text-blue-400" />
          <span className="text-blue-400/80">GUARDIAN: ATIVO</span>
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
        </div>
        <div className="flex items-center gap-2 text-white/20">
          <Wifi className="w-3 h-3" />
          <span>NET-SYNC: ESTÁVEL</span>
        </div>
      </motion.div>

      {/* Bottom Left: Terminal Log (Static Decoraion) */}
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-24 left-6 w-48 opacity-20"
      >
        <div className="flex items-center gap-2 mb-2 border-b border-white/10 pb-1">
          <Terminal className="w-3 h-3" />
          <span>LOGS_SISTEMA</span>
        </div>
        <div className="space-y-1">
          <div>{">"} INIT_NEURAL_LINK...</div>
          <div>{">"} SYNC_WEB_SEARCH...</div>
          <div>{">"} MENTALITY_V4_LOADED</div>
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >_</motion.div>
        </div>
      </motion.div>

      {/* Bottom Right: Power Core */}
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute bottom-24 right-6"
      >
        <div className="relative w-16 h-16">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full"
          ></motion.div>
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 border-2 border-blue-400/40 rounded-full border-t-transparent"
          ></motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-6 h-6 text-blue-400/60 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Screen Edge Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)] pointer-events-none"></div>
    </div>
  );
}
