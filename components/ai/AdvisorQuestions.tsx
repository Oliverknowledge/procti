"use client";

import { useState } from "react";
import type { UserAnswers } from "@/lib/ai/advisorPrompt";

interface AdvisorQuestionsProps {
  onSubmit: (answers: UserAnswers) => void;
  isSubmitting?: boolean;
}

/**
 * @component AdvisorQuestions
 * @description Interactive question form for risk profile assessment
 * @notice Isolated component - does NOT modify existing components
 */
export default function AdvisorQuestions({ onSubmit, isSubmitting = false }: AdvisorQuestionsProps) {
  const [answers, setAnswers] = useState<Partial<UserAnswers>>({
    lossTolerance: undefined,
    timeHorizon: undefined,
    priority: undefined,
    experience: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answers.lossTolerance || !answers.timeHorizon || !answers.priority) {
      alert("Please answer all required questions");
      return;
    }

    onSubmit(answers as UserAnswers);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Loss Tolerance */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          How much loss are you comfortable with? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {(["None", "A little", "Moderate", "High"] as const).map((option) => (
            <label
              key={option}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                answers.lossTolerance === option
                  ? "border-[#8B5CF6] bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="lossTolerance"
                value={option}
                checked={answers.lossTolerance === option}
                onChange={(e) => setAnswers({ ...answers, lossTolerance: e.target.value as UserAnswers["lossTolerance"] })}
                className="w-4 h-4 text-[#8B5CF6] border-gray-300 focus:ring-[#8B5CF6]"
                disabled={isSubmitting}
              />
              <span className="ml-3 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Time Horizon */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Is your investment style short-term or long-term? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {(["Short-term", "Medium-term", "Long-term"] as const).map((option) => (
            <label
              key={option}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                answers.timeHorizon === option
                  ? "border-[#8B5CF6] bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="timeHorizon"
                value={option}
                checked={answers.timeHorizon === option}
                onChange={(e) => setAnswers({ ...answers, timeHorizon: e.target.value as UserAnswers["timeHorizon"] })}
                className="w-4 h-4 text-[#8B5CF6] border-gray-300 focus:ring-[#8B5CF6]"
                disabled={isSubmitting}
              />
              <span className="ml-3 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          What is more important to you? <span className="text-red-500">*</span>
        </label>
        <div className="space-y-2">
          {(["Stability", "Balanced growth", "High returns"] as const).map((option) => (
            <label
              key={option}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                answers.priority === option
                  ? "border-[#8B5CF6] bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="priority"
                value={option}
                checked={answers.priority === option}
                onChange={(e) => setAnswers({ ...answers, priority: e.target.value as UserAnswers["priority"] })}
                className="w-4 h-4 text-[#8B5CF6] border-gray-300 focus:ring-[#8B5CF6]"
                disabled={isSubmitting}
              />
              <span className="ml-3 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-3">
          How experienced are you in DeFi? <span className="text-gray-500 text-xs">(Optional)</span>
        </label>
        <div className="space-y-2">
          {(["Beginner", "Intermediate", "Advanced"] as const).map((option) => (
            <label
              key={option}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                answers.experience === option
                  ? "border-[#8B5CF6] bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="experience"
                value={option}
                checked={answers.experience === option}
                onChange={(e) => setAnswers({ ...answers, experience: e.target.value as UserAnswers["experience"] })}
                className="w-4 h-4 text-[#8B5CF6] border-gray-300 focus:ring-[#8B5CF6]"
                disabled={isSubmitting}
              />
              <span className="ml-3 text-sm text-gray-700">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          isSubmitting ||
          !answers.lossTolerance ||
          !answers.timeHorizon ||
          !answers.priority
        }
        className="w-full px-6 py-3 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? "Getting Recommendation..." : "Get AI Recommendation"}
      </button>
    </form>
  );
}

