"use client";

import { useEffect, useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { TRANCHE_VAULT_ADDRESS } from "@/lib/procti/addresses";
import { TRANCHE_VAULT_ABI } from "@/lib/procti/abi";
import { formatUnits } from "viem";

/**
 * Event types
 */
export interface DepositEvent {
  type: "Deposit";
  user: string;
  amount: string;
  tranche: number;
  shares: string;
  timestamp: number;
  blockNumber: number;
}

export interface WithdrawEvent {
  type: "Withdraw";
  user: string;
  amount: string;
  tranche: number;
  shares: string;
  timestamp: number;
  blockNumber: number;
}

export interface EpochUpdatedEvent {
  type: "EpochUpdated";
  yieldScore: number;
  securityScore: number;
  liquidityScore: number;
  delta: string;
  seniorDelta: string;
  mezzDelta: string;
  juniorDelta: string;
  timestamp: number;
  blockNumber: number;
}

export interface LossAppliedEvent {
  type: "LossApplied";
  amount: string;
  juniorLoss: string;
  mezzLoss: string;
  seniorLoss: string;
  timestamp: number;
  blockNumber: number;
}

export type VaultEvent = DepositEvent | WithdrawEvent | EpochUpdatedEvent | LossAppliedEvent;

/**
 * @hook useEvents
 * @description Hook for listening to TrancheVault events
 * @notice Maintains local state - does NOT interfere with global state
 */
export const useEvents = () => {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events from contract
  useEffect(() => {
    // Don't fetch if address is placeholder
    if (!publicClient || !TRANCHE_VAULT_ADDRESS || TRANCHE_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      setIsLoading(false);
      return;
    }

    // Helper function to retry with exponential backoff
    const retryWithBackoff = async <T,>(
      fn: () => Promise<T>,
      maxRetries = 3,
      delay = 1000
    ): Promise<T> => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error: any) {
          // Check for 429 error in various formats (viem/wagmi can structure errors differently)
          const isRateLimit = 
            error?.status === 429 || 
            error?.statusCode === 429 ||
            error?.cause?.status === 429 ||
            error?.message?.includes("429") ||
            error?.message?.includes("rate limit");
            
          if (isRateLimit && i < maxRetries - 1) {
            const waitTime = delay * Math.pow(2, i); // Exponential backoff
            console.warn(`Rate limited. Retrying in ${waitTime}ms... (attempt ${i + 1}/${maxRetries})`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            continue;
          }
          throw error;
        }
      }
      throw new Error("Max retries exceeded");
    };

    const fetchEvents = async () => {
      try {
        setIsLoading(true);

        // Get current block with retry
        const currentBlock = await retryWithBackoff(
          () => publicClient.getBlockNumber(),
          3,
          1000
        );
        
        // Only fetch last 500 blocks to reduce load
        const fromBlock = currentBlock > BigInt(500) 
          ? currentBlock - BigInt(500) 
          : BigInt(0);

        // Fetch all logs from the contract with retry
        const allLogs = await retryWithBackoff(
          () => publicClient.getLogs({
            address: TRANCHE_VAULT_ADDRESS,
            fromBlock,
          }),
          3,
          1000
        );

        // Parse and combine events
        const parsedEvents: VaultEvent[] = [];
        const blockCache = new Map<bigint, any>();

        // Helper to get block with caching and retry
        const getBlock = async (blockNumber: bigint) => {
          if (!blockCache.has(blockNumber)) {
            const block = await retryWithBackoff(
              () => publicClient.getBlock({ blockNumber }),
              2,
              500
            );
            blockCache.set(blockNumber, block);
          }
          return blockCache.get(blockNumber);
        };

        // Parse all logs using decodeEventLog
        // Add small delay between block fetches to avoid rate limiting
        for (let i = 0; i < allLogs.length; i++) {
          const log = allLogs[i];
          if (!log.topics || log.topics.length === 0) continue;

          try {
            // Add delay every 10 logs to avoid rate limiting
            if (i > 0 && i % 10 === 0) {
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            
            const block = await getBlock(log.blockNumber);

            // Try to decode each event type
            try {
              const decoded = publicClient.decodeEventLog({
                abi: TRANCHE_VAULT_ABI,
                data: log.data,
                topics: log.topics,
              });

              if (decoded.eventName === "Deposit") {
                const args = decoded.args as any;
                parsedEvents.push({
                  type: "Deposit",
                  user: args.user,
                  amount: formatUnits(args.amount as bigint, 6),
                  tranche: Number(args.tranche),
                  shares: (args.shares as bigint).toString(),
                  timestamp: Number(block.timestamp),
                  blockNumber: Number(log.blockNumber),
                });
              } else if (decoded.eventName === "Withdraw") {
                const args = decoded.args as any;
                parsedEvents.push({
                  type: "Withdraw",
                  user: args.user,
                  amount: formatUnits(args.amount as bigint, 6),
                  tranche: Number(args.tranche),
                  shares: (args.shares as bigint).toString(),
                  timestamp: Number(block.timestamp),
                  blockNumber: Number(log.blockNumber),
                });
              } else if (decoded.eventName === "EpochUpdated") {
                const args = decoded.args as any;
                parsedEvents.push({
                  type: "EpochUpdated",
                  yieldScore: Number(args.yieldScore),
                  securityScore: Number(args.securityScore),
                  liquidityScore: Number(args.liquidityScore),
                  delta: (args.delta as bigint).toString(),
                  seniorDelta: (args.seniorDelta as bigint).toString(),
                  mezzDelta: (args.mezzDelta as bigint).toString(),
                  juniorDelta: (args.juniorDelta as bigint).toString(),
                  timestamp: Number(block.timestamp),
                  blockNumber: Number(log.blockNumber),
                });
              } else if (decoded.eventName === "LossApplied") {
                const args = decoded.args as any;
                parsedEvents.push({
                  type: "LossApplied",
                  amount: formatUnits(args.amount as bigint, 6),
                  juniorLoss: formatUnits(args.juniorLoss as bigint, 6),
                  mezzLoss: formatUnits(args.mezzLoss as bigint, 6),
                  seniorLoss: formatUnits(args.seniorLoss as bigint, 6),
                  timestamp: Number(block.timestamp),
                  blockNumber: Number(log.blockNumber),
                });
              }
            } catch (decodeError) {
              // Skip logs that don't match our events
              continue;
            }
          } catch (err) {
            // Skip logs we can't process
            continue;
          }
        }

        // Sort by block number (newest first)
        parsedEvents.sort((a, b) => b.blockNumber - a.blockNumber);

        setEvents(parsedEvents);
      } catch (error: any) {
        // Check for rate limit in various formats
        const isRateLimit = 
          error?.status === 429 || 
          error?.statusCode === 429 ||
          error?.cause?.status === 429 ||
          error?.message?.includes("429") ||
          error?.message?.includes("rate limit");
          
        if (isRateLimit) {
          console.warn("Rate limited. Events will be fetched on next interval.");
          setEvents([]);
        } else {
          console.error("Error fetching events:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch with delay to avoid immediate rate limit
    const initialTimeout = setTimeout(fetchEvents, 2000);

    // Set up real-time listener with longer interval to reduce rate limiting
    const interval = setInterval(fetchEvents, 30000); // Refresh every 30 seconds (reduced from 10s)

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [publicClient, address]);

  // Filter events by user if address is provided
  const userEvents = address
    ? events.filter((event) => {
        if (event.type === "Deposit" || event.type === "Withdraw") {
          return event.user.toLowerCase() === address.toLowerCase();
        }
        return true; // Include all epoch and loss events
      })
    : events;

  return {
    events,
    userEvents,
    isLoading,
  };
};

