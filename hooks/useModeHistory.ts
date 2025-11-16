"use client";

import { usePublicClient, useBlockNumber } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { useEffect, useState, useCallback } from "react";
import { formatUnits, decodeEventLog, Abi } from "viem";

export interface ModeChangeEvent {
  mode: string;
  modeName: string;
  price: string;
  timestamp: Date;
  reason: string;
  blockNumber: bigint;
  transactionHash: string;
}

// Event signature for ModeChanged with new parameters
const MODE_CHANGED_EVENT_ABI = {
  type: "event",
  name: "ModeChanged",
  inputs: [
    { type: "uint256", indexed: false, name: "newMode" },
    { type: "uint256", indexed: false, name: "price" },
    { type: "uint256", indexed: false, name: "timestamp" },
    { type: "string", indexed: false, name: "reason" },
  ],
} as const;

export const useModeHistory = () => {
  const publicClient = usePublicClient();
  const { data: currentBlock } = useBlockNumber({ watch: true });
  const [history, setHistory] = useState<ModeChangeEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  const fetchModeHistory = useCallback(async () => {
    if (!publicClient) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get events from contract deployment (or last 1000 blocks for performance)
      const fromBlock = currentBlock 
        ? currentBlock > 1000n 
          ? currentBlock - 1000n 
          : 0n
        : 0n;
      const toBlock = currentBlock || "latest";

      // Query logs using the event signature with retry logic
      const logs = await retryWithBackoff(() =>
        publicClient.getLogs({
          address: contractsConfig.vault.address,
          event: MODE_CHANGED_EVENT_ABI,
          fromBlock,
          toBlock,
        })
      );

      // Decode and process events
      const modeHistoryRaw = await Promise.all(
        logs.map(async (log) => {
          try {
            const decoded = decodeEventLog({
              abi: [MODE_CHANGED_EVENT_ABI] as Abi,
              data: log.data,
              topics: log.topics,
            });

            const mode = (decoded.args as any).newMode?.toString() || "0";
            const modeNames = ["Farming", "Defensive", "Emergency"];
            const price = (decoded.args as any).price
              ? formatUnits((decoded.args as any).price, 18)
              : "0";
            const timestamp = (decoded.args as any).timestamp
              ? new Date(Number((decoded.args as any).timestamp) * 1000)
              : new Date();
            const reason = (decoded.args as any).reason || "";

            return {
              mode,
              modeName: modeNames[parseInt(mode)] || "Unknown",
              price,
              timestamp,
              reason,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
            } as ModeChangeEvent;
          } catch (err) {
            console.error("Error decoding event:", err);
            return null;
          }
        })
      );
      const modeHistory: ModeChangeEvent[] = modeHistoryRaw.filter((event): event is ModeChangeEvent => event !== null);

      // Filter out nulls and sort by block number (oldest first)
      const validHistory = modeHistory.filter((h): h is ModeChangeEvent => h !== null);
      validHistory.sort((a, b) => {
        if (a.blockNumber < b.blockNumber) return -1;
        if (a.blockNumber > b.blockNumber) return 1;
        return 0;
      });

      setHistory(validHistory);
    } catch (err) {
      console.error("Error fetching mode history:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch mode history"));
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, currentBlock]);

  useEffect(() => {
    if (publicClient && currentBlock) {
      fetchModeHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicClient, currentBlock]);

  return {
    history,
    isLoading,
    error,
    refetch: fetchModeHistory,
  };
};

