"use client";

import { useState } from "react";
import { useAIAgent } from "@/hooks/useAIAgent";
import { useUSDC } from "@/hooks/useUSDC";
import type { AdvisorResponse } from "@/lib/ai/advisorPrompt";
import { Tranche, TRANCHES } from "@/lib/procti/addresses";

interface AgentActionPanelProps {
  recommendation: AdvisorResponse;
}

/**
 * @component AgentActionPanel
 * @description AI Agent panel for executing deposits with user confirmation
 * @notice Isolated component - does NOT modify existing deposit logic
 */
export default function AgentActionPanel({ recommendation }: AgentActionPanelProps) {
  const [amount, setAmount] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { executeDeposit, isExecuting, error, success, executionLog, reset } = useAIAgent();
  const { balance } = useUSDC();

  // Map tranche names to enum values
  const trancheMap: Record<string, Tranche> = {
    Senior: Tranche.Senior,
    Mezzanine: Tranche.Mezz,
    Junior: Tranche.Junior,
  };

  const recommendedTranche = trancheMap[recommendation.recommendedTranche] || Tranche.Mezz;
  const trancheInfo = TRANCHES[recommendedTranche];

  // Color coding based on tranche
  const trancheColors = {
    Senior: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-900",
      badge: "bg-green-600",
    },
    Mezzanine: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-900",
      badge: "bg-yellow-600",
    },
    Junior: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-900",
      badge: "bg-red-600",
    },
  };

  const colors = trancheColors[recommendation.recommendedTranche];

  const handleExecuteClick = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert("Please enter a valid deposit amount");
      return;
    }

    if (parseFloat(balance) < parseFloat(amount)) {
      alert("Insufficient USDC balance");
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    await executeDeposit(amount, recommendedTranche, recommendation);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const handleReset = () => {
    reset();
    setAmount("");
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-[#8B5CF6] rounded-full flex items-center justify-center">
          <span className="text-white text-xl">🤖</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Agent Auto-Action</h3>
          <p className="text-xs text-gray-600">Let the AI execute the deposit on your behalf</p>
        </div>
      </div>

      {/* AI Decision Summary */}
      <div className={`${colors.bg} ${colors.border} border rounded-lg p-4 mb-4`}>
        <div className="flex items-center gap-2 mb-2">
          <span className={`${colors.badge} text-white px-2 py-1 rounded text-xs font-semibold`}>
            AI Recommends
          </span>
          <span className={`text-sm font-medium ${colors.text}`}>
            {recommendation.recommendedTranche} Tranche
          </span>
        </div>
        <p className="text-xs text-gray-700">{recommendation.explanation}</p>
        <div className="mt-2 text-xs text-gray-600">
          <span className="font-medium">Suggested Allocation:</span>{" "}
          {recommendation.allocation.senior}% Senior, {recommendation.allocation.mezz}% Mezz,{" "}
          {recommendation.allocation.junior}% Junior
        </div>
      </div>

      {/* Amount Input - User MUST enter manually */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Deposit Amount (USDC) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          min="0"
          disabled={isExecuting || success}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">
          Available: {parseFloat(balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
        </p>
        <p className="text-xs text-purple-600 mt-1">
          ⚠️ You must manually enter the amount. AI does not set this automatically.
        </p>
      </div>

      {/* Execution Log */}
      {executionLog.length > 0 && (
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-4 font-mono text-xs max-h-40 overflow-y-auto">
          <div className="text-green-500 mb-2 font-semibold">Execution Log:</div>
          {executionLog.map((log, idx) => (
            <div key={idx} className="mb-1">
              {log}
            </div>
          ))}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-green-800">
            <strong>✅ Success!</strong> Deposit executed successfully. The AI agent has completed the transaction.
          </p>
          <button
            onClick={handleReset}
            className="mt-2 text-xs text-green-600 hover:text-green-800 underline"
          >
            Execute Another Deposit
          </button>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleExecuteClick}
        disabled={isExecuting || success || !amount || parseFloat(amount) <= 0}
        className="w-full bg-[#8B5CF6] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isExecuting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>AI Agent Executing...</span>
          </>
        ) : success ? (
          "✅ Deposit Complete"
        ) : (
          "🤖 Let AI Agent Execute Deposit"
        )}
      </button>

      {/* Safety Notice */}
      <p className="text-xs text-gray-500 mt-3 text-center">
        🔒 All actions require your explicit confirmation. The AI agent cannot execute transactions autonomously.
      </p>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm AI Agent Action</h3>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>AI Recommendation:</strong> {recommendation.recommendedTranche} Tranche
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Deposit Amount:</strong> {parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
              </p>
              <p className="text-xs text-gray-600">
                <strong>Reasoning:</strong> {recommendation.explanation}
              </p>
            </div>

            <p className="text-sm text-gray-700 mb-6">
              Do you want the AI agent to deposit <strong>{parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC</strong> into the{" "}
              <strong>{recommendation.recommendedTranche}</strong> tranche?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={isExecuting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isExecuting}
                className="flex-1 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] transition-colors disabled:opacity-50"
              >
                {isExecuting ? "Processing..." : "Confirm & Execute"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

