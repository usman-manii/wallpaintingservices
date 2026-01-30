$ErrorActionPreference = "Stop"

# Run from the repo root, regardless of the current working directory.
Set-Location -Path $PSScriptRoot

npm run dev
