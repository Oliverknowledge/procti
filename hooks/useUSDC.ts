"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount, usePublicClient } from "wagmi";
import { USDC_ADDRESS, USDC_ABI } from "@/config/contracts";
import { formatUnits, parseUnits } from "viem";

export const useUSDC = () => {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });
  const publicClient = usePublicClient();

  // Read user USDC balance
  const {
    data: balance,
    refetch: refetchBalance,
    error: balanceError,
    isLoading: isLoadingBalance,
  } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: false, // Disable auto-refetch
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    },
  });

  // Check allowance
  const checkAllowance = async (spender: `0x${string}`): Promise<bigint> => {
    if (!publicClient || !address) return 0n;
    
    try {
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "allowance",
        args: [address, spender],
      });
      return allowance;
    } catch (err) {
      console.error("Error checking allowance:", err);
      return 0n;
    }
  };

  // Approve USDC spending
  const approve = async (spender: `0x${string}`, amount: string) => {
    if (!address) {
      throw new Error("Wallet not connected. Please connect your wallet first.");
    }

    try {
      // Check current allowance first
      const currentAllowance = await checkAllowance(spender);
      const amountWei = parseUnits(amount, 6); // USDC has 6 decimals
      
      // If allowance is already sufficient, skip approval
      if (currentAllowance >= amountWei) {
        console.log("Allowance already sufficient, skipping approval");
        return;
      }

      console.log("Requesting approval for", amount, "USDC to", spender);
      console.log("Current allowance:", formatUnits(currentAllowance, 6), "USDC");

      // Call writeContract - this should trigger wallet popup immediately
      // In wagmi v2, writeContract is a mutation function that triggers the popup
      // The hash becomes available in the hook's state after user approval
      try {
        console.log("Calling writeContract for approval...");
        console.log("This should trigger a wallet popup - please check your wallet!");
        
        // Try calling writeContract - it may or may not return a promise
        const result = writeContract({
          address: USDC_ADDRESS,
          abi: USDC_ABI,
          functionName: "approve",
          args: [spender, amountWei],
        });
        
        // If it returns a promise, handle it
        if (result && typeof result.then === 'function') {
          console.log("writeContract returned a promise, awaiting it...");
          try {
            const hashFromPromise = await result;
            if (hashFromPromise) {
              console.log("Got hash from writeContract promise:", hashFromPromise);
              // Wait for confirmation
              if (!publicClient) {
                throw new Error("Public client not available");
              }
              const receipt = await publicClient.waitForTransactionReceipt({
                hash: hashFromPromise,
                timeout: 60000,
              });
              if (!receipt || receipt.status === "reverted") {
                throw new Error("Approval transaction failed or was reverted");
              }
              // Verify allowance
              const newAllowance = await checkAllowance(spender);
              if (newAllowance < amountWei) {
                throw new Error("Approval transaction confirmed but allowance is still insufficient");
              }
              console.log("Allowance verified:", formatUnits(newAllowance, 6), "USDC");
              return; // Success, exit early
            }
          } catch (promiseError: any) {
            console.error("Error from writeContract promise:", promiseError);
            if (promiseError?.message?.includes("rejected") || promiseError?.message?.includes("denied") || promiseError?.message?.includes("User rejected")) {
              throw new Error("Approval was rejected. Please approve the transaction in your wallet.");
            }
            // If promise rejects, fall through to waiting for hash in state
            console.log("Promise rejected, will wait for hash in hook state");
          }
        } else {
          console.log("writeContract did not return a promise, will wait for hash in hook state");
        }
      } catch (writeError: any) {
        // If writeContract throws synchronously, it's likely a connection issue
        console.error("WriteContract synchronous error:", writeError);
        if (writeError?.message?.includes("rejected") || writeError?.message?.includes("denied") || writeError?.message?.includes("User rejected")) {
          throw new Error("Approval was rejected. Please approve the transaction in your wallet.");
        }
        if (writeError?.message?.includes("not connected") || writeError?.message?.includes("No wallet") || writeError?.message?.includes("connector")) {
          throw new Error("Wallet not connected. Please connect your wallet and try again.");
        }
        throw new Error(`Failed to initiate approval: ${writeError?.message || "Unknown error"}. Please check your wallet connection.`);
      }

      // Wait for transaction hash from hook state (up to 30 seconds)
      // The wallet popup should appear when writeContract is called above
      console.log("Waiting for approval transaction hash (check your wallet for popup)...");
      console.log("If no popup appears, check:");
      console.log("1. Your wallet extension is unlocked");
      console.log("2. Your wallet is connected to this site");
      console.log("3. Browser popups are not blocked");
      
      let txHash: `0x${string}` | null = null;
      const maxWaitTime = 30000; // 30 seconds
      const checkInterval = 500; // Check every 500ms
      const maxChecks = maxWaitTime / checkInterval;

      for (let i = 0; i < maxChecks; i++) {
        await new Promise((resolve) => setTimeout(resolve, checkInterval));
        
        // Check for error first
        if (error) {
          const errorMsg = error.message || String(error);
          console.error("Error from writeContract:", errorMsg);
          if (errorMsg.includes("rejected") || errorMsg.includes("denied") || errorMsg.includes("User rejected")) {
            throw new Error("Approval was rejected. Please approve the transaction in your wallet.");
          }
          if (errorMsg.includes("not connected") || errorMsg.includes("No wallet")) {
            throw new Error("Wallet not connected. Please connect your wallet and try again.");
          }
          throw new Error(`Approval failed: ${errorMsg}`);
        }
        
        // Check for hash
        if (hash) {
          txHash = hash;
          console.log("Got approval transaction hash:", txHash);
          break;
        }
        
        // Log progress every 5 seconds
        if (i % 10 === 0 && i > 0) {
          console.log(`Still waiting for approval transaction hash... (${i * checkInterval / 1000}s elapsed)`);
        }
      }

      if (!txHash) {
        throw new Error(
          "Approval transaction hash not received.\n\n" +
          "This usually means:\n" +
          "1. No wallet popup appeared - check if your wallet is properly connected\n" +
          "2. The transaction was rejected silently - check your wallet\n" +
          "3. Your wallet popup might be blocked by your browser\n" +
          "4. There's a network issue\n\n" +
          "Please:\n" +
          "- Check your wallet extension/application\n" +
          "- Make sure popups are not blocked\n" +
          "- Try refreshing the page and reconnecting your wallet\n" +
          "- Then try depositing again."
        );
      }

      // Wait for transaction confirmation
      if (!publicClient) {
        throw new Error("Public client not available. Cannot wait for transaction confirmation.");
      }

      console.log("Waiting for approval transaction confirmation...");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60000, // 60 seconds timeout
      });

      if (!receipt || receipt.status === "reverted") {
        throw new Error("Approval transaction failed or was reverted");
      }

      console.log("Approval transaction confirmed");

      // Verify allowance was set correctly
      const newAllowance = await checkAllowance(spender);
      if (newAllowance < amountWei) {
        throw new Error("Approval transaction confirmed but allowance is still insufficient");
      }

      console.log("Allowance verified:", formatUnits(newAllowance, 6), "USDC");
    } catch (err: any) {
      console.error("Approve error:", err);
      if (err?.message?.includes("rejected") || err?.message?.includes("denied") || err?.message?.includes("User rejected")) {
        throw new Error("Approval was rejected. Please approve the transaction in your wallet.");
      }
      throw err;
    }
  };

  return {
    balance: balance ? formatUnits(balance, 6) : "0",
    refetchBalance,
    approve,
    checkAllowance,
    isPending: isPending || isConfirming,
    isConfirmed,
    error: error || balanceError,
    isLoadingBalance,
  };
};

