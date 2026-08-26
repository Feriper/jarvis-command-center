# Auditoria do Auren — estado real e lacunas

Data: 2026-08-26

## Conclusão executiva

O Auren já possui um núcleo local-first funcional, mas ainda não é um assistente Windows completo. O chat local, a memória explícita, a persona, o diagnóstico somente leitura, a prévia de limpeza, a captura autorizada de tela e a ponte básica existem no código ativo. As maiores lacunas são a camada nativa de voz, a automação Windows estruturada, os módulos de imagem/vídeo, o updater assinado e os adaptadores específicos para jogos.

O caminho sem custo é manter Ollama como padrão. Serviços online “gratuitos” normalmente exigem conta, token e respeitam cota; eles não devem ser tratados como ilimitados nem como fallback silencioso.

## Inventário por capacidade

| Capacidade | Estado | O que existe hoje | O que falta |
|---|---|---|---|
| Chat local | Funciona | Ollama via endpoint local compatível com OpenAI; Qwen2.5 1,5B como modo rápido e 3B opcional | Benchmark no PC do usuário, streaming e seleção de modelo pela interface |
| Persona | Funciona | Modos Estratégico e Companheiro, identidade Auren e regras de honestidade | Persistência de preferências além do navegador e testes de comportamento |
| Memória | Funciona | JSON local, escrita atômica, retenção e extração apenas de declarações explícitas | Tela para consultar/apagar memórias e criptografia opcional em repouso |
| Voz de entrada | Parcial | Push-to-talk com Web Speech API e seleção de microfone no navegador | STT realmente local, independente da aba, com cancelamento, VAD e diagnóstico de dispositivo |
| Palavra “Auren” | Parcial/experimental | Reconhecimento contínuo do navegador enquanto a página permanece aberta | Worker nativo, VAD, modelo de wake word testado em português, limiar calibrado e tray indicator |
| Voz de saída | Parcial | speechSynthesis do navegador, quando o browser oferece voz PT-BR | Piper/OHF-Voice ou outro engine local instalado, fila, interrupção e voz neutra consistente |
| Diagnóstico do PC | Funciona, somente leitura | OS, CPU, núcleos, RAM, uptime, modo local, diretório de dados e temporários | Temperaturas, discos, rede, processos e histórico, todos ainda somente leitura |
| Limpeza | Prévia | Conta arquivos/bytes em temporários allowlisted sem apagar | Dry-run com intenção, confirmação específica, logs, retenção, fallback user-only e possível ponto de restauração |
| Ponte Windows | Parcial | Status, arquivos, janelas, controles UIA, mouse, teclado e screenshot; token fica no servidor | Pareamento com nonce, expiração/revogação, foco seguro, confirmação visual, auditoria e executor UI Automation nativo |
| Controle completo do Windows | Não existe | Há poucas operações de entrada protegidas por `confirmed: true` e ponte armada | Allowlist de intenções, preview, reversão, kill switch e adaptação por aplicativo; não é seguro usar shell/PowerShell livre |
| Tela | Parcial | Captura sob demanda e observação visível a cada 15 segundos | Windows.Graphics.Capture nativo, seleção de janela, OCR/visão local e política de exclusão de senhas |
| Imagem | Não funciona sem módulo/provedor | Adapter remoto opcional; mensagem honesta quando não há provedor | ComfyUI/local diffusion opcional ou token Hugging Face; fila, armazenamento e controle de memória |
| Vídeo | Não implementado | Nenhum gerador ativo no Auren | Serviço com créditos/cota ou máquina com GPU; geração local não é realista no Ryzen 5 3400G sem GPU dedicada |
| Atualização | Interino | `git pull --ff-only` no `.bat`, sem sobrescrever mudanças locais | Aplicativo empacotado, releases, assinatura, chave privada protegida, rollback e updater automático |
| Jogos | Não implementado | Nenhum adapter de jogo | Plugin por jogo, captura/visão, input controlado, acessibilidade/single-player e proibição de anti-cheat bypass |
| Pesquisa web | Parcial | O agente pode responder com o que recebe no prompt; não existe navegador/pesquisa geral local integrada em todas as rotas | Search provider opcional, citações, cache e indicador de fonte; serviços gratuitos têm limites |
| Contas e credenciais | Seguro no núcleo local | Local mode usa usuário local; não exige e-mail/senha para chat | Remover/evitar gate client-side por senha; credenciais externas devem ser manuais, locais e nunca versionadas |

## O que foi confirmado no código ativo

