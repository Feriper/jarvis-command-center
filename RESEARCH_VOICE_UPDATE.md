# Pesquisa de voz, automação e atualização

## Achados principais

1. `dscripka/openWakeWord` é uma biblioteca open source para detecção de palavra de ativação, com modelos pré-treinados e possibilidade de modelos customizados. Fonte: https://github.com/dscripka/openWakeWord
2. `Clebson-Torres/WinVoice` é uma referência de assistente offline para Windows que combina Ollama, reconhecimento de voz e controle do sistema. Fonte: https://github.com/Clebson-Torres/WinVoice
3. O plugin oficial `tauri-apps/plugin-updater` suporta atualização automática por servidor de update ou JSON estático assinado. Fonte: https://v2.tauri.app/plugin/updater/
4. O tópico de aplicativos desktop no GitHub mostra que agentes locais costumam separar modelo local, transcrição, execução de ações e uma camada de confirmação. Fonte: https://github.com/topics/desktop-assistant

## Decisão de arquitetura

O Jarvis deve separar quatro camadas: palavra de ativação local, transcrição/TTS, raciocínio por API ou modelo local e executor Windows com permissões visíveis. A escuta contínua deve processar somente o detector de ativação localmente e iniciar gravação/transcrição apenas após a palavra-chave, com indicador e botão de pausa.

A atualização automática deve usar pacote assinado e manifesto HTTPS. Não é seguro baixar e executar código arbitrário sem assinatura. A primeira versão pode permanecer como app local web/PWA; para atualização silenciosa e integração nativa de microfone, inicialização e permissões, a evolução recomendada é empacotar um shell Tauri/Windows com updater assinado.

## Limites reais

- Voz 24 horas exige microfone autorizado, consumo contínuo e um detector local; não deve enviar áudio permanente para a nuvem.
- Geração de imagem e vídeo depende de APIs/serviços externos ou GPU local; o Ryzen 5 3400G com 16 GB não é um alvo adequado para geração local pesada de vídeo.
- Diagnóstico e limpeza do Windows devem começar somente com leitura, prévia e ponto de restauração; ações destrutivas exigem confirmação separada.
- Jogar pelo usuário exige integração de captura/visão e controle de entrada, com risco de comandos errados e incompatibilidade com anti-cheat; deve ser um módulo opcional e controlado.

## Verificação em fontes primárias

Na página do repositório openWakeWord, a biblioteca é descrita como detector de palavras/frases de ativação e recomenda VAD, supressão de ruído e ajuste de limiar. A página informa que a supressão Speex suportada está atualmente em Linux x86/Arm64, portanto a integração Windows deve usar outro backend ou uma camada nativa/compatível, não assumir que esse pacote Python roda diretamente no Windows. O projeto também alerta que falsos positivos e falsos negativos devem ser medidos em gravações realistas. Fonte consultada: https://github.com/dscripka/openWakeWord

Na documentação oficial do Tauri Updater, o plugin suporta Windows, exige Rust 1.77.2 ou superior e requer assinatura dos artefatos. A chave pública vai na configuração do app e a chave privada deve permanecer secreta; a assinatura não pode ser desativada. A documentação mostra endpoints HTTPS e JSON estático de releases do GitHub, além de artefatos Windows MSI/NSIS. Fonte consultada: https://v2.tauri.app/plugin/updater/

## Fontes adicionais verificadas

O repositório WinVoice combina reconhecimento de voz, TTS, Ollama e execução de comandos PowerShell com confirmação por voz. A própria documentação mostra que o projeto controla arquivos e programas, mas também informa que a versão descrita depende de Python, Ollama e bibliotecas de áudio; a execução de comandos gerados por IA deve ser tratada como uma referência de UX, não copiada sem uma camada de aprovação. Fonte consultada: https://github.com/Clebson-Torres/WinVoice

O repositório whisper.cpp declara suporte a inferência somente em CPU e documenta VAD para processar apenas segmentos de fala. Também apresenta comandos de download/uso do modelo VAD no Windows. Isso é uma opção concreta para transcrição local, embora o modelo e a qualidade precisem ser medidos no Ryzen 5 3400G. Fonte consultada: https://github.com/ggml-org/whisper.cpp

## Diagnóstico, limpeza e automação Windows

A pesquisa encontrou referências de inventário e diagnóstico PowerShell que podem servir como base para um módulo de leitura: `xsukax-Windows-System-Hardware-Report`, `0x0bug/windows-diagnostics-toolkit` e scripts de coleta de eventos. Esses projetos devem ser usados apenas como referência e revisados antes de incorporar código. Fontes: https://github.com/xsukax/xsukax-Windows-System-Hardware-Report, https://github.com/0x0bug/windows-diagnostics-toolkit, https://github.com/PureStorage-OpenConnect/powershell-scripts/blob/main/Get-WindowsDiagnosticInfo.ps1

Para limpeza, `Armi1014/TempCleaner` é uma referência de allowlist, logs e alvos opcionais. O Jarvis deve primeiro gerar um relatório do que seria removido, nunca apagar pastas arbitrárias e exigir confirmação antes da limpeza. Fonte: https://github.com/Armi1014/TempCleaner

Para automação de interface, `FlaUI/FlaUI` é uma biblioteca .NET de UI Automation para Win32, WinForms, WPF e apps Store. Ela deve complementar a ponte local já testada, não substituir confirmação, foco correto e botão de parada. Fonte: https://github.com/FlaUI/FlaUI

## Confirmação de automação e manutenção

A documentação do FlaUI confirma que ele é uma biblioteca .NET baseada nas APIs nativas de UI Automation da Microsoft, com suporte a UIA2/UIA3 e busca de elementos por texto/árvore; também alerta que foco e eventos de entrada continuam sendo importantes. Fonte consultada: https://github.com/FlaUI/FlaUI

A documentação do TempCleaner confirma um desenho de manutenção mais seguro: presets Basic/Full/Custom, alvos allowlisted, bloqueio de raízes perigosas, fallback para limpeza somente do usuário sem elevação, dry-run, logs por execução, retenção configurável e confirmação interativa. Esses controles devem ser reproduzidos no módulo de manutenção do Auren; o Jarvis não deve apagar caminhos arbitrários.

## Atualização nativa — verificação oficial

A documentação oficial do Tauri Updater confirma que a assinatura dos artefatos é obrigatória, que a chave pública fica no aplicativo e que a chave privada deve permanecer secreta; também documenta artefatos Windows MSI/NSIS e endpoints HTTPS/JSON para o fluxo de atualização. Fonte consultada: https://v2.tauri.app/plugin/updater/ (2026-08-25).
