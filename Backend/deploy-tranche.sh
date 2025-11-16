#!/bin/bash

# Deployment script for TrancheVault on Arc Testnet
# This script handles the complete deployment process

set -e  # Exit on error

echo "=========================================="
echo "TrancheVault Deployment Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    echo "Creating .env template..."
    cat > .env << EOF
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# USDC address on Arc Testnet
# Use existing USDC or deploy MockUSDC first
USDC_ADDRESS=0x3600000000000000000000000000000000000000

# RPC URL for Arc Testnet
RPC_URL=https://rpc.testnet.arc.network

# Chain ID
CHAIN_ID=5042002
EOF
    echo -e "${RED}Please edit .env file with your private key and USDC address${NC}"
    echo "Then run this script again."
    exit 1
fi

# Load environment variables
source .env

# Check if PRIVATE_KEY is set
if [ -z "$PRIVATE_KEY" ] || [ "$PRIVATE_KEY" == "your_private_key_here" ]; then
    echo -e "${RED}Error: PRIVATE_KEY not set in .env file${NC}"
    exit 1
fi

# Check if USDC_ADDRESS is set
if [ -z "$USDC_ADDRESS" ] || [ "$USDC_ADDRESS" == "0x0000000000000000000000000000000000000000" ]; then
    echo -e "${YELLOW}Warning: USDC_ADDRESS not set. Will deploy MockUSDC first.${NC}"
    DEPLOY_MOCK_USDC=true
else
    DEPLOY_MOCK_USDC=false
fi

# Step 1: Install forge-std if needed
echo -e "${GREEN}Step 1: Checking forge-std installation...${NC}"
if [ ! -d "lib/forge-std/src" ] || [ -z "$(ls -A lib/forge-std/src 2>/dev/null)" ]; then
    echo "Installing forge-std..."
    forge install foundry-rs/forge-std --no-commit
    echo -e "${GREEN}✓ forge-std installed${NC}"
else
    echo -e "${GREEN}✓ forge-std already installed${NC}"
fi
echo ""

# Step 2: Build contracts
echo -e "${GREEN}Step 2: Building contracts...${NC}"
forge build
echo -e "${GREEN}✓ Contracts built successfully${NC}"
echo ""

# Step 3: Copy ABIs
echo -e "${GREEN}Step 3: Copying ABIs...${NC}"
if [ -f "scripts/copy-abis.sh" ]; then
    chmod +x scripts/copy-abis.sh
    ./scripts/copy-abis.sh
    echo -e "${GREEN}✓ ABIs copied${NC}"
else
    echo -e "${YELLOW}Warning: copy-abis.sh not found, skipping ABI copy${NC}"
fi
echo ""

# Step 4: Deploy MockUSDC if needed
if [ "$DEPLOY_MOCK_USDC" = true ]; then
    echo -e "${GREEN}Step 4: Deploying MockUSDC...${NC}"
    forge script script/DeployMockUSDC.s.sol:DeployMockUSDC \
        --rpc-url "${RPC_URL:-https://rpc.testnet.arc.network}" \
        --broadcast \
        --verify \
        --etherscan-api-key "${ETHERSCAN_API_KEY:-}" \
        -vvv
    
    # Extract deployed address from output (this is a simplified approach)
    echo -e "${YELLOW}Please note the MockUSDC address from the output above${NC}"
    echo -e "${YELLOW}Update USDC_ADDRESS in .env file and run this script again${NC}"
    exit 0
fi

# Step 5: Deploy TrancheVault
echo -e "${GREEN}Step 5: Deploying TrancheVault...${NC}"
echo "USDC Address: $USDC_ADDRESS"
echo "RPC URL: ${RPC_URL:-https://rpc.testnet.arc.network}"
echo ""

forge script script/DeployTrancheVault.s.sol:DeployTrancheVault \
    --rpc-url "${RPC_URL:-https://rpc.testnet.arc.network}" \
    --broadcast \
    --verify \
    --etherscan-api-key "${ETHERSCAN_API_KEY:-}" \
    -vvv

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Note the deployed contract addresses from the output above"
echo "2. Update lib/procti/addresses.ts in the frontend with the new addresses"
echo "3. Update CONTRACT_ADDRESSES.md with the deployed addresses"
echo "4. Copy TrancheVault.json ABI to frontend abi/ folder if needed"
echo ""

