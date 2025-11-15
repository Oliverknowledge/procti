"use client";

import { useState, useEffect } from "react";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { usePublicClient, useBlockNumber, useWriteContract } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { decodeEventLog, formatUnits, Abi } from "viem";

export interface CrossChainDecision {
  chain: string;
  price: string;
  timestamp: Date;
  reason: string;
  blockNumber: bigint;
  transactionHash: string;
}

const CROSS_CHAIN_DECISION_EVENT_ABI = {
  type: "event",
  name: "CrossChainDecision",
  inputs: [
    { type: "string", indexed: false, name: "chain" },
    { type: "uint256", indexed: false, name: "price" },
    { type: "uint256", indexed: false, name: "timestamp" },
    { type: "string", indexed: false, name: "reason" },
  ],
} as const;

export default function CrossChainOpportunityChecker() {
  const { bestChain, refetchBestChain, refetchChainData } = useCrossChainArb();
  const { writeContract, isPending: vaultPending } = useWriteContract();
  const publicClient = usePublicClient();
  const { data: currentBlock } = useBlockNumber({ watch: true });
  const [decisions, setDecisions] = useState<CrossChainDecision[]>([]);
  const [isChecking, setIsChecking] = useState(false);

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

  // Fetch historical cross-chain decisions
  useEffect(() => {
    const fetchDecisions = async () => {
      if (!publicClient || !currentBlock) return;

      try {
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

        const decisionHistoryRaw = await Promise.all(
          logs.map(async (log) => {
            try {
              const decoded = decodeEventLog({
                abi: [CROSS_CHAIN_DECISION_EVENT_ABI] as Abi,
                data: log.data,
                topics: log.topics,
              });

              const chain = (decoded.args as any).chain || "";
              const price = (decoded.args as any).price
                ? formatUnits((decoded.args as any).price, 18)
                : "0";
              const timestamp = (decoded.args as any).timestamp
                ? new Date(Number((decoded.args as any).timestamp) * 1000)
                : new Date();
              const reason = (decoded.args as any).reason || "";

              return {
                chain,
                price,
                timestamp,
                reason,
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
              } as CrossChainDecision;
            } catch (err) {
              console.error("Error decoding event:", err);
              return null;
            }
          })
        );
        const decisionHistory: CrossChainDecision[] = decisionHistoryRaw.filter((decision): decision is CrossChainDecision => decision !== null);

        const validDecisions = decisionHistory.filter((d): d is CrossChainDecision => d !== null);
        validDecisions.sort((a, b) => {
          if (a.blockNumber < b.blockNumber) return 1;
          if (a.blockNumber > b.blockNumber) return -1;
          return 0;
        });

        setDecisions(validDecisions);
      } catch (err) {
        console.error("Error fetching decisions:", err);
      }
    };

    if (publicClient && currentBlock) {
      fetchDecisions();
    }
  }, [publicClient, currentBlock]);

  const handleCheckOpportunities = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsChecking(true);
      // Note: This function may not exist in the current SentinelVault contract
      // If it doesn't exist, we'll catch the error and show a message
      try {
        await writeContract({
          address: contractsConfig.vault.address,
          abi: contractsConfig.vault.abi,
          functionName: "checkForCrossChainOpportunities",
        });
        // Wait a bit for the transaction to be mined
        await new Promise((resolve) => setTimeout(resolve, 3000));
        await refetchBestChain();
        await refetchChainData();
        alert("Cross-chain check completed!");
      } catch (error: any) {
        if (error.message?.includes("function") || error.message?.includes("not found")) {
          alert("Cross-chain opportunity checking is not available in the current contract. This feature may require a contract update.");
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Error checking opportunities:", error);
      alert(`Failed to check opportunities: ${error.message || "Unknown error"}`);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Cross-Chain Opportunities</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Best Chain:</span>
            <span className="text-sm font-semibold text-gray-900">{bestChain || "Loading..."}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckOpportunities}
          disabled={vaultPending || isChecking}
          className="w-full px-6 py-2 bg-green-600 text-white rounded-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? "Checking..." : "Check Cross-Chain Opportunities"}
        </button>

        {decisions.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Recent Decisions</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {decisions.map((decision, idx) => (
                <div key={idx} className="p-3 border border-gray-200 rounded-sm text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-gray-900">{decision.chain}</span>
                    <span className="text-xs text-gray-500">
                      {decision.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{decision.reason}</p>
                  <p className="text-xs text-gray-500">Price: ${decision.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

