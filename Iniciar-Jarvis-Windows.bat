@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo          AUREN - IA LOCAL GRATUITA
echo ==============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: Node.js 20 ou superior nao foi encontrado.
  echo Instale em https://nodejs.org/ e execute este arquivo novamente.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo ERRO: pnpm nao foi encontrado.
  echo Execute: npm install --global pnpm
  pause
  exit /b 1
)

where ollama >nul 2>nul
if errorlevel 1 (
  echo ERRO: Ollama nao foi encontrado.
  echo Instale gratuitamente pelo link oficial:
  echo https://ollama.com/download/windows
  echo Depois feche e abra este arquivo novamente.
  pause
  exit /b 1
)

if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  echo Arquivo .env criado com configuracao local gratuita.
)

set "NODE_ENV=development"
set "JARVIS_LOCAL_MODE=true"
set "VITE_LOCAL_MODE=true"
set "AUREN_LLM_PROVIDER=local"
set "AUREN_LOCAL_LLM=true"
set "AUREN_LOCAL_LLM_BASE=http://127.0.0.1:11434/v1"
set "AUREN_LOCAL_LLM_KEY=ollama"
set "AUREN_LOCAL_LLM_MODEL=qwen2.5:3b"
set "JARVIS_DATA_DIR=%LOCALAPPDATA%\Auren\data"
set "JARVIS_MAX_LOCAL_MESSAGES=80"
set "JARVIS_MAX_LOCAL_CONVERSATIONS=20"
set "JARVIS_MAX_LOCAL_MEMORY=200"

ollama list 2>nul | findstr /I /C:"qwen2.5:3b" >nul
if errorlevel 1 (
  echo O modelo local qwen2.5:3b ainda nao foi baixado.
  echo Fazendo o download uma unica vez. Isso nao gera cobranca.
  ollama pull qwen2.5:3b
  if errorlevel 1 (
    echo ERRO: nao foi possivel baixar o modelo local.
    echo Verifique se o Ollama esta aberto e tente novamente.
    pause
    exit /b 1
  )
)

if not exist "node_modules" (
  echo Instalando dependencias do Auren na primeira execucao...
  call pnpm install --frozen-lockfile
  if errorlevel 1 goto :error
)

echo.
echo Auren sera aberto em http://127.0.0.1:3000
echo IA: Ollama local - qwen2.5:3b - sem chave e sem cobranca por mensagem
echo Dados importantes: %JARVIS_DATA_DIR%
echo Pressione Ctrl+C para encerrar.
echo.
call pnpm dev
if errorlevel 1 goto :error
exit /b 0

:error
echo.
echo O Auren nao conseguiu iniciar. Leia a mensagem acima e tente novamente.
pause
exit /b 1
