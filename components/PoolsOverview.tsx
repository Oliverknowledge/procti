"use client";

import { useState } from "react";
import { usePools } from "@/hooks/usePools";
import { useVault } from "@/hooks/useVault";
import { useOracle } from "@/hooks/useOracle";
import { useAccount } from "wagmi";

/**
 * @component PoolsOverview
 * @description Displays Safe Pool and Yield Pool balances
 */
export default function PoolsOverview() {
  const { isConnected } = useAccount();
  const { yieldPoolBalance, safePoolBalance, isLoading, refetchAll } = usePools();
  const { rebalance, modeString, vaultBalance, refetchVaultBalance, userRiskProfile } = useVault();
  const { priceFormatted, setPrice, refetchPrice } = useOracle();
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isSettingPrice, setIsSettingPrice] = useState(false);
  const [manualPrice, setManualPrice] = useState("1.00");

  const totalPools = parseFloat(yieldPoolBalance) + parseFloat(safePoolBalance);
  const totalVaultBalance = parseFloat(vaultBalance || "0");

  const handleRebalance = async () => {
    try {
      setIsRebalancing(true);
      console.log("Starting rebalance...");
      
      const receipt = await rebalance();
      console.log("Rebalance completed, receipt:", receipt);
      
      // Refetch immediately after confirmation
      refetchAll();
      refetchVaultBalance();
      
      // Additional refetches to ensure UI updates (blockchain state propagation delay)
      setTimeout(() => {
        console.log("Refetching pools (1s delay)...");
        refetchAll();
        refetchVaultBalance();
      }, 1000);
      
      setTimeout(() => {
        console.log("Refetching pools (3s delay)...");
        refetchAll();
        refetchVaultBalance();
      }, 3000);
      
      setTimeout(() => {
        console.log("Refetching pools (5s delay)...");
        refetchAll();
        refetchVaultBalance();
      }, 5000);
    } catch (error: any) {
      console.error("Rebalance error:", error);
      alert(`Failed to rebalance: ${error.message || "Unknown error"}`);
    } finally {
      setIsRebalancing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-semibold text-gray-900">Sentinel Vault Pools</h2>
          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
            Pool-Based System
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Shows Safe Pool and Yield Pool balances for SentinelVault. Funds automatically move between pools based on oracle price.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safe Pool */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🛡️</span>
            </div>
            <div>
              <div className="text-xs text-green-600 uppercase tracking-wider mb-1">Safe Pool</div>
              <div className="text-2xl font-bold text-green-900">
                {isLoading
                  ? "..."
                  : parseFloat(safePoolBalance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </div>
              <div className="text-xs text-green-700 mt-1">USDC</div>
            </div>
          </div>
          <p className="text-xs text-green-700 mt-3">
            Low-risk pool for capital preservation. Funds are kept safe and stable.
          </p>
        </div>

        {/* Yield Pool */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">📈</span>
            </div>
            <div>
              <div className="text-xs text-blue-600 uppercase tracking-wider mb-1">Yield Pool</div>
              <div className="text-2xl font-bold text-blue-900">
                {isLoading
                  ? "..."
                  : parseFloat(yieldPoolBalance).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
              </div>
              <div className="text-xs text-blue-700 mt-1">USDC</div>
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-3">
            High-yield pool for generating returns. Funds are deployed to yield-generating protocols.
          </p>
        </div>
      </div>

      {/* Total Pools */}
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Total Pools</span>
          <span className="text-xl font-bold text-gray-900">
            {isLoading
              ? "..."
              : totalPools.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
          </span>
        </div>
        
        {/* Status Info */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current Mode:</span>
            <span className="font-medium text-gray-900">{modeString}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Oracle Price:</span>
            <span className="font-medium text-gray-900">${parseFloat(priceFormatted || "0").toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Vault Balance:</span>
            <span className="font-medium text-gray-900">
              ${totalVaultBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {totalVaultBalance > 0 && totalPools === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
              <p className="text-xs text-yellow-800 font-medium mb-1">
                ⚠️ Why are pools empty?
              </p>
              {modeString === "Emergency" ? (
                <div className="text-xs text-yellow-800 space-y-1">
                  <p>
                    <strong>Emergency Mode Active:</strong> Oracle price ($0.9950) is below the emergency threshold. 
                    Funds are kept in the vault for safety and are NOT allocated to pools.
                  </p>
                  <p className="mt-1">
                    <strong>To exit Emergency mode:</strong> The oracle price needs to be above $0.996 (for Conservative) 
                    or $0.995 (for Balanced) or $0.994 (for Aggressive) depending on your risk profile.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-yellow-800">
                  Funds are in the vault but not allocated to pools. Click &quot;Rebalance Now&quot; to allocate them.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Manual Rebalance Button */}
        <button
          onClick={handleRebalance}
          disabled={isRebalancing || totalVaultBalance === 0}
          className="w-full px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isRebalancing ? "Rebalancing..." : "Rebalance Now"}
        </button>
        <p className="text-xs text-gray-500 text-center">
          Rebalancing moves funds between pools based on current oracle price and your risk profile
        </p>

        {/* Manual Oracle Price Setter (for testing/demo when in Emergency mode) */}
        {modeString === "Emergency" && isConnected && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                🔧 Exit Emergency Mode (Demo/Testing)
              </p>
              <p className="text-xs text-blue-800 mb-3">
                Set oracle price above threshold to exit Emergency mode and allocate funds to pools.
                Thresholds: Conservative ($0.9992), Balanced ($0.999), Aggressive ($0.9985)
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.0001"
                  min="0.99"
                  max="1.01"
                  value={manualPrice}
                  onChange={(e) => setManualPrice(e.target.value)}
                  placeholder="1.00"
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={async () => {
                    try {
                      setIsSettingPrice(true);
                      await setPrice(manualPrice);
                      // Wait for transaction, then refetch and rebalance
                      setTimeout(async () => {
                        await refetchPrice();
                        // Wait a bit more, then rebalance
                        setTimeout(async () => {
                          await handleRebalance();
                        }, 2000);
                      }, 3000);
                    } catch (err: any) {
                      console.error("Set price error:", err);
                      alert(`Failed to set price: ${err.message || "Unknown error"}`);
                    } finally {
                      setIsSettingPrice(false);
                    }
                  }}
                  disabled={isSettingPrice || isRebalancing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSettingPrice ? "Setting..." : "Set Price & Rebalance"}
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => {
                    setManualPrice("1.00");
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  $1.00
                </button>
                <button
                  onClick={() => {
                    setManualPrice("1.001");
                  }}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  $1.001
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

