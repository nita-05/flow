#!/usr/bin/env python3
"""
Uninstall script to remove faster-whisper and related packages
"""

import subprocess
import sys

def uninstall_package(package):
    """Uninstall a Python package using pip"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "uninstall", package, "-y"])
        print(f"✅ Successfully uninstalled {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"⚠️  {package} was not installed or already removed")
        return False

def main():
    print("🗑️  Uninstalling faster-whisper and related packages...")
    print("=" * 50)
    
    # Packages to uninstall
    packages = [
        "faster-whisper",
        "torch",
        "torchaudio", 
        "numpy",
        "scipy"
    ]
    
    print("📦 Uninstalling packages...")
    uninstalled_count = 0
    
    for package in packages:
        if uninstall_package(package):
            uninstalled_count += 1
    
    print("=" * 50)
    print("✅ Uninstall completed!")
    print(f"📊 Uninstalled {uninstalled_count} packages")
    
    print("\n🔄 You are now back to using OpenAI Whisper API")
    print("💰 Cost: $0.006 per minute")
    print("🎯 Features: All enhanced features still available")

if __name__ == "__main__":
    main()
