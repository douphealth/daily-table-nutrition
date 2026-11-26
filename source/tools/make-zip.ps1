# Zips the CONTENTS of a folder (site at the ZIP root, forward-slash entry names) and prints entry count, size and SHA-256.
# Refuses to overwrite an existing file: other sessions write releases into the same project folder.
# usage: pwsh -File make-zip.ps1 <folder> <out.zip>
param([Parameter(Mandatory)][string]$Folder, [Parameter(Mandatory)][string]$Zip)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$src = (Resolve-Path -LiteralPath $Folder).Path
$out = [IO.Path]::GetFullPath($Zip)
if (Test-Path -LiteralPath $out) { throw "refusing to overwrite $out" }
[IO.Compression.ZipFile]::CreateFromDirectory($src, $out, [IO.Compression.CompressionLevel]::Optimal, $false)
$z = [IO.Compression.ZipFile]::OpenRead($out)
try {
  $files = @($z.Entries | Where-Object { -not $_.FullName.EndsWith('/') })
  $bad = @($files | Where-Object { $_.FullName.Contains('\') })
  if ($bad.Count) { throw "entry names with backslashes: $($bad[0].FullName)" }
  $onDisk = @(Get-ChildItem -LiteralPath $src -Recurse -File).Count
  if ($files.Count -ne $onDisk) { throw "entries $($files.Count) != files on disk $onDisk" }
  $root = @($files | Where-Object { -not $_.FullName.Contains('/') } | ForEach-Object FullName | Sort-Object)
  "entries : $($files.Count) files"
  "at root : $($root -join ', ')"
} finally { $z.Dispose() }
"size    : {0:N1} MB" -f ((Get-Item -LiteralPath $out).Length / 1MB)
"sha256  : $((Get-FileHash -LiteralPath $out -Algorithm SHA256).Hash)"
"file    : $out"
