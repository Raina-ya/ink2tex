$ErrorActionPreference = 'Stop'
$localPython = Join-Path $PSScriptRoot 'work\python311\python.exe'
if (Test-Path $localPython) {
    $python = $localPython
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $python = (Get-Command python).Source
} else {
    Write-Error 'Python was not found. Install Python 3.11 or later and try again.'
}

& $python -m venv (Join-Path $PSScriptRoot '.venv')
$venvPython = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
& $venvPython -m pip install --upgrade pip
& $venvPython -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
& $venvPython -m pip install -r (Join-Path $PSScriptRoot 'requirements.txt')
$npm = 'C:\Program Files\nodejs\npm.cmd'
& $npm install --prefix (Join-Path $PSScriptRoot 'work\katex') --cache (Join-Path $PSScriptRoot 'work\npm-cache') katex
New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot 'static\vendor\katex') | Out-Null
Copy-Item (Join-Path $PSScriptRoot 'work\katex\node_modules\katex\dist\katex.min.js') (Join-Path $PSScriptRoot 'static\vendor\katex\katex.min.js')
Copy-Item (Join-Path $PSScriptRoot 'work\katex\node_modules\katex\dist\katex.min.css') (Join-Path $PSScriptRoot 'static\vendor\katex\katex.min.css')
Write-Output 'Setup complete. Run: .\.venv\Scripts\python.exe -m uvicorn app:app --reload'
