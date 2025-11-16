"use client";

import { useVault } from "@/hooks/useVault";
import { usePools } from "@/hooks/usePools";
import { useUSDC } from "@/hooks/useUSDC";
import { useOracle } from "@/hooks/useOracle";
import { useChainBalances } from "@/hooks/useChainBalances";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useOracleSync } from "@/hooks/useOracleSync";
import { useAutoRebalance } from "@/hooks/useAutoRebalance";
import ChainBalanceBreakdown from "@/components/ChainBalanceBreakdown";

export default function VaultDashboard() {
  const { modeString, modeColor, vaultBalance } = useVault();
  const { yieldPoolBalance, safePoolBalance } = usePools();
  const { balance: userBalance, error: usdcError, isLoadingBalance } = useUSDC();
  const { priceFormatted } = useOracle();
  const { chainBalances, isLoading: isLoadingChains } = useChainBalances();
  const { activeChain } = useCrossChainArb();
  
  // Automatically sync oracle price with active chain's price
  useOracleSync();
  
  // Automatically rebalance when price changes or crosses thresholds
  useAutoRebalance();

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
      <div className={`bg-white border-l-4 ${getModeBorder()} rounded-lg p-6 shadow-sm`}>
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Mode</div>
        <div className={`text-4xl font-medium ${getModeColor()}`}>
          {modeString}
        </div>
      </div>

      {/* Balances Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* User Balance */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
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
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
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
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
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
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
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

      {/* Chain Balances - Vault Only */}
      <div className="bg-white rounded-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500 uppercase tracking-wider">Vault Balance by Chain</div>
          {activeChain && (
            <div className="text-xs text-gray-500">
              Active: <span className="font-medium text-gray-900">{activeChain}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Shows how your vault deposits are distributed across chains based on where deposits/withdrawals occurred.
        </p>
        
        {isLoadingChains ? (
          <p className="text-sm text-gray-500">Loading chain balances...</p>
        ) : chainBalances.length === 0 ? (
          <p className="text-sm text-gray-500">No chain balances yet</p>
        ) : (
          <div className="space-y-3">
            {chainBalances.map((chainBalance) => (
              <div key={chainBalance.chain} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {chainBalance.chain}
                    </span>
                    {chainBalance.chain === activeChain && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {chainBalance.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USDC
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({chainBalance.percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#8B5CF6] h-2 rounded-full transition-all"
                    style={{ width: `${chainBalance.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total USDC by Chain (Vault + Wallet) */}
      <ChainBalanceBreakdown />
    </div>
  );
}

