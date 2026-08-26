import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bot,
  ChevronDown,
  Cpu,
  FileSearch,
  Image as ImageIcon,
  Mic,
  MoreHorizontal,
  PanelLeft,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  User,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { trpc } from "../lib/trpc";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  deepThinking?: boolean;
  confidence?: number;
  sources?: string[];
  imageUrl?: string;
}

type PersonaMode = "strategic" | "companion";
type SystemStatus = "nominal" | "processing" | "alert";

function normalizeWakeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function JarvisUltraPremium() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [personaMode, setPersonaMode] = useState<PersonaMode>(() => {
    try {
      return (localStorage.getItem("auren-persona-mode") as PersonaMode) || "strategic";
    } catch {
      return "strategic";
    }
  });
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("nominal");
  const [isListening, setIsListening] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(false);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const [deepThinkingEnabled, setDeepThinkingEnabled] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState(() => {
    try {
      return localStorage.getItem("auren-microphone-id") || "";
    } catch {
      return "";
    }
  });
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [screenWatchEnabled, setScreenWatchEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  const wakeRecognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessageMutation = trpc.chat.sendMessage.useMutation();
  const generateImageMutation = trpc.chat.generateImage.useMutation();
  const systemSnapshotQuery = trpc.local.getSnapshot.useQuery(undefined, { enabled: false });
  const bridgeStatusQuery = trpc.local.bridgeStatus.useQuery(undefined, { enabled: false });
  const cleanupPreviewQuery = trpc.local.cleanupPreview.useQuery(undefined, { enabled: false });
  const screenshotQuery = trpc.local.screenshot.useQuery(undefined, { enabled: false });
  const screenWatchQuery = trpc.local.screenshot.useQuery(undefined, {
    enabled: screenWatchEnabled,
    refetchInterval: screenWatchEnabled ? 15000 : false,
    refetchOnWindowFocus: false,
  });

  const statusLabel = useMemo(() => {
    if (isLoading || systemStatus === "processing") return "Processando";
    if (systemStatus === "alert") return "Atenção necessária";
    if (wakeWordEnabled) return "Aguardando Auren";
    return "Pronto";
  }, [isLoading, systemStatus, wakeWordEnabled]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem("auren-persona-mode", personaMode);
    } catch {
      // O navegador pode bloquear localStorage em modo privado.
    }
  }, [personaMode]);

  useEffect(() => {
    try {
      localStorage.setItem("auren-microphone-id", selectedMicrophone);
    } catch {
      // Preferência opcional.
    }
  }, [selectedMicrophone]);

  useEffect(() => {
    if (!voiceOutputEnabled) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant" || typeof window === "undefined" || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(lastMessage.content);
    utterance.lang = "pt-BR";
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.lang.toLowerCase().startsWith("pt-br")) || null;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [messages, voiceOutputEnabled]);

  const refreshMicrophones = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setVoiceNotice("Este navegador não permite listar microfones.");
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === "audioinput");
      setMicrophones(audioInputs);
      if (!selectedMicrophone && audioInputs[0]?.deviceId) {
        setSelectedMicrophone(audioInputs[0].deviceId);
      }
      if (audioInputs.length === 0) setVoiceNotice("Nenhum microfone foi encontrado.");
    } catch {
      setVoiceNotice("Não foi possível listar os microfones.");
    }
  };

  const requestMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceNotice("Este navegador não oferece acesso ao microfone.");
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: selectedMicrophone ? { deviceId: { exact: selectedMicrophone } } : true,
      });
      stream.getTracks().forEach(track => track.stop());
      await refreshMicrophones();
      return true;
    } catch {
      setVoiceNotice("Permissão de microfone negada ou dispositivo indisponível.");
      return false;
    }
  };

  const handleSendMessage = async (contentOverride?: string) => {
    const userContent = (contentOverride ?? input).trim();
    if (!userContent || isLoading) return;

    const startedAt = performance.now();
    setMessages(prev => [...prev, {
      id: `msg_${Date.now()}`,
      role: "user",
      content: userContent,
      timestamp: new Date(),
    }]);
    setInput("");
    setIsLoading(true);
    setSystemStatus("processing");
    setVoiceNotice("");

    try {
      if (userContent.toLowerCase().startsWith("/imagem ")) {
        const result = await generateImageMutation.mutateAsync({
          prompt: userContent.slice("/imagem ".length).trim(),
          style: "cinematográfico, detalhado, original",
          conversationId,
        });
        setMessages(prev => [...prev, {
          id: `msg_${Date.now() + 1}`,
          role: "assistant",
          content: result.message,
          imageUrl: result.imageUrl,
          timestamp: new Date(),
        }]);
      } else {
        const response = await sendMessageMutation.mutateAsync({
          content: userContent,
          conversationId,
          deepThinking: deepThinkingEnabled,
          mode: personaMode,
        });
        if (response.conversationId) setConversationId(response.conversationId);
        setMessages(prev => [...prev, {
          id: `msg_${Date.now() + 1}`,
          role: "assistant",
          content: response.content,
          timestamp: new Date(),
          confidence: response.confidenceScore,
          deepThinking: response.deepThinkingPerformed,
          sources: (response as any).sources || [],
        }]);
      }
      setLastLatencyMs(Math.round(performance.now() - startedAt));
      setSystemStatus("nominal");
    } catch (error) {
      console.error("Erro no Auren:", error);
      const detail = error instanceof Error ? error.message : "falha desconhecida";
      setMessages(prev => [...prev, {
        id: `msg_err_${Date.now()}`,
        role: "assistant",
        content: `Não consegui concluir esta solicitação. ${detail}`,
        timestamp: new Date(),
      }]);
      setSystemStatus("alert");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!wakeWordEnabled) {
      wakeRecognitionRef.current?.stop();
      wakeRecognitionRef.current = null;
      return;
    }

    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceNotice("Ativação por palavra não está disponível neste navegador. Use o botão Falar.");
      setWakeWordEnabled(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onstart = () => setVoiceNotice("Auren está em espera. Diga “Auren” e depois o comando.");
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results || [])
        .slice(event.resultIndex || 0)
        .map((result: any) => result?.[0]?.transcript || "")
        .join(" ")
        .trim();
      const normalized = normalizeWakeText(transcript);
      const wakeAliases = ["auren", "aurem"];
      const wakeAlias = wakeAliases.find(alias => normalized.includes(alias));
      if (!wakeAlias) return;

      const command = transcript.slice(normalized.indexOf(wakeAlias) + wakeAlias.length).trim();
      if (!command) {
        setVoiceNotice("Palavra reconhecida. Agora diga o que você precisa.");
        return;
      }
      setVoiceNotice(`Comando recebido: ${command}`);
      void handleSendMessage(command);
    };
    recognition.onerror = (event: any) => {
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        setVoiceNotice("O navegador bloqueou o microfone. Autorize o microfone do endereço local.");
        setWakeWordEnabled(false);
      } else {
        setVoiceNotice("A escuta foi interrompida pelo navegador; tente ativar novamente.");
      }
    };
    recognition.onend = () => {
      if (wakeWordEnabled) {
        window.setTimeout(() => {
          try { recognition.start(); } catch { /* já iniciado ou encerrado */ }
        }, 700);
      }
    };
    wakeRecognitionRef.current = recognition;
    void requestMicrophone().then(allowed => {
      if (!allowed) {
        setWakeWordEnabled(false);
        return;
      }
      try {
        recognition.start();
      } catch {
        setVoiceNotice("Não foi possível iniciar a escuta por palavra.");
        setWakeWordEnabled(false);
      }
    });

    return () => {
      recognition.onend = null;
      recognition.stop();
      wakeRecognitionRef.current = null;
    };
  }, [wakeWordEnabled]);

  const toggleVoiceListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const allowed = await requestMicrophone();
    if (!allowed) return;

    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceNotice("Reconhecimento de voz não disponível neste navegador.");
      return;
    }

    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setIsListening(true);
      setVoiceNotice("Auren está ouvindo este comando...");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setVoiceNotice(`Comando recebido: ${transcript}`);
        void handleSendMessage(transcript);
      }
    };
    recognition.onerror = () => {
      setVoiceNotice("Não consegui entender o áudio. Tente novamente.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setVoiceNotice("Não foi possível iniciar o reconhecimento de voz.");
    }
  };

  const quickPrompts = ["O que você consegue fazer?", "Faça um diagnóstico do PC", "Explique o modo Companheiro"];

  return (
    <div className="min-h-screen bg-[#071014] text-slate-100 selection:bg-cyan-400/30">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden shrink-0 overflow-hidden border-r border-white/8 bg-[#0a151a] lg:block"
            >
              <div className="flex h-full min-h-screen w-[280px] flex-col p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400 text-[#061014] shadow-[0_0_28px_rgba(34,211,238,0.24)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300">Auren</p>
                    <p className="mt-1 text-xs text-slate-500">assistente local</p>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-emerald-400/15 bg-emerald-400/6 p-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium text-emerald-200">
                      <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.9)]" />
                      {statusLabel}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-emerald-300/50">local</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">Ollama local · sem custo por mensagem</p>
                  {lastLatencyMs !== null && <p className="mt-2 text-[11px] text-slate-500">Última resposta: {(lastLatencyMs / 1000).toFixed(1)}s</p>}
                </div>

                <div className="mt-6">
                  <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Personalidade</p>
                  <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#111f25] p-1">
                    <button
                      type="button"
                      onClick={() => setPersonaMode("strategic")}
                      className={`rounded-lg px-2 py-2 text-xs transition ${personaMode === "strategic" ? "bg-cyan-300 text-[#071014]" : "text-slate-400 hover:text-white"}`}
                    >
                      Estratégico
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersonaMode("companion")}
                      className={`rounded-lg px-2 py-2 text-xs transition ${personaMode === "companion" ? "bg-cyan-300 text-[#071014]" : "text-slate-400 hover:text-white"}`}
                    >
                      Companheiro
                    </button>
                  </div>
                </div>

                <div className="mt-7 space-y-2">
                  <button type="button" onClick={() => void systemSnapshotQuery.refetch()} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                    <Cpu className="h-4 w-4 text-cyan-300" /> Diagnóstico do PC
                  </button>
                  <button type="button" onClick={() => void cleanupPreviewQuery.refetch()} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                    <FileSearch className="h-4 w-4 text-amber-300" /> Prévia de limpeza
                  </button>
                  <button type="button" onClick={() => void bridgeStatusQuery.refetch()} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                    <ShieldCheck className="h-4 w-4 text-emerald-300" /> Status da ponte
                  </button>
                  <button type="button" onClick={() => void screenshotQuery.refetch()} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                    <Search className="h-4 w-4 text-violet-300" /> Capturar tela
                  </button>
                  <button type="button" onClick={() => setScreenWatchEnabled(value => !value)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition hover:bg-white/5 hover:text-white ${screenWatchEnabled ? "text-violet-200" : "text-slate-300"}`}>
                    <Activity className="h-4 w-4 text-violet-300" /> Observação {screenWatchEnabled ? "ligada" : "desligada"}
                  </button>
                </div>

                <div className="mt-auto rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                  <p className="text-xs font-medium text-slate-300">Privacidade local</p>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">Memória e conversas ficam no computador. O microfone começa desligado.</p>
                  <button type="button" onClick={() => setShowSettings(true)} className="mt-3 flex items-center gap-2 text-xs text-cyan-300 hover:text-cyan-200">
                    <Settings2 className="h-3.5 w-3.5" /> Configurar dispositivos
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[76px] items-center justify-between border-b border-white/8 bg-[#071014]/90 px-5 backdrop-blur-xl sm:px-8">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setShowSidebar(value => !value)} className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white" title="Mostrar ou ocultar painel">
                <PanelLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-base font-semibold tracking-tight text-white">Conversa com Auren</h1>
                <p className="mt-0.5 text-xs text-slate-500">{personaMode === "strategic" ? "Modo Estratégico" : "Modo Companheiro"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-[11px] text-emerald-200 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> IA local
              </div>
              <button type="button" onClick={() => setShowSettings(true)} className="rounded-xl border border-white/8 p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white" title="Configurações">
                <Settings2 className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setShowTools(value => !value)} className="rounded-xl border border-white/8 p-2.5 text-slate-400 transition hover:bg-white/5 hover:text-white" title="Ferramentas">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </header>

          {showTools && (
            <div className="border-b border-white/8 bg-[#0a171c] px-5 py-3 sm:px-8">
              <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
                <button type="button" onClick={() => void systemSnapshotQuery.refetch()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Diagnóstico</button>
                <button type="button" onClick={() => void cleanupPreviewQuery.refetch()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Limpeza preview</button>
                <button type="button" onClick={() => void bridgeStatusQuery.refetch()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Ponte Windows</button>
                <button type="button" onClick={() => void screenshotQuery.refetch()} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 hover:bg-white/5">Capturar tela</button>
                <button type="button" onClick={() => setScreenWatchEnabled(value => !value)} className={`rounded-lg border px-3 py-2 text-xs ${screenWatchEnabled ? "border-violet-300/40 bg-violet-300/10 text-violet-200" : "border-white/10 text-slate-300"}`}>Observação {screenWatchEnabled ? "ON" : "OFF"}</button>
                <button type="button" onClick={() => setDeepThinkingEnabled(value => !value)} className={`rounded-lg border px-3 py-2 text-xs ${deepThinkingEnabled ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-200" : "border-white/10 text-slate-300"}`}>{deepThinkingEnabled ? "Reflexão: ligada" : "Resposta rápida"}</button>
              </div>
            </div>
          )}

          <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
            <div className="mx-auto w-full max-w-4xl">
              {messages.length === 0 ? (
                <div className="flex min-h-[calc(100vh-260px)] flex-col justify-center">
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/20">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <p className="text-sm font-medium text-cyan-200">Olá, Feripe.</p>
                    <h2 className="mt-2 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">Como posso ajudar você hoje?</h2>
                    <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">Sou o Auren. Posso conversar, organizar ideias, diagnosticar o computador e ajudar com segurança usando a IA local.</p>
                    <div className="mt-8 flex flex-wrap gap-2">
                      {quickPrompts.map(prompt => (
                        <button key={prompt} type="button" onClick={() => void handleSendMessage(prompt)} className="rounded-full border border-white/10 bg-white/[0.025] px-4 py-2.5 text-xs text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/5 hover:text-white">
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-8 pb-8">
                  {messages.map(message => (
                    <motion.article key={message.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      {message.role === "assistant" && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200 ring-1 ring-cyan-300/15"><Bot className="h-4 w-4" /></div>
                      )}
                      <div className={`max-w-[min(720px,88%)] ${message.role === "user" ? "items-end" : "items-start"}`}>
                        <div className={`rounded-2xl px-4 py-3.5 text-sm leading-6 ${message.role === "user" ? "rounded-br-md bg-cyan-300 text-[#071014]" : "rounded-bl-md border border-white/8 bg-[#101d23] text-slate-200"}`}>
                          <p className="whitespace-pre-wrap">{message.content}</p>
                          {message.imageUrl && <img src={message.imageUrl} alt="Imagem gerada por Auren" className="mt-4 max-h-[440px] max-w-full rounded-xl border border-white/10 object-contain" />}
                          {message.sources && message.sources.length > 0 && (
                            <div className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-400">
                              <p className="mb-2 font-medium text-slate-300">Fontes</p>
                              <div className="flex flex-wrap gap-2">{message.sources.map((source, index) => <a key={source} href={source} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">Fonte {index + 1}</a>)}</div>
                            </div>
                          )}
                        </div>
                        <div className={`mt-1.5 flex items-center gap-2 text-[10px] text-slate-600 ${message.role === "user" ? "justify-end" : ""}`}>
                          <span>{message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {message.deepThinking && <span className="text-cyan-300/60">reflexão</span>}
                        </div>
                      </div>
                      {message.role === "user" && <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/8 text-slate-300"><User className="h-4 w-4" /></div>}
                    </motion.article>
                  ))}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200"><Bot className="h-4 w-4" /></div>
                      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/8 bg-[#101d23] px-4 py-3.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:240ms]" /></div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <div className="space-y-3">
                {voiceNotice && <div className="flex items-center gap-2 rounded-xl border border-cyan-300/15 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-200"><Activity className="h-3.5 w-3.5" /> {voiceNotice}</div>}
                {cleanupPreviewQuery.data && <div className="rounded-xl border border-amber-300/15 bg-amber-300/5 px-3 py-3 text-xs text-amber-100">Prévia: {cleanupPreviewQuery.data.targets.map(target => `${target.label}: ${target.files} arquivos (${formatBytes(target.bytes)})`).join(" · ")} · nada foi apagado.</div>}
                {bridgeStatusQuery.error && <div className="rounded-xl border border-rose-300/15 bg-rose-300/5 px-3 py-3 text-xs text-rose-200">Ponte: {bridgeStatusQuery.error.message}</div>}
                {bridgeStatusQuery.data && <div className="rounded-xl border border-emerald-300/15 bg-emerald-300/5 px-3 py-3 text-xs text-emerald-100">Ponte Windows: {bridgeStatusQuery.data.armed ? "armada" : "desarmada"} · raiz {bridgeStatusQuery.data.root}</div>}
                {systemSnapshotQuery.data && <div className="rounded-xl border border-white/8 bg-white/[0.025] px-3 py-3 text-xs text-slate-300">{systemSnapshotQuery.data.cpuModel} · {systemSnapshotQuery.data.logicalCores} núcleos · memória em {systemSnapshotQuery.data.memory.usedPercent}% · uptime {Math.round(systemSnapshotQuery.data.uptimeSeconds / 3600)}h</div>}
                {(screenshotQuery.error || screenWatchQuery.error) && <div className="rounded-xl border border-rose-300/15 bg-rose-300/5 px-3 py-3 text-xs text-rose-200">Tela: {(screenshotQuery.error || screenWatchQuery.error)?.message}</div>}
                {(screenshotQuery.data || screenWatchQuery.data) && <div className="rounded-2xl border border-violet-300/15 bg-violet-300/5 p-3"><div className="mb-2 flex items-center justify-between text-xs text-violet-100"><span>{screenWatchEnabled ? "Observação ativa · atualiza a cada 15s" : "Captura sob demanda"}</span><div className="flex items-center gap-3"><button type="button" onClick={() => void screenshotQuery.refetch()} className="text-violet-200 hover:text-white">Atualizar</button><button type="button" onClick={() => setScreenWatchEnabled(false)} className="text-slate-400 hover:text-white">Parar</button></div></div><img src={(screenWatchQuery.data || screenshotQuery.data)?.dataUrl} alt="Captura de tela autorizada" className="max-h-[420px] w-full rounded-xl border border-white/10 object-contain" /></div>}
              </div>
            </div>
          </main>

          <footer className="border-t border-white/8 bg-[#071014]/95 px-4 py-4 backdrop-blur-xl sm:px-8 sm:py-5">
            <div className="mx-auto max-w-4xl">
              <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-[#0d1a20] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] focus-within:border-cyan-300/35">
                <textarea
                  value={input}
                  onChange={event => setInput(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  rows={1}
                  placeholder="Fale com Auren... use /imagem para criar uma imagem"
                  className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
                />
                <button type="button" onClick={() => void toggleVoiceListening()} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${isListening ? "bg-rose-300 text-[#071014]" : "text-slate-400 hover:bg-white/8 hover:text-white"}`} title={isListening ? "Parar de ouvir" : "Falar com Auren"}>
                  {isListening ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
                </button>
                <button type="button" onClick={() => void handleSendMessage()} disabled={isLoading || !input.trim()} className="flex h-11 items-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-[#071014] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-35" title="Enviar">
                  <span className="hidden sm:inline">Enviar</span><Send className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setWakeWordEnabled(value => !value)} className={`flex items-center gap-1.5 transition ${wakeWordEnabled ? "text-cyan-200" : "hover:text-slate-300"}`}><Zap className="h-3.5 w-3.5" /> Auren {wakeWordEnabled ? "ligado" : "desligado"}</button>
                  <button type="button" onClick={() => setVoiceOutputEnabled(value => !value)} className={`flex items-center gap-1.5 transition ${voiceOutputEnabled ? "text-cyan-200" : "hover:text-slate-300"}`}>{voiceOutputEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />} Voz {voiceOutputEnabled ? "ligada" : "desligada"}</button>
                </div>
                <span>Enter envia · Shift+Enter quebra linha · dados locais</span>
              </div>
            </div>
          </footer>
        </section>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b171c] p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Configurar dispositivos</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">O navegador precisa de permissão para ouvir. A escuta contínua ainda é experimental.</p>
              </div>
              <button type="button" onClick={() => setShowSettings(false)} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <label className="mt-6 block text-xs font-medium text-slate-300" htmlFor="microphone-select">Microfone preferido</label>
            <div className="relative mt-2">
              <select id="microphone-select" value={selectedMicrophone} onChange={event => setSelectedMicrophone(event.target.value)} className="w-full appearance-none rounded-xl border border-white/10 bg-[#101f25] px-3 py-3 pr-10 text-sm text-slate-200 outline-none focus:border-cyan-300/40">
                <option value="">Microfone padrão do navegador</option>
                {microphones.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microfone ${index + 1}`}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-500" />
            </div>
            <button type="button" onClick={() => void requestMicrophone()} className="mt-3 w-full rounded-xl border border-white/10 px-3 py-3 text-sm text-slate-300 hover:bg-white/5">Permitir e atualizar microfones</button>
            <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-xs leading-5 text-amber-100/80">A lista e a preferência ficam no navegador. O reconhecimento Web Speech pode continuar usando o microfone padrão do Chrome; a seleção real por dispositivo será concluída no companion nativo do Windows.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JarvisUltraPremium;
