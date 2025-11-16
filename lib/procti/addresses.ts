/**
 * @file TrancheVault Contract Addresses
 * @notice Update these addresses after deploying TrancheVault
 * @dev These are placeholder addresses - replace with actual deployed addresses
 */

// Deployed addresses on Arc Testnet
export const TRANCHE_VAULT_ADDRESS = "0x7D5b0bcf399F2Fbe590b01fAE7C885C53663A6CB" as `0x${string}`;
export const MOCK_SCORING_ADDRESS = "0x7c718Ffea9C625B9937fE99B270BBeAF64027d22" as `0x${string}`;

// USDC address (should match existing config)
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;

/**
 * Tranche enum values
 */
export enum Tranche {
  Senior = 0,
  Mezz = 1,
  Junior = 2,
}

/**
 * Tranche metadata
 */
export const TRANCHES = [
  {
    id: Tranche.Senior,
    name: "Senior",
    description: "Low risk, low yield",
    color: "green",
    riskLevel: "Low",
  },
  {
    id: Tranche.Mezz,
    name: "Mezzanine",
    description: "Medium risk/yield",
    color: "yellow",
    riskLevel: "Medium",
  },
  {
    id: Tranche.Junior,
    name: "Junior",
    description: "High risk, first-loss",
    color: "red",
    riskLevel: "High",
  },
] as const;

