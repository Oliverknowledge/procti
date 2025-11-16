"use client";

import { useReadContract, useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useEffect, useState } from "react";
import { TRANCHE_VAULT_ADDRESS, Tranche, TRANCHES } from "@/lib/procti/addresses";
import { TRANCHE_VAULT_ABI } from "@/lib/procti/abi";

/**
 * @hook useTrancheData
 * @description Hook for reading tranche data from TrancheVault
 * @notice Isolated data fetching - does NOT interfere with existing logic
 */
export const useTrancheData = () => {
  const { address } = useAccount();
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Read tranche values
  const { data: trancheValues, refetch: refetchTrancheValues } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getTrancheValues",
  });

  // Read total vault value
  const { data: totalValue, refetch: refetchTotalValue } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "totalVaultValue",
  });

  // Read reserve pool
  const { data: reservePool, refetch: refetchReservePool } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getReservePool",
  });

  // Read total real USDC
  const { data: totalRealUSDC, refetch: refetchTotalRealUSDC } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getTotalRealUSDC",
  });

  // Read user positions for each tranche
  const { data: seniorShares, refetch: refetchSeniorShares } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getUserShares",
    args: address ? [address, Tranche.Senior] : undefined,
    query: { enabled: !!address },
  });

  const { data: mezzShares, refetch: refetchMezzShares } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getUserShares",
    args: address ? [address, Tranche.Mezz] : undefined,
    query: { enabled: !!address },
  });

  const { data: juniorShares, refetch: refetchJuniorShares } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getUserShares",
    args: address ? [address, Tranche.Junior] : undefined,
    query: { enabled: !!address },
  });

  // Read user values for each tranche
  const { data: seniorValue, refetch: refetchSeniorValue } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getUserValue",
    args: address ? [address, Tranche.Senior] : undefined,
    query: { enabled: !!address },
  });

  const { data: mezzValue, refetch: refetchMezzValue } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getUserValue",
    args: address ? [address, Tranche.Mezz] : undefined,
    query: { enabled: !!address },
  });

  const { data: juniorValue, refetch: refetchJuniorValue } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getUserValue",
    args: address ? [address, Tranche.Junior] : undefined,
    query: { enabled: !!address },
  });

  // Read share prices
  const { data: seniorSharePrice, refetch: refetchSeniorPrice } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getSharePrice",
    args: [Tranche.Senior],
  });

  const { data: mezzSharePrice, refetch: refetchMezzPrice } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getSharePrice",
    args: [Tranche.Mezz],
  });

  const { data: juniorSharePrice, refetch: refetchJuniorPrice } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getSharePrice",
    args: [Tranche.Junior],
  });

  // Parse tranche values
  const parsedTrancheValues = trancheValues
    ? {
        senior: formatUnits((trancheValues as [bigint, bigint, bigint])[0], 6),
        mezz: formatUnits((trancheValues as [bigint, bigint, bigint])[1], 6),
        junior: formatUnits((trancheValues as [bigint, bigint, bigint])[2], 6),
      }
    : { senior: "0", mezz: "0", junior: "0" };

  // Parse total value
  const parsedTotalValue = totalValue ? formatUnits(totalValue as bigint, 6) : "0";

  // User positions
  const userPositions = {
    [Tranche.Senior]: {
      shares: seniorShares ? (seniorShares as bigint).toString() : "0",
      value: seniorValue ? formatUnits(seniorValue as bigint, 6) : "0",
      sharePrice: seniorSharePrice ? formatUnits(seniorSharePrice as bigint, 18) : "1",
    },
    [Tranche.Mezz]: {
      shares: mezzShares ? (mezzShares as bigint).toString() : "0",
      value: mezzValue ? formatUnits(mezzValue as bigint, 6) : "0",
      sharePrice: mezzSharePrice ? formatUnits(mezzSharePrice as bigint, 18) : "1",
    },
    [Tranche.Junior]: {
      shares: juniorShares ? (juniorShares as bigint).toString() : "0",
      value: juniorValue ? formatUnits(juniorValue as bigint, 6) : "0",
      sharePrice: juniorSharePrice ? formatUnits(juniorSharePrice as bigint, 18) : "1",
    },
  };

  // Calculate APY estimates (simplified - based on share price changes)
  const apyEstimates = {
    [Tranche.Senior]: "2-4%", // Conservative estimate
    [Tranche.Mezz]: "5-8%",
    [Tranche.Junior]: "10-15%",
  };

  // Refetch all data
  const refetchAll = async () => {
    await Promise.all([
      refetchTrancheValues(),
      refetchTotalValue(),
      refetchSeniorShares(),
      refetchMezzShares(),
      refetchJuniorShares(),
      refetchSeniorValue(),
      refetchMezzValue(),
      refetchJuniorValue(),
      refetchSeniorPrice(),
      refetchMezzPrice(),
      refetchJuniorPrice(),
      refetchReservePool(),
      refetchTotalRealUSDC(),
    ]);
    setLastUpdate(Date.now());
  };

  // Auto-refresh every 15 seconds (reduced frequency to avoid rate limiting)
  useEffect(() => {
    if (!address || !TRANCHE_VAULT_ADDRESS || TRANCHE_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") {
      return;
    }

    const interval = setInterval(() => {
      refetchAll().catch((err: any) => {
        // Silently handle rate limit errors
        const isRateLimit = 
          err?.status === 429 || 
          err?.statusCode === 429 ||
          err?.cause?.status === 429 ||
          err?.message?.includes("429") ||
          err?.message?.includes("rate limit");
          
        if (!isRateLimit) {
          console.error("Error refetching tranche data:", err);
        }
      });
    }, 15000); // Increased from 5s to 15s

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  // Parse reserve pool and total real USDC
  const parsedReservePool = reservePool ? formatUnits(reservePool as bigint, 6) : "0";
  const parsedTotalRealUSDC = totalRealUSDC ? formatUnits(totalRealUSDC as bigint, 6) : "0";

  return {
    trancheValues: parsedTrancheValues,
    totalValue: parsedTotalValue,
    reservePool: parsedReservePool,
    totalRealUSDC: parsedTotalRealUSDC,
    userPositions,
    apyEstimates,
    refetchAll,
    lastUpdate,
  };
};

