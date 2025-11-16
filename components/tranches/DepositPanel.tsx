"use client";

import { useState, useImperativeHandle, forwardRef } from "react";
import { Tranche, TRANCHES } from "@/lib/procti/addresses";
import { useProctiContract } from "@/hooks/useProctiContract";
import { useTrancheData } from "@/hooks/useTrancheData";
import { useUSDC } from "@/hooks/useUSDC";

export interface DepositPanelRef {
  setTranche: (tranche: Tranche) => void;
}

/**
 * @component DepositPanel
 * @description Panel for depositing USDC into tranches
 * @notice Isolated component - connects via useProctiContract hook
 */
const DepositPanel = forwardRef<DepositPanelRef>((props, ref) => {
  const [amount, setAmount] = useState("");
  const [selectedTranche, setSelectedTranche] = useState<Tranche>(Tranche.Senior);
  const { deposit, estimateShares, isPending, isConfirming, error } = useProctiContract();
  const { refetchAll } = useTrancheData();
  const { balance, refetchBalance } = useUSDC();

  const [estimatedShares, setEstimatedShares] = useState<string>("0");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);

    if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
      const shares = estimateShares(value, selectedTranche);
      setEstimatedShares(shares.toString());
    } else {
      setEstimatedShares("0");
    }
  };

  const handleTrancheChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTranche = parseInt(e.target.value) as Tranche;
    setSelectedTranche(newTranche);

    if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
      const shares = estimateShares(amount, newTranche);
      setEstimatedShares(shares.toString());
    }
  };

  const handleDeposit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (parseFloat(balance) < parseFloat(amount)) {
      alert("Insufficient USDC balance");
      return;
    }

    try {
      await deposit(amount, selectedTranche);
      // Wait for transaction confirmation
      setTimeout(() => {
        refetchAll();
        refetchBalance();
        setAmount("");
        setEstimatedShares("0");
      }, 3000);
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  };

  // Expose setTranche method for external control (e.g., from AI advisor)
  useImperativeHandle(ref, () => ({
    setTranche: (tranche: Tranche) => {
      setSelectedTranche(tranche);
      // Recalculate shares if amount is set
      if (amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
        const shares = estimateShares(amount, tranche);
        setEstimatedShares(shares.toString());
      }
    },
  }));

  const trancheInfo = TRANCHES[selectedTranche];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-gray-900">Deposit to Tranche Vault</h2>
          <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
            Structured Products
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Choose a tranche (Senior/Mezzanine/Junior) and deposit USDC. You'll receive shares based on the current share price.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Tranche
          </label>
          <select
            value={selectedTranche}
            onChange={handleTrancheChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          >
            {TRANCHES.map((tranche) => (
              <option key={tranche.id} value={tranche.id}>
                {tranche.name} - {tranche.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (USDC)
          </label>
          <input
            type="number"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Available: {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </p>
        </div>

        {estimatedShares !== "0" && (
          <div className="bg-gray-50 rounded-md p-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Estimated Shares:</span>
              <span className="font-medium">{estimatedShares}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">Error: {error.message}</p>
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
          className="w-full bg-[#8B5CF6] text-white py-2.5 px-4 rounded-lg hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isPending || isConfirming
            ? "Processing..."
            : `Deposit to ${trancheInfo.name} Tranche`}
        </button>
      </div>
    </div>
  );
});

DepositPanel.displayName = "DepositPanel";

export default DepositPanel;

