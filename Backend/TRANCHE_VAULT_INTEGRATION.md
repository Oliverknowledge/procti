# TrancheVault Frontend Integration Guide

## Quick Start

### 1. Get Contract Address

After deployment, get the TrancheVault address from `CONTRACT_ADDRESSES.md` or deployment output.

### 2. Import ABIs

Copy `TrancheVault.json` from `/Backend/abi` folder after running:
```bash
cd Backend
forge build
./scripts/copy-abis.ps1  # Windows
# or
./scripts/copy-abis.sh   # Linux/Mac
```

### 3. Connect to Contract

```javascript
import { ethers } from 'ethers';
import TrancheVaultABI from './abi/TrancheVault.json';

const VAULT_ADDRESS = "0x..."; // Your deployed address
const USDC_ADDRESS = "0x...";  // USDC token address

const vault = new ethers.Contract(VAULT_ADDRESS, TrancheVaultABI, signer);
const usdc = new ethers.Contract(USDC_ADDRESS, IERC20ABI, signer);
```

## Core Functions

### Deposit into Tranche

```javascript
async function depositToTranche(amountInUSDC, trancheType) {
  // Tranche types: 0 = Senior, 1 = Mezz, 2 = Junior
  const amount = ethers.parseUnits(amountInUSDC.toString(), 6); // USDC uses 6 decimals
  
  // Approve first
  const approveTx = await usdc.approve(VAULT_ADDRESS, amount);
  await approveTx.wait();
  
  // Deposit
  const depositTx = await vault.deposit(amount, trancheType);
  await depositTx.wait();
  
  console.log(`Deposited ${amountInUSDC} USDC into tranche ${trancheType}`);
}
```

### Withdraw from Tranche

```javascript
async function withdrawFromTranche(trancheType) {
  // Get user's shares
  const shares = await vault.getUserShares(userAddress, trancheType);
  
  if (shares === 0n) {
    console.log("No shares to withdraw");
    return;
  }
  
  // Withdraw
  const withdrawTx = await vault.withdraw(shares, trancheType);
  await withdrawTx.wait();
  
  console.log(`Withdrew from tranche ${trancheType}`);
}
```

### Get User Position

```javascript
async function getUserPosition(userAddress, trancheType) {
  const shares = await vault.getUserShares(userAddress, trancheType);
  const value = await vault.getUserValue(userAddress, trancheType);
  const sharePrice = await vault.getSharePrice(trancheType);
  
  return {
    shares: shares.toString(),
    valueUSDC: ethers.formatUnits(value, 6),
    sharePrice: ethers.formatUnits(sharePrice, 18)
  };
}
```

### Get All Tranche Values

```javascript
async function getTrancheValues() {
  const [seniorValue, mezzValue, juniorValue] = await vault.getTrancheValues();
  const totalValue = await vault.totalVaultValue();
  
  return {
    senior: ethers.formatUnits(seniorValue, 6),
    mezz: ethers.formatUnits(mezzValue, 6),
    junior: ethers.formatUnits(juniorValue, 6),
    total: ethers.formatUnits(totalValue, 6)
  };
}
```

## Event Listening

### Listen for Deposits

```javascript
vault.on("Deposit", (user, amount, tranche, shares, event) => {
  console.log(`Deposit: User ${user} deposited ${ethers.formatUnits(amount, 6)} USDC`);
  console.log(`Tranche: ${tranche}, Shares: ${shares.toString()}`);
  
  // Update UI
  updateUserBalance(user, tranche);
});
```

### Listen for Withdrawals

```javascript
vault.on("Withdraw", (user, amount, tranche, shares, event) => {
  console.log(`Withdraw: User ${user} withdrew ${ethers.formatUnits(amount, 6)} USDC`);
  console.log(`Tranche: ${tranche}, Shares: ${shares.toString()}`);
  
  // Update UI
  updateUserBalance(user, tranche);
});
```

### Listen for Epoch Updates

```javascript
vault.on("EpochUpdated", (
  yieldScore,
  securityScore,
  liquidityScore,
  delta,
  seniorDelta,
  mezzDelta,
  juniorDelta,
  event
) => {
  console.log("Epoch Updated!");
  console.log(`Scores: Yield=${yieldScore}, Security=${securityScore}, Liquidity=${liquidityScore}`);
  console.log(`Delta: ${delta.toString()}`);
  console.log(`Tranche Deltas: Senior=${seniorDelta}, Mezz=${mezzDelta}, Junior=${juniorDelta}`);
  
  // Update UI with new tranche values
  refreshTrancheValues();
});
```

### Listen for Loss Events

