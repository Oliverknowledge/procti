"use client";

import { useEffect, useState } from "react";
import { useEvents, LossAppliedEvent } from "@/hooks/useEvents";
// Simple time formatter (no external dependency)
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
 * @component LiveEpochFeed
 * @description Live feed of epoch updates with real-time notifications
 */
export default function LiveEpochFeed() {
  const { events } = useEvents();
  const [recentEpochs, setRecentEpochs] = useState<any[]>([]);
  const [recentLosses, setRecentLosses] = useState<LossAppliedEvent[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const [showLosses, setShowLosses] = useState(true);

  useEffect(() => {
    const epochEvents = events
      .filter((e) => e.type === "EpochUpdated")
      .slice(-5) // Last 5 epochs
      .reverse(); // Most recent first

    setRecentEpochs(epochEvents);

    const lossEvents = events
      .filter((e) => e.type === "LossApplied")
      .slice(-3) // Last 3 losses
      .reverse() as LossAppliedEvent[];

    setRecentLosses(lossEvents);
  }, [events]);

  if (recentEpochs.length === 0 && recentLosses.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">📡 Live Epoch Feed</h3>
        <p className="text-xs text-gray-500">No epoch updates yet. Run an epoch update to see live changes!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">📡 Live Epoch Feed</h3>
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showNotifications ? "Hide" : "Show"}
        </button>
      </div>

      {showNotifications && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {/* Loss Events */}
          {recentLosses.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-red-700">💧 Loss Events</h4>
                <button
                  onClick={() => setShowLosses(!showLosses)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {showLosses ? "Hide" : "Show"}
                </button>
              </div>
              {showLosses && recentLosses.map((loss, idx) => {
                const timestamp = loss.timestamp * 1000;
                return (
                  <div
                    key={loss.blockNumber}
                    className="border-l-4 border-red-500 bg-red-50 rounded p-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700">
                        {formatTimeAgo(timestamp)}
                      </span>
                      <span className="text-xs font-bold text-red-700">
                        -${parseFloat(loss.amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Junior:</span>
                        <span className="text-red-600">
                          -${parseFloat(loss.juniorLoss).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Mezz:</span>
                        <span className="text-yellow-600">
                          -${parseFloat(loss.mezzLoss).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Senior:</span>
                        <span className="text-green-600">
                          -${parseFloat(loss.seniorLoss).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {recentEpochs.length > 0 && <div className="pt-2 border-t border-gray-200"></div>}
            </>
          )}

          {/* Epoch Events */}
          {recentEpochs.map((epoch, idx) => {
            const delta = parseFloat(epoch.delta || "0");
            const seniorDelta = parseFloat(epoch.seniorDelta || "0");
            const mezzDelta = parseFloat(epoch.mezzDelta || "0");
            const juniorDelta = parseFloat(epoch.juniorDelta || "0");
            const timestamp = epoch.timestamp * 1000; // Convert to milliseconds

            return (
              <div
                key={idx}
                className={`border-l-4 rounded p-2 ${
                  delta >= 0
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {formatTimeAgo(timestamp)}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      delta >= 0 ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(2)} Δ
                  </span>
                </div>
                <div className="text-xs text-gray-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Senior:</span>
                    <span className={seniorDelta >= 0 ? "text-green-600" : "text-red-600"}>
                      {seniorDelta >= 0 ? "+" : ""}
                      {seniorDelta.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mezz:</span>
                    <span className={mezzDelta >= 0 ? "text-green-600" : "text-red-600"}>
                      {mezzDelta >= 0 ? "+" : ""}
                      {mezzDelta.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Junior:</span>
                    <span className={juniorDelta >= 0 ? "text-green-600" : "text-red-600"}>
                      {juniorDelta >= 0 ? "+" : ""}
                      {juniorDelta.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

