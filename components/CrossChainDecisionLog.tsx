"use client";

import { useState, useEffect } from "react";
import { usePublicClient, useBlockNumber } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { decodeEventLog } from "viem";

interface Decision {
  chain: string;
  price: number;
  timestamp: Date;
  reason: string;
  id: string;
}

export default function CrossChainDecisionLog() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
        
        if (i < maxRetries - 1 && isRateLimit) {
          const delay = baseDelay * Math.pow(2, i);
          console.warn(`Rate limited (429) in getLogs, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        if (!isRateLimit || i === maxRetries - 1) {
          throw error;
        }
      }
    }
    throw new Error("Max retries exceeded");
  };

  const fetchDecisions = async () => {
    if (!publicClient || !currentBlock) return;

    setIsLoading(true);
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

      const decodedDecisions: Decision[] = (await Promise.all(
        logs.map(async (log) => {
          try {
            const decoded = decodeEventLog({
              abi: [CROSS_CHAIN_DECISION_EVENT_ABI],
              data: log.data,
              topics: log.topics,
            });

            return {
              chain: (decoded.args as any).selectedChain || "",
              price: (decoded.args as any).price
                ? Number((decoded.args as any).price) / 1e18
                : 0,
              timestamp: (decoded.args as any).timestamp
                ? new Date(Number((decoded.args as any).timestamp) * 1000)
                : new Date(),
              reason: (decoded.args as any).reason || "",
              id: `${log.blockNumber}-${log.transactionHash}-${log.logIndex}`,
            };
          } catch (err) {
            console.error("Error decoding decision:", err);
            return null;
          }
        })
      )).filter((decision): decision is Decision => decision !== null);

      const validDecisions = decodedDecisions.filter((d) => d !== null) as Decision[];
      validDecisions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setDecisions(validDecisions);
    } catch (err) {
      console.error("Error fetching decisions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
    const interval = setInterval(fetchDecisions, 20000);
    return () => clearInterval(interval);
  }, [publicClient, currentBlock]);

  const getReasonColor = (reason: string) => {
    if (reason.toLowerCase().includes("too risky") || reason.toLowerCase().includes("risky")) {
      return "border-red-200 bg-red-50";
    }
    if (reason.toLowerCase().includes("defensive")) {
      return "border-orange-200 bg-orange-50";
    }
    if (reason.toLowerCase().includes("optimal") || reason.toLowerCase().includes("best")) {
      return "border-green-200 bg-green-50";
    }
    return "border-blue-200 bg-blue-50";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Cross-Chain Decisions</h2>
      
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading decisions...</p>
      ) : decisions.length === 0 ? (
        <p className="text-sm text-gray-500">No decisions yet</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {decisions.map((decision) => (
            <div
              key={decision.id}
              className={`border rounded-sm p-3 ${getReasonColor(decision.reason)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{decision.chain}</span>
                <span className="text-xs text-gray-500">
                  {decision.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-1">{decision.reason}</p>
              <p className="text-xs text-gray-600">Price: ${decision.price.toFixed(6)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

