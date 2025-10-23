// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AgentRegistry
 * @notice Registry for AI agents with their capabilities and metadata
 * @dev Stores agent information on-chain for transparency and auditability
 */
contract AgentRegistry is AccessControl, ReentrancyGuard {
    bytes32 public constant AGENT_MANAGER_ROLE = keccak256("AGENT_MANAGER_ROLE");
    
    struct Agent {
        string name;
        string[] capabilities;
        address owner;
        bool active;
        uint256 registeredAt;
        string metadataURI;
    }
    
    // Agent ID => Agent data
    mapping(bytes32 => Agent) public agents;
    
    // Owner => Agent IDs
    mapping(address => bytes32[]) public ownerAgents;
    
    // All registered agent IDs
    bytes32[] public allAgents;
    
    event AgentRegistered(
        bytes32 indexed agentId,
        string name,
        address indexed owner,
        string[] capabilities
    );
    
    event AgentUpdated(
        bytes32 indexed agentId,
        string[] capabilities,
        string metadataURI
    );
    
    event AgentDeactivated(bytes32 indexed agentId);
    
    event AgentActivated(bytes32 indexed agentId);
    
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(AGENT_MANAGER_ROLE, msg.sender);
    }
    
    /**
     * @notice Register a new agent
     * @param name Agent name
     * @param capabilities Array of capability strings
     * @param metadataURI IPFS or HTTP URI for additional metadata
     */
    function registerAgent(
        string memory name,
        string[] memory capabilities,
        string memory metadataURI
    ) external returns (bytes32) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(capabilities.length > 0, "Must have at least one capability");
        
        bytes32 agentId = keccak256(abi.encodePacked(name, msg.sender, block.timestamp));
        
        require(agents[agentId].registeredAt == 0, "Agent already exists");
        
        agents[agentId] = Agent({
            name: name,
            capabilities: capabilities,
            owner: msg.sender,
            active: true,
            registeredAt: block.timestamp,
            metadataURI: metadataURI
        });
        
        ownerAgents[msg.sender].push(agentId);
        allAgents.push(agentId);
        
        emit AgentRegistered(agentId, name, msg.sender, capabilities);
        
        return agentId;
    }
    
    /**
     * @notice Update agent capabilities and metadata
     */
    function updateAgent(
        bytes32 agentId,
        string[] memory capabilities,
        string memory metadataURI
    ) external {
        require(agents[agentId].owner == msg.sender, "Only owner can update");
        require(capabilities.length > 0, "Must have at least one capability");
        
        agents[agentId].capabilities = capabilities;
        agents[agentId].metadataURI = metadataURI;
        
        emit AgentUpdated(agentId, capabilities, metadataURI);
    }
    
    /**
     * @notice Deactivate an agent
     */
    function deactivateAgent(bytes32 agentId) external {
        require(agents[agentId].owner == msg.sender, "Only owner can deactivate");
        agents[agentId].active = false;
        
        emit AgentDeactivated(agentId);
    }
    
    /**
     * @notice Activate an agent
     */
    function activateAgent(bytes32 agentId) external {
        require(agents[agentId].owner == msg.sender, "Only owner can activate");
        agents[agentId].active = true;
        
        emit AgentActivated(agentId);
    }
    
    /**
     * @notice Get agent information
     */
    function getAgent(bytes32 agentId) external view returns (Agent memory) {
        return agents[agentId];
    }
    
    /**
     * @notice Get agent capabilities
     */
    function getAgentCapabilities(bytes32 agentId) external view returns (string[] memory) {
        return agents[agentId].capabilities;
    }
    
    /**
     * @notice Get agents owned by an address
     */
    function getOwnerAgents(address owner) external view returns (bytes32[] memory) {
        return ownerAgents[owner];
    }
    
    /**
     * @notice Get all registered agents
     */
    function getAllAgents() external view returns (bytes32[] memory) {
        return allAgents;
    }
    
    /**
     * @notice Get active agents count
     */
    function getActiveAgentsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < allAgents.length; i++) {
            if (agents[allAgents[i]].active) {
                count++;
            }
        }
        return count;
    }
}