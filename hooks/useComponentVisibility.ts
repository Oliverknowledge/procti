"use client";

import { useState, useCallback } from "react";

export type ComponentType = 
  | "MULTI_CHAIN_DASHBOARD"
  | "ARBITRAGE_DETECTOR"
  | "ACTIVE_CHAIN_DISPLAY"
  | "EPOCH_PANEL"
  | "LOSS_WATERFALL"
  | "EPOCH_IMPACT"
  | "LIVE_EPOCH_FEED"
  | "HISTORY_TABLE"
  | "DEPOSIT_PANEL"
  | "WITHDRAW_PANEL"
  | "TRANCHE_CARDS"
  | "VAULT_OVERVIEW"
  | "POOLS_OVERVIEW"
  | "CURRENT_CHAIN_INFO"
  | "MODE_INDICATOR"
  | "ORACLE_PRICE"
  | "VAULT_BALANCE_BY_CHAIN"
  | "TOTAL_USDC_BY_CHAIN"
  | "RISK_PROFILE"
  | "SENTINEL_VAULT_DEPOSIT"
  | "VAULT_COMPARISON"
  | "SIMULATED_BRIDGE";

export interface ComponentVisibility {
  [key: string]: boolean;
}

/**
 * @hook useComponentVisibility
 * @description Manages component visibility state, allowing AI to show/hide components
 */
export const useComponentVisibility = () => {
  const [visibleComponents, setVisibleComponents] = useState<ComponentVisibility>({
    MULTI_CHAIN_DASHBOARD: false, // Hidden by default - customize your experience!
    ARBITRAGE_DETECTOR: false, // Hidden by default - customize your experience!
    ACTIVE_CHAIN_DISPLAY: false, // Hidden by default - customize your experience!
    EPOCH_PANEL: false, // Hidden by default - customize your experience!
    LOSS_WATERFALL: false, // Hidden by default - customize your experience!
    EPOCH_IMPACT: false, // Hidden by default - customize your experience!
    LIVE_EPOCH_FEED: false, // Hidden by default - customize your experience!
    HISTORY_TABLE: false, // Hidden by default - customize your experience!
    DEPOSIT_PANEL: false, // Hidden by default - customize your experience!
    WITHDRAW_PANEL: false, // Hidden by default - customize your experience!
    TRANCHE_CARDS: false, // Hidden by default - customize your experience!
    VAULT_OVERVIEW: false, // Hidden by default - customize your experience!
    POOLS_OVERVIEW: false, // Hidden by default - customize your experience!
    CURRENT_CHAIN_INFO: false, // Hidden by default - customize your experience!
    MODE_INDICATOR: false, // Hidden by default - customize your experience!
    ORACLE_PRICE: false, // Hidden by default - customize your experience!
    VAULT_BALANCE_BY_CHAIN: false, // Hidden by default - customize your experience!
    TOTAL_USDC_BY_CHAIN: false, // Hidden by default - customize your experience!
    RISK_PROFILE: false, // Hidden by default - customize your experience!
    SENTINEL_VAULT_DEPOSIT: false, // Hidden by default - customize your experience!
    VAULT_COMPARISON: false, // Hidden by default - customize your experience!
    SIMULATED_BRIDGE: false, // Hidden by default - customize your experience!
  });

  const showComponent = useCallback((component: ComponentType) => {
    setVisibleComponents((prev) => ({
      ...prev,
      [component]: true,
    }));
  }, []);

  const hideComponent = useCallback((component: ComponentType) => {
    setVisibleComponents((prev) => ({
      ...prev,
      [component]: false,
    }));
  }, []);

  const toggleComponent = useCallback((component: ComponentType) => {
    setVisibleComponents((prev) => ({
      ...prev,
      [component]: !prev[component],
    }));
  }, []);

  const isVisible = useCallback(
    (component: ComponentType) => {
      return visibleComponents[component] ?? false;
    },
    [visibleComponents]
  );

  const showAll = useCallback(() => {
    setVisibleComponents((prev) => {
      const all: ComponentVisibility = {};
      Object.keys(prev).forEach((key) => {
        all[key] = true;
      });
      return all;
    });
  }, []);

  const hideAll = useCallback(() => {
    setVisibleComponents((prev) => {
      const all: ComponentVisibility = {};
      Object.keys(prev).forEach((key) => {
        all[key] = false;
      });
      return all;
    });
  }, []);

  return {
    visibleComponents,
    showComponent,
    hideComponent,
    toggleComponent,
    isVisible,
    showAll,
    hideAll,
  };
};

