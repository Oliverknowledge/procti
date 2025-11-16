# Procti - Complete Project Summary

## 🎯 Project Overview

**Procti** is a DeFi hackathon project featuring a **Tranche-Based USDC Structured Vault** deployed on the Arc blockchain. The system simulates multi-chain exposure while keeping all USDC on Arc, using virtual accounting to track returns and losses across three risk layers.

### Core Concept
- **Real USDC**: Stays on Arc blockchain (never moves)
- **Virtual Values**: Track multi-chain exposure and returns/losses
- **Three Risk Layers**: Senior (low risk), Mezzanine (medium), Junior (high risk)
- **Share-Based System**: Fair distribution of returns based on share ownership

---

## 🏗️ Architecture

### Backend (Smart Contracts)

#### 1. **TrancheVault.sol** - Main Contract
**Location**: `Backend/src/TrancheVault.sol`

**Core Features**:
- Three tranche system (Senior, Mezzanine, Junior)
- Share-based deposit/withdraw system
- Epoch update system with scoring-based returns
- Loss waterfall (Junior → Mezz → Senior)
- Fee system (0.5% deposit, 0.5% withdrawal)
- Reserve pool (accumulates fees + time-based yield)
- Time-based yield accrual (5% APY)

**Key Functions**:
- `deposit(uint256 amount, Tranche t)` - Deposit USDC into a tranche
- `withdraw(uint256 shares, Tranche t)` - Withdraw shares from a tranche
- `updateEpoch(uint256 yieldScore, uint256 securityScore, uint256 liquidityScore)` - Update epoch (owner only)
- `applyLoss(uint256 lossAmount)` - Apply loss using waterfall (owner only)
- `getTrancheValues()` - Get all tranche virtual values
- `getUserValue(address user, Tranche t)` - Get user's virtual USDC value
- `getSharePrice(Tranche t)` - Get current share price

**Scoring System**:
- **Yield Score** (0-10000): DeFi yield opportunities (40% weight)
- **Security Score** (0-10000): Protocol security/TVL health (40% weight)
- **Liquidity Score** (0-10000): DEX volume/liquidity depth (20% weight)
- **Combined Score**: `(yield * 40 + security * 40 + liquidity * 20) / 100`
- **Delta**: `combinedScore - 5000` (baseline is 5000)

**Return Multipliers**:
- Senior: `delta * 50 / 1000` (5% of delta) - Smallest changes
- Mezzanine: `delta * 100 / 1000` (10% of delta) - Medium changes
- Junior: `delta * 200 / 1000` (20% of delta) - Largest changes

**Loss Waterfall**:
- Triggers automatically if `securityScore < 3000` (30%)
- Loss hits Junior first (can go to zero)
- Then Mezzanine (if Junior exhausted)
- Then Senior (if Mezz exhausted, bounded at zero)

#### 2. **MockScoringContract.sol** - Testing Oracle
**Location**: `Backend/src/MockScoringContract.sol`
- Mock scoring oracle for testing
- Provides yield, security, and liquidity scores
- Helper functions for common scenarios

---

## 🎨 Frontend Features

### Pages

#### 1. **Root Page** (`app/page.tsx`)
- Landing page with project overview
- Navigation to Tranche Vault
- Wallet connection

#### 2. **Tranche Dashboard** (`app/tranches/page.tsx`)
- Main vault interface
- AI Assistant (primary interaction method)
- Vault overview
- Tranche cards (Senior, Mezzanine, Junior)
- Deposit/Withdraw panels (secondary)
- Epoch management (owner only)
- Event history table

#### 3. **AI Advisor Page** (`app/advisor/page.tsx`)
- Standalone AI Tranche Advisor
- Risk profile questionnaire
- Personalized tranche recommendations
- Allocation suggestions

### Components

#### Tranche Components (`components/tranches/`)
- **VaultOverview.tsx**: Total vault value, reserve pool, tranche distribution
- **TrancheCard.tsx**: Individual tranche display (value, APY, user position, risk level)
- **DepositPanel.tsx**: Deposit USDC into selected tranche
- **WithdrawPanel.tsx**: Withdraw shares from selected tranche
- **EpochPanel.tsx**: Admin panel for epoch updates (owner only)
- **HistoryTable.tsx**: Event history (Deposits, Withdrawals, Epoch Updates, Loss Events)

