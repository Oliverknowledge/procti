"use client";

import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useChainBalances } from "@/hooks/useChainBalances";
import ActiveChainDisplay from "@/components/ActiveChainDisplay";

/**
 * @component CurrentChainInfo
 * @description Displays current chain information and active chain details
 */
export default function CurrentChainInfo() {
  const { activeChain, bestChain, chainData, isLoadingChains } = useCrossChainArb();
  const { chainBalances, isLoading: isLoadingBalances } = useChainBalances();

  // Get current chain data
  const currentChainData = chainData.find((c) => c.name === activeChain);
  const currentChainBalance = chainBalances.find((cb) => cb.chain === activeChain);

  return (
    <div className="space-y-6">
      {/* Active Chain Display */}
      <ActiveChainDisplay />

      {/* Current Chain Details */}
      {currentChainData && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Chain Details</h2>

          <div className="space-y-4">
            {/* Chain Name */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Chain</span>
              <span className="text-lg font-semibold text-gray-900">{activeChain}</span>
            </div>

            {/* Balance */}
            {currentChainBalance && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-600">Balance</span>
                <span className="text-lg font-semibold text-gray-900">
                  ${currentChainBalance.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">USDC Price</span>
              <span className="text-lg font-semibold text-gray-900">
                ${currentChainData.price.toFixed(4)}
              </span>
            </div>

            {/* Yield */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-600">Yield (APR)</span>
              <span className="text-lg font-semibold text-green-600">
                {currentChainData.yield.toFixed(2)}%
              </span>
            </div>

            {/* Risk Score */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-gray-600">Risk Score</span>
              <span
                className={`text-lg font-semibold ${
                  currentChainData.risk < 3
                    ? "text-green-600"
                    : currentChainData.risk < 7
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {currentChainData.risk.toFixed(1)}/10
              </span>
            </div>
          </div>

          {/* Status Badge */}
          {activeChain === bestChain && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm font-medium text-green-800">
                  Optimal chain selected
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoadingChains && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <p className="text-sm text-gray-500">Loading chain information...</p>
        </div>
      )}
    </div>
  );
}

