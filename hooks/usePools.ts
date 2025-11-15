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
  });

  const refetchAll = () => {
    refetchYieldPool();
    refetchSafePool();
  };

  return {
    yieldPoolBalance: yieldPoolBalance && typeof yieldPoolBalance === 'bigint' ? formatUnits(yieldPoolBalance, 6) : "0",
    safePoolBalance: safePoolBalance && typeof safePoolBalance === 'bigint' ? formatUnits(safePoolBalance, 6) : "0",
    refetchYieldPool,
    refetchSafePool,
    refetchAll,
    isLoading: isLoadingYield || isLoadingSafe,
  };
};

