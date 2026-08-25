@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo        JARVIS - INICIALIZACAO LOCAL
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

if not exist ".env" (
  copy /Y ".env.example" ".env" >nul
  echo Arquivo .env criado a partir do exemplo.
  echo Abra .env e informe OPENAI_API_KEY ou configure outro provedor.
)

if not exist "node_modules" (
  echo Instalando dependencias na primeira execucao...
  call pnpm install --frozen-lockfile
  if errorlevel 1 goto :error
)

set "NODE_ENV=development"
set "JARVIS_LOCAL_MODE=true"
set "VITE_LOCAL_MODE=true"
set "JARVIS_DATA_DIR=%LOCALAPPDATA%\Jarvis\data"
set "JARVIS_MAX_LOCAL_MESSAGES=80"
set "JARVIS_MAX_LOCAL_CONVERSATIONS=20"
set "JARVIS_MAX_LOCAL_MEMORY=200"

echo.
echo Jarvis sera aberto em http://127.0.0.1:3000
 echo Dados importantes: %JARVIS_DATA_DIR%
echo Pressione Ctrl+C para encerrar.
echo.
call pnpm dev
if errorlevel 1 goto :error
exit /b 0

:error
echo.
echo O Jarvis nao conseguiu iniciar. Leia a mensagem acima e tente novamente.
pause
exit /b 1
