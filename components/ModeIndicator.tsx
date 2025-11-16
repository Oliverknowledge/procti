"use client";

import { useVault } from "@/hooks/useVault";

/**
 * @component ModeIndicator
 * @description Displays the current vault mode (Farming, Stable, etc.)
 */
export default function ModeIndicator() {
  const { modeString, modeColor } = useVault();

  const getModeColor = () => {
    if (modeColor === "green") return "text-green-600";
    if (modeColor === "yellow") return "text-yellow-600";
    if (modeColor === "red") return "text-red-600";
    return "text-gray-600";
  };

  const getModeBorder = () => {
    if (modeColor === "green") return "border-l-green-600";
    if (modeColor === "yellow") return "border-l-yellow-600";
    if (modeColor === "red") return "border-l-red-600";
    return "border-l-gray-600";
  };

  return (
    <div className={`bg-white border-l-4 ${getModeBorder()} rounded-lg p-6 shadow-sm`}>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Mode</div>
      <div className={`text-4xl font-medium ${getModeColor()}`}>
        {modeString}
      </div>
    </div>
  );
}

