"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { formatUnits, parseUnits } from "viem";
import { useEffect, useState, useCallback } from "react";

export interface ChainData {
  name: string;
  price: number;
  yield: number;
  risk: number;
  score: number;
}

export const useCrossChainArb = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const publicClient = usePublicClient();

  // Read supported chains
  const { data: supportedChains, refetch: refetchChains } = useReadContract({
    address: contractsConfig.crossChainArb.address,
    abi: contractsConfig.crossChainArb.abi,
    functionName: "getSupportedChains",
    query: {
      refetchInterval: false, // Disable auto-refetch
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  });

  // Read best chain
  const { data: bestChain, refetch: refetchBestChain } = useReadContract({
    address: contractsConfig.crossChainArb.address,
    abi: contractsConfig.crossChainArb.abi,
    functionName: "bestChain",
    query: {
      refetchInterval: false, // Disable auto-refetch
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  });

  // Read active chain
  const { data: activeChain, refetch: refetchActiveChain } = useReadContract({
    address: contractsConfig.crossChainArb.address,
    abi: contractsConfig.crossChainArb.abi,
    functionName: "activeChain",
    query: {
      refetchInterval: false, // Disable auto-refetch
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  });

  const [chainData, setChainData] = useState<ChainData[]>([]);
  const [isLoadingChains, setIsLoadingChains] = useState(false);

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
          console.warn(`Rate limited (429), retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
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

  // Fetch all chain data with rate limiting
  const fetchAllChainData = useCallback(async () => {
    if (!publicClient || !supportedChains || !Array.isArray(supportedChains)) return;

    try {
      setIsLoadingChains(true);
      const data: ChainData[] = [];

      // Process chains sequentially with longer delays to avoid rate limiting
      for (let i = 0; i < supportedChains.length; i++) {
        const chain = supportedChains[i];
        
        // Add longer delay between chains to avoid rate limiting
        // Increased delays to prevent 429 errors
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Increased from 1s to 2s
        }

        try {
          // Fetch data for this chain sequentially (not in parallel) to reduce load
          // Increased delays between calls to avoid rate limiting
          const price = await retryWithBackoff(() =>
            publicClient.readContract({
              address: contractsConfig.crossChainArb.address,
              abi: contractsConfig.crossChainArb.abi,
              functionName: "chainPrices",
              args: [chain],
            })
          );
          
          // Increased delay between each call
          await new Promise((resolve) => setTimeout(resolve, 500)); // Increased from 200ms to 500ms
          
          const yield_ = await retryWithBackoff(() =>
            publicClient.readContract({
              address: contractsConfig.crossChainArb.address,
              abi: contractsConfig.crossChainArb.abi,
              functionName: "chainYields",
              args: [chain],
            })
          );
          
          await new Promise((resolve) => setTimeout(resolve, 500)); // Increased from 200ms to 500ms
          
          const risk = await retryWithBackoff(() =>
            publicClient.readContract({
              address: contractsConfig.crossChainArb.address,
              abi: contractsConfig.crossChainArb.abi,
              functionName: "chainRiskScores",
              args: [chain],
            })
          );
          
          await new Promise((resolve) => setTimeout(resolve, 500)); // Increased from 200ms to 500ms
          
          const score = await retryWithBackoff(() =>
            publicClient.readContract({
              address: contractsConfig.crossChainArb.address,
              abi: contractsConfig.crossChainArb.abi,
              functionName: "getChainScore",
              args: [chain],
            })
          );

          // Process the fetched data
          const chainInfo = {
            name: chain,
            price: Number(formatUnits(price as bigint, 18)),
            yield: Number(formatUnits(yield_ as bigint, 18)) * 100, // Convert to percentage
            risk: Number(risk),
            score: Number(formatUnits(score as bigint, 18)),
          };
          
          console.log(`Chain data for ${chain}:`, chainInfo);
          data.push(chainInfo);
        } catch (err: any) {
          console.error(`Error fetching data for chain ${chain}:`, err);
          // Continue with other chains even if one fails
        }
      }

      setChainData(data);
    } catch (err) {
      console.error("Error fetching chain data:", err);
    } finally {
      setIsLoadingChains(false);
    }
  }, [publicClient, supportedChains]);

  // DISABLED: Automatic fetching causes too many RPC calls (20+ per fetch)
  // Chain data will only be fetched when explicitly called via refetchChainData
  // Users can manually refresh via ChainDataManager component
  // useEffect(() => {
  //   if (supportedChains && publicClient) {
  //     fetchAllChainData();
  //   }
  // }, [supportedChains, publicClient]);

  // Set chain price
  const setChainPrice = async (chain: string, price: string) => {
    try {
      const priceWei = parseUnits(price, 18);
      await writeContract({
        address: contractsConfig.crossChainArb.address,
        abi: contractsConfig.crossChainArb.abi,
        functionName: "setChainPrice",
        args: [chain, priceWei],
      });
    } catch (err) {
      console.error("Set chain price error:", err);
      throw err;
    }
  };

  // Set chain yield
  const setChainYield = async (chain: string, yieldPercent: string) => {
    try {
      // Convert percentage to decimal (e.g., 5% -> 0.05)
      const yieldDecimal = (parseFloat(yieldPercent) / 100).toString();
      const yieldWei = parseUnits(yieldDecimal, 18);
      await writeContract({
        address: contractsConfig.crossChainArb.address,
        abi: contractsConfig.crossChainArb.abi,
        functionName: "setChainYield",
        args: [chain, yieldWei],
      });
    } catch (err) {
      console.error("Set chain yield error:", err);
      throw err;
    }
  };

  // Set chain risk
  const setChainRisk = async (chain: string, risk: number) => {
    try {
      // Risk must be an integer (0-100), round to nearest integer
      const riskInt = Math.round(Math.max(0, Math.min(100, risk)));
      await writeContract({
        address: contractsConfig.crossChainArb.address,
        abi: contractsConfig.crossChainArb.abi,
        functionName: "setChainRisk",
        args: [chain, BigInt(riskInt)],
      });
    } catch (err) {
      console.error("Set chain risk error:", err);
      throw err;
    }
  };

  // Detect arbitrage
  const detectArbitrage = async (chainA: string, chainB: string, bridgeFeePercent: number) => {
    try {
      const bridgeFee = parseUnits((bridgeFeePercent / 100).toString(), 18);
      const result = await publicClient?.readContract({
        address: contractsConfig.crossChainArb.address,
        abi: contractsConfig.crossChainArb.abi,
        functionName: "detectArbitrage",
        args: [chainA, chainB, bridgeFee],
      });

      if (!result || !Array.isArray(result) || result.length < 2) {
        return { profitable: false, profit: 0 };
      }

      const profitWei = result[1] as bigint;
      
      // Log for debugging
      console.log("Arbitrage detection result (raw):", {
        chainA,
        chainB,
        bridgeFeePercent,
        profitable: result[0],
        profitWei: profitWei.toString(),
        profitWeiHex: profitWei.toString(16),
      });

      // The profit might be in USDC decimals (6) or 18 decimals
      // Try both and see which makes sense
      let profit = Number(formatUnits(profitWei, 18));
      
      // If profit is absurdly large, try 6 decimals (USDC format)
      if (profit > 1000000 || profit < -1000000) {
        console.log("Profit too large with 18 decimals, trying 6 decimals (USDC format)");
        profit = Number(formatUnits(profitWei, 6));
      }
      
      // Validate profit is reasonable (should be between -$1M and $1M for USDC arbitrage)
      if (Math.abs(profit) > 1000000) {
        console.warn("Profit value seems incorrect, setting to 0");
        profit = 0;
      }

      console.log("Arbitrage detection result (final):", {
        chainA,
        chainB,
        bridgeFeePercent,
        profitable: result[0],
        profit,
      });

      return {
        profitable: result[0] as boolean,
        profit,
      };
    } catch (err) {
      console.error("Detect arbitrage error:", err);
      throw err;
    }
  };

  // Calculate best chain from scores if contract doesn't return one
  const calculatedBestChain = chainData.length > 0
    ? chainData.reduce((best, current) => 
        current.score > best.score ? current : best
      ).name
    : "";

  // Use contract's bestChain if available, otherwise use calculated one
  const effectiveBestChain = (bestChain as string) || calculatedBestChain;

  console.log("Best chain from contract:", bestChain);
  console.log("Calculated best chain:", calculatedBestChain);
  console.log("Effective best chain:", effectiveBestChain);

  // Switch to best chain
  const switchToBestChain = async () => {
    try {
      await writeContract({
        address: contractsConfig.crossChainArb.address,
        abi: contractsConfig.crossChainArb.abi,
        functionName: "switchToBestChain",
        args: [],
      });
    } catch (err) {
      console.error("Switch to best chain error:", err);
      throw err;
    }
  };

  // Simulate bridge
  const simulateBridge = async (toChain: string, amount: string) => {
    try {
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      await writeContract({
        address: contractsConfig.crossChainArb.address,
        abi: contractsConfig.crossChainArb.abi,
        functionName: "simulateBridge",
        args: [toChain, amountWei],
      });
    } catch (err) {
      console.error("Simulate bridge error:", err);
      throw err;
    }
  };

  return {
    supportedChains: (supportedChains as string[]) || [],
    bestChain: effectiveBestChain,
    activeChain: (activeChain as string) || "",
    chainData,
    isLoadingChains,
    setChainPrice,
    setChainYield,
    setChainRisk,
    detectArbitrage,
    switchToBestChain,
    simulateBridge,
    refetchChains,
    refetchBestChain,
    refetchActiveChain,
    refetchChainData: fetchAllChainData,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
};

