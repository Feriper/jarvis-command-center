# Auren — IA local gratuita

O **Auren** é um assistente digital local-first criado para funcionar sem cobrança por mensagem. O caminho padrão usa o [Ollama para Windows](https://ollama.com/download/windows) e um modelo pequeno executado no próprio computador. Não é necessário cartão, assinatura ou chave da OpenAI para conversar com o Auren.

A experiência de “ser próprio” vem da identidade Auren, dos modos Estratégico e Companheiro, da memória local controlada e da presença contínua do aplicativo. Isso é uma experiência de software com persona e estado persistente; o projeto não afirma consciência, vida ou sentimentos reais.

## O que funciona no núcleo

O chat roda em `127.0.0.1`, sem OAuth ou MySQL quando o modo local está ativo. Conversas recentes, mensagens dentro do limite e memórias explicitamente declaradas ficam em JSON local. Dados grandes, imagens e vídeos não são acumulados no estado principal.

O Auren oferece diagnóstico somente leitura, prévia de temporários, voz por comando no navegador, síntese de fala quando o navegador suporta, integração opcional com a ponte Windows e geração de imagem quando um provedor de imagem compatível estiver configurado. O companion nativo da bandeja está em fase inicial: mostra estados, pausa e encerramento, mas ainda não abre o microfone.

## Requisitos

| Componente | Finalidade | Link |
|---|---|---|
| Windows 10 ou superior | Sistema operacional alvo do Ollama | [Requisitos do Ollama](https://ollama.com/download/windows) |
| Node.js 20 ou superior | Servidor web local | [nodejs.org](https://nodejs.org/en/download) |
| pnpm | Gerenciador de dependências | `npm install --global pnpm` |
| Ollama | Servidor de IA local gratuito | [ollama.com/download/windows](https://ollama.com/download/windows) |
| .NET 8 SDK | Testar o companion da bandeja | [.NET 8](https://dotnet.microsoft.com/download/dotnet/8.0) |

O Ryzen 5 3400G com 16 GB de RAM deve conseguir executar o servidor e um modelo local pequeno, mas a velocidade depende do Windows, do armazenamento e da quantidade de contexto. O modo rápido usa o Qwen2.5 de 1,5B, com aproximadamente 986 MB conforme a página da biblioteca do Ollama [1]. O modelo de 3B pode ser usado quando você preferir mais qualidade em troca de latência. Geração local pesada de vídeo não é um objetivo adequado para essa máquina.

## Instalação sem chave paga

Abra o PowerShell e execute:

```powershell
cd $HOME\Desktop
git clone https://github.com/Feriper/jarvis-command-center.git
cd jarvis-command-center
Copy-Item .env.example .env
```

Instale o Ollama pelo [download oficial para Windows](https://ollama.com/download/windows). Depois confirme que ele está funcionando e baixe o modelo uma vez:

```powershell
ollama pull qwen2.5:1.5b
```

A página oficial do modelo disponibiliza o comando `ollama run qwen2.5:1.5b` e informa suporte multilíngue, incluindo português [1]. O servidor compatível com a API OpenAI fica normalmente em `http://127.0.0.1:11434/v1` [2].

Não preencha `OPENAI_API_KEY`. O arquivo `.env.example` já configura:

```env
AUREN_LLM_PROVIDER=local
AUREN_LOCAL_LLM=true
AUREN_LOCAL_LLM_BASE=http://127.0.0.1:11434/v1
AUREN_LOCAL_LLM_KEY=ollama
AUREN_LOCAL_LLM_MODEL=qwen2.5:1.5b
```

Inicie o Auren:

```powershell
pnpm install
pnpm dev
```

Abra `http://127.0.0.1:3000`. O servidor local não precisa enviar suas conversas para um provedor remoto.

## Inicializador automático

Depois da primeira instalação, o caminho mais simples é executar [`Iniciar-Jarvis-Windows.bat`](./Iniciar-Jarvis-Windows.bat). Apesar do nome histórico do arquivo, ele inicia o **Auren**, verifica Node.js, pnpm e Ollama, baixa `qwen2.5:1.5b` somente se ainda não estiver instalado, configura o modo local e inicia o servidor.

Para atualizar sem baixar arquivo por arquivo, execute [`Atualizar-e-Iniciar-Auren.bat`](./Atualizar-e-Iniciar-Auren.bat). Ele usa `git pull --ff-only` apenas em um clone limpo e não sobrescreve alterações locais.

## Capacidades e limites atuais

| Capacidade | Estado |
|---|---|
| Chat local sem custo por mensagem | Ativo com Ollama |
| Persona Auren e modos Estratégico/Companheiro | Ativo |
| Memória explícita local | Ativo, com limites de retenção |
| Fala e síntese no navegador | Ativo quando o navegador oferece Web Speech |
| Palavra “Auren” no navegador | Experimental; não é escuta nativa 24 horas |
| Diagnóstico do PC | Ativo, somente leitura |
| Prévia de limpeza | Ativo, conta temporários e não apaga nada |
| Ponte Windows | Backend pronto, exige token local e ARMAR AÇÕES |
| Imagem | Depende de provedor de imagem; não é garantida pelo Ollama de texto |
| Vídeo | Ainda não implementado no núcleo |
| Companion de bandeja | Esqueleto nativo; sem microfone nesta versão |
| Atualizador nativo assinado | Planejado; o `.bat` é o caminho provisório |
| Jogar jogos pelo usuário | Não implementado; futuro módulo restrito e específico |

## Ponte Windows

A ponte é opcional e deve ser iniciada separadamente. O token temporário fica apenas no `.env` local. Consultas de arquivos, janelas e controles são protegidas; mouse, teclado e outras entradas exigem a ponte armada, `confirmed: true`, registro da ação e um kill switch disponível.

O Auren não transforma texto gerado pelo modelo em PowerShell livre. Limpeza, registro do Windows, desligamento e exclusão de pastas pessoais não fazem parte do núcleo seguro.

## Dados locais

| Informação | Local padrão | Retenção |
|---|---|---|
| Usuário, memória e conversas | `%LOCALAPPDATA%\Auren\data\jarvis-state.json` | Limites definidos no `.env` |
| Log do companion | `%LOCALAPPDATA%\Auren\companion\companion.log` | Eventos sem áudio bruto |
| Modelos do Ollama | Diretório gerenciado pelo Ollama | Controlado pelo Ollama |
| Chaves e tokens | `.env` local ou armazenamento protegido futuro | Nunca commitar |

## Companion nativo

O código inicial está em [`desktop-companion`](./desktop-companion). Para testar no Windows com o .NET 8 SDK:

```powershell
cd desktop-companion
dotnet run -c Release
```

O companion inicia em `OFF`. O estado `WAITING FOR AUREN` nesta versão é somente visual; não significa que o microfone esteja ligado. A arquitetura completa, inclusive VAD, wake word, STT, TTS, pareamento e updater assinado, está em [`docs/AUREN-NATIVE-COMPANION.md`](./docs/AUREN-NATIVE-COMPANION.md).

## Desenvolvimento

```powershell
pnpm check
pnpm build
```

`pnpm check` valida o núcleo executável. `pnpm check:legacy` diagnostica módulos antigos que não participam do arranque principal.

## Referências

[1] [Ollama — qwen2.5:1.5b](https://ollama.com/library/qwen2.5:1.5b): comando de execução, tamanho aproximado, parâmetros e suporte multilíngue.

[2] [Ollama — OpenAI compatibility](https://docs.ollama.com/api/openai-compatibility): endpoint local `/v1`, chave fictícia `ollama` e compatibilidade com `/v1/chat/completions`.

[3] [Ollama — Download para Windows](https://ollama.com/download/windows): instalação oficial para Windows 10 ou superior.
