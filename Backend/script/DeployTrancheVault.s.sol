// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script, console} from "forge-std/Script.sol";
import {TrancheVault} from "../src/TrancheVault.sol";
import {MockScoringContract} from "../src/MockScoringContract.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/**
 * @title DeployTrancheVault
 * @dev Deployment script for TrancheVault and MockScoringContract
 */
contract DeployTrancheVault is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdcAddress = vm.envAddress("USDC_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        console.log("Deploying TrancheVault...");
        console.log("USDC Address:", usdcAddress);
        
        // Deploy TrancheVault
        TrancheVault vault = new TrancheVault(usdcAddress);
        console.log("TrancheVault deployed at:", address(vault));
        
        // Deploy MockScoringContract (optional, for testing)
        console.log("Deploying MockScoringContract...");
        MockScoringContract scoring = new MockScoringContract();
        console.log("MockScoringContract deployed at:", address(scoring));
        
        vm.stopBroadcast();
        
        // Print deployment summary
        console.log("\n=== Deployment Summary ===");
        console.log("TrancheVault:", address(vault));
        console.log("MockScoringContract:", address(scoring));
        console.log("USDC:", usdcAddress);
        console.log("\nNext steps:");
        console.log("1. Update CONTRACT_ADDRESSES.md with new addresses");
        console.log("2. Copy ABIs using: forge build && ./scripts/copy-abis.ps1");
    }
}