```javascript
vault.on("LossApplied", (amount, juniorLoss, mezzLoss, seniorLoss, event) => {
  console.log("Loss Applied!");
  console.log(`Total Loss: ${ethers.formatUnits(amount, 6)} USDC`);
  console.log(`Junior Loss: ${ethers.formatUnits(juniorLoss, 6)} USDC`);
  console.log(`Mezz Loss: ${ethers.formatUnits(mezzLoss, 6)} USDC`);
  console.log(`Senior Loss: ${ethers.formatUnits(seniorLoss, 6)} USDC`);
  
  // Update UI to show loss impact
  showLossNotification(juniorLoss, mezzLoss, seniorLoss);
});
```

## UI Components

### Tranche Selection

```javascript
const TRANCHES = [
  { id: 0, name: "Senior", description: "Low risk, low yield", color: "green" },
  { id: 1, name: "Mezzanine", description: "Medium risk/yield", color: "yellow" },
  { id: 2, name: "Junior", description: "High risk, first-loss", color: "red" }
];
```

### Display User Positions

```javascript
async function displayUserPositions(userAddress) {
  const positions = await Promise.all(
    TRANCHES.map(async (tranche) => {
      const position = await getUserPosition(userAddress, tranche.id);
      return {
        ...tranche,
        ...position
      };
    })
  );
  
  return positions;
}
```

### Display Tranche Stats

```javascript
async function displayTrancheStats() {
  const values = await getTrancheValues();
  
  const stats = await Promise.all(
    TRANCHES.map(async (tranche, index) => {
      const value = [values.senior, values.mezz, values.junior][index];
      const sharePrice = await vault.getSharePrice(tranche.id);
      
      return {
        ...tranche,
        value,
        sharePrice: ethers.formatUnits(sharePrice, 18),
        percentage: (parseFloat(value) / parseFloat(values.total) * 100).toFixed(2)
      };
    })
  );
  
  return stats;
}
```

## Example React Component

```jsx
import { useState, useEffect } from 'react';
import { useAccount, useContractRead } from 'wagmi';

function TrancheDashboard() {
  const { address } = useAccount();
  const [tranches, setTranches] = useState([]);
  
  // Get tranche values
  const { data: trancheValues } = useContractRead({
    address: VAULT_ADDRESS,
    abi: TrancheVaultABI,
    functionName: 'getTrancheValues',
    watch: true
  });
  
  // Get user positions
  useEffect(() => {
    if (address) {
      loadUserPositions();
    }
  }, [address]);
  
  async function loadUserPositions() {
    const positions = await displayUserPositions(address);
    setTranches(positions);
  }
  
  return (
    <div>
      <h2>Tranche Vault</h2>
      {tranches.map(tranche => (
        <div key={tranche.id}>
          <h3>{tranche.name}</h3>
          <p>Your Shares: {tranche.shares}</p>
          <p>Your Value: {tranche.valueUSDC} USDC</p>
          <p>Share Price: {tranche.sharePrice}</p>
        </div>
      ))}
    </div>
  );
}
```

## Important Notes

1. **USDC uses 6 decimals** - Always use `parseUnits(value, 6)` and `formatUnits(value, 6)`
2. **Share prices use 18 decimals** - Use `formatUnits(sharePrice, 18)` for display
3. **Tranche enum values**: 0 = Senior, 1 = Mezz, 2 = Junior
4. **Virtual values** may differ from real USDC held - this is by design
5. **Epoch updates** are owner-only - frontend can only read, not trigger
6. **Loss events** are automatic when security score < 3000 (30%)

## Error Handling

```javascript
async function safeDeposit(amount, tranche) {
  try {
    // Check balance
    const balance = await usdc.balanceOf(userAddress);
    const amountWei = ethers.parseUnits(amount.toString(), 6);
    
    if (balance < amountWei) {
      throw new Error("Insufficient USDC balance");
    }
    
    // Check allowance
    const allowance = await usdc.allowance(userAddress, VAULT_ADDRESS);
    if (allowance < amountWei) {
      // Approve
      const approveTx = await usdc.approve(VAULT_ADDRESS, amountWei);
      await approveTx.wait();
    }
    
    // Deposit
    const tx = await vault.deposit(amountWei, tranche);
    await tx.wait();
    
    return { success: true };
  } catch (error) {
    console.error("Deposit failed:", error);
    return { success: false, error: error.message };
  }
}
```

## Testing with MockScoringContract

If you deployed MockScoringContract, you can test epoch updates:

```javascript
const scoring = new ethers.Contract(SCORING_ADDRESS, MockScoringContractABI, ownerSigner);

// Set positive scenario
await scoring.setPositiveScenario();

// Get scores
const [yieldScore, securityScore, liquidityScore] = await scoring.getScores();

// Update epoch (owner only)
await vault.updateEpoch(yieldScore, securityScore, liquidityScore);
```

