"use client";

import { useState, useEffect } from "react";
import { useVault } from "@/hooks/useVault";
import { useUSDC } from "@/hooks/useUSDC";
import { useAccount, useChainId } from "wagmi";
import { useChainBalances } from "@/hooks/useChainBalances";
import { useCrossChainArb } from "@/hooks/useCrossChainArb";

export default function SimulatedBridge() {
  const { activeChain, supportedChains, refetchActiveChain } = useCrossChainArb();
  const { withdraw, refetchVaultBalance } = useVault();
  const { balance: usdcBalance, refetchBalance } = useUSDC();
  const { address } = useAccount();
  const chainId = useChainId();
  const { chainBalances } = useChainBalances();
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

      // Step 3: Simulated bridge (no actual cross-chain transfer)
      setStep("bridging");
      
      // Simulate bridge delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      alert(
        `Bridge simulation completed!\n\n` +
        `Amount: ${amountAfterFee.toFixed(6)} USDC\n` +
        `From: ${fromChain}\n` +
        `To: ${toChain}\n\n` +
        `This is a simulated bridge - no actual cross-chain transfer occurred.`
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

  // Get all supported chains (supportedChains is already an array of strings)
  const availableToChains = supportedChains.filter((chain) => chain !== fromChain);
  const amountNum = parseFloat(amount) || 0;
  const feePercent = parseFloat(bridgeFee) || 0;
  const feeAmount = (amountNum * feePercent) / 100;
  const amountAfterFee = amountNum - feeAmount;

  // Get chains with balances for the fromChain selector
  const chainsWithBalances = chainBalances.filter((cb) => cb.balance > 0);

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-5">
      <h2 className="text-lg font-medium text-gray-900 mb-2">Cross-Chain Bridge (Simulated)</h2>
      <p className="text-xs text-gray-500 mb-4">
        Simulated bridge interface. Select the source chain (where funds are currently) and destination chain.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Chain:
          </label>
          <select
            value={fromChain}
            onChange={(e) => setFromChain(e.target.value)}
            disabled={step !== "input"}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Select source chain...</option>
            {chainsWithBalances.length > 0 ? (
              chainsWithBalances.map((cb) => (
                <option key={cb.chain} value={cb.chain}>
                  {cb.chain} ({cb.balance.toFixed(2)} USDC)
                </option>
              ))
            ) : (
              supportedChains.map((chain, index) => (
                <option key={`${chain}-${index}`} value={chain}>
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
            disabled={step !== "input" || !fromChain}
            className="w-full px-3 py-2 border border-gray-300 rounded-sm bg-white text-gray-900 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          >
            <option value="">Select destination chain...</option>
            {availableToChains.map((chain, index) => (
              <option key={`${chain}-${index}`} value={chain}>
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
            disabled={step !== "input"}
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
            disabled={step !== "input"}
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


        <div className="text-xs text-gray-500 space-y-1">
          <p>• Step 1: Withdraw {amountNum > 0 ? amountNum.toFixed(6) : "X"} USDC from vault</p>
          <p>• Step 2: Simulated bridge from {fromChain || "source"} to {toChain || "destination"}</p>
          <p>• Note: This is a simulated bridge - no actual cross-chain transfer occurs</p>
          {fromChain !== activeChain && fromChain && (
            <p className="text-orange-600 font-medium">
              ⚠ Note: Active chain is {activeChain}, but bridging from {fromChain}.
            </p>
          )}
        </div>

        <button
          onClick={handleBridge}
          disabled={
            !fromChain || 
            !toChain || 
            !amount || 
            step !== "input"
          }
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
        >
          {step === "withdrawing" && "Withdrawing from vault..."}
          {step === "bridging" && "Simulating bridge..."}
          {step === "complete" && "Complete!"}
          {step === "input" && `Simulate Bridge ${amountNum > 0 ? amountNum.toFixed(2) : ""} USDC from ${fromChain || "source"} to ${toChain || "destination"}`}
        </button>
      </div>
    </div>
  );
}

