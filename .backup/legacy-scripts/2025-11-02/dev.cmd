@echo off
REM dev.cmd - Script de desenvolvimento simples para CMD/Windows
REM Versão simplificada do dev.ps1 para ambientes CMD

if "%1"=="setup" goto setup
if "%1"=="dev" goto dev
if "%1"=="test" goto test
if "%1"=="build" goto build
if "%1"=="check" goto check
if "%1"=="clean" goto clean
if "%1"=="deps" goto deps
goto help

:setup
echo 🚀 Configurando ambiente de desenvolvimento...
call pnpm install
if %errorlevel% neq 0 exit /b %errorlevel%
call pnpm typecheck
if %errorlevel% neq 0 exit /b %errorlevel%
call pnpm lint
if %errorlevel% neq 0 exit /b %errorlevel%
if not "%2"=="skiptests" call pnpm test:unit
echo ✅ Setup concluído!
goto end

:dev
echo 🔥 Iniciando servidor de desenvolvimento...
call pnpm run dev
goto end

:test
echo 🧪 Executando testes...
call pnpm test
goto end

:build
echo 📦 Construindo aplicação...
call pnpm build
goto end

:check
echo 🔍 Executando verificações...
call pnpm typecheck
if %errorlevel% neq 0 exit /b %errorlevel%
call pnpm lint
if %errorlevel% neq 0 exit /b %errorlevel%
call pnpm test:unit
echo ✅ Verificações concluídas!
goto end

:clean
echo 🧹 Limpando caches...
if exist node_modules rmdir /s /q node_modules
if exist pnpm-lock.yaml del pnpm-lock.yaml
if exist .next rmdir /s /q .next
echo ✅ Limpeza concluída!
goto end

:deps
echo 📦 Gerenciando dependências...
call pnpm install
call pnpm update --latest
goto end

:help
echo 🤖 Script de Desenvolvimento - Landing Page SaaS
echo.
echo Uso: dev.cmd ^<comando^> [skiptests]
echo.
echo Comandos disponíveis:
echo   setup     - Instala dependências e verificações iniciais
echo   dev       - Inicia servidor de desenvolvimento
echo   test      - Executa todos os testes
echo   build     - Build de produção
echo   check     - Verificações de qualidade
echo   clean     - Remove caches e arquivos temporários
echo   deps      - Instala/atualiza dependências
echo   help      - Mostra esta ajuda
echo.
echo Exemplos:
echo   dev.cmd setup
echo   dev.cmd dev
echo   dev.cmd check skiptests
echo.
echo 💡 Compatível com Cursor + CMD no Windows
goto end

:end
