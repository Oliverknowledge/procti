"use client";

import { useState } from "react";
import { useVault } from "@/hooks/useVault";

export default function RiskProfile() {
  const { userRiskProfile, riskProfileString, setRiskProfile, isPending } = useVault();
  const [isSetting, setIsSetting] = useState(false);

  const riskProfiles = [
    { value: 0, name: "Conservative", description: "Safest - switches to defensive mode earlier", threshold: "$0.9992" },
    { value: 1, name: "Balanced", description: "Default - balanced risk tolerance", threshold: "$0.999" },
    { value: 2, name: "Aggressive", description: "Higher risk - allows more price movement", threshold: "$0.9985" },
  ];

  const handleSetRiskProfile = async (profile: number) => {
    try {
      setIsSetting(true);
      await setRiskProfile(profile);
    } catch (error: any) {
      console.error("Set risk profile error:", error);
      alert(`Failed to set risk profile: ${error.message || "Unknown error"}`);
    } finally {
      setIsSetting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Risk Profile</h3>
      
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Current Profile</div>
        <div className="text-lg font-medium text-gray-900">{riskProfileString}</div>
        {userRiskProfile !== undefined && (
          <div className="text-xs text-gray-500 mt-1">
            Defensive threshold: {riskProfiles[Number(userRiskProfile)]?.threshold}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {riskProfiles.map((profile) => (
          <button
            key={profile.value}
            type="button"
            onClick={() => handleSetRiskProfile(profile.value)}
            disabled={isPending || isSetting || Number(userRiskProfile) === profile.value}
            className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
              Number(userRiskProfile) === profile.value
                ? "bg-purple-50 border-[#8B5CF6]"
                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{profile.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{profile.description}</div>
              </div>
              <div className="text-xs text-gray-600">{profile.threshold}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Your risk profile determines when the vault switches to defensive mode during rebalance.
      </div>
    </div>
  );
}


