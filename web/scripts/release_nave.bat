@echo off
setlocal

if "%~1"=="" (
  echo Uso:
  echo   release_nave V0.11.9.0 "descricao da release"
  exit /b 1
)

if "%~2"=="" (
  echo Informe tambem a descricao da release.
  echo Exemplo:
  echo   release_nave V0.11.9.0 "automatiza processo de release"
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0release_nave.ps1" "%~1" "%~2"

exit /b %errorlevel%
