/**
 * AI Advisor Prompt Template
 * @description Template for LLM-based tranche recommendation
 */

export interface UserAnswers {
  lossTolerance: "None" | "A little" | "Moderate" | "High";
  timeHorizon: "Short-term" | "Medium-term" | "Long-term";
  priority: "Stability" | "Balanced growth" | "High returns";
  experience?: "Beginner" | "Intermediate" | "Advanced";
}

export interface AdvisorResponse {
  recommendedTranche: "Senior" | "Mezzanine" | "Junior";
  explanation: string;
  allocation: {
    senior: number;
    mezz: number;
    junior: number;
  };
}

/**
 * Build the prompt for the LLM advisor
 */
export function buildAdvisorPrompt(answers: UserAnswers): string {
  return `You are an AI financial assistant for the Procti structured USDC vault.

Your task is to recommend one of the following tranches:
- Senior (lowest risk, lowest returns, first-loss protection)
- Mezzanine (medium risk, medium returns, second-loss position)
- Junior (highest risk, highest returns, first-loss position)

Based on the user's answers, return a JSON object only (no markdown, no code blocks, just valid JSON):

{
  "recommendedTranche": "Senior" | "Mezzanine" | "Junior",
  "explanation": "A clear 1-2 sentence explanation of why this tranche fits the user's profile",
  "allocation": {
    "senior": X,
    "mezz": X,
    "junior": X
  }
}

Make sure the allocation percentages sum to 100.

User's Risk Profile:
- Loss Tolerance: ${answers.lossTolerance}
- Time Horizon: ${answers.timeHorizon}
- Priority: ${answers.priority}
${answers.experience ? `- DeFi Experience: ${answers.experience}` : ""}

Guidelines:
- If loss tolerance is "None" or priority is "Stability" → Recommend Senior
- If balanced approach or medium-term → Recommend Mezzanine
- If high risk tolerance and priority is "High returns" → Recommend Junior
- Allocation should reflect risk profile (conservative = more Senior, aggressive = more Junior)

Return only the JSON object:`;
}