#### AI Components (`components/ai/`)
- **ConversationalAgent.tsx**: Primary interface - users interact with blockchain through chat
- **TrancheAdvisor.tsx**: AI-powered tranche recommendation system
- **AdvisorQuestions.tsx**: Risk profile questionnaire
- **AdvisorResult.tsx**: Displays AI recommendation with allocation breakdown
- **AgentActionPanel.tsx**: AI agent auto-action system (deposit execution)
- **AutonomousAgent.tsx**: Autonomous AI agent that monitors and acts independently

#### Other Components
- **ConnectWalletButton.tsx**: Wallet connection UI
- **VaultDashboard.tsx**: Overall vault status
- **MultiChainDashboard.tsx**: Multi-chain data visualization
- **ActiveChainDisplay.tsx**: Current chain and switching
- **ActionsPanel.tsx**: Various actions (deposit, withdraw, rebalance)
- **RiskProfile.tsx**: User risk profile settings

### Hooks

#### Contract Hooks
- **useProctiContract.ts**: Main contract interaction hook
  - `deposit(amount, tranche)`
  - `withdraw(shares, tranche)`
  - `updateEpoch(yieldScore, securityScore, liquidityScore)`
  - `estimateShares(amount, tranche)`
  - `isOwner` check

- **useTrancheData.ts**: Tranche data polling
  - Tranche values (Senior, Mezz, Junior)
  - Total vault value
  - Reserve pool
  - User positions (shares, value, share price)
  - Auto-refresh every 15 seconds

- **useEvents.ts**: Event listening
  - Deposit events
  - Withdraw events
  - EpochUpdated events
  - LossApplied events
  - Retry logic for rate limiting

- **useUSDC.ts**: USDC balance management

#### AI Hooks
- **useConversationalAgent.ts**: Conversational AI agent
  - Natural language processing
  - Action execution (deposit, withdraw, epoch update)
  - Context-aware responses
  - Error handling

- **useAIAdvisor.ts**: AI tranche advisor
  - Risk profile analysis
  - LLM-based recommendations (GPT-4o-mini)
  - Rule-based fallback
  - Allocation suggestions

- **useAIAgent.ts**: AI agent auto-action
  - Prepares deposit parameters
  - Integrates with existing deposit logic
  - Manual confirmation required

- **useAutonomousAgent.ts**: Autonomous agent
  - Monitors vault and market conditions
  - Makes strategic decisions
  - Executes actions automatically (with toggle)
  - Respects user preferences

#### Utility Hooks
- **useChainDataFetcher.ts**: Real-time chain data fetching
- **useCrossChainArb.ts**: Cross-chain arbitrage detection
- **useAutoRebalance.ts**: Automatic rebalancing logic
- **useOracleSync.ts**: Oracle synchronization

### Services

#### Chain Data Fetcher (`lib/services/chainDataFetcher.ts`)
- Fetches real DeFi data from DeFiLlama API
- **fetchYieldRates()**: Real USDC yields from multiple chains
- **fetchSecurityMetrics()**: Real TVL data for security scores
- **fetchLiquidityMetrics()**: Real DEX volume for liquidity scores
- **fetchChainData()**: Combined data with calculated scores
- Fallback mechanisms for API failures

---

## 🤖 AI Capabilities

### 1. Conversational AI Agent (Primary Interface)

**Location**: `components/ai/ConversationalAgent.tsx`

**Capabilities**:
- Natural language interaction with blockchain
- Understands commands like:
  - "deposit 100 USDC to senior"
  - "withdraw 50 from mezzanine"
  - "show my balance"
  - "update epoch with real data"
  - "simulate a positive epoch"
- Executes blockchain transactions on user's behalf
- Provides conversational responses
- Error handling and user feedback

**Supported Actions**:
- **DEPOSIT**: Deposit USDC into tranches
- **WITHDRAW**: Withdraw shares from tranches
- **UPDATE_EPOCH**: Update epoch with scores or real data
- **CHECK**: Check balances and positions
- **INFO**: Get information about vault
- **REBALANCE**: Rebalance portfolio (planned)

