"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount } from "wagmi";
import { useProctiContract } from "@/hooks/useProctiContract";
import { useTrancheData } from "@/hooks/useTrancheData";
import { useUSDC } from "@/hooks/useUSDC";
import {
  buildConversationPrompt,
  type UserMessage,
  type ConversationAction,
  type ConversationContext,
} from "@/lib/ai/conversationPrompt";
import { Tranche } from "@/lib/procti/addresses";
import { parseUnits } from "viem";
import { fetchChainData } from "@/lib/services/chainDataFetcher";
import type { ComponentType } from "@/hooks/useComponentVisibility";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";
import { useVault } from "@/hooks/useVault";
import { usePools } from "@/hooks/usePools";
import { useOracle } from "@/hooks/useOracle";
import { useModeChange, type ModeChangeEvent } from "@/hooks/useModeChange";
import { useBestChainMonitor, type BestChainChangeEvent } from "@/hooks/useBestChainMonitor";

/**
 * @hook useConversationalAgent
 * @description Conversational AI agent - users interact with blockchain through chat
 * @notice Primary interface for blockchain interactions
 */
export const useConversationalAgent = () => {
  const { address, isConnected } = useAccount();
  const { deposit, withdraw, updateEpoch, isPending, isOwner } = useProctiContract();
  const { trancheValues, totalValue, reservePool, userPositions, refetchAll } = useTrancheData();
  const { balance, refetchBalance } = useUSDC();
  const { activeChain, bestChain, switchToBestChain, supportedChains, refetchActiveChain, refetchBestChain, setChainPrice, setChainYield, setChainRisk, refetchChainData } = useCrossChainArb();
  const { userRiskProfile, riskProfileString, modeString, deposit: depositToSentinel } = useVault();
  const { refetchAll: refetchPools } = usePools();
  const { setPrice: setOraclePrice, refetchPrice: refetchOraclePrice } = useOracle();

  const lastModeRef = useRef<number | null>(null);
  const modeNames: Record<number, string> = {
    0: "Farming",
    1: "Defensive",
    2: "Emergency",
  };

  const [messages, setMessages] = useState<UserMessage[]>([
    {
      role: "assistant",
      content: `Hello! 👋 I'm your AI assistant for the Procti DeFi vault system. I can help you interact with the blockchain through natural language.

**What I can do:**
• 💰 Deposit/Withdraw USDC to tranches or SentinelVault
• 📊 Check balances, positions, and vault statistics
• 🎛️ Show/hide components to customize your dashboard
• ⚙️ Update chain metrics, oracle prices, and switch chains
• 📈 Manage epochs (if you're the owner)

**Try these commands:**
• "Show my tranche positions"
• "Deposit 100 USDC to senior"
• "What's my balance?"
• "Show the pools overview"
• "Show the bridge to send money to another chain"

**Need help?** Ask me "how do I use this?" or "what can you do?" for more guidance.

What would you like to do?`,
      timestamp: Date.now(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [componentActions, setComponentActions] = useState<Array<{ action: "show" | "hide"; component: ComponentType }>>([]);

  /**
   * Get current context
   */
  const getContext = useCallback((): ConversationContext => {
    return {
      userPositions: {
        senior: {
          shares: userPositions[Tranche.Senior].shares,
          value: userPositions[Tranche.Senior].value,
          sharePrice: userPositions[Tranche.Senior].sharePrice,
        },
        mezz: {
          shares: userPositions[Tranche.Mezz].shares,
          value: userPositions[Tranche.Mezz].value,
          sharePrice: userPositions[Tranche.Mezz].sharePrice,
        },
        junior: {
          shares: userPositions[Tranche.Junior].shares,
          value: userPositions[Tranche.Junior].value,
          sharePrice: userPositions[Tranche.Junior].sharePrice,
        },
      },
      vaultState: {
        totalValue,
        seniorValue: trancheValues.senior,
        mezzValue: trancheValues.mezz,
        juniorValue: trancheValues.junior,
        reservePool,
      },
      usdcBalance: balance,
      isOwner: Boolean(isOwner) || false,
      activeChain: activeChain || "",
      bestChain: bestChain || "",
      supportedChains: supportedChains || [],
      riskProfile: riskProfileString || "Unknown",
      riskProfileValue: userRiskProfile !== undefined ? Number(userRiskProfile) : null,
      currentMode: modeString || "Unknown",
      conversationHistory: messages,
    };
  }, [userPositions, trancheValues, totalValue, reservePool, balance, messages, isOwner, activeChain, bestChain, supportedChains, riskProfileString, userRiskProfile, modeString]);

  /**
   * Process user message and get AI response
   */
  const processMessage = useCallback(
    async (userMessage: string) => {
      if (!isConnected) {
        setError("Please connect your wallet first");
        return;
      }

      if (isProcessing) {
        return;
      }

      setIsProcessing(true);
      setError(null);

      // Add user message
      const userMsg: UserMessage = {
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (!apiKey) {
          throw new Error("OpenAI API key not configured");
        }

        const context = getContext();
        const prompt = buildConversationPrompt(userMessage, context);

        // Call OpenAI
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a helpful AI assistant for a DeFi vault. Users interact with the blockchain through you. 
                
Be conversational, friendly, and clear. When users ask to deposit/withdraw, execute those actions. 
When they ask questions, provide helpful information.

Return ONLY valid JSON (no markdown, no code blocks).`,
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
          throw new Error("No response from AI");
        }

        // Parse JSON response
        let parsed: ConversationAction;
        try {
          parsed = JSON.parse(content);
        } catch (parseError) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Failed to parse AI response");
          }
        }

        // Execute action if needed
        if (parsed.execute && parsed.action !== "CHECK" && parsed.action !== "INFO" && parsed.action !== "NONE") {
          try {
            // Handle component visibility actions separately
            if (parsed.action === "SHOW_COMPONENT" || parsed.action === "HIDE_COMPONENT") {
              if (parsed.component) {
                // Map component string to ComponentType
                const componentMap: Record<string, ComponentType> = {
                  "MULTI_CHAIN_DASHBOARD": "MULTI_CHAIN_DASHBOARD",
                  "ARBITRAGE_DETECTOR": "ARBITRAGE_DETECTOR",
                  "ACTIVE_CHAIN_DISPLAY": "ACTIVE_CHAIN_DISPLAY",
                  "EPOCH_PANEL": "EPOCH_PANEL",
                  "LOSS_WATERFALL": "LOSS_WATERFALL",
                  "EPOCH_IMPACT": "EPOCH_IMPACT",
                  "LIVE_EPOCH_FEED": "LIVE_EPOCH_FEED",
                  "HISTORY_TABLE": "HISTORY_TABLE",
                  "DEPOSIT_PANEL": "DEPOSIT_PANEL",
                  "WITHDRAW_PANEL": "WITHDRAW_PANEL",
                  "TRANCHE_CARDS": "TRANCHE_CARDS",
                  "VAULT_OVERVIEW": "VAULT_OVERVIEW",
                  "POOLS_OVERVIEW": "POOLS_OVERVIEW",
                  "CURRENT_CHAIN_INFO": "CURRENT_CHAIN_INFO",
                  "MODE_INDICATOR": "MODE_INDICATOR",
                  "ORACLE_PRICE": "ORACLE_PRICE",
                  "VAULT_BALANCE_BY_CHAIN": "VAULT_BALANCE_BY_CHAIN",
                  "TOTAL_USDC_BY_CHAIN": "TOTAL_USDC_BY_CHAIN",
                  "RISK_PROFILE": "RISK_PROFILE",
                  "SENTINEL_VAULT_DEPOSIT": "SENTINEL_VAULT_DEPOSIT",
                  "VAULT_COMPARISON": "VAULT_COMPARISON",
                };
                
                const mappedComponent = componentMap[parsed.component];
                if (mappedComponent) {
                  setComponentActions((prev) => [
                    ...prev,
                    {
                      action: parsed.action === "SHOW_COMPONENT" ? "show" : "hide",
                      component: mappedComponent,
                    },
                  ]);
                }
              }
            } else {
              await executeAction(parsed);
            }
          } catch (actionErr: any) {
            // If action fails, add error message to conversation
            const errorMsg: UserMessage = {
              role: "assistant",
              content: `I tried to execute that action, but encountered an error: ${actionErr.message || "Unknown error"}. Please try again or check your permissions.`,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMsg]);
            throw actionErr; // Re-throw to stop further processing
          }
        }

        // Add assistant response
        const assistantMsg: UserMessage = {
          role: "assistant",
          content: parsed.response,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Refetch data after action
        if (parsed.execute) {
          setTimeout(() => {
            refetchAll();
            refetchBalance();
          }, 3000);
        }
      } catch (err: any) {
        console.error("Conversation error:", err);
        setError(err.message || "Failed to process message");
        
        const errorMsg: UserMessage = {
          role: "assistant",
          content: `Sorry, I encountered an error: ${err.message || "Unknown error"}. Please try again.`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsProcessing(false);
      }
    },
    [isConnected, isProcessing, getContext, refetchAll, refetchBalance]
  );

  /**
   * Execute blockchain action
   */
  const executeAction = useCallback(
    async (action: ConversationAction) => {
      // Map AI response to tranche enum - handle various formats
      const getTrancheFromString = (trancheStr: string | undefined): Tranche | null => {
        if (!trancheStr) return null;
        
        const normalized = trancheStr.trim().toLowerCase();
        
        if (normalized.includes("senior")) {
          return Tranche.Senior;
        } else if (normalized.includes("mezz") || normalized.includes("mezzanine")) {
          return Tranche.Mezz;
        } else if (normalized.includes("junior")) {
          return Tranche.Junior;
        }
        
        return null;
      };

      if (action.action === "DEPOSIT" && action.amount) {
        const amount = parseFloat(action.amount);
        if (amount <= 0 || amount > parseFloat(balance)) {
          throw new Error(`Invalid deposit amount: ${action.amount}`);
        }

        // Check if user wants to deposit to SentinelVault or TrancheVault
        // If tranche is specified and it's a valid tranche (Senior/Mezz/Junior), use TrancheVault
        // Otherwise, check if it's SentinelVault or default to TrancheVault with Senior
        const tranche = action.tranche ? getTrancheFromString(action.tranche) : null;
        const isSentinelVault = 
          action.tranche && (
            action.tranche.toLowerCase().includes("sentinel") ||
            action.tranche.toLowerCase() === "vault" ||
            action.tranche.toLowerCase() === "pool"
          );

        if (isSentinelVault) {
          // Deposit to SentinelVault
          await depositToSentinel(action.amount);
          // Refetch pools after deposit
          setTimeout(() => {
            refetchPools();
          }, 2000);
        } else if (tranche !== null) {
          // Deposit to TrancheVault with specified tranche
          await deposit(action.amount, tranche);
        } else {
          // Default to Senior tranche if no tranche specified
          await deposit(action.amount, Tranche.Senior);
        }
      } else if (action.action === "WITHDRAW" && action.tranche) {
        const tranche = getTrancheFromString(action.tranche);
        if (tranche === null) {
          throw new Error(`Invalid tranche: ${action.tranche}. Expected Senior, Mezzanine, or Junior.`);
        }

        if (action.shares) {
          // Withdraw by shares
          const sharesBigInt = BigInt(action.shares);
          const availableShares = BigInt(userPositions[tranche].shares);
          
          if (sharesBigInt <= 0n || sharesBigInt > availableShares) {
            throw new Error(`Invalid shares: ${action.shares}`);
          }

          await withdraw(sharesBigInt, tranche);
        } else if (action.amount) {
          // Withdraw by USDC amount - need to calculate shares
          const amount = parseFloat(action.amount);
          const sharePrice = parseFloat(userPositions[tranche].sharePrice);
          const userValue = parseFloat(userPositions[tranche].value);
          
          if (amount > userValue) {
            throw new Error(`Insufficient value. You have $${userValue} in ${action.tranche}`);
          }

          // Calculate shares: shares = amount / sharePrice
          const shares = amount / sharePrice;
          const sharesWei = parseUnits(shares.toFixed(6), 6); // Shares use 6 decimals
          const availableShares = BigInt(userPositions[tranche].shares);
          
          if (sharesWei > availableShares) {
            // Use max available
            await withdraw(availableShares, tranche);
          } else {
            await withdraw(sharesWei, tranche);
          }
        } else {
          // Withdraw all
          const allShares = BigInt(userPositions[tranche].shares);
          if (allShares > 0n) {
            await withdraw(allShares, tranche);
          }
        }
      } else if (action.action === "UPDATE_EPOCH") {
        // Check if user is owner
        if (!isOwner) {
          throw new Error("Only the contract owner can update epochs. You are not the owner.");
        }

        let yieldScore: number;
        let securityScore: number;
        let liquidityScore: number;

        if (action.useRealData) {
          // Fetch real chain data
          try {
            const chainData = await fetchChainData();
            yieldScore = chainData.yieldScore;
            securityScore = chainData.securityScore;
            liquidityScore = chainData.liquidityScore;
          } catch (err: any) {
            throw new Error(`Failed to fetch real chain data: ${err.message || "Unknown error"}`);
          }
        } else {
          // Use provided scores or defaults
          yieldScore = action.yieldScore ?? 5000;
          securityScore = action.securityScore ?? 5000;
          liquidityScore = action.liquidityScore ?? 5000;
        }

        // Validate scores (0-10000)
        if (yieldScore < 0 || yieldScore > 10000) {
          throw new Error(`Invalid yield score: ${yieldScore}. Must be between 0 and 10000.`);
        }
        if (securityScore < 0 || securityScore > 10000) {
          throw new Error(`Invalid security score: ${securityScore}. Must be between 0 and 10000.`);
        }
        if (liquidityScore < 0 || liquidityScore > 10000) {
          throw new Error(`Invalid liquidity score: ${liquidityScore}. Must be between 0 and 10000.`);
        }

        await updateEpoch(yieldScore, securityScore, liquidityScore);
      } else if (action.action === "SWITCH_CHAIN") {
        // Determine target chain
        let targetChain: string;
        
        if (action.targetChain) {
          // Normalize chain name (case-insensitive)
          const normalizedTarget = action.targetChain.trim();
          const normalizedSupported = supportedChains.map(c => c.toLowerCase());
          const targetIndex = normalizedSupported.findIndex(c => 
            c === normalizedTarget.toLowerCase() || 
            c.includes(normalizedTarget.toLowerCase()) ||
            normalizedTarget.toLowerCase().includes(c)
          );
          
          if (targetIndex >= 0) {
            targetChain = supportedChains[targetIndex];
          } else if (normalizedTarget.toLowerCase() === "best" || normalizedTarget.toLowerCase() === "optimal") {
            targetChain = bestChain || "";
          } else {
            throw new Error(`Chain "${action.targetChain}" is not supported. Supported chains: ${supportedChains.join(", ")}`);
          }
        } else {
          // Default to best chain
          targetChain = bestChain || "";
        }
        
        if (!targetChain) {
          throw new Error("No target chain specified. Please specify a chain or use 'best' to switch to the best chain.");
        }
        
        if (targetChain === activeChain) {
          throw new Error(`You are already on ${targetChain}. No need to switch.`);
        }
        
        // Check if target chain is the best chain (switchToBestChain only switches to best)
        if (targetChain === bestChain) {
          await switchToBestChain();
        } else {
          throw new Error(`Cannot switch to ${targetChain}. The system can only switch to the best chain (${bestChain}). To switch to a specific chain, first make it the best chain by updating its metrics.`);
        }
      } else if (action.action === "UPDATE_CHAIN_METRICS") {
        if (!action.targetChain) {
          throw new Error("Please specify a chain to update (e.g., 'Optimism', 'Arbitrum', 'Base', 'Ethereum', 'Arc').");
        }
        
        // Normalize chain name (case-insensitive)
        const normalizedTarget = action.targetChain.trim();
        const normalizedSupported = supportedChains.map(c => c.toLowerCase());
        const targetIndex = normalizedSupported.findIndex(c => 
          c === normalizedTarget.toLowerCase() || 
          c.includes(normalizedTarget.toLowerCase()) ||
          normalizedTarget.toLowerCase().includes(c)
        );
        
        if (targetIndex < 0) {
          throw new Error(`Chain "${action.targetChain}" is not supported. Supported chains: ${supportedChains.join(", ")}`);
        }
        
        const targetChain = supportedChains[targetIndex];
        const updates: string[] = [];
        
        // Update price if provided
        if (action.chainPrice) {
          const price = parseFloat(action.chainPrice);
          if (isNaN(price) || price <= 0) {
            throw new Error(`Invalid price: ${action.chainPrice}. Price must be a positive number (e.g., "1.00", "1.01").`);
          }
          await setChainPrice(targetChain, action.chainPrice);
          updates.push(`price to $${action.chainPrice}`);
        }
        
        // Update yield if provided
        if (action.chainYield) {
          const yieldValue = parseFloat(action.chainYield);
          if (isNaN(yieldValue) || yieldValue < 0 || yieldValue > 100) {
            throw new Error(`Invalid yield: ${action.chainYield}. Yield must be between 0 and 100 (e.g., "5.5", "7.0").`);
          }
          await setChainYield(targetChain, action.chainYield);
          updates.push(`yield to ${action.chainYield}%`);
        }
        
        // Update risk if provided
        if (action.chainRisk !== undefined) {
          const risk = action.chainRisk;
          if (isNaN(risk) || risk < 0 || risk > 100) {
            throw new Error(`Invalid risk: ${risk}. Risk must be between 0 and 100 (lower is better).`);
          }
          await setChainRisk(targetChain, risk);
          updates.push(`risk to ${risk}`);
        }
        
        if (updates.length === 0) {
          throw new Error("Please specify at least one metric to update (price, yield, or risk).");
        }
        
        // Refetch chain data after update
        setTimeout(() => {
          refetchChainData();
        }, 2000);
      } else if (action.action === "UPDATE_ORACLE_PRICE") {
        if (!action.oraclePrice) {
          throw new Error("Please specify an oracle price (e.g., '1.00', '0.9987').");
        }
        
        const price = parseFloat(action.oraclePrice);
        if (isNaN(price) || price <= 0) {
          throw new Error(`Invalid oracle price: ${action.oraclePrice}. Price must be a positive number (e.g., "1.00", "0.9987").`);
        }
        
        await setOraclePrice(action.oraclePrice);
        
        // Refetch oracle price after update
        setTimeout(() => {
          refetchOraclePrice();
        }, 2000);
      } else if (action.action === "REBALANCE") {
        // Rebalancing would require more complex logic
        // For now, we'll handle it case by case based on user request
        console.log("Rebalancing:", action);
      }
    },
    [deposit, withdraw, updateEpoch, balance, userPositions, isOwner, switchToBestChain, activeChain, bestChain, supportedChains, setChainPrice, setChainYield, setChainRisk, refetchChainData, depositToSentinel, refetchPools, setOraclePrice, refetchOraclePrice]
  );

  // Listen for mode changes and notify user
  useModeChange((modeChangeEvent: ModeChangeEvent) => {
    const modeEmoji: Record<string, string> = {
      Farming: "🌾",
      Defensive: "🛡️",
      Emergency: "🚨",
    };

    const emoji = modeEmoji[modeChangeEvent.modeName] || "⚙️";
    
    const notificationMessage: UserMessage = {
      role: "assistant",
      content: `${emoji} **Mode Change Detected!**

The SentinelVault mode has changed to **${modeChangeEvent.modeName}**.

**Details:**
• Previous Mode: ${lastModeRef.current !== null ? modeNames[lastModeRef.current] || "Unknown" : "Unknown"}
• New Mode: ${modeChangeEvent.modeName}
• Oracle Price: $${parseFloat(modeChangeEvent.price).toFixed(4)}
• Reason: ${modeChangeEvent.reason}
• Time: ${new Date(modeChangeEvent.timestamp * 1000).toLocaleString()}

${modeChangeEvent.modeName === "Emergency" ? "⚠️ **Warning:** Funds are now held in the vault for safety. Pools are not being used." : modeChangeEvent.modeName === "Defensive" ? "🛡️ Funds have been moved to the Safe Pool for capital preservation." : "🌾 Funds are now in the Yield Pool for higher returns."}`,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, notificationMessage]);
    lastModeRef.current = modeChangeEvent.newMode;
  });

  // Listen for best chain changes and auto-switch
  useBestChainMonitor((chainChangeEvent: BestChainChangeEvent) => {
    const isNewBestChain = chainChangeEvent.previousBestChain !== chainChangeEvent.newBestChain;
    const isNotOnBestChain = chainChangeEvent.activeChain !== chainChangeEvent.newBestChain;

    let notificationContent = "";

    if (isNewBestChain && isNotOnBestChain) {
      notificationContent = `🔗 **Better Chain Detected!**

A better chain has been identified: **${chainChangeEvent.newBestChain}**

**Details:**
• Previous Best Chain: ${chainChangeEvent.previousBestChain}
• New Best Chain: ${chainChangeEvent.newBestChain}
• Current Active Chain: ${chainChangeEvent.activeChain}

🔄 **Auto-switching to ${chainChangeEvent.newBestChain}...**

This will optimize your returns by moving to the chain with the best yield, security, and liquidity scores.`;
    } else if (isNotOnBestChain) {
      notificationContent = `🔗 **Not on Best Chain**

You're currently on **${chainChangeEvent.activeChain}**, but the best chain is **${chainChangeEvent.newBestChain}**.

🔄 **Auto-switching to ${chainChangeEvent.newBestChain}...**

This will optimize your returns.`;
    } else if (isNewBestChain) {
      notificationContent = `🔗 **Best Chain Updated**

The best chain has changed to **${chainChangeEvent.newBestChain}**.

**Details:**
• Previous Best Chain: ${chainChangeEvent.previousBestChain}
• New Best Chain: ${chainChangeEvent.newBestChain}
• Current Active Chain: ${chainChangeEvent.activeChain}

✅ You're already on the best chain!`;
    }

    if (notificationContent) {
      const notificationMessage: UserMessage = {
        role: "assistant",
        content: notificationContent,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, notificationMessage]);
    }
  }, true as boolean); // Enable auto-switch

  const clearMessages = () => {
    setMessages([
      {
        role: "assistant",
        content: `Hello! 👋 I'm your AI assistant for the Procti DeFi vault system. I can help you interact with the blockchain through natural language.

**What I can do:**
• 💰 Deposit/Withdraw USDC to tranches or SentinelVault
• 📊 Check balances, positions, and vault statistics
• 🎛️ Show/hide components to customize your dashboard
• ⚙️ Update chain metrics, oracle prices, and switch chains
• 📈 Manage epochs (if you're the owner)

**Try these commands:**
• "Show my tranche positions"
• "Deposit 100 USDC to senior"
• "What's my balance?"
• "Show the pools overview"
• "Show the bridge to send money to another chain"

**Need help?** Ask me "how do I use this?" or "what can you do?" for more guidance.

What would you like to do?`,
        timestamp: Date.now(),
      },
    ]);
  };

  return {
    messages,
    processMessage,
    isProcessing,
    error,
    clearMessages,
    componentActions,
    clearComponentActions: () => setComponentActions([]),
  };
};

