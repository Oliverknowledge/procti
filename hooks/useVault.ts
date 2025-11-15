"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { parseUnits, formatUnits } from "viem";

export const useVault = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Read mode
  const { data: mode, refetch: refetchMode } = useReadContract({
    address: contractsConfig.vault.address,
    abi: contractsConfig.vault.abi,
    functionName: "getMode",
  });

  // Read vault balance (total deposits)
  const { data: vaultBalance, refetch: refetchVaultBalance } = useReadContract({
    address: contractsConfig.vault.address,
    abi: contractsConfig.vault.abi,
    functionName: "totalDeposits",
  });

  // Read user risk profile
  const { address } = useAccount();
  const { data: userRiskProfile, refetch: refetchRiskProfile } = useReadContract({
    address: contractsConfig.vault.address,
    abi: contractsConfig.vault.abi,
    functionName: "userRiskProfile",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const deposit = async (amount: string) => {
    try {
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      await writeContract({
        address: contractsConfig.vault.address,
        abi: contractsConfig.vault.abi,
        functionName: "deposit",
        args: [amountWei],
      });
    } catch (err) {
      console.error("Deposit error:", err);
      throw err;
    }
  };

  const withdraw = async (amount: string) => {
    try {
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      await writeContract({
        address: contractsConfig.vault.address,
        abi: contractsConfig.vault.abi,
        functionName: "withdraw",
        args: [amountWei],
      });
    } catch (err) {
      console.error("Withdraw error:", err);
      throw err;
    }
  };

  const rebalance = async () => {
    try {
      await writeContract({
        address: contractsConfig.vault.address,
        abi: contractsConfig.vault.abi,
        functionName: "rebalance",
      });
    } catch (err) {
      console.error("Rebalance error:", err);
      throw err;
    }
  };

  const setRiskProfile = async (profile: number) => {
    try {
      // Profile: 0 = Conservative, 1 = Balanced, 2 = Aggressive
      await writeContract({
        address: contractsConfig.vault.address,
        abi: contractsConfig.vault.abi,
        functionName: "setRiskProfile",
        args: [BigInt(profile)],
      });
    } catch (err) {
      console.error("Set risk profile error:", err);
      throw err;
    }
  };

  const getRiskProfileString = () => {
    if (userRiskProfile === undefined) return "Loading...";
    const profiles = ["Conservative", "Balanced", "Aggressive"];
    return profiles[Number(userRiskProfile)] || "Unknown";
  };

  const getModeString = () => {
    if (mode === undefined) return "Loading...";
    // Mode is uint256: 0 = Farming, 1 = Defensive, 2 = Emergency
    if (mode === 0n) return "Farming";
    if (mode === 1n) return "Defensive";
    if (mode === 2n) return "Emergency";
    return "Unknown";
  };

  const getModeColor = () => {
    if (mode === undefined) return "gray";
    // Mode is uint256: 0 = Farming, 1 = Defensive, 2 = Emergency
    if (mode === 0n) return "green";
    if (mode === 1n) return "yellow";
    if (mode === 2n) return "red";
    return "gray";
  };

  return {
    mode,
    modeString: getModeString(),
    modeColor: getModeColor(),
    vaultBalance: vaultBalance ? formatUnits(vaultBalance, 6) : "0",
    userRiskProfile,
    riskProfileString: getRiskProfileString(),
    deposit,
    withdraw,
    rebalance,
    setRiskProfile,
    refetchMode,
    refetchVaultBalance,
    refetchRiskProfile,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  };
};

