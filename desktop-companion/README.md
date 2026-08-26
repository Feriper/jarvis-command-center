# Auren Companion para Windows

Este diretório contém o companion nativo do Auren. Ele cria um processo Windows Forms com ícone na bandeja, uma janela nativa WebView2 para abrir o chat local, estado visível, pausa e encerramento. O processo ainda é deliberadamente seguro: **não usa microfone, não escuta 24 horas, não instala serviço, não executa PowerShell livre e não controla mouse/teclado sem o fluxo autorizado da ponte**.

A janela nativa exige o Microsoft Edge WebView2 Runtime instalado no Windows. O SDK é restaurado pelo projeto; o Runtime é um componente da máquina e pode ser baixado pela [página oficial do WebView2](https://developer.microsoft.com/microsoft-edge/webview2/).

## Estados

- `OFF`: estado inicial de instalação e inicialização.
- `WAITING FOR AUREN`: processo ativo, reservado para o futuro detector local. Nesta versão não abre o microfone.
- `PAUSED`: pausa explícita para áudio e automação.
- `ERROR`: reservado para falhas de dispositivo ou pareamento.

## Compilar no Windows

Requer .NET 8 SDK no Windows. Na pasta `desktop-companion`, execute:

```powershell
dotnet build -c Release
```

Para testar sem instalar:

```powershell
dotnet run -c Release
```

O log não contém áudio nem token e fica em:

```text
%LOCALAPPDATA%\Auren\companion\companion.log
```

## Atualização pelo botão

A janela nativa exibe o estado da atualização no topo. O botão faz uma consulta read-only ao clone Git local e ao branch `origin/main`. Se houver mudanças locais, o update é bloqueado. Quando existe uma versão nova, o botão pede confirmação e inicia `Atualizar-e-Iniciar-Auren.bat`, que usa `git pull --ff-only` antes de reiniciar o Auren.

Esse fluxo Git é o updater intermediário. Ele não substitui um instalador assinado. O updater nativo futuro precisará de releases, assinatura, chave pública no aplicativo, chave privada protegida, HTTPS e rollback.

## Próximos módulos, em ordem

1. Health-check do servidor local e pareamento por nonce expirável.
2. Bandeja com revogação do pareamento e indicador de conexão.
3. Adaptadores opcionais de VAD, wake word, STT e TTS locais.
4. Prévia de intenção e confirmação antes de chamar a ponte Windows.
5. Instalador e updater assinado.

A política completa está em [`../docs/AUREN-NATIVE-COMPANION.md`](../docs/AUREN-NATIVE-COMPANION.md).
