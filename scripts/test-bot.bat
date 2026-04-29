@echo off
echo Running Sasto bot in DEBUG mode...
set DEBUG_BOT=true
node scripts/sasto-analyzer.cjs
echo Done. Check logs/ folder for screenshots.
pause
