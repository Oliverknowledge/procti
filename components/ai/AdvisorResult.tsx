"use client";

import { useState } from "react";
import type { AdvisorResponse } from "@/lib/ai/advisorPrompt";
import { Tranche } from "@/lib/procti/addresses";
import AgentActionPanel from "./AgentActionPanel";
import AgenticAdvisorPanel from "./AgenticAdvisorPanel";

interface AdvisorResultProps {
  result: AdvisorResponse;
  onUseRecommendation?: (tranche: Tranche) => void;
  showAgentPanel?: boolean;
}

/**
 * @component AdvisorResult
 * @description Displays AI recommendation with allocation breakdown
 * @notice Isolated component - does NOT modify existing deposit panel
 */
export default function AdvisorResult({ result, onUseRecommendation, showAgentPanel = false }: AdvisorResultProps) {
  // API key is now read from .env file (NEXT_PUBLIC_OPENAI_API_KEY)
  const hasApiKey = !!process.env.NEXT_PUBLIC_OPENAI_API_KEY;

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

      {/* AI Agent Action Panel - New addition */}
      {showAgentPanel && (
        <div className="mt-6">
          <AgentActionPanel recommendation={result} />
        </div>
      )}

      {/* Agentic Advisor Panel - Proactive monitoring */}
      {showAgentPanel && (
        <div className="mt-6">
          <AgenticAdvisorPanel />
        </div>
      )}

      {/* API Key Status */}
      {hasApiKey ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <div>
              <p className="text-xs font-semibold text-green-900 mb-1">
                AI-Powered Analysis Enabled
              </p>
              <p className="text-xs text-green-800">
                Using GPT-4o-mini for sophisticated financial analysis. The AI considers your risk profile, 
                time horizon, experience level, and DeFi market dynamics to provide informed recommendations.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-yellow-900 mb-1">
                Using Rule-Based Advisor (Limited Intelligence)
              </p>
              <p className="text-xs text-yellow-800">
                Add <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_OPENAI_API_KEY</code> to your 
                <code className="bg-yellow-100 px-1 rounded">.env</code> file to enable AI-powered financial analysis with GPT-4.
                Currently using simple rule-based logic instead of sophisticated AI analysis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

