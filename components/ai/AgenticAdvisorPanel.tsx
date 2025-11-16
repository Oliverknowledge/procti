"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useAgenticAdvisor, type AgenticRecommendation } from "@/hooks/useAgenticAdvisor";
import { Tranche } from "@/lib/procti/addresses";
import ConnectWalletButton from "@/components/ConnectWalletButton";

/**
 * @component AgenticAdvisorPanel
 * @description Proactive AI advisor that monitors and suggests actions
 */
export default function AgenticAdvisorPanel() {
  const { isConnected } = useAccount();
  const {
    isActive,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    activeRecommendations,
    setActiveRecommendations,
    executeRecommendation,
    actionHistory,
    error,
  } = useAgenticAdvisor();

  const [selectedRecommendation, setSelectedRecommendation] = useState<AgenticRecommendation | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = async (recommendation: AgenticRecommendation) => {
    setIsExecuting(true);
    try {
      await executeRecommendation(recommendation);
      setSelectedRecommendation(null);
    } catch (err) {
      console.error("Execution error:", err);
    } finally {
      setIsExecuting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "high":
        return "bg-red-100 text-red-800 border-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default:
        return "bg-blue-100 text-blue-800 border-blue-300";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "DEPOSIT":
        return "💰";
      case "WITHDRAW":
        return "💸";
      case "REBALANCE":
        return "⚖️";
      default:
        return "👁️";
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm text-center">
        <p className="text-gray-600 mb-4">Connect your wallet to enable the agentic advisor.</p>
        <ConnectWalletButton />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">🤖 Agentic AI Advisor</h3>
          <p className="text-sm text-gray-600 mt-1">
            Proactively monitors your portfolio and suggests actions based on market conditions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isMonitoring && (
            <div className="flex items-center gap-2 text-purple-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
              <span className="text-xs font-medium">Analyzing...</span>
            </div>
          )}
          <button
            onClick={isActive ? stopMonitoring : startMonitoring}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isActive
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-[#8B5CF6] text-white hover:bg-[#7C3AED]"
            }`}
          >
            {isActive ? "⏸️ Stop Monitoring" : "▶️ Start Monitoring"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Active Recommendations */}
      {activeRecommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Active Recommendations ({activeRecommendations.length})
          </h4>
          <div className="space-y-3">
            {activeRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="bg-white border-2 border-purple-200 rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getActionIcon(rec.action)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{rec.action}</span>
                        {rec.tranche !== undefined && (
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {rec.tranche === Tranche.Senior
                              ? "Senior"
                              : rec.tranche === Tranche.Mezz
                              ? "Mezz"
                              : rec.tranche === Tranche.Junior
                              ? "Junior"
                              : "Unknown"}
                          </span>
                        )}
                        {rec.amount && (
                          <span className="text-xs font-medium text-gray-700">
                            ${parseFloat(rec.amount).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${getUrgencyColor(rec.urgency)}`}
                        >
                          {rec.urgency} urgency
                        </span>
                        <span className="text-xs text-gray-600">
                          {rec.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveRecommendations((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-sm text-gray-700 mb-3 mt-2">{rec.reasoning}</p>

                {rec.marketContext && (
                  <p className="text-xs text-gray-500 mb-3 italic">📊 {rec.marketContext}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => handleExecute(rec)}
                    disabled={isExecuting}
                    className="flex-1 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {isExecuting ? "Executing..." : "✅ Execute Action"}
                  </button>
                  <button
                    onClick={() => setSelectedRecommendation(rec)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action History */}
      {actionHistory.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Recent Actions ({actionHistory.length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {actionHistory.slice(-5).reverse().map((rec, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-lg p-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getActionIcon(rec.action)}</span>
                    <span className="font-medium">{rec.action}</span>
                    {rec.tranche !== undefined && (
                      <span className="text-gray-600">
                        {rec.tranche === Tranche.Senior
                          ? "Senior"
                          : rec.tranche === Tranche.Mezz
                          ? "Mezz"
                          : rec.tranche === Tranche.Junior
                          ? "Junior"
                          : "Unknown"}
                      </span>
                    )}
                    {rec.amount && (
                      <span className="text-gray-600">${parseFloat(rec.amount).toFixed(2)}</span>
                    )}
                  </div>
                  <span className="text-gray-500">
                    {new Date(rec.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isActive && activeRecommendations.length === 0 && actionHistory.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">
            Start monitoring to receive proactive recommendations based on your portfolio and market conditions.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecommendation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Recommendation Details</h4>
              <button
                onClick={() => setSelectedRecommendation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-700">Action:</span>
                <span className="ml-2 font-semibold">{selectedRecommendation.action}</span>
              </div>
              {selectedRecommendation.tranche !== undefined && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Tranche:</span>
                  <span className="ml-2">
                    {selectedRecommendation.tranche === Tranche.Senior
                      ? "Senior"
                      : selectedRecommendation.tranche === Tranche.Mezz
                      ? "Mezzanine"
                      : selectedRecommendation.tranche === Tranche.Junior
                      ? "Junior"
                      : "Unknown"}
                  </span>
                </div>
              )}
              {selectedRecommendation.amount && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Amount:</span>
                  <span className="ml-2">${parseFloat(selectedRecommendation.amount).toFixed(2)}</span>
                </div>
              )}
              <div>
                <span className="text-sm font-medium text-gray-700">Reasoning:</span>
                <p className="mt-1 text-sm text-gray-600">{selectedRecommendation.reasoning}</p>
              </div>
              {selectedRecommendation.marketContext && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Market Context:</span>
                  <p className="mt-1 text-sm text-gray-600">{selectedRecommendation.marketContext}</p>
                </div>
              )}
              <div className="flex gap-4 pt-2">
                <span className="text-sm">
                  <span className="font-medium text-gray-700">Urgency:</span>{" "}
                  <span className="capitalize">{selectedRecommendation.urgency}</span>
                </span>
                <span className="text-sm">
                  <span className="font-medium text-gray-700">Confidence:</span>{" "}
                  {selectedRecommendation.confidence}%
                </span>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleExecute(selectedRecommendation)}
                disabled={isExecuting}
                className="flex-1 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isExecuting ? "Executing..." : "Execute"}
              </button>
              <button
                onClick={() => setSelectedRecommendation(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

