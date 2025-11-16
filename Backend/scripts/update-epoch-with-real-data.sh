#!/bin/bash

# Script to fetch real chain data and update epoch
# Usage: ./Backend/scripts/update-epoch-with-real-data.sh

echo "🔄 Fetching real-time chain data and updating epoch..."

# Fetch chain data
NODE_DATA=$(node Backend/scripts/fetch-chain-data.js 2>&1 | grep -A 3 "Ready for updateEpoch" | tail -n 3)

# Extract scores (this is a simple example - in production, parse JSON properly)
YIELD_SCORE=$(echo "$NODE_DATA" | grep -o '"yieldScore": [0-9]*' | grep -o '[0-9]*')
SECURITY_SCORE=$(echo "$NODE_DATA" | grep -o '"securityScore": [0-9]*' | grep -o '[0-9]*')
LIQUIDITY_SCORE=$(echo "$NODE_DATA" | grep -o '"liquidityScore": [0-9]*' | grep -o '[0-9]*')

if [ -z "$YIELD_SCORE" ] || [ -z "$SECURITY_SCORE" ] || [ -z "$LIQUIDITY_SCORE" ]; then
    echo "❌ Failed to fetch scores. Using defaults."
    YIELD_SCORE=5000
    SECURITY_SCORE=7000
    LIQUIDITY_SCORE=6000
fi

echo "📊 Scores:"
echo "  Yield: $YIELD_SCORE"
echo "  Security: $SECURITY_SCORE"
echo "  Liquidity: $LIQUIDITY_SCORE"

# Update epoch using forge script
echo ""
echo "🚀 Updating epoch on-chain..."

forge script script/UpdateEpoch.s.sol:UpdateEpoch \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  --sig "run(uint256,uint256,uint256)" $YIELD_SCORE $SECURITY_SCORE $LIQUIDITY_SCORE

echo "✅ Done!"

