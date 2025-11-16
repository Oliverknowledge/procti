"use client";

import { useState, useEffect } from "react";
import { useVault } from "@/hooks/useVault";
import { useUSDC } from "@/hooks/useUSDC";
import { usePools } from "@/hooks/usePools";
import { useOracle } from "@/hooks/useOracle";
import { contractsConfig, USDC_ADDRESS, USDC_ABI } from "@/config/contracts";
import { useReadContract, useAccount } from "wagmi";
import { formatUnits, parseUnits } from "viem";

/**
 * @component SentinelVaultDeposit
 * @description Panel for depositing USDC into SentinelVault (which uses SafePool/YieldPool)
 */
export default function SentinelVaultDeposit() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");
  const { deposit, modeString, vaultBalance, isPending, isConfirming } = useVault();
  const { balance, refetchBalance, approve } = useUSDC();
  const { refetchAll: refetchPools } = usePools();
  const { priceFormatted } = useOracle();
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);

  // Check USDC allowance for SentinelVault
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "allowance",
    args: address ? [address, contractsConfig.vault.address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Check if approval is needed
  useEffect(() => {
    if (amount && allowance !== undefined && address) {
      const amountWei = parseUnits(amount, 6);
      const allowanceBigInt = typeof allowance === 'bigint' ? allowance : BigInt(0);
      setNeedsApproval(amountWei > allowanceBigInt);
    } else {
      setNeedsApproval(false);
    }
  }, [amount, allowance, address]);

  const handleApprove = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter an amount first");
      return;
    }

    try {
      setIsApproving(true);
      setError(null);
      
      // Approve a generous amount to avoid frequent re-approvals
      // Approve 10x the amount or at least 1000 USDC, whichever is larger
      const minApproval = Math.max(parseFloat(amount) * 10, 1000);
      const approveAmount = minApproval.toString();
      
      console.log("Starting approval process...", { amount, approveAmount });
      
      const receipt = await approve(contractsConfig.vault.address, approveAmount);
      console.log("Approval completed:", receipt);
      
      // Refetch allowance after approval (multiple times to ensure update)
      refetchAllowance();
      setTimeout(() => {
        refetchAllowance();
      }, 1000);
      setTimeout(() => {
        refetchAllowance();
      }, 3000);
    } catch (err: any) {
      console.error("Approval error:", err);
      const errorMsg = err.message || err.toString() || "Failed to approve USDC";
      setError(errorMsg.includes("user rejected") 
        ? "Approval was cancelled. Please try again."
        : errorMsg);
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeposit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(balance);

    if (amountNum > balanceNum) {
      setError(`Insufficient balance. You have ${balanceNum.toFixed(2)} USDC`);
      return;
    }

    // Check if approval is needed
    if (needsApproval) {
      setError("Please approve USDC spending first by clicking 'Approve USDC'");
      return;
    }

    try {
      setError(null);
      await deposit(amount);
      setAmount("");
      
      // Refetch balances after deposit
      setTimeout(() => {
        refetchBalance();
        refetchPools();
        refetchAllowance();
      }, 2000);
    } catch (err: any) {
      console.error("Deposit error:", err);
      
      // Check if error is about approval
      const errorMsg = err.message || err.toString() || "";
      if (errorMsg.includes("allowance") || errorMsg.includes("approve") || errorMsg.includes("ERC20")) {
        setError("Insufficient USDC allowance. Please click 'Approve USDC' first.");
        setNeedsApproval(true);
      } else {
        setError(err.message || "Failed to deposit. Please check the console for details.");
      }
    }
  };

  const handleMax = () => {
    setAmount(balance);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-gray-900">Sentinel Vault Deposit</h2>
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
            Pool-Based
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Deposit USDC into SentinelVault. Funds are automatically allocated to <strong>{modeString === "Farming" ? "Yield Pool" : modeString === "Defensive" ? "Safe Pool" : "the vault"}</strong> based on oracle price and your risk profile.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
          <p className="text-xs text-blue-800">
            <strong>How it works:</strong> SentinelVault automatically rebalances between Safe Pool (capital preservation) and Yield Pool (higher returns) based on USDC price stability. This is separate from the Tranche Vault system.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (USDC)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              disabled={isPending || isConfirming}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleMax}
              disabled={isPending || isConfirming || parseFloat(balance) === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Max
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Available: {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </p>
        </div>

        {/* Current Status */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-purple-700">Current Mode:</span>
              <span className="font-medium text-purple-900">{modeString}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Oracle Price:</span>
              <span className="font-medium text-purple-900">${parseFloat(priceFormatted || "0").toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-700">Vault Balance:</span>
              <span className="font-medium text-purple-900">
                ${parseFloat(vaultBalance || "0").toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          <p className="text-xs text-purple-700 mt-3">
            {modeString === "Farming" 
              ? "Funds will go to Yield Pool for higher returns" 
              : modeString === "Defensive"
              ? "Funds will go to Safe Pool for capital preservation"
              : "Funds will stay in the vault (Emergency mode)"}
          </p>
        </div>

        {/* Approval Status */}
        {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
          <div className={`rounded-lg p-3 ${needsApproval ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
            <div className="flex items-center justify-between text-sm">
              <span className={needsApproval ? "text-yellow-800" : "text-green-800"}>
                {needsApproval ? "⚠️ Approval Required" : "✓ Approved"}
              </span>
              {allowance !== undefined && (
                <span className={needsApproval ? "text-yellow-700" : "text-green-700"}>
                  Allowance: {formatUnits(typeof allowance === 'bigint' ? allowance : BigInt(0), 6)} USDC
                </span>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Approve Button (if needed) */}
        {needsApproval && amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
          <button
            onClick={handleApprove}
            disabled={isApproving || isPending || isConfirming}
            className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isApproving ? "Approving..." : "Approve USDC"}
          </button>
        )}

        {/* Deposit Button */}
        <button
          onClick={handleDeposit}
          disabled={!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0 || isPending || isConfirming || needsApproval}
          className="w-full px-4 py-3 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isPending || isConfirming ? "Processing..." : "Deposit to Sentinel Vault"}
        </button>

        <p className="text-xs text-gray-500 text-center">
          {needsApproval 
            ? "Step 1: Approve USDC spending, then Step 2: Deposit"
            : "Funds will be automatically allocated to the appropriate pool based on current mode"}
        </p>
      </div>
    </div>
  );
}

