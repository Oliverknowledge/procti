"use client";

import { useState } from "react";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";

// Format profit value to avoid scientific notation and handle invalid values
function formatProfit(profit: number): string {
  // Check if profit is clearly invalid (absurdly large)
  if (Math.abs(profit) > 1000000) {
    return "Invalid (contract error)";
  }
  
  if (profit === 0) return "0.00";
  if (Math.abs(profit) < 0.000001) return profit.toExponential(2);
  if (Math.abs(profit) > 1000) return profit.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return profit.toFixed(6);
}

export default function ArbitrageDetector() {
  const { supportedChains, detectArbitrage, isPending } = useCrossChainArb();
  const [chainA, setChainA] = useState("Arc");
  const [chainB, setChainB] = useState("Ethereum");
  const [bridgeFee, setBridgeFee] = useState("0.1");
  const [result, setResult] = useState<{ profitable: boolean; profit: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleDetect = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (chainA === chainB) {
      alert("Please select two different chains");
      return;
    }

    try {
      setIsChecking(true);
      const bridgeFeeNum = parseFloat(bridgeFee);
      if (isNaN(bridgeFeeNum) || bridgeFeeNum < 0) {
        alert("Please enter a valid bridge fee percentage");
        return;
      }

      const arbitrageResult = await detectArbitrage(chainA, chainB, bridgeFeeNum);
      setResult(arbitrageResult);
    } catch (error: any) {
      console.error("Arbitrage detection error:", error);
      alert(`Failed to detect arbitrage: ${error.message || "Unknown error"}`);
    } finally {
      setIsChecking(false);
    }
  };

  const availableChains = supportedChains.length > 0 ? supportedChains : ["Arc", "Ethereum", "Arbitrum", "Base", "Optimism"];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Arbitrage Detection</h2>
        <p className="text-xs text-gray-500">
          Compares USDC prices and yields between two chains to find profitable arbitrage opportunities after accounting for bridge fees.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Chain A</label>
            <select
              value={chainA}
              onChange={(e) => setChainA(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6] text-gray-900 bg-white"
              disabled={isPending || isChecking}
            >
              {availableChains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain}
                </option>
              ))}
            </select>
          </div>
          
          <span className="text-gray-500 mb-2">vs</span>
          
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">Chain B</label>
            <select
              value={chainB}
              onChange={(e) => setChainB(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6] text-gray-900 bg-white"
              disabled={isPending || isChecking}
            >
              {availableChains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Bridge Fee (%)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={bridgeFee}
            onChange={(e) => setBridgeFee(e.target.value)}
            placeholder="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
            disabled={isPending || isChecking}
          />
        </div>

        <button
          type="button"
          onClick={handleDetect}
          disabled={isPending || isChecking || chainA === chainB}
          className="w-full px-6 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isChecking ? "Checking..." : "Detect Arbitrage"}
        </button>

        {result && (
          <div
            className={`p-4 rounded-lg border ${
              result.profitable
                ? "bg-green-50 border-green-500 text-green-900"
                : "bg-gray-50 border-gray-300 text-gray-700"
            }`}
          >
            {result.profitable ? (
              <div>
                <p className="font-semibold mb-1">✅ Arbitrage Opportunity Found!</p>
                <p className="text-sm">
                  Potential Profit: ${formatProfit(result.profit)}
                </p>
                <p className="text-xs mt-2 opacity-75">
                  Profit after accounting for bridge fees and price differences
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold mb-1">❌ No Profitable Arbitrage</p>
                {Math.abs(result.profit) < 1000000 ? (
                  <>
                    <p className="text-sm">
                      Expected Profit: ${formatProfit(result.profit)}
                    </p>
                    <p className="text-xs mt-2 opacity-75">
                      Bridge fees and price differences make this unprofitable
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-red-600">
                    Error: Contract returned invalid profit value. Check console for details.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

