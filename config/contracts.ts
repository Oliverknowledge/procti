import SentinelVaultABI from "../abi/SentinelVault.json";
import OracleFeedABI from "../abi/OracleFeed.json";
import YieldPoolABI from "../abi/YieldPool.json";
import SafePoolABI from "../abi/SafePool.json";
import IERC20ABI from "../abi/IERC20.json";
import CrossChainArbitrageABI from "../abi/CrossChainArbitrage.json";

// Contract addresses from CONTRACT_ADDRESSES.md
export const contractsConfig = {
  vault: {
    address: "0xDf9053726a2217326bFEadc0c3480c5De7107B8f" as `0x${string}`,
    abi: SentinelVaultABI.abi,
  },
  oracle: {
    address: "0xd8A5E7ACa9A2B61d223Ea993749B5F6576aa503f" as `0x${string}`,
    abi: OracleFeedABI.abi,
  },
  yieldPool: {
    address: "0xC6D145006Cd18C7b22D584737A8909DdF3b839D5" as `0x${string}`,
    abi: YieldPoolABI.abi,
  },
  safePool: {
    address: "0xb90892b0143eb804037D582FE7678C636D47f0a5" as `0x${string}`,
    abi: SafePoolABI.abi,
  },
  crossChainArb: {
    address: "0x7A612459095bBe3F579068CDE982aa91C57919A6" as `0x${string}`,
    abi: CrossChainArbitrageABI.abi,
  },
};

// USDC token address (verified on Arc testnet explorer)
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;

export const USDC_ABI = IERC20ABI.abi;
