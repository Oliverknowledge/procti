"use client";

import { useState, useEffect } from "react";
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

  // Check if loss waterfall will trigger
  const securityValue = parseFloat(securityScore);
  const willTriggerLoss = securityValue < 3000;
  const lossPercentage = willTriggerLoss ? ((3000 - securityValue) / 3000) * 100 : 0;

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const handleUpdateEpoch = async () => {
    const yieldValue = parseInt(yieldScore);
    const securityValue = parseInt(securityScore);
    const liquidityValue = parseInt(liquidityScore);

    if (yieldValue < 0 || yieldValue > 10000 || securityValue < 0 || securityValue > 10000 || liquidityValue < 0 || liquidityValue > 10000) {
      alert("Scores must be between 0 and 10000");
      return;
    }

    setIsUpdating(true);
    setUpdateStatus("Preparing epoch update...");

    try {
      setUpdateStatus("Submitting transaction...");
      await updateEpoch(yieldValue, securityValue, liquidityValue);
      
      setUpdateStatus("Waiting for confirmation...");
      // Wait for transaction confirmation
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      setUpdateStatus("Refreshing data...");
      await refetchAll();
      
      setUpdateStatus("✅ Epoch updated successfully!");
      setTimeout(() => {
        setUpdateStatus(null);
        setIsUpdating(false);
      }, 2000);
    } catch (err) {
      console.error("Update epoch failed:", err);
      setUpdateStatus("❌ Update failed. Please try again.");
      setTimeout(() => {
        setUpdateStatus(null);
        setIsUpdating(false);
      }, 3000);
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  willTriggerLoss
                    ? "border-red-500 focus:ring-red-500 bg-red-50"
                    : "border-gray-300 focus:ring-[#8B5CF6]"
                }`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {parseFloat(securityScore) / 100}% (Loss threshold: 30%)
              </p>
              {willTriggerLoss && (
                <div className="mt-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-600 text-lg">⚠️</span>
                    <span className="text-sm font-semibold text-red-900">
                      Loss Waterfall Will Trigger!
                    </span>
                  </div>
                  <p className="text-xs text-red-800">
                    Security score ({securityValue / 100}%) is below threshold (30%). 
                    Estimated loss: <strong>{lossPercentage.toFixed(1)}%</strong> of total vault value.
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Loss will hit: <strong>Junior first</strong> → Mezz → Senior
                  </p>
                </div>
              )}
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

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Combined Score:</span>
            <span className="text-lg font-bold text-gray-900">{combinedScore.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
            <span className="text-sm font-medium text-gray-700">Global Delta:</span>
            <span className={`text-xl font-bold ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(2)}
            </span>
          </div>
          <div className="pt-2 border-t border-purple-200 space-y-2">
            <div className="text-xs font-semibold text-gray-700 mb-2">Tranche Deltas:</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded p-2 border border-green-200">
                <div className="text-xs text-gray-600 mb-1">Senior</div>
                <div className={`text-sm font-bold ${seniorDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {seniorDelta >= 0 ? "+" : ""}
                  {seniorDelta.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded p-2 border border-yellow-200">
                <div className="text-xs text-gray-600 mb-1">Mezz</div>
                <div className={`text-sm font-bold ${mezzDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {mezzDelta >= 0 ? "+" : ""}
                  {mezzDelta.toFixed(2)}
                </div>
              </div>
              <div className="bg-white rounded p-2 border border-red-200">
                <div className="text-xs text-gray-600 mb-1">Junior</div>
                <div className={`text-sm font-bold ${juniorDelta >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {juniorDelta >= 0 ? "+" : ""}
                  {juniorDelta.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
          {delta !== 0 && (
            <div className="mt-2 p-2 bg-white rounded border border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Impact Preview:</div>
              <div className="text-xs text-gray-700">
                {delta > 0 ? (
                  <span className="text-green-700">
                    📈 All tranches will gain value. Junior gains most ({juniorDelta.toFixed(2)}), Senior gains least ({seniorDelta.toFixed(2)}).
                  </span>
                ) : (
                  <span className="text-red-700">
                    📉 All tranches will lose value. Junior loses most ({juniorDelta.toFixed(2)}), Senior loses least ({seniorDelta.toFixed(2)}).
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Update Status */}
        {updateStatus && (
          <div
            className={`rounded-lg p-3 ${
              updateStatus.includes("✅")
                ? "bg-green-50 border border-green-200"
                : updateStatus.includes("❌")
                ? "bg-red-50 border border-red-200"
                : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {updateStatus.includes("✅") ? (
                <span className="text-green-600">✅</span>
              ) : updateStatus.includes("❌") ? (
                <span className="text-red-600">❌</span>
              ) : (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
              <p
                className={`text-sm ${
                  updateStatus.includes("✅")
                    ? "text-green-800"
                    : updateStatus.includes("❌")
                    ? "text-red-800"
                    : "text-blue-800"
                }`}
              >
                {updateStatus}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">Error: {error.message}</p>
          </div>
        )}

        <button
          onClick={handleUpdateEpoch}
          disabled={isPending || isConfirming || isUpdating}
          className="w-full bg-[#8B5CF6] text-white py-2.5 px-4 rounded-lg hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isPending || isConfirming || isUpdating ? "Processing..." : "🚀 Update Epoch"}
        </button>
      </div>
    </div>
  );
}

