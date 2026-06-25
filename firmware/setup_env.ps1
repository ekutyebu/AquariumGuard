Write-Host "Initializing Python virtual environment in firmware folder..."
python -m venv .venv

Write-Host "Installing PlatformIO Core in the virtual environment..."
.venv\Scripts\pip.exe install platformio

Write-Host "Freezing dependencies to requirements.txt..."
.venv\Scripts\pip.exe freeze > requirements.txt

Write-Host "PlatformIO local installation completed!"
