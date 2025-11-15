"use client";

import { useState, useEffect } from "react";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useOracleSync } from "@/hooks/useOracleSync";

export default function ActiveChainDisplay() {
  const { activeChain, bestChain, switchToBestChain, refetchActiveChain, refetchBestChain, isPending, isConfirming, isConfirmed, error } = useCrossChainArb();
  const [isSwitching, setIsSwitching] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  
  // Automatically sync oracle price when chain changes
  useOracleSync();

  useEffect(() => {
    // Poll active chain every 10 seconds
    const interval = setInterval(() => {
      refetchActiveChain();
      refetchBestChain();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetchActiveChain, refetchBestChain]);

  // Refetch when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      console.log("Chain switch transaction confirmed!");
      setIsSwitching(false);
      setRetryCount(0); // Reset retry count on success
      setRateLimitError(null); // Clear rate limit error
      // Wait a bit for the chain to update on-chain, then refetch
      setTimeout(() => {
        refetchActiveChain();
        refetchBestChain();
      }, 2000);
    }
  }, [isConfirmed, refetchActiveChain, refetchBestChain]);

  // Clear switching state if transaction fails or errors
  useEffect(() => {
    if (error) {
      console.error("Transaction error detected:", error);
      const errorMessage = error.message || "";
      
      // Check if it's a rate limit error
      if (errorMessage.includes("rate limit") || errorMessage.includes("exceeds defined limit")) {
        setRateLimitError(errorMessage);
      } else {
        setRateLimitError(null);
      }
      
      setIsSwitching(false);
    }
  }, [error]);

  const handleSwitch = async () => {
    if (!bestChain || !activeChain) {
      alert("Chain information not available. Please wait for data to load.");
      return;
    }

    if (activeChain === bestChain) {
      alert("You are already on the best chain!");
      return;
    }

    console.log("Switch button clicked - initiating chain switch...");
    console.log(`Switching from ${activeChain} to ${bestChain}`);
    setIsSwitching(true);
    try {
      await switchToBestChain();
      console.log("Transaction submitted, waiting for confirmation...");
      // The transaction is now pending, isConfirming will handle the rest
    } catch (error: any) {
      console.error("Error switching chain:", error);
      setIsSwitching(false);
      
      // Check if it's a rate limit error
      const isRateLimit = 
        error?.message?.includes("rate limit") ||
        error?.message?.includes("exceeds defined limit") ||
        error?.message?.includes("rate limited");
      
      // Check if it's an RPC error
      const isRpcError = 
        error?.message?.includes("RPC endpoint") ||
        error?.message?.includes("too many errors") ||
        error?.message?.includes("retrying");
      
      // Check if it's a revert/rejection
      const isRevert = 
        error?.message?.includes("revert") ||
        error?.message?.includes("rejected") ||
        error?.message?.includes("user rejected") ||
        error?.code === 4001;
      
      if (isRateLimit) {
        setRateLimitError(error.message || "Request is being rate limited");
        // Don't show alert for rate limit - let the UI show it with retry option
      } else if (isRevert) {
        alert(
          `Transaction failed or was rejected.\n\n` +
          `Possible reasons:\n` +
          `- The contract may require certain conditions to be met\n` +
          `- You may need to withdraw funds first\n` +
          `- The best chain may have changed\n\n` +
          `Error: ${error.message || "Transaction reverted"}`
        );
      } else if (isRpcError) {
        alert(
          "RPC endpoint is experiencing issues. Please try again in a few minutes.\n\n" +
          "The network may be temporarily unavailable. You can:\n" +
          "1. Wait a few minutes and try again\n" +
          "2. Refresh the page to reconnect\n" +
          "3. Check your network connection"
        );
      } else {
        alert(`Failed to switch chain: ${error.message || "Unknown error"}`);
      }
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
        <div className="mt-4">
          <button
            onClick={handleSwitch}
            disabled={isSwitching || isPending || isConfirming}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSwitching || isPending || isConfirming 
              ? (isPending ? "Waiting for wallet..." : isConfirming ? "Confirming transaction..." : "Switching...") 
              : `Switch to ${bestChain}`}
          </button>
          {(error || rateLimitError) && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-sm">
              <p className="text-xs text-red-800 font-medium">Transaction Error</p>
              <p className="text-xs text-red-600 mt-1">
                {rateLimitError || error?.message?.includes("rate limit") || error?.message?.includes("exceeds defined limit")
                  ? "Request is being rate limited. Please wait a moment and try again."
                  : error?.message?.includes("RPC endpoint") || error?.message?.includes("too many errors")
                  ? "RPC endpoint is experiencing issues. Please try again in a few minutes."
                  : error?.message || "Transaction failed"}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={async () => {
                    // Clear error state
                    setRateLimitError(null);
                    setIsSwitching(false);
                    setRetryCount(prev => prev + 1);
                    
                    // Exponential backoff: wait longer each retry (5s, 10s, 20s, etc.)
                    const delay = Math.min(5000 * Math.pow(2, retryCount), 60000); // Max 60 seconds
                    
                    if (delay > 1000) {
                      alert(`Rate limited. Waiting ${Math.round(delay / 1000)} seconds before retrying...`);
                    }
                    
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, delay));
                    
                    // Try again
                    handleSwitch();
                  }}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  disabled={isSwitching || isPending || isConfirming}
                >
                  {retryCount > 0 ? `Retry (${retryCount})` : "Retry Now"}
                </button>
                <button
                  onClick={() => {
                    setRateLimitError(null);
                    setRetryCount(0);
                    window.location.reload();
                  }}
                  className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Refresh Page
                </button>
              </div>
              {rateLimitError && (
                <p className="text-xs text-orange-600 mt-2">
                  💡 Tip: Rate limiting usually clears after 1-2 minutes. Wait a bit longer before retrying.
                </p>
              )}
            </div>
          )}
          {isPending && (
            <p className="mt-2 text-xs text-blue-600">Please approve the transaction in your wallet...</p>
          )}
          {isConfirming && (
            <p className="mt-2 text-xs text-blue-600">Transaction submitted, waiting for confirmation...</p>
          )}
        </div>
      )}

      {isOptimal && (
        <div className="mt-4 px-3 py-2 bg-green-50 border border-green-200 rounded-sm">
          <p className="text-sm text-green-800 font-medium">✓ Optimal Chain Selected</p>
        </div>
      )}
    </div>
  );
}

