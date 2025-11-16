#!/bin/bash

# Quick Deployment Script for TrancheVault
# Run this in Git Bash from the Backend directory

set -e

echo "=========================================="
echo "TrancheVault Quick Deployment"
echo "=========================================="
echo ""

# Step 1: Install forge-std
echo "Step 1: Installing forge-std..."
if [ ! -d "lib/forge-std/src" ] || [ -z "$(ls -A lib/forge-std/src 2>/dev/null)" ]; then
    forge install foundry-rs/forge-std --no-commit
    echo "✓ forge-std installed"
else
    echo "✓ forge-std already installed"
fi
echo ""

# Step 2: Build
echo "Step 2: Building contracts..."
forge build
echo "✓ Build complete"
echo ""

# Step 3: Copy ABIs
echo "Step 3: Copying ABIs..."
if [ -f "scripts/copy-abis.sh" ]; then
    chmod +x scripts/copy-abis.sh
    ./scripts/copy-abis.sh
    echo "✓ ABIs copied"
else
    echo "⚠ Warning: copy-abis.sh not found"
fi
echo ""

# Step 4: Check .env
echo "Step 4: Checking environment..."
if [ ! -f .env ]; then
    echo "⚠ .env file not found!"
    echo ""
    echo "Please create a .env file with:"
    echo "PRIVATE_KEY=your_private_key_without_0x"
    echo "USDC_ADDRESS=0x3600000000000000000000000000000000000000"
    echo "RPC_URL=https://rpc.testnet.arc.network"
    echo ""
    exit 1
fi

source .env

if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" == "your_private_key_without_0x" ]; then
    echo "⚠ PRIVATE_KEY not set in .env file!"
    echo "Please set your private key in .env"
    exit 1
fi

echo "✓ Environment configured"
echo ""

# Step 5: Deploy
echo "Step 5: Deploying TrancheVault..."
echo "RPC: ${RPC_URL:-https://rpc.testnet.arc.network}"
echo "USDC: ${USDC_ADDRESS:-0x3600000000000000000000000000000000000000}"
echo ""

forge script script/DeployTrancheVault.s.sol:DeployTrancheVault \
    --rpc-url "${RPC_URL:-https://rpc.testnet.arc.network}" \
    --broadcast \
    -vvv

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Note the deployed addresses from output above"
echo "2. Update lib/procti/addresses.ts in frontend"
echo "3. Update CONTRACT_ADDRESSES.md"
echo ""

