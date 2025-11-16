#!/bin/bash

# Build and Deploy SentinelVault Fix
# This script builds the contract and provides deployment instructions

echo "🔨 Building SentinelVault contract..."
forge build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📋 Next steps to deploy:"
    echo "1. Make sure your .env file has PRIVATE_KEY and RPC_URL set"
    echo "2. Run the deployment script:"
    echo "   forge script script/DeploySentinelVault.s.sol --rpc-url \$RPC_URL --broadcast --verify"
    echo ""
    echo "Or if you have a specific deployment script, use that instead."
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

