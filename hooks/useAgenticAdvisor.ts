"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { useProctiContract } from "@/hooks/useProctiContract";
import { useTrancheData } from "@/hooks/useTrancheData";
import { useUSDC } from "@/hooks/useUSDC";
import { buildAdvisorPrompt, type UserAnswers, type AdvisorResponse } from "@/lib/ai/advisorPrompt";
import { Tranche } from "@/lib/procti/addresses";
import { fetchChainData } from "@/lib/services/chainDataFetcher";

export interface AgenticRecommendation {
  action: "DEPOSIT" | "WITHDRAW" | "REBALANCE" | "MONITOR" | "WAIT";
  tranche?: Tranche;
  amount?: string;
  reasoning: string;
  urgency: "low" | "medium" | "high";
  confidence: number; // 0-100
  marketContext?: string;
  timestamp: number;
}

/**
 * @hook useAgenticAdvisor
 * @description Agentic AI advisor that proactively monitors and suggests actions
 * @notice More autonomous than basic advisor - monitors portfolio and market conditions
 */
export const useAgenticAdvisor = () => {
  const { address, isConnected } = useAccount();
  const { deposit, withdraw, isPending } = useProctiContract();
  const { trancheValues, totalValue, userPositions, refetchAll } = useTrancheData();
  const { balance, refetchBalance } = useUSDC();

  const [isActive, setIsActive] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswers | null>(null);
  const [initialRecommendation, setInitialRecommendation] = useState<AdvisorResponse | null>(null);
  const [activeRecommendations, setActiveRecommendations] = useState<AgenticRecommendation[]>([]);
  const [actionHistory, setActionHistory] = useState<AgenticRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);
  const checkInterval = 60000; // Check every minute

  /**
   * Get initial recommendation from user answers
   */
  const getInitialRecommendation = useCallback(async (answers: UserAnswers) => {
    setUserAnswers(answers);
    setIsMonitoring(true);

    try {
      const prompt = buildAdvisorPrompt(answers);
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error("OpenAI API key not configured");
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert financial advisor specializing in DeFi structured products. Return ONLY valid JSON.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.6,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      const parsed: AdvisorResponse = JSON.parse(content);

      setInitialRecommendation(parsed);
    } catch (err: any) {
      setError(err.message || "Failed to get recommendation");
    }
  }, []);

  /**
   * Get proactive recommendation based on current state
   */
  const getProactiveRecommendation = useCallback(async (): Promise<AgenticRecommendation | null> => {
    if (!isConnected || !userAnswers || !initialRecommendation) {
      return null;
    }

    try {
      // Fetch current market data
      const marketData = await fetchChainData().catch(() => null);

      // Calculate current portfolio state
      const totalUserValue = 
        parseFloat(userPositions[Tranche.Senior].value) +
        parseFloat(userPositions[Tranche.Mezz].value) +
        parseFloat(userPositions[Tranche.Junior].value);

      const recommendedTranche = initialRecommendation.recommendedTranche;
      const trancheMap: Record<string, Tranche> = {
        Senior: Tranche.Senior,
        Mezzanine: Tranche.Mezz,
        Junior: Tranche.Junior,
      };
      const targetTranche = trancheMap[recommendedTranche] || Tranche.Mezz;

      // Build context for AI
      const context = {
        userAnswers,
        initialRecommendation,
        currentPositions: {
          senior: userPositions[Tranche.Senior],
          mezz: userPositions[Tranche.Mezz],
          junior: userPositions[Tranche.Junior],
        },
        availableUSDC: balance,
        marketData: marketData ? {
          yieldScore: marketData.yieldScore,
          securityScore: marketData.securityScore,
          liquidityScore: marketData.liquidityScore,
          delta: marketData.delta,
        } : null,
        trancheValues: {
          senior: trancheValues.senior,
          mezz: trancheValues.mezz,
          junior: trancheValues.junior,
        },
      };

      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        return null;
      }

      const prompt = `You are an agentic AI financial advisor monitoring a user's DeFi portfolio. You have permission to suggest proactive actions.

## User's Risk Profile
- Loss Tolerance: ${userAnswers.lossTolerance}
- Time Horizon: ${userAnswers.timeHorizon}
- Priority: ${userAnswers.priority}
${userAnswers.experience ? `- Experience: ${userAnswers.experience}` : ""}

## Initial Recommendation
- Recommended Tranche: ${initialRecommendation.recommendedTranche}
- Suggested Allocation: Senior ${initialRecommendation.allocation.senior}%, Mezz ${initialRecommendation.allocation.mezz}%, Junior ${initialRecommendation.allocation.junior}%

## Current Portfolio State
- Available USDC: $${balance}
- Current Positions:
  - Senior: ${userPositions[Tranche.Senior].shares} shares, $${userPositions[Tranche.Senior].value} value
  - Mezzanine: ${userPositions[Tranche.Mezz].shares} shares, $${userPositions[Tranche.Mezz].value} value
  - Junior: ${userPositions[Tranche.Junior].shares} shares, $${userPositions[Tranche.Junior].value} value
- Total Portfolio Value: $${totalUserValue}

## Market Conditions
${marketData ? `
- Yield Score: ${marketData.yieldScore / 100}%
- Security Score: ${marketData.securityScore / 100}%
- Liquidity Score: ${marketData.liquidityScore / 100}%
- Market Delta: ${marketData.delta > 0 ? "+" : ""}${marketData.delta}
` : "Market data unavailable"}

## Your Task
Analyze the current state and suggest a proactive action. Consider:
1. Is the user's portfolio aligned with the recommended allocation?
2. Are there market opportunities (high yield, good security)?
3. Are there risks (low security, poor liquidity)?
4. Should the user deposit more, withdraw, rebalance, or wait?

Return ONLY valid JSON:
{
  "action": "DEPOSIT" | "WITHDRAW" | "REBALANCE" | "MONITOR" | "WAIT",
  "tranche": "Senior" | "Mezzanine" | "Junior" (required if action is DEPOSIT/WITHDRAW),
  "amount": "X.XX" (USDC amount, required if action is DEPOSIT/WITHDRAW),
  "reasoning": "Detailed explanation of why this action is recommended",
  "urgency": "low" | "medium" | "high",
  "confidence": 0-100,
  "marketContext": "Brief description of current market conditions"
}`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an agentic AI financial advisor. You proactively monitor portfolios and suggest actions. Be decisive but thoughtful. Return ONLY valid JSON.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      const parsed = JSON.parse(content);

      // Map tranche string to enum
      if (parsed.tranche) {
        const trancheMap: Record<string, Tranche> = {
          Senior: Tranche.Senior,
          Mezzanine: Tranche.Mezz,
          Junior: Tranche.Junior,
        };
        parsed.tranche = trancheMap[parsed.tranche];
      }

      return {
        ...parsed,
        timestamp: Date.now(),
      } as AgenticRecommendation;
    } catch (err) {
      console.error("Error getting proactive recommendation:", err);
      return null;
    }
  }, [isConnected, userAnswers, initialRecommendation, userPositions, balance, trancheValues]);

  /**
   * Execute a recommendation
   */
  const executeRecommendation = useCallback(
    async (recommendation: AgenticRecommendation) => {
      if (!isConnected || isPending) {
        return;
      }

      try {
        if (recommendation.action === "DEPOSIT" && recommendation.tranche && recommendation.amount) {
          await deposit(recommendation.amount, recommendation.tranche);
        } else if (recommendation.action === "WITHDRAW" && recommendation.tranche && recommendation.amount) {
          // Convert USDC amount to shares
          const sharePrice = parseFloat(userPositions[recommendation.tranche].sharePrice);
          if (sharePrice > 0) {
            const shares = BigInt(Math.floor((parseFloat(recommendation.amount) / sharePrice) * 1e6));
            await withdraw(shares, recommendation.tranche);
          }
        }

        // Add to history
        setActionHistory((prev) => [...prev, recommendation]);
        
        // Remove from active recommendations
        setActiveRecommendations((prev) =>
          prev.filter((r) => r.timestamp !== recommendation.timestamp)
        );

        // Refetch data
        setTimeout(() => {
          refetchAll();
          refetchBalance();
        }, 3000);
      } catch (err: any) {
        setError(err.message || "Failed to execute recommendation");
      }
    },
    [isConnected, isPending, deposit, withdraw, userPositions, refetchAll, refetchBalance]
  );

  /**
   * Start monitoring loop
   */
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsActive(true);

    // Initial check
    const check = async () => {
      if (Date.now() - lastCheckRef.current < checkInterval) {
        return;
      }

      lastCheckRef.current = Date.now();
      setIsMonitoring(true);

      const recommendation = await getProactiveRecommendation();
      
      if (recommendation && recommendation.action !== "WAIT" && recommendation.action !== "MONITOR") {
        // Only show high-confidence, high-urgency recommendations
        if (recommendation.confidence >= 70 && recommendation.urgency !== "low") {
          setActiveRecommendations((prev) => {
            // Don't duplicate similar recommendations
            const exists = prev.some(
              (r) =>
                r.action === recommendation.action &&
                r.tranche === recommendation.tranche &&
                Math.abs(r.timestamp - recommendation.timestamp) < 300000 // 5 minutes
            );
            if (exists) return prev;
            return [...prev, recommendation].slice(-5); // Keep last 5
          });
        }
      }

      setIsMonitoring(false);
    };

    // Check immediately
    check();

    // Then check periodically
    intervalRef.current = setInterval(check, checkInterval);
  }, [getProactiveRecommendation]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setIsMonitoring(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    // Initial recommendation
    getInitialRecommendation,
    initialRecommendation,
    userAnswers,

    // Proactive monitoring
    isActive,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    activeRecommendations,
    setActiveRecommendations,

    // Actions
    executeRecommendation,
    actionHistory,

    // State
    error,
    setError,
  };
};

