@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo STOPPED: Node.js 22+ is missing. Install: winget install --id OpenJS.NodeJS.LTS --exact --source winget
  exit /b 1
)
node "%~dp0Publish-Daily-Table.mjs"
set "result=%errorlevel%"
if not "%result%"=="0" echo Publishing stopped. Read the error above before retrying.
exit /b %result%
