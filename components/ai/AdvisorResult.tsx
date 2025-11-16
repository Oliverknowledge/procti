"use client";

import { useState } from "react";
import type { AdvisorResponse } from "@/lib/ai/advisorPrompt";
import { Tranche } from "@/lib/procti/addresses";

interface AdvisorResultProps {
  result: AdvisorResponse;
  onUseRecommendation?: (tranche: Tranche) => void;
}

/**
 * @component AdvisorResult
 * @description Displays AI recommendation with allocation breakdown
 * @notice Isolated component - does NOT modify existing deposit panel
 */
export default function AdvisorResult({ result, onUseRecommendation }: AdvisorResultProps) {
  const [apiKey, setApiKey] = useState(
    typeof window !== "undefined" ? localStorage.getItem("openai_api_key") || "" : ""
  );
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  // Map tranche names to enum values
  const trancheMap: Record<string, Tranche> = {
    Senior: Tranche.Senior,
    Mezzanine: Tranche.Mezz,
    Junior: Tranche.Junior,
  };

  const recommendedTranche = trancheMap[result.recommendedTranche] || Tranche.Mezz;

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

  const colors = trancheColors[result.recommendedTranche];

  const handleUseRecommendation = () => {
    if (onUseRecommendation) {
      onUseRecommendation(recommendedTranche);
    }
  };

  return (
    <div className="space-y-6">
      {/* Recommended Tranche */}
      <div className={`${colors.bg} ${colors.border} border-2 rounded-lg p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`${colors.badge} text-white px-3 py-1 rounded-full text-sm font-semibold`}>
                Recommended
              </span>
              <h3 className={`text-2xl font-bold ${colors.text}`}>
                {result.recommendedTranche} Tranche
              </h3>
            </div>
            <p className="text-sm text-gray-600 mt-2">{result.explanation}</p>
          </div>
        </div>

        {/* Use Recommendation Button */}
        {onUseRecommendation && (
          <button
            onClick={handleUseRecommendation}
            className="mt-4 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] transition-colors text-sm"
          >
            Use {result.recommendedTranche} in Deposit Panel →
          </button>
        )}
      </div>

      {/* Allocation Breakdown */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Suggested Allocation</h4>
        
        <div className="space-y-4">
          {/* Senior */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Senior</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{result.allocation.senior}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${result.allocation.senior}%` }}
              ></div>
            </div>
          </div>

          {/* Mezzanine */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium text-gray-700">Mezzanine</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{result.allocation.mezz}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${result.allocation.mezz}%` }}
              ></div>
            </div>
          </div>

          {/* Junior */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">Junior</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{result.allocation.junior}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${result.allocation.junior}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            💡 This allocation is a suggestion based on your risk profile. You can adjust it based on your preferences.
          </p>
        </div>
      </div>

      {/* API Key Input (Optional) */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-blue-900">Use Real AI (Optional)</h4>
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showApiKeyInput ? "Hide" : "Show"}
          </button>
        </div>
        {showApiKeyInput && (
          <div className="mt-3">
            <p className="text-xs text-blue-800 mb-2">
              Enter your OpenAI API key to use GPT-4 instead of the rule-based advisor:
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (typeof window !== "undefined") {
                  localStorage.setItem("openai_api_key", e.target.value);
                }
              }}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] text-sm"
            />
            <p className="text-xs text-blue-700 mt-2">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

