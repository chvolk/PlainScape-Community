@echo off
cd /d "%~dp0"
if not exist "node_modules" (
  echo Installing dependencies ^(first run^)...
  npm install --production
)
echo Starting PlainScape server...
node server\dist\main.js
pause
