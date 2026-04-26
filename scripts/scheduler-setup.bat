@echo off
echo Setting up Goxent daily sync scheduler...
schtasks /create /tn "GoxentDailySync" /tr "cmd /c cd /d %~dp0.. && npm run daily-sync >> logs\sync.log 2>&1" /sc daily /st 07:00 /f
echo.
echo Done! Task "GoxentDailySync" created.
echo It will run every day at 7:00 AM.
echo To view logs: open the logs\sync.log file
echo To remove: schtasks /delete /tn "GoxentDailySync" /f
pause
