"use client";

import { useState, useEffect } from "react";
import { useVault } from "@/hooks/useVault";
import { useUSDC } from "@/hooks/useUSDC";
import { useAccount, useChainId } from "wagmi";
import { useChainBalances } from "@/hooks/useChainBalances";
import { useCCTP } from "@/hooks/useCCTP";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";

export default function SimulatedBridge() {
  const { activeChain, supportedChains, refetchActiveChain } = useCrossChainArb();
  const { withdraw, refetchVaultBalance } = useVault();
  const { balance: usdcBalance, refetchBalance } = useUSDC();
  const { address } = useAccount();
  const chainId = useChainId();
  const { chainBalances } = useChainBalances();
  const { 
    bridgeUSDC,
    isCCTPAvailable, 
    isBridging: isCCTPBridging,
    transferStatus: cctpStatus 
  } = useCCTP();
  const [fromChain, setFromChain] = useState("");
  const [toChain, setToChain] = useState("");
  const [amount, setAmount] = useState("");
  const [bridgeFee, setBridgeFee] = useState("0.1");
  const [step, setStep] = useState<"input" | "withdrawing" | "bridging" | "complete">("input");

  useEffect(() => {
    refetchActiveChain();
    // Set default fromChain to activeChain
    if (activeChain && !fromChain) {
      setFromChain(activeChain);
    }
  }, [refetchActiveChain, activeChain]);

  // Get available balance for selected fromChain
  const fromChainBalance = chainBalances.find((cb) => cb.chain === fromChain)?.balance || 0;

  const handleBridge = async () => {
    if (!fromChain || !toChain || !amount) {
      alert("Please select both source and destination chains and enter an amount");
      return;
    }

    if (fromChain === toChain) {
      alert("Source and destination chains must be different");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // Check if we have enough balance on the source chain
    if (amountNum > fromChainBalance) {
      alert(
        `Insufficient balance on ${fromChain}!\n\n` +
        `Available: ${fromChainBalance.toFixed(6)} USDC\n` +
        `Requested: ${amountNum.toFixed(6)} USDC`
      );
      return;
    }

    try {
      // Step 1: Withdraw from vault (actual fund movement)
      setStep("withdrawing");
      await withdraw(amount);
      
      // Wait for withdrawal to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await refetchVaultBalance();
      await refetchBalance();

      // Step 2: Calculate bridge fee
      const feePercent = parseFloat(bridgeFee);
      const feeAmount = (amountNum * feePercent) / 100;
      const amountAfterFee = amountNum - feeAmount;

      // Step 3: Bridge using CCTP
      setStep("bridging");
      
      // Check if CCTP is available for both chains
      if (!isCCTPAvailable(fromChain)) {
        throw new Error(
          `CCTP is not available on ${fromChain}.\n\n` +
          `Supported chains:\n` +
          `Mainnet: Ethereum, Base, Arbitrum, Optimism, Avalanche, Polygon\n` +
          `Testnet: Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Arc Testnet`
        );
      }
      
      if (!isCCTPAvailable(toChain)) {
        throw new Error(
          `CCTP is not available on ${toChain}.\n\n` +
          `Supported chains:\n` +
          `Mainnet: Ethereum, Base, Arbitrum, Optimism, Avalanche, Polygon\n` +
          `Testnet: Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Arc Testnet`
        );
      }

      // Use contract's bridgeUSDC function for cross-chain transfer
      await bridgeUSDC(
        toChain,
        amountAfterFee.toString(),
        address
      );
      
      // Wait for final confirmation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      alert(
        `CCTP transfer completed!\n\n` +
        `Amount: ${amountAfterFee.toFixed(6)} USDC\n` +
        `From: ${fromChain}\n` +
        `To: ${toChain}\n\n` +
        `Your USDC has been transferred using Circle's CCTP.`
      );
      
      // Step 4: Complete
      setStep("complete");
      setTimeout(() => {
        refetchActiveChain();
        refetchVaultBalance();
        refetchBalance();
        setAmount("");
        setFromChain(toChain); // Update fromChain to the new chain
        setStep("input");
      }, 2000);
    } catch (error: any) {
      console.error("Error bridging:", error);
      setStep("input");
      const errorMessage = error.message || "Unknown error";
      // Show a more user-friendly alert with line breaks
      alert(errorMessage.replace(/\n/g, "\n"));
    }
  };

  // Only show CCTP-supported chains (mainnet + testnets)
  const cctpSupportedChains = [
    "Ethereum", 
    "Base", 
    "Arbitrum", 
    "Optimism", 
    "Avalanche", 
    "Polygon",
    // Testnets
    "Ethereum Sepolia",
    "Base Sepolia",
    "Arbitrum Sepolia",
    "Optimism Sepolia",
    "Arc", // Arc Testnet - CCTP supported per https://docs.arc.network/arc/references/contract-addresses
  ];
  const availableChains = cctpSupportedChains.filter((chain) => isCCTPAvailable(chain));
  const availableToChains = availableChains.filter((chain) => chain !== fromChain);
  const amountNum = parseFloat(amount) || 0;
  const feePercent = parseFloat(bridgeFee) || 0;
  const feeAmount = (amountNum * feePercent) / 100;
  const amountAfterFee = amountNum - feeAmount;

  // Get chains with balances for the fromChain selector
  const chainsWithBalances = chainBalances.filter((cb) => cb.balance > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Cross-Chain Bridge</h2>
      <p className="text-xs text-gray-500 mb-4">
        Bridge funds from one chain to another using Circle's CCTP. Select the source chain (where funds are currently) and destination chain.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Chain:
          </label>
          <select
            value={fromChain}
            onChange={(e) => setFromChain(e.target.value)}
            disabled={isCCTPBridging || step !== "input"}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Select source chain...</option>
            {chainsWithBalances.length > 0 ? (
              chainsWithBalances
                .filter((cb) => isCCTPAvailable(cb.chain))
                .map((cb) => (
                  <option key={cb.chain} value={cb.chain}>
                    {cb.chain} ({cb.balance.toFixed(2)} USDC)
                  </option>
                ))
            ) : (
              availableChains.map((chain) => (
                <option key={chain} value={chain}>
                  {chain}
                </option>
              ))
            )}
          </select>
          {fromChain && fromChainBalance > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Available on {fromChain}: {fromChainBalance.toFixed(6)} USDC
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Chain:
          </label>
          <select
            value={toChain}
            onChange={(e) => setToChain(e.target.value)}
            disabled={isCCTPBridging || step !== "input" || !fromChain}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Select destination chain...</option>
            {availableToChains.map((chain) => (
              <option key={chain} value={chain}>
                {chain}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (USDC):
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="100"
            disabled={isCCTPBridging || step !== "input"}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bridge Fee (%):
          </label>
          <input
            type="number"
            value={bridgeFee}
            onChange={(e) => setBridgeFee(e.target.value)}
            placeholder="0.1"
            step="0.01"
            min="0"
            disabled={isCCTPBridging || step !== "input"}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>

        {amountNum > 0 && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm">
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="text-gray-900 font-medium">{amountNum.toFixed(6)} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bridge Fee ({feePercent}%):</span>
                <span className="text-gray-900 font-medium">-{feeAmount.toFixed(6)} USDC</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-300">
                <span className="text-gray-900 font-medium">You'll receive:</span>
                <span className="text-gray-900 font-medium">{amountAfterFee.toFixed(6)} USDC</span>
              </div>
            </div>
          </div>
        )}

        {/* CCTP Info */}
        {fromChain && toChain && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm">
            {isCCTPAvailable(fromChain) && isCCTPAvailable(toChain) ? (
              <>
                <p className="text-xs text-blue-900 font-medium mb-1">
                  ✓ Using Circle's CCTP (Cross-Chain Transfer Protocol)
                </p>
                <p className="text-xs text-blue-700">
                  Your USDC will be transferred using Circle's native bridge. This may take 2-5 minutes for attestation.
                </p>
              </>
            ) : (
              <div className="text-xs text-orange-800">
                <p className="font-medium mb-1">⚠️ CCTP Not Available</p>
                  <p className="mb-2">
                  {!isCCTPAvailable(fromChain) && `CCTP is not available on ${fromChain}. `}
                  {!isCCTPAvailable(toChain) && `CCTP is not available on ${toChain}. `}
                  CCTP works on mainnet chains (Ethereum, Base, Arbitrum, Optimism, Avalanche, Polygon) and testnets (Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, Optimism Sepolia, Arc Testnet).
                </p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-orange-900 font-medium mb-1">How to test CCTP</summary>
                  <div className="mt-2 text-xs text-orange-700 space-y-1 pl-2">
                    <p><strong>Option 1: Get testnet USDC on mainnet testnets</strong></p>
                    <p>• Visit Circle's testnet faucet: <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="underline">faucet.circle.com</a></p>
                    <p>• Request testnet USDC on Sepolia, Base Sepolia, or Arbitrum Sepolia</p>
                    <p>• Switch your wallet to one of these testnets</p>
                    <p>• Note: CCTP may not be available on all testnets</p>
                    <p className="mt-2"><strong>Option 2: Use mainnet (requires real USDC)</strong></p>
                    <p>• Get USDC on Ethereum, Base, Arbitrum, Optimism, Avalanche, or Polygon mainnet</p>
                    <p>• Connect wallet to a mainnet chain</p>
                    <p>• Bridge will work with real USDC</p>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Step 1: Withdraw {amountNum > 0 ? amountNum.toFixed(6) : "X"} USDC from vault</p>
          <p>• Step 2: Burn USDC on {fromChain || "source"} using CCTP</p>
          <p>• Step 3: Wait for Circle attestation (2-5 minutes)</p>
          <p>• Step 4: Switch to {toChain || "destination"} network</p>
          <p>• Step 5: Mint USDC on {toChain || "destination"} (fee: {feeAmount.toFixed(6)} USDC)</p>
          {fromChain !== activeChain && fromChain && (
            <p className="text-orange-600 font-medium">
              ⚠ Note: Active chain is {activeChain}, but bridging from {fromChain}. 
              The bridge will proceed from your current wallet network.
            </p>
          )}
        </div>

        <button
          onClick={handleBridge}
          disabled={
            isCCTPBridging || 
            !fromChain || 
            !toChain || 
            !amount || 
            step !== "input" ||
            !isCCTPAvailable(fromChain) ||
            !isCCTPAvailable(toChain)
          }
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
        >
          {step === "withdrawing" && "Withdrawing from vault..."}
          {step === "bridging" && (cctpStatus || "Bridging with CCTP...")}
          {step === "complete" && "Complete!"}
          {step === "input" && (
            isCCTPBridging 
              ? "Processing..." 
              : `Bridge ${amountNum > 0 ? amountNum.toFixed(2) : ""} USDC from ${fromChain || "source"} to ${toChain || "destination"}`
          )}
        </button>
      </div>
    </div>
  );
}

