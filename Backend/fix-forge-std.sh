#!/bin/bash

# Fix forge-std installation
# Run this in Git Bash from the Backend directory

echo "Fixing forge-std installation..."
echo ""

# Remove empty forge-std directory if it exists
if [ -d "lib/forge-std" ]; then
    echo "Removing empty forge-std directory..."
    rm -rf lib/forge-std
fi

# Install forge-std properly
echo "Installing forge-std..."
forge install foundry-rs/forge-std --no-commit

# Verify installation
if [ -f "lib/forge-std/src/Script.sol" ] && [ -f "lib/forge-std/src/Test.sol" ]; then
    echo "✓ forge-std installed successfully!"
    echo "Found Script.sol and Test.sol"
else
    echo "⚠ Warning: forge-std installation may be incomplete"
    echo "Checking what was installed..."
    ls -la lib/forge-std/ 2>/dev/null || echo "lib/forge-std directory not found"
fi

echo ""
echo "Now try: forge build"

