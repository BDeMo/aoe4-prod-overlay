#!/usr/bin/env python3
"""
AoE4 Production Overlay - Launcher Script
Installs dependencies if needed, then starts the overlay.
"""
import subprocess
import sys
import os

def check_and_install_deps():
    """Install required packages if missing."""
    required = ['PyQt5', 'PyQtWebEngine']
    missing = []
    for pkg in required:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)

    if missing:
        print(f"Installing missing packages: {', '.join(missing)}")
        subprocess.check_call([
            sys.executable, '-m', 'pip', 'install', *missing
        ])
        print("Dependencies installed successfully.")

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    check_and_install_deps()

    # Import and run the overlay
    from main import main as run_overlay
    run_overlay()

if __name__ == '__main__':
    main()
