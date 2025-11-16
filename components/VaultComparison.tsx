"use client";

/**
 * @component VaultComparison
 * @description Explains the difference between TrancheVault and SentinelVault
 */
export default function VaultComparison() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Two Vault Systems</h2>
      <p className="text-sm text-gray-600 mb-6">
        Procti offers two distinct vault systems, each serving different purposes:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tranche Vault */}
        <div className="border border-purple-200 rounded-lg p-5 bg-purple-50">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Tranche Vault</h3>
            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded-full font-medium">
              Structured Products
            </span>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-900 mb-1">How it works:</p>
              <p className="text-gray-700">
                Choose a risk layer (Senior/Mezzanine/Junior) and deposit USDC. You receive <strong>shares</strong> based on the current share price. Returns and losses are tracked using <strong>virtual values</strong>.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-gray-900 mb-1">Key Features:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Three risk layers (Senior, Mezzanine, Junior)</li>
                <li>Share-based accounting</li>
                <li>Virtual value tracking</li>
                <li>Epoch updates with scoring</li>
                <li>Loss waterfall protection</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium text-gray-900 mb-1">Best for:</p>
              <p className="text-gray-700">
                Users who want structured products with different risk/return profiles and share-based ownership.
              </p>
            </div>
          </div>
        </div>

        {/* Sentinel Vault */}
        <div className="border border-blue-200 rounded-lg p-5 bg-blue-50">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Sentinel Vault</h3>
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
              Pool-Based System
            </span>
          </div>
          
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-gray-900 mb-1">How it works:</p>
              <p className="text-gray-700">
                Deposit USDC and funds are automatically allocated to <strong>Safe Pool</strong> or <strong>Yield Pool</strong> based on oracle price and your risk profile. No tranche selection needed.
              </p>
            </div>
            
            <div>
              <p className="font-medium text-gray-900 mb-1">Key Features:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Automatic rebalancing</li>
                <li>Safe Pool (capital preservation)</li>
                <li>Yield Pool (higher returns)</li>
                <li>Oracle price-based switching</li>
                <li>Risk profile customization</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium text-gray-900 mb-1">Best for:</p>
              <p className="text-gray-700">
                Users who want automated risk management with simple deposit/withdraw, no tranche selection.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>💡 Key Difference:</strong> Tranche Vault uses <strong>shares and virtual values</strong> with manual tranche selection, while Sentinel Vault uses <strong>real USDC pools</strong> with automatic allocation. Both systems are independent and can be used separately.
          </p>
        </div>
      </div>
    </div>
  );
}

