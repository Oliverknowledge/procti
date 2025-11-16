# Deploy TrancheVault to Arc Testnet

## Prerequisites

1. **Foundry installed** - Check with: `forge --version`
2. **Private key** - Your deployer wallet private key (without 0x prefix)
3. **USDC address** - Use existing USDC: `0x3600000000000000000000000000000000000000` (Arc Testnet)

## Quick Deployment (Git Bash)

### Step 1: Install forge-std

```bash
cd Backend
forge install foundry-rs/forge-std --no-commit
```

### Step 2: Build Contracts

```bash
forge build
```

### Step 3: Copy ABIs

```bash
chmod +x scripts/copy-abis.sh
./scripts/copy-abis.sh
```

### Step 4: Set Environment Variables

Create a `.env` file in the `Backend` directory:

```bash
cat > .env << 'EOF'
PRIVATE_KEY=your_private_key_here_without_0x
USDC_ADDRESS=0x3600000000000000000000000000000000000000
RPC_URL=https://rpc.testnet.arc.network
CHAIN_ID=5042002
EOF
```

**⚠️ IMPORTANT:** Replace `your_private_key_here_without_0x` with your actual private key!

### Step 5: Deploy TrancheVault

```bash
forge script script/DeployTrancheVault.s.sol:DeployTrancheVault \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  -vvv
```

### Step 6: Verify Deployment (Optional)

If you have an Etherscan API key:

```bash
forge script script/DeployTrancheVault.s.sol:DeployTrancheVault \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  --verify \
  --etherscan-api-key YOUR_API_KEY \
  -vvv
```

## Alternative: Use the Deployment Script

```bash
chmod +x deploy-tranche.sh
./deploy-tranche.sh
```

This script will:
1. Check/install forge-std
2. Build contracts
3. Copy ABIs
4. Deploy contracts
5. Show deployment summary

## After Deployment

1. **Note the deployed addresses** from the console output
2. **Update frontend addresses:**
   - Edit `lib/procti/addresses.ts`
   - Set `TRANCHE_VAULT_ADDRESS` to the deployed address
3. **Update ABI:**
   - Copy `Backend/abi/TrancheVault.json` to frontend `abi/` folder
   - Update `lib/procti/abi.ts` to import the actual ABI
4. **Update CONTRACT_ADDRESSES.md** with the new addresses

## Example Output

```
Deploying TrancheVault...
USDC Address: 0x3600000000000000000000000000000000000000
TrancheVault deployed at: 0x1234567890123456789012345678901234567890
MockScoringContract deployed at: 0x0987654321098765432109876543210987654321

=== Deployment Summary ===
TrancheVault: 0x1234567890123456789012345678901234567890
MockScoringContract: 0x0987654321098765432109876543210987654321
USDC: 0x3600000000000000000000000000000000000000
```

## Troubleshooting

### Error: forge-std not found
```bash
forge install foundry-rs/forge-std --no-commit
```

### Error: PRIVATE_KEY not set
Make sure your `.env` file exists and has `PRIVATE_KEY` set (without 0x prefix)

### Error: Insufficient funds
Make sure your deployer wallet has enough ETH for gas fees on Arc Testnet

### Error: Contract verification failed
Verification is optional. You can deploy without `--verify` flag.

