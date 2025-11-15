# Testing Guide - CCTP Cross-Chain Bridge

## Prerequisites

1. **Wallet Connected**: MetaMask or another wallet that supports multi-chain
2. **USDC on Source Chain**: You need USDC on one of the CCTP-supported chains
3. **Network Added**: Make sure your wallet has the destination chain added

## ⚠️ Important: CCTP Requires Mainnet or Testnet USDC

**CCTP only works on mainnet chains or specific testnets with CCTP support.**

If you only have USDC on Arc Testnet, you have two options:

### Option 1: Get Testnet USDC on CCTP-Supported Testnets

1. **Visit Circle's Testnet Faucet**: https://faucet.circle.com
2. **Request Testnet USDC**:
   - You can request 10 USDC per testnet every 24 hours
   - Supported testnets: Sepolia, Base Sepolia, Arbitrum Sepolia (if CCTP is available)
3. **Switch Your Wallet**:
   - Add the testnet to your wallet (e.g., Sepolia, Base Sepolia)
   - Switch to that network
   - You should see the testnet USDC in your wallet
4. **Test the Bridge**:
   - Use the bridge component with testnet USDC
   - Note: CCTP may have limited testnet support

### Option 2: Use Mainnet (Requires Real USDC)

1. **Get Real USDC** on a mainnet chain:
   - Buy USDC on Coinbase, Binance, or another exchange
   - Bridge USDC from another chain
   - Use a DEX to swap for USDC
2. **Connect to Mainnet**:
   - Switch wallet to Ethereum, Base, Arbitrum, Optimism, Avalanche, or Polygon
   - Make sure you have USDC and ETH for gas
3. **Test the Bridge**:
   - The bridge will work with real USDC
   - Transactions will cost real gas fees

### Option 3: Demo the UI Flow (No Real Bridging)

If you just want to see how the UI works:
1. The bridge component will show you the interface
2. You can see the flow and steps
3. The button will be disabled if CCTP is not available
4. This is useful for demos/presentations

## CCTP-Supported Chains

### Mainnet (Full CCTP Support)
- ✅ Ethereum Mainnet (Chain ID: 1)
- ✅ Base (Chain ID: 8453)
- ✅ Arbitrum (Chain ID: 42161)
- ✅ Optimism (Chain ID: 10)
- ✅ Avalanche (Chain ID: 43114)
- ✅ Polygon (Chain ID: 137)

### Testnets (Limited Support)
- ⚠️ Sepolia (Ethereum testnet) - May have CCTP testnet contracts
- ⚠️ Base Sepolia - May have CCTP testnet contracts
- ⚠️ Arbitrum Sepolia - May have CCTP testnet contracts

**Note**: 
- Arc Testnet (Chain ID: 5042002) does NOT support CCTP
- CCTP testnet support may be limited - check Circle's documentation
- For full functionality, use mainnet chains

## Step-by-Step Testing Instructions

### Option 1: Test with USDC from Vault (Recommended)

1. **Connect Your Wallet**
   - Click "Connect Wallet" button
   - Connect to a CCTP-supported chain (e.g., Ethereum, Base, Arbitrum)

