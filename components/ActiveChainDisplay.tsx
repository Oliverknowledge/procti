"use client";

import { useState, useEffect } from "react";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useVault } from "@/hooks/useVault";
import { useOracleSync } from "@/hooks/useOracleSync";

export default function ActiveChainDisplay() {
  const { activeChain, bestChain, switchToBestChain, refetchActiveChain, refetchBestChain, isPending, isConfirming } = useCrossChainArb();
  const { triggerBestChainSwitch } = useVault();
  const [isSwitching, setIsSwitching] = useState(false);
  
  // Automatically sync oracle price when chain changes
  useOracleSync();

  // DISABLED: Auto-refresh is handled by page.tsx to avoid duplicate requests
  // This component will update when page.tsx calls refetchActiveChain and refetchBestChain
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     refetchActiveChain();
  //     refetchBestChain();
  //   }, 30000);
  //   return () => clearInterval(interval);
  // }, []);

  const handleSwitch = async () => {
    setIsSwitching(true);
    try {
      await triggerBestChainSwitch();
      // Wait a bit then refetch
      setTimeout(() => {
        refetchActiveChain();
        refetchBestChain();
      }, 2000);
    } catch (error) {
      console.error("Error switching chain:", error);
      alert("Failed to switch chain");
    } finally {
      setIsSwitching(false);
    }
  };

  const isOptimal = activeChain === bestChain;

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Active Chain</h2>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Current:</span>
          <span className="font-medium text-gray-900">{activeChain || "Loading..."}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Best Chain:</span>
          <span className="font-medium text-gray-900">{bestChain || "Loading..."}</span>
        </div>
      </div>

      {!isOptimal && bestChain && (
        <button
          onClick={handleSwitch}
          disabled={isSwitching || isPending || isConfirming}
          className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isSwitching || isPending || isConfirming ? "Switching..." : `Switch to ${bestChain}`}
        </button>
      )}

      {isOptimal && (
        <div className="mt-4 px-3 py-2 bg-green-50 border border-green-200 rounded-sm">
          <p className="text-sm text-green-800 font-medium">✓ Optimal Chain Selected</p>
        </div>
      )}
    </div>
  );
}

