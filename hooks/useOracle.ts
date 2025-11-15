"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { formatUnits, parseUnits } from "viem";

export const useOracle = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

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
      await writeContract({
        address: contractsConfig.oracle.address,
        abi: contractsConfig.oracle.abi,
        functionName: "setPrice",
        args: [priceWei],
      });
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
    if (!price) return "0";
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

