"use client";

import { useState, useEffect } from "react";
import { useVault } from "@/hooks/useVault";
import { usePublicClient, useBlockNumber } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { decodeEventLog } from "viem";

interface LastDecision {
  chain: string;
  price: number;
  reason: string;
  timestamp: Date;
}

export default function SmartCrossChainChecker() {
  const { checkForCrossChainOpportunities, isPending, isConfirming } = useVault();
  const [lastDecision, setLastDecision] = useState<LastDecision | null>(null);
  const publicClient = usePublicClient();
  const { data: currentBlock } = useBlockNumber();

  // Event ABI for CrossChainDecision
  const CROSS_CHAIN_DECISION_EVENT_ABI = {
    type: "event",
    name: "CrossChainDecision",
    inputs: [
      { name: "selectedChain", type: "string", indexed: false },
      { name: "price", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "reason", type: "string", indexed: false },
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
        const isRateLimit = 
          error?.status === 429 ||
          error?.statusCode === 429 ||
          error?.message?.includes("429") ||
          error?.message?.includes("Too Many Requests") ||
          error?.cause?.status === 429 ||
          error?.shortMessage?.includes("429");

        // Check for network errors (ERR_NETWORK_CHANGED, connection issues)
        const isNetworkError =
          error?.message?.includes("ERR_NETWORK_CHANGED") ||
          error?.message?.includes("network") ||
          error?.message?.includes("Network") ||
          error?.message?.includes("fetch") ||
          error?.message?.includes("Failed to fetch") ||
          error?.name === "HttpRequestError";
        
        if (i < maxRetries - 1 && (isRateLimit || isNetworkError)) {
          const delay = baseDelay * Math.pow(2, i);
          const errorType = isRateLimit ? "Rate limited (429)" : "Network error";
          console.warn(`${errorType}, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        if ((!isRateLimit && !isNetworkError) || i === maxRetries - 1) {
          // For network errors on last retry, log but don't crash the app
          if (isNetworkError && i === maxRetries - 1) {
            console.warn("Network error after max retries, skipping this fetch:", error?.message);
            // Return empty result instead of throwing to prevent app crash
            return [] as T;
          }
          throw error;
        }
      }
    }
    throw new Error("Max retries exceeded");
  };

  useEffect(() => {
    if (!publicClient || !currentBlock) return;

    const fetchLatestDecision = async () => {
      try {
        // Reduced block range to avoid rate limiting
        const fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;
        const toBlock = currentBlock || "latest";

        const logs = await retryWithBackoff(() =>
          publicClient.getLogs({
            address: contractsConfig.vault.address,
            event: CROSS_CHAIN_DECISION_EVENT_ABI,
            fromBlock,
            toBlock,
          })
        );

        if (logs.length > 0) {
          const latestLog = logs[logs.length - 1];
          try {
            const decoded = decodeEventLog({
              abi: [CROSS_CHAIN_DECISION_EVENT_ABI],
              data: latestLog.data,
              topics: latestLog.topics,
            });

            setLastDecision({
              chain: (decoded.args as any).selectedChain || "",
              price: (decoded.args as any).price
                ? Number((decoded.args as any).price) / 1e18
                : 0,
              reason: (decoded.args as any).reason || "",
              timestamp: (decoded.args as any).timestamp
                ? new Date(Number((decoded.args as any).timestamp) * 1000)
                : new Date(),
            });
          } catch (err) {
            console.error("Error decoding decision:", err);
          }
        }
      } catch (err) {
        console.error("Error fetching latest decision:", err);
      }
    };

    fetchLatestDecision();
    const interval = setInterval(fetchLatestDecision, 20000);
    return () => clearInterval(interval);
  }, [publicClient, currentBlock]);

  const handleCheck = async () => {
    try {
      await checkForCrossChainOpportunities();
      // Wait a bit then refetch latest decision
      setTimeout(() => {
        if (publicClient && currentBlock) {
          // Trigger refetch
          window.location.reload();
        }
      }, 3000);
    } catch (error: any) {
      console.error("Error checking opportunities:", error);
      alert("Failed to check opportunities: " + (error.message || "Unknown error"));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Smart Cross-Chain Check</h2>
      <p className="text-xs text-gray-500 mb-4">
        Checks for cross-chain opportunities while respecting your risk profile.
        Automatically switches to SafePool if best chain price is too risky.
      </p>
      
      <button
        onClick={handleCheck}
        disabled={isPending || isConfirming}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
      >
        {isPending || isConfirming ? "Checking..." : "Check Cross-Chain Opportunities"}
      </button>

      {lastDecision && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-sm">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Last Decision:</h4>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Chain:</strong> <span className="text-gray-700">{lastDecision.chain}</span>
            </p>
            <p>
              <strong>Price:</strong> <span className="text-gray-700">${lastDecision.price.toFixed(6)}</span>
            </p>
            <p>
              <strong>Reason:</strong> <span className="text-gray-700">{lastDecision.reason}</span>
            </p>
            <p className="text-xs text-gray-500">
              {lastDecision.timestamp.toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

