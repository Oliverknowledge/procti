"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import TrancheAdvisor from "@/components/ai/TrancheAdvisor";
import { Tranche } from "@/lib/procti/addresses";
import Link from "next/link";

/**
 * @page AI Advisor Page
 * @description Standalone page for AI tranche advisor
 * @notice New route - does NOT modify existing pages
 */
export default function AdvisorPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  const handleUseRecommendation = (tranche: Tranche) => {
    // Navigate to root page with the recommended tranche as URL param
    router.push(`/?tranche=${tranche}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">AI Tranche Advisor</h1>
              <p className="text-sm text-gray-600 mt-1">Get personalized tranche recommendations</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
            >
              ← Back to Vault
            </Link>
          </div>
          <ConnectWalletButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <TrancheAdvisor onUseRecommendation={handleUseRecommendation} />
      </main>
    </div>
  );
}

