"use client";

import { useWriteContract, useWaitForTransactionReceipt, usePublicClient, useAccount } from "wagmi";
import { parseUnits, formatUnits, Address } from "viem";
import { useState, useCallback, useRef, useEffect } from "react";
import { contractsConfig, USDC_ADDRESS, USDC_ABI } from "@/config/contracts";

/**
 * Hook to handle cross-chain USDC bridging via contract's bridgeUSDC() function
 * The contract handles all CCTP complexity internally
 */
export const useCCTP = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const [isBridging, setIsBridging] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>("");
  const hashRef = useRef<`0x${string}` | null>(null);
  
  // Update ref when hash changes
  useEffect(() => {
    if (hash) {
      hashRef.current = hash;
    }
  }, [hash]);

  /**
   * Check if user has approved CrossChainArbitrage contract to spend USDC
   */
  const checkAllowance = useCallback(async (amount: bigint): Promise<boolean> => {
    if (!publicClient || !address) return false;

    try {
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "allowance",
        args: [address, contractsConfig.crossChainArb.address],
      }) as bigint;

      return allowance >= amount;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  }, [publicClient, address]);

  /**
   * Approve USDC to CrossChainArbitrage contract
   */
  const approveUSDC = useCallback(async (amount: bigint): Promise<void> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    setTransferStatus("Approving USDC...");
    
    // Clear previous hash
    hashRef.current = null;
    
    // Request approval
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: "approve",
      args: [contractsConfig.crossChainArb.address, amount],
    });
    
    // Wait for approval transaction hash
    let approvalHash: `0x${string}` | null = null;
    const maxWaitTime = 30000; // 30 seconds
    const checkInterval = 500; // Check every 500ms
    const maxChecks = maxWaitTime / checkInterval;
    
    for (let i = 0; i < maxChecks; i++) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
      const currentHash = hashRef.current || hash;
      if (currentHash) {
        approvalHash = currentHash;
        break;
      }
      if (error) {
        throw new Error(`Approval failed: ${error.message || "Unknown error"}`);
      }
    }
    
    if (!approvalHash) {
      throw new Error("Approval transaction hash not received. Please approve the transaction in your wallet.");
    }
    
    // Wait for approval confirmation
    if (!publicClient) {
      throw new Error("Public client not available");
    }
    
    const approvalReceipt = await publicClient.waitForTransactionReceipt({
      hash: approvalHash,
      timeout: 60000,
    });
    
    if (approvalReceipt.status === "reverted") {
      throw new Error("Approval transaction was reverted. Please check your wallet and try again.");
    }
    
    console.log("✅ USDC approved to CrossChainArbitrage contract");
  }, [writeContract, publicClient, address, hash, error]);

  /**
   * Bridge USDC to another chain using contract's bridgeUSDC() function
   */
  const bridgeUSDC = async (
    toChain: string,
    amount: string,
    recipientAddress?: Address
  ): Promise<void> => {
    if (!publicClient || !address) {
      throw new Error("Wallet not connected");
    }

    const recipient = recipientAddress || address;
    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

    try {
      setIsBridging(true);
      setTransferStatus("Preparing bridge...");

      // Step 1: Check and approve USDC if needed
      const hasAllowance = await checkAllowance(amountWei);
      
      if (!hasAllowance) {
        console.log("Insufficient allowance, requesting approval...");
        await approveUSDC(amountWei);
      } else {
        console.log("Allowance sufficient, skipping approval");
      }

      // Step 2: Verify user has enough balance
      const userBalance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "balanceOf",
        args: [address],
      }) as bigint;
      
      console.log("User USDC balance:", formatUnits(userBalance, 6), "USDC");
      
      if (userBalance < amountWei) {
        throw new Error(
          `Insufficient USDC balance!\n\n` +
          `You have: ${formatUnits(userBalance, 6)} USDC\n` +
          `Trying to bridge: ${formatUnits(amountWei, 6)} USDC`
        );
      }

      // Step 3: Call bridgeUSDC on the contract
      setTransferStatus(`Bridging ${formatUnits(amountWei, 6)} USDC to ${toChain}...`);
      
      // Clear previous hash
      hashRef.current = null;
      
      console.log("Calling bridgeUSDC with args:", {
        toChain,
        amount: amountWei.toString(),
        recipient,
      });

      writeContract({
        address: contractsConfig.crossChainArb.address,
        abi: contractsConfig.crossChainArb.abi,
        functionName: "bridgeUSDC",
        args: [toChain, amountWei, recipient],
      });

      // Wait for transaction hash
      let txHash: `0x${string}` | null = null;
      const maxWaitTime = 30000; // 30 seconds
      const checkInterval = 500; // Check every 500ms
      const maxChecks = maxWaitTime / checkInterval;
      
      for (let i = 0; i < maxChecks; i++) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        const currentHash = hashRef.current || hash;
        if (currentHash) {
          txHash = currentHash;
          break;
        }
        if (error) {
          throw new Error(`Transaction failed: ${error.message || "Unknown error"}`);
        }
      }

      if (!txHash) {
        if (error) {
          throw new Error(`Transaction failed: ${error.message || "Unknown error"}`);
        }
        throw new Error(
          "Transaction hash not received. This usually means:\n" +
          "1. You rejected the transaction in your wallet\n" +
          "2. The transaction failed to submit\n" +
          "3. Your wallet is not properly connected\n\n" +
          "Please check your wallet and make sure to approve the transaction."
        );
      }

      // Wait for transaction confirmation
      setTransferStatus("Waiting for transaction confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 120000, // 2 minutes
      });

      if (receipt.status === "reverted") {
        throw new Error("Bridge transaction was reverted. Please check the transaction on the block explorer.");
      }

      setTransferStatus("✅ Bridge successful!");
      console.log("✅ Bridge successful! Transaction:", txHash);
      
      // Wait a bit before clearing status
      setTimeout(() => {
        setTransferStatus("");
      }, 3000);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error("Bridge error:", err);
      setTransferStatus("");
      
      // Provide user-friendly error messages
      if (error?.message?.includes("rejected") || error?.message?.includes("denied") || error?.message?.includes("User rejected")) {
        throw new Error("Transaction was rejected. Please approve the transaction in your wallet to continue.");
      }
      
      throw new Error(`Bridge failed: ${error?.message || "Unknown error"}`);
    } finally {
      setIsBridging(false);
    }
  };

  /**
   * Legacy function name for compatibility - redirects to bridgeUSDC
   */
  const transferWithCCTP = async (
    toChainName: string,
    amount: string,
    recipientAddress?: Address
  ): Promise<void> => {
    return bridgeUSDC(toChainName, amount, recipientAddress);
  };

  /**
   * Check if bridging is available (always true now since contract handles it)
   */
  const isCCTPAvailable = (chainName: string): boolean => {
    // Contract handles all chains, so we just check if it's a supported chain name
    const supportedChains = ["Arc", "Ethereum", "Arbitrum", "Base", "Optimism"];
    return supportedChains.includes(chainName);
  };

  return {
    bridgeUSDC,
    transferWithCCTP, // Legacy name for compatibility
    checkAllowance,
    approveUSDC,
    isCCTPAvailable,
    isBridging: isBridging || isPending || isConfirming,
    isConfirmed,
    transferStatus,
    hash,
    error,
  };
};
