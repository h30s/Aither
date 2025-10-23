// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./AgentRegistry.sol";
import "./ExecutionProxy.sol";

/**
 * @title AgentOrchestrator
 * @notice Coordinates multi-agent operations and manages execution flow
 * @dev Acts as the main entry point for agent-driven transactions
 */
contract AgentOrchestrator is AccessControl, ReentrancyGuard {
    bytes32 public constant ORCHESTRATOR_ROLE = keccak256("ORCHESTRATOR_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");
    
    AgentRegistry public immutable agentRegistry;
    ExecutionProxy public immutable executionProxy;
    
    struct Operation {
        bytes32 operationId;
        address initiator;
        bytes32[] agentIds;
        string intent;
        uint256 maxGas;
        uint256 maxValue;
        uint256 deadline;
        bool executed;
        uint256 createdAt;
    }
    
    struct ExecutionPlan {
        ExecutionProxy.Call[] calls;
        string[] justifications;
        uint256 estimatedGas;
        uint256 totalValue;
        bytes32[] involvedAgents;
    }
    
    // Operation tracking
    mapping(bytes32 => Operation) public operations;
    mapping(address => bytes32[]) public userOperations;
    
    // Risk management
    mapping(address => uint256) public userRiskScore;
    mapping(address => bool) public userRequires2FA;
    
    // Operation limits
    uint256 public constant MAX_AGENTS_PER_OPERATION = 5;
    uint256 public constant MIN_OPERATION_DELAY = 0; // Can be increased for high-risk ops
    uint256 public constant MAX_OPERATION_LIFETIME = 1 hours;
    
    event OperationCreated(
        bytes32 indexed operationId,
        address indexed initiator,
        string intent,
        bytes32[] agentIds
    );
    
    event OperationExecuted(
        bytes32 indexed operationId,
        address indexed initiator,
        bytes32 indexed traceId,
        uint256 gasUsed,
        bool success
    );
    
    event ExecutionPlanProposed(
        bytes32 indexed operationId,
        bytes32[] involvedAgents,
        uint256 estimatedGas,
        uint256 totalValue
    );
    
    event RiskScoreUpdated(address indexed user, uint256 newScore);
    event TwoFactorRequired(address indexed user, bool required);
    
    constructor(address _agentRegistry, address _executionProxy) {
        agentRegistry = AgentRegistry(_agentRegistry);
        executionProxy = ExecutionProxy(payable(_executionProxy));
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORCHESTRATOR_ROLE, msg.sender);
    }
    
    modifier validOperation(bytes32 operationId) {
        require(operations[operationId].createdAt > 0, "Operation does not exist");
        require(!operations[operationId].executed, "Operation already executed");
        require(block.timestamp <= operations[operationId].deadline, "Operation expired");
        _;
    }
    
    /**
     * @notice Create a new operation with specified agents
     * @param intent Natural language description of what user wants
     * @param agentIds Array of agent IDs that will handle this operation
     * @param maxGas Maximum gas willing to spend
     * @param maxValue Maximum ETH value to use
     */
    function createOperation(
        string memory intent,
        bytes32[] memory agentIds,
        uint256 maxGas,
        uint256 maxValue
    ) external returns (bytes32) {
        require(bytes(intent).length > 0, "Intent cannot be empty");
        require(agentIds.length > 0 && agentIds.length <= MAX_AGENTS_PER_OPERATION, "Invalid agent count");
        
        // Verify all agents exist and are active
        for (uint256 i = 0; i < agentIds.length; i++) {
            AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentIds[i]);
            require(agent.active, "Agent not active");
        }
        
        bytes32 operationId = keccak256(abi.encodePacked(
            msg.sender,
            intent,
            agentIds,
            block.timestamp,
            block.number
        ));
        
        operations[operationId] = Operation({
            operationId: operationId,
            initiator: msg.sender,
            agentIds: agentIds,
            intent: intent,
            maxGas: maxGas,
            maxValue: maxValue,
            deadline: block.timestamp + MAX_OPERATION_LIFETIME,
            executed: false,
            createdAt: block.timestamp
        });
        
        userOperations[msg.sender].push(operationId);
        
        emit OperationCreated(operationId, msg.sender, intent, agentIds);
        
        return operationId;
    }
    
    /**
     * @notice Propose execution plan for an operation
     * @dev Called by authorized agents to propose their execution plan
     */
    function proposeExecutionPlan(
        bytes32 operationId,
        ExecutionPlan memory plan
    ) external validOperation(operationId) onlyRole(AGENT_ROLE) {
        Operation storage op = operations[operationId];
        
        require(plan.calls.length > 0, "Empty execution plan");
        require(plan.calls.length == plan.justifications.length, "Mismatched plan arrays");
        require(plan.totalValue <= op.maxValue, "Plan exceeds value limit");
        require(plan.estimatedGas <= op.maxGas, "Plan exceeds gas limit");
        
        // Verify agent is involved in this operation
        bool agentAuthorized = false;
        for (uint256 i = 0; i < op.agentIds.length; i++) {
            if (_isAgentAuthorized(op.agentIds[i], msg.sender)) {
                agentAuthorized = true;
                break;
            }
        }
        require(agentAuthorized, "Agent not authorized for this operation");
        
        emit ExecutionPlanProposed(
            operationId,
            plan.involvedAgents,
            plan.estimatedGas,
            plan.totalValue
        );
    }
    
    /**
     * @notice Execute an operation with the provided plan
     * @param operationId The operation to execute
     * @param plan The execution plan to use
     * @param userConfirmation Hash of user's confirmation message
     */
    function executeOperation(
        bytes32 operationId,
        ExecutionPlan memory plan,
        bytes32 userConfirmation
    ) external payable validOperation(operationId) nonReentrant {
        Operation storage op = operations[operationId];
        require(msg.sender == op.initiator, "Only initiator can execute");
        require(msg.value >= plan.totalValue, "Insufficient ETH sent");
        
        // Check if 2FA is required
        if (userRequires2FA[msg.sender] || _isHighRiskOperation(plan)) {
            require(userConfirmation != bytes32(0), "2FA confirmation required");
            // In production, verify the confirmation signature/hash
        }
        
        // Check operation delay for high-risk operations
        if (_isHighRiskOperation(plan)) {
            require(
                block.timestamp >= op.createdAt + MIN_OPERATION_DELAY,
                "Operation delay not met"
            );
        }
        
        // Generate trace ID for this execution
        bytes32 traceId = keccak256(abi.encodePacked(operationId, block.timestamp, msg.sender));
        
        // Execute through the proxy
        uint256 gasStart = gasleft();
        
        ExecutionProxy.ExecutionResult[] memory results = executionProxy.executeBatch{value: msg.value}(
            plan.calls,
            traceId
        );
        
        uint256 gasUsed = gasStart - gasleft();
        
        // Check if execution was successful
        uint256 successCount = 0;
        for (uint256 i = 0; i < results.length; i++) {
            if (results[i].success) {
                successCount++;
            }
        }
        
        bool overallSuccess = successCount == results.length;
        
        // Mark operation as executed
        op.executed = true;
        
        // Update user risk score based on execution
        _updateUserRiskScore(msg.sender, plan, overallSuccess);
        
        emit OperationExecuted(operationId, msg.sender, traceId, gasUsed, overallSuccess);
    }
    
    /**
     * @notice Simulate operation execution
     */
    function simulateOperation(
        bytes32 operationId,
        ExecutionPlan memory plan
    ) external view validOperation(operationId) returns (ExecutionProxy.ExecutionResult[] memory) {
        return executionProxy.simulateBatch(plan.calls);
    }
    
    /**
     * @notice Get operation details
     */
    function getOperation(bytes32 operationId) external view returns (Operation memory) {
        return operations[operationId];
    }
    
    /**
     * @notice Get user's operations
     */
    function getUserOperations(address user) external view returns (bytes32[] memory) {
        return userOperations[user];
    }
    
    /**
     * @notice Set 2FA requirement for user
     */
    function setUserRequires2FA(address user, bool required) external onlyRole(DEFAULT_ADMIN_ROLE) {
        userRequires2FA[user] = required;
        emit TwoFactorRequired(user, required);
    }
    
    /**
     * @notice Check if agent is authorized for operation
     */
    function _isAgentAuthorized(bytes32 agentId, address sender) internal view returns (bool) {
        AgentRegistry.Agent memory agent = agentRegistry.getAgent(agentId);
        return agent.owner == sender || hasRole(AGENT_ROLE, sender);
    }
    
    /**
     * @notice Check if operation is high risk
     */
    function _isHighRiskOperation(ExecutionPlan memory plan) internal pure returns (bool) {
        // High risk if:
        // - Total value > 10 ETH
        // - More than 3 calls
        // - Estimated gas > 1M
        return plan.totalValue > 10 ether || 
               plan.calls.length > 3 || 
               plan.estimatedGas > 1000000;
    }
    
    /**
     * @notice Update user risk score based on execution
     */
    function _updateUserRiskScore(
        address user,
        ExecutionPlan memory plan,
        bool success
    ) internal {
        uint256 currentScore = userRiskScore[user];
        
        if (success) {
            // Decrease risk score for successful operations
            if (currentScore > 10) {
                userRiskScore[user] = currentScore - 10;
            } else {
                userRiskScore[user] = 0;
            }
        } else {
            // Increase risk score for failed operations
            userRiskScore[user] = currentScore + 25;
            
            // Require 2FA if risk score gets too high
            if (userRiskScore[user] > 100) {
                userRequires2FA[user] = true;
                emit TwoFactorRequired(user, true);
            }
        }
        
        emit RiskScoreUpdated(user, userRiskScore[user]);
    }
    
    /**
     * @notice Emergency cancel operation
     */
    function emergencyCancelOperation(bytes32 operationId) external onlyRole(DEFAULT_ADMIN_ROLE) {
        operations[operationId].executed = true; // Prevent execution
    }
}