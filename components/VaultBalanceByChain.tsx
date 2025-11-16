"use client";

import { useChainBalances } from "@/hooks/useChainBalances";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";

/**
 * @component VaultBalanceByChain
 * @description Shows how vault deposits are distributed across chains
 */
export default function VaultBalanceByChain() {
  const { chainBalances, isLoading: isLoadingChains } = useChainBalances();
  const { activeChain } = useCrossChainArb();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-500 uppercase tracking-wider">
          Vault Balance by Chain
        </div>
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
  );
}

