#!/bin/bash

# Manual installation of forge-std
# Run this in Git Bash from the Backend directory

echo "=========================================="
echo "Manual forge-std Installation"
echo "=========================================="
echo ""

# Remove existing empty directory
if [ -d "lib/forge-std" ]; then
    echo "Removing existing forge-std directory..."
    rm -rf lib/forge-std
fi

# Create lib directory if it doesn't exist
mkdir -p lib

# Clone forge-std repository
echo "Cloning forge-std repository..."
cd lib
git clone https://github.com/foundry-rs/forge-std.git

# Verify installation
cd ..
if [ -f "lib/forge-std/src/Script.sol" ] && [ -f "lib/forge-std/src/Test.sol" ]; then
    echo ""
    echo "✓ forge-std installed successfully!"
    echo "Found files:"
    ls -la lib/forge-std/src/ | head -5
    echo ""
    echo "Now try: forge build"
else
    echo ""
    echo "⚠ Error: Installation failed"
    echo "Checking what was created..."
    ls -la lib/forge-std/ 2>/dev/null || echo "Directory not found"
fi

