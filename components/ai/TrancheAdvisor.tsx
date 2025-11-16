"use client";

import { useState } from "react";
import { useAIAdvisor } from "@/hooks/useAIAdvisor";
import type { UserAnswers } from "@/lib/ai/advisorPrompt";
import AdvisorQuestions from "./AdvisorQuestions";
import AdvisorResult from "./AdvisorResult";
import { Tranche } from "@/lib/procti/addresses";

interface TrancheAdvisorProps {
  onUseRecommendation?: (tranche: Tranche) => void;
}

/**
 * @component TrancheAdvisor
 * @description AI-powered tranche recommendation system
 * @notice Fully self-contained component - does NOT modify existing UI
 */
export default function TrancheAdvisor({ onUseRecommendation }: TrancheAdvisorProps) {
  const { getRecommendation, isLoading, error, result, reset } = useAIAdvisor();

  const handleSubmit = async (answers: UserAnswers) => {
    // Check for API key in localStorage or use mock (rule-based fallback)
    const storedKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : null;
    const keyToUse = storedKey || undefined;
    
    await getRecommendation(answers, keyToUse);
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">AI Tranche Advisor</h2>
        <p className="text-sm text-gray-600">
          Answer a few questions about your risk profile, and our AI will recommend the best tranche for you.
        </p>
      </div>

      {!result ? (
        <div>
          <AdvisorQuestions onSubmit={handleSubmit} isSubmitting={isLoading} />
          
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>Error:</strong> {error}
              </p>
              <button
                onClick={handleReset}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          )}

          {isLoading && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B5CF6]"></div>
                <p className="text-sm text-blue-800">
                  Analyzing your risk profile and generating recommendation...
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <AdvisorResult result={result} onUseRecommendation={onUseRecommendation} />
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

