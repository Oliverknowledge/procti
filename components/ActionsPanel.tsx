"use client";

import { useState } from "react";
import { useVault } from "@/hooks/useVault";
import { useOracle } from "@/hooks/useOracle";
import { useUSDC } from "@/hooks/useUSDC";
import { contractsConfig } from "@/config/contracts";
import { parseUnits } from "viem";

export default function ActionsPanel() {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [riskPrice, setRiskPrice] = useState("0.998");
  const [isProcessing, setIsProcessing] = useState(false);

  const { deposit, withdraw, rebalance, isPending: vaultPending } = useVault();
  const { setPrice, isPending: oraclePending } = useOracle();
  const { balance: usdcBalance, approve, isPending: approvePending } = useUSDC();

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
      // First approve USDC spending
      await approve(contractsConfig.vault.address, depositAmount);
      // Wait a bit for approval to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Then deposit
      await deposit(depositAmount);
      setDepositAmount("");
    } catch (error: any) {
      console.error("Deposit error:", error);
      const errorMessage = error.message || "Unknown error";
      if (errorMessage.includes("insufficient balance")) {
        alert(
          `Insufficient USDC balance!\n\n` +
          `You have: ${availableBalance.toFixed(2)} USDC\n` +
          `Trying to deposit: ${depositValue.toFixed(2)} USDC\n\n` +
          `You need to get USDC tokens first. The USDC contract address is:\n` +
          `0x3600000000000000000000000000000000000000`
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
      // First set oracle price to 1.00 to ensure Farming mode
      await setPrice("1.00");
      // Wait for price update to be confirmed
      await new Promise((resolve) => setTimeout(resolve, 3000));
      // Then trigger rebalance (will put funds in Yield Pool in Farming mode)
      await rebalance();
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
          <p className="text-xs text-gray-500 mb-4">
            Sets oracle price to $1.00, switches to Farming mode, and rebalances funds to Yield Pool.
          </p>
          <button
            type="button"
            onClick={handleRebalance}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-sm font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Processing..." : "Rebalance Now"}
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