O backend ativo usa `server/_core/llm.ts` para resolver `local`, `forge` ou `openai`. Em modo local, o endpoint padrão é o Ollama em `127.0.0.1:11434/v1`; os provedores remotos não são necessários. A rota local possui `aiStatus`, `getSnapshot`, `cleanupPreview`, `bridgeStatus`, `files`, `windows`, `controls`, `screenshot` e operações de entrada com confirmação.

Há vários arquivos antigos no repositório, incluindo módulos com nomes como áudio, autonomia, imagem e auto-cura. A presença de um arquivo legado não prova que a funcionalidade está conectada ao `appRouter` ativo. O teste de referência atual passou com 14 testes, mas isso não equivale a um teste real de microfone, ponte Windows, geração de imagem ou controle de jogo.

## Lacunas prioritárias

### Prioridade 0 — confiabilidade local

O próximo teste necessário é no computador do usuário: health-check deve mostrar Ollama alcançável e `qwen2.5:1.5b` pronto. Se a resposta continuar lenta, medir carregamento inicial, tempo até primeiro token e tempo total. O Auren precisa informar “modelo ausente/Ollama offline” antes de simular uma falha de conversa.

### Prioridade 1 — companion de voz local

Implementar no companion Windows um estado explícito `OFF`, `WAITING`, `LISTENING`, `PROCESSING` e `PAUSED`; seleção de microfone real; VAD; captura curta somente depois da palavra; transcrição local com whisper.cpp; TTS local; log sem áudio bruto; botão de pausa e parada de emergência. O suporte atual do openWakeWord é principalmente inglês nos modelos pré-treinados, portanto “Auren” em português precisará de modelo/estratégia testada, não apenas uma troca de texto.

### Prioridade 2 — automação segura

Portar a leitura de UI Automation e a captura para um processo nativo, criar catálogo de intenções allowlisted e exigir preview/confirm. Exemplos iniciais: abrir aplicativo conhecido, focar janela conhecida, digitar em campo selecionado e fechar somente a janela pedida. Exclusão de arquivos, instalação, registro do Windows, comandos administrativos e envio externo devem ter confirmação adicional e logs.

### Prioridade 3 — multimídia gratuita realista

Chat e voz local são viáveis. Para imagem, ComfyUI local é uma alternativa gratuita, mas exige modelos e pode ser lento sem GPU; Hugging Face Inference Providers oferece cota gratuita, mas exige token. Para vídeo, não há caminho local leve confirmado no hardware do usuário; o adaptador deve permanecer opcional e declarar cota/crédito/watermark quando aplicável.

### Prioridade 4 — distribuição

O atualizador Git é prático, mas não é um instalador autoatualizável. Para isso, ainda faltam Tauri/MSIX, releases, assinatura, chave pública no aplicativo, chave privada sob controle do usuário, endpoint HTTPS e rollback. A assinatura não pode ser desativada com segurança.

## Credenciais

O Auren local não precisa do e-mail ou da senha enviados na conversa. A senha não foi salva, não foi colocada no repositório e não deve ser reutilizada. Como ela foi exposta, o usuário deve trocá-la imediatamente. Se quiser apenas identificar o usuário local, use `JARVIS_LOCAL_USER_EMAIL` no `.env`, sem senha. Um e-mail não deve ser transformado em senha fixa no frontend.

## Fontes oficiais pesquisadas

[1] Ollama — API compatível com OpenAI: https://docs.ollama.com/api/openai-compatibility

[2] Ollama — Qwen2.5 1.5B: https://ollama.com/library/qwen2.5:1.5b

[3] Google AI — preços da Gemini API e camada sem custo: https://ai.google.dev/gemini-api/docs/pricing

[4] Hugging Face — Inference Providers e cota gratuita: https://huggingface.co/docs/inference-providers/en/index

[5] whisper.cpp — CPU-only, VAD e Windows: https://github.com/ggml-org/whisper.cpp

[6] openWakeWord — VAD, limiares e suporte linguístico: https://github.com/dscripka/openWakeWord

[7] Piper — síntese local e migração do repositório: https://github.com/rhasspy/piper

[8] ComfyUI — geração local no Windows e Comfy Cloud: https://docs.comfy.org/get_started/first_generation

[9] Microsoft UI Automation: https://learn.microsoft.com/en-us/windows/win32/winauto/entry-uiauto-win32

[10] Windows screen capture: https://learn.microsoft.com/en-us/windows/apps/develop/media-authoring-processing/screen-capture

[11] Tauri updater e assinatura obrigatória: https://v2.tauri.app/plugin/updater/
