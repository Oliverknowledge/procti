"use client";

import { useEffect, useRef } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";

export interface BestChainChangeEvent {
  previousBestChain: string;
  newBestChain: string;
  activeChain: string;
  shouldSwitch: boolean;
}

/**
 * @hook useBestChainMonitor
 * @description Monitors for best chain changes and provides callback for notifications
 */
export const useBestChainMonitor = (
  onBestChainChange?: (event: BestChainChangeEvent) => void,
  autoSwitch: boolean = true
) => {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { activeChain, bestChain, switchToBestChain, refetchBestChain, refetchActiveChain } = useCrossChainArb();
  const lastBestChainRef = useRef<string | null>(null);
  const lastNotificationRef = useRef<string>("");
  const isSwitchingRef = useRef(false);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isConnected || !bestChain || !activeChain) return;

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
          // Check for 429 rate limit error
          const isRateLimit = 
            error?.status === 429 ||
            error?.statusCode === 429 ||
            error?.message?.includes("429") ||
            error?.message?.includes("Too Many Requests") ||
            error?.cause?.status === 429 ||
            error?.shortMessage?.includes("429");
          
          if (i < maxRetries - 1 && isRateLimit) {
            const delay = baseDelay * Math.pow(2, i);
            console.warn(`Rate limited (429) in useBestChainMonitor, retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
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

    const checkBestChain = async () => {
      try {
        // Initialize on first run
        if (!isInitializedRef.current) {
          lastBestChainRef.current = bestChain;
          isInitializedRef.current = true;
          return;
        }

        // Check if best chain has changed
        const bestChainChanged = lastBestChainRef.current !== null && lastBestChainRef.current !== bestChain;
        
        // Check if we're not on the best chain
        const notOnBestChain = activeChain !== bestChain;

        // Create a unique key for this notification
        const notificationKey = `${bestChain}-${activeChain}`;

        // If best chain changed or we're not on the best chain, notify
        if ((bestChainChanged || notOnBestChain) && notificationKey !== lastNotificationRef.current) {
          const event: BestChainChangeEvent = {
            previousBestChain: lastBestChainRef.current || activeChain,
            newBestChain: bestChain,
            activeChain: activeChain,
            shouldSwitch: notOnBestChain,
          };

          // Notify user
          if (onBestChainChange) {
            onBestChainChange(event);
          }

          // Auto-switch if enabled and we're not already switching
          if (autoSwitch && notOnBestChain && !isSwitchingRef.current) {
            try {
              isSwitchingRef.current = true;
              console.log(`Auto-switching to best chain: ${bestChain}`);
              
              // Call switchToBestChain (returns a transaction hash)
              const hash = await switchToBestChain();
              
              // Wait for transaction confirmation if we have a public client and hash
              // Note: writeContract from wagmi returns the hash, but it might be undefined
              if (hash !== undefined && hash !== null && publicClient) {
                try {
                  await publicClient.waitForTransactionReceipt({ 
                    hash: hash as `0x${string}`,
                    timeout: 120_000 // 2 minutes timeout
                  });
                  console.log("Chain switch confirmed");
                } catch (waitError) {
                  console.error("Error waiting for chain switch confirmation:", waitError);
                }
              }
              
              // Wait a bit and refetch to confirm switch
              setTimeout(async () => {
                await refetchActiveChain();
                await refetchBestChain();
                isSwitchingRef.current = false;
              }, 3000);
            } catch (switchError: any) {
              console.error("Error auto-switching to best chain:", switchError);
              isSwitchingRef.current = false;
              // Don't throw - just log the error, user was already notified
            }
          }

          lastNotificationRef.current = notificationKey;
        }

        // Update last known best chain
        lastBestChainRef.current = bestChain;
      } catch (error) {
        console.error("Error checking best chain:", error);
      }
    };

    // Small delay before first check to avoid immediate rate limiting
    const initialTimeout = setTimeout(() => {
      checkBestChain();
    }, 2000);

    // Poll every 30 seconds for best chain changes (reduced frequency to avoid rate limits)
    const interval = setInterval(checkBestChain, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isConnected, activeChain, bestChain, switchToBestChain, refetchActiveChain, refetchBestChain, onBestChainChange, autoSwitch, publicClient]);
};

