"use client";

import { useVault } from "@/hooks/useVault";
import { useUSDC } from "@/hooks/useUSDC";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useAccount } from "wagmi";

export default function UnifiedBalanceDisplay() {
  const { unifiedVaultBalance } = useVault();
  const { balance: walletBalance, isLoadingBalance } = useUSDC();
  const { activeChain } = useCrossChainArb();
  const { isConnected } = useAccount();

  // DISABLED: Auto-refresh is handled by page.tsx to avoid duplicate requests
  // This component will update when page.tsx calls refetchUnifiedBalance and refetchBalance
  // useEffect(() => {
  //   if (!isConnected) return;
  //   const interval = setInterval(() => {
  //     refetchUnifiedBalance();
  //     refetchBalance();
  //   }, 10000);
  //   return () => clearInterval(interval);
  // }, [isConnected]);

  // Calculate total balance
  const vaultBalanceNum = parseFloat(unifiedVaultBalance || "0");
  const walletBalanceNum = parseFloat(walletBalance || "0");
  const totalBalance = vaultBalanceNum + walletBalanceNum;

  // Format numbers with 2 decimals and commas
  const formatCurrency = (value: number): string => {
    if (isNaN(value)) return "0.00";
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Show loading state
  const isLoading = unifiedVaultBalance === undefined || (isConnected && isLoadingBalance);

  return (
    <div className="w-full mb-8">
      <div className="bg-white border border-gray-200 rounded-sm p-8 shadow-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-1">
            Unified USDC Balance
          </h2>
          <p className="text-xs text-gray-500">Across all chains</p>
        </div>

        {/* Main Balance */}
        <div className="text-center mb-8">
          <div className="text-5xl font-bold text-gray-900 tracking-tight">
            {isLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : (
              `$${formatCurrency(totalBalance)}`
            )}
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex justify-center gap-12 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Vault Balance
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {isLoading ? (
                <span className="text-gray-400 text-lg">...</span>
              ) : (
                `$${formatCurrency(vaultBalanceNum)}`
              )}
            </div>
          </div>

          {isConnected && (
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                Wallet Balance
              </div>
              <div className="text-xs text-gray-400 mb-1">
                ({activeChain || "Arc"})
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {isLoadingBalance ? (
                  <span className="text-gray-400 text-lg">...</span>
                ) : (
                  `$${formatCurrency(walletBalanceNum)}`
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

