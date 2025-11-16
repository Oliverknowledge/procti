"use client";

import { useState } from "react";
import { buildAdvisorPrompt, type UserAnswers, type AdvisorResponse } from "@/lib/ai/advisorPrompt";

/**
 * @hook useAIAdvisor
 * @description Hook for AI-based tranche recommendation
 * @notice Isolated hook - does NOT interfere with existing wallet/blockchain hooks
 */
export const useAIAdvisor = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AdvisorResponse | null>(null);

  const getRecommendation = async (answers: UserAnswers) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const prompt = buildAdvisorPrompt(answers);

      // Get API key from environment variable
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

      // Use OpenAI API (or fallback to a mock if no key provided)
      if (!apiKey) {
        // Mock response for demo purposes
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay
        
        // Simple rule-based recommendation as fallback
        let recommendedTranche: "Senior" | "Mezzanine" | "Junior" = "Mezzanine";
        let allocation = { senior: 40, mezz: 40, junior: 20 };
        let explanation = "";

        if (answers.lossTolerance === "None" || answers.priority === "Stability") {
          recommendedTranche = "Senior";
          allocation = { senior: 70, mezz: 25, junior: 5 };
          explanation = "Based on your preference for stability and low risk tolerance, the Senior tranche is recommended. It offers the lowest risk with first-loss protection.";
        } else if (answers.lossTolerance === "High" && answers.priority === "High returns") {
          recommendedTranche = "Junior";
          allocation = { senior: 10, mezz: 30, junior: 60 };
          explanation = "Given your high risk tolerance and focus on returns, the Junior tranche aligns with your profile. It offers the highest potential returns but takes first-loss position.";
        } else {
          recommendedTranche = "Mezzanine";
          allocation = { senior: 40, mezz: 40, junior: 20 };
          explanation = "A balanced approach fits your profile. The Mezzanine tranche offers moderate risk and returns, positioned between Senior and Junior.";
        }

        setResult({
          recommendedTranche,
          explanation,
          allocation,
        });
        setIsLoading(false);
        return;
      }

      // Real OpenAI API call
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Using cheaper model
          messages: [
            {
              role: "system",
              content: `You are an expert financial advisor specializing in DeFi structured products, risk management, and portfolio optimization. 
              
Your expertise includes:
- Structured finance and tranche mechanics
- Risk-return analysis and portfolio theory
- DeFi protocols and yield strategies
- Behavioral finance and investor psychology

Always provide sophisticated, informed financial analysis. Return ONLY valid JSON (no markdown, no code blocks, no explanations outside JSON).`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.6, // Slightly lower for more consistent, analytical responses
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error("No response from AI");
      }

      // Parse JSON response
      let parsed: AdvisorResponse;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse AI response as JSON");
        }
      }

      // Validate response structure
      if (
        !parsed.recommendedTranche ||
        !parsed.explanation ||
        !parsed.allocation ||
        typeof parsed.allocation.senior !== "number" ||
        typeof parsed.allocation.mezz !== "number" ||
        typeof parsed.allocation.junior !== "number"
      ) {
        throw new Error("Invalid response format from AI");
      }

      // Normalize allocation to sum to 100
      const total = parsed.allocation.senior + parsed.allocation.mezz + parsed.allocation.junior;
      if (total !== 100) {
        const factor = 100 / total;
        parsed.allocation = {
          senior: Math.round(parsed.allocation.senior * factor),
          mezz: Math.round(parsed.allocation.mezz * factor),
          junior: Math.round(parsed.allocation.junior * factor),
        };
        // Adjust for rounding errors
        const newTotal = parsed.allocation.senior + parsed.allocation.mezz + parsed.allocation.junior;
        if (newTotal !== 100) {
          parsed.allocation.senior += 100 - newTotal;
        }
      }

      setResult(parsed);
    } catch (err: any) {
      console.error("AI Advisor error:", err);
      setError(err.message || "Failed to get AI recommendation");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return {
    getRecommendation,
    isLoading,
    error,
    result,
    reset,
  };
};

