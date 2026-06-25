@echo off
echo Cleaning build artifacts...
call .venv\Scripts\pio.exe run --target clean
pause
