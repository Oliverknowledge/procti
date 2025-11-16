"use client";

import { useEffect, useRef } from "react";
import { useCrossChainArb } from "./useCrossChainArb";
import { useOracle } from "./useOracle";
import { usePublicClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { formatUnits, parseUnits } from "viem";

/**
 * Retry helper with exponential backoff for rate limiting
 */
const retryWithBackoff = async <T,>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelay = 2000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a 429 error (rate limit)
      const isRateLimit = 
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.includes("Too Many Requests") ||
        error?.cause?.status === 429;
      
      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 2s, 4s, 8s, 16s, 32s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Rate limited (429). Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Hook to automatically sync oracle price with active chain's price
 */
export const useOracleSync = () => {
  const { activeChain } = useCrossChainArb();
  const { refetchPrice } = useOracle();
  const publicClient = usePublicClient();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const lastSyncedChain = useRef<string | null>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    const syncOraclePrice = async () => {
      // Don't sync if already syncing or if no active chain
      if (!activeChain || !publicClient || isSyncing.current) {
        return;
      }

      // Don't sync if we already synced for this chain
      if (lastSyncedChain.current === activeChain) {
        return;
      }

      try {
        isSyncing.current = true;
        
        // Get the price of the active chain with retry logic
        const chainPrice = await retryWithBackoff(async () => {
          return await publicClient.readContract({
            address: contractsConfig.crossChainArb.address,
            abi: contractsConfig.crossChainArb.abi,
            functionName: "chainPrices",
            args: [activeChain],
          });
        });

        // Convert price from 18 decimals to string
        const priceBigInt = typeof chainPrice === 'bigint' 
          ? chainPrice 
          : (typeof chainPrice === 'number' || typeof chainPrice === 'string')
          ? BigInt(chainPrice)
          : BigInt(0);
        const priceFormatted = formatUnits(priceBigInt, 18);
        
        // Set the oracle price to the active chain's price
        const priceWei = parseUnits(priceFormatted, 18);
        writeContract({
          address: contractsConfig.oracle.address,
          abi: contractsConfig.oracle.abi,
          functionName: "setPrice",
          args: [priceWei],
        });
        
        // Mark this chain as synced (will be confirmed by transaction receipt)
        lastSyncedChain.current = activeChain;
        
        console.log(`Syncing oracle price to ${activeChain}'s price: ${priceFormatted}`);
      } catch (err) {
        console.error("Error syncing oracle price with active chain:", err);
        // Don't mark as synced if there was an error, so it will retry
        lastSyncedChain.current = null;
      } finally {
        isSyncing.current = false;
      }
    };

    // Add a small delay before syncing to avoid immediate rate limits
    const timeoutId = setTimeout(() => {
      if (activeChain && activeChain !== lastSyncedChain.current) {
        syncOraclePrice();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [activeChain, publicClient, writeContract]);

  // Refetch price when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchPrice();
    }
  }, [isConfirmed, refetchPrice]);

  return {
    isSyncing: isSyncing.current || isConfirming,
  };
};

