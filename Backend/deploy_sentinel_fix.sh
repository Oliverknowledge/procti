#!/bin/bash

# Deploy SentinelVault with rebalance fix
# This script deploys the updated SentinelVault contract

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Set default RPC URL if not provided
RPC_URL=${RPC_URL:-https://rpc.testnet.arc.network}

echo "🔨 Building contract..."
forge build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "📤 Deploying SentinelVault..."
echo "RPC URL: $RPC_URL"
echo ""

# Deploy without verification first (faster)
forge script script/DeploySentinelVault.s.sol \
    --rpc-url "$RPC_URL" \
    --broadcast \
    --private-key "$PRIVATE_KEY"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "⚠️  IMPORTANT: Update the SentinelVault address in:"
    echo "   config/contracts.ts"
    echo ""
    echo "   Replace the old address with the new one shown above."
else
    echo "❌ Deployment failed!"
    exit 1
fi

