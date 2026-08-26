# Auren Native Companion

## Objetivo

O companion nativo será o processo Windows que transforma o Auren de uma aplicação web local em uma presença contínua de software: bandeja do sistema, palavra de ativação, captura de voz sob política explícita, fala opcional, pareamento com o servidor local e execução controlada de ações no computador.

Isso **não representa consciência, vida ou autonomia humana**. A experiência de continuidade vem de uma persona consistente, memória local controlada, estado visível e módulos persistentes.

## Situação atual

| Capacidade | Estado atual | Próxima evolução |
|---|---|---|
| Chat e persona Auren | Funcional no app local | Manter núcleo leve |
| Memória | Declarações explícitas em JSON local | Tela para revisar, apagar e exportar |
| Voz | Web Speech por comando | Worker nativo com áudio local |
| Palavra “Auren” | Experimental no navegador | Detector local com VAD e limiar calibrável |
| Diagnóstico | Leitura do sistema | Histórico local e alertas opt-in |
| Limpeza | Prévia de temporários, sem exclusão | Dry-run detalhado e confirmação por alvo |
| Ponte Windows | Cliente backend com token e ARMAR AÇÕES | Pareamento guiado e logs na UI |
| Imagem | Provedor configurável | Fila e cache sob demanda |
| Vídeo | Não implementado localmente | Adaptador de provedor externo, nunca geração pesada no Ryzen |
| Atualização | `git pull --ff-only` no starter | Pacote Windows assinado com rollback |
| Jogos | Não implementado | Somente adaptadores aprovados para offline/acessibilidade |

## Decisão de arquitetura

O servidor web continua sendo o cérebro de conversa, memória e políticas. O companion nativo é um **periférico local visível**, não um executor livre de comandos. O backend nunca recebe um comando arbitrário de PowerShell gerado pelo modelo.

```text
┌────────────────────────────────────────────────────────────┐
│ Auren Web local: chat · persona · memória · prévia · UI    │
└───────────────────────────┬────────────────────────────────┘
                            │ loopback HTTPS/localhost
┌───────────────────────────▼────────────────────────────────┐
│ Companion Windows: tray · estado · pausa · pairing · logs  │
└───────────────┬──────────────────────┬─────────────────────┘
                │                      │
       ┌────────▼────────┐    ┌────────▼─────────┐
       │ Áudio local      │    │ Bridge allowlist │
       │ VAD/wake/STT/TTS │    │ UIA/input/read   │
       └──────────────────┘    └──────────────────┘
```

## Opções avaliadas

| Abordagem | Trocas principais | Custo | Complexidade de configuração |
|---|---|---:|---:|
| Continuar apenas no navegador | Já funciona e quase não instala nada, mas não é uma escuta nativa confiável nem vive na bandeja | Baixo | Baixa |
| Worker Node/Python separado | Facilita prototipar STT/TTS e logs, porém exige dependências nativas, permissões de microfone e empacotamento cuidadoso | Baixo a médio | Média |
| Companion Windows nativo assinado | Melhor tray, permissões, inicialização, atualização e controle de áudio; exige empacotar, assinar e manter instalador | Custo de assinatura/distribuição | Alta |

A base imediata será a opção nativa modular, mas com **adaptadores opcionais**. O núcleo deve abrir, parear, pausar e mostrar o estado mesmo quando nenhum modelo de voz estiver instalado.

## Máquina de estados visível

O ícone e o painel devem sempre mostrar um destes estados:

- `OFF`: companion encerrado ou microfone desativado.
- `WAITING_FOR_AUREN`: processo ativo, sem gravar áudio bruto; somente detector local habilitado se o usuário optou por isso.
- `LISTENING`: ativado pela palavra “Auren” ou pelo botão; captura limitada ao comando atual.
- `PROCESSING`: transcrição/intenção em execução; não aceita outro comando simultâneo.
- `SPEAKING`: TTS ativo; pode ser interrompido pelo botão PAUSAR.
- `PAUSED`: tudo relacionado a áudio e automação suspenso.
- `ERROR`: falha explícita de dispositivo, modelo, pareamento ou provedor.

Não deve existir modo oculto, escuta silenciosa ou gravação indefinida.

## Política de áudio e privacidade

1. O padrão de instalação é `OFF`.
2. Ativar `WAITING_FOR_AUREN` exige ação do usuário e mostra indicador permanente na bandeja.
3. A detecção de palavra e VAD devem ocorrer localmente.
4. O áudio bruto não é salvo por padrão e não é enviado antes da ativação.
5. Após detectar “Auren”, o companion captura uma janela limitada, encerra por silêncio/timeout e envia apenas o necessário para transcrição.
6. Logs guardam estado, duração e resultado resumido; não guardam áudio ou conteúdo sensível por padrão.
7. O botão `PAUSAR` deve desativar áudio imediatamente. O botão `SAIR` encerra o processo.

Para o hardware Ryzen 5 3400G/16 GB, o caminho recomendado é VAD + STT CPU leve local, com benchmark real antes de ativar inicialização automática. LLM, geração de imagem e vídeo permanecem remotos/opcionais para evitar pressão de RAM e CPU.

