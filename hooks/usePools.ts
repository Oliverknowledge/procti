"use client";

import { useReadContract } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { formatUnits } from "viem";

export const usePools = () => {
  // Read YieldPool balance
  const {
    data: yieldPoolBalance,
    refetch: refetchYieldPool,
    isLoading: isLoadingYield,
  } = useReadContract({
    address: contractsConfig.yieldPool.address,
    abi: contractsConfig.yieldPool.abi,
    functionName: "getTotalBalance",
    query: {
      refetchInterval: false, // Disable auto-refetch
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  });

  // Read SafePool balance
  const {
    data: safePoolBalance,
    refetch: refetchSafePool,
    isLoading: isLoadingSafe,
  } = useReadContract({
    address: contractsConfig.safePool.address,
    abi: contractsConfig.safePool.abi,
    functionName: "getTotalBalance",
    query: {
      refetchInterval: false, // Disable auto-refetch
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  });

  const refetchAll = () => {
    refetchYieldPool();
    refetchSafePool();
  };

  return {
    yieldPoolBalance: yieldPoolBalance ? formatUnits(yieldPoolBalance, 6) : "0",
    safePoolBalance: safePoolBalance ? formatUnits(safePoolBalance, 6) : "0",
    refetchYieldPool,
    refetchSafePool,
    refetchAll,
    isLoading: isLoadingYield || isLoadingSafe,
  };
};

