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
});

// Add mainnet chains
const ethereum = defineChain({
  id: 1,
  name: "Ethereum",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { 
    default: { 
      http: [
        "https://eth.llamarpc.com",
        "https://ethereum-rpc.publicnode.com",
        "https://1rpc.io/eth",
        "https://rpc.ankr.com/eth"
      ] 
    } 
  },
  blockExplorers: { default: { name: "Etherscan", url: "https://etherscan.io" } },
});

const base = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
  rpcUrls: { 
    default: { 
      http: [
        "https://mainnet.base.org",
        "https://base.gateway.tenderly.co",
        "https://base-rpc.publicnode.com",
        "https://1rpc.io/base"
      ] 
    } 
  },
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

// Testnets
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
    // Testnets
    ethereumSepolia,
    baseSepolia,
    arbitrumSepolia,
    optimismSepolia,
  ],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

