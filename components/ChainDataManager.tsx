"use client";

import { useState, useEffect } from "react";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";

export default function ChainDataManager() {
  const { supportedChains, chainData, setChainPrice, setChainYield, setChainRisk, isPending, isConfirmed, refetchChainData } = useCrossChainArb();
  const [selectedChain, setSelectedChain] = useState("Arc");
  const [price, setPrice] = useState("1.000");
  const [yield_, setYield] = useState("5");
  const [risk, setRisk] = useState("50");

  const availableChains = supportedChains.length > 0 ? supportedChains : ["Arc", "Ethereum", "Arbitrum", "Base", "Optimism"];

  // Update form when chain data changes or chain selection changes
  useEffect(() => {
    const chain = chainData.find((c) => c.name === selectedChain);
    if (chain) {
      setPrice(chain.price.toFixed(6));
      setYield(chain.yield.toFixed(2));
      setRisk(chain.risk.toString());
    }
  }, [chainData, selectedChain]);

  // Refresh data after successful transaction
  useEffect(() => {
    if (isConfirmed) {
      // Wait a bit for the transaction to be mined, then refetch
      setTimeout(() => {
        refetchChainData();
      }, 2000);
    }
  }, [isConfirmed, refetchChainData]);

  const handleUpdatePrice = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await setChainPrice(selectedChain, price);
      // Data will refresh via isConfirmed effect
    } catch (error: any) {
      alert(`Failed to update price: ${error.message || "Unknown error"}`);
    }
  };

  const handleUpdateYield = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await setChainYield(selectedChain, yield_);
      // Data will refresh via isConfirmed effect
    } catch (error: any) {
      alert(`Failed to update yield: ${error.message || "Unknown error"}`);
    }
  };

  const handleUpdateRisk = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const riskNum = parseInt(risk);
      if (isNaN(riskNum) || riskNum < 0 || riskNum > 100) {
        alert("Risk score must be between 0 and 100");
        return;
      }
      await setChainRisk(selectedChain, riskNum);
      // Data will refresh via isConfirmed effect
    } catch (error: any) {
      alert(`Failed to update risk: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Chain Data Manager</h2>
        <p className="text-xs text-gray-500">
          <strong>Note:</strong> In production, this data would be automatically updated by oracles/keepers fetching from:
          price oracles (Chainlink, Band Protocol), DeFi protocol APIs (Aave, Compound), and risk assessment services.
          This manual interface is for testing/demo purposes only.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Select Chain</label>
          <select
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-white"
            disabled={isPending}
          >
            {availableChains.map((chain) => (
              <option key={chain} value={chain}>
                {chain}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Price (USD)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.000001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={handleUpdatePrice}
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Update
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Yield (APR %)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              value={yield_}
              onChange={(e) => setYield(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={handleUpdateYield}
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Update
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">Risk Score (0-100)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="100"
              value={risk}
              onChange={(e) => setRisk(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-500 text-gray-900 bg-white disabled:bg-gray-50 disabled:text-gray-500"
              disabled={isPending}
            />
            <button
              type="button"
              onClick={handleUpdateRisk}
              disabled={isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Update
            </button>
          </div>
        </div>

        {isPending && (
          <p className="text-sm text-blue-600">Processing transaction...</p>
        )}
      </div>
    </div>
  );
}

