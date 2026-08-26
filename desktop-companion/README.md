# Auren Companion para Windows

Este diretório contém o primeiro esqueleto do companion nativo do Auren. Ele cria um processo Windows Forms com ícone na bandeja, estado visível, pausa e encerramento. O esqueleto é deliberadamente seguro: **não usa microfone, não escuta 24 horas, não instala serviço, não executa PowerShell, não controla mouse/teclado e não faz atualização automática**.

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

## Próximos módulos, em ordem

1. Health-check do servidor local e pareamento por nonce expirável.
2. Bandeja com revogação do pareamento e indicador de conexão.
3. Adaptadores opcionais de VAD, wake word, STT e TTS locais.
4. Prévia de intenção e confirmação antes de chamar a ponte Windows.
5. Instalador e updater com manifest e assinatura.

A política completa está em [`../docs/AUREN-NATIVE-COMPANION.md`](../docs/AUREN-NATIVE-COMPANION.md).
