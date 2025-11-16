# TrancheVault - Structured Vault System

## Overview

TrancheVault is a DeFi smart contract system implementing a **Tranche-Based USDC Structured Vault** with three risk layers:

- **Senior Tranche**: Low risk, low yield
- **Mezzanine Tranche**: Medium risk/yield
- **Junior Tranche**: High risk, first-loss protection

The vault holds real USDC on Arc blockchain but maintains **virtual multi-chain exposure** modeled by scoring data (yield, security, liquidity). All returns and losses are applied virtually - USDC never leaves Arc.

## Architecture

### Core Components

1. **TrancheVault.sol** - Main contract with all vault logic
2. **MockScoringContract.sol** - Mock scoring oracle for testing

### Key Features

- ✅ Three-tier tranche structure (Senior, Mezzanine, Junior)
- ✅ Share-based deposit/withdraw system
- ✅ Epoch update system with scoring-based returns
- ✅ Loss waterfall (Junior → Mezz → Senior)
- ✅ Virtual value tracking (separate from real USDC)
- ✅ Comprehensive events for frontend integration
- ✅ Access control (owner-only epoch updates)

## Contract Structure

### Storage

```solidity
enum Tranche { Senior, Mezz, Junior }

struct UserPosition {
    uint256 shares;
}

struct TrancheState {
    uint256 totalShares;
    uint256 virtualValue;
}

mapping(address => UserPosition) public seniorPositions;
mapping(address => UserPosition) public mezzPositions;
mapping(address => UserPosition) public juniorPositions;

TrancheState public senior;
TrancheState public mezz;
TrancheState public junior;
```

## Functions

### Deposit

```solidity
function deposit(uint256 amount, Tranche t) external
```

- User chooses a tranche (Senior, Mezz, or Junior)
- User deposits USDC
- System mints shares based on current tranche share price
- First depositor sets seed values (1:1 ratio)
- Subsequent depositors: `shares = amount * totalShares / virtualValue`

### Withdraw

```solidity
function withdraw(uint256 shares, Tranche t) external
```

- Burns shares
- Converts shares into virtual USDC: `userValue = shares * virtualValue / totalShares`
- Transfers real USDC to user
- Updates virtual value

### Epoch Update

```solidity
function updateEpoch(
    uint256 yieldScore,
    uint256 securityScore,
    uint256 liquidityScore
) external onlyOwner
```

**Scoring System:**
- Scores range from 0-10000 (0% to 100%)
- Combined score: `(yieldScore * 40 + securityScore * 40 + liquidityScore * 20) / 100`
- Baseline: 5000 (50%)
- Delta: `combinedScore - 5000`

**Return Multipliers:**
- Senior: `delta * 50 / 1000` (5% of delta)
- Mezz: `delta * 100 / 1000` (10% of delta)
- Junior: `delta * 200 / 1000` (20% of delta)

**Loss Events:**
- If `securityScore < 3000` (30%), triggers loss waterfall
- Loss amount: `(3000 - securityScore) * totalVaultValue / 3000`

### Loss Waterfall

```solidity
function applyLoss(uint256 lossAmount) public onlyOwner
```

Loss distribution order:
1. **Junior** absorbs loss first
2. If loss exceeds Junior value, **Mezz** absorbs remainder
3. If loss still exceeds, **Senior** absorbs final remainder (bounded at zero)

### View Functions

```solidity
// Get all tranche virtual values
function getTrancheValues() public view returns (uint256, uint256, uint256)

// Get user's virtual USDC value in a tranche
function getUserValue(address user, Tranche t) public view returns (uint256)

// Get total virtual vault value
function totalVaultValue() public view returns (uint256)

// Get user's shares in a tranche
function getUserShares(address user, Tranche t) public view returns (uint256)

// Get share price for a tranche
function getSharePrice(Tranche t) public view returns (uint256)
```

## Events

```solidity
event Deposit(address indexed user, uint256 amount, Tranche tranche, uint256 shares);
event Withdraw(address indexed user, uint256 amount, Tranche tranche, uint256 shares);
event EpochUpdated(
    uint256 yieldScore,
    uint256 securityScore,
    uint256 liquidityScore,
    int256 delta,
    int256 seniorDelta,
    int256 mezzDelta,
    int256 juniorDelta
);
event LossApplied(uint256 amount, uint256 juniorLoss, uint256 mezzLoss, uint256 seniorLoss);
```

## Testing

Run the test suite:

```bash
forge test --match-contract TrancheVaultTest -vvv
```

