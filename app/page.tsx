"use client";

import { useEffect, useRef, Suspense } from "react";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import PortfolioBalance from "@/components/PortfolioBalance";
import ConversationalAgent from "@/components/ai/ConversationalAgent";
import VaultOverview from "@/components/tranches/VaultOverview";
import TrancheCard from "@/components/tranches/TrancheCard";
import DepositPanel from "@/components/tranches/DepositPanel";
import WithdrawPanel from "@/components/tranches/WithdrawPanel";
import EpochPanel from "@/components/tranches/EpochPanel";
import HistoryTable from "@/components/tranches/HistoryTable";
import EpochImpactVisualizer from "@/components/tranches/EpochImpactVisualizer";
import LiveEpochFeed from "@/components/tranches/LiveEpochFeed";
import LossWaterfallVisualizer from "@/components/tranches/LossWaterfallVisualizer";
import MultiChainDashboard from "@/components/MultiChainDashboard";
import ActiveChainDisplay from "@/components/ActiveChainDisplay";
import ArbitrageDetector from "@/components/ArbitrageDetector";
import PoolsOverview from "@/components/PoolsOverview";
import CurrentChainInfo from "@/components/CurrentChainInfo";
import ModeIndicator from "@/components/ModeIndicator";
import OraclePrice from "@/components/OraclePrice";
import VaultBalanceByChain from "@/components/VaultBalanceByChain";
import ChainBalanceBreakdown from "@/components/ChainBalanceBreakdown";
import RiskProfile from "@/components/RiskProfile";
import SentinelVaultDeposit from "@/components/SentinelVaultDeposit";
import VaultComparison from "@/components/VaultComparison";
import SimulatedBridge from "@/components/SimulatedBridge";
import { Tranche } from "@/lib/procti/addresses";
import { useTrancheData } from "@/hooks/useTrancheData";
import { useUSDC } from "@/hooks/useUSDC";
import { useComponentVisibility, type ComponentType } from "@/hooks/useComponentVisibility";
import { useAutoRebalance } from "@/hooks/useAutoRebalance";

// Component that handles search params - needs to be wrapped in Suspense
function SearchParamsHandler({ 
  depositPanelRef 
}: { 
  depositPanelRef: React.RefObject<{ setTranche: (tranche: Tranche) => void } | null> 
}) {
  const searchParams = useSearchParams();

  // Handle tranche pre-fill from URL params (e.g., from AI advisor)
  useEffect(() => {
    const trancheParam = searchParams.get("tranche");
    if (trancheParam && depositPanelRef.current?.setTranche) {
      const trancheValue = parseInt(trancheParam);
      if ([Tranche.Senior, Tranche.Mezz, Tranche.Junior].includes(trancheValue)) {
        depositPanelRef.current.setTranche(trancheValue as Tranche);
      }
    }
  }, [searchParams, depositPanelRef]);

  return null;
}

