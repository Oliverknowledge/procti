"use client";

import { useChainBalances } from "@/hooks/useChainBalances";
import { useUSDC } from "@/hooks/useUSDC";
import { useVault } from "@/hooks/useVault";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useAccount } from "wagmi";

export default function ChainBalanceBreakdown() {
  const { chainBalances, isLoading: isLoadingChains } = useChainBalances();
  const { balance: walletBalance } = useUSDC();
  const { vaultBalance } = useVault();
  const { activeChain } = useCrossChainArb();
  const { isConnected } = useAccount();

  // Calculate total balance per chain
  const chainTotals = chainBalances.map((chainBalance) => {
    // Add wallet balance if this is the active chain and user is connected
    const walletOnThisChain = 
      isConnected && 
      chainBalance.chain === activeChain 
        ? parseFloat(walletBalance || "0")
        : 0;
    
    const totalBalance = chainBalance.balance + walletOnThisChain;
    
    return {
      chain: chainBalance.chain,
      vaultBalance: chainBalance.balance,
      walletBalance: walletOnThisChain,
      totalBalance,
      percentage: parseFloat(vaultBalance || "0") > 0 
        ? (totalBalance / (parseFloat(vaultBalance || "0") + parseFloat(walletBalance || "0"))) * 100
        : 0,
    };
  });

  // Calculate grand total
  const grandTotal = parseFloat(vaultBalance || "0") + parseFloat(walletBalance || "0");

  return (
    <div className="bg-white rounded-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-500 uppercase tracking-wider">Total USDC by Chain</div>
        <div className="text-xs text-gray-500">
          Total: <span className="font-medium text-gray-900">
            {grandTotal.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            USDC
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        Shows your complete USDC balance per chain: <strong>Vault</strong> (deposited funds) + <strong>Wallet</strong> (your wallet balance on the active chain).
      </p>
      
      {isLoadingChains ? (
        <p className="text-sm text-gray-500">Loading chain balances...</p>
      ) : chainTotals.length === 0 ? (
        <p className="text-sm text-gray-500">No chain balances yet</p>
      ) : (
        <div className="space-y-4">
          {chainTotals
            .filter((ct) => ct.totalBalance > 0 || ct.chain === activeChain)
            .sort((a, b) => b.totalBalance - a.totalBalance)
            .map((chainTotal) => (
              <div key={chainTotal.chain} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {chainTotal.chain}
                    </span>
                    {chainTotal.chain === activeChain && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {chainTotal.totalBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      USDC
                    </span>
                    {grandTotal > 0 && (
                      <span className="text-xs text-gray-500 ml-2">
                        ({chainTotal.percentage.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Breakdown */}
                <div className="pl-2 space-y-1 text-xs text-gray-600">
                  {chainTotal.vaultBalance > 0 && (
                    <div className="flex justify-between">
                      <span>Vault:</span>
                      <span>{chainTotal.vaultBalance.toFixed(2)} USDC</span>
                    </div>
                  )}
                  {chainTotal.walletBalance > 0 && (
                    <div className="flex justify-between">
                      <span>Wallet:</span>
                      <span>{chainTotal.walletBalance.toFixed(2)} USDC</span>
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                {grandTotal > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${chainTotal.percentage}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

