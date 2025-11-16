"use client";

import { useState } from "react";
import { useProctiContract } from "@/hooks/useProctiContract";
import { useTrancheData } from "@/hooks/useTrancheData";
import { useUSDC } from "@/hooks/useUSDC";
import type { Tranche } from "@/lib/procti/addresses";
import type { AdvisorResponse } from "@/lib/ai/advisorPrompt";

/**
 * @hook useAIAgent
 * @description Hook for AI agent to execute deposits using existing deposit logic
 * @notice Does NOT create new deposit functions - wraps existing useProctiContract.deposit
 */
export const useAIAgent = () => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);

  // Use existing deposit logic - do NOT duplicate
  const { deposit, isPending, isConfirming, error: depositError } = useProctiContract();
  const { refetchAll } = useTrancheData();
  const { refetchBalance } = useUSDC();

  /**
   * Execute deposit on behalf of user (with their confirmation)
   * @param amount Amount in USDC (string, user must provide)
   * @param tranche Recommended tranche from AI
   * @param recommendation Full AI recommendation for logging
   */
  const executeDeposit = async (
    amount: string,
    tranche: Tranche,
    recommendation: AdvisorResponse
  ) => {
    setIsExecuting(true);
    setError(null);
    setSuccess(false);
    setExecutionLog([]);

    try {
      // Validate amount
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        throw new Error("Please enter a valid deposit amount");
      }

      const amountNum = parseFloat(amount);

      // Log AI decision
      setExecutionLog((prev) => [
        ...prev,
        `🤖 AI Agent Decision: ${recommendation.recommendedTranche} Tranche`,
        `📊 Allocation: ${recommendation.allocation.senior}% Senior, ${recommendation.allocation.mezz}% Mezz, ${recommendation.allocation.junior}% Junior`,
        `💡 Reasoning: ${recommendation.explanation}`,
        `💰 Executing deposit: ${amountNum.toFixed(2)} USDC → ${recommendation.recommendedTranche} Tranche`,
      ]);

      // Use existing deposit function - do NOT create new one
      setExecutionLog((prev) => [...prev, "⏳ Approving USDC spending..."]);
      await deposit(amount, tranche);

      setExecutionLog((prev) => [...prev, "✅ Approval confirmed. Depositing to vault..."]);
      
      // Wait for transaction confirmation
      setTimeout(() => {
        setExecutionLog((prev) => [...prev, "✅ Deposit transaction confirmed!"]);
        setSuccess(true);
        refetchAll();
        refetchBalance();
      }, 3000);
    } catch (err: any) {
      console.error("AI Agent execution error:", err);
      setError(err.message || "Failed to execute deposit");
      setExecutionLog((prev) => [...prev, `❌ Error: ${err.message || "Deposit failed"}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
    setExecutionLog([]);
  };

  return {
    executeDeposit,
    isExecuting: isExecuting || isPending || isConfirming,
    error: error || depositError?.message || null,
    success,
    executionLog,
    reset,
    readyToExecute: true, // Ready when recommendation is available
  };
};