export default function Home() {
  const { isConnected } = useAccount();
  const depositPanelRef = useRef<{ setTranche: (tranche: Tranche) => void } | null>(null);
  const { refetchAll } = useTrancheData();
  const { refetchBalance } = useUSDC();
  const { visibleComponents, showComponent, hideComponent, isVisible } = useComponentVisibility();
  
  // Automatically rebalance when oracle price changes or crosses thresholds
  // This ensures funds move between yield pool and safe pool based on price
  useAutoRebalance();

  // Auto-refresh data periodically
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      refetchAll();
      refetchBalance();
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [isConnected, refetchAll, refetchBalance]);

  return (
    <div className="min-h-screen bg-white">
      <Suspense fallback={null}>
        <SearchParamsHandler depositPanelRef={depositPanelRef} />
      </Suspense>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Procti</h1>
              <p className="text-sm text-gray-600 mt-1">AI-Powered Structured Vault Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected && <PortfolioBalance />}
            <ConnectWalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {!isConnected ? (
          <div className="text-center py-32">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to Procti
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Your AI-powered DeFi structured vault platform. Interact with the blockchain through natural language.
              </p>
              <ConnectWalletButton />
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="text-3xl mb-3">🤖</div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI Assistant</h3>
                  <p className="text-sm text-gray-600">
                    Chat with AI to deposit, withdraw, check balances, and manage your portfolio
                  </p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Structured Vault</h3>
                  <p className="text-sm text-gray-600">
                    Three risk layers: Senior (safe), Mezzanine (balanced), Junior (high risk/reward)
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="text-3xl mb-3">🌐</div>
                  <h3 className="font-semibold text-gray-900 mb-2">Multi-Chain</h3>
                  <p className="text-sm text-gray-600">
                    Simulated multi-chain exposure without bridge risks
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* AI Assistant - Primary Interface */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 shadow-lg">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI Assistant</h2>
                <p className="text-sm text-gray-600">
                  Customize your experience! Ask me to show features you need. Try: &quot;show my tranche positions&quot;, &quot;add deposit panel&quot;, &quot;show pools overview&quot;, &quot;display current chain info&quot;, or &quot;show vault overview&quot;
                </p>
              </div>
              <ConversationalAgent 
                onComponentAction={(action, component) => {
                  if (action === "show") {
                    showComponent(component as ComponentType);
                  } else {
                    hideComponent(component as ComponentType);
                  }
                }}
              />
            </div>

            {/* All components are hidden by default - shown only when AI adds them */}
            
            {/* Vault Overview */}
            {isVisible("VAULT_OVERVIEW") && <VaultOverview />}

            {/* Visualizations */}
            {(isVisible("EPOCH_IMPACT") || isVisible("LOSS_WATERFALL")) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {isVisible("EPOCH_IMPACT") && <EpochImpactVisualizer />}
                {isVisible("LOSS_WATERFALL") && <LossWaterfallVisualizer />}
              </div>
            )}

            {/* Tranche Cards */}
            {isVisible("TRANCHE_CARDS") && (
              <div>
                <h2 className="text-2xl font-medium text-gray-900 mb-6">Your Tranche Positions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <TrancheCard tranche={Tranche.Senior} />
                  <TrancheCard tranche={Tranche.Mezz} />
                  <TrancheCard tranche={Tranche.Junior} />
                </div>
              </div>
            )}

            {/* Deposit & Withdraw Panels */}
            {(isVisible("DEPOSIT_PANEL") || isVisible("WITHDRAW_PANEL")) && (
              <div>
                <h2 className="text-2xl font-medium text-gray-900 mb-6">Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {isVisible("DEPOSIT_PANEL") && <DepositPanel ref={depositPanelRef} />}
                  {isVisible("WITHDRAW_PANEL") && <WithdrawPanel />}
                </div>
              </div>
            )}

            {/* Epoch Management (Admin Only) */}
            {(isVisible("EPOCH_PANEL") || isVisible("LIVE_EPOCH_FEED")) && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-medium text-gray-900 mb-6">Epoch Management</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {isVisible("EPOCH_PANEL") && (
                      <div className="lg:col-span-2">
                        <EpochPanel />
                      </div>
                    )}
                    {isVisible("LIVE_EPOCH_FEED") && (
                      <div>
                        <LiveEpochFeed />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Cross-Chain Features */}
            {(isVisible("MULTI_CHAIN_DASHBOARD") || isVisible("ACTIVE_CHAIN_DISPLAY") || isVisible("ARBITRAGE_DETECTOR")) && (
              <div className="border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-medium text-gray-900 mb-6">Cross-Chain Analytics</h2>
                <div className="space-y-6">
                  {isVisible("MULTI_CHAIN_DASHBOARD") && <MultiChainDashboard />}
                  {(isVisible("ACTIVE_CHAIN_DISPLAY") || isVisible("ARBITRAGE_DETECTOR")) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {isVisible("ACTIVE_CHAIN_DISPLAY") && <ActiveChainDisplay />}
                      {isVisible("ARBITRAGE_DETECTOR") && <ArbitrageDetector />}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pools Overview */}
            {isVisible("POOLS_OVERVIEW") && <PoolsOverview />}

            {/* Current Chain Information */}
            {isVisible("CURRENT_CHAIN_INFO") && <CurrentChainInfo />}

            {/* Mode Indicator */}
            {isVisible("MODE_INDICATOR") && <ModeIndicator />}

            {/* Oracle Price */}
            {isVisible("ORACLE_PRICE") && <OraclePrice />}

            {/* Vault Balance by Chain */}
            {isVisible("VAULT_BALANCE_BY_CHAIN") && <VaultBalanceByChain />}

            {/* Total USDC by Chain */}
            {isVisible("TOTAL_USDC_BY_CHAIN") && (
              <div>
                <h2 className="text-2xl font-medium text-gray-900 mb-6">Total USDC by Chain</h2>
                <ChainBalanceBreakdown />
              </div>
            )}

            {/* Risk Profile */}
            {isVisible("RISK_PROFILE") && (
              <div>
                <h2 className="text-2xl font-medium text-gray-900 mb-6">Risk Profile</h2>
                <RiskProfile />
              </div>
            )}

            {/* Sentinel Vault Deposit */}
            {isVisible("SENTINEL_VAULT_DEPOSIT") && (
              <div>
                <h2 className="text-2xl font-medium text-gray-900 mb-6">Sentinel Vault Deposit</h2>
                <SentinelVaultDeposit />
              </div>
            )}

            {/* Vault Comparison */}
            {isVisible("VAULT_COMPARISON") && (
              <div>
                <VaultComparison />
              </div>
            )}

            {/* Simulated Bridge */}
            {isVisible("SIMULATED_BRIDGE") && (
              <div>
                <SimulatedBridge />
              </div>
            )}

            {/* Event History */}
            {isVisible("HISTORY_TABLE") && (
              <div>
                <h2 className="text-2xl font-medium text-gray-900 mb-6">Event History</h2>
                <HistoryTable />
              </div>
            )}

            {/* Empty State - Show when no components are visible */}
            {Object.values(visibleComponents).every(v => !v) && (
              <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Customize Your Experience</h3>
                  <p className="text-gray-600 mb-6">
                    Start by asking the AI to add features you need. For example:
                  </p>
                  <div className="space-y-2 text-left bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-700">💬 &quot;Show my tranche positions&quot;</div>
                    <div className="text-sm text-gray-700">💬 &quot;Show pools overview&quot;</div>
                    <div className="text-sm text-gray-700">💬 &quot;Display oracle price&quot;</div>
                    <div className="text-sm text-gray-700">💬 &quot;Show current mode&quot;</div>
                    <div className="text-sm text-gray-700">💬 &quot;Display vault balance by chain&quot;</div>
                    <div className="text-sm text-gray-700">💬 &quot;Show total USDC by chain&quot;</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
