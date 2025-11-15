"use client";

/**
 * Component that simulates automatic chain data updates from external sources
 * In production, this would be a keeper bot or oracle service that:
 * 1. Fetches prices from Chainlink/Band Protocol
 * 2. Fetches yields from DeFi protocol APIs (Aave, Compound, etc.)
 * 3. Calculates risk scores from on-chain metrics
 * 4. Updates the CrossChainArbitrage contract automatically
 */

import { useState } from "react";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useChainDataFetcher } from "@/hooks/useChainDataFetcher";

export default function AutoChainDataUpdater() {
  const { setChainPrice, setChainYield, setChainRisk, isPending } = useCrossChainArb();
  const { data: externalData, isLoading: isLoadingExternal, error } = useChainDataFetcher();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const handleAutoUpdate = async () => {
    if (!externalData || externalData.length === 0) {
      alert("No external data available. This is a demo - data would come from oracles/APIs in production.");
      return;
    }

    try {
      setIsUpdating(true);
      
      // Update each chain's data
      for (const chainData of externalData) {
        try {
          // Update price
          await setChainPrice(chainData.chain, chainData.price.toFixed(6));
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait between transactions
          
          // Update yield
          await setChainYield(chainData.chain, chainData.yield.toFixed(2));
          await new Promise((resolve) => setTimeout(resolve, 1000));
          
          // Update risk
          await setChainRisk(chainData.chain, chainData.risk);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error updating ${chainData.chain}:`, error);
        }
      }
      
      setLastUpdate(new Date());
      alert("Chain data updated successfully from external sources!");
    } catch (error: any) {
      console.error("Auto-update error:", error);
      alert(`Failed to update: ${error.message || "Unknown error"}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Automatic Data Updater</h2>
      <p className="text-xs text-gray-500 mb-4">
        Fetches real data from external APIs: <strong>Circle</strong> (USDC issuer) for <strong>USDC (stablecoin) prices</strong> (~$1.00), 
        <strong>DeFiLlama</strong> for yield/APY data, and calculates risk scores. 
        <strong>Note:</strong> This tracks USDC prices, not ETH or native token prices. Click the button to update all chains with live data.
      </p>
      
      {externalData.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-sm">
          <p className="text-xs font-medium text-blue-900 mb-2">Fetched from External APIs:</p>
          <div className="space-y-1 text-xs text-blue-800">
            {externalData.map((chain) => (
              <div key={chain.chain}>
                <strong>{chain.chain}:</strong> ${chain.price.toFixed(6)} | {chain.yield.toFixed(2)}% APR | Risk: {chain.risk}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-sm">
          <p className="text-xs text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={handleAutoUpdate}
        disabled={isPending || isUpdating || isLoadingExternal || externalData.length === 0}
        className="w-full px-6 py-2 bg-blue-600 text-white rounded-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isUpdating ? "Updating..." : isLoadingExternal ? "Loading Data..." : "Update All Chains from External Sources"}
      </button>

      {lastUpdate && (
        <p className="text-xs text-gray-500 mt-2">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

