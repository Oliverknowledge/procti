"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { formatUnits, parseUnits } from "viem";

export const useOracle = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const publicClient = usePublicClient();

  // Read current price
  const { data: price, refetch: refetchPrice } = useReadContract({
    address: contractsConfig.oracle.address,
    abi: contractsConfig.oracle.abi,
    functionName: "getPrice",
  });

  const setPrice = async (priceValue: string) => {
    try {
      // Price is in 18 decimals (e.g., 0.998 = 998000000000000000)
      const priceWei = parseUnits(priceValue, 18);
      console.log("Setting oracle price to:", priceValue, "wei:", priceWei.toString());
      
      await writeContract({
        address: contractsConfig.oracle.address,
        abi: contractsConfig.oracle.abi,
        functionName: "setPrice",
        args: [priceWei],
      });
      
      // Wait for transaction confirmation using the hash from useWriteContract
      // Note: writeContract doesn't return the hash directly, it's stored in the hook's data
      // We'll use useWaitForTransactionReceipt which is already set up
      // For now, just return - the hash will be available via the hook's data property
      return;
    } catch (err) {
      console.error("Set price error:", err);
      throw err;
    }
  };

  const simulateRisk = async () => {
    try {
      // Set price to 0.998 (representing a 0.2% drop)
      // Price uses 18 decimals: 0.998 = 998000000000000000
      await setPrice("0.998");
    } catch (err) {
      console.error("Simulate risk error:", err);
      throw err;
    }
  };

  const getPriceFormatted = () => {
    if (!price || typeof price !== 'bigint') return "0";
    return formatUnits(price, 18);
  };

  return {
    price,
    priceFormatted: getPriceFormatted(),
    setPrice,
    simulateRisk,
    refetchPrice,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
};

