# Pesquisa de provedores gratuitos do Auren

Data: 2026-08-26

## Objetivo

Identificar caminhos sem cobrança por mensagem para chat, voz, imagem, vídeo, pesquisa e automação. O padrão do Auren continua sendo execução local; serviços externos gratuitos são apenas alternativas opcionais, sujeitos a conta, limites e mudanças de política.

## Conversa e raciocínio

### Ollama local

Fonte: https://ollama.com/library/qwen2.5:1.5b

O Qwen2.5 1.5B está disponível para execução local no Ollama, tem aproximadamente 986 MB na página da biblioteca e oferece suporte multilíngue, incluindo português. É o modo rápido indicado para o Ryzen 5 3400G com 16 GB de RAM. O Qwen2.5 3B continua como alternativa local de maior qualidade e maior latência.

### Google Gemini Developer API

Fonte: https://ai.google.dev/gemini-api/docs/pricing

A documentação oficial mostra uma categoria “Sem custo financeiro” para desenvolvedores e pequenos projetos, com acesso limitado a alguns modelos, tokens de entrada e saída sem custo e acesso ao Google AI Studio. A mesma página diferencia o modo pago, portanto a integração precisa respeitar limites e não pode ativar cobrança automaticamente.

## Regras de decisão

1. Ollama local é o padrão e não exige conta, chave ou cobrança.
2. Um provedor externo só pode ser habilitado explicitamente pelo usuário, usando uma chave local em `.env`, nunca no frontend ou no GitHub.
3. O Auren deve mostrar qual provedor está ativo e falhar de forma clara quando a cota gratuita terminar.
4. Nenhum fallback pode trocar silenciosamente para um provedor pago.

## Fontes

[1] Ollama — Qwen2.5 1.5B: https://ollama.com/library/qwen2.5:1.5b
[2] Google AI for Developers — preços da Gemini API: https://ai.google.dev/gemini-api/docs/pricing

## Voz local

### Transcrição e VAD

Fonte: https://github.com/ggml-org/whisper.cpp

whisper.cpp documenta inferência somente em CPU e VAD com modelo Silero, incluindo comandos para Windows. É um caminho viável para transcrição local no Ryzen, mas ainda precisa de benchmark real no computador do usuário para escolher o modelo e o tamanho de áudio.

### Wake word

Fonte: https://github.com/dscripka/openWakeWord

openWakeWord é open source e inclui modelos pré-treinados, VAD e ajuste de limiar. A própria documentação informa que o suporte de supressão Speex está atualmente focado em Linux x86/Arm64 e que os modelos pré-treinados são principalmente em inglês. Portanto, não é correto prometer que ele reconhecerá “Auren” em português imediatamente. O caminho seguro é um adaptador local com teste de limiar, VAD, indicador visível e fallback para push-to-talk.

### Síntese de voz

Fonte: https://github.com/rhasspy/piper

Piper é um sistema neural local rápido de texto para fala, mas o repositório original foi arquivado e aponta o desenvolvimento para OHF-Voice/piper1-gpl. Existem amostras em português, porém a disponibilidade e a qualidade de voz brasileira precisam ser testadas antes de empacotar um modelo. A síntese deve usar voz genérica neutra e nunca clonar voz de pessoa real.

## Fontes

[3] whisper.cpp: https://github.com/ggml-org/whisper.cpp
[4] openWakeWord: https://github.com/dscripka/openWakeWord
[5] Piper: https://github.com/rhasspy/piper

## Imagem e vídeo

### ComfyUI local

Fonte: https://docs.comfy.org/get_started/first_generation

A documentação oficial oferece instalação local para Windows e modelos baixados separadamente. Isso é gratuito após o download, porém exige modelos e armazenamento local. No PC do usuário, sem GPU dedicada conhecida, deve ser tratado como módulo opcional e possivelmente lento; não deve ser instalado silenciosamente pelo inicializador.

A própria documentação também apresenta o Comfy Cloud com 400 créditos gratuitos mensais, mas isso exige conta e é uma cota externa, não geração local ilimitada. Não será usado como requisito do Auren.

### Hugging Face Inference Providers

Fonte: https://huggingface.co/docs/inference-providers/en/index

A documentação informa uma camada gratuita e suporte a centenas de modelos, inclusive geração de imagem e vídeo, mas exige um token Hugging Face e os provedores podem variar em formato e disponibilidade. Isso é uma alternativa opcional com cota, não uma base sem conta. O token deve ficar apenas no `.env` local e nunca ser embutido no frontend ou no GitHub.

### Vídeo

Não foi encontrada uma rota local leve e realista para geração de vídeo no hardware do usuário. Modelos atuais de vídeo local normalmente exigem GPU e muita memória. Plataformas online gratuitas tendem a ser créditos promocionais ou cotas limitadas. O Auren deve oferecer um adaptador opcional quando houver credencial/cota explícita, mas não fingir que vídeo local gratuito ilimitado já está implementado.

### LocalAI

Fonte: https://localai.io/

LocalAI se apresenta como engine open source para texto, visão, voz, imagem e outras funções, incluindo CPU-only para transcrição, diarização e síntese. É uma alternativa possível para unificar módulos locais, mas acrescenta complexidade e downloads de modelos; não será colocado no caminho padrão enquanto Ollama + companion leve forem suficientes.

## Resumo de decisão

| Módulo | Padrão sem custo | Alternativa opcional | Limite real |
|---|---|---|---|
| Chat | Ollama + Qwen2.5 local | Gemini Free / Hugging Face com token | Cotas externas ou desempenho local |
| STT | whisper.cpp local | navegador Web Speech | Benchmark e modelo precisam ser escolhidos |
| Wake word | adaptador local com VAD | openWakeWord, com testes | suporte pré-treinado principalmente em inglês |
| TTS | Piper/OHF-Voice ou Windows local | outro engine local | voz PT-BR precisa ser validada |
| Imagem | ComfyUI local opcional | Hugging Face/Comfy Cloud | modelos, RAM/CPU e cota |
| Vídeo | não recomendado localmente | créditos/cota de serviço externo | sem geração ilimitada gratuita confirmada |
| PC/Windows | ponte local + allowlist | nenhum provedor externo | confirmação, logs e kill switch |
