import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Streamdown } from "streamdown";
import {
  Activity,
  Bot,
  Check,
  ChevronDown,
  Clipboard,
  Cpu,
  FileSearch,
  Image as ImageIcon,
  Loader2,
  Menu,
  Mic,
  Mic2,
  Monitor,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
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

type ToolItemProps = {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  active?: boolean;
};

function normalizeWakeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ToolItem({ icon, label, description, onClick, active = false }: ToolItemProps) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${active ? "bg-cyan-300/10 text-cyan-100" : "text-slate-200 hover:bg-white/6"}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/6 text-cyan-200">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-0.5 block truncate text-[11px] text-slate-500">{description}</span>
      </span>
    </button>
  );
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
  const [screenWatchEnabled, setScreenWatchEnabled] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showTools, setShowTools] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState(() => {
    try {
      return localStorage.getItem("auren-microphone-id") || "";
    } catch {
      return "";
    }
  });
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    if (isLoading || systemStatus === "processing") return "Auren está pensando";
    if (systemStatus === "alert") return "Verifique a conexão";
    if (wakeWordEnabled) return "Aguardando a palavra Auren";
    return "Online e local";
  }, [isLoading, systemStatus, wakeWordEnabled]);

  const conversationTitle = messages[0]?.content?.slice(0, 32) || "Nova conversa";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem("auren-persona-mode", personaMode);
      localStorage.setItem("auren-microphone-id", selectedMicrophone);
    } catch {
      // Preferências opcionais.
    }
  }, [personaMode, selectedMicrophone]);

  useEffect(() => {
    if (!voiceOutputEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return;
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
      if (!selectedMicrophone && audioInputs[0]?.deviceId) setSelectedMicrophone(audioInputs[0].deviceId);
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

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(undefined);
    setInput("");
    setShowTools(false);
    setMobileMenuOpen(false);
  };

  const handleSendMessage = async (contentOverride?: string) => {
    const userContent = (contentOverride ?? input).trim();
    if (!userContent || isLoading) return;
    const startedAt = performance.now();
    setMessages(prev => [...prev, { id: `msg_${Date.now()}`, role: "user", content: userContent, timestamp: new Date() }]);
    setInput("");
    setIsLoading(true);
    setSystemStatus("processing");
    setShowTools(false);
    setVoiceNotice("");

    try {
      if (userContent.toLowerCase().startsWith("/imagem ")) {
        const result = await generateImageMutation.mutateAsync({
          prompt: userContent.slice("/imagem ".length).trim(),
          style: "cinematográfico, detalhado, original",
          conversationId,
        });
        setMessages(prev => [...prev, { id: `msg_${Date.now() + 1}`, role: "assistant", content: result.message, imageUrl: result.imageUrl, timestamp: new Date() }]);
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
      setMessages(prev => [...prev, { id: `msg_err_${Date.now()}`, role: "assistant", content: `Não consegui concluir esta solicitação. ${detail}`, timestamp: new Date() }]);
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
      setVoiceNotice("Ativação por palavra não está disponível neste navegador. Use o botão do microfone.");
      setWakeWordEnabled(false);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onstart = () => setVoiceNotice("Auren está em espera. Diga “Auren” e depois o comando.");
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results || []).slice(event.resultIndex || 0).map((result: any) => result?.[0]?.transcript || "").join(" ").trim();
      const normalized = normalizeWakeText(transcript);
      const wakeAlias = ["auren", "aurem"].find(alias => normalized.includes(alias));
      if (!wakeAlias) return;
      const command = transcript.slice(normalized.indexOf(wakeAlias) + wakeAlias.length).trim();
      if (!command) {
        setVoiceNotice("Nome reconhecido. Agora diga o que você precisa.");
        return;
      }
      setVoiceNotice(`Comando recebido: ${command}`);
      void handleSendMessage(command);
    };
    recognition.onerror = (event: any) => {
      if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
        setVoiceNotice("O navegador bloqueou o microfone. Autorize o endereço local.");
        setWakeWordEnabled(false);
      } else {
        setVoiceNotice("A escuta foi interrompida pelo navegador. Tente ativar novamente.");
      }
    };
    recognition.onend = () => {
      if (wakeWordEnabled) window.setTimeout(() => { try { recognition.start(); } catch { /* reinício já solicitado */ } }, 700);
    };
    wakeRecognitionRef.current = recognition;
    void requestMicrophone().then(allowed => {
      if (!allowed) {
        setWakeWordEnabled(false);
        return;
      }
      try { recognition.start(); } catch {
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
    if (!(await requestMicrophone())) return;
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceNotice("Reconhecimento de voz não disponível neste navegador.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { setIsListening(true); setVoiceNotice("Auren está ouvindo este comando..."); };
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setVoiceNotice(`Comando recebido: ${transcript}`);
        void handleSendMessage(transcript);
      }
    };
    recognition.onerror = () => { setVoiceNotice("Não consegui entender o áudio. Tente novamente."); setIsListening(false); };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); } catch { setVoiceNotice("Não foi possível iniciar o reconhecimento de voz."); }
  };

  const copyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageId(message.id);
      window.setTimeout(() => setCopiedMessageId(null), 1400);
    } catch {
      setVoiceNotice("Não foi possível copiar a resposta.");
    }
  };

  const chooseTool = (tool: "image" | "diagnostic" | "cleanup" | "screen") => {
    setShowTools(false);
    if (tool === "image") {
      setInput("/imagem ");
      return;
    }
    if (tool === "diagnostic") void systemSnapshotQuery.refetch();
    if (tool === "cleanup") void cleanupPreviewQuery.refetch();
    if (tool === "screen") void screenshotQuery.refetch();
  };

  const currentScreenshot = screenWatchQuery.data || screenshotQuery.data;

  return (
    <div className="min-h-screen bg-[#212121] text-[#ececec]">
      <div className="flex min-h-screen">
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 272, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="hidden shrink-0 overflow-hidden bg-[#171717] md:block">
              <div className="flex h-full min-h-screen w-[272px] flex-col px-3 py-3">
                <div className="flex items-center justify-between px-2 py-2">
                  <button type="button" onClick={() => setShowModelInfo(value => !value)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/6">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300 text-[#101818]"><Sparkles className="h-4 w-4" /></span>
                    <span className="text-[17px] font-semibold tracking-tight text-white">Auren</span>
                  </button>
                  <button type="button" onClick={() => setShowSidebar(false)} className="rounded-lg p-2 text-slate-500 hover:bg-white/6 hover:text-white" title="Recolher painel"><PanelLeftClose className="h-4 w-4" /></button>
                </div>

                <button type="button" onClick={handleNewConversation} className="mt-6 flex items-center gap-3 rounded-xl border border-white/8 px-3 py-3 text-sm font-medium text-slate-100 transition hover:bg-white/6"><Plus className="h-4 w-4" /> Nova conversa</button>

                <div className="mt-7 px-2 text-[11px] font-medium text-slate-500">Conversas</div>
                <div className="mt-2 rounded-xl bg-white/6 px-3 py-3 text-sm text-slate-200"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-cyan-200" /><span className="truncate">{conversationTitle}</span></div><p className="mt-1 pl-6 text-[11px] text-slate-500">agora</p></div>

                <div className="mt-8 px-2 text-[11px] font-medium text-slate-500">Ações rápidas</div>
                <div className="mt-2 space-y-1">
                  <button type="button" onClick={() => chooseTool("diagnostic")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/6"><Cpu className="h-4 w-4 text-slate-500" /> Diagnóstico do PC</button>
                  <button type="button" onClick={() => chooseTool("image")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/6"><ImageIcon className="h-4 w-4 text-slate-500" /> Criar imagem</button>
                  <button type="button" onClick={() => setShowSettings(true)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/6"><Settings2 className="h-4 w-4 text-slate-500" /> Configurações</button>
                </div>

                <div className="mt-auto rounded-xl border border-white/8 bg-white/[0.025] p-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> IA local</div>
                  <p className="mt-2 text-[11px] leading-5 text-slate-500">Memória e conversas ficam neste computador.</p>
                  {lastLatencyMs !== null && <p className="mt-2 text-[11px] text-slate-600">Última resposta: {(lastLatencyMs / 1000).toFixed(1)}s</p>}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/8 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              {!showSidebar && <button type="button" onClick={() => setShowSidebar(true)} className="hidden rounded-lg p-2 text-slate-400 hover:bg-white/6 hover:text-white md:block" title="Abrir conversas"><PanelLeftOpen className="h-4 w-4" /></button>}
              <button type="button" onClick={() => setMobileMenuOpen(value => !value)} className="rounded-lg p-2 text-slate-400 hover:bg-white/6 hover:text-white md:hidden"><Menu className="h-5 w-5" /></button>
              <button type="button" onClick={() => setShowModelInfo(value => !value)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-white hover:bg-white/6"><span>Auren</span><span className="text-slate-500">·</span><span className="text-slate-400">local rápido</span><ChevronDown className="h-3.5 w-3.5 text-slate-500" /></button>
            </div>
            <div className="flex items-center gap-1">
              <div className="hidden items-center gap-2 px-3 text-xs text-slate-500 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />{statusLabel}</div>
              <button type="button" onClick={() => setShowSettings(true)} className="rounded-lg p-2 text-slate-400 hover:bg-white/6 hover:text-white" title="Configurações"><Settings2 className="h-4 w-4" /></button>
              <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-white/6 hover:text-white" title="Mais opções"><MoreHorizontal className="h-4 w-4" /></button>
            </div>
          </header>

          {showModelInfo && <div className="absolute left-4 top-16 z-30 w-72 rounded-xl border border-white/10 bg-[#2a2a2a] p-4 shadow-2xl sm:left-72"><p className="text-sm font-medium text-white">Auren local rápido</p><p className="mt-2 text-xs leading-5 text-slate-400">Qwen2.5 1,5B rodando no Ollama. Sem chave, sem cobrança e sem enviar a conversa para a nuvem.</p><div className="mt-3 flex items-center gap-2 text-[11px] text-emerald-200"><ShieldCheck className="h-3.5 w-3.5" /> modo local ativo</div></div>}

          {mobileMenuOpen && <div className="absolute inset-x-3 top-16 z-30 rounded-xl border border-white/10 bg-[#171717] p-3 shadow-2xl md:hidden"><button type="button" onClick={handleNewConversation} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-white/6"><Plus className="h-4 w-4" /> Nova conversa</button><button type="button" onClick={() => { setShowSettings(true); setMobileMenuOpen(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm hover:bg-white/6"><Settings2 className="h-4 w-4" /> Configurações</button></div>}

          <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
            <div className="mx-auto w-full max-w-3xl">
              {messages.length === 0 ? (
                <div className="flex min-h-[calc(100vh-190px)] flex-col justify-center px-2 pb-8">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-[#101818]"><Sparkles className="h-6 w-6" /></div>
                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Como posso ajudar?</h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">Converse com o Auren em português. Ele funciona localmente, guarda apenas memórias declaradas e mostra claramente quando uma ferramenta precisa de autorização.</p>
                    <div className="mt-8 grid gap-2 sm:grid-cols-3">
                      {["O que você consegue fazer?", "Faça um diagnóstico do PC", "Me ajude a organizar meu dia"].map(prompt => <button key={prompt} type="button" onClick={() => void handleSendMessage(prompt)} className="rounded-xl border border-white/10 bg-[#2a2a2a] px-3 py-3 text-left text-xs text-slate-300 transition hover:border-cyan-300/30 hover:bg-[#303030] hover:text-white">{prompt}</button>)}
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-8 pb-8">
                  {messages.map(message => (
                    <motion.article key={message.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="group">
                      {message.role === "user" ? (
                        <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#303030] px-4 py-3 text-sm leading-6 text-white"><p className="whitespace-pre-wrap">{message.content}</p></div></div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-300/12 text-cyan-200"><Sparkles className="h-4 w-4" /></div>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="prose prose-invert max-w-none text-sm leading-7 text-slate-200"><Streamdown>{message.content}</Streamdown></div>
                            {message.imageUrl && <img src={message.imageUrl} alt="Imagem criada pelo Auren" className="mt-4 max-h-[480px] max-w-full rounded-2xl border border-white/10 object-contain" />}
                            {message.sources && message.sources.length > 0 && <div className="mt-4 flex flex-wrap gap-2 text-xs">{message.sources.map((source, index) => <a key={source} href={source} target="_blank" rel="noreferrer" className="text-cyan-300 hover:underline">Fonte {index + 1}</a>)}</div>}
                            <div className="mt-3 flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                              <button type="button" onClick={() => void copyMessage(message)} className="rounded-md p-1.5 text-slate-500 hover:bg-white/6 hover:text-white" title="Copiar resposta">{copiedMessageId === message.id ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Clipboard className="h-3.5 w-3.5" />}</button>
                              <button type="button" onClick={() => { setVoiceOutputEnabled(true); setVoiceNotice("Lendo a resposta em voz alta."); }} className="rounded-md p-1.5 text-slate-500 hover:bg-white/6 hover:text-white" title="Ler resposta"><Volume2 className="h-3.5 w-3.5" /></button>
                              {message.deepThinking && <span className="ml-2 text-[10px] text-slate-600">reflexão</span>}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.article>
                  ))}
                  {isLoading && <div className="flex gap-3"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-300/12 text-cyan-200"><Sparkles className="h-4 w-4" /></div><div className="flex items-center gap-1.5 pt-2"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 [animation-delay:240ms]" /></div></div>}
                  <div ref={messagesEndRef} />
                </div>
              )}

              <div className="space-y-3">
                {voiceNotice && <div className="flex items-center gap-2 rounded-lg border border-cyan-300/15 bg-cyan-300/5 px-3 py-2 text-xs text-cyan-200"><Activity className="h-3.5 w-3.5" />{voiceNotice}</div>}
                {cleanupPreviewQuery.data && <div className="rounded-lg border border-amber-300/15 bg-amber-300/5 px-3 py-3 text-xs text-amber-100">Prévia de limpeza: {cleanupPreviewQuery.data.targets.map(target => `${target.label}: ${target.files} arquivos (${formatBytes(target.bytes)})`).join(" · ")} · nada foi apagado.</div>}
                {bridgeStatusQuery.error && <div className="rounded-lg border border-rose-300/15 bg-rose-300/5 px-3 py-3 text-xs text-rose-200">Ponte: {bridgeStatusQuery.error.message}</div>}
                {bridgeStatusQuery.data && <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/5 px-3 py-3 text-xs text-emerald-100">Ponte Windows: {bridgeStatusQuery.data.armed ? "armada" : "desarmada"} · raiz {bridgeStatusQuery.data.root}</div>}
                {systemSnapshotQuery.data && <div className="rounded-lg border border-white/8 bg-white/[0.025] px-3 py-3 text-xs text-slate-300">{systemSnapshotQuery.data.cpuModel} · {systemSnapshotQuery.data.logicalCores} núcleos · memória em {systemSnapshotQuery.data.memory.usedPercent}% · uptime {Math.round(systemSnapshotQuery.data.uptimeSeconds / 3600)}h</div>}
                {(screenshotQuery.error || screenWatchQuery.error) && <div className="rounded-lg border border-rose-300/15 bg-rose-300/5 px-3 py-3 text-xs text-rose-200">Tela: {(screenshotQuery.error || screenWatchQuery.error)?.message}</div>}
                {currentScreenshot && <div className="rounded-2xl border border-violet-300/15 bg-violet-300/5 p-3"><div className="mb-2 flex items-center justify-between text-xs text-violet-100"><span>{screenWatchEnabled ? "Observação ativa · atualiza a cada 15s" : "Captura autorizada"}</span><div className="flex items-center gap-3"><button type="button" onClick={() => void screenshotQuery.refetch()} className="text-violet-200 hover:text-white">Atualizar</button><button type="button" onClick={() => setScreenWatchEnabled(false)} className="text-slate-400 hover:text-white">Parar</button></div></div><img src={currentScreenshot.dataUrl} alt="Captura de tela autorizada" className="max-h-[420px] w-full rounded-xl border border-white/10 object-contain" /></div>}
              </div>
            </div>
          </main>

          <footer className="shrink-0 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
            <div className="mx-auto max-w-3xl">
              <div className="relative">
                <AnimatePresence>
                  {showTools && <motion.div initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.98 }} className="absolute bottom-16 left-0 z-20 w-[min(360px,calc(100vw-32px))] rounded-2xl border border-white/10 bg-[#2a2a2a] p-2 shadow-2xl">
                    <ToolItem icon={<ImageIcon className="h-4 w-4" />} label="Criar imagem" description="Geração local ou módulo disponível" onClick={() => chooseTool("image")} />
                    <ToolItem icon={<Cpu className="h-4 w-4" />} label="Diagnóstico do computador" description="Consulta somente leitura" onClick={() => chooseTool("diagnostic")} />
                    <ToolItem icon={<FileSearch className="h-4 w-4" />} label="Prévia de limpeza" description="Conta temporários sem apagar" onClick={() => { setShowTools(false); void cleanupPreviewQuery.refetch(); }} />
                    <ToolItem icon={<Monitor className="h-4 w-4" />} label="Capturar tela" description="Uma captura autorizada agora" onClick={() => chooseTool("screen")} />
                    <ToolItem icon={<Activity className="h-4 w-4" />} label="Observar tela" description={screenWatchEnabled ? "Ativo · atualiza a cada 15 segundos" : "Desligado por padrão"} active={screenWatchEnabled} onClick={() => { setScreenWatchEnabled(value => !value); setShowTools(false); }} />
                    <div className="my-1 border-t border-white/8" />
                    <ToolItem icon={<Zap className="h-4 w-4" />} label={deepThinkingEnabled ? "Reflexão ligada" : "Resposta rápida"} description={deepThinkingEnabled ? "Mais análise, mais demora" : "Menor latência no modelo local"} active={deepThinkingEnabled} onClick={() => { setDeepThinkingEnabled(value => !value); setShowTools(false); }} />
                  </motion.div>}
                </AnimatePresence>
                <div className="flex items-end gap-2 rounded-2xl border border-white/12 bg-[#2f2f2f] px-3 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.16)] focus-within:border-white/25">
                  <button type="button" onClick={() => setShowTools(value => !value)} className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${showTools ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/8 hover:text-white"}`} title="Ferramentas"><Plus className={`h-5 w-5 transition-transform ${showTools ? "rotate-45" : ""}`} /></button>
                  <textarea value={input} onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSendMessage(); } }} rows={1} placeholder="Mensagem para Auren" className="max-h-36 min-h-[36px] flex-1 resize-none bg-transparent px-1 py-2 text-sm leading-5 text-white outline-none placeholder:text-slate-500" />
                  <button type="button" onClick={() => void toggleVoiceListening()} className={`mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${isListening ? "bg-rose-300 text-[#101010]" : "text-slate-400 hover:bg-white/8 hover:text-white"}`} title={isListening ? "Parar de ouvir" : "Falar com Auren"}>{isListening ? <Square className="h-4 w-4 fill-current" /> : <Mic2 className="h-5 w-5" />}</button>
                  <button type="button" onClick={() => void handleSendMessage()} disabled={isLoading || !input.trim()} className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#202020] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-30" title="Enviar">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
                </div>
                <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-slate-600"><button type="button" onClick={() => setWakeWordEnabled(value => !value)} className={`transition hover:text-slate-300 ${wakeWordEnabled ? "text-cyan-200" : ""}`}>Auren {wakeWordEnabled ? "ligado" : "desligado"}</button><span>·</span><button type="button" onClick={() => setVoiceOutputEnabled(value => !value)} className={`flex items-center gap-1 transition hover:text-slate-300 ${voiceOutputEnabled ? "text-cyan-200" : ""}`}>{voiceOutputEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />} voz {voiceOutputEnabled ? "ligada" : "desligada"}</button><span>·</span><span>Auren pode cometer erros</span></div>
              </div>
            </div>
          </footer>
        </section>
      </div>

      {showSettings && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#2a2a2a] p-5 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-base font-semibold text-white">Configurações do Auren</h2><p className="mt-1 text-xs leading-5 text-slate-500">Preferências locais de voz e personalidade.</p></div><button type="button" onClick={() => setShowSettings(false)} className="rounded-lg p-2 text-slate-500 hover:bg-white/6 hover:text-white"><X className="h-4 w-4" /></button></div><div className="mt-6"><label htmlFor="microphone-select" className="text-xs font-medium text-slate-300">Microfone</label><div className="relative mt-2"><select id="microphone-select" value={selectedMicrophone} onChange={event => setSelectedMicrophone(event.target.value)} className="w-full appearance-none rounded-xl border border-white/10 bg-[#202020] px-3 py-3 pr-9 text-sm text-slate-200 outline-none focus:border-cyan-300/40"><option value="">Microfone padrão do navegador</option>{microphones.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Microfone ${index + 1}`}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-500" /></div><button type="button" onClick={() => void requestMicrophone()} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-slate-300 hover:bg-white/6"><Mic className="h-3.5 w-3.5" /> Permitir e atualizar lista</button></div><div className="mt-6"><p className="text-xs font-medium text-slate-300">Personalidade</p><div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={() => setPersonaMode("strategic")} className={`rounded-xl border px-3 py-2.5 text-xs ${personaMode === "strategic" ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-slate-400 hover:bg-white/6"}`}>Estratégico</button><button type="button" onClick={() => setPersonaMode("companion")} className={`rounded-xl border px-3 py-2.5 text-xs ${personaMode === "companion" ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/10 text-slate-400 hover:bg-white/6"}`}>Companheiro</button></div></div><div className="mt-6 rounded-xl border border-amber-300/15 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100/75">A palavra “Auren” no navegador é experimental e depende da aba permanecer aberta. O companion nativo será responsável pela escuta local contínua no futuro.</div></div></div>}
    </div>
  );
}

export default JarvisUltraPremium;
