// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title MockScoringContract
 * @dev Mock contract for providing scoring data to TrancheVault
 * @notice For testing and demo purposes - simulates external scoring oracle
 */
contract MockScoringContract {
    // Current scores (0-10000, where 10000 = 100%)
    uint256 public yieldScore;
    uint256 public securityScore;
    uint256 public liquidityScore;

    // Owner for setting scores
    address public owner;

    // Events
    event ScoresUpdated(
        uint256 yieldScore,
        uint256 securityScore,
        uint256 liquidityScore
    );

    /**
     * @dev Constructor sets initial scores and owner
     */
    constructor() {
        owner = msg.sender;
        // Initialize with neutral scores (50% = 5000)
        yieldScore = 5000;
        securityScore = 5000;
        liquidityScore = 5000;
    }

    /**
     * @dev Modifier to restrict function to owner only
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "MockScoringContract: Only owner can call this");
        _;
    }

    /**
     * @dev Set all three scores at once
     * @param _yieldScore Yield score (0-10000)
     * @param _securityScore Security score (0-10000)
     * @param _liquidityScore Liquidity score (0-10000)
     */
    function setScores(
        uint256 _yieldScore,
        uint256 _securityScore,
        uint256 _liquidityScore
    ) external onlyOwner {
        require(
            _yieldScore <= 10000 && _securityScore <= 10000 && _liquidityScore <= 10000,
            "MockScoringContract: Scores must be <= 10000"
        );
        
        yieldScore = _yieldScore;
        securityScore = _securityScore;
        liquidityScore = _liquidityScore;
        
        emit ScoresUpdated(_yieldScore, _securityScore, _liquidityScore);
    }

    /**
     * @dev Set yield score only
     * @param _yieldScore Yield score (0-10000)
     */
    function setYieldScore(uint256 _yieldScore) external onlyOwner {
        require(_yieldScore <= 10000, "MockScoringContract: Score must be <= 10000");
        yieldScore = _yieldScore;
        emit ScoresUpdated(yieldScore, securityScore, liquidityScore);
    }

    /**
     * @dev Set security score only
     * @param _securityScore Security score (0-10000)
     */
    function setSecurityScore(uint256 _securityScore) external onlyOwner {
        require(_securityScore <= 10000, "MockScoringContract: Score must be <= 10000");
        securityScore = _securityScore;
        emit ScoresUpdated(yieldScore, securityScore, liquidityScore);
    }

    /**
     * @dev Set liquidity score only
     * @param _liquidityScore Liquidity score (0-10000)
     */
    function setLiquidityScore(uint256 _liquidityScore) external onlyOwner {
        require(_liquidityScore <= 10000, "MockScoringContract: Score must be <= 10000");
        liquidityScore = _liquidityScore;
        emit ScoresUpdated(yieldScore, securityScore, liquidityScore);
    }

    /**
     * @dev Get all current scores
     * @return _yieldScore Current yield score
     * @return _securityScore Current security score
     * @return _liquidityScore Current liquidity score
     */
    function getScores()
        external
        view
        returns (
            uint256 _yieldScore,
            uint256 _securityScore,
            uint256 _liquidityScore
        )
    {
        return (yieldScore, securityScore, liquidityScore);
    }

    /**
     * @dev Simulate a positive market scenario (high yield, high security, high liquidity)
     */
    function setPositiveScenario() external onlyOwner {
        yieldScore = 7000;      // 70% yield
        securityScore = 8000;    // 80% security
        liquidityScore = 7500;   // 75% liquidity
        emit ScoresUpdated(yieldScore, securityScore, liquidityScore);
    }

    /**
     * @dev Simulate a negative market scenario (low yield, low security, low liquidity)
     */
    function setNegativeScenario() external onlyOwner {
        yieldScore = 3000;       // 30% yield
        securityScore = 2000;    // 20% security (triggers loss event)
        liquidityScore = 4000;   // 40% liquidity
        emit ScoresUpdated(yieldScore, securityScore, liquidityScore);
    }

    /**
     * @dev Simulate a neutral market scenario (baseline scores)
     */
    function setNeutralScenario() external onlyOwner {
        yieldScore = 5000;       // 50% yield
        securityScore = 5000;     // 50% security
        liquidityScore = 5000;   // 50% liquidity
        emit ScoresUpdated(yieldScore, securityScore, liquidityScore);
    }
}

