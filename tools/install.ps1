$ErrorActionPreference = 'Stop'
$arenaRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $arenaRoot
try {
    $settingsPath = Join-Path $arenaRoot '.arena\local.json'
    $localSettings = @{}
    if (Test-Path -LiteralPath $settingsPath) {
        $priorSettings = Get-Content -Raw -LiteralPath $settingsPath | ConvertFrom-Json
        foreach ($property in $priorSettings.PSObject.Properties) { $localSettings[$property.Name] = $property.Value }
    }
    $githubCommand = Get-Command gh -ErrorAction SilentlyContinue
    if ($githubCommand) {
        $localSettings.githubCliPath = $githubCommand.Source
        $localSettings.githubConfigDir = Join-Path $env:APPDATA 'GitHub CLI'
        New-Item -ItemType Directory -Path (Split-Path -Parent $settingsPath) -Force | Out-Null
        $localSettings | ConvertTo-Json | Set-Content -LiteralPath $settingsPath -Encoding utf8
    }
    # VS Code creates a new empty profile when opening a window with that name.
    & code --list-extensions --profile 'Learning Arena' 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        & code --new-window --profile 'Learning Arena' $arenaRoot
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the Learning Arena profile.' }
    }
    if (-not (Test-Path -LiteralPath '.venv\Scripts\python.exe')) {
        & uv venv .venv --python 3.14
        if ($LASTEXITCODE -ne 0) { throw 'Could not create the Python environment.' }
    }
    & '.\.venv\Scripts\python.exe' tools/package_extension.py
    if ($LASTEXITCODE -ne 0) { throw 'Could not package the arena extension.' }
    $manifest = Get-Content -Raw -LiteralPath 'tools\vscode-extension\package.json' | ConvertFrom-Json
    $package = Join-Path $arenaRoot ('dist\learning-arena-' + $manifest.version + '.vsix')
    & code --profile 'Learning Arena' --install-extension ms-python.python --install-extension ms-python.debugpy --install-extension ms-python.vscode-pylance
    if ($LASTEXITCODE -ne 0) { throw 'Could not install the Python extensions.' }
    & code --profile 'Learning Arena' --install-extension $package --force
    if ($LASTEXITCODE -ne 0) { throw 'Could not install the arena extension.' }
    Write-Output 'Ready. Open Learning Arena.cmd launches the dedicated profile.'
} finally { Pop-Location }
