"use client";

import { useTrancheData } from "@/hooks/useTrancheData";
import { TRANCHES } from "@/lib/procti/addresses";

/**
 * @component VaultOverview
 * @description Overview of vault metrics and tranche values
 * @notice Self-contained component - does NOT modify existing dashboard
 */
export default function VaultOverview() {
  const { trancheValues, totalValue, reservePool, totalRealUSDC } = useTrancheData();

  const total = parseFloat(totalValue);
  const senior = parseFloat(trancheValues.senior);
  const mezz = parseFloat(trancheValues.mezz);
  const junior = parseFloat(trancheValues.junior);

  const seniorPercent = total > 0 ? (senior / total) * 100 : 0;
  const mezzPercent = total > 0 ? (mezz / total) * 100 : 0;
  const juniorPercent = total > 0 ? (junior / total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Vault Overview</h2>

      <div className="space-y-6">
        {/* Total Value */}
        <div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-bold text-gray-900">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-gray-600">Total Virtual Value</span>
          </div>
          <p className="text-xs text-gray-500">
            Virtual value tracks multi-chain exposure. Real USDC stays on Arc.
          </p>
        </div>

        {/* Reserve Pool & Real USDC */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-xs text-purple-600 mb-1">Reserve Pool</div>
            <div className="text-lg font-semibold text-purple-900">
              ${parseFloat(reservePool).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-purple-700 mt-1">
              From fees & time-based yield
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-xs text-green-600 mb-1">Total Real USDC</div>
            <div className="text-lg font-semibold text-green-900">
              ${parseFloat(totalRealUSDC).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-green-700 mt-1">
              Contract balance + reserve
            </p>
          </div>
        </div>

        {/* Tranche Breakdown */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Tranche Distribution</h3>

          {/* Senior */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Senior</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  ${senior.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({seniorPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${seniorPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Mezz */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-sm font-medium text-gray-700">Mezzanine</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  ${mezz.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({mezzPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all"
                style={{ width: `${mezzPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Junior */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium text-gray-700">Junior</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  ${junior.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  ({juniorPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all"
                style={{ width: `${juniorPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-purple-900 mb-2">How It Works</h4>
          <ul className="text-xs text-purple-800 space-y-1">
            <li>• Senior: Low risk, low yield (5% of delta)</li>
            <li>• Mezzanine: Medium risk/yield (10% of delta)</li>
            <li>• Junior: High risk, first-loss (20% of delta)</li>
            <li>• Losses hit Junior first, then Mezz, then Senior</li>
          </ul>
        </div>

        {/* Fee Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">💰 Fee System</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Deposit Fee: 0.5% (goes to reserve pool)</li>
            <li>• Withdrawal Fee: 0.5% (goes to reserve pool)</li>
            <li>• Time-Based Yield: 5% APY accrues to reserve</li>
            <li>• Reserve Pool: Backs virtual gains and enables full withdrawals</li>
          </ul>
        </div>

        {/* Important Disclaimer */}
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-900 mb-2">⚠️ How It Works Now</h4>
          <p className="text-xs text-yellow-800">
            <strong>Fees and time-based yield generate real USDC</strong> that backs virtual gains. 
            The reserve pool grows from fees (0.5% on deposits/withdrawals) and time-based yield (5% APY). 
            This allows the system to pay out more than initial deposits when the reserve pool is sufficient.
          </p>
        </div>
      </div>
    </div>
  );
}