2. **Deposit USDC into Vault** (if you haven't already)
   - Go to "Actions" panel
   - Enter amount to deposit
   - Click "Deposit USDC"
   - Approve USDC if prompted
   - Confirm deposit transaction

3. **Navigate to Bridge Component**
   - Scroll to "Enhanced Cross-Chain Features" section
   - Find "Cross-Chain Bridge (CCTP)" component

4. **Select Chains**
   - **From Chain**: Select the chain where your vault balance is (or any CCTP-supported chain)
   - **To Chain**: Select a different CCTP-supported chain (e.g., if From = Ethereum, To = Base)

5. **Enter Amount**
   - Enter the amount of USDC you want to bridge
   - The bridge fee will be calculated automatically

6. **Review Bridge Info**
   - Check the blue info box - it should show "✓ Using Circle's CCTP"
   - Review the steps: Withdraw → Burn → Attestation → Switch → Mint

7. **Click "Bridge"**
   - The process will:
     - Step 1: Withdraw USDC from vault
     - Step 2: Burn USDC on source chain (CCTP)
     - Step 3: Wait for Circle attestation (2-5 minutes)
     - Step 4: Automatically switch to destination chain
     - Step 5: Mint USDC on destination chain

### Option 2: Test with Wallet USDC (Direct)

1. **Get USDC on a CCTP-Supported Chain**
   - You can buy USDC on a DEX or bridge it from another chain
   - Make sure you have USDC on Ethereum, Base, Arbitrum, Optimism, Avalanche, or Polygon

2. **Connect Wallet to Source Chain**
   - Switch your wallet to the chain where you have USDC
   - Example: If you have USDC on Base, connect to Base

3. **Use Bridge Component**
   - Select source chain (where your USDC is)
   - Select destination chain
   - Enter amount
   - Click "Bridge"

   **Note**: This will bridge directly from your wallet, not from the vault.

## What to Expect During Testing

### Transaction Flow:

1. **Withdraw Transaction** (if bridging from vault)
   - Gas cost: ~50k-100k gas
   - Time: ~15-30 seconds

2. **Approve USDC** (if first time)
   - Gas cost: ~45k gas
   - Time: ~15-30 seconds

3. **Burn Transaction** (CCTP depositForBurn)
   - Gas cost: ~100k-150k gas
   - Time: ~15-30 seconds
   - This burns your USDC on the source chain

4. **Attestation Wait** (Circle's Service)
   - Time: **2-5 minutes** (this is the longest step)
   - You'll see status updates: "Waiting for Circle attestation..."
   - The UI will poll Circle's API every 2-30 seconds

5. **Network Switch** (Automatic)
   - Your wallet will prompt to switch networks
   - Approve the network switch
   - Time: ~5-10 seconds

6. **Mint Transaction** (CCTP receiveMessage)
   - Gas cost: ~100k-150k gas
   - Time: ~15-30 seconds
   - This mints USDC on the destination chain

### Total Time: ~3-7 minutes
### Total Gas: ~300k-400k gas (2-3 transactions)

## Testing Checklist

- [ ] Wallet connected to a CCTP-supported chain
- [ ] Have USDC on source chain (either in wallet or vault)
- [ ] Selected valid source and destination chains (both CCTP-supported)
- [ ] Entered valid amount (less than available balance)
- [ ] Bridge button is enabled (not grayed out)
- [ ] Blue info box shows "✓ Using Circle's CCTP"
- [ ] Ready to wait 2-5 minutes for attestation

## Common Issues & Solutions

### Issue: "CCTP is not available on [Chain]"
**Solution**: Make sure both chains are CCTP-supported. Arc Testnet doesn't support CCTP - use mainnet chains.

### Issue: Bridge button is disabled
**Possible Causes**:
- One or both chains don't support CCTP
- No amount entered
- Chains not selected
- Currently bridging (wait for completion)

### Issue: "Insufficient balance"
**Solution**: Make sure you have enough USDC on the source chain. Check your vault balance or wallet balance.

### Issue: Attestation taking too long
**Solution**: This is normal. Circle's attestation service can take 2-5 minutes. The UI will keep polling. If it takes longer than 10 minutes, there may be an issue with Circle's service.

### Issue: Network switch failed
**Solution**: 
- Make sure the destination chain is added to your wallet
- Manually switch networks if automatic switch fails
- Then complete the mint transaction manually (if needed)

## Testing on Different Chains

### Test Ethereum → Base
1. Connect to Ethereum
2. Have USDC on Ethereum
3. Select From: Ethereum, To: Base
4. Bridge

### Test Base → Arbitrum
1. Connect to Base
2. Have USDC on Base
3. Select From: Base, To: Arbitrum
4. Bridge

### Test Arbitrum → Optimism
1. Connect to Arbitrum
2. Have USDC on Arbitrum
3. Select From: Arbitrum, To: Optimism
4. Bridge

## Verification Steps

After bridging, verify the transfer:

1. **Check Destination Chain Balance**
   - Switch to destination chain in your wallet
   - Check your USDC balance
   - Should see the bridged amount (minus fees)

2. **Check Transaction History**
   - View transactions on block explorer:
     - Ethereum: https://etherscan.io
     - Base: https://basescan.org
     - Arbitrum: https://arbiscan.io
     - Optimism: https://optimistic.etherscan.io

3. **Check Vault Balance** (if bridged from vault)
   - Vault balance should decrease by the bridged amount
   - Chain balance breakdown should update

## Tips for Testing

1. **Start Small**: Test with a small amount first (e.g., 1-10 USDC)
2. **Check Gas Prices**: Make sure you have enough ETH for gas on both chains
3. **Be Patient**: Attestation can take 2-5 minutes - don't close the browser
4. **Monitor Console**: Open browser console to see detailed status updates
5. **Test Different Routes**: Try different chain combinations to ensure it works

## Expected Console Output

You should see logs like:
```
CCTP Status: Checking allowance...
CCTP Status: Burning USDC on source chain...
CCTP Status: Waiting for burn transaction confirmation...
CCTP Status: Extracting message from transaction...
CCTP Status: Waiting for Circle attestation (this may take a few minutes)...
Attestation not ready yet (attempt 1/30). Waiting 2000ms...
CCTP Status: Switching to Base...
CCTP Status: Completing transfer on destination chain...
CCTP Status: Transfer completed successfully!
```

## Troubleshooting

If something goes wrong:

1. **Check Browser Console**: Look for error messages
2. **Check Wallet**: Make sure transactions are confirmed
3. **Check Circle's Status**: Visit Circle's status page if attestations are delayed
4. **Retry**: If attestation times out, you may need to manually complete the transfer on the destination chain

## Need Help?

- Check the console for detailed error messages
- Verify both chains support CCTP
- Make sure you have sufficient gas on both chains
- Ensure you have enough USDC balance

