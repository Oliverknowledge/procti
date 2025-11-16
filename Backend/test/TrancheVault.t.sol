// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test, console} from "forge-std/Test.sol";
import {MockUSDC} from "../src/MockUSDC.sol";
import {TrancheVault} from "../src/TrancheVault.sol";
import {MockScoringContract} from "../src/MockScoringContract.sol";

contract TrancheVaultTest is Test {
    MockUSDC public usdc;
    TrancheVault public vault;
    MockScoringContract public scoring;
    
    address public owner = address(0x1);
    address public user1 = address(0x2);
    address public user2 = address(0x3);
    address public user3 = address(0x4);
    
    uint256 public constant INITIAL_BALANCE = 1000000e6; // 1M USDC

    function setUp() public {
        // Deploy contracts
        usdc = new MockUSDC(INITIAL_BALANCE);
        vault = new TrancheVault(address(usdc));
        scoring = new MockScoringContract();
        
        // Give users USDC and approve
        usdc.mint(user1, INITIAL_BALANCE);
        usdc.mint(user2, INITIAL_BALANCE);
        usdc.mint(user3, INITIAL_BALANCE);
        
        vm.prank(user1);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(user2);
        usdc.approve(address(vault), type(uint256).max);
        vm.prank(user3);
        usdc.approve(address(vault), type(uint256).max);
    }

    // ============ Deposit Tests ============
    
    function test_InitialState() public {
        (uint256 seniorValue, uint256 mezzValue, uint256 juniorValue) = vault.getTrancheValues();
        assertEq(seniorValue, 0, "Senior should start at 0");
        assertEq(mezzValue, 0, "Mezz should start at 0");
        assertEq(juniorValue, 0, "Junior should start at 0");
        assertEq(vault.totalVaultValue(), 0, "Total vault value should be 0");
    }

    function test_FirstDepositSenior() public {
        uint256 amount = 1000e6; // 1000 USDC
        
        vm.prank(user1);
        vault.deposit(amount, TrancheVault.Tranche.Senior);
        
        assertEq(vault.getUserShares(user1, TrancheVault.Tranche.Senior), amount, "First deposit should be 1:1 shares");
        assertEq(vault.getUserValue(user1, TrancheVault.Tranche.Senior), amount, "User value should equal deposit");
        
        (uint256 seniorValue, , ) = vault.getTrancheValues();
        assertEq(seniorValue, amount, "Senior tranche value should equal deposit");
    }

    function test_FirstDepositMezz() public {
        uint256 amount = 500e6;
        
        vm.prank(user1);
        vault.deposit(amount, TrancheVault.Tranche.Mezz);
        
        assertEq(vault.getUserShares(user1, TrancheVault.Tranche.Mezz), amount, "First deposit should be 1:1 shares");
        assertEq(vault.getUserValue(user1, TrancheVault.Tranche.Mezz), amount, "User value should equal deposit");
    }

    function test_FirstDepositJunior() public {
        uint256 amount = 200e6;
        
        vm.prank(user1);
        vault.deposit(amount, TrancheVault.Tranche.Junior);
        
        assertEq(vault.getUserShares(user1, TrancheVault.Tranche.Junior), amount, "First deposit should be 1:1 shares");
        assertEq(vault.getUserValue(user1, TrancheVault.Tranche.Junior), amount, "User value should equal deposit");
    }

    function test_SecondDepositSenior() public {
        uint256 amount1 = 1000e6;
        uint256 amount2 = 500e6;
        
        // First deposit
        vm.prank(user1);
        vault.deposit(amount1, TrancheVault.Tranche.Senior);
        
        // Second deposit
        vm.prank(user2);
        vault.deposit(amount2, TrancheVault.Tranche.Senior);
        
        // Second depositor should get shares proportional to virtual value
        uint256 user2Shares = vault.getUserShares(user2, TrancheVault.Tranche.Senior);
        assertEq(user2Shares, amount2, "Second deposit should also be 1:1 if virtualValue equals totalShares");
        
        (uint256 seniorValue, , ) = vault.getTrancheValues();
        assertEq(seniorValue, amount1 + amount2, "Senior tranche should have both deposits");
    }

    function test_DepositMultipleTranches() public {
        uint256 seniorAmount = 1000e6;
        uint256 mezzAmount = 500e6;
        uint256 juniorAmount = 200e6;
        
        vm.prank(user1);
        vault.deposit(seniorAmount, TrancheVault.Tranche.Senior);
        
        vm.prank(user2);
        vault.deposit(mezzAmount, TrancheVault.Tranche.Mezz);
        
        vm.prank(user3);
        vault.deposit(juniorAmount, TrancheVault.Tranche.Junior);
        
        (uint256 seniorValue, uint256 mezzValue, uint256 juniorValue) = vault.getTrancheValues();
        assertEq(seniorValue, seniorAmount, "Senior value should match");
        assertEq(mezzValue, mezzAmount, "Mezz value should match");
        assertEq(juniorValue, juniorAmount, "Junior value should match");
        assertEq(vault.totalVaultValue(), seniorAmount + mezzAmount + juniorAmount, "Total should match");
    }

    // ============ Withdraw Tests ============
    
    function test_WithdrawSenior() public {
        uint256 depositAmount = 1000e6;
        uint256 withdrawShares = 500e6; // Withdraw half
        
        // Deposit
        vm.prank(user1);
        vault.deposit(depositAmount, TrancheVault.Tranche.Senior);
        
        uint256 balanceBefore = usdc.balanceOf(user1);
        
        // Withdraw
        vm.prank(user1);
        vault.withdraw(withdrawShares, TrancheVault.Tranche.Senior);
        
        uint256 balanceAfter = usdc.balanceOf(user1);
        assertEq(balanceAfter - balanceBefore, withdrawShares, "User should receive USDC");
        assertEq(vault.getUserShares(user1, TrancheVault.Tranche.Senior), depositAmount - withdrawShares, "Shares should decrease");
    }

    function test_WithdrawAfterEpochUpdate() public {
        uint256 depositAmount = 1000e6;
        
        // Deposit
        vm.prank(user1);
        vault.deposit(depositAmount, TrancheVault.Tranche.Senior);
        
        // Update epoch with positive returns
        vm.prank(owner);
        vault.updateEpoch(7000, 8000, 7500); // Positive scenario
        
        // Withdraw
        uint256 shares = vault.getUserShares(user1, TrancheVault.Tranche.Senior);
        uint256 userValue = vault.getUserValue(user1, TrancheVault.Tranche.Senior);
        
        uint256 balanceBefore = usdc.balanceOf(user1);
        vm.prank(user1);
        vault.withdraw(shares, TrancheVault.Tranche.Senior);
        uint256 balanceAfter = usdc.balanceOf(user1);
        
        // User should receive more than original deposit due to positive returns
        assertGe(balanceAfter - balanceBefore, depositAmount, "User should receive more after positive epoch");
    }

    // ============ Epoch Update Tests ============
    
    function test_EpochUpdatePositive() public {
        uint256 seniorAmount = 1000e6;
        uint256 mezzAmount = 500e6;
        uint256 juniorAmount = 200e6;
        
        // Deposit into all tranches
        vm.prank(user1);
        vault.deposit(seniorAmount, TrancheVault.Tranche.Senior);
        vm.prank(user2);
        vault.deposit(mezzAmount, TrancheVault.Tranche.Mezz);
        vm.prank(user3);
        vault.deposit(juniorAmount, TrancheVault.Tranche.Junior);
        
        // Get initial values
        (uint256 seniorBefore, uint256 mezzBefore, uint256 juniorBefore) = vault.getTrancheValues();
        
        // Update epoch with positive scores (high yield, security, liquidity)
        vm.prank(owner);
        vault.updateEpoch(7000, 8000, 7500);
        
        // Get values after epoch
        (uint256 seniorAfter, uint256 mezzAfter, uint256 juniorAfter) = vault.getTrancheValues();
        
        // All tranches should increase, with Junior increasing most
        assertGt(seniorAfter, seniorBefore, "Senior should increase");
        assertGt(mezzAfter, mezzBefore, "Mezz should increase");
        assertGt(juniorAfter, juniorBefore, "Junior should increase");
        
        // Junior should increase more than Mezz, Mezz more than Senior
        uint256 seniorIncrease = seniorAfter - seniorBefore;
        uint256 mezzIncrease = mezzAfter - mezzBefore;
        uint256 juniorIncrease = juniorAfter - juniorBefore;
        
        assertGt(mezzIncrease, seniorIncrease, "Mezz should increase more than Senior");
        assertGt(juniorIncrease, mezzIncrease, "Junior should increase more than Mezz");
    }

    function test_EpochUpdateNegative() public {
        uint256 seniorAmount = 1000e6;
        uint256 mezzAmount = 500e6;
        uint256 juniorAmount = 200e6;
        
        // Deposit into all tranches
        vm.prank(user1);
        vault.deposit(seniorAmount, TrancheVault.Tranche.Senior);
        vm.prank(user2);
        vault.deposit(mezzAmount, TrancheVault.Tranche.Mezz);
        vm.prank(user3);
        vault.deposit(juniorAmount, TrancheVault.Tranche.Junior);
        
        // Get initial values
        (uint256 seniorBefore, uint256 mezzBefore, uint256 juniorBefore) = vault.getTrancheValues();
        
        // Update epoch with negative scores (low yield, security, liquidity)
        vm.prank(owner);
        vault.updateEpoch(3000, 4000, 3500);
        
        // Get values after epoch
        (uint256 seniorAfter, uint256 mezzAfter, uint256 juniorAfter) = vault.getTrancheValues();
        
        // All tranches should decrease, with Junior decreasing most
        assertLt(seniorAfter, seniorBefore, "Senior should decrease");
        assertLt(mezzAfter, mezzBefore, "Mezz should decrease");
        assertLt(juniorAfter, juniorBefore, "Junior should decrease");
        
        // Junior should decrease more than Mezz, Mezz more than Senior
        uint256 seniorDecrease = seniorBefore - seniorAfter;
        uint256 mezzDecrease = mezzBefore - mezzAfter;
        uint256 juniorDecrease = juniorBefore - juniorAfter;
        
        assertGt(mezzDecrease, seniorDecrease, "Mezz should decrease more than Senior");
        assertGt(juniorDecrease, mezzDecrease, "Junior should decrease more than Mezz");
    }

    function test_EpochUpdateNeutral() public {
        uint256 amount = 1000e6;
        
        vm.prank(user1);
        vault.deposit(amount, TrancheVault.Tranche.Senior);
        
        (uint256 seniorBefore, , ) = vault.getTrancheValues();
        
        // Update epoch with neutral scores (50% = 5000)
        vm.prank(owner);
        vault.updateEpoch(5000, 5000, 5000);
        
        (uint256 seniorAfter, , ) = vault.getTrancheValues();
        
        // Should remain approximately the same (small rounding differences possible)
        assertApproxEqRel(seniorAfter, seniorBefore, 1e15, "Senior should remain approximately the same");
    }

    // ============ Loss Waterfall Tests ============
    
    function test_LossWaterfallJuniorOnly() public {
        uint256 seniorAmount = 1000e6;
        uint256 mezzAmount = 500e6;
        uint256 juniorAmount = 200e6;
        
        // Deposit into all tranches
        vm.prank(user1);
        vault.deposit(seniorAmount, TrancheVault.Tranche.Senior);
        vm.prank(user2);
        vault.deposit(mezzAmount, TrancheVault.Tranche.Mezz);
        vm.prank(user3);
        vault.deposit(juniorAmount, TrancheVault.Tranche.Junior);
        
        uint256 lossAmount = 100e6; // Loss less than junior value
        
        // Apply loss
        vm.prank(owner);
        vault.applyLoss(lossAmount);
        
        (uint256 seniorAfter, uint256 mezzAfter, uint256 juniorAfter) = vault.getTrancheValues();
        
        assertEq(seniorAfter, seniorAmount, "Senior should be unchanged");
        assertEq(mezzAfter, mezzAmount, "Mezz should be unchanged");
        assertEq(juniorAfter, juniorAmount - lossAmount, "Junior should absorb loss");
    }

    function test_LossWaterfallJuniorAndMezz() public {
        uint256 seniorAmount = 1000e6;
        uint256 mezzAmount = 500e6;
        uint256 juniorAmount = 200e6;
        
        // Deposit into all tranches
        vm.prank(user1);
        vault.deposit(seniorAmount, TrancheVault.Tranche.Senior);
        vm.prank(user2);
        vault.deposit(mezzAmount, TrancheVault.Tranche.Mezz);
        vm.prank(user3);
        vault.deposit(juniorAmount, TrancheVault.Tranche.Junior);
        
        uint256 lossAmount = 400e6; // Loss exceeds junior, hits mezz
        
        // Apply loss
        vm.prank(owner);
        vault.applyLoss(lossAmount);
        
        (uint256 seniorAfter, uint256 mezzAfter, uint256 juniorAfter) = vault.getTrancheValues();
        
        assertEq(seniorAfter, seniorAmount, "Senior should be unchanged");
        assertEq(juniorAfter, 0, "Junior should be wiped out");
        assertEq(mezzAfter, mezzAmount - (lossAmount - juniorAmount), "Mezz should absorb remainder");
    }

    function test_LossWaterfallAllTranches() public {
        uint256 seniorAmount = 1000e6;
        uint256 mezzAmount = 500e6;
        uint256 juniorAmount = 200e6;
        
        // Deposit into all tranches
        vm.prank(user1);
        vault.deposit(seniorAmount, TrancheVault.Tranche.Senior);
        vm.prank(user2);
        vault.deposit(mezzAmount, TrancheVault.Tranche.Mezz);
        vm.prank(user3);
        vault.deposit(juniorAmount, TrancheVault.Tranche.Junior);
        
        uint256 lossAmount = 1500e6; // Loss exceeds junior + mezz, hits senior
        
        // Apply loss
        vm.prank(owner);
        vault.applyLoss(lossAmount);
        
        (uint256 seniorAfter, uint256 mezzAfter, uint256 juniorAfter) = vault.getTrancheValues();
        
        assertEq(juniorAfter, 0, "Junior should be wiped out");
        assertEq(mezzAfter, 0, "Mezz should be wiped out");
        uint256 expectedSenior = seniorAmount - (lossAmount - juniorAmount - mezzAmount);
        assertEq(seniorAfter, expectedSenior, "Senior should absorb remainder");
    }

    function test_LossWaterfallFromEpochUpdate() public {
        uint256 seniorAmount = 1000e6;
        uint256 mezzAmount = 500e6;
        uint256 juniorAmount = 200e6;
        
        // Deposit into all tranches
        vm.prank(user1);
        vault.deposit(seniorAmount, TrancheVault.Tranche.Senior);
        vm.prank(user2);
        vault.deposit(mezzAmount, TrancheVault.Tranche.Mezz);
        vm.prank(user3);
        vault.deposit(juniorAmount, TrancheVault.Tranche.Junior);
        
        // Update epoch with low security score (triggers loss event)
        vm.prank(owner);
        vault.updateEpoch(5000, 2000, 5000); // Security score 20% < 30% threshold
        
        (uint256 seniorAfter, uint256 mezzAfter, uint256 juniorAfter) = vault.getTrancheValues();
        
        // Loss should have been applied via waterfall
        assertLt(juniorAfter, juniorAmount, "Junior should have losses");
        // Senior and Mezz may also have losses depending on loss amount
    }

    // ============ Share Price Tests ============
    
    function test_SharePriceAfterPositiveEpoch() public {
        uint256 depositAmount = 1000e6;
        
        vm.prank(user1);
        vault.deposit(depositAmount, TrancheVault.Tranche.Senior);
        
        uint256 sharePriceBefore = vault.getSharePrice(TrancheVault.Tranche.Senior);
        
        // Update epoch with positive returns
        vm.prank(owner);
        vault.updateEpoch(7000, 8000, 7500);
        
        uint256 sharePriceAfter = vault.getSharePrice(TrancheVault.Tranche.Senior);
        
        assertGt(sharePriceAfter, sharePriceBefore, "Share price should increase after positive epoch");
    }

    function test_SharePriceAfterNegativeEpoch() public {
        uint256 depositAmount = 1000e6;
        
        vm.prank(user1);
        vault.deposit(depositAmount, TrancheVault.Tranche.Senior);
        
        uint256 sharePriceBefore = vault.getSharePrice(TrancheVault.Tranche.Senior);
        
        // Update epoch with negative returns
        vm.prank(owner);
        vault.updateEpoch(3000, 4000, 3500);
        
        uint256 sharePriceAfter = vault.getSharePrice(TrancheVault.Tranche.Senior);
        
        assertLt(sharePriceAfter, sharePriceBefore, "Share price should decrease after negative epoch");
    }

    // ============ Access Control Tests ============
    
    function test_OnlyOwnerCanUpdateEpoch() public {
        vm.prank(user1);
        vm.expectRevert("TrancheVault: Only owner can call this");
        vault.updateEpoch(5000, 5000, 5000);
    }

    function test_OnlyOwnerCanApplyLoss() public {
        vm.prank(user1);
        vm.expectRevert("TrancheVault: Only owner can call this");
        vault.applyLoss(100e6);
    }

    // ============ Edge Cases ============
    
    function test_WithdrawZeroShares() public {
        vm.prank(user1);
        vm.expectRevert("TrancheVault: Shares must be greater than 0");
        vault.withdraw(0, TrancheVault.Tranche.Senior);
    }

    function test_DepositZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("TrancheVault: Amount must be greater than 0");
        vault.deposit(0, TrancheVault.Tranche.Senior);
    }

    function test_WithdrawInsufficientShares() public {
        vm.prank(user1);
        vault.deposit(1000e6, TrancheVault.Tranche.Senior);
        
        vm.prank(user1);
        vm.expectRevert("TrancheVault: Insufficient shares");
        vault.withdraw(2000e6, TrancheVault.Tranche.Senior);
    }

    function test_GetUserValueWithNoShares() public {
        uint256 value = vault.getUserValue(user1, TrancheVault.Tranche.Senior);
        assertEq(value, 0, "User with no shares should have zero value");
    }
}

