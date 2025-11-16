"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { useProctiContract } from "@/hooks/useProctiContract";
import { useTrancheData } from "@/hooks/useTrancheData";
import { useUSDC } from "@/hooks/useUSDC";
import { buildAgentPrompt, type AgentContext, type AgentAction } from "@/lib/ai/agentPrompt";
import { Tranche } from "@/lib/procti/addresses";
import { parseUnits, formatUnits } from "viem";
import { fetchChainData } from "@/lib/services/chainDataFetcher";

/**
 * @hook useAutonomousAgent
 * @description Autonomous AI agent that monitors and acts on user's behalf
 * @notice Uses real AI (GPT-4) to make decisions and execute actions
 */
export const useAutonomousAgent = () => {
  const { address, isConnected } = useAccount();
  const { deposit, withdraw, isPending } = useProctiContract();
  const { trancheValues, totalValue, reservePool, totalRealUSDC, userPositions, refetchAll } = useTrancheData();
  const { balance, refetchBalance } = useUSDC();
  
  const [isActive, setIsActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [lastAction, setLastAction] = useState<AgentAction | null>(null);
  const [actionHistory, setActionHistory] = useState<AgentAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<{
    riskTolerance: string;
    timeHorizon: string;
    priority: string;
  } | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecutionRef = useRef<number>(0);
  const cooldownPeriod = 60000; // 1 minute cooldown between actions

  /**
   * Get current context for AI agent
   */
  const getContext = useCallback(async (): Promise<AgentContext> => {
    // Fetch chain data if available
    let chainData;
    try {
      const data = await fetchChainData();
      chainData = {
        yieldScore: data.yieldScore,
        securityScore: data.securityScore,
        liquidityScore: data.liquidityScore,
      };
    } catch (err) {
      console.error("Failed to fetch chain data:", err);
    }

    return {
      userPositions: {
        senior: {
          shares: userPositions[Tranche.Senior].shares,
          value: userPositions[Tranche.Senior].value,
          sharePrice: userPositions[Tranche.Senior].sharePrice,
        },
        mezz: {
          shares: userPositions[Tranche.Mezz].shares,
          value: userPositions[Tranche.Mezz].value,
          sharePrice: userPositions[Tranche.Mezz].sharePrice,
        },
        junior: {
          shares: userPositions[Tranche.Junior].shares,
          value: userPositions[Tranche.Junior].value,
          sharePrice: userPositions[Tranche.Junior].sharePrice,
        },
      },
      vaultState: {
        totalValue,
        seniorValue: trancheValues.senior,
        mezzValue: trancheValues.mezz,
        juniorValue: trancheValues.junior,
        reservePool,
        totalRealUSDC,
      },
      usdcBalance: balance,
      chainData,
      userPreferences: userPreferences || undefined,
    };
  }, [userPositions, trancheValues, totalValue, reservePool, totalRealUSDC, balance, userPreferences]);

  /**
   * Call AI to get next action
   */
  const getNextAction = useCallback(async (context: AgentContext): Promise<AgentAction> => {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Agent requires GPT-4.");
    }

    const prompt = buildAgentPrompt(context);

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
            content: `You are an autonomous AI agent managing a DeFi portfolio. You have full permission to execute trades, deposits, and withdrawals on the user's behalf. 
            
Make intelligent, strategic decisions based on the data provided. Be decisive - if conditions warrant action, take it. Don't always choose WAIT.

Return ONLY valid JSON (no markdown, no code blocks).`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7, // Some creativity for strategic thinking
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse JSON response
    let parsed: AgentAction;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    // Validate action
    if (!parsed.action || !["DEPOSIT", "WITHDRAW", "REBALANCE", "WAIT", "MONITOR"].includes(parsed.action)) {
      throw new Error("Invalid action from AI");
    }

    return parsed;
  }, []);

  /**
   * Execute an action
   */
  const executeAction = useCallback(async (action: AgentAction) => {
    if (isPending) {
      console.log("Transaction pending, skipping action");
      return;
    }

    // Check cooldown
    const now = Date.now();
    if (now - lastExecutionRef.current < cooldownPeriod) {
      console.log("Cooldown active, skipping action");
      return;
    }

    try {
      console.log("🤖 AI Agent executing:", action);

      if (action.action === "DEPOSIT" && action.tranche && action.amount) {
        const trancheMap: Record<string, Tranche> = {
          Senior: Tranche.Senior,
          Mezzanine: Tranche.Mezz,
          Junior: Tranche.Junior,
        };
        const tranche = trancheMap[action.tranche];
        
        if (!tranche) {
          throw new Error(`Invalid tranche: ${action.tranche}`);
        }

        const amount = parseFloat(action.amount);
        if (amount <= 0 || amount > parseFloat(balance)) {
          throw new Error(`Invalid deposit amount: ${action.amount}`);
        }

        await deposit(action.amount, tranche);
        lastExecutionRef.current = now;
        
      } else if (action.action === "WITHDRAW" && action.tranche && action.shares) {
        const trancheMap: Record<string, Tranche> = {
          Senior: Tranche.Senior,
          Mezzanine: Tranche.Mezz,
          Junior: Tranche.Junior,
        };
        const tranche = trancheMap[action.tranche];
        
        if (!tranche) {
          throw new Error(`Invalid tranche: ${action.tranche}`);
        }

        const sharesBigInt = BigInt(action.shares);
        const availableShares = BigInt(userPositions[tranche].shares);
        
        if (sharesBigInt <= 0n || sharesBigInt > availableShares) {
          throw new Error(`Invalid shares: ${action.shares}`);
        }

        await withdraw(sharesBigInt, tranche);
        lastExecutionRef.current = now;
        
      } else if (action.action === "REBALANCE" && action.tranche) {
        // Rebalancing: withdraw from one, deposit to another
        // For now, we'll implement a simple version
        // The AI should specify which tranche to move from/to
        console.log("Rebalancing not fully implemented yet");
        // TODO: Implement rebalancing logic
      }

      // Add to history
      setActionHistory((prev) => [...prev.slice(-9), action]); // Keep last 10
      setLastAction(action);
      
      // Refetch data after action
      setTimeout(() => {
        refetchAll();
        refetchBalance();
      }, 3000);
      
    } catch (err: any) {
      console.error("Agent execution error:", err);
      setError(err.message || "Failed to execute action");
    }
  }, [deposit, withdraw, balance, userPositions, isPending, refetchAll, refetchBalance]);

  /**
   * Agent thinking loop
   */
  const agentLoop = useCallback(async () => {
    if (!isActive || !isConnected || isPending || isThinking) {
      return;
    }

    // Check cooldown
    const now = Date.now();
    if (now - lastExecutionRef.current < cooldownPeriod) {
      return;
    }

    setIsThinking(true);
    setError(null);

    try {
      const context = await getContext();
      const action = await getNextAction(context);
      
      // Execute actions based on AI decision
      if (action.action === "WAIT" || action.action === "MONITOR") {
        console.log("AI decided to wait/monitor:", action.reasoning);
        setLastAction(action);
      } else {
        // Execute DEPOSIT, WITHDRAW, or REBALANCE
        // Only execute if confidence is reasonable (>= 60) or urgency is high
        if (action.confidence >= 60 || action.urgency === "HIGH") {
          await executeAction(action);
        } else {
          console.log("Action confidence too low, skipping:", action);
          setLastAction(action); // Still record the decision
        }
      }
    } catch (err: any) {
      console.error("Agent loop error:", err);
      setError(err.message || "Agent error");
    } finally {
      setIsThinking(false);
    }
  }, [isActive, isConnected, isPending, isThinking, getContext, getNextAction, executeAction]);

  /**
   * Start/stop agent
   */
  useEffect(() => {
    if (isActive && isConnected) {
      // Run immediately, then every 30 seconds
      agentLoop();
      intervalRef.current = setInterval(agentLoop, 30000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isConnected, agentLoop]);

  return {
    isActive,
    setIsActive,
    isThinking,
    lastAction,
    actionHistory,
    error,
    setUserPreferences,
    userPreferences,
  };
};

