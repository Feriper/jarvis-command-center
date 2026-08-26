@echo off
setlocal
cd /d "%~dp0"

echo ==============================================
echo       AUREN - ATUALIZAR E INICIAR
 echo ==============================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo Git nao encontrado. Instale o Git for Windows ou use o iniciador normal.
  goto :start
)

git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo Esta pasta nao e um clone Git. Nenhuma atualizacao sera aplicada.
  goto :start
)

git diff --quiet
if errorlevel 1 (
  echo Existem alteracoes locais. Para proteger seu trabalho, o pull automatico foi pulado.
  goto :start
)

echo Procurando atualizacoes no GitHub...
git pull --ff-only origin main
if errorlevel 1 (
  echo Nao foi possivel atualizar automaticamente. O Auren sera iniciado com a versao atual.
)

:start
call Iniciar-Jarvis-Windows.bat
exit /b %errorlevel%
