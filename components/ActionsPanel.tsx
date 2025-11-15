"use client";

import { useState } from "react";
import { useVault } from "@/hooks/useVault";
import { useOracle } from "@/hooks/useOracle";
import { useUSDC } from "@/hooks/useUSDC";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { usePublicClient } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { parseUnits, formatUnits } from "viem";

export default function ActionsPanel() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [riskPrice, setRiskPrice] = useState("0.998");
  const [isProcessing, setIsProcessing] = useState(false);

  const { deposit, withdraw, rebalance, rebalanceWithActiveChainPrice, refetchVaultBalance, isPending: vaultPending } = useVault();
  const { activeChain } = useCrossChainArb();
  const publicClient = usePublicClient();
  const { setPrice, isPending: oraclePending } = useOracle();
  const { balance: usdcBalance, approve, isPending: approvePending, checkAllowance, refetchBalance } = useUSDC();

  const handleDeposit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Check if user has enough USDC balance
    const depositValue = parseFloat(depositAmount);
    const availableBalance = parseFloat(usdcBalance || "0");
    
    if (depositValue > availableBalance) {
      alert(
        `Insufficient USDC balance!\n\n` +
        `You have: ${availableBalance.toFixed(2)} USDC\n` +
        `Trying to deposit: ${depositValue.toFixed(2)} USDC\n\n` +
        `You need to get USDC tokens first. Check the MockUSDC contract on Arc testnet.`
      );
      return;
    }

    try {
      setIsProcessing(true);
      
      // Step 1: Check and approve USDC spending
      try {
        // Check current allowance first
        if (checkAllowance) {
          const currentAllowance = await checkAllowance(contractsConfig.vault.address);
          const amountWei = parseUnits(depositAmount, 6);
          console.log("Current allowance:", formatUnits(currentAllowance, 6), "USDC");
          console.log("Required amount:", depositAmount, "USDC");
          
          if (currentAllowance < amountWei) {
            console.log("Insufficient allowance, requesting approval...");
            // This should trigger wallet popup
            await approve(contractsConfig.vault.address, depositAmount);
          } else {
            console.log("Allowance sufficient, skipping approval");
          }
        } else {
          // Fallback: always try to approve
          await approve(contractsConfig.vault.address, depositAmount);
        }
      } catch (approveError: any) {
        console.error("Approval error:", approveError);
        if (approveError?.message?.includes("rejected") || approveError?.message?.includes("denied")) {
          alert("Approval was rejected. Please approve the transaction in your wallet to continue.");
          return;
        }
        if (approveError?.message?.includes("hash not received")) {
          alert(
            "Approval transaction not started.\n\n" +
            "Please check:\n" +
            "1. Your wallet is connected\n" +
            "2. Your wallet popup is not blocked\n" +
            "3. Try refreshing the page and connecting your wallet again\n\n" +
            "Then try depositing again."
          );
          return;
        }
        throw approveError;
      }
      
      // Step 2: Deposit (after approval is confirmed)
      await deposit(depositAmount);
      setDepositAmount("");
      
      // Refetch balances after successful deposit
      refetchVaultBalance();
      refetchBalance();
    } catch (error: any) {
      console.error("Deposit error:", error);
      const errorMessage = error.message || "Unknown error";
      if (errorMessage.includes("insufficient balance") || errorMessage.includes("exceeds allowance")) {
        alert(
          `Deposit failed!\n\n` +
          `Error: ${errorMessage}\n\n` +
          `You have: ${availableBalance.toFixed(2)} USDC\n` +
          `Trying to deposit: ${depositValue.toFixed(2)} USDC\n\n` +
          `Make sure you have approved the vault to spend your USDC.`
        );
      } else if (errorMessage.includes("exceeds allowance")) {
        alert(
          `Insufficient allowance!\n\n` +
          `The vault needs approval to transfer your USDC.\n` +
          `Please try depositing again - the approval step should happen automatically.`
        );
      } else {
        alert(`Deposit failed: ${errorMessage}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      setIsProcessing(true);
      await withdraw(withdrawAmount);
      // Wait for transaction to be confirmed and refetch balances
      await new Promise((resolve) => setTimeout(resolve, 3000));
      refetchVaultBalance();
      refetchAll();
      refetchBalance();
      setWithdrawAmount("");
    } catch (error: any) {
      console.error("Withdraw error:", error);
      alert(`Withdraw failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRebalance = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsProcessing(true);
      
      // Use active chain's price if available, otherwise use default
      if (activeChain && publicClient) {
        // Rebalance using the active chain's price
        await rebalanceWithActiveChainPrice(activeChain, publicClient);
      } else {
        // Fallback: set oracle price to 1.00 to ensure Farming mode
        await setPrice("1.00");
        // Wait for price update to be confirmed
        await new Promise((resolve) => setTimeout(resolve, 3000));
        // Then trigger rebalance (will put funds in Yield Pool in Farming mode)
        await rebalance();
      }
    } catch (error: any) {
      console.error("Rebalance error:", error);
      alert(`Rebalance failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateRisk = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!riskPrice || parseFloat(riskPrice) <= 0 || parseFloat(riskPrice) > 1) {
      alert("Please enter a valid price between 0 and 1 (e.g., 0.998 for $0.998)");
      return;
    }
    
    try {
      setIsProcessing(true);
      // First set the price to the user-specified value
      await setPrice(riskPrice);
      // Wait for transaction to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // Then trigger rebalance
      await rebalance();
    } catch (error: any) {
      console.error("Simulate risk error:", error);
      alert(`Simulate risk failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing || vaultPending || oraclePending || approvePending;

  return (
    <div className="w-full space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Actions</h2>

      <div className="space-y-4">
        {/* Deposit Section */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm text-gray-900">Deposit</label>
            <span className="text-xs text-gray-500">
              Available: {parseFloat(usdcBalance || "0").toFixed(2)} USDC
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              max={usdcBalance || "0"}
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleDeposit}
              disabled={
                isLoading ||
                !depositAmount ||
                parseFloat(depositAmount) <= 0 ||
                parseFloat(depositAmount) > parseFloat(usdcBalance || "0")
              }
              className="px-5 py-2 bg-blue-600 text-white rounded-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Deposit
            </button>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <label className="block text-sm text-gray-900 mb-3">Withdraw</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleWithdraw}
              disabled={isLoading || !withdrawAmount}
              className="px-5 py-2 bg-gray-700 text-white rounded-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Withdraw
            </button>
          </div>
        </div>

        {/* Rebalance Section */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <label className="block text-sm text-gray-900 mb-2">Rebalance</label>
          <p className="text-xs text-gray-500 mb-3">
            Rebalancing is <strong>automatic</strong>. The vault monitors the active chain's price ({activeChain || "loading..."}) 
            and automatically moves funds between Yield Pool and Safe Pool based on price thresholds.
          </p>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-sm">
            <p className="text-xs text-blue-800">
              <strong>Auto-Rebalance:</strong> When price crosses $0.999 threshold or changes significantly, 
              funds are automatically rebalanced. Manual rebalance available below.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRebalance}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processing..." : "Manual Rebalance"}
          </button>
        </div>

        {/* Simulate Risk Section */}
        <div className="bg-white border border-gray-200 rounded-sm p-5">
          <label className="block text-sm text-gray-900 mb-2">Risk Simulation</label>
          <p className="text-xs text-gray-500 mb-3">
            Set a custom price to simulate a market drop and trigger rebalance.
          </p>
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Price (USD)</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                max="1"
                value={riskPrice}
                onChange={(e) => setRiskPrice(e.target.value)}
                placeholder="0.998"
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-orange-500 text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                disabled={isLoading}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSimulateRisk}
            disabled={
              isLoading ||
              !riskPrice ||
              parseFloat(riskPrice) <= 0 ||
              parseFloat(riskPrice) > 1
            }
            className="px-6 py-2 bg-orange-600 text-white rounded-sm font-medium hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processing..." : "Simulate Risk Event"}
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Example: 0.998 = $0.998 (0.2% drop), 0.995 = $0.995 (0.5% drop)
          </p>
        </div>
      </div>
    </div>
  );
}

