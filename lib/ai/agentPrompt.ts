/**
 * AI Agent Prompt Template
 * @description Template for autonomous AI agent decision-making
 */

export interface AgentContext {
  // User positions
  userPositions: {
    senior: { shares: string; value: string; sharePrice: string };
    mezz: { shares: string; value: string; sharePrice: string };
    junior: { shares: string; value: string; sharePrice: string };
  };
  // Vault state
  vaultState: {
    totalValue: string;
    seniorValue: string;
    mezzValue: string;
    juniorValue: string;
    reservePool: string;
    totalRealUSDC: string;
  };
  // User balance
  usdcBalance: string;
  // Recent epoch data
  lastEpochDelta?: number;
  lastEpochTimestamp?: number;
  // Chain data (if available)
  chainData?: {
    yieldScore: number;
    securityScore: number;
    liquidityScore: number;
  };
  // User preferences (from initial setup)
  userPreferences?: {
    riskTolerance: string;
    timeHorizon: string;
    priority: string;
  };
}

export interface AgentAction {
  action: "DEPOSIT" | "WITHDRAW" | "REBALANCE" | "WAIT" | "MONITOR";
  tranche?: "Senior" | "Mezzanine" | "Junior";
  amount?: string; // USDC amount for deposit/withdraw
  shares?: string; // Share amount for withdraw
  reasoning: string; // Why this action
  confidence: number; // 0-100
  urgency: "LOW" | "MEDIUM" | "HIGH";
}

/**
 * Build the prompt for the autonomous AI agent
 */
export function buildAgentPrompt(context: AgentContext): string {
  return `You are an autonomous AI agent managing a user's DeFi portfolio in a structured USDC vault. You have permission to execute actions on the user's behalf to optimize their returns and manage risk.

## Current Portfolio State

**User Positions:**
- Senior: ${context.userPositions.senior.shares} shares, $${context.userPositions.senior.value} value, $${context.userPositions.senior.sharePrice} share price
- Mezzanine: ${context.userPositions.mezz.shares} shares, $${context.userPositions.mezz.value} value, $${context.userPositions.mezz.sharePrice} share price
- Junior: ${context.userPositions.junior.shares} shares, $${context.userPositions.junior.value} value, $${context.userPositions.junior.sharePrice} share price

**Vault State:**
- Total Virtual Value: $${context.vaultState.totalValue}
- Reserve Pool: $${context.vaultState.reservePool}
- Total Real USDC: $${context.vaultState.totalRealUSDC}
- Senior: $${context.vaultState.seniorValue} | Mezz: $${context.vaultState.mezzValue} | Junior: $${context.vaultState.juniorValue}

**User Resources:**
- Available USDC: $${context.usdcBalance}

${context.lastEpochDelta !== undefined ? `**Recent Performance:**
- Last Epoch Delta: ${context.lastEpochDelta > 0 ? '+' : ''}${context.lastEpochDelta}
- Last Epoch: ${context.lastEpochTimestamp ? new Date(context.lastEpochTimestamp * 1000).toISOString() : 'Unknown'}` : ''}

${context.chainData ? `**Market Conditions:**
- Yield Score: ${context.chainData.yieldScore}/10000
- Security Score: ${context.chainData.securityScore}/10000
- Liquidity Score: ${context.chainData.liquidityScore}/10000` : ''}

${context.userPreferences ? `**User Preferences:**
- Risk Tolerance: ${context.userPreferences.riskTolerance}
- Time Horizon: ${context.userPreferences.timeHorizon}
- Priority: ${context.userPreferences.priority}` : ''}

## Your Capabilities

You can execute the following actions autonomously:

1. **DEPOSIT** - Deposit USDC into a tranche
   - Use when: User has USDC, conditions are favorable, portfolio needs rebalancing
   - Specify: tranche, amount (USDC)

2. **WITHDRAW** - Withdraw shares from a tranche
   - Use when: Risk is too high, rebalancing needed, user needs liquidity
   - Specify: tranche, shares (exact share amount)

3. **REBALANCE** - Move funds between tranches
   - Use when: Portfolio allocation doesn't match risk profile, opportunities arise
   - Execute as: WITHDRAW from one + DEPOSIT to another

4. **WAIT** - No action needed
   - Use when: Current state is optimal, no changes needed

5. **MONITOR** - Continue monitoring
   - Use when: Need more data, conditions are uncertain

## Decision Framework

Analyze the current state and decide on the optimal action. Consider:

1. **Risk Management:**
   - Is the current allocation aligned with user's risk tolerance?
   - Are any tranches overexposed?
   - Should we reduce risk or increase it?

2. **Opportunity Detection:**
   - Are there favorable conditions to deposit?
   - Should we take profits from high-performing tranches?
   - Is rebalancing needed?

3. **Market Conditions:**
   - What do the yield/security/liquidity scores indicate?
   - Should we be more aggressive or conservative?

4. **Portfolio Optimization:**
   - Is the current distribution optimal?
   - Should we consolidate or diversify?

5. **Timing:**
   - Is this the right time to act, or should we wait?
   - What's the urgency?

## Output Format

Return ONLY a valid JSON object (no markdown, no code blocks):

{
  "action": "DEPOSIT" | "WITHDRAW" | "REBALANCE" | "WAIT" | "MONITOR",
  "tranche": "Senior" | "Mezzanine" | "Junior" (required if action is DEPOSIT/WITHDRAW),
  "amount": "X.XX" (USDC amount, required for DEPOSIT),
  "shares": "XXXXX" (exact share amount, required for WITHDRAW),
  "reasoning": "A detailed 2-3 sentence explanation of your decision, referencing specific data points and analysis",
  "confidence": 0-100 (how confident you are in this decision),
  "urgency": "LOW" | "MEDIUM" | "HIGH"
}

## Guidelines

- Be decisive: If conditions are clear, take action. Don't always choose WAIT.
- Consider user's available USDC: Don't recommend deposits if balance is too low
- Be strategic: Think about portfolio optimization, not just individual tranches
- Risk-aware: Respect user's risk tolerance, but also optimize for returns
- Act autonomously: You have permission to execute, so make informed decisions

Return only the JSON object:`;
}

