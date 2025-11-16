"use client";

import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContract } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { TRANCHE_VAULT_ADDRESS, USDC_ADDRESS, Tranche } from "@/lib/procti/addresses";
import { TRANCHE_VAULT_ABI } from "@/lib/procti/abi";
import { USDC_ABI } from "@/config/contracts";

/**
 * @hook useProctiContract
 * @description Hook for interacting with TrancheVault contract
 * @notice Does NOT override existing wallet logic - uses existing provider/signer
 */
export const useProctiContract = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read owner address
  const { data: owner } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "owner",
  });

  /**
   * Check if current user is owner
   */
  const isOwner = address && owner && address.toLowerCase() === owner.toLowerCase();

  /**
   * Deposit USDC into a tranche
   * @param amount Amount in USDC (string, e.g., "1000")
   * @param tranche Tranche enum (Senior, Mezz, Junior)
   */
  const deposit = async (amount: string, tranche: Tranche) => {
    try {
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

      // First approve USDC spending
      await writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [TRANCHE_VAULT_ADDRESS, amountWei],
      });

      // Wait a bit for approval to be mined
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Then deposit
      await writeContract({
        address: TRANCHE_VAULT_ADDRESS,
        abi: TRANCHE_VAULT_ABI,
        functionName: "deposit",
        args: [amountWei, tranche],
      });
    } catch (err) {
      console.error("Deposit error:", err);
      throw err;
    }
  };

  /**
   * Withdraw shares from a tranche
   * @param shares Number of shares to withdraw (bigint)
   * @param tranche Tranche enum
   */
  const withdraw = async (shares: bigint, tranche: Tranche) => {
    try {
      await writeContract({
        address: TRANCHE_VAULT_ADDRESS,
        abi: TRANCHE_VAULT_ABI,
        functionName: "withdraw",
        args: [shares, tranche],
      });
    } catch (err) {
      console.error("Withdraw error:", err);
      throw err;
    }
  };

  /**
   * Update epoch with new scores (owner only)
   * @param yieldScore Yield score (0-10000)
   * @param securityScore Security score (0-10000)
   * @param liquidityScore Liquidity score (0-10000)
   */
  const updateEpoch = async (
    yieldScore: number,
    securityScore: number,
    liquidityScore: number
  ) => {
    try {
      await writeContract({
        address: TRANCHE_VAULT_ADDRESS,
        abi: TRANCHE_VAULT_ABI,
        functionName: "updateEpoch",
        args: [
          BigInt(yieldScore),
          BigInt(securityScore),
          BigInt(liquidityScore),
        ],
      });
    } catch (err) {
      console.error("Update epoch error:", err);
      throw err;
    }
  };

  // Read share price for estimation
  const { data: seniorSharePrice } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getSharePrice",
    args: [Tranche.Senior],
  });

  const { data: mezzSharePrice } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getSharePrice",
    args: [Tranche.Mezz],
  });

  const { data: juniorSharePrice } = useReadContract({
    address: TRANCHE_VAULT_ADDRESS,
    abi: TRANCHE_VAULT_ABI,
    functionName: "getSharePrice",
    args: [Tranche.Junior],
  });

  /**
   * Estimate shares for a deposit amount
   * @param amount Amount in USDC
   * @param tranche Tranche enum
   * @returns Estimated shares
   */
  const estimateShares = (amount: string, tranche: Tranche): bigint => {
    try {
      const sharePrice =
        tranche === Tranche.Senior
          ? seniorSharePrice
          : tranche === Tranche.Mezz
          ? mezzSharePrice
          : juniorSharePrice;

      if (sharePrice && sharePrice > 0n) {
        const amountWei = parseUnits(amount, 6);
        // shares = amount * 1e18 / sharePrice
        return (amountWei * BigInt(1e18)) / (sharePrice as bigint);
      }

      // If no shares exist yet, return 1:1
      return parseUnits(amount, 6);
    } catch (err) {
      console.error("Estimate shares error:", err);
      return 0n;
    }
  };

  return {
    deposit,
    withdraw,
    updateEpoch,
    estimateShares,
    isOwner,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    hash,
  };
};

