// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SwapAdapter
 * @notice Adapter for integrating with DEX protocols on Somnia
 * @dev Provides unified interface for different swap protocols with slippage protection
 */
contract SwapAdapter is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant DEX_MANAGER_ROLE = keccak256("DEX_MANAGER_ROLE");
    
    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        address recipient;
        uint256 deadline;
        bytes routeData; // Encoded route information
    }
    
    struct SwapResult {
        uint256 amountIn;
        uint256 amountOut;
        uint256 gasUsed;
        address[] path;
        bool success;
    }
    
    struct DexInfo {
        address router;
        bool active;
        uint256 feeRate; // In basis points (10000 = 100%)
        string name;
    }
    
    // DEX integrations
    mapping(bytes32 => DexInfo) public supportedDexes;
    bytes32[] public dexList;
    
    // Price oracle integration (mock for demo)
    mapping(address => uint256) public tokenPrices; // Token => Price in USD (scaled by 1e8)
    
    // Slippage protection
    uint256 public constant MAX_SLIPPAGE = 1000; // 10%
    uint256 public constant MIN_SLIPPAGE = 1; // 0.01%
    
    // Emergency controls
    bool public emergencyPause = false;
    
    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed recipient,
        bytes32 dexId
    );
    
    event DexAdded(bytes32 indexed dexId, address router, string name);
    event DexUpdated(bytes32 indexed dexId, bool active);
    event PriceUpdated(address indexed token, uint256 price);
    event EmergencyPauseToggled(bool paused);
    
    modifier onlyExecutor() {
        require(hasRole(EXECUTOR_ROLE, msg.sender), "Not authorized executor");
        _;
    }
    
    modifier onlyDexManager() {
        require(hasRole(DEX_MANAGER_ROLE, msg.sender), "Not DEX manager");
        _;
    }
    
    modifier notPaused() {
        require(!emergencyPause, "Contract is paused");
        _;
    }
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
        _grantRole(DEX_MANAGER_ROLE, msg.sender);
        
        // Add a demo DEX (could be Uniswap V2/V3 style)
        _addDemoAMM();
    }
    
    /**
     * @notice Execute a token swap through the best available route
     * @param params Swap parameters including tokens, amounts, and slippage
     * @param preferredDex Preferred DEX to use (bytes32(0) for auto-select)
     */
    function executeSwap(
        SwapParams memory params,
        bytes32 preferredDex
    ) external nonReentrant onlyExecutor notPaused returns (SwapResult memory) {
        require(params.deadline >= block.timestamp, "Swap deadline expired");
        require(params.amountIn > 0, "Invalid input amount");
        require(params.tokenIn != params.tokenOut, "Same token swap");
        
        // Validate slippage
        uint256 expectedOut = _getExpectedOutput(params.tokenIn, params.tokenOut, params.amountIn);
        uint256 slippage = ((expectedOut - params.amountOutMin) * 10000) / expectedOut;
        require(slippage >= MIN_SLIPPAGE && slippage <= MAX_SLIPPAGE, "Invalid slippage");
        
        // Select DEX
        bytes32 selectedDex = preferredDex;
        if (selectedDex == bytes32(0)) {
            selectedDex = _selectBestDex(params.tokenIn, params.tokenOut, params.amountIn);
        }
        
        require(supportedDexes[selectedDex].active, "DEX not active");
        
        // Execute swap
        uint256 gasStart = gasleft();
        
        // Transfer tokens from sender
        if (params.tokenIn != address(0)) {
            IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
        }
        
        uint256 amountOut = _executeSwapOnDex(selectedDex, params);
        
        uint256 gasUsed = gasStart - gasleft();
        
        emit SwapExecuted(
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            amountOut,
            params.recipient,
            selectedDex
        );
        
        return SwapResult({
            amountIn: params.amountIn,
            amountOut: amountOut,
            gasUsed: gasUsed,
            path: _getSwapPath(params.tokenIn, params.tokenOut),
            success: amountOut >= params.amountOutMin
        });
    }
    
    /**
     * @notice Get quote for a potential swap
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Input amount
     * @return expectedOut Expected output amount
     * @return priceImpact Price impact in basis points
     */
    function getSwapQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 expectedOut, uint256 priceImpact) {
        expectedOut = _getExpectedOutput(tokenIn, tokenOut, amountIn);
        
        // Calculate price impact (simplified)
        uint256 spotPrice = _getSpotPrice(tokenIn, tokenOut);
        uint256 executionPrice = (expectedOut * 1e18) / amountIn;
        
        if (spotPrice > executionPrice) {
            priceImpact = ((spotPrice - executionPrice) * 10000) / spotPrice;
        }
    }
    
    /**
     * @notice Get the best DEX for a given swap
     */
    function getBestDex(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (bytes32 bestDex, uint256 bestAmountOut) {
        bestDex = _selectBestDex(tokenIn, tokenOut, amountIn);
        bestAmountOut = _getExpectedOutputFromDex(bestDex, tokenIn, tokenOut, amountIn);
    }
    
    /**
     * @notice Add a new DEX integration
     */
    function addDex(
        bytes32 dexId,
        address router,
        uint256 feeRate,
        string memory name
    ) external onlyDexManager {
        require(supportedDexes[dexId].router == address(0), "DEX already exists");
        require(router != address(0), "Invalid router address");
        
        supportedDexes[dexId] = DexInfo({
            router: router,
            active: true,
            feeRate: feeRate,
            name: name
        });
        
        dexList.push(dexId);
        
        emit DexAdded(dexId, router, name);
    }
    
    /**
     * @notice Update DEX status
     */
    function updateDexStatus(bytes32 dexId, bool active) external onlyDexManager {
        require(supportedDexes[dexId].router != address(0), "DEX does not exist");
        supportedDexes[dexId].active = active;
        emit DexUpdated(dexId, active);
    }
    
    /**
     * @notice Update token price (in production, this would come from oracle)
     */
    function updateTokenPrice(address token, uint256 price) external onlyDexManager {
        tokenPrices[token] = price;
        emit PriceUpdated(token, price);
    }
    
    /**
     * @notice Emergency pause toggle
     */
    function toggleEmergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyPause = !emergencyPause;
        emit EmergencyPauseToggled(emergencyPause);
    }
    
    /**
     * @notice Execute swap on specific DEX (internal)
     */
    function _executeSwapOnDex(
        bytes32 dexId,
        SwapParams memory params
    ) internal returns (uint256 amountOut) {
        DexInfo memory dex = supportedDexes[dexId];
        
        if (dexId == keccak256("DEMO_AMM")) {
            // Demo AMM implementation
            return _executeOnDemoAMM(params);
        }
        
        // For other DEXes, implement specific integration logic
        revert("DEX integration not implemented");
    }
    
    /**
     * @notice Simple demo AMM for testing
     */
    function _executeOnDemoAMM(SwapParams memory params) internal returns (uint256 amountOut) {
        // Simplified AMM logic (constant product formula)
        // In production, this would integrate with actual DEX contracts
        
        uint256 feeAmount = (params.amountIn * 30) / 10000; // 0.3% fee
        uint256 amountInAfterFee = params.amountIn - feeAmount;
        
        // Simplified calculation - in reality would use reserves
        uint256 priceRatio = _getSpotPrice(params.tokenIn, params.tokenOut);
        amountOut = (amountInAfterFee * priceRatio) / 1e18;
        
        // Apply price impact (simplified)
        uint256 impact = (params.amountIn * 50) / 1000000; // 0.05% per unit
        amountOut = amountOut - impact;
        
        require(amountOut >= params.amountOutMin, "Insufficient output amount");
        
        // Transfer output tokens
        if (params.tokenOut != address(0)) {
            IERC20(params.tokenOut).safeTransfer(params.recipient, amountOut);
        } else {
            payable(params.recipient).transfer(amountOut);
        }
        
        return amountOut;
    }
    
    /**
     * @notice Select best DEX for swap
     */
    function _selectBestDex(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (bytes32 bestDex) {
        uint256 bestAmountOut = 0;
        
        for (uint256 i = 0; i < dexList.length; i++) {
            bytes32 dexId = dexList[i];
            if (!supportedDexes[dexId].active) continue;
            
            uint256 amountOut = _getExpectedOutputFromDex(dexId, tokenIn, tokenOut, amountIn);
            
            if (amountOut > bestAmountOut) {
                bestAmountOut = amountOut;
                bestDex = dexId;
            }
        }
        
        require(bestDex != bytes32(0), "No suitable DEX found");
    }
    
    /**
     * @notice Get expected output from specific DEX
     */
    function _getExpectedOutputFromDex(
        bytes32 dexId,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        // Simplified calculation for demo
        uint256 priceRatio = _getSpotPrice(tokenIn, tokenOut);
        uint256 feeRate = supportedDexes[dexId].feeRate;
        
        uint256 amountAfterFee = amountIn - ((amountIn * feeRate) / 10000);
        return (amountAfterFee * priceRatio) / 1e18;
    }
    
    /**
     * @notice Get expected output amount
     */
    function _getExpectedOutput(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        return _getExpectedOutputFromDex(_selectBestDex(tokenIn, tokenOut, amountIn), tokenIn, tokenOut, amountIn);
    }
    
    /**
     * @notice Get spot price between two tokens
     */
    function _getSpotPrice(address tokenIn, address tokenOut) internal view returns (uint256) {
        // Simplified price calculation using stored prices
        uint256 priceIn = tokenPrices[tokenIn];
        uint256 priceOut = tokenPrices[tokenOut];
        
        if (priceIn == 0) priceIn = 1e8; // Default $1
        if (priceOut == 0) priceOut = 1e8; // Default $1
        
        return (priceOut * 1e18) / priceIn;
    }
    
    /**
     * @notice Get swap path
     */
    function _getSwapPath(address tokenIn, address tokenOut) internal pure returns (address[] memory) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
        return path;
    }
    
    /**
     * @notice Initialize demo AMM
     */
    function _addDemoAMM() internal {
        bytes32 demoId = keccak256("DEMO_AMM");
        supportedDexes[demoId] = DexInfo({
            router: address(this),
            active: true,
            feeRate: 30, // 0.3%
            name: "Demo AMM"
        });
        dexList.push(demoId);
    }
    
    /**
     * @notice Emergency withdraw tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(token).safeTransfer(msg.sender, amount);
        }
    }
    
    receive() external payable {}
}