"use client";

import { useState } from "react";
import { Tranche, TRANCHES } from "@/lib/procti/addresses";
import { useProctiContract } from "@/hooks/useProctiContract";
import { useTrancheData } from "@/hooks/useTrancheData";

/**
 * @component WithdrawPanel
 * @description Panel for withdrawing shares from tranches
 * @notice Isolated component - connects via useProctiContract hook
 */
export default function WithdrawPanel() {
  const [selectedTranche, setSelectedTranche] = useState<Tranche>(Tranche.Senior);
  const [sharesToWithdraw, setSharesToWithdraw] = useState("");
  const { withdraw, isPending, isConfirming, error } = useProctiContract();
  const { userPositions, refetchAll } = useTrancheData();

  const position = userPositions[selectedTranche];
  const availableShares = position.shares;

  const handleWithdraw = async () => {
    if (!sharesToWithdraw || sharesToWithdraw.trim() === "") {
      alert("Please enter a number of shares to withdraw");
      return;
    }

    // Parse shares as BigInt directly from string (shares are stored with 6 decimals)
    let sharesBigInt: bigint;
    try {
      // Try to parse as BigInt directly (handles large numbers)
      sharesBigInt = BigInt(sharesToWithdraw);
    } catch (err) {
      alert("Invalid shares amount. Please enter a valid number.");
      return;
    }

    if (sharesBigInt <= 0n) {
      alert("Shares amount must be greater than 0");
      return;
    }

    const availableBigInt = BigInt(availableShares || "0");

    if (availableBigInt === 0n) {
      alert("You have no shares to withdraw in this tranche");
      return;
    }

    if (sharesBigInt > availableBigInt) {
      alert(`Insufficient shares. You have ${availableShares} shares available.`);
      return;
    }

    try {
      const trancheName = selectedTranche === Tranche.Senior ? "Senior" : selectedTranche === Tranche.Mezz ? "Mezz" : "Junior";
      console.log("Withdrawing:", {
        shares: sharesBigInt.toString(),
        tranche: selectedTranche,
        trancheName,
        available: availableBigInt.toString(),
        userValue: position.value,
        sharePrice: position.sharePrice,
      });
      
      // Double-check tranche value
      if (selectedTranche !== Tranche.Senior && selectedTranche !== Tranche.Mezz && selectedTranche !== Tranche.Junior) {
        throw new Error(`Invalid tranche value: ${selectedTranche}. Expected 0 (Senior), 1 (Mezz), or 2 (Junior).`);
      }
      
      await withdraw(sharesBigInt, selectedTranche);
      
      // Wait for transaction confirmation
      setTimeout(() => {
        refetchAll();
        setSharesToWithdraw("");
      }, 3000);
    } catch (err: any) {
      console.error("Withdraw failed:", err);
      console.error("Error context:", {
        shares: sharesBigInt.toString(),
        tranche: selectedTranche,
        trancheName: selectedTranche === Tranche.Senior ? "Senior" : selectedTranche === Tranche.Mezz ? "Mezz" : "Junior",
        available: availableBigInt.toString(),
      });
      const errorMessage = err?.message || err?.toString() || "Unknown error";
      alert(`Withdraw failed: ${errorMessage}`);
    }
  };

  const handleMax = () => {
    setSharesToWithdraw(availableShares);
  };

  const trancheInfo = TRANCHES[selectedTranche];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-gray-900">Withdraw from Tranche Vault</h2>
          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
            Structured Products
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Withdraw shares from a tranche. Your USDC value depends on the current share price.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Tranche
          </label>
          <select
            value={selectedTranche}
            onChange={(e) => {
              setSelectedTranche(parseInt(e.target.value) as Tranche);
              setSharesToWithdraw("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          >
            {TRANCHES.map((tranche) => (
              <option key={tranche.id} value={tranche.id}>
                {tranche.name} - {tranche.description}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 rounded-md p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Available Shares:</span>
            <span className="font-medium font-mono text-xs">{availableShares}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Your Value:</span>
            <span className="font-medium">
              {parseFloat(position.value).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USDC
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Share Price:</span>
            <span className="font-medium">
              ${parseFloat(position.sharePrice).toLocaleString(undefined, {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4,
              })}
            </span>
          </div>
        </div>

        {/* Estimated Withdrawal Amount */}
        {sharesToWithdraw && parseFloat(sharesToWithdraw) > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-purple-700 font-medium">Estimated Withdrawal:</span>
              <span className="text-purple-900 font-bold">
                {(
                  parseFloat(sharesToWithdraw) * parseFloat(position.sharePrice)
                ).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USDC
              </span>
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {parseFloat(sharesToWithdraw)} shares × ${parseFloat(position.sharePrice).toFixed(4)} ={" "}
              {(parseFloat(sharesToWithdraw) * parseFloat(position.sharePrice)).toFixed(2)} USDC
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shares to Withdraw
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={sharesToWithdraw}
              onChange={(e) => {
                // Allow only numbers
                const value = e.target.value.replace(/[^0-9]/g, "");
                setSharesToWithdraw(value);
              }}
              placeholder="Enter share amount"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] font-mono text-sm"
            />
            <button
              onClick={handleMax}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Max
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">Error: {error.message}</p>
          </div>
        )}

        <button
          onClick={handleWithdraw}
          disabled={
            isPending ||
            isConfirming ||
            !sharesToWithdraw ||
            parseFloat(sharesToWithdraw) <= 0 ||
            BigInt(sharesToWithdraw || "0") > BigInt(availableShares)
          }
          className="w-full bg-[#8B5CF6] text-white py-2.5 px-4 rounded-lg hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isPending || isConfirming
            ? "Processing..."
            : `Withdraw from ${trancheInfo.name} Tranche`}
        </button>
      </div>
    </div>
  );
}

