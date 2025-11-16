// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IERC20.sol";

/**
 * @title TrancheVault
 * @dev Tranche-Based USDC Structured Vault with three risk layers
 * @notice Senior (low risk, low yield), Mezzanine (medium risk/yield), Junior (high risk, first-loss)
 * @notice All returns and losses are applied virtually. USDC never leaves Arc blockchain.
 */
contract TrancheVault {
    // ============ Enums ============
    
    /**
     * @dev Tranche types representing different risk layers
     */
    enum Tranche {
        Senior,  // 0 - Low risk, low yield
        Mezz,    // 1 - Medium risk/yield
        Junior   // 2 - High risk, first-loss
    }

    // ============ Structs ============
    
    /**
     * @dev User position tracking shares in a specific tranche
     */
    struct UserPosition {
        uint256 shares;  // Number of shares owned by user
    }

    /**
     * @dev State of a tranche including total shares and virtual value
     */
    struct TrancheState {
        uint256 totalShares;   // Total shares minted for this tranche
        uint256 virtualValue;  // Virtual USDC value (can differ from real USDC held)
    }

    // ============ State Variables ============
    
    // USDC token interface
    IERC20 public immutable usdc;

    // Owner for access control
    address public owner;

    // User positions per tranche
    mapping(address => UserPosition) public seniorPositions;
    mapping(address => UserPosition) public mezzPositions;
    mapping(address => UserPosition) public juniorPositions;

    // Tranche states
    TrancheState public senior;
    TrancheState public mezz;
    TrancheState public junior;

    // Security score threshold for loss events (out of 10000, e.g., 3000 = 30%)
    uint256 public constant SECURITY_THRESHOLD = 3000;
    
    // Fee system (in basis points, e.g., 50 = 0.5%)
    uint256 public constant DEPOSIT_FEE_BPS = 50; // 0.5% deposit fee
    uint256 public constant WITHDRAWAL_FEE_BPS = 50; // 0.5% withdrawal fee
    
    // Reserve pool: Real USDC accumulated from fees and yield
    uint256 public reservePool;
    
    // Epoch tracking for time-based yield
    uint256 public lastEpochTimestamp;
    uint256 public constant EPOCH_DURATION = 1 days;
    uint256 public constant ANNUAL_YIELD_BPS = 500; // 5% APY in basis points

    // ============ Events ============
    
    event Deposit(
        address indexed user,
        uint256 amount,
        Tranche tranche,
        uint256 shares
    );
    
    event Withdraw(
        address indexed user,
        uint256 amount,
        Tranche tranche,
        uint256 shares
    );
    
    event EpochUpdated(
        uint256 yieldScore,
        uint256 securityScore,
        uint256 liquidityScore,
        int256 delta,
        int256 seniorDelta,
        int256 mezzDelta,
        int256 juniorDelta
    );
    
    event LossApplied(
        uint256 amount,
        uint256 juniorLoss,
        uint256 mezzLoss,
        uint256 seniorLoss
    );

    // ============ Modifiers ============
    
    /**
     * @dev Modifier to restrict function to owner only
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "TrancheVault: Only owner can call this");
        _;
    }

    /**
     * @dev Modifier to validate tranche enum value
     */
    modifier validTranche(Tranche t) {
        require(
            t == Tranche.Senior || t == Tranche.Mezz || t == Tranche.Junior,
            "TrancheVault: Invalid tranche"
        );
        _;
    }

    // ============ Constructor ============
    
    /**
     * @dev Constructor initializes the vault with USDC token
     * @param _usdc Address of USDC token contract
     */
    constructor(address _usdc) {
        require(_usdc != address(0), "TrancheVault: Invalid USDC address");
        usdc = IERC20(_usdc);
        owner = msg.sender;
        lastEpochTimestamp = block.timestamp; // Initialize epoch tracking
    }

    // ============ Deposit Logic ============
    
    /**
     * @dev Deposit USDC into a specific tranche
     * @param amount Amount of USDC to deposit (must be approved first)
     * @param t Tranche to deposit into (Senior, Mezz, or Junior)
     * @notice Mints shares based on current tranche share price
     * @notice First depositor sets seed values (1:1 ratio)
     */
    function deposit(uint256 amount, Tranche t) external validTranche(t) {
        require(amount > 0, "TrancheVault: Amount must be greater than 0");
        
        // Transfer USDC from user
        require(
            usdc.transferFrom(msg.sender, address(this), amount),
            "TrancheVault: Transfer failed"
        );
        
        // Calculate and collect deposit fee
        uint256 fee = (amount * DEPOSIT_FEE_BPS) / 10000;
        uint256 depositAmount = amount - fee;
        reservePool += fee; // Add fee to reserve pool
        
        // Get tranche state
        TrancheState storage trancheState = _getTrancheState(t);
        UserPosition storage position = _getUserPosition(msg.sender, t);
        
        // Calculate shares to mint (based on net deposit amount)
        uint256 shares;
        if (trancheState.totalShares == 0) {
            // First depositor: 1:1 ratio
            shares = depositAmount;
        } else {
            // Subsequent depositors: shares = amount * totalShares / virtualValue
            shares = (depositAmount * trancheState.totalShares) / trancheState.virtualValue;
        }
        
        require(shares > 0, "TrancheVault: Shares must be greater than 0");
        
        // Update state
        position.shares += shares;
        trancheState.totalShares += shares;
        trancheState.virtualValue += depositAmount; // Virtual value increases by net deposit
        
        emit Deposit(msg.sender, depositAmount, t, shares);
    }

    // ============ Withdraw Logic ============
    
    /**
     * @dev Withdraw USDC from a specific tranche
     * @param shares Number of shares to burn
     * @param t Tranche to withdraw from
     * @notice Converts shares into virtual USDC based on current tranche value
     * @notice Transfers real USDC to user
     */
    function withdraw(uint256 shares, Tranche t) external validTranche(t) {
        require(shares > 0, "TrancheVault: Shares must be greater than 0");
        
        // Get tranche state and user position
        TrancheState storage trancheState = _getTrancheState(t);
        UserPosition storage position = _getUserPosition(msg.sender, t);
        
        require(
            position.shares >= shares,
            "TrancheVault: Insufficient shares"
        );
        require(
            trancheState.totalShares > 0,
            "TrancheVault: No shares in tranche"
        );
        
        // Calculate USDC value: userValue = shares * virtualValue / totalShares
        uint256 userValue = (shares * trancheState.virtualValue) / trancheState.totalShares;
        
        require(
            userValue > 0,
            "TrancheVault: Withdrawal value must be greater than 0"
        );
        
        // Get real USDC balance
        uint256 realUSDCBalance = usdc.balanceOf(address(this));
        
        // Calculate withdrawal amount (can use reserve pool if needed)
        uint256 actualWithdrawAmount;
        if (userValue > realUSDCBalance) {
            // Need to use reserve pool
            uint256 needed = userValue - realUSDCBalance;
            if (needed <= reservePool) {
                // Reserve can cover it - withdraw full amount
                reservePool -= needed;
                actualWithdrawAmount = userValue;
            } else {
                // Reserve can't cover fully - use what's available
                actualWithdrawAmount = realUSDCBalance + reservePool;
                reservePool = 0;
            }
        } else {
            // Normal case: enough real USDC
            actualWithdrawAmount = userValue;
        }
        
        require(
            actualWithdrawAmount > 0,
            "TrancheVault: Withdrawal amount must be greater than 0"
        );
        
        // Calculate and collect withdrawal fee
        uint256 fee = (actualWithdrawAmount * WITHDRAWAL_FEE_BPS) / 10000;
        uint256 netWithdraw = actualWithdrawAmount - fee;
        reservePool += fee; // Add fee back to reserve
        
        // Check vault has enough real USDC (including reserve if used)
        require(
            realUSDCBalance >= actualWithdrawAmount || 
            (realUSDCBalance + reservePool >= actualWithdrawAmount),
            "TrancheVault: Insufficient vault balance"
        );
        
        // Update state (burn shares, decrease virtual value)
        position.shares -= shares;
        trancheState.totalShares -= shares;
        trancheState.virtualValue -= userValue; // Decrease by full userValue (virtual accounting)
        
        // Transfer net withdrawal amount to user (after fee)
        require(
            usdc.transfer(msg.sender, netWithdraw),
            "TrancheVault: Transfer failed"
        );
        
        emit Withdraw(msg.sender, netWithdraw, t, shares);
    }

    // ============ Epoch Update System ============
    
    /**
     * @dev Update epoch with new scoring data and apply returns to tranches
     * @param yieldScore Yield score (0-10000, e.g., 5000 = 50%)
     * @param securityScore Security score (0-10000)
     * @param liquidityScore Liquidity score (0-10000)
     * @notice Only owner can call this function
     * @notice Computes combined score and applies differential returns to each tranche
     */
    function updateEpoch(
        uint256 yieldScore,
        uint256 securityScore,
        uint256 liquidityScore
    ) external onlyOwner {
        require(
            yieldScore <= 10000 && securityScore <= 10000 && liquidityScore <= 10000,
            "TrancheVault: Scores must be <= 10000"
        );
        
        // Calculate time-based yield accrual
        if (lastEpochTimestamp > 0) {
            uint256 timeElapsed = block.timestamp - lastEpochTimestamp;
            if (timeElapsed > 0) {
                uint256 totalValue = totalVaultValue();
                // Calculate yield: (totalValue * annualYield * timeElapsed) / (365 days * 10000)
                uint256 timeBasedYield = (totalValue * ANNUAL_YIELD_BPS * timeElapsed) / (365 days * 10000);
                reservePool += timeBasedYield; // Add time-based yield to reserve
            }
        }
        lastEpochTimestamp = block.timestamp;
        
        // (A) Compute combined global score
        // Weighted formula: yield 40%, security 40%, liquidity 20%
        uint256 combinedScore = (yieldScore * 40 + securityScore * 40 + liquidityScore * 20) / 100;
        
        // (B) Determine returns: Convert score → delta return
        // Baseline is 5000 (50%), so delta = combinedScore - 5000
        // Positive delta = positive returns, negative delta = losses
        int256 delta = int256(combinedScore) - 5000;
        
        // Apply tranche-specific multipliers
        // Senior gets smallest return (safe): delta * 50 / 1000 = 5% of delta
        // Mezz medium: delta * 100 / 1000 = 10% of delta
        // Junior highest (risk): delta * 200 / 1000 = 20% of delta
        int256 seniorDelta = (delta * 50) / 1000;
        int256 mezzDelta = (delta * 100) / 1000;
        int256 juniorDelta = (delta * 200) / 1000;
        
        // (C) Update virtual values
        senior.virtualValue = _applyDelta(senior.virtualValue, seniorDelta);
        mezz.virtualValue = _applyDelta(mezz.virtualValue, mezzDelta);
        junior.virtualValue = _applyDelta(junior.virtualValue, juniorDelta);
        
        emit EpochUpdated(
            yieldScore,
            securityScore,
            liquidityScore,
            delta,
            seniorDelta,
            mezzDelta,
            juniorDelta
        );
        
        // (D) Check for loss event if security score is below threshold
        if (securityScore < SECURITY_THRESHOLD) {
            // Calculate loss amount based on how far below threshold
            // Loss = (threshold - securityScore) * totalVaultValue / threshold
            uint256 totalValue = totalVaultValue();
            if (totalValue > 0) {
                uint256 lossAmount = ((SECURITY_THRESHOLD - securityScore) * totalValue) / SECURITY_THRESHOLD;
                if (lossAmount > 0) {
                    applyLoss(lossAmount);
                }
            }
        }
    }

    // ============ Loss Waterfall (First-Loss Protection) ============
    
    /**
     * @dev Apply loss using waterfall structure (Junior → Mezz → Senior)
     * @param lossAmount Amount of loss to apply
     * @notice Loss hits Junior first, then Mezz, then Senior
     * @notice Only owner can call this (or it's called automatically in updateEpoch)
     */
    function applyLoss(uint256 lossAmount) public onlyOwner {
        require(lossAmount > 0, "TrancheVault: Loss amount must be greater than 0");
        
        uint256 juniorLoss = 0;
        uint256 mezzLoss = 0;
        uint256 seniorLoss = 0;
        
        uint256 remainingLoss = lossAmount;
        
        // Loss hits Junior first
        if (junior.virtualValue >= remainingLoss) {
            juniorLoss = remainingLoss;
            junior.virtualValue -= remainingLoss;
            remainingLoss = 0;
        } else {
            juniorLoss = junior.virtualValue;
            remainingLoss -= junior.virtualValue;
            junior.virtualValue = 0;
        }
        
        // If loss remains, hit Mezz
        if (remainingLoss > 0 && mezz.virtualValue > 0) {
            if (mezz.virtualValue >= remainingLoss) {
                mezzLoss = remainingLoss;
                mezz.virtualValue -= remainingLoss;
                remainingLoss = 0;
            } else {
                mezzLoss = mezz.virtualValue;
                remainingLoss -= mezz.virtualValue;
                mezz.virtualValue = 0;
            }
        }
        
        // If loss still remains, hit Senior (bounded at zero)
        if (remainingLoss > 0 && senior.virtualValue > 0) {
            if (senior.virtualValue >= remainingLoss) {
                seniorLoss = remainingLoss;
                senior.virtualValue -= remainingLoss;
            } else {
                seniorLoss = senior.virtualValue;
                senior.virtualValue = 0;
            }
        }
        
        emit LossApplied(lossAmount, juniorLoss, mezzLoss, seniorLoss);
    }

    // ============ Utility Functions ============
    
    /**
     * @dev Get virtual values of all three tranches
     * @return seniorValue Virtual value of Senior tranche
     * @return mezzValue Virtual value of Mezzanine tranche
     * @return juniorValue Virtual value of Junior tranche
     */
    function getTrancheValues()
        public
        view
        returns (
            uint256 seniorValue,
            uint256 mezzValue,
            uint256 juniorValue
        )
    {
        return (senior.virtualValue, mezz.virtualValue, junior.virtualValue);
    }

    /**
     * @dev Get user's virtual USDC value in a specific tranche
     * @param user Address of the user
     * @param t Tranche to query
     * @return User's virtual USDC value in the tranche
     */
    function getUserValue(address user, Tranche t)
        public
        view
        validTranche(t)
        returns (uint256)
    {
        UserPosition memory position = _getUserPosition(user, t);
        TrancheState memory trancheState = _getTrancheState(t);
        
        if (trancheState.totalShares == 0) {
            return 0;
        }
        
        // userValue = shares * virtualValue / totalShares
        return (position.shares * trancheState.virtualValue) / trancheState.totalShares;
    }

    /**
     * @dev Get total virtual vault value across all tranches
     * @return Total virtual value
     */
    function totalVaultValue() public view returns (uint256) {
        return senior.virtualValue + mezz.virtualValue + junior.virtualValue;
    }
    
    /**
     * @dev Get reserve pool balance
     * @return Reserve pool amount in USDC
     */
    function getReservePool() public view returns (uint256) {
        return reservePool;
    }
    
    /**
     * @dev Get total real USDC balance (contract balance + reserve pool)
     * @return Total real USDC available
     */
    function getTotalRealUSDC() public view returns (uint256) {
        return usdc.balanceOf(address(this)) + reservePool;
    }

    /**
     * @dev Get user's shares in a specific tranche
     * @param user Address of the user
     * @param t Tranche to query
     * @return User's shares in the tranche
     */
    function getUserShares(address user, Tranche t)
        public
        view
        validTranche(t)
        returns (uint256)
    {
        UserPosition memory position = _getUserPosition(user, t);
        return position.shares;
    }

    /**
     * @dev Get share price for a specific tranche
     * @param t Tranche to query
     * @return Share price (virtualValue / totalShares, scaled by 1e18)
     */
    function getSharePrice(Tranche t)
        public
        view
        validTranche(t)
        returns (uint256)
    {
        TrancheState memory trancheState = _getTrancheState(t);
        if (trancheState.totalShares == 0) {
            return 1e18; // Default 1:1 price
        }
        return (trancheState.virtualValue * 1e18) / trancheState.totalShares;
    }

    // ============ Internal Helper Functions ============
    
    /**
     * @dev Get reference to tranche state struct
     * @param t Tranche enum
     * @return Reference to TrancheState storage
     */
    function _getTrancheState(Tranche t)
        internal
        view
        returns (TrancheState storage)
    {
        if (t == Tranche.Senior) {
            return senior;
        } else if (t == Tranche.Mezz) {
            return mezz;
        } else {
            return junior;
        }
    }

    /**
     * @dev Get reference to user position struct
     * @param user Address of the user
     * @param t Tranche enum
     * @return Reference to UserPosition storage
     */
    function _getUserPosition(address user, Tranche t)
        internal
        view
        returns (UserPosition storage)
    {
        if (t == Tranche.Senior) {
            return seniorPositions[user];
        } else if (t == Tranche.Mezz) {
            return mezzPositions[user];
        } else {
            return juniorPositions[user];
        }
    }

    /**
     * @dev Apply delta (positive or negative) to a value
     * @param value Current value
     * @param delta Change to apply (can be negative)
     * @return New value after applying delta
     */
    function _applyDelta(uint256 value, int256 delta) internal pure returns (uint256) {
        if (delta >= 0) {
            // Positive delta: add to value
            return value + uint256(delta);
        } else {
            // Negative delta: subtract from value (bounded at zero)
            int256 newValue = int256(value) + delta; // delta is negative, so this subtracts
            if (newValue < 0) {
                return 0;
            }
            return uint256(newValue);
        }
    }
}