### 2. AI Tranche Advisor

**Location**: `components/ai/TrancheAdvisor.tsx`

**Capabilities**:
- Analyzes user risk profile (loss tolerance, time horizon, priority, experience)
- Uses GPT-4o-mini for sophisticated financial analysis
- Provides personalized tranche recommendations
- Suggests allocation percentages across tranches
- Explains reasoning behind recommendations
- Rule-based fallback if API key not configured

**Questions Asked**:
- Loss tolerance (None, A little, Moderate, High)
- Time horizon (Short-term, Medium-term, Long-term)
- Priority (Stability, Balanced growth, High returns)
- DeFi experience (Beginner, Intermediate, Advanced)

### 3. Autonomous AI Agent

**Location**: `components/ai/AutonomousAgent.tsx`

**Capabilities**:
- Monitors vault state and market conditions
- Makes strategic decisions using GPT-4
- Executes actions automatically (deposit, withdraw, rebalance)
- Respects user preferences (risk tolerance, time horizon, priority)
- Runs every 30 seconds when active
- Safety checks (confidence, urgency thresholds)
- Action history tracking

**Actions**:
- **DEPOSIT**: Automatically deposit into optimal tranche
- **WITHDRAW**: Withdraw when conditions warrant
- **REBALANCE**: Rebalance portfolio based on market conditions
- **WAIT**: Wait for better conditions
- **MONITOR**: Continue monitoring

---

## 🔑 Key Features

### 1. Virtual Value System
- Real USDC stays on Arc blockchain
- Virtual values track multi-chain exposure
- Share prices change based on virtual value
- Withdrawals use reserve pool if needed

### 2. Fee System
- **Deposit Fee**: 0.5% (50 basis points)
- **Withdrawal Fee**: 0.5% (50 basis points)
- Fees accumulate in reserve pool
- Reserve pool backs virtual gains

### 3. Time-Based Yield
- Accrues 5% APY to reserve pool
- Calculated between epochs
- Formula: `(totalValue * annualYield * timeElapsed) / (365 days * 10000)`
- Builds real USDC backing

### 4. Real Chain Data Integration
- Fetches real data from DeFiLlama API
- Real USDC yields from multiple chains
- Real TVL data for security metrics
- Real DEX volume for liquidity metrics
- Automatic score calculation

### 5. Loss Protection
- Automatic loss waterfall
- Junior absorbs losses first
- Senior protected until last
- Bounded at zero (no negative values)

### 6. Event System
- Comprehensive event emissions
- Real-time event listening
- Event history table
- Retry logic for rate limiting

---

## 📊 User Flows

### 1. Deposit Flow
1. User connects wallet
2. User selects tranche (Senior/Mezz/Junior)
3. User enters deposit amount
4. System calculates shares to mint
5. User approves USDC spending
6. System deposits USDC and mints shares
7. User's position updated
8. Event emitted

### 2. Withdraw Flow
1. User selects tranche
2. User enters shares to withdraw
3. System calculates USDC value
4. System burns shares
5. System transfers USDC (may use reserve pool)
6. User's position updated
7. Event emitted

### 3. Epoch Update Flow
1. Owner calls `updateEpoch` with scores
2. System calculates time-based yield
3. System calculates combined score
4. System calculates deltas for each tranche
5. System updates virtual values
6. System checks for loss events
7. System applies loss waterfall if needed
8. Event emitted

### 4. AI Assistant Flow
1. User types natural language command
2. AI processes request
3. AI determines action (deposit/withdraw/epoch/check/info)
4. AI executes action (if needed)
5. AI provides conversational response
6. System updates UI

### 5. AI Advisor Flow
1. User answers risk profile questions
2. System builds prompt with user answers
3. System calls GPT-4o-mini API
4. AI analyzes risk profile
5. AI provides recommendation with explanation
6. User can use recommendation in deposit panel

---

## 🛠️ Technology Stack

### Backend
- **Solidity** ^0.8.0
- **Foundry** (development framework)
- **Arc Blockchain** (deployment target)

