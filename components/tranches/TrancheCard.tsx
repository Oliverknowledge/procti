"use client";

import { Tranche, TRANCHES } from "@/lib/procti/addresses";
import { useTrancheData } from "@/hooks/useTrancheData";
import { useEffect, useState } from "react";

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
  
  const [prevValue, setPrevValue] = useState(position.value);
  const [isChanging, setIsChanging] = useState(false);
  const [changeDirection, setChangeDirection] = useState<"up" | "down" | null>(null);

  // Detect value changes and animate
  useEffect(() => {
    const currentValue = parseFloat(position.value);
    const previousValue = parseFloat(prevValue);
    
    if (currentValue !== previousValue && previousValue > 0) {
      setIsChanging(true);
      setChangeDirection(currentValue > previousValue ? "up" : "down");
      
      setTimeout(() => {
        setIsChanging(false);
        setChangeDirection(null);
      }, 2000);
      
      setPrevValue(position.value);
    }
  }, [position.value, prevValue]);

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
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
          Tranche Vault
        </span>
      </div>
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
          <span
            className={`font-medium transition-all duration-500 ${
              isChanging
                ? changeDirection === "up"
                  ? "text-green-600 scale-110"
                  : "text-red-600 scale-110"
                : ""
            }`}
          >
            {parseFloat(position.value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            USDC
            {isChanging && (
              <span className="ml-2 text-xs">
                {changeDirection === "up" ? "📈" : "📉"}
              </span>
            )}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Share Price:</span>
          <span
            className={`font-medium transition-all duration-500 ${
              isChanging
                ? changeDirection === "up"
                  ? "text-green-600"
                  : "text-red-600"
                : ""
            }`}
          >
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

