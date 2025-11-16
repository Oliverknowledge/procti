"use client";

import { useState } from "react";
import { useProctiContract } from "@/hooks/useProctiContract";
import { useTrancheData } from "@/hooks/useTrancheData";
import { fetchChainData } from "@/lib/services/chainDataFetcher";

/**
 * @component EpochPanel
 * @description Admin panel for updating epochs with scoring data
 * @notice Owner-only functionality - does NOT conflict with existing admin tools
 */
export default function EpochPanel() {
  const [yieldScore, setYieldScore] = useState("5000");
  const [securityScore, setSecurityScore] = useState("5000");
  const [liquidityScore, setLiquidityScore] = useState("5000");
  const [isFetchingData, setIsFetchingData] = useState(false);
  const { updateEpoch, isOwner, isPending, isConfirming, error } = useProctiContract();
  const { refetchAll } = useTrancheData();

  // Calculate combined score and delta
  const combinedScore =
    (parseFloat(yieldScore) * 40 + parseFloat(securityScore) * 40 + parseFloat(liquidityScore) * 20) / 100;
  const delta = combinedScore - 5000;

  // Calculate tranche deltas
  const seniorDelta = (delta * 50) / 1000;
  const mezzDelta = (delta * 100) / 1000;
  const juniorDelta = (delta * 200) / 1000;

  const handleUpdateEpoch = async () => {
    const yieldValue = parseInt(yieldScore);
    const securityValue = parseInt(securityScore);
    const liquidityValue = parseInt(liquidityScore);

    if (yieldValue < 0 || yieldValue > 10000 || securityValue < 0 || securityValue > 10000 || liquidityValue < 0 || liquidityValue > 10000) {
      alert("Scores must be between 0 and 10000");
      return;
    }

    try {
      await updateEpoch(yieldValue, securityValue, liquidityValue);
      setTimeout(() => {
        refetchAll();
      }, 3000);
    } catch (err) {
      console.error("Update epoch failed:", err);
    }
  };

  const setPreset = (preset: "positive" | "negative" | "neutral") => {
    if (preset === "positive") {
      setYieldScore("7000");
      setSecurityScore("8000");
      setLiquidityScore("7500");
    } else if (preset === "negative") {
      setYieldScore("3000");
      setSecurityScore("2000");
      setLiquidityScore("4000");
    } else {
      setYieldScore("5000");
      setSecurityScore("5000");
      setLiquidityScore("5000");
    }
  };

  const handleFetchRealData = async () => {
    setIsFetchingData(true);
    try {
      const data = await fetchChainData();
      setYieldScore(data.yieldScore.toString());
      setSecurityScore(data.securityScore.toString());
      setLiquidityScore(data.liquidityScore.toString());
      alert(`Fetched real chain data!\nDelta: ${data.delta > 0 ? "+" : ""}${data.delta}`);
    } catch (err) {
      console.error("Failed to fetch chain data:", err);
      alert("Failed to fetch chain data. Using defaults.");
    } finally {
      setIsFetchingData(false);
    }
  };

  if (!isOwner) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Epoch Management</h2>
        <p className="text-gray-600">Only the contract owner can update epochs.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Epoch Management</h2>

      <div className="space-y-4">
        <div className="flex gap-2 mb-4 flex-wrap">
          <button
            onClick={handleFetchRealData}
            disabled={isFetchingData}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:bg-gray-200 disabled:text-gray-500"
          >
            {isFetchingData ? "Fetching..." : "🌐 Fetch Real Chain Data"}
          </button>
          <button
            onClick={() => setPreset("positive")}
            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
          >
            Positive Scenario
          </button>
          <button
            onClick={() => setPreset("negative")}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Negative Scenario
          </button>
          <button
            onClick={() => setPreset("neutral")}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Neutral Scenario
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yield Score (0-10000)
          </label>
          <input
            type="number"
            value={yieldScore}
            onChange={(e) => setYieldScore(e.target.value)}
            min="0"
            max="10000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Current: {parseFloat(yieldScore) / 100}%
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Security Score (0-10000)
          </label>
          <input
            type="number"
            value={securityScore}
            onChange={(e) => setSecurityScore(e.target.value)}
            min="0"
            max="10000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Current: {parseFloat(securityScore) / 100}% (Loss threshold: 30%)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Liquidity Score (0-10000)
          </label>
          <input
            type="number"
            value={liquidityScore}
            onChange={(e) => setLiquidityScore(e.target.value)}
            min="0"
            max="10000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
          />
          <p className="text-xs text-gray-500 mt-1">
            Current: {parseFloat(liquidityScore) / 100}%
          </p>
        </div>

        <div className="bg-gray-50 rounded-md p-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Combined Score:</span>
            <span className="font-medium">{combinedScore.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Delta:</span>
            <span className={`font-medium ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-gray-200 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Senior Delta:</span>
              <span className={seniorDelta >= 0 ? "text-green-600" : "text-red-600"}>
                {seniorDelta >= 0 ? "+" : ""}
                {seniorDelta.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Mezz Delta:</span>
              <span className={mezzDelta >= 0 ? "text-green-600" : "text-red-600"}>
                {mezzDelta >= 0 ? "+" : ""}
                {mezzDelta.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Junior Delta:</span>
              <span className={juniorDelta >= 0 ? "text-green-600" : "text-red-600"}>
                {juniorDelta >= 0 ? "+" : ""}
                {juniorDelta.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">Error: {error.message}</p>
          </div>
        )}

        <button
          onClick={handleUpdateEpoch}
          disabled={isPending || isConfirming}
          className="w-full bg-[#8B5CF6] text-white py-2.5 px-4 rounded-lg hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isPending || isConfirming ? "Processing..." : "Update Epoch"}
        </button>
      </div>
    </div>
  );
}

