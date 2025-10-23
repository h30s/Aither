// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/**
 * @title ExecutionProxy
 * @notice Secure proxy for executing batched transactions with safety checks
 * @dev Includes allowlists, reentrancy guards, and detailed event emission
 */
contract ExecutionProxy is AccessControl, ReentrancyGuard {
    using Address for address;

    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant ALLOWLIST_MANAGER_ROLE = keccak256("ALLOWLIST_MANAGER_ROLE");
    
    struct Call {
        address target;
        bytes data;
        uint256 value;
    }
    
    struct ExecutionResult {
        bool success;
        bytes returnData;
        uint256 gasUsed;
    }
    
    // Contract allowlists
    mapping(address => bool) public allowedContracts;
    
    // Function selector allowlists per contract
    mapping(address => mapping(bytes4 => bool)) public allowedFunctions;
    
    // Global execution limits
    uint256 public maxCallsPerBatch = 10;
    uint256 public maxValuePerCall = 1000 ether;
    
    // Per-user execution limits
    mapping(address => uint256) public userDailySpent;
    mapping(address => uint256) public userLastResetDay;
    mapping(address => uint256) public userDailyLimit;
    
    event CallExecuted(
        bytes32 indexed traceId,
        address indexed executor,
        address indexed target,
        bytes4 selector,
        uint256 value,
        uint256 gasUsed,
        bool success
    );
    
    event BatchExecuted(
        bytes32 indexed traceId,
        address indexed executor,
        uint256 totalCalls,
        uint256 successfulCalls,
        uint256 totalGasUsed
    );
    
    event ContractAllowlisted(address indexed target, bool allowed);
    event FunctionAllowlisted(address indexed target, bytes4 selector, bool allowed);
    event LimitsUpdated(uint256 maxCallsPerBatch, uint256 maxValuePerCall);
    event UserLimitSet(address indexed user, uint256 dailyLimit);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
        _grantRole(ALLOWLIST_MANAGER_ROLE, msg.sender);
    }
    
    modifier onlyExecutor() {
        require(hasRole(EXECUTOR_ROLE, msg.sender), "Not authorized executor");
        _;
    }
    
    modifier onlyAllowlistManager() {
        require(hasRole(ALLOWLIST_MANAGER_ROLE, msg.sender), "Not allowlist manager");
        _;
    }
    
    /**
     * @notice Execute a batch of calls atomically
     * @param calls Array of calls to execute
     * @param traceId Unique identifier for tracking this execution
     * @return results Array of execution results
     */
    function executeBatch(
        Call[] memory calls,
        bytes32 traceId
    ) external payable nonReentrant onlyExecutor returns (ExecutionResult[] memory results) {
        require(calls.length > 0 && calls.length <= maxCallsPerBatch, "Invalid batch size");
        require(traceId != bytes32(0), "Invalid trace ID");
        
        _resetDailyLimitIfNeeded(msg.sender);
        
        uint256 totalValue = 0;
        for (uint256 i = 0; i < calls.length; i++) {
            totalValue += calls[i].value;
        }
        
        require(msg.value >= totalValue, "Insufficient ETH sent");
        require(userDailySpent[msg.sender] + totalValue <= userDailyLimit[msg.sender], "Daily limit exceeded");
        
        results = new ExecutionResult[](calls.length);
        uint256 totalGasUsed = 0;
        uint256 successfulCalls = 0;
        
        for (uint256 i = 0; i < calls.length; i++) {
            Call memory call = calls[i];
            
            // Security checks
            require(allowedContracts[call.target], "Target not allowed");
            require(call.value <= maxValuePerCall, "Value exceeds limit");
            
            bytes4 selector = bytes4(call.data);
            require(allowedFunctions[call.target][selector], "Function not allowed");
            
            uint256 gasStart = gasleft();
            
            (bool success, bytes memory returnData) = call.target.call{value: call.value}(call.data);
            
            uint256 gasUsed = gasStart - gasleft();
            totalGasUsed += gasUsed;
            
            results[i] = ExecutionResult({
                success: success,
                returnData: returnData,
                gasUsed: gasUsed
            });
            
            if (success) {
                successfulCalls++;
            }
            
            emit CallExecuted(
                traceId,
                msg.sender,
                call.target,
                selector,
                call.value,
                gasUsed,
                success
            );
        }
        
        userDailySpent[msg.sender] += totalValue;
        
        emit BatchExecuted(traceId, msg.sender, calls.length, successfulCalls, totalGasUsed);
        
        // Refund excess ETH
        uint256 refund = msg.value - totalValue;
        if (refund > 0) {
            payable(msg.sender).transfer(refund);
        }
    }
    
    /**
     * @notice Simulate batch execution without state changes
     */
    function simulateBatch(
        Call[] memory calls
    ) external view returns (ExecutionResult[] memory results) {
        require(calls.length > 0 && calls.length <= maxCallsPerBatch, "Invalid batch size");
        
        results = new ExecutionResult[](calls.length);
        
        for (uint256 i = 0; i < calls.length; i++) {
            Call memory call = calls[i];
            
            // Check allowlists
            if (!allowedContracts[call.target] || !allowedFunctions[call.target][bytes4(call.data)]) {
                results[i] = ExecutionResult({
                    success: false,
                    returnData: bytes("Not allowed"),
                    gasUsed: 0
                });
                continue;
            }
            
            // Simulate call
            (bool success, bytes memory returnData) = call.target.staticcall(call.data);
            
            results[i] = ExecutionResult({
                success: success,
                returnData: returnData,
                gasUsed: 21000 // Estimated gas
            });
        }
    }
    
    /**
     * @notice Add contract to allowlist
     */
    function setContractAllowed(address target, bool allowed) external onlyAllowlistManager {
        allowedContracts[target] = allowed;
        emit ContractAllowlisted(target, allowed);
    }
    
    /**
     * @notice Add function to allowlist for a specific contract
     */
    function setFunctionAllowed(
        address target,
        bytes4 selector,
        bool allowed
    ) external onlyAllowlistManager {
        allowedFunctions[target][selector] = allowed;
        emit FunctionAllowlisted(target, selector, allowed);
    }
    
    /**
     * @notice Batch allowlist multiple contracts
     */
    function batchSetContractsAllowed(
        address[] memory targets,
        bool[] memory allowed
    ) external onlyAllowlistManager {
        require(targets.length == allowed.length, "Array length mismatch");
        
        for (uint256 i = 0; i < targets.length; i++) {
            allowedContracts[targets[i]] = allowed[i];
            emit ContractAllowlisted(targets[i], allowed[i]);
        }
    }
    
    /**
     * @notice Update execution limits
     */
    function updateLimits(
        uint256 _maxCallsPerBatch,
        uint256 _maxValuePerCall
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxCallsPerBatch = _maxCallsPerBatch;
        maxValuePerCall = _maxValuePerCall;
        emit LimitsUpdated(_maxCallsPerBatch, _maxValuePerCall);
    }
    
    /**
     * @notice Set daily limit for a user
     */
    function setUserDailyLimit(address user, uint256 limit) external onlyRole(DEFAULT_ADMIN_ROLE) {
        userDailyLimit[user] = limit;
        emit UserLimitSet(user, limit);
    }
    
    /**
     * @notice Get user's current daily spending info
     */
    function getUserSpendingInfo(address user) external view returns (
        uint256 dailyLimit,
        uint256 dailySpent,
        uint256 remaining
    ) {
        dailyLimit = userDailyLimit[user];
        
        // Check if limit needs reset
        uint256 today = block.timestamp / 1 days;
        if (userLastResetDay[user] < today) {
            dailySpent = 0;
        } else {
            dailySpent = userDailySpent[user];
        }
        
        remaining = dailyLimit > dailySpent ? dailyLimit - dailySpent : 0;
    }
    
    /**
     * @notice Reset daily limit if needed
     */
    function _resetDailyLimitIfNeeded(address user) internal {
        uint256 today = block.timestamp / 1 days;
        if (userLastResetDay[user] < today) {
            userDailySpent[user] = 0;
            userLastResetDay[user] = today;
        }
    }
    
    /**
     * @notice Emergency pause function
     */
    function emergencyWithdraw() external onlyRole(DEFAULT_ADMIN_ROLE) {
        payable(msg.sender).transfer(address(this).balance);
    }
    
    receive() external payable {}
}