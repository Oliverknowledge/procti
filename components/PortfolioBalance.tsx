"use client";

import { useTrancheData } from "@/hooks/useTrancheData";
import { useUSDC } from "@/hooks/useUSDC";
import { Tranche } from "@/lib/procti/addresses";

/**
 * @component PortfolioBalance
 * @description Displays user's total portfolio value in the header
 */
export default function PortfolioBalance() {
  const { userPositions } = useTrancheData();
  const { balance } = useUSDC();

  // Calculate total portfolio value
  const seniorValue = parseFloat(userPositions[Tranche.Senior].value || "0");
  const mezzValue = parseFloat(userPositions[Tranche.Mezz].value || "0");
  const juniorValue = parseFloat(userPositions[Tranche.Junior].value || "0");
  const availableUSDC = parseFloat(balance || "0");
  
  const totalPortfolioValue = seniorValue + mezzValue + juniorValue + availableUSDC;

  return (
    <div className="flex items-center gap-4">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-600">Portfolio</div>
          <div className="text-lg font-bold text-gray-900">
            ${totalPortfolioValue.toLocaleString(undefined, { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            })}
          </div>
        </div>
        {totalPortfolioValue > 0 && (
          <div className="text-xs text-gray-500 mt-0.5">
            {availableUSDC > 0 && (
              <span>${availableUSDC.toFixed(2)} available</span>
            )}
            {(seniorValue > 0 || mezzValue > 0 || juniorValue > 0) && (
              <span className="ml-2">
                ${(seniorValue + mezzValue + juniorValue).toFixed(2)} in vault
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

