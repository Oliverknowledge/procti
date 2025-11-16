"use client";

import { useState } from "react";
import { useAutonomousAgent } from "@/hooks/useAutonomousAgent";
import { useAccount } from "wagmi";

/**
 * @component AutonomousAgent
 * @description Autonomous AI agent that monitors and acts on user's behalf
 * @notice Fully autonomous - uses GPT-4 to make decisions and execute actions
 */
export default function AutonomousAgent() {
  const { isConnected } = useAccount();
  const {
    isActive,
    setIsActive,
    isThinking,
    lastAction,
    actionHistory,
    error,
    setUserPreferences,
    userPreferences,
  } = useAutonomousAgent();

  const [showPreferences, setShowPreferences] = useState(!userPreferences);
  const [prefs, setPrefs] = useState({
    riskTolerance: userPreferences?.riskTolerance || "Moderate",
    timeHorizon: userPreferences?.timeHorizon || "Medium-term",
    priority: userPreferences?.priority || "Balanced growth",
  });

  const handleSavePreferences = () => {
    setUserPreferences(prefs);
    setShowPreferences(false);
  };

  const hasApiKey = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <p className="text-gray-600">Connect your wallet to enable the AI agent.</p>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">⚠️ API Key Required</h3>
        <p className="text-sm text-yellow-800">
          The autonomous agent requires an OpenAI API key. Add <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_OPENAI_API_KEY</code> to your <code className="bg-yellow-100 px-1 rounded">.env</code> file.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#8B5CF6] rounded-full flex items-center justify-center">
            <span className="text-white text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Autonomous AI Agent</h3>
            <p className="text-sm text-gray-600">Monitors and acts on your behalf</p>
          </div>
        </div>
        
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#8B5CF6] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#8B5CF6]"></div>
          <span className="ml-3 text-sm font-medium text-gray-700">
            {isActive ? "Active" : "Inactive"}
          </span>
        </label>
      </div>

      {/* User Preferences */}
      {showPreferences && (
        <div className="bg-white border border-purple-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Configure Agent Preferences</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Risk Tolerance</label>
              <select
                value={prefs.riskTolerance}
                onChange={(e) => setPrefs({ ...prefs, riskTolerance: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option>None</option>
                <option>A little</option>
                <option>Moderate</option>
                <option>High</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Time Horizon</label>
              <select
                value={prefs.timeHorizon}
                onChange={(e) => setPrefs({ ...prefs, timeHorizon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option>Short-term</option>
                <option>Medium-term</option>
                <option>Long-term</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={prefs.priority}
                onChange={(e) => setPrefs({ ...prefs, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option>Stability</option>
                <option>Balanced growth</option>
                <option>High returns</option>
              </select>
            </div>
            <button
              onClick={handleSavePreferences}
              className="w-full px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] transition-colors text-sm"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status</span>
          {isThinking && (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B5CF6]"></div>
              <span className="text-xs text-purple-600">Thinking...</span>
            </div>
          )}
        </div>
        {isActive ? (
          <p className="text-sm text-green-700">
            ✅ Agent is active and monitoring your portfolio. It will execute actions autonomously when conditions warrant.
          </p>
        ) : (
          <p className="text-sm text-gray-600">
            ⏸️ Agent is inactive. Toggle above to activate.
          </p>
        )}
      </div>

      {/* Last Action */}
      {lastAction && (
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-4 font-mono text-xs">
          <div className="text-green-500 mb-2 font-semibold">Last AI Decision:</div>
          <div className="space-y-1">
            <div><span className="text-gray-500">Action:</span> {lastAction.action}</div>
            {lastAction.tranche && <div><span className="text-gray-500">Tranche:</span> {lastAction.tranche}</div>}
            {lastAction.amount && <div><span className="text-gray-500">Amount:</span> {lastAction.amount} USDC</div>}
            {lastAction.shares && <div><span className="text-gray-500">Shares:</span> {lastAction.shares}</div>}
            <div><span className="text-gray-500">Confidence:</span> {lastAction.confidence}%</div>
            <div><span className="text-gray-500">Urgency:</span> {lastAction.urgency}</div>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <span className="text-gray-500">Reasoning:</span> {lastAction.reasoning}
            </div>
          </div>
        </div>
      )}

      {/* Action History */}
      {actionHistory.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Recent Actions</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {actionHistory.slice().reverse().map((action, idx) => (
              <div key={idx} className="text-xs border-b border-gray-100 pb-2 last:border-0">
                <div className="flex justify-between">
                  <span className="font-medium">{action.action}</span>
                  <span className="text-gray-500">{action.confidence}% confidence</span>
                </div>
                {action.tranche && (
                  <div className="text-gray-600 mt-1">{action.tranche} {action.amount ? `- ${action.amount} USDC` : action.shares ? `- ${action.shares} shares` : ''}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
        <p className="text-xs text-blue-800">
          <strong>🤖 Autonomous Agent:</strong> This agent uses GPT-4 to analyze your portfolio and market conditions, 
          then executes deposits, withdrawals, and rebalancing automatically. It runs every 30 seconds when active.
        </p>
      </div>
    </div>
  );
}

