@echo off
schtasks /delete /tn "GoxentDailySync" /f
echo Scheduler removed.
pause
