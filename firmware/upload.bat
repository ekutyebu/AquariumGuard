@echo off
echo Uploading AquariumGuard ESP32 firmware...
call .venv\Scripts\pio.exe run --target upload
pause
