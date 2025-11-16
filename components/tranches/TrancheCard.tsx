"use client";

import { Tranche, TRANCHES } from "@/lib/procti/addresses";
import { useTrancheData } from "@/hooks/useTrancheData";

interface TrancheCardProps {
  tranche: Tranche;
}

/**
 * @component TrancheCard
 * @description Displays information for a single tranche
 * @notice Isolated component - does NOT interact with existing cards
 */
export default function TrancheCard({ tranche }: TrancheCardProps) {
  const { userPositions, apyEstimates } = useTrancheData();
  const trancheInfo = TRANCHES[tranche];
  const position = userPositions[tranche];

  const colorClasses = {
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    red: "bg-red-50 border-red-200",
  };

  const textClasses = {
    green: "text-green-700",
    yellow: "text-yellow-700",
    red: "text-red-700",
  };

  const bgClasses = {
    green: "bg-green-100",
    yellow: "bg-yellow-100",
    red: "bg-red-100",
  };

  return (
    <div
      className={`rounded-lg border-2 p-6 shadow-sm ${colorClasses[trancheInfo.color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-xl font-semibold ${textClasses[trancheInfo.color as keyof typeof textClasses]}`}>
            {trancheInfo.name} Tranche
          </h3>
          <p className="text-sm text-gray-600 mt-1">{trancheInfo.description}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${bgClasses[trancheInfo.color as keyof typeof bgClasses]} ${textClasses[trancheInfo.color as keyof typeof textClasses]}`}
        >
          {trancheInfo.riskLevel} Risk
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Your Shares:</span>
          <span className="font-medium">{position.shares}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Your Value:</span>
          <span className="font-medium">
            {parseFloat(position.value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            USDC
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Share Price:</span>
          <span className="font-medium">
            ${parseFloat(position.sharePrice).toLocaleString(undefined, {
              minimumFractionDigits: 4,
              maximumFractionDigits: 4,
            })}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-sm text-gray-600">Est. APY:</span>
          <span className="font-semibold">{apyEstimates[tranche]}</span>
        </div>
      </div>
    </div>
  );
}

