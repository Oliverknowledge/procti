"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useOracleSync } from "@/hooks/useOracleSync";

export default function ActiveChainDisplay() {
  const { isConnected } = useAccount();
  const { activeChain, bestChain, switchToBestChain, refetchActiveChain, refetchBestChain, isPending, isConfirming, isConfirmed, error } = useCrossChainArb();
  const [isSwitching, setIsSwitching] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [lastSwitchAttempt, setLastSwitchAttempt] = useState<number>(0);
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);
  const [isAutoSwitching, setIsAutoSwitching] = useState(false);
  
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
      setIsAutoSwitching(false);
      setRetryCount(0); // Reset retry count on success
      setRateLimitError(null); // Clear rate limit error
      setLastSwitchAttempt(Date.now()); // Update last switch time
      // Wait a bit for the chain to update on-chain, then refetch
      setTimeout(() => {
        refetchActiveChain();
        refetchBestChain();
      }, 2000);
    }
  }, [isConfirmed, refetchActiveChain, refetchBestChain]);

  // Automatic chain switching with safeguards
  useEffect(() => {
    // Don't auto-switch if:
    // 1. Wallet not connected
    // 2. Auto-switch is disabled
    // 3. Already switching (manual or auto)
    // 4. Transaction is pending/confirming
    // 5. Missing chain data
    // 6. Already on best chain
    // 7. Too soon since last switch attempt (cooldown: 30 seconds)
    if (
      !isConnected ||
      !autoSwitchEnabled ||
      isSwitching ||
      isAutoSwitching ||
      isPending ||
      isConfirming ||
      !activeChain ||
      !bestChain ||
      activeChain === bestChain ||
      Date.now() - lastSwitchAttempt < 30000 // 30 second cooldown
    ) {
      return;
    }

    // Additional safeguard: Check if we've had recent errors
    if (error && Date.now() - lastSwitchAttempt < 60000) {
      // If we had an error in the last minute, wait longer
      console.log("Recent error detected, waiting before auto-switch...");
      return;
    }

    // Auto-switch to best chain
    const performAutoSwitch = async () => {
      console.log(`[Auto-Switch] Detected best chain change: ${activeChain} → ${bestChain}`);
      setIsAutoSwitching(true);
      setLastSwitchAttempt(Date.now());
      
      try {
        await switchToBestChain();
        console.log("[Auto-Switch] Transaction submitted successfully");
      } catch (error: any) {
        console.error("[Auto-Switch] Error:", error);
        setIsAutoSwitching(false);
        
        // Don't auto-retry on user rejection or revert
        const isUserRejection = 
          error?.code === 4001 ||
          error?.message?.includes("rejected") ||
          error?.message?.includes("User rejected");
        
        const isRevert = 
          error?.message?.includes("revert") ||
          error?.message?.includes("execution reverted");
        
        if (isUserRejection || isRevert) {
          console.log("[Auto-Switch] User rejection or revert - disabling auto-switch temporarily");
          setAutoSwitchEnabled(false);
          // Re-enable after 5 minutes
          setTimeout(() => {
            setAutoSwitchEnabled(true);
            console.log("[Auto-Switch] Re-enabled after cooldown");
          }, 300000);
        }
      }
    };

    // Small delay to avoid rapid switching
    const timeoutId = setTimeout(performAutoSwitch, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [
    isConnected,
    activeChain,
    bestChain,
    autoSwitchEnabled,
    isSwitching,
    isAutoSwitching,
    isPending,
    isConfirming,
    lastSwitchAttempt,
    error,
    switchToBestChain,
  ]);

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
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
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
        <div className="mt-4 space-y-3">
          {/* Auto-switch toggle */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-sm">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoSwitch"
                checked={autoSwitchEnabled}
                onChange={(e) => setAutoSwitchEnabled(e.target.checked)}
                className="w-4 h-4 text-[#8B5CF6] border-gray-300 rounded focus:ring-[#8B5CF6]"
              />
              <label htmlFor="autoSwitch" className="text-sm text-gray-700 cursor-pointer">
                Auto-switch enabled
              </label>
            </div>
            {isAutoSwitching && (
              <span className="text-xs text-purple-600 font-medium">Auto-switching...</span>
            )}
          </div>

          {/* Manual switch button */}
          <button
            onClick={handleSwitch}
            disabled={isSwitching || isAutoSwitching || isPending || isConfirming}
            className="w-full px-4 py-2 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isSwitching || isAutoSwitching || isPending || isConfirming
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
                  className="text-xs px-3 py-1 bg-[#8B5CF6] text-white rounded-lg hover:bg-[#7C3AED] disabled:bg-gray-300 disabled:cursor-not-allowed"
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
            <p className="mt-2 text-xs text-purple-600">Please approve the transaction in your wallet...</p>
          )}
          {isConfirming && (
            <p className="mt-2 text-xs text-purple-600">Transaction submitted, waiting for confirmation...</p>
          )}
        </div>
      )}

      {isOptimal && (
        <div className="mt-4 px-3 py-2 bg-green-50 border border-green-200 rounded-sm">
          <p className="text-sm text-green-800 font-medium">✓ Optimal Chain Selected</p>
          {autoSwitchEnabled && isConnected && (
            <p className="text-xs text-green-600 mt-1">Auto-switch is monitoring for better chains</p>
          )}
        </div>
      )}

      {!isConnected && (
        <div className="mt-4 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-sm">
          <p className="text-xs text-yellow-800">⚠️ Connect your wallet to enable auto-switching</p>
        </div>
      )}
    </div>
  );
}

