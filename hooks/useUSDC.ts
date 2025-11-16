"use client";

import { useReadContract, useWriteContract, useAccount, usePublicClient } from "wagmi";
import { USDC_ADDRESS, USDC_ABI } from "@/config/contracts";
import { formatUnits, parseUnits } from "viem";

export const useUSDC = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();

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
      
      console.log("Approving USDC:", {
        spender,
        amount: amount,
        amountWei: amountWei.toString(),
      });
      
      // Some tokens (like USDC) require resetting approval to 0 first
      // Try to reset first, then approve
      try {
        await writeContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: "approve",
          args: [spender, 0n],
        });
        
        // Wait a bit for the reset transaction
        // Note: hash is from the hook's data, we'll wait for it in the next approval step
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (resetErr) {
        // If reset fails, continue anyway (might not be needed)
        console.log("Reset approval skipped or failed (this is OK):", resetErr);
      }
      
      // Now approve the actual amount
      await writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [spender, amountWei],
      });
      
      // Wait for approval transaction confirmation
      // Note: writeContract doesn't return hash directly, it's in the hook's data
      // The useWaitForTransactionReceipt hook will handle confirmation
      // For now, just return - the hash will be available via the hook's data property
      return;
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