### Frontend
- **Next.js** 16.0.3 (React framework)
- **TypeScript** (type safety)
- **Wagmi** (Ethereum React hooks)
- **RainbowKit** (wallet connection)
- **Tailwind CSS** (styling)
- **Viem** (Ethereum utilities)

### AI/ML
- **OpenAI GPT-4o-mini** (LLM for recommendations and actions)
- **DeFiLlama API** (real chain data)

### APIs
- **DeFiLlama** (yield, TVL, DEX volume data)
- **Arc Testnet RPC** (blockchain interaction)

---

## 📁 Project Structure

```
procti/
├── Backend/
│   ├── src/
│   │   ├── TrancheVault.sol          # Main vault contract
│   │   ├── MockScoringContract.sol   # Mock oracle
│   │   └── IERC20.sol                # ERC20 interface
│   ├── test/
│   │   └── TrancheVault.t.sol        # Test suite
│   ├── script/
│   │   └── DeployTrancheVault.s.sol  # Deployment script
│   └── abi/                          # Contract ABIs
│
├── app/
│   ├── page.tsx                      # Root page
│   ├── tranches/
│   │   └── page.tsx                  # Tranche dashboard
│   └── advisor/
│       └── page.tsx                  # AI advisor page
│
├── components/
│   ├── tranches/                     # Tranche UI components
│   ├── ai/                           # AI components
│   └── ...                           # Other components
│
├── hooks/
│   ├── useProctiContract.ts          # Contract interaction
│   ├── useTrancheData.ts             # Data polling
│   ├── useConversationalAgent.ts     # Conversational AI
│   └── ...                           # Other hooks
│
├── lib/
│   ├── procti/
│   │   ├── abi.ts                    # Contract ABIs
│   │   └── addresses.ts              # Contract addresses
│   ├── ai/
│   │   ├── conversationPrompt.ts     # AI prompts
│   │   └── advisorPrompt.ts          # Advisor prompts
│   └── services/
│       └── chainDataFetcher.ts       # Real data fetching
│
└── ...                               # Config files
```

---

## 🎯 Key Differentiators

1. **Virtual Multi-Chain Exposure**: Simulates multi-chain performance without bridge risks
2. **AI-Powered Interface**: Natural language interaction with blockchain
3. **Structured Finance**: Three-tier tranche system with risk/return distribution
4. **Real Data Integration**: Uses actual DeFi data from DeFiLlama
5. **Autonomous Agent**: AI agent that monitors and acts independently
6. **Comprehensive UI**: Full-featured dashboard with real-time updates
7. **Fee System**: Realistic fee structure with reserve pool backing
8. **Time-Based Yield**: Accrues yield over time to reserve pool

---

## 🚀 Deployment

### Contract Deployment
- **Network**: Arc Testnet
- **Contract Address**: `0x7D5b0bcf399F2Fbe590b01fAE7C885C53663A6CB`
- **USDC Address**: `0x3600000000000000000000000000000000000000`

### Frontend Deployment
- **Framework**: Next.js
- **Styling**: Tailwind CSS
- **Wallet**: RainbowKit + Wagmi

---

## 📝 Documentation

- **TRANCHE_VAULT_README.md**: Technical contract documentation
- **TRANCHE_SYSTEM_SUMMARY.md**: System overview
- **REALITY_CHECK.md**: System limitations and reality check
- **MAKING_IT_REALISTIC.md**: Realistic improvements implemented

---

## ✨ Summary

Procti is a complete DeFi structured vault system featuring:
- ✅ Three-tier tranche structure (Senior, Mezzanine, Junior)
- ✅ Share-based deposit/withdraw system
- ✅ Epoch update system with scoring-based returns
- ✅ Loss waterfall protection
- ✅ Fee system with reserve pool
- ✅ Time-based yield accrual
- ✅ Real chain data integration
- ✅ AI-powered conversational interface
- ✅ AI tranche advisor
- ✅ Autonomous AI agent
- ✅ Comprehensive UI dashboard
- ✅ Event system with history
- ✅ Full test coverage

**The system demonstrates advanced programmable stablecoin logic, structured finance concepts, and AI-powered DeFi interaction.**

