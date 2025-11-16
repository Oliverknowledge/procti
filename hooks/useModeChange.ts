"use client";

import { useEffect, useRef } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { formatUnits } from "viem";

export interface ModeChangeEvent {
  newMode: number;
  price: string;
  timestamp: number;
  reason: string;
  modeName: string;
}

/**
 * @hook useModeChange
 * @description Listens for ModeChanged events and provides callback for notifications
 */
export const useModeChange = (
  onModeChange?: (event: ModeChangeEvent) => void
) => {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const lastModeRef = useRef<number | null>(null);
  const lastNotificationRef = useRef<number>(0);
  const isInitializedRef = useRef(false);

  const modeNames: Record<number, string> = {
    0: "Farming",
    1: "Defensive",
    2: "Emergency",
  };

  useEffect(() => {
    if (!isConnected || !publicClient || !onModeChange) return;

    // Helper function to retry with exponential backoff
    const retryWithBackoff = async <T,>(
      fn: () => Promise<T>,
      maxRetries = 3,
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
          
          // If it's a 429 (rate limit) error and we have retries left, retry with backoff
          if (i < maxRetries - 1 && isRateLimit) {
            const delay = baseDelay * Math.pow(2, i);
            console.warn(`Rate limited (429) in useModeChange, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
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

    const checkModeChanges = async () => {
      try {
        // Read current mode from contract with retry logic
        const currentMode = await retryWithBackoff(async () => {
          return await publicClient.readContract({
            address: contractsConfig.vault.address,
            abi: contractsConfig.vault.abi,
            functionName: "getMode",
          });
        });

        const modeNumber = typeof currentMode === 'bigint' ? Number(currentMode) : (typeof currentMode === 'number' ? currentMode : Number(currentMode) || 0);

        // Initialize on first run (don't notify on first check)
        if (!isInitializedRef.current) {
          lastModeRef.current = modeNumber;
          isInitializedRef.current = true;
          return;
        }

        // Check if mode has changed
        if (lastModeRef.current !== null && lastModeRef.current !== modeNumber) {
          // Mode changed! Get the latest ModeChanged event
          const currentBlock = await publicClient.getBlockNumber();
          const fromBlock = currentBlock - 100n; // Check last 100 blocks

          try {
            // Get ModeChanged events using the contract ABI
            const { parseAbiItem } = await import("viem");
            // Try the correct event signature from the contract source
            const modeChangedEvent = parseAbiItem("event ModeChanged(uint256 newMode, uint256 price, uint256 timestamp, string reason)");
            
            const logs = await publicClient.getLogs({
              address: contractsConfig.vault.address,
              event: modeChangedEvent,
              fromBlock,
              toBlock: currentBlock,
            });

            if (logs.length > 0) {
              // Get the most recent ModeChanged event
              const latestLog = logs[logs.length - 1];
              
              // The log is already decoded by viem when using parseAbiItem
              if (latestLog.args) {
                const args = latestLog.args as any;
                const newMode = typeof args.newMode === 'bigint' ? Number(args.newMode) : (args.newMode || modeNumber);
                const price = formatUnits(
                  typeof args.price === 'bigint' ? args.price : BigInt(args.price || 0),
                  18
                );
                const timestamp = typeof args.timestamp === 'bigint' ? Number(args.timestamp) : (args.timestamp || Math.floor(Date.now() / 1000));
                const reason = args.reason || "Mode changed";

                // Only notify if this is a recent change (within last 5 minutes)
                const now = Math.floor(Date.now() / 1000);
                const eventTime = timestamp;
                const timeDiff = now - eventTime;

                if (timeDiff < 300 && eventTime > lastNotificationRef.current) {
                  lastNotificationRef.current = eventTime;

                  const modeChangeEvent: ModeChangeEvent = {
                    newMode,
                    price,
                    timestamp: eventTime,
                    reason,
                    modeName: modeNames[newMode] || "Unknown",
                  };

                  onModeChange(modeChangeEvent);
                }
              }
            }
          } catch (logError) {
            console.error("Error fetching mode change logs:", logError);
          }
        }

        // Update last known mode
        lastModeRef.current = modeNumber;
      } catch (error) {
        console.error("Error checking mode changes:", error);
      }
    };

    // Small delay before first check to avoid immediate rate limiting
    const initialTimeout = setTimeout(() => {
      checkModeChanges();
    }, 2000);

    // Poll every 30 seconds for mode changes (reduced frequency to avoid rate limits)
    const interval = setInterval(checkModeChanges, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isConnected, publicClient, onModeChange]);
};

