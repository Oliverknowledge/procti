"use client";

import { useEffect, useRef } from "react";
import { useOracle } from "@/hooks/useOracle";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useOracleSync } from "@/hooks/useOracleSync";

/**
 * @component OraclePrice
 * @description Displays the current oracle price for USDC/USD
 */
export default function OraclePrice() {
  const { priceFormatted, refetchPrice } = useOracle();
  const { activeChain } = useCrossChainArb();
  const { isSyncing } = useOracleSync(); // This will sync oracle when chain changes
  const lastChainRef = useRef<string | null>(null);

  // Refetch oracle price when active chain changes
  useEffect(() => {
    if (activeChain && activeChain !== lastChainRef.current) {
      lastChainRef.current = activeChain;
      
      // Refetch immediately, then again after sync completes
      refetchPrice();
      
      // Also refetch after a delay to catch the sync update
      const timeoutId1 = setTimeout(() => {
        refetchPrice();
      }, 1000);
      
      const timeoutId2 = setTimeout(() => {
        refetchPrice();
      }, 3000);

      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
      };
    }
  }, [activeChain, refetchPrice]);

  // Also refetch periodically to catch any updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchPrice();
    }, 5000); // Refetch every 5 seconds

    return () => clearInterval(interval);
  }, [refetchPrice]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
      <div className="text-xs text-gray-500 mb-3">Oracle Price</div>
      <p className="text-2xl font-medium text-gray-900 mb-1">
        ${parseFloat(priceFormatted).toLocaleString(undefined, {
          minimumFractionDigits: 4,
          maximumFractionDigits: 4,
        })}
      </p>
      <p className="text-xs text-gray-400">USDC/USD</p>
      {activeChain && (
        <p className="text-xs text-gray-500 mt-1">
          Active Chain: {activeChain}
          {isSyncing && <span className="ml-2 text-purple-600">(Syncing...)</span>}
        </p>
      )}
    </div>
  );
}

