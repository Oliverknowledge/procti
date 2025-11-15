"use client";

import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { USDC_ADDRESS, USDC_ABI } from "@/config/contracts";
import { formatUnits, parseUnits } from "viem";

export const useUSDC = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Read user USDC balance
  const {
    data: balance,
    refetch: refetchBalance,
    error: balanceError,
    isLoading: isLoadingBalance,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });


  // Approve USDC spending
  const approve = async (spender: `0x${string}`, amount: string) => {
    try {
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      await writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [spender, amountWei],
      });
    } catch (err) {
      console.error("Approve error:", err);
      throw err;
    }
  };

  return {
    balance: balance && typeof balance === 'bigint' ? formatUnits(balance, 6) : "0",
    refetchBalance,
    approve,
    isPending,
    error: error || balanceError,
    isLoadingBalance,
  };
};

