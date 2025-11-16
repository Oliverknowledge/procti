"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useTrancheData } from "@/hooks/useTrancheData";
import { useEvents, LossAppliedEvent } from "@/hooks/useEvents";
import { Tranche } from "@/lib/procti/addresses";

interface EpochSnapshot {
  timestamp: number;
  seniorValue: string;
  mezzValue: string;
  juniorValue: string;
  totalValue: string;
  seniorSharePrice: string;
  mezzSharePrice: string;
  juniorSharePrice: string;
  userSeniorValue: string;
  userMezzValue: string;
  userJuniorValue: string;
  delta?: number;
  seniorDelta?: number;
  mezzDelta?: number;
  juniorDelta?: number;
}

/**
 * @component EpochImpactVisualizer
 * @description Real-time visualization of epoch updates and their impact
 */
export default function EpochImpactVisualizer() {
  const { trancheValues, totalValue, userPositions } = useTrancheData();
  const { events } = useEvents();
  const [beforeSnapshot, setBeforeSnapshot] = useState<EpochSnapshot | null>(null);
  const [currentSnapshot, setCurrentSnapshot] = useState<EpochSnapshot | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastEpochEvent, setLastEpochEvent] = useState<any>(null);
  const [latestLoss, setLatestLoss] = useState<LossAppliedEvent | null>(null);
  const initializedRef = useRef(false);

  // Extract user position values in a stable way
  const userPositionValues = useMemo(() => {
    const seniorPos = userPositions[Tranche.Senior] || { sharePrice: "0", value: "0" };
    const mezzPos = userPositions[Tranche.Mezz] || { sharePrice: "0", value: "0" };
    const juniorPos = userPositions[Tranche.Junior] || { sharePrice: "0", value: "0" };
    
    return {
      seniorSharePrice: seniorPos.sharePrice,
      seniorValue: seniorPos.value,
      mezzSharePrice: mezzPos.sharePrice,
      mezzValue: mezzPos.value,
      juniorSharePrice: juniorPos.sharePrice,
      juniorValue: juniorPos.value,
    };
  }, [
    userPositions[Tranche.Senior]?.sharePrice,
    userPositions[Tranche.Senior]?.value,
    userPositions[Tranche.Mezz]?.sharePrice,
    userPositions[Tranche.Mezz]?.value,
    userPositions[Tranche.Junior]?.sharePrice,
    userPositions[Tranche.Junior]?.value,
  ]);

  // Initialize current snapshot once when we have data
  useEffect(() => {
    if (!initializedRef.current && trancheValues.senior && totalValue) {
      setCurrentSnapshot({
        timestamp: Date.now(),
        seniorValue: trancheValues.senior,
        mezzValue: trancheValues.mezz,
        juniorValue: trancheValues.junior,
        totalValue,
        seniorSharePrice: userPositionValues.seniorSharePrice,
        mezzSharePrice: userPositionValues.mezzSharePrice,
        juniorSharePrice: userPositionValues.juniorSharePrice,
        userSeniorValue: userPositionValues.seniorValue,
        userMezzValue: userPositionValues.mezzValue,
        userJuniorValue: userPositionValues.juniorValue,
      });
      initializedRef.current = true;
    }
  }, [
    trancheValues.senior, 
    trancheValues.mezz, 
    trancheValues.junior, 
    totalValue,
    userPositionValues.seniorSharePrice,
    userPositionValues.seniorValue,
    userPositionValues.mezzSharePrice,
    userPositionValues.mezzValue,
    userPositionValues.juniorSharePrice,
    userPositionValues.juniorValue,
  ]);

  // Capture snapshot before epoch update (only when new epoch event detected)
  useEffect(() => {
    const epochEvents = events.filter((e) => e.type === "EpochUpdated");
    if (epochEvents.length > 0 && currentSnapshot) {
      const latestEpoch = epochEvents[epochEvents.length - 1] as any;
      
      // Only update if this is a new epoch event
      if (latestEpoch.blockNumber !== lastEpochEvent?.blockNumber) {
        setLastEpochEvent(latestEpoch);
        
        // Set current snapshot as "before"
        setBeforeSnapshot({ ...currentSnapshot });
        
        // Start animation
        setIsAnimating(true);
        
        // Update current snapshot after a brief delay (to show animation)
        setTimeout(() => {
          setCurrentSnapshot({
            timestamp: Date.now(),
            seniorValue: trancheValues.senior,
            mezzValue: trancheValues.mezz,
            juniorValue: trancheValues.junior,
            totalValue,
            seniorSharePrice: userPositions[Tranche.Senior].sharePrice,
            mezzSharePrice: userPositions[Tranche.Mezz].sharePrice,
            juniorSharePrice: userPositions[Tranche.Junior].sharePrice,
            userSeniorValue: userPositions[Tranche.Senior].value,
            userMezzValue: userPositions[Tranche.Mezz].value,
            userJuniorValue: userPositions[Tranche.Junior].value,
            delta: typeof latestEpoch.delta === 'string' ? parseFloat(latestEpoch.delta) : latestEpoch.delta,
            seniorDelta: typeof latestEpoch.seniorDelta === 'string' ? parseFloat(latestEpoch.seniorDelta) : latestEpoch.seniorDelta,
            mezzDelta: typeof latestEpoch.mezzDelta === 'string' ? parseFloat(latestEpoch.mezzDelta) : latestEpoch.mezzDelta,
            juniorDelta: typeof latestEpoch.juniorDelta === 'string' ? parseFloat(latestEpoch.juniorDelta) : latestEpoch.juniorDelta,
          });
          
          setTimeout(() => setIsAnimating(false), 2000);
        }, 500);
      }
    }
  }, [events, lastEpochEvent]); // Only depend on events and lastEpochEvent

  // Track latest loss event
  useEffect(() => {
    const lossEvents = events.filter((e) => e.type === "LossApplied") as LossAppliedEvent[];
    if (lossEvents.length > 0) {
      const newest = lossEvents[lossEvents.length - 1];
      if (newest.blockNumber !== latestLoss?.blockNumber) {
        setLatestLoss(newest);
      }
    }
  }, [events, latestLoss]);

  // Update current snapshot when data changes (but not during animation or epoch update)
  useEffect(() => {
    if (currentSnapshot && !isAnimating && initializedRef.current) {
      // Only update if values actually changed
      const hasChanged = 
        currentSnapshot.seniorValue !== trancheValues.senior ||
        currentSnapshot.mezzValue !== trancheValues.mezz ||
        currentSnapshot.juniorValue !== trancheValues.junior ||
        currentSnapshot.totalValue !== totalValue ||
        currentSnapshot.seniorSharePrice !== userPositionValues.seniorSharePrice ||
        currentSnapshot.mezzSharePrice !== userPositionValues.mezzSharePrice ||
        currentSnapshot.juniorSharePrice !== userPositionValues.juniorSharePrice ||
        currentSnapshot.userSeniorValue !== userPositionValues.seniorValue ||
        currentSnapshot.userMezzValue !== userPositionValues.mezzValue ||
        currentSnapshot.userJuniorValue !== userPositionValues.juniorValue;
      
      if (hasChanged) {
        setCurrentSnapshot((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            seniorValue: trancheValues.senior,
            mezzValue: trancheValues.mezz,
            juniorValue: trancheValues.junior,
            totalValue,
            seniorSharePrice: userPositionValues.seniorSharePrice,
            mezzSharePrice: userPositionValues.mezzSharePrice,
            juniorSharePrice: userPositionValues.juniorSharePrice,
            userSeniorValue: userPositionValues.seniorValue,
            userMezzValue: userPositionValues.mezzValue,
            userJuniorValue: userPositionValues.juniorValue,
          };
        });
      }
    }
  }, [
    trancheValues.senior, 
    trancheValues.mezz, 
    trancheValues.junior, 
    totalValue,
    userPositionValues.seniorSharePrice,
    userPositionValues.seniorValue,
    userPositionValues.mezzSharePrice,
    userPositionValues.mezzValue,
    userPositionValues.juniorSharePrice,
    userPositionValues.juniorValue,
    isAnimating,
  ]);

  if (!currentSnapshot) return null;

  const calculateChange = (before: string, after: string): { value: number; percent: number } => {
    const beforeVal = parseFloat(before) || 0;
    const afterVal = parseFloat(after) || 0;
    const change = afterVal - beforeVal;
    const percent = beforeVal > 0 ? (change / beforeVal) * 100 : 0;
    return { value: change, percent };
  };

  const seniorChange = beforeSnapshot
    ? calculateChange(beforeSnapshot.seniorValue, currentSnapshot.seniorValue)
    : { value: 0, percent: 0 };
  const mezzChange = beforeSnapshot
    ? calculateChange(beforeSnapshot.mezzValue, currentSnapshot.mezzValue)
    : { value: 0, percent: 0 };
  const juniorChange = beforeSnapshot
    ? calculateChange(beforeSnapshot.juniorValue, currentSnapshot.juniorValue)
    : { value: 0, percent: 0 };
  const totalChange = beforeSnapshot
    ? calculateChange(beforeSnapshot.totalValue, currentSnapshot.totalValue)
    : { value: 0, percent: 0 };

  const userSeniorChange = beforeSnapshot
    ? calculateChange(beforeSnapshot.userSeniorValue, currentSnapshot.userSeniorValue)
    : { value: 0, percent: 0 };
  const userMezzChange = beforeSnapshot
    ? calculateChange(beforeSnapshot.userMezzValue, currentSnapshot.userMezzValue)
    : { value: 0, percent: 0 };
  const userJuniorChange = beforeSnapshot
    ? calculateChange(beforeSnapshot.userJuniorValue, currentSnapshot.userJuniorValue)
    : { value: 0, percent: 0 };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">📊 Epoch Impact Visualization</h3>
          <p className="text-sm text-gray-600 mt-1">Real-time changes from epoch updates</p>
        </div>
        {isAnimating && (
          <div className="flex items-center gap-2 text-purple-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            <span className="text-sm font-medium">Updating...</span>
          </div>
        )}
      </div>

      {/* Global Delta */}
      {currentSnapshot.delta !== undefined && (
        <div className="mb-6 p-4 bg-white rounded-lg border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Global Delta:</span>
            <span
              className={`text-2xl font-bold ${
                (currentSnapshot.delta || 0) >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {(currentSnapshot.delta || 0) >= 0 ? "+" : ""}
              {currentSnapshot.delta?.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Loss Waterfall Alert */}
      {latestLoss && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-red-600 text-xl">💧</span>
            <span className="text-sm font-semibold text-red-900">Loss Waterfall Applied</span>
          </div>
          <div className="text-xs text-red-800 space-y-1">
            <div className="flex justify-between">
              <span>Total Loss:</span>
              <span className="font-bold">
                ${parseFloat(latestLoss.amount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <div>
                <span className="text-gray-600">Junior:</span>
                <span className="ml-1 font-medium text-red-600">
                  -${parseFloat(latestLoss.juniorLoss).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Mezz:</span>
                <span className="ml-1 font-medium text-yellow-600">
                  -${parseFloat(latestLoss.mezzLoss).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Senior:</span>
                <span className="ml-1 font-medium text-green-600">
                  -${parseFloat(latestLoss.seniorLoss).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tranche Changes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Senior */}
        <div className="bg-white rounded-lg border-2 border-green-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="font-semibold text-gray-900">Senior</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-600">Tranche Value</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  ${parseFloat(currentSnapshot.seniorValue).toFixed(2)}
                </span>
                {beforeSnapshot && (
                  <span
                    className={`text-sm font-medium ${
                      seniorChange.value >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {seniorChange.value >= 0 ? "+" : ""}
                    ${seniorChange.value.toFixed(2)} ({seniorChange.percent >= 0 ? "+" : ""}
                    {seniorChange.percent.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Your Position</div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  ${parseFloat(currentSnapshot.userSeniorValue).toFixed(2)}
                </span>
                {beforeSnapshot && userSeniorChange.value !== 0 && (
                  <span
                    className={`text-xs font-medium ${
                      userSeniorChange.value >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {userSeniorChange.value >= 0 ? "+" : ""}
                    ${userSeniorChange.value.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {currentSnapshot.seniorDelta !== undefined && (
              <div className="text-xs text-gray-500">
                Delta: {currentSnapshot.seniorDelta >= 0 ? "+" : ""}
                {currentSnapshot.seniorDelta.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Mezzanine */}
        <div className="bg-white rounded-lg border-2 border-yellow-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="font-semibold text-gray-900">Mezzanine</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-600">Tranche Value</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  ${parseFloat(currentSnapshot.mezzValue).toFixed(2)}
                </span>
                {beforeSnapshot && (
                  <span
                    className={`text-sm font-medium ${
                      mezzChange.value >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {mezzChange.value >= 0 ? "+" : ""}
                    ${mezzChange.value.toFixed(2)} ({mezzChange.percent >= 0 ? "+" : ""}
                    {mezzChange.percent.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Your Position</div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  ${parseFloat(currentSnapshot.userMezzValue).toFixed(2)}
                </span>
                {beforeSnapshot && userMezzChange.value !== 0 && (
                  <span
                    className={`text-xs font-medium ${
                      userMezzChange.value >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {userMezzChange.value >= 0 ? "+" : ""}
                    ${userMezzChange.value.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {currentSnapshot.mezzDelta !== undefined && (
              <div className="text-xs text-gray-500">
                Delta: {currentSnapshot.mezzDelta >= 0 ? "+" : ""}
                {currentSnapshot.mezzDelta.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        {/* Junior */}
        <div className="bg-white rounded-lg border-2 border-red-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="font-semibold text-gray-900">Junior</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-xs text-gray-600">Tranche Value</div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  ${parseFloat(currentSnapshot.juniorValue).toFixed(2)}
                </span>
                {beforeSnapshot && (
                  <span
                    className={`text-sm font-medium ${
                      juniorChange.value >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {juniorChange.value >= 0 ? "+" : ""}
                    ${juniorChange.value.toFixed(2)} ({juniorChange.percent >= 0 ? "+" : ""}
                    {juniorChange.percent.toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600">Your Position</div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  ${parseFloat(currentSnapshot.userJuniorValue).toFixed(2)}
                </span>
                {beforeSnapshot && userJuniorChange.value !== 0 && (
                  <span
                    className={`text-xs font-medium ${
                      userJuniorChange.value >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {userJuniorChange.value >= 0 ? "+" : ""}
                    ${userJuniorChange.value.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {currentSnapshot.juniorDelta !== undefined && (
              <div className="text-xs text-gray-500">
                Delta: {currentSnapshot.juniorDelta >= 0 ? "+" : ""}
                {currentSnapshot.juniorDelta.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Share Price Changes */}
      {beforeSnapshot && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Share Price Changes</h4>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-gray-600">Senior</div>
              <div className="font-mono">
                ${parseFloat(beforeSnapshot.seniorSharePrice).toFixed(4)} →{" "}
                <span
                  className={
                    parseFloat(currentSnapshot.seniorSharePrice) >=
                    parseFloat(beforeSnapshot.seniorSharePrice)
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  ${parseFloat(currentSnapshot.seniorSharePrice).toFixed(4)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-gray-600">Mezzanine</div>
              <div className="font-mono">
                ${parseFloat(beforeSnapshot.mezzSharePrice).toFixed(4)} →{" "}
                <span
                  className={
                    parseFloat(currentSnapshot.mezzSharePrice) >=
                    parseFloat(beforeSnapshot.mezzSharePrice)
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  ${parseFloat(currentSnapshot.mezzSharePrice).toFixed(4)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-gray-600">Junior</div>
              <div className="font-mono">
                ${parseFloat(beforeSnapshot.juniorSharePrice).toFixed(4)} →{" "}
                <span
                  className={
                    parseFloat(currentSnapshot.juniorSharePrice) >=
                    parseFloat(beforeSnapshot.juniorSharePrice)
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  ${parseFloat(currentSnapshot.juniorSharePrice).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!beforeSnapshot && (
        <div className="text-center py-4 text-sm text-gray-500">
          Run an epoch update to see real-time impact visualization
        </div>
      )}
    </div>
  );
}

