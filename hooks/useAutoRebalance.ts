"use client";

import { useEffect, useRef } from "react";
import { useVault } from "./useVault";
import { useOracle } from "./useOracle";
import { useCrossChainArb } from "./useCrossChainArb";
import { usePublicClient } from "wagmi";
import { contractsConfig } from "@/config/contracts";
import { formatUnits } from "viem";

/**
 * Hook to automatically rebalance when oracle price changes or risk profile changes
 */
export const useAutoRebalance = () => {
  const { rebalance, rebalanceWithActiveChainPrice, vaultBalance, riskProfileString } = useVault();
  const { priceFormatted, refetchPrice } = useOracle();
  const { activeChain } = useCrossChainArb();
  const publicClient = usePublicClient();
  const lastPrice = useRef<string | null>(null);
  const lastRebalancedPrice = useRef<string | null>(null);
  const lastRiskProfile = useRef<string | null>(null);
  const isRebalancing = useRef(false);

  useEffect(() => {
    const autoRebalance = async () => {
      // Don't rebalance if already rebalancing or if no price
      if (!priceFormatted || priceFormatted === "0" || isRebalancing.current) {
        return;
      }

      // Don't rebalance if vault is empty
      const vaultBalanceNum = parseFloat(vaultBalance || "0");
      if (vaultBalanceNum <= 0) {
        return;
      }

      // Check if price changed
      const priceChanged = lastPrice.current !== null && lastPrice.current !== priceFormatted;
      
      // Check if risk profile changed
      const riskProfileChanged = 
        lastRiskProfile.current !== null && 
        lastRiskProfile.current !== riskProfileString;

      // Don't rebalance if nothing changed
      if (!priceChanged && !riskProfileChanged) {
        // Update tracking on first load
        if (lastPrice.current === null && priceFormatted) {
          lastPrice.current = priceFormatted;
          lastRiskProfile.current = riskProfileString || null;
        }
        return;
      }

      // Don't rebalance if we just rebalanced for this exact price and risk profile
      if (
        lastRebalancedPrice.current === priceFormatted &&
        lastRiskProfile.current === riskProfileString
      ) {
        // Update tracking but don't rebalance
        lastPrice.current = priceFormatted;
        lastRiskProfile.current = riskProfileString || null;
        return;
      }

      const priceNum = parseFloat(priceFormatted);
      if (isNaN(priceNum)) {
        return;
      }

      // Determine the reason for rebalancing
      let reason = "";
      if (priceChanged && riskProfileChanged) {
        reason = `price changed (${lastPrice.current} → ${priceFormatted}) and risk profile changed (${lastRiskProfile.current} → ${riskProfileString})`;
      } else if (priceChanged) {
        reason = `price changed (${lastPrice.current} → ${priceFormatted})`;
      } else if (riskProfileChanged) {
        reason = `risk profile changed (${lastRiskProfile.current} → ${riskProfileString})`;
      }

      try {
        isRebalancing.current = true;
        console.log(`Auto-rebalancing: ${reason}`);

        // Use active chain's price for rebalancing
        if (activeChain && publicClient) {
          await rebalanceWithActiveChainPrice(activeChain, publicClient);
        } else {
          // Fallback to regular rebalance
          await rebalance();
        }

        // Mark this price and risk profile as rebalanced
        lastRebalancedPrice.current = priceFormatted;
        console.log(`Auto-rebalance complete for price: ${priceFormatted}, risk profile: ${riskProfileString}`);
      } catch (err) {
        console.error("Error in auto-rebalance:", err);
        // Don't mark as rebalanced if there was an error, so it will retry
        lastRebalancedPrice.current = null;
      } finally {
        isRebalancing.current = false;
      }

      // Update tracking
      lastPrice.current = priceFormatted;
      lastRiskProfile.current = riskProfileString || null;
    };

    // Small delay to avoid rebalancing too frequently
    const timeoutId = setTimeout(() => {
      autoRebalance();
    }, 1000);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceFormatted, riskProfileString, activeChain, publicClient, vaultBalance]); // rebalance functions are stable

  return {
    isRebalancing: isRebalancing.current,
  };
};

