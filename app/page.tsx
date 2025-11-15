"use client";

import { useEffect } from "react";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import VaultDashboard from "@/components/VaultDashboard";
import ActionsPanel from "@/components/ActionsPanel";
import ModeHistory from "@/components/ModeHistory";
import RiskProfile from "@/components/RiskProfile";
import MultiChainDashboard from "@/components/MultiChainDashboard";
import ArbitrageDetector from "@/components/ArbitrageDetector";
import ChainDataManager from "@/components/ChainDataManager";
import CrossChainOpportunityChecker from "@/components/CrossChainOpportunityChecker";
import AutoChainDataUpdater from "@/components/AutoChainDataUpdater";
import ActiveChainDisplay from "@/components/ActiveChainDisplay";
import CrossChainDecisionLog from "@/components/CrossChainDecisionLog";
import CrossChainMoveVisualizer from "@/components/CrossChainMoveVisualizer";
import SmartCrossChainChecker from "@/components/SmartCrossChainChecker";
import SimulatedBridge from "@/components/SimulatedBridge";
import { useVault } from "@/hooks/useVault";
import { usePools } from "@/hooks/usePools";
import { useOracle } from "@/hooks/useOracle";
import { useUSDC } from "@/hooks/useUSDC";
import { useModeHistory } from "@/hooks/useModeHistory";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();
  const { refetchMode, refetchVaultBalance, refetchRiskProfile } = useVault();
  const { refetchAll } = usePools();
  const { refetchPrice } = useOracle();
  const { refetchBalance } = useUSDC();
  const { refetch: refetchModeHistory } = useModeHistory();
  const { refetchChainData, refetchBestChain } = useCrossChainArb();

  // Auto-refresh every 4 seconds (vault data)
  // Chain data refreshes less frequently to avoid rate limiting
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refetchMode();
      refetchVaultBalance();
      refetchAll();
      refetchPrice();
      refetchBalance();
      // Mode history refreshes every 20 seconds to avoid rate limiting
      // refetchModeHistory is called separately below
      refetchRiskProfile();
      // Chain data refreshes every 15 seconds to avoid rate limiting
      // refetchChainData and refetchBestChain are called separately below
    }, 4000);

    // Separate interval for chain data (much less frequent to avoid rate limiting)
    const chainDataInterval = setInterval(() => {
      refetchChainData();
      refetchBestChain();
    }, 30000); // Increased from 15s to 30s

    // Separate interval for mode history (less frequent to avoid rate limiting)
    const modeHistoryInterval = setInterval(() => {
      refetchModeHistory();
    }, 20000);

    return () => {
      clearInterval(interval);
      clearInterval(chainDataInterval);
      clearInterval(modeHistoryInterval);
    };
  }, [
    isConnected,
    refetchMode,
    refetchVaultBalance,
    refetchAll,
    refetchPrice,
    refetchBalance,
    refetchModeHistory,
    refetchRiskProfile,
    refetchChainData,
    refetchBestChain,
  ]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-medium text-gray-900">Procti</h1>
          <ConnectWalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {!isConnected ? (
          <div className="text-center py-32">
            <h2 className="text-3xl font-medium text-gray-900 mb-3">
              Welcome to Procti
            </h2>
            <p className="text-gray-600 mb-8">
              Connect your wallet to get started
            </p>
            <ConnectWalletButton />
          </div>
        ) : (
          <div className="space-y-12">
            <VaultDashboard />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ActionsPanel />
              <RiskProfile />
            </div>
            <ModeHistory />
            
            {/* Cross-Chain Arbitrage Section */}
            <div className="border-t border-gray-200 pt-12">
              <h2 className="text-2xl font-medium text-gray-900 mb-6">Cross-Chain Arbitrage</h2>
              <div className="space-y-6">
                <MultiChainDashboard />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ArbitrageDetector />
                  <CrossChainOpportunityChecker />
                </div>
                <AutoChainDataUpdater />
                <ChainDataManager />
              </div>
            </div>

            {/* Enhanced Cross-Chain Features Section */}
            <div className="border-t border-gray-200 pt-12">
              <h2 className="text-2xl font-medium text-gray-900 mb-6">Enhanced Cross-Chain Features</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ActiveChainDisplay />
                  <SmartCrossChainChecker />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <SimulatedBridge />
                  <CrossChainMoveVisualizer />
                </div>
                <CrossChainDecisionLog />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
