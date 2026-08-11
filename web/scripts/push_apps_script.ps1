param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Description
)

$ErrorActionPreference = "Stop"

function Fail([string]$Message) {
  Write-Host ""
  Write-Host "ERRO: $Message" -ForegroundColor Red
  exit 1
}

function Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$WebDir = Split-Path -Parent $ScriptDir
$AppsScriptDir = Split-Path -Parent $WebDir

Set-Location $AppsScriptDir

if (-not (Test-Path ".clasp.json")) {
  Fail ".clasp.json não encontrado em $AppsScriptDir"
}

Step "Enviando código local para o projeto Google Apps Script"

& clasp push

if ($LASTEXITCODE -ne 0) {
  Fail "clasp push falhou."
}

Write-Host ""
Write-Host "Código enviado ao Apps Script." -ForegroundColor Green
Write-Host ""
Write-Host "ATENÇÃO:" -ForegroundColor Yellow
Write-Host "Se esta alteração afeta o Web App/API, atualize também a implantação ativa:"
Write-Host "Apps Script > Implantar > Gerenciar implantações > Editar > Nova versão > Implantar"
Write-Host ""
Write-Host "Descrição: $Description"