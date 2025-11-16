# How the TrancheVault Works - Simple Explanation

## 🎯 What It's Trying To Do

The TrancheVault is a **structured investment product** that:
1. **Takes real USDC deposits** from users
2. **Simulates multi-chain exposure** without actually moving USDC off Arc
3. **Distributes returns/losses** based on risk levels (Senior/Mezz/Junior)
4. **Uses virtual accounting** to track value changes

## 💰 Why Your Capital Doesn't Change (But Your Value Does)

### The Key Concept: **Virtual Values**

- **Real USDC**: Stays in the contract on Arc blockchain (never moves)
- **Virtual Value**: An accounting number that changes based on market conditions

### Example:

1. **You deposit 1000 USDC into Junior tranche**
   - Contract receives: **1000 USDC** (real, stays in contract)
   - You get: **1000 shares** (if first depositor)
   - Virtual value: **1000 USDC** (starts at 1:1)

2. **Epoch update with positive delta (+500)**
   - Real USDC in contract: **Still 1000 USDC** (unchanged!)
   - Virtual value: **Now 1500 USDC** (increased by 500)
   - Your shares: **Still 1000 shares**
   - **Your share price increased**: 1500/1000 = 1.5 USDC per share
   - **If you withdraw now**: You get 1500 USDC (even though only 1000 was deposited)

3. **Epoch update with negative delta (-200)**
   - Real USDC in contract: **Still 1000 USDC** (unchanged!)
   - Virtual value: **Now 1300 USDC** (decreased from 1500)
   - Your shares: **Still 1000 shares**
   - **Your share price decreased**: 1300/1000 = 1.3 USDC per share
   - **If you withdraw now**: You get 1300 USDC

### Why This Design?

- **Simulates multi-chain exposure** without bridge risks
- **Allows dynamic returns** based on market conditions
- **Protects capital** (real USDC stays safe on Arc)
- **Enables structured products** (different risk/return for each tranche)

## 📊 What is "Delta"?

**Delta** = The change in value based on market conditions

### How Delta is Calculated:

1. **Scores come in** (0-10000):
   - Yield Score: How much yield is available
   - Security Score: How safe the chains are
   - Liquidity Score: How liquid the markets are

2. **Combined Score** = `(yieldScore * 40% + securityScore * 40% + liquidityScore * 20%)`

3. **Delta** = `combinedScore - 5000`
   - If combinedScore = 6000 → delta = +1000 (positive returns)
   - If combinedScore = 4000 → delta = -1000 (losses)
   - If combinedScore = 5000 → delta = 0 (neutral)

4. **Tranche-Specific Deltas**:
   - Senior: `delta * 5%` (smallest change, safest)
   - Mezz: `delta * 10%` (medium change)
   - Junior: `delta * 20%` (largest change, riskiest)

### Example Calculation:

**Input Scores:**
- Yield: 7000 (70%)
- Security: 6000 (60%)
- Liquidity: 5000 (50%)

**Combined Score:**
```
(7000 * 40 + 6000 * 40 + 5000 * 20) / 100
= (280000 + 240000 + 100000) / 100
= 620000 / 100
= 6200
```

**Delta:**
```
delta = 6200 - 5000 = +1200 (positive!)
```

**Tranche Deltas:**
- Senior: 1200 * 5% = +60 USDC per 1000 USDC
- Mezz: 1200 * 10% = +120 USDC per 1000 USDC
- Junior: 1200 * 20% = +240 USDC per 1000 USDC

**Result:**
- If you had 1000 USDC in Junior, virtual value becomes 1240 USDC
- Your shares are now worth 24% more!
- But the real USDC in contract is still the same amount

## 🔄 The Flow

```
User Deposits 1000 USDC
    ↓
Contract holds 1000 USDC (real)
    ↓
User gets 1000 shares
    ↓
Virtual value = 1000 USDC
    ↓
Epoch Update (delta = +500)
    ↓
Virtual value = 1500 USDC (increased!)
    ↓
Share price = 1.5 USDC per share
    ↓
User withdraws → Gets 1500 USDC (real!)
```

**The magic**: The contract can pay out more than was deposited because:
- Other users may have deposited more
- The virtual value system allows the contract to track "gains" that would have happened if USDC was deployed across chains
- When you withdraw, you get your proportional share of the total real USDC based on your share ownership

## ⚠️ Important Notes

1. **Real USDC balance** = Sum of all deposits minus withdrawals
2. **Virtual value** = Real deposits + gains/losses from epochs
3. **Share price** = Virtual value / Total shares
4. **Your withdrawal value** = Your shares * Share price

If virtual value > real USDC balance:
- Early withdrawers get more than they deposited (gains!)
- Later withdrawers might get less if losses occur

If virtual value < real USDC balance:
- Everyone can withdraw their full amount
- Contract has "excess" USDC (from earlier gains)

## 🎯 The Goal

Simulate a multi-chain yield strategy where:
- USDC stays safe on Arc
- Returns are calculated based on real chain conditions
- Risk is distributed across tranches
- Users can enter/exit at any time based on share prices

