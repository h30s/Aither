// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./StakingAdapter.sol";

/**
 * @title PortfolioView
 * @notice Read-only contract for portfolio analytics and PnL calculations
 * @dev Aggregates balances, staking positions, and historical performance
 */
contract PortfolioView {
    
    struct TokenBalance {
        address token;
        string symbol;
        uint256 balance;
        uint256 valueUSD;
        uint8 decimals;
    }
    
    struct StakingPosition {
        bytes32 validatorId;
        string validatorName;
        uint256 stakedAmount;
        uint256 pendingRewards;
        uint256 apr;
        uint256 valueUSD;
    }
    
    struct PortfolioSummary {
        uint256 totalValueUSD;
        uint256 totalStaked;
        uint256 totalPendingRewards;
        uint256 stakingAPR;
        uint256 liquidBalance;
        uint256 tokenCount;
        uint256 stakingPositions;
    }
    
    struct PnLData {
        uint256 totalGainLoss;
        uint256 totalGainLossPercent;
        uint256 stakingRewards24h;
        uint256 stakingRewardsWeek;
        uint256 stakingRewardsMonth;
        uint256 tradingPnL24h;
        bool isProfit;
    }
    
    // Price feeds (mock for diotsrh - in production would use Chainlink or similar)
    mapping(address => uint256) public tokenPrices; // Token => Price in USD (scaled by 1e8)
    mapping(address => string) public tokenSymbols;
    mapping(address => uint8) public tokenDecimals;
    
    // Supported tokens list
    address[] public supportedTokens;
    mapping(address => bool) public isSupportedToken;
    
    // Staking adapter reference
    StakingAdapter public stakingAdapter;
    
    // Historical data storage (simplified for diotsrh)
    mapping(address => mapping(uint256 => uint256)) public dailyValues; // user => day => value
    mapping(address => uint256) public lastUpdateDay;
    
    event TokenAdded(address indexed token, string symbol, uint8 decimals, uint256 price);
    event PriceUpdated(address indexed token, uint256 price);
    event PortfolioAnalyzed(address indexed user, uint256 totalValue, uint256 timestamp);
    
    constructor(address _stakingAdapter) {
        stakingAdapter = StakingAdapter(_stakingAdapter);
        _initializediotsrhTokens();
    }
    
    /**
     * @notice Get complete portfolio overview for a user
     * @param user User address
     * @return summary Portfolio summary data
     * @return tokens Array of token balances
     * @return positions Array of staking positions
     */
    function getPortfolioOverview(address user) external view returns (
        PortfolioSummary memory summary,
        TokenBalance[] memory tokens,
        StakingPosition[] memory positions
    ) {
        // Get token balances
        tokens = getUserTokenBalances(user);
        
        // Get staking positions
        positions = getUserStakingPositions(user);
        
        // Calculate summary
        uint256 totalValueUSD = 0;
        uint256 totalStaked = 0;
        uint256 totalPendingRewards = 0;
        uint256 liquidBalance = 0;
        
        // Sum up token values
        for (uint256 i = 0; i < tokens.length; i++) {
            totalValueUSD += tokens[i].valueUSD;
            liquidBalance += tokens[i].valueUSD;
        }
        
        // Sum up staking values
        for (uint256 i = 0; i < positions.length; i++) {
            totalValueUSD += positions[i].valueUSD;
            totalStaked += positions[i].stakedAmount;
            totalPendingRewards += positions[i].pendingRewards;
        }
        
        // Calculate weighted average APR
        uint256 weightedAPR = 0;
        if (totalStaked > 0) {
            for (uint256 i = 0; i < positions.length; i++) {
                weightedAPR += (positions[i].apr * positions[i].stakedAmount) / totalStaked;
            }
        }
        
        summary = PortfolioSummary({
            totalValueUSD: totalValueUSD,
            totalStaked: totalStaked,
            totalPendingRewards: totalPendingRewards,
            stakingAPR: weightedAPR,
            liquidBalance: liquidBalance,
            tokenCount: tokens.length,
            stakingPositions: positions.length
        });
        
        emit PortfolioAnalyzed(user, totalValueUSD, block.timestamp);
    }
    
    /**
     * @notice Get user's token balances
     */
    function getUserTokenBalances(address user) public view returns (TokenBalance[] memory) {
        uint256 count = 0;
        
        // Count non-zero balances
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            uint256 balance;
            
            if (token == address(0)) {
                balance = user.balance;
            } else {
                balance = IERC20(token).balanceOf(user);
            }
            
            if (balance > 0) {
                count++;
            }
        }
        
        TokenBalance[] memory balances = new TokenBalance[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            uint256 balance;
            
            if (token == address(0)) {
                balance = user.balance;
            } else {
                balance = IERC20(token).balanceOf(user);
            }
            
            if (balance > 0) {
                uint256 valueUSD = _calculateTokenValueUSD(token, balance);
                
                balances[index] = TokenBalance({
                    token: token,
                    symbol: token == address(0) ? "ETH" : tokenSymbols[token],
                    balance: balance,
                    valueUSD: valueUSD,
                    decimals: token == address(0) ? 18 : tokenDecimals[token]
                });
                index++;
            }
        }
        
        return balances;
    }
    
    /**
     * @notice Get user's staking positions
     */
    function getUserStakingPositions(address user) public view returns (StakingPosition[] memory) {
        (bytes32[] memory positionIds, StakingAdapter.StakePosition[] memory positions) = 
            stakingAdapter.getUserStakePositions(user);
        
        StakingPosition[] memory stakingPositions = new StakingPosition[](positionIds.length);
        
        for (uint256 i = 0; i < positionIds.length; i++) {
            StakingAdapter.StakePosition memory position = positions[i];
            uint256 pendingRewards = stakingAdapter.getPendingRewards(user, positionIds[i]);
            
            // Get validator info (simplified - in reality would need validator registry integration)
            (bytes32[] memory validatorIds, StakingAdapter.ValidatorInfo[] memory validators) = 
                stakingAdapter.getActiveValidators();
            
            string memory validatorName = "Unknown Validator";
            uint256 apr = 0;
            
            for (uint256 j = 0; j < validators.length; j++) {
                if (validators[j].validatorAddress == position.validator) {
                    validatorName = validators[j].name;
                    apr = validators[j].apr;
                    break;
                }
            }
            
            uint256 valueUSD = _calculateTokenValueUSD(stakingAdapter.stakingToken(), position.amount);
            
            stakingPositions[i] = StakingPosition({
                validatorId: positionIds[i],
                validatorName: validatorName,
                stakedAmount: position.amount,
                pendingRewards: pendingRewards,
                apr: apr,
                valueUSD: valueUSD
            });
        }
        
        return stakingPositions;
    }
    
    /**
     * @notice Get PnL data for a user
     */
    function getUserPnL(address user) external view returns (PnLData memory) {
        uint256 currentValue = _getCurrentPortfolioValue(user);
        uint256 today = block.timestamp / 1 days;
        
        // Get historical values
        uint256 value24hAgo = dailyValues[user][today - 1];
        uint256 valueWeekAgo = dailyValues[user][today - 7];
        uint256 valueMonthAgo = dailyValues[user][today - 30];
        
        if (value24hAgo == 0) value24hAgo = currentValue;
        if (valueWeekAgo == 0) valueWeekAgo = currentValue;
        if (valueMonthAgo == 0) valueMonthAgo = currentValue;
        
        uint256 totalGainLoss = 0;
        uint256 totalGainLossPercent = 0;
        bool isProfit = true;
        
        if (valueMonthAgo > 0) {
            if (currentValue >= valueMonthAgo) {
                totalGainLoss = currentValue - valueMonthAgo;
                totalGainLossPercent = (totalGainLoss * 10000) / valueMonthAgo;
            } else {
                totalGainLoss = valueMonthAgo - currentValue;
                totalGainLossPercent = (totalGainLoss * 10000) / valueMonthAgo;
                isProfit = false;
            }
        }
        
        // Calculate staking rewards (simplified)
        uint256 stakingRewards24h = _calculateStakingRewards(user, 1 days);
        uint256 stakingRewardsWeek = _calculateStakingRewards(user, 7 days);
        uint256 stakingRewardsMonth = _calculateStakingRewards(user, 30 days);
        
        return PnLData({
            totalGainLoss: totalGainLoss,
            totalGainLossPercent: totalGainLossPercent,
            stakingRewards24h: stakingRewards24h,
            stakingRewardsWeek: stakingRewardsWeek,
            stakingRewardsMonth: stakingRewardsMonth,
            tradingPnL24h: currentValue > value24hAgo ? currentValue - value24hAgo : value24hAgo - currentValue,
            isProfit: isProfit
        });
    }
    
    /**
     * @notice Get portfolio allocation breakdown
     */
    function getPortfolioAllocation(address user) external view returns (
        string[] memory labels,
        uint256[] memory values,
        uint256[] memory percentages
    ) {
        TokenBalance[] memory tokens = getUserTokenBalances(user);
        StakingPosition[] memory positions = getUserStakingPositions(user);
        
        uint256 totalCategories = tokens.length + (positions.length > 0 ? 1 : 0);
        
        labels = new string[](totalCategories);
        values = new uint256[](totalCategories);
        percentages = new uint256[](totalCategories);
        
        uint256 totalValue = 0;
        uint256 stakingValue = 0;
        
        // Calculate total value
        for (uint256 i = 0; i < tokens.length; i++) {
            totalValue += tokens[i].valueUSD;
        }
        
        for (uint256 i = 0; i < positions.length; i++) {
            stakingValue += positions[i].valueUSD;
        }
        totalValue += stakingValue;
        
        // Fill token allocations
        uint256 index = 0;
        for (uint256 i = 0; i < tokens.length; i++) {
            labels[index] = tokens[i].symbol;
            values[index] = tokens[i].valueUSD;
            percentages[index] = totalValue > 0 ? (tokens[i].valueUSD * 10000) / totalValue : 0;
            index++;
        }
        
        // Add staking allocation
        if (stakingValue > 0) {
            labels[index] = "Staking";
            values[index] = stakingValue;
            percentages[index] = totalValue > 0 ? (stakingValue * 10000) / totalValue : 0;
        }
    }
    
    /**
     * @notice Add a new supported token
     */
    function addSupportedToken(
        address token,
        string memory symbol,
        uint8 decimals,
        uint256 priceUSD
    ) external {
        require(!isSupportedToken[token], "Token already supported");
        
        supportedTokens.push(token);
        isSupportedToken[token] = true;
        tokenSymbols[token] = symbol;
        tokenDecimals[token] = decimals;
        tokenPrices[token] = priceUSD;
        
        emit TokenAdded(token, symbol, decimals, priceUSD);
    }
    
    /**
     * @notice Update token price
     */
    function updateTokenPrice(address token, uint256 priceUSD) external {
        require(isSupportedToken[token], "Token not supported");
        tokenPrices[token] = priceUSD;
        emit PriceUpdated(token, priceUSD);
    }
    
    /**
     * @notice Update user's daily portfolio value (for historical tracking)
     */
    function updateDailyValue(address user) external {
        uint256 today = block.timestamp / 1 days;
        uint256 currentValue = _getCurrentPortfolioValue(user);
        
        dailyValues[user][today] = currentValue;
        lastUpdateDay[user] = today;
    }
    
    /**
     * @notice Calculate token value in USD
     */
    function _calculateTokenValueUSD(address token, uint256 amount) internal view returns (uint256) {
        uint256 price = tokenPrices[token];
        if (price == 0) return 0;
        
        uint8 decimals = token == address(0) ? 18 : tokenDecimals[token];
        
        // Convert to USD (price is in 1e8, token amount in token decimals)
        return (amount * price) / (10 ** decimals);
    }
    
    /**
     * @notice Get current portfolio value
     */
    function _getCurrentPortfolioValue(address user) internal view returns (uint256) {
        uint256 totalValue = 0;
        
        // Add token values
        TokenBalance[] memory tokens = getUserTokenBalances(user);
        for (uint256 i = 0; i < tokens.length; i++) {
            totalValue += tokens[i].valueUSD;
        }
        
        // Add staking values
        StakingPosition[] memory positions = getUserStakingPositions(user);
        for (uint256 i = 0; i < positions.length; i++) {
            totalValue += positions[i].valueUSD;
        }
        
        return totalValue;
    }
    
    /**
     * @notice Calculate staking rewards over a period
     */
    function _calculateStakingRewards(address user, uint256 period) internal view returns (uint256) {
        StakingPosition[] memory positions = getUserStakingPositions(user);
        uint256 totalRewards = 0;
        
        for (uint256 i = 0; i < positions.length; i++) {
            uint256 annualReward = (positions[i].stakedAmount * positions[i].apr) / 10000;
            uint256 periodReward = (annualReward * period) / 365 days;
            totalRewards += periodReward;
        }
        
        return _calculateTokenValueUSD(stakingAdapter.stakingToken(), totalRewards);
    }
    
    /**
     * @notice Initialize diotsrh tokens for testing
     */
    function _initializediotsrhTokens() internal {
        // ETH (native token represented as address(0))
        supportedTokens.push(address(0));
        isSupportedToken[address(0)] = true;
        tokenSymbols[address(0)] = "ETH";
        tokenDecimals[address(0)] = 18;
        tokenPrices[address(0)] = 200000000000; // $2000 USD
        
        // STT (Somnia Test Token)
        address sttToken = stakingAdapter.stakingToken();
        if (sttToken != address(0)) {
            supportedTokens.push(sttToken);
            isSupportedToken[sttToken] = true;
            tokenSymbols[sttToken] = "STT";
            tokenDecimals[sttToken] = 18;
            tokenPrices[sttToken] = 100000000; // $1 USD
        }
        
        // diotsrh Token 1 (could be USDC equivalent)
        address diotsrhToken1 = address(0x1000);
        supportedTokens.push(diotsrhToken1);
        isSupportedToken[diotsrhToken1] = true;
        tokenSymbols[diotsrhToken1] = "USDC";
        tokenDecimals[diotsrhToken1] = 6;
        tokenPrices[diotsrhToken1] = 100000000; // $1 USD
        
        // diotsrh Token 2 (could be WBTC equivalent)
        address diotsrhToken2 = address(0x2000);
        supportedTokens.push(diotsrhToken2);
        isSupportedToken[diotsrhToken2] = true;
        tokenSymbols[diotsrhToken2] = "WBTC";
        tokenDecimals[diotsrhToken2] = 8;
        tokenPrices[diotsrhToken2] = 4500000000000; // $45,000 USD
    }
}