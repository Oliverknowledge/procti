"use client";

import { useState, useEffect, useCallback } from "react";
import { usePublicClient, useBlockNumber, useAccount } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { decodeEventLog, formatUnits } from "viem";
import { useCrossChainArb } from "./useCrossChainArb";
import { useVault } from "./useVault";

export interface ChainBalance {
  chain: string;
  balance: number;
  percentage: number;
}

export const useChainBalances = () => {
  const [chainBalances, setChainBalances] = useState<ChainBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();
  const { data: currentBlock } = useBlockNumber();
  const { address } = useAccount();
  const { activeChain, supportedChains } = useCrossChainArb();
  const { vaultBalance } = useVault();

  // Event ABIs
  const DEPOSITED_EVENT_ABI = {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  } as const;

  const WITHDRAWN_EVENT_ABI = {
    type: "event",
    name: "Withdrawn",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  } as const;

  const CROSS_CHAIN_MOVE_EVENT_ABI = {
    type: "event",
    name: "CrossChainMove",
    inputs: [
      { name: "sourceChain", type: "string", indexed: false },
      { name: "destChain", type: "string", indexed: false },
      { name: "amount", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  } as const;

  // Helper function to retry with exponential backoff
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries = 5,
    baseDelay = 2000
  ): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        // Check for 429 rate limit error in various formats
        const isRateLimit = 
          error?.status === 429 ||
          error?.statusCode === 429 ||
          error?.message?.includes("429") ||
          error?.message?.includes("Too Many Requests") ||
          error?.cause?.status === 429 ||
          error?.shortMessage?.includes("429");
        
        // If it's a 429 (rate limit) error, retry with longer backoff
        if (i < maxRetries - 1 && isRateLimit) {
          // Exponential backoff: 2s, 4s, 8s, 16s, 32s
          const delay = baseDelay * Math.pow(2, i);
          console.warn(`Rate limited (429) in getLogs, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's not a rate limit error or we've exhausted retries, throw
        if (!isRateLimit || i === maxRetries - 1) {
          throw error;
        }
      }
    }
    throw new Error("Max retries exceeded");
  };

  const calculateChainBalances = useCallback(async () => {
    if (!publicClient || !currentBlock || !address || !activeChain) {
      return;
    }

    setIsLoading(true);
    try {
      // Reduce block range to avoid rate limiting
      const fromBlock = currentBlock > 2000n ? currentBlock - 2000n : 0n;
      const toBlock = currentBlock || "latest";

      // Get all deposits with retry logic
      const depositLogs = await retryWithBackoff(() =>
        publicClient.getLogs({
          address: contractsConfig.vault.address,
          event: DEPOSITED_EVENT_ABI,
          fromBlock,
          toBlock,
          args: {
            user: address,
          },
        })
      );

      // Add delay between log queries
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get all withdrawals with retry logic
      const withdrawLogs = await retryWithBackoff(() =>
        publicClient.getLogs({
          address: contractsConfig.vault.address,
          event: WITHDRAWN_EVENT_ABI,
          fromBlock,
          toBlock,
          args: {
            user: address,
          },
        })
      );

      // Add delay between log queries
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get all cross-chain moves with retry logic
      const moveLogs = await retryWithBackoff(() =>
        publicClient.getLogs({
          address: contractsConfig.crossChainArb.address,
          event: CROSS_CHAIN_MOVE_EVENT_ABI,
          fromBlock,
          toBlock,
        })
      );

      // Initialize balances for all supported chains
      const balances: Record<string, number> = {};
      const chains = supportedChains.length > 0 ? supportedChains : ["Arc", "Ethereum", "Arbitrum", "Base", "Optimism"];
      chains.forEach((chain) => {
        balances[chain] = 0;
      });

      // Process deposits - assume they go to the active chain at the time
      // For simplicity, we'll attribute deposits to the current active chain
      // In a real implementation, you'd track which chain was active when each deposit happened
      let currentActiveChain = activeChain;
      depositLogs.forEach((log) => {
        try {
          const decoded = decodeEventLog({
            abi: [DEPOSITED_EVENT_ABI],
            data: log.data,
            topics: log.topics,
          });
          const amount = Number(formatUnits((decoded.args as any).amount, 6));
          // For now, attribute to current active chain
          // In production, you'd track the active chain at the time of deposit
          balances[currentActiveChain] = (balances[currentActiveChain] || 0) + amount;
        } catch (err) {
          console.error("Error decoding deposit:", err);
        }
      });

      // Process withdrawals - subtract from the chain they were on
      // For simplicity, we'll subtract from the current active chain
      withdrawLogs.forEach((log) => {
        try {
          const decoded = decodeEventLog({
            abi: [WITHDRAWN_EVENT_ABI],
            data: log.data,
            topics: log.topics,
          });
          const amount = Number(formatUnits((decoded.args as any).amount, 6));
          // Subtract from current active chain
          balances[currentActiveChain] = Math.max(0, (balances[currentActiveChain] || 0) - amount);
        } catch (err) {
          console.error("Error decoding withdrawal:", err);
        }
      });

      // Process cross-chain moves
      moveLogs.forEach((log) => {
        try {
          const decoded = decodeEventLog({
            abi: [CROSS_CHAIN_MOVE_EVENT_ABI],
            data: log.data,
            topics: log.topics,
          });
          const fromChain = (decoded.args as any).sourceChain || "";
          const toChain = (decoded.args as any).destChain || "";
          const amount = Number(formatUnits((decoded.args as any).amount, 6));

          // Move funds from source to destination
          if (fromChain && toChain && balances[fromChain] !== undefined && balances[toChain] !== undefined) {
            balances[fromChain] = Math.max(0, (balances[fromChain] || 0) - amount);
            balances[toChain] = (balances[toChain] || 0) + amount;
          }
        } catch (err) {
          console.error("Error decoding move:", err);
        }
      });

      // Reconcile calculated balances with actual vault balance
      const totalCalculated = Object.values(balances).reduce((sum, bal) => sum + bal, 0);
      const vaultBalanceNum = parseFloat(vaultBalance || "0");
      
      // Only adjust if there's a significant difference (more than 0.000001 to avoid floating point issues)
      const difference = Math.abs(vaultBalanceNum - totalCalculated);
      
      if (difference > 0.000001) {
        if (vaultBalanceNum > 0 && totalCalculated === 0) {
          // No events found, attribute all to active chain
          balances[activeChain] = vaultBalanceNum;
        } else if (vaultBalanceNum > totalCalculated) {
          // There's more in vault than we calculated, add difference to active chain
          balances[activeChain] = (balances[activeChain] || 0) + (vaultBalanceNum - totalCalculated);
        } else if (vaultBalanceNum < totalCalculated && totalCalculated > 0) {
          // We calculated more than vault has - this shouldn't happen normally
          // But if it does, subtract the difference from the chain with the most balance
          const chainWithMost = Object.entries(balances).reduce((max, [chain, bal]) => 
            bal > max[1] ? [chain, bal] : max, 
            ["", 0]
          );
          if (chainWithMost[0]) {
            balances[chainWithMost[0]] = Math.max(0, balances[chainWithMost[0]] - difference);
          }
        }
      }
      
      // Final reconciliation - ensure total matches vault balance exactly
      const finalTotal = Object.values(balances).reduce((sum, bal) => sum + bal, 0);
      if (Math.abs(vaultBalanceNum - finalTotal) > 0.000001 && vaultBalanceNum > 0) {
        // Adjust the active chain to match exactly
        const adjustment = vaultBalanceNum - finalTotal;
        balances[activeChain] = Math.max(0, (balances[activeChain] || 0) + adjustment);
      }

      // Convert to array and calculate percentages
      const total = Object.values(balances).reduce((sum, bal) => sum + bal, 0);
      const chainBalanceArray: ChainBalance[] = Object.entries(balances)
        .map(([chain, balance]) => ({
          chain,
          balance: Math.max(0, balance),
          percentage: total > 0 ? (balance / total) * 100 : 0,
        }))
        .filter((cb) => cb.balance > 0 || cb.chain === activeChain) // Show active chain even if 0
        .sort((a, b) => b.balance - a.balance);

      setChainBalances(chainBalanceArray);
    } catch (err) {
      console.error("Error calculating chain balances:", err);
      // Fallback: attribute all to active chain
      const vaultBalanceNum = parseFloat(vaultBalance || "0");
      if (vaultBalanceNum > 0 && activeChain) {
        setChainBalances([
          {
            chain: activeChain,
            balance: vaultBalanceNum,
            percentage: 100,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, currentBlock, address, activeChain, supportedChains, vaultBalance]);

  useEffect(() => {
    calculateChainBalances();
    // Reduced frequency to avoid rate limiting (30 seconds instead of 10)
    const interval = setInterval(calculateChainBalances, 30000);
    return () => clearInterval(interval);
  }, [calculateChainBalances]);

  return {
    chainBalances,
    isLoading,
    refetch: calculateChainBalances,
  };
};

