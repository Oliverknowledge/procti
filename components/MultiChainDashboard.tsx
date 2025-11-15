"use client";

import { useCrossChainArb } from "@/hooks/useCrossChainArb";

export default function MultiChainDashboard() {
  const { chainData, bestChain, isLoadingChains } = useCrossChainArb();

  if (isLoadingChains) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Multi-Chain Dashboard</h2>
        <p className="text-sm text-gray-500">Loading chain data...</p>
      </div>
    );
  }

  if (chainData.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Multi-Chain Dashboard</h2>
        <p className="text-sm text-gray-500">No chain data available</p>
      </div>
    );
  }

  // Check if all chains have the same values (likely uninitialized)
  const allSame = chainData.length > 1 && chainData.every(
    (chain) =>
      chain.price === chainData[0].price &&
      chain.yield === chainData[0].yield &&
      chain.risk === chainData[0].risk
  );

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Multi-Chain Dashboard</h2>
        {bestChain && (
          <div className="text-sm">
            <span className="text-gray-500">Best Chain:</span>{" "}
            <span className="font-semibold text-green-600">{bestChain}</span>
          </div>
        )}
      </div>
      {allSame && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-sm">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> All chains currently have the same values. Use the "Chain Data Manager" below to set different prices, yields, and risk scores for each chain.
          </p>
        </div>
      )}
      <div className="space-y-3">
        {chainData.map((chain) => {
          const isBest = chain.name === bestChain;
          const riskColor =
            chain.risk >= 70 ? "text-red-600" : chain.risk >= 40 ? "text-yellow-600" : "text-green-600";

          return (
            <div
              key={chain.name}
              className={`p-4 border rounded-sm ${
                isBest ? "border-green-500 bg-green-50 ring-1 ring-green-500" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{chain.name}</h3>
                  {isBest && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-green-600 text-white rounded">
                      BEST
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Score</div>
                  <div className="text-sm font-semibold text-gray-900">{chain.score.toFixed(6)}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-500">USDC Price</div>
                  <div className="font-medium text-gray-900">${chain.price.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Yield (APR)</div>
                  <div className="font-medium text-gray-900">{chain.yield.toFixed(2)}%</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Risk Score</div>
                  <div className={`font-medium ${riskColor}`}>{chain.risk}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

