"use client";

import { useEvents } from "@/hooks/useEvents";
import { TRANCHES } from "@/lib/procti/addresses";
import { VaultEvent } from "@/hooks/useEvents";

/**
 * @component HistoryTable
 * @description Table displaying vault events history
 * @notice Uses useEvents hook for isolated event tracking
 */
export default function HistoryTable() {
  const { events, userEvents, isLoading } = useEvents();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTranche = (tranche: number) => {
    return TRANCHES[tranche]?.name || `Tranche ${tranche}`;
  };

  const renderEvent = (event: VaultEvent, index: number) => {
    switch (event.type) {
      case "Deposit":
        return (
          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm">{formatDate(event.timestamp)}</td>
            <td className="px-4 py-3">
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Deposit
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatTranche(event.tranche)}</td>
            <td className="px-4 py-3 text-sm font-medium">
              {parseFloat(event.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USDC
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{event.shares} shares</td>
            <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
              {event.user.slice(0, 6)}...{event.user.slice(-4)}
            </td>
          </tr>
        );

      case "Withdraw":
        return (
          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm">{formatDate(event.timestamp)}</td>
            <td className="px-4 py-3">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Withdraw
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{formatTranche(event.tranche)}</td>
            <td className="px-4 py-3 text-sm font-medium">
              {parseFloat(event.amount).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              USDC
            </td>
            <td className="px-4 py-3 text-sm text-gray-600">{event.shares} shares</td>
            <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
              {event.user.slice(0, 6)}...{event.user.slice(-4)}
            </td>
          </tr>
        );

      case "EpochUpdated":
        return (
          <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="px-4 py-3 text-sm">{formatDate(event.timestamp)}</td>
            <td className="px-4 py-3">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                Epoch Update
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 col-span-2">
              <div className="space-y-1">
                <div className="flex gap-4 text-xs">
                  <span>Yield: {event.yieldScore / 100}%</span>
                  <span>Security: {event.securityScore / 100}%</span>
                  <span>Liquidity: {event.liquidityScore / 100}%</span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className={parseFloat(event.delta) >= 0 ? "text-green-600" : "text-red-600"}>
                    Delta: {parseFloat(event.delta) >= 0 ? "+" : ""}
                    {parseFloat(event.delta).toFixed(2)}
                  </span>
                </div>
              </div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 col-span-2">
              <div className="space-y-1 text-xs">
                <div>
                  Senior:{" "}
                  <span className={parseFloat(event.seniorDelta) >= 0 ? "text-green-600" : "text-red-600"}>
                    {parseFloat(event.seniorDelta) >= 0 ? "+" : ""}
                    {parseFloat(event.seniorDelta).toFixed(2)}
                  </span>
                </div>
                <div>
                  Mezz:{" "}
                  <span className={parseFloat(event.mezzDelta) >= 0 ? "text-green-600" : "text-red-600"}>
                    {parseFloat(event.mezzDelta) >= 0 ? "+" : ""}
                    {parseFloat(event.mezzDelta).toFixed(2)}
                  </span>
                </div>
                <div>
                  Junior:{" "}
                  <span className={parseFloat(event.juniorDelta) >= 0 ? "text-green-600" : "text-red-600"}>
                    {parseFloat(event.juniorDelta) >= 0 ? "+" : ""}
                    {parseFloat(event.juniorDelta).toFixed(2)}
                  </span>
                </div>
              </div>
            </td>
          </tr>
        );

      case "LossApplied":
        return (
          <tr key={index} className="border-b border-gray-200 hover:bg-red-50">
            <td className="px-4 py-3 text-sm">{formatDate(event.timestamp)}</td>
            <td className="px-4 py-3">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Loss Applied
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 col-span-2">
              Total Loss:{" "}
              <span className="font-semibold text-red-600">
                {parseFloat(event.amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USDC
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-600 col-span-2">
              <div className="space-y-1 text-xs">
                <div>
                  Junior: <span className="text-red-600">{parseFloat(event.juniorLoss).toFixed(2)} USDC</span>
                </div>
                <div>
                  Mezz: <span className="text-red-600">{parseFloat(event.mezzLoss).toFixed(2)} USDC</span>
                </div>
                <div>
                  Senior: <span className="text-red-600">{parseFloat(event.seniorLoss).toFixed(2)} USDC</span>
                </div>
              </div>
            </td>
          </tr>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Event History</h2>
        <div className="text-center py-8">
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Event History</h2>
        <span className="text-sm text-gray-600">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No events found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tranche
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event, index) => renderEvent(event, index))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

