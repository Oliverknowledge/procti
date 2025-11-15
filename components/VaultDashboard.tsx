"use client";

import { useVault } from "@/hooks/useVault";
import { usePools } from "@/hooks/usePools";
import { useUSDC } from "@/hooks/useUSDC";
import { useOracle } from "@/hooks/useOracle";

export default function VaultDashboard() {
  const { modeString, modeColor, vaultBalance } = useVault();
  const { yieldPoolBalance, safePoolBalance } = usePools();
  const { balance: userBalance, error: usdcError, isLoadingBalance } = useUSDC();
  const { priceFormatted } = useOracle();

  const getModeColor = () => {
    if (modeColor === "green") return "text-green-600";
    if (modeColor === "yellow") return "text-yellow-600";
    if (modeColor === "red") return "text-red-600";
    return "text-gray-600";
  };

  const getModeBorder = () => {
    if (modeColor === "green") return "border-l-green-600";
    if (modeColor === "yellow") return "border-l-yellow-600";
    if (modeColor === "red") return "border-l-red-600";
    return "border-l-gray-600";
  };

  return (
    <div className="w-full space-y-8">
      {/* Mode Indicator */}
      <div className={`bg-white border-l-4 ${getModeBorder()} rounded-sm p-6 shadow-sm`}>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Mode</div>
        <div className={`text-4xl font-medium ${getModeColor()}`}>
          {modeString}
        </div>
      </div>

      {/* Balances Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* User Balance */}
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-3">Your Balance</div>
          <p className="text-2xl font-medium text-gray-900 mb-1">
            {isLoadingBalance
              ? "..."
              : userBalance && !isNaN(parseFloat(userBalance))
              ? parseFloat(userBalance).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              : "0.00"}
          </p>
          <p className="text-xs text-gray-400">USDC</p>
        </div>

        {/* Vault Balance */}
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-3">Vault</div>
          <p className="text-2xl font-medium text-gray-900 mb-1">
            {parseFloat(vaultBalance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-400">USDC</p>
        </div>

        {/* Yield Pool Balance */}
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-3">Yield Pool</div>
          <p className="text-2xl font-medium text-gray-900 mb-1">
            {parseFloat(yieldPoolBalance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-400">USDC</p>
        </div>

        {/* Safe Pool Balance */}
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <div className="text-xs text-gray-500 mb-3">Safe Pool</div>
          <p className="text-2xl font-medium text-gray-900 mb-1">
            {parseFloat(safePoolBalance).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-400">USDC</p>
        </div>
      </div>

      {/* Oracle Price */}
      <div className="bg-white rounded-sm border border-gray-200 p-5">
        <div className="text-xs text-gray-500 mb-3">Oracle Price</div>
        <p className="text-2xl font-medium text-gray-900 mb-1">
          ${parseFloat(priceFormatted).toLocaleString(undefined, {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          })}
        </p>
        <p className="text-xs text-gray-400">USDC/USD</p>
      </div>
    </div>
  );
}

