# Jarvis Command Center

O **Jarvis Command Center** é um assistente de IA local-first para Windows. A interface roda no navegador local, o backend mantém as chaves de provedor somente no servidor e as informações importantes são salvas em um arquivo local controlado. O projeto não é a mesma sessão do Manus: ele é uma aplicação independente que usa o provedor de IA configurado pelo usuário.

## O que funciona no núcleo local

O arranque principal abre o chat Jarvis em `/`. Em modo local, o servidor autentica automaticamente apenas requisições de loopback (`127.0.0.1`, `localhost` ou `::1`), sem exigir OAuth ou MySQL. Conversas recentes, mensagens dentro do limite e memórias importantes ficam em `jarvis-state.json`. O histórico é limitado para não crescer indefinidamente e arquivos grandes não são copiados para esse estado.

O backend aceita o Forge/Manus quando `BUILT_IN_FORGE_API_KEY` está configurada. Para rodar no seu PC, também aceita qualquer provedor OpenAI-compatible: OpenAI, um endpoint local como Ollama ou outro serviço compatível. A chave fica no `.env` do servidor e nunca deve ser colocada em código do frontend. A procedure de geração de imagem usa o helper real do provedor quando uma credencial de imagem está configurada; ela não devolve mais um placeholder.

A identidade do assistente é **Auren**. O modo Estratégico prioriza análise e planos; o modo Companheiro usa uma conversa mais próxima. O botão `FALAR` usa a API de reconhecimento disponível no navegador para um comando por vez, e `VOZ ON` usa a síntese de fala do navegador em pt-BR. O botão `AUREN ON` é uma escuta experimental pela palavra-chave no navegador; ele não é ainda um detector nativo local 24 horas. Para escuta contínua privada e mais confiável, o próximo módulo será um worker Windows com VAD e Whisper local.

## Requisitos do Windows

O projeto foi preparado para funcionar com Node.js 20 ou superior, pnpm e conexão com internet quando a IA estiver em um provedor online. Um Ryzen 5 3400G com 16 GB de RAM é suficiente para executar a aplicação; o modelo de IA não precisa ser carregado na memória local quando você usa uma API online.

## Primeira execução

No Git Bash, PowerShell ou Prompt de Comando:

```text
git clone https://github.com/Feriper/jarvis-command-center.git
cd jarvis-command-center
pnpm install
copy .env.example .env
```

Abra `.env` e preencha pelo menos `OPENAI_API_KEY` para um provedor OpenAI-compatible. Depois execute:

```text
pnpm dev
```

Abra `http://127.0.0.1:3000` no navegador. O modo local cria automaticamente os dados em `%LOCALAPPDATA%\Jarvis\data` quando o iniciador de Windows for usado.

A alternativa mais simples é executar `Iniciar-Jarvis-Windows.bat` por duplo clique. Ele verifica Node.js e pnpm, instala dependências na primeira execução, cria `.env` se necessário e inicia o servidor. Para encerrar, pressione `Ctrl+C` na janela do servidor. Em um clone Git, `Atualizar-e-Iniciar-Auren.bat` tenta fazer `git pull --ff-only` antes de iniciar; se houver alterações locais, ele não sobrescreve nada e pula a atualização.

## Configuração mínima do `.env`

```env
PORT=3000
NODE_ENV=development
VITE_LOCAL_MODE=true
JARVIS_LOCAL_MODE=true
JARVIS_LOCAL_USER_NAME=Meu Jarvis
JARVIS_DATA_DIR=./data
OPENAI_API_KEY=
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
AUREN_DESKTOP_BRIDGE_URL=http://127.0.0.1:8765
AUREN_DESKTOP_BRIDGE_TOKEN=
```

Se quiser usar um modelo local compatível com a API OpenAI, mantenha a chave vazia e troque `OPENAI_API_BASE` e `OPENAI_MODEL` pelo endpoint e modelo instalados no seu PC. Modelos locais consomem mais RAM e podem responder mais lentamente; o caminho online é o mais leve para o hardware informado.

Para ligar o Auren à ponte local do Windows, inicie `manus_local_agent` e coloque o token temporário em `AUREN_DESKTOP_BRIDGE_TOKEN`. O Auren consegue consultar arquivos, janelas e controles por meio do backend. Mouse, teclado e ações de UI só são encaminhados quando a ponte está armada e a chamada traz confirmação explícita; mantenha o botão de emergência disponível. Nunca publique esse token no GitHub.

## Dados e retenção

| Tipo de informação | Armazenamento padrão | Política |
|---|---|---|
| Usuário local e identidade do Jarvis | `%LOCALAPPDATA%\Jarvis\data\jarvis-state.json` | Mantido localmente |
| Memórias importantes | Mesmo arquivo local | Até 200 entradas por padrão |
| Conversas | Mesmo arquivo local | Até 20 conversas |
| Mensagens | Mesmo arquivo local | Até 80 mensagens por conversa |
| Imagens, vídeos e arquivos grandes | Não entram no estado local | Usados por caminho ou serviço sob demanda |
| Chaves de API | `.env` local | Nunca commitar no Git |

A pasta `data/`, arquivos `.env` e caches locais estão ignorados pelo Git. Faça cópia manual do arquivo de estado se quiser backup; ele contém informações pessoais.

## Verificações de desenvolvimento

```text
pnpm check
pnpm build
```

`pnpm check` valida o núcleo executável local. `pnpm check:legacy` fica disponível para diagnosticar módulos experimentais antigos que ainda estão no repositório, mas não fazem parte do primeiro arranque do assistente.

## Diagnóstico e manutenção

O botão `DIAGNÓSTICO` coleta um snapshot somente leitura com sistema operacional, CPU, núcleos, memória, uptime, modo local e pasta de dados. Também mostra caminhos temporários apenas como prévia. Não há exclusão automática de arquivos, desligamento, alteração do Registro ou execução de comandos PowerShell no núcleo atual. Um futuro módulo de limpeza deve adotar allowlist, dry-run, logs e confirmação, seguindo esse mesmo princípio.

## Atualização automática

O iniciador `Atualizar-e-Iniciar-Auren.bat` usa `git pull --ff-only` somente quando a pasta é um clone limpo do GitHub. Isso evita downloads arquivo por arquivo, mas ainda é um mecanismo de atualização do código-fonte. Para um instalador real com atualização em segundo plano, o próximo passo é empacotar o app em Tauri/MSIX e publicar artefatos assinados; a chave privada do updater nunca deve ser colocada no repositório.

## Segurança do modo local

O modo local é restrito ao loopback e não abre o servidor para a rede por padrão. Em um deploy público, use `JARVIS_LOCAL_MODE=false`, configure autenticação real e forneça os segredos por variáveis de ambiente do provedor. Não use uma senha hardcoded e não publique o `.env`.
