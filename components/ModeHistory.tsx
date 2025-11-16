"use client";

import { useModeHistory } from "@/hooks/useModeHistory";

export default function ModeHistory() {
  const { history, isLoading, error } = useModeHistory();

  const getModeColor = (mode: string) => {
    if (mode === "0") return "text-green-600";
    if (mode === "1") return "text-yellow-600";
    if (mode === "2") return "text-red-600";
    return "text-gray-600";
  };

  const getModeBgColor = (mode: string) => {
    if (mode === "0") return "bg-green-50 border-green-200";
    if (mode === "1") return "bg-yellow-50 border-yellow-200";
    if (mode === "2") return "bg-red-50 border-red-200";
    return "bg-gray-50 border-gray-200";
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Mode History</h3>
        <div className="text-sm text-gray-500">Loading history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Mode History</h3>
        <div className="text-sm text-red-500">Error loading history: {error.message}</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-sm p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Mode History</h3>
        <div className="text-sm text-gray-500">No mode changes recorded yet.</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Mode History</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((event, index) => (
          <div
            key={`${event.blockNumber}-${index}`}
            className={`border-l-4 rounded-sm p-3 ${getModeBgColor(event.mode)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${getModeColor(event.mode)}`}>
                  {event.modeName}
                </span>
                <span className="text-xs text-gray-500">
                  {event.timestamp.toLocaleString()}
                </span>
              </div>
              <span className="text-xs text-gray-600">${parseFloat(event.price).toFixed(4)}</span>
            </div>
            <div className="text-xs text-gray-600">{event.reason}</div>
            <div className="text-xs text-gray-400 mt-1">
              Block: {event.blockNumber.toString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


