"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import VaultOverview from "@/components/tranches/VaultOverview";
import TrancheCard from "@/components/tranches/TrancheCard";
import DepositPanel from "@/components/tranches/DepositPanel";
import WithdrawPanel from "@/components/tranches/WithdrawPanel";
import EpochPanel from "@/components/tranches/EpochPanel";
import HistoryTable from "@/components/tranches/HistoryTable";
import ValueExplanation from "@/components/tranches/ValueExplanation";
import { Tranche } from "@/lib/procti/addresses";

/**
 * @page Tranches Dashboard
 * @description Main dashboard for TrancheVault system
 * @notice New route - does NOT modify existing home page
 */
export default function TranchesPage() {
  const { isConnected } = useAccount();
  const searchParams = useSearchParams();
  const depositPanelRef = useRef<{ setTranche?: (tranche: Tranche) => void }>(null);

  // Handle tranche pre-fill from URL params (e.g., from AI advisor)
  useEffect(() => {
    const trancheParam = searchParams.get("tranche");
    if (trancheParam && depositPanelRef.current?.setTranche) {
      const trancheValue = parseInt(trancheParam);
      if ([Tranche.Senior, Tranche.Mezz, Tranche.Junior].includes(trancheValue)) {
        depositPanelRef.current.setTranche(trancheValue as Tranche);
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Procti Tranche Vault</h1>
              <p className="text-sm text-gray-600 mt-1">Structured USDC Vault with Risk Layers</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              ← Back to Home
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/advisor"
              className="px-4 py-2 bg-purple-50 text-[#8B5CF6] rounded-lg font-medium hover:bg-purple-100 transition-colors text-sm border border-purple-200"
            >
              🤖 AI Advisor
            </Link>
            <ConnectWalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {!isConnected ? (
          <div className="text-center py-32">
            <h2 className="text-3xl font-medium text-gray-900 mb-3">
              Welcome to Procti Tranche Vault
            </h2>
            <p className="text-gray-600 mb-8">
              Connect your wallet to interact with the tranche system
            </p>
            <ConnectWalletButton />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Vault Overview */}
            <VaultOverview />

            {/* Tranche Cards */}
            <div>
              <h2 className="text-2xl font-medium text-gray-900 mb-6">Tranches</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <TrancheCard tranche={Tranche.Senior} />
                <TrancheCard tranche={Tranche.Mezz} />
                <TrancheCard tranche={Tranche.Junior} />
              </div>
            </div>

            {/* Value Explanation */}
            <ValueExplanation />

            {/* Deposit & Withdraw Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DepositPanel ref={depositPanelRef} />
              <WithdrawPanel />
            </div>

            {/* Epoch Management (Admin Only) */}
            <div>
              <h2 className="text-2xl font-medium text-gray-900 mb-6">Epoch Management</h2>
              <EpochPanel />
            </div>

            {/* Event History */}
            <div>
              <h2 className="text-2xl font-medium text-gray-900 mb-6">Event History</h2>
              <HistoryTable />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

