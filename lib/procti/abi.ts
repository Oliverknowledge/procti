/**
 * @file TrancheVault ABI
 * @notice Import the ABI from the Backend/abi folder
 */

import TrancheVaultABI from "../../Backend/abi/TrancheVault.json";
import MockScoringContractABI from "../../Backend/abi/MockScoringContract.json";

export const TRANCHE_VAULT_ABI = TrancheVaultABI.abi;
export const MOCK_SCORING_ABI = MockScoringContractABI.abi;

// Legacy placeholder ABI (kept for reference, but using actual ABI above)
const _PLACEHOLDER_ABI = [
  // This will be replaced with the actual ABI after deployment
  // For now, we'll define the essential functions we need
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "t", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "t", type: "uint8" },
    ],
    outputs: [],
  },
  {
    name: "updateEpoch",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "yieldScore", type: "uint256" },
      { name: "securityScore", type: "uint256" },
      { name: "liquidityScore", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "getTrancheValues",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
      { name: "", type: "uint256" },
    ],
  },
  {
    name: "getUserValue",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "t", type: "uint8" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getUserShares",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "t", type: "uint8" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getSharePrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "t", type: "uint8" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalVaultValue",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "owner",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "usdc",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "Deposit",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "tranche", type: "uint8", indexed: false },
      { name: "shares", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Withdraw",
    type: "event",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
      { name: "tranche", type: "uint8", indexed: false },
      { name: "shares", type: "uint256", indexed: false },
    ],
  },
  {
    name: "EpochUpdated",
    type: "event",
    inputs: [
      { name: "yieldScore", type: "uint256", indexed: false },
      { name: "securityScore", type: "uint256", indexed: false },
      { name: "liquidityScore", type: "uint256", indexed: false },
      { name: "delta", type: "int256", indexed: false },
      { name: "seniorDelta", type: "int256", indexed: false },
      { name: "mezzDelta", type: "int256", indexed: false },
      { name: "juniorDelta", type: "int256", indexed: false },
    ],
  },
  {
    name: "LossApplied",
    type: "event",
    inputs: [
      { name: "amount", type: "uint256", indexed: false },
      { name: "juniorLoss", type: "uint256", indexed: false },
      { name: "mezzLoss", type: "uint256", indexed: false },
      { name: "seniorLoss", type: "uint256", indexed: false },
    ],
  },
] as const;

// MOCK_SCORING_ABI is now imported from the actual ABI file above

