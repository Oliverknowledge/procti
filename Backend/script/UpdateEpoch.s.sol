// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {TrancheVault} from "../src/TrancheVault.sol";

/**
 * @title UpdateEpoch
 * @notice Script to update epoch with real-time chain data
 * @dev Can be called with scores from fetch-chain-data.js
 */
contract UpdateEpoch is Script {
    function run(uint256 yieldScore, uint256 securityScore, uint256 liquidityScore) external {
        // Get contract address from environment or use deployed address
        address trancheVaultAddress = vm.envAddress("TRANCHE_VAULT_ADDRESS");
        
        TrancheVault vault = TrancheVault(trancheVaultAddress);
        
        console.log("Updating epoch with scores:");
        console.log("Yield Score:", yieldScore);
        console.log("Security Score:", securityScore);
        console.log("Liquidity Score:", liquidityScore);
        
        // Update epoch
        vault.updateEpoch(yieldScore, securityScore, liquidityScore);
        
        console.log("Epoch updated successfully!");
    }
}

