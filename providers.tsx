"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";
import "@rainbow-me/rainbowkit/styles.css";

// Arc testnet configuration
const arcTestnet = defineChain({
  id: 5042002, // Arc testnet chain ID
  name: "Arc Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.arc.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arc Explorer",
      url: "https://testnet.arcscan.app",
    },
  },
  testnet: true,
  // Explicitly disable EIP-1559 to use legacy gasPrice
  fees: {
    baseFeeMultiplier: undefined,
  },
});

// Add mainnet chains for CCTP support
const ethereum = defineChain({
  id: 1,
  name: "Ethereum",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: ["https://eth.llamarpc.com"] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://etherscan.io" } },
});

const base = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
  blockExplorers: { default: { name: "Basescan", url: "https://basescan.org" } },
});

const arbitrum = defineChain({
  id: 42161,
  name: "Arbitrum",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: ["https://arb1.arbitrum.io/rpc"] } },
  blockExplorers: { default: { name: "Arbiscan", url: "https://arbiscan.io" } },
});

const optimism = defineChain({
  id: 10,
  name: "Optimism",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: ["https://mainnet.optimism.io"] } },
  blockExplorers: { default: { name: "Optimism Explorer", url: "https://optimistic.etherscan.io" } },
});

// CCTP-Supported Testnets
const ethereumSepolia = defineChain({
  id: 11155111,
  name: "Ethereum Sepolia",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: ["https://sepolia.infura.io/v3/"] } },
  blockExplorers: { default: { name: "Etherscan", url: "https://sepolia.etherscan.io" } },
  testnet: true,
});

const baseSepolia = defineChain({
  id: 84532,
  name: "Base Sepolia",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: ["https://sepolia.base.org"] } },
  blockExplorers: { default: { name: "Basescan", url: "https://sepolia.basescan.org" } },
  testnet: true,
});

const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: ["https://sepolia-rollup.arbitrum.io/rpc"] } },
  blockExplorers: { default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" } },
  testnet: true,
});

const optimismSepolia = defineChain({
  id: 11155420,
  name: "Optimism Sepolia",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { default: { http: ["https://sepolia.optimism.io"] } },
  blockExplorers: { default: { name: "Optimism Explorer", url: "https://sepolia-optimistic.etherscan.io" } },
  testnet: true,
});

const config = getDefaultConfig({
  appName: "Procti DeFi",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID", // Get from https://cloud.walletconnect.com
  chains: [
    arcTestnet, 
    ethereum, 
    base, 
    arbitrum, 
    optimism,
    // CCTP testnets
    ethereumSepolia,
    baseSepolia,
    arbitrumSepolia,
    optimismSepolia,
  ],
  ssr: true,
});

// Configure QueryClient to disable aggressive auto-refetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Disable auto-refetching to reduce RPC calls
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Disable automatic polling
      staleTime: 30000, // Consider data fresh for 30 seconds
      gcTime: 60000, // Keep unused data for 60 seconds
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