### Test Coverage

- ✅ Deposit logic (first and subsequent deposits)
- ✅ Withdraw logic
- ✅ Epoch updates (positive, negative, neutral)
- ✅ Loss waterfall (Junior only, Junior+Mezz, all tranches)
- ✅ Share price calculations
- ✅ Access control
- ✅ Edge cases

## Deployment

### Prerequisites

1. Set environment variables:
```bash
export PRIVATE_KEY=<your_private_key>
export USDC_ADDRESS=<usdc_token_address>
```

### Deploy

```bash
forge script script/DeployTrancheVault.s.sol:DeployTrancheVault \
  --rpc-url <rpc_url> \
  --broadcast \
  --verify
```

### Example (Arc Testnet)

```bash
forge script script/DeployTrancheVault.s.sol:DeployTrancheVault \
  --rpc-url https://rpc.testnet.arc.network \
  --broadcast \
  --verify
```

## Frontend Integration

### Connect to Contract

```javascript
import { ethers } from 'ethers';
import TrancheVaultABI from './abi/TrancheVault.json';

const vault = new ethers.Contract(
  vaultAddress,
  TrancheVaultABI,
  signer
);
```

### Deposit

```javascript
const amount = ethers.parseUnits("1000", 6); // 1000 USDC
const tranche = 0; // 0 = Senior, 1 = Mezz, 2 = Junior

// Approve first
await usdc.approve(vaultAddress, amount);

// Deposit
await vault.deposit(amount, tranche);
```

### Withdraw

```javascript
const shares = await vault.getUserShares(userAddress, tranche);
await vault.withdraw(shares, tranche);
```

### Get User Value

```javascript
const userValue = await vault.getUserValue(userAddress, tranche);
const valueInUSDC = ethers.formatUnits(userValue, 6);
```

### Get Tranche Values

```javascript
const [seniorValue, mezzValue, juniorValue] = await vault.getTrancheValues();
```

### Update Epoch (Owner Only)

```javascript
const yieldScore = 7000;      // 70%
const securityScore = 8000;   // 80%
const liquidityScore = 7500;   // 75%

await vault.updateEpoch(yieldScore, securityScore, liquidityScore);
```

### Listen to Events

```javascript
// Deposit event
vault.on("Deposit", (user, amount, tranche, shares, event) => {
  console.log(`User ${user} deposited ${amount} into tranche ${tranche}`);
});

// Epoch update event
vault.on("EpochUpdated", (yieldScore, securityScore, liquidityScore, delta, ...) => {
  console.log(`Epoch updated with delta: ${delta}`);
});

// Loss event
vault.on("LossApplied", (amount, juniorLoss, mezzLoss, seniorLoss) => {
  console.log(`Loss applied: ${amount}, Junior: ${juniorLoss}, Mezz: ${mezzLoss}, Senior: ${seniorLoss}`);
});
```

## Scoring System

### Score Ranges

- **0-10000**: Represents 0% to 100%
- **5000**: Baseline (50% - neutral)
- **> 5000**: Positive returns
- **< 5000**: Negative returns

### Example Scenarios

**Positive Scenario:**
- Yield: 7000 (70%)
- Security: 8000 (80%)
- Liquidity: 7500 (75%)
- Combined: 7500
- Delta: +2500
- Senior gets: +125 (5% of 2500)
- Mezz gets: +250 (10% of 2500)
- Junior gets: +500 (20% of 2500)

**Negative Scenario:**
- Yield: 3000 (30%)
- Security: 4000 (40%)
- Liquidity: 3500 (35%)
- Combined: 3500
- Delta: -1500
- Senior loses: -75 (5% of 1500)
- Mezz loses: -150 (10% of 1500)
- Junior loses: -300 (20% of 1500)

**Loss Event:**
- Security: 2000 (20%) < 3000 (30% threshold)
- Triggers loss waterfall
- Loss amount calculated based on security deficit

## Security Considerations

1. **Access Control**: Only owner can update epochs and apply losses
2. **Input Validation**: All scores must be <= 10000
3. **Overflow Protection**: Solidity 0.8.x built-in overflow checks
4. **Loss Bounds**: Virtual values bounded at zero (cannot go negative)
5. **Share Price**: First depositor sets 1:1 ratio, subsequent depositors get proportional shares

## Gas Optimization

- Uses storage efficiently with structs
- Minimal external calls
- Events for off-chain indexing
- View functions for frontend queries

## License

MIT

