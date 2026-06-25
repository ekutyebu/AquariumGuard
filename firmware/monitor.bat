@echo off
echo Starting AquariumGuard Serial Monitor (Ctrl+C to exit)...
call .venv\Scripts\pio.exe device monitor
pause
