"use client";

import { useTrancheData } from "@/hooks/useTrancheData";
import { Tranche, TRANCHES } from "@/lib/procti/addresses";
import { useState } from "react";

/**
 * @component ValueExplanation
 * @description Visual explanation of how share price changes affect your value
 * @notice Shows why "nothing changes" in vault but YOUR value changes
 */
export default function ValueExplanation() {
  const { userPositions } = useTrancheData();
  const [selectedTranche, setSelectedTranche] = useState<Tranche>(Tranche.Junior);
  const position = userPositions[selectedTranche];
  const trancheInfo = TRANCHES[selectedTranche];

  // Calculate example
  const shares = parseFloat(position.shares);
  const sharePrice = parseFloat(position.sharePrice);
  const currentValue = parseFloat(position.value);

  // Example: What if share price increased by 5%?
  const exampleNewPrice = sharePrice * 1.05;
  const exampleNewValue = shares * exampleNewPrice;
  const exampleGain = exampleNewValue - currentValue;
  const exampleGainPercent = sharePrice > 0 ? ((exampleNewPrice - sharePrice) / sharePrice) * 100 : 0;

  // Example: What if share price decreased by 3%?
  const exampleLossPrice = sharePrice * 0.97;
  const exampleLossValue = shares * exampleLossPrice;
  const exampleLoss = exampleLossValue - currentValue;
  const exampleLossPercent = sharePrice > 0 ? ((sharePrice - exampleLossPrice) / sharePrice) * 100 : 0;

  if (shares === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 How Share Price Affects Your Value</h2>
        <p className="text-gray-600">
          Deposit into a tranche to see how share price changes affect your withdrawal value!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">💡 How Share Price Affects Your Value</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Tranche:</label>
        <select
          value={selectedTranche}
          onChange={(e) => setSelectedTranche(parseInt(e.target.value) as Tranche)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {TRANCHES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} - {t.description}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {/* Current State */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">📊 Your Current Position</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Your Shares:</span>
              <span className="font-medium">{shares.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Share Price:</span>
              <span className="font-medium">${sharePrice.toFixed(4)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="text-gray-600 font-medium">Your Current Value:</span>
              <span className="font-bold text-lg text-blue-600">
                {currentValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USDC
              </span>
            </div>
            <div className="text-xs text-gray-500 pt-1">
              💰 If you withdraw now, you get: <strong>{currentValue.toFixed(2)} USDC</strong>
            </div>
          </div>
        </div>

        {/* Key Insight */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">🔑 Key Insight</h4>
          <p className="text-sm text-blue-800 mb-2">
            The <strong>total USDC in the vault</strong> doesn't change when epochs update.
          </p>
          <p className="text-sm text-blue-800">
            But <strong>YOUR share price</strong> changes, which means <strong>YOUR withdrawal value</strong> changes!
          </p>
        </div>

        {/* Example Scenarios */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">📈 Example: What Happens When Share Price Changes?</h3>

          {/* Positive Scenario */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3">
              ✅ Scenario 1: Share Price Increases by 5%
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">New Share Price:</span>
                <span className="font-medium text-green-700">
                  ${exampleNewPrice.toFixed(4)} <span className="text-xs">(+{exampleGainPercent.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Your Shares:</span>
                <span className="font-medium">{shares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-green-300">
                <span className="text-gray-700 font-medium">Your New Value:</span>
                <span className="font-bold text-green-700">
                  {exampleNewValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDC
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-600 text-xs">Gain:</span>
                <span className="font-semibold text-green-700 text-xs">
                  +{exampleGain.toFixed(2)} USDC ({exampleGainPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="text-xs text-green-700 pt-2 bg-green-100 rounded p-2">
                💰 <strong>If you withdraw now:</strong> You get{" "}
                <strong>{exampleNewValue.toFixed(2)} USDC</strong> instead of{" "}
                <strong>{currentValue.toFixed(2)} USDC</strong> - that's{" "}
                <strong>+{exampleGain.toFixed(2)} USDC more!</strong>
              </div>
            </div>
          </div>

          {/* Negative Scenario */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-3">
              ❌ Scenario 2: Share Price Decreases by 3%
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">New Share Price:</span>
                <span className="font-medium text-red-700">
                  ${exampleLossPrice.toFixed(4)} <span className="text-xs">(-{exampleLossPercent.toFixed(1)}%)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Your Shares:</span>
                <span className="font-medium">{shares.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-red-300">
                <span className="text-gray-700 font-medium">Your New Value:</span>
                <span className="font-bold text-red-700">
                  {exampleLossValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  USDC
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-600 text-xs">Loss:</span>
                <span className="font-semibold text-red-700 text-xs">
                  {exampleLoss.toFixed(2)} USDC (-{exampleLossPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="text-xs text-red-700 pt-2 bg-red-100 rounded p-2">
                💰 <strong>If you withdraw now:</strong> You get{" "}
                <strong>{exampleLossValue.toFixed(2)} USDC</strong> instead of{" "}
                <strong>{currentValue.toFixed(2)} USDC</strong> - that's{" "}
                <strong>{exampleLoss.toFixed(2)} USDC less.</strong>
              </div>
            </div>
          </div>
        </div>

        {/* The Math */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">🧮 The Formula</h4>
          <div className="text-sm text-gray-700 space-y-1 font-mono">
            <div>Your Value = Your Shares × Share Price</div>
            <div className="pt-2">
              Share Price = Virtual Value ÷ Total Shares
            </div>
            <div className="pt-2 text-xs text-gray-600">
              When epoch updates: Virtual Value changes → Share Price changes → Your Value changes
            </div>
          </div>
        </div>

        {/* Important Note */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Your shares <strong>never change</strong> (unless you deposit/withdraw)</li>
            <li>• Share price <strong>changes with each epoch</strong> (based on delta)</li>
            <li>• Your value = shares × price, so it <strong>changes automatically</strong></li>
            <li>• Total vault USDC <strong>stays the same</strong> (only accounting changes)</li>
            <li>• When you withdraw, you get <strong>real USDC</strong> based on current share price</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

