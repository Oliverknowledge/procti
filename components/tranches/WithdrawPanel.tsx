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
    if (!sharesToWithdraw || isNaN(parseFloat(sharesToWithdraw)) || parseFloat(sharesToWithdraw) <= 0) {
      alert("Please enter a valid number of shares");
      return;
    }

    const sharesBigInt = BigInt(Math.floor(parseFloat(sharesToWithdraw)));
    const availableBigInt = BigInt(availableShares);

    if (sharesBigInt > availableBigInt) {
      alert("Insufficient shares");
      return;
    }

    try {
      await withdraw(sharesBigInt, selectedTranche);
      // Wait for transaction confirmation
      setTimeout(() => {
        refetchAll();
        setSharesToWithdraw("");
      }, 3000);
    } catch (err) {
      console.error("Withdraw failed:", err);
    }
  };

  const handleMax = () => {
    setSharesToWithdraw(availableShares);
  };

  const trancheInfo = TRANCHES[selectedTranche];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Withdraw Shares</h2>

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
            <span className="font-medium">{availableShares}</span>
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

        {/* Explanation if share price is still 1.0 */}
        {parseFloat(position.sharePrice) === 1.0 && parseFloat(availableShares) > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-800 font-medium mb-1">⚠️ Why Your Value is the Same</p>
            <p className="text-xs text-yellow-700">
              Your share price is $1.00 because <strong>no epochs have been run yet</strong>.
              The virtual value hasn't changed, so withdrawing gives you back exactly what you deposited.
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              <strong>To see value changes:</strong> Run an epoch update in the Epoch Management panel below.
              After an epoch with positive delta, your share price will increase and you'll get more USDC when withdrawing!
            </p>
          </div>
        )}

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
            {parseFloat(position.sharePrice) === 1.0 && (
              <p className="text-xs text-yellow-700 mt-2 bg-yellow-100 rounded p-2">
                ⚠️ Share price is $1.00 - no epochs have been run yet. Run an epoch update to see value changes!
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shares to Withdraw
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={sharesToWithdraw}
              onChange={(e) => setSharesToWithdraw(e.target.value)}
              placeholder="0"
              step="1"
              min="0"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

