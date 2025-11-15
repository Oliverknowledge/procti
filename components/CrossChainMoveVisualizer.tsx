"use client";

import { useState, useEffect } from "react";
import { usePublicClient, useBlockNumber } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { decodeEventLog, formatUnits } from "viem";

interface Move {
  from: string;
  to: string;
  amount: string;
  timestamp: Date;
  id: string;
}

export default function CrossChainMoveVisualizer() {
  const [moves, setMoves] = useState<Move[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();
  const { data: currentBlock } = useBlockNumber();

  // Event ABI for CrossChainMove
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

  const fetchMoves = async () => {
    if (!publicClient || !currentBlock) return;

    setIsLoading(true);
    try {
      // Reduced block range to avoid rate limiting
      const fromBlock = currentBlock > 1000n ? currentBlock - 1000n : 0n;
      const toBlock = currentBlock || "latest";

      const logs = await retryWithBackoff(() =>
        publicClient.getLogs({
          address: contractsConfig.crossChainArb.address,
          event: CROSS_CHAIN_MOVE_EVENT_ABI,
          fromBlock,
          toBlock,
        })
      );

      const decodedMoves: Move[] = (await Promise.all(
        logs.map(async (log) => {
          try {
            const decoded = decodeEventLog({
              abi: [CROSS_CHAIN_MOVE_EVENT_ABI],
              data: log.data,
              topics: log.topics,
            });

            return {
              from: (decoded.args as any).sourceChain || "",
              to: (decoded.args as any).destChain || "",
              amount: (decoded.args as any).amount
                ? formatUnits((decoded.args as any).amount, 6)
                : "0",
              timestamp: (decoded.args as any).timestamp
                ? new Date(Number((decoded.args as any).timestamp) * 1000)
                : new Date(),
              id: `${log.blockNumber}-${log.transactionHash}-${log.logIndex}`,
            };
          } catch (err) {
            console.error("Error decoding move:", err);
            return null;
          }
        })
      )).filter((move): move is Move => move !== null);

      const validMoves = decodedMoves.filter((m) => m !== null) as Move[];
      validMoves.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setMoves(validMoves);
    } catch (err) {
      console.error("Error fetching moves:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoves();
    const interval = setInterval(fetchMoves, 20000);
    return () => clearInterval(interval);
  }, [publicClient, currentBlock]);

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Cross-Chain Movements</h2>
      
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading movements...</p>
      ) : moves.length === 0 ? (
        <p className="text-sm text-gray-500">No movements yet</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {moves.map((move) => (
            <div
              key={move.id}
              className="border border-gray-200 rounded-sm p-3 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{move.from}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium text-gray-900">{move.to}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {move.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{move.amount} USDC</span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

