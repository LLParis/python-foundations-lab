param([switch]$EditorOnly)
$ErrorActionPreference = 'Stop'
$arenaRoot = Split-Path -Parent $PSScriptRoot
& code --new-window --profile 'Learning Arena' $arenaRoot
if ($LASTEXITCODE -ne 0) { throw 'VS Code could not open the Learning Arena.' }
if (-not $EditorOnly) {
    $settingsPath = Join-Path $arenaRoot '.arena\local.json'
    if (Test-Path -LiteralPath $settingsPath) {
        $settings = Get-Content -Raw -LiteralPath $settingsPath | ConvertFrom-Json
        $tutorAddress = [Uri]$settings.tutorUrl
        if ($tutorAddress.Scheme -eq 'https' -and $tutorAddress.Host -eq 'chatgpt.com') {
            Start-Process -FilePath $tutorAddress.AbsoluteUri
        }
    }
}
