#!/bin/bash

# Complete Deployment Script for TrancheVault
# Run this in Git Bash from the Backend directory

set -e  # Exit on error

echo "=========================================="
echo "TrancheVault Deployment"
echo "=========================================="
echo ""

# Check if forge is available
if ! command -v forge &> /dev/null; then
    echo "ERROR: forge command not found!"
    echo "Please install Foundry: https://book.getfoundry.sh/getting-started/installation"
    exit 1
fi

echo "✓ Foundry is installed"
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

# Step 2: Build contracts
echo "Step 2: Building contracts..."
forge build
echo "✓ Build complete"
echo ""

# Step 3: Copy ABIs
echo "Step 3: Copying ABIs..."
chmod +x scripts/copy-abis.sh
./scripts/copy-abis.sh
echo "✓ ABIs copied"
echo ""

# Step 4: Check .env file
echo "Step 4: Checking environment..."
if [ ! -f .env ]; then
    echo "Creating .env file template..."
    cat > .env << 'EOF'
PRIVATE_KEY=your_private_key_here_without_0x
USDC_ADDRESS=0x3600000000000000000000000000000000000000
RPC_URL=https://rpc.testnet.arc.network
CHAIN_ID=5042002
EOF
    echo ""
    echo "⚠️  .env file created! Please edit it with your private key."
    echo "Then run this script again."
    exit 1
fi

# Load .env
source .env

if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" == "your_private_key_here_without_0x" ]; then
    echo "⚠️  ERROR: PRIVATE_KEY not set in .env file!"
    echo "Please edit .env and set your private key (without 0x prefix)"
    exit 1
fi

echo "✓ Environment configured"
echo "USDC Address: ${USDC_ADDRESS:-0x3600000000000000000000000000000000000000}"
echo "RPC URL: ${RPC_URL:-https://rpc.testnet.arc.network}"
echo ""

# Step 5: Deploy
echo "Step 5: Deploying TrancheVault..."
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
echo "📝 Next steps:"
echo "1. Note the deployed addresses from the output above"
echo "2. Update lib/procti/addresses.ts in the frontend"
echo "3. Update CONTRACT_ADDRESSES.md with new addresses"
echo ""

