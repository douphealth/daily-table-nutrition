# Convenience wrapper: use the Node.js publisher, avoiding Windows PowerShell
# module loading and the Get-FileHash dependency entirely.
$ErrorActionPreference = 'Stop'
$node = Get-Command node -CommandType Application -ErrorAction Stop
& $node.Source (Join-Path $PSScriptRoot 'Publish-Daily-Table.mjs') @args
exit $LASTEXITCODE
