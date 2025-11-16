"use client";

import { useEffect, useState } from "react";
import { useEvents, LossAppliedEvent } from "@/hooks/useEvents";
import { useTrancheData } from "@/hooks/useTrancheData";

const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * @component LossWaterfallVisualizer
 * @description Real-time visualization of loss waterfall events
 */
export default function LossWaterfallVisualizer() {
  const { events } = useEvents();
  const { trancheValues } = useTrancheData();
  const [lossEvents, setLossEvents] = useState<LossAppliedEvent[]>([]);
  const [latestLoss, setLatestLoss] = useState<LossAppliedEvent | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const lossEventsList = events.filter((e) => e.type === "LossApplied") as LossAppliedEvent[];
    setLossEvents(lossEventsList.slice(-5).reverse()); // Last 5, most recent first
    
    // Detect new loss event
    if (lossEventsList.length > 0) {
      const newest = lossEventsList[lossEventsList.length - 1];
      if (newest.blockNumber !== latestLoss?.blockNumber) {
        setLatestLoss(newest);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 3000);
      }
    }
  }, [events, latestLoss]);

  if (lossEvents.length === 0 && !latestLoss) {
    return (
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">💧 Loss Waterfall</h3>
        <p className="text-sm text-gray-600">
          No loss events yet. Loss waterfall triggers when security score &lt; 3000 (30%).
        </p>
      </div>
    );
  }

  const renderWaterfallStep = (
    trancheName: string,
    trancheValue: string,
    lossAmount: string,
    color: string,
    borderColor: string,
    isFirst: boolean = false
  ) => {
    const loss = parseFloat(lossAmount);
    const value = parseFloat(trancheValue);
    const lossPercent = value > 0 ? (loss / value) * 100 : 0;
    const remaining = Math.max(0, value - loss);

    return (
      <div
        className={`${color} border-2 ${borderColor} rounded-lg p-4 transition-all duration-500 ${
          isAnimating && loss > 0 ? "scale-105 shadow-lg" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${borderColor.replace("border-", "bg-")}`}></div>
            <span className="font-semibold text-gray-900">{trancheName} Tranche</span>
          </div>
          {loss > 0 && (
            <span className="text-sm font-bold text-red-600 animate-pulse">
              -${loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Before:</span>
            <span className="font-medium">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {loss > 0 && (
            <>
              <div className="flex justify-between text-xs">
                <span className="text-red-600">Loss:</span>
                <span className="font-medium text-red-600">
                  -${loss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({lossPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">After:</span>
                <span className="font-medium">${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </>
          )}
          {loss === 0 && (
            <div className="text-xs text-gray-500 italic">No loss (protected by previous tranches)</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border-2 border-red-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">💧 Loss Waterfall</h3>
          <p className="text-sm text-gray-600 mt-1">
            Real-time visualization of loss distribution (Junior → Mezz → Senior)
          </p>
        </div>
        {isAnimating && (
          <div className="flex items-center gap-2 text-red-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
            <span className="text-sm font-medium">Loss Applied!</span>
          </div>
        )}
      </div>

      {/* Latest Loss Event */}
      {latestLoss && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-red-900">Latest Loss Event</span>
              <span className="text-xs text-gray-600 ml-2">
                {formatTimeAgo(latestLoss.timestamp * 1000)}
              </span>
            </div>
            <span className="text-lg font-bold text-red-700">
              Total Loss: ${parseFloat(latestLoss.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Waterfall Visualization */}
          <div className="space-y-3">
            {/* Junior - First Loss */}
            {renderWaterfallStep(
              "Junior",
              trancheValues.junior,
              latestLoss.juniorLoss,
              "bg-red-50",
              "border-red-400",
              true
            )}

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="text-red-600 text-2xl">↓</div>
            </div>

            {/* Mezz - Second Loss */}
            {renderWaterfallStep(
              "Mezzanine",
              trancheValues.mezz,
              latestLoss.mezzLoss,
              "bg-yellow-50",
              "border-yellow-400"
            )}

            {/* Arrow */}
            <div className="flex justify-center">
              <div className="text-red-600 text-2xl">↓</div>
            </div>

            {/* Senior - Last Loss */}
            {renderWaterfallStep(
              "Senior",
              trancheValues.senior,
              latestLoss.seniorLoss,
              "bg-green-50",
              "border-green-400"
            )}
          </div>
        </div>
      )}

      {/* Loss History */}
      {lossEvents.length > 1 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Loss History</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {lossEvents.slice(1).map((event, idx) => (
              <div
                key={event.blockNumber}
                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">
                    {formatTimeAgo(event.timestamp * 1000)}
                  </span>
                  <span className="text-xs font-bold text-red-600">
                    ${parseFloat(event.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600">Junior:</span>
                    <span className="ml-1 font-medium text-red-600">
                      -${parseFloat(event.juniorLoss).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Mezz:</span>
                    <span className="ml-1 font-medium text-yellow-600">
                      -${parseFloat(event.mezzLoss).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Senior:</span>
                    <span className="ml-1 font-medium text-green-600">
                      -${parseFloat(event.seniorLoss).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