## Pareamento com o Auren local

O pareamento deve usar um código temporário exibido pelo Auren e aceito uma única vez pelo companion. O token final fica somente no armazenamento protegido do Windows e no servidor local; nunca vai para o frontend, GitHub ou logs.

Requisitos do protocolo:

- aceitar somente `127.0.0.1` por padrão;
- usar nonce e expiração no pareamento;
- separar token de leitura e token de ação;
- começar sempre em `DISARMED`;
- exigir `ARMAR AÇÕES` na ponte e `confirmed: true` para entrada;
- registrar `timestamp`, intenção, alvo, resultado e motivo de falha;
- permitir revogar o pareamento apagando a configuração local.

## Limites da automação Windows

O executor trabalha com intenções allowlisted, por exemplo `read_snapshot`, `list_files`, `list_windows`, `move_mouse`, `click_mouse`, `type_text` e `send_key`. Cada ação recebe parâmetros validados, preview e confirmação específica.

É proibido converter texto do modelo diretamente em PowerShell, CMD, registry edit, exclusão de diretório ou download executável. Ações destrutivas ficam fora do primeiro release.

### Manutenção

A manutenção começa com diagnóstico e dry-run. Os únicos alvos previstos são temporários allowlisted, com contagem de arquivos, bytes estimados, erros e lista de exclusões. A exclusão real, quando existir, deverá exigir:

- lista de alvos visível;
- confirmação recente e específica;
- retenção de log;
- exclusão de arquivos temporários somente;
- cancelamento/kill switch;
- nenhum fallback para pastas pessoais.

### Jogos

O módulo de jogos não faz parte do núcleo. Se for desenvolvido, será por adaptador específico, começando por jogo single-player ou acessibilidade, com captura e inputs explícitos. Não haverá bypass de anti-cheat, automação competitiva online ou alegação de que o Auren joga qualquer jogo de forma confiável.

## Atualização sem downloads manuais

O starter Git continua sendo o caminho provisório. O release nativo deve usar instalador Windows e manifest assinado. O manifest mínimo deverá conter `version`, `platform`, `installerUrl`, `signature`, `sha256`, `releaseNotes` e `minimumRuntime`.

Fluxo desejado:

1. O companion consulta um endpoint HTTPS em intervalo moderado ou ao abrir.
2. Valida assinatura com chave pública embutida.
3. Mostra versão, tamanho, hash e notas.
4. Baixa para área temporária, sem substituir a instalação ativa.
5. Verifica hash e assinatura.
6. Fecha com segurança, instala e reinicia.
7. Se o health-check falhar, volta para a versão anterior.

A chave privada nunca deve entrar no repositório. A implementação do updater só deve ser publicada depois de escolher o formato de instalador, armazenar a chave em segredo de CI e obter aprovação para assinatura de código.

## Fases de implementação

### Fase A — contrato e pareamento

Criar manifest/config local, estados da bandeja, pause/exit, pairing por loopback e health-check do servidor. Nenhum microfone ainda.

### Fase B — áudio nativo opt-in

Adicionar adaptadores substituíveis para VAD, wake word, STT e TTS. Testar CPU, latência, falsos positivos e consumo de RAM no computador real. Não armazenar áudio por padrão.

### Fase C — painel de controle

Exibir ponte conectada/desarmada/armada, janelas e arquivos em modo leitura, prévias de automação, logs e revogação do pareamento.

### Fase D — manutenção segura

Implementar apenas dry-run e exclusão allowlisted após confirmação específica. Adicionar rollback lógico de configuração, não exclusão de documentos.

### Fase E — instalador e updater

Empacotar companion, assinar instalador, publicar manifest assinado e testar atualização interrompida, hash incorreto, versão antiga e rollback.

### Fase F — adaptadores opcionais

Adicionar provedores de imagem/vídeo e adaptadores de jogos conforme necessidade, sem tornar o núcleo dependente desses módulos.

## Critérios de aceite

- O Auren inicia em estado `OFF` e não abre o microfone sozinho.
- `PAUSAR` corta o processamento de áudio e automação.
- O painel informa claramente quando está ouvindo.
- Nenhum áudio bruto aparece na pasta de dados por padrão.
- Um token de bridge não aparece no HTML, no bundle, em logs ou no Git.
- Ações de entrada falham quando a ponte está desarmada ou sem confirmação.
- Limpeza não altera arquivos durante a prévia.
- Falha de provedor não derruba o servidor nem corrompe a memória local.
- Atualização inválida não substitui a versão ativa.
- O uso de CPU/RAM do modo de espera é medido no PC real antes de ativar inicialização automática.

## Referências

[1] [Tauri Updater — documentação oficial](https://v2.tauri.app/plugin/updater/): assinatura obrigatória, chave pública no app, chave privada secreta, endpoints HTTPS/JSON e artefatos Windows MSI/NSIS.

[2] [openWakeWord](https://github.com/dscripka/openWakeWord): detector de palavra de ativação, necessidade de calibrar limiar e medir falsos positivos/falsos negativos.

[3] [whisper.cpp](https://github.com/ggml-org/whisper.cpp): transcrição com execução em CPU e suporte documentado a VAD/Windows.
