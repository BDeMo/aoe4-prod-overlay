#!/usr/bin/env python3
"""
Build script to create a standalone .exe using PyInstaller.

Usage:
    pip install pyinstaller
    python build_exe.py
"""
import subprocess
import sys
import os

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    # Ensure pyinstaller is installed
    try:
        import PyInstaller
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pyinstaller'])

    cmd = [
        sys.executable, '-m', 'PyInstaller',
        '--name', 'AoE4ProdOverlay',
        '--onefile',
        '--windowed',              # No console window
        '--add-data', 'web;web',   # Bundle the web folder
        '--noconsole',
        'main.py'
    ]

    print("Building executable...")
    print(f"Command: {' '.join(cmd)}")
    subprocess.check_call(cmd)
    print("\nBuild complete! Executable is in dist/AoE4ProdOverlay.exe")

if __name__ == '__main__':
    main()
