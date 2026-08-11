param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Version,

  [Parameter(Mandatory = $true, Position = 1)]
  [string]$Description,

  [switch]$Yes
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

function Success([string]$Message) {
  Write-Host ""
  Write-Host "OK: $Message" -ForegroundColor Green
}

# ---------------------------------------------------------
# 1. Localiza a raiz do projeto web a partir deste script
# ---------------------------------------------------------
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

Set-Location $ProjectDir

if (-not (Test-Path "package.json")) {
  Fail "package.json não encontrado em $ProjectDir"
}

if (-not (Test-Path ".git")) {
  # Aceita também repositório cuja pasta .git esteja acima,
  # mas exige que git reconheça o diretório.
  & git rev-parse --is-inside-work-tree *> $null
  if ($LASTEXITCODE -ne 0) {
    Fail "Este diretório não pertence a um repositório Git."
  }
}

# ---------------------------------------------------------
# 2. Valida versão
# ---------------------------------------------------------
if ($Version -notmatch '^V\d+\.\d+\.\d+\.\d+[A-Za-z0-9-]*$') {
  Fail "Versão inválida. Exemplo esperado: V0.11.9.0"
}

$VersionFile = Join-Path $ProjectDir "src\lib\system-version.ts"

if (-not (Test-Path $VersionFile)) {
  Fail "Arquivo de versão global não encontrado: $VersionFile"
}

# ---------------------------------------------------------
# 3. Confere branch
# ---------------------------------------------------------
Step "Conferindo branch Git"

$Branch = (& git branch --show-current).Trim()

if ($Branch -ne "main") {
  Fail "Branch atual é '$Branch'. A release NAVE deve ser feita a partir de 'main'."
}

& git fetch origin main --quiet
if ($LASTEXITCODE -ne 0) {
  Fail "Falha ao consultar origin/main."
}

$Behind = (& git rev-list --count HEAD..origin/main).Trim()

if ([int]$Behind -gt 0) {
  Fail "Sua branch local está $Behind commit(s) atrás de origin/main. Execute git pull antes da release."
}

Success "Branch main pronta."

# ---------------------------------------------------------
# 4. Atualiza versão global
# ---------------------------------------------------------
Step "Atualizando versão global para $Version"

$VersionContent = @"
export const SYSTEM_VERSION = "$Version";
"@

Set-Content `
  -Path $VersionFile `
  -Value $VersionContent `
  -Encoding utf8

Success "src/lib/system-version.ts atualizado."

# ---------------------------------------------------------
# 5. Build obrigatório
# ---------------------------------------------------------
Step "Executando npm run build"

& npm run build

if ($LASTEXITCODE -ne 0) {
  Fail "Build falhou. Nada será commitado nem enviado."
}

Success "Build concluído."

# ---------------------------------------------------------
# 6. Mostra mudanças antes de stage
# ---------------------------------------------------------
Step "Mudanças detectadas"

$StatusBefore = & git status --short

if (-not $StatusBefore) {
  Fail "Nenhuma alteração encontrada para publicar."
}

$StatusBefore | ForEach-Object {
  Write-Host $_
}

# ---------------------------------------------------------
# 7. Stage
# ---------------------------------------------------------
Step "Preparando arquivos para o commit"

& git add -A

if ($LASTEXITCODE -ne 0) {
  Fail "Falha no git add."
}

$Staged = & git diff --cached --name-status

if (-not $Staged) {
  Fail "Nenhum arquivo ficou preparado para commit."
}

Write-Host ""
Write-Host "Arquivos que serão publicados:" -ForegroundColor Yellow
$Staged | ForEach-Object {
  Write-Host "  $_"
}

# ---------------------------------------------------------
# 8. Confirmação de segurança
# ---------------------------------------------------------
if (-not $Yes) {
  Write-Host ""
  $Answer = Read-Host "Confirmar release $Version? Digite S para continuar"

  if ($Answer.Trim().ToUpperInvariant() -ne "S") {
    & git reset
    Fail "Release cancelada. O stage foi desfeito."
  }
}

# ---------------------------------------------------------
# 9. Commit
# ---------------------------------------------------------
$CommitMessage = "$Version $Description"

Step "Criando commit"
Write-Host "Mensagem: $CommitMessage"

& git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
  Fail "Falha ao criar commit."
}

# ---------------------------------------------------------
# 10. Push
# ---------------------------------------------------------
Step "Enviando para origin/main"

& git push origin main

if ($LASTEXITCODE -ne 0) {
  Fail "Falha no git push."
}

# ---------------------------------------------------------
# 11. Resumo
# ---------------------------------------------------------
$Sha = (& git rev-parse --short HEAD).Trim()

Success "Release enviada com sucesso."

Write-Host ""
Write-Host "----------------------------------------" -ForegroundColor DarkGray
Write-Host "NAVE RELEASE" -ForegroundColor Green
Write-Host "Versão : $Version"
Write-Host "Commit : $Sha"
Write-Host "Branch : main"
Write-Host "Deploy : GitHub push concluído; Vercel deve iniciar automaticamente."
Write-Host "Produção:"
Write-Host "  https://sistema.naveaprendizagem.com"
Write-Host "  https://sistema.naveaprendizagem.com/banco-questoes"
Write-Host "  https://sistema.naveaprendizagem.com/sequencias"
Write-Host "----------------------------------------" -ForegroundColor DarkGray