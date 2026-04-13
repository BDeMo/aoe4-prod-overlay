@echo off
title AoE4 Production Overlay
cd /d "%~dp0"

:: Try conda python first, then system python
where python >nul 2>&1
if %errorlevel% equ 0 (
    python main.py
) else (
    echo Python not found. Please install Python 3.8+ or Anaconda.
    pause
)
