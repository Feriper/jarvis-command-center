import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

interface UseVoiceChatOptions {
  conversationId?: number;
  language?: string;
}

export function useVoiceChat(options: UseVoiceChatOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const synthesizeVoiceMutation = trpc.audio.synthesizeVoice.useMutation();
  const transcribeAudioMutation = trpc.audio.transcribeAudio.useMutation();
  const analyzeVoiceSentimentMutation =
    trpc.audio.analyzeVoiceSentiment.useMutation();

  // Iniciar gravação de áudio
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await handleAudioRecorded(audioBlob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
    } catch (error) {
      console.error("Erro ao acessar microfone:", error);
    }
  }, []);

  // Parar gravação de áudio
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      setIsListening(false);
    }
  }, []);

  // Processar áudio gravado
  const handleAudioRecorded = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Converter blob para base64 para enviar ao servidor
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // Transcrever áudio
        const transcriptionResult = await transcribeAudioMutation.mutateAsync({
          audioUrl: base64Audio,
          language: options.language || "pt-BR",
          conversationId: options.conversationId,
        });

        if (transcriptionResult.transcription) {
          setTranscript(transcriptionResult.transcription.text);

          // Analisar sentimento da voz
          await analyzeVoiceSentimentMutation.mutateAsync({
            audioUrl: base64Audio,
            conversationId: options.conversationId,
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Erro ao processar áudio:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Sintetizar voz (texto para áudio)
  const speak = useCallback(
    async (text: string, tone: "professional" | "friendly" = "professional") => {
      try {
        const result = await synthesizeVoiceMutation.mutateAsync({
          text,
          tone,
          conversationId: options.conversationId,
        });

        if (result.audio) {
          setAudioUrl(result.audio.url);

          // Reproduzir áudio automaticamente
          const audio = new Audio(result.audio.url);
          audio.play().catch((err) =>
            console.error("Erro ao reproduzir áudio:", err)
          );
        }
      } catch (error) {
        console.error("Erro ao sintetizar voz:", error);
      }
    },
    [options.conversationId, synthesizeVoiceMutation]
  );

  // Reproduzir áudio
  const playAudio = useCallback((url: string) => {
    const audio = new Audio(url);
    audio.play().catch((err) => console.error("Erro ao reproduzir áudio:", err));
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    audioUrl,
    startListening,
    stopListening,
    speak,
    playAudio,
    setTranscript,
  };
}
