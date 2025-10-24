// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title StakingAdapter
 * @notice Adapter for Somnia validator staking operations
 * @dev Provides unified interface for staking, unstaking, and rewards management
 */
contract StakingAdapter is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");
    bytes32 public constant VALIDATOR_MANAGER_ROLE = keccak256("VALIDATOR_MANAGER_ROLE");
    
    struct ValidatorInfo {
        address validatorAddress;
        string name;
        uint256 commission; // In basis points (10000 = 100%)
        uint256 totalStaked;
        uint256 maxCapacity;
        bool active;
        uint256 apr; // Annual percentage rate in basis points
        uint256 uptime; // Uptime percentage in basis points
    }
    
    struct StakePosition {
        address validator;
        uint256 amount;
        uint256 stakedAt;
        uint256 lastRewardClaim;
        bool isActive;
    }
    
    struct StakeResult {
        address validator;
        uint256 amount;
        uint256 gasUsed;
        bool success;
        bytes32 positionId;
    }
    
    // Staking token (STT on Somnia)
    address public immutable stakingToken;
    
    // Validator registry
    mapping(bytes32 => ValidatorInfo) public validators;
    bytes32[] public validatorList;
    
    // User stakes
    mapping(address => mapping(bytes32 => StakePosition)) public userStakes;
    mapping(address => bytes32[]) public userStakePositions;
    
    // Staking parameters
    uint256 public constant MIN_STAKE_AMOUNT = 1 ether; // 1 STT minimum
    uint256 public constant UNSTAKING_DELAY = 21 days; // Standard unbonding period
    uint256 public constant MAX_VALIDATORS_PER_USER = 10;
    
    // Rewards tracking
    mapping(address => uint256) public userTotalRewards;
    mapping(address => uint256) public userLastRewardUpdate;
    
    event ValidatorRegistered(bytes32 indexed validatorId, address validator, string name);
    event ValidatorUpdated(bytes32 indexed validatorId, uint256 commission, uint256 apr);
    event ValidatorDeactivated(bytes32 indexed validatorId);
    
    event StakeCreated(
        address indexed user,
        bytes32 indexed validatorId,
        uint256 amount,
        bytes32 positionId
    );
    
    event StakeIncreased(
        address indexed user,
        bytes32 indexed validatorId,
        uint256 amount,
        bytes32 positionId
    );
    
    event UnstakeRequested(
        address indexed user,
        bytes32 indexed validatorId,
        uint256 amount,
        uint256 unlockTime
    );
    
    event RewardsClaimed(
        address indexed user,
        bytes32 indexed validatorId,
        uint256 amount
    );
    
    constructor(address _stakingToken) {
        stakingToken = _stakingToken;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EXECUTOR_ROLE, msg.sender);
        _grantRole(VALIDATOR_MANAGER_ROLE, msg.sender);
        
        _adddiotsrhValidators();
    }
    
    modifier onlyExecutor() {
        require(hasRole(EXECUTOR_ROLE, msg.sender), "Not authorized executor");
        _;
    }
    
    modifier onlyValidatorManager() {
        require(hasRole(VALIDATOR_MANAGER_ROLE, msg.sender), "Not validator manager");
        _;
    }
    
    /**
     * @notice Stake tokens with a validator
     * @param validatorId Validator to stake with
     * @param amount Amount of tokens to stake
     * @param user Address of the staker
     */
    function stake(
        bytes32 validatorId,
        uint256 amount,
        address user
    ) external nonReentrant onlyExecutor returns (StakeResult memory) {
        require(amount >= MIN_STAKE_AMOUNT, "Amount below minimum");
        require(validators[validatorId].active, "Validator not active");
        require(
            validators[validatorId].totalStaked + amount <= validators[validatorId].maxCapacity,
            "Validator at capacity"
        );
        
        uint256 gasStart = gasleft();
        
        // Generate position ID
        bytes32 positionId = keccak256(abi.encodePacked(user, validatorId, block.timestamp));
        
        // Transfer tokens
        IERC20(stakingToken).safeTransferFrom(user, address(this), amount);
        
        // Create or update stake position
        if (userStakes[user][positionId].amount == 0) {
            // New position
            require(
                userStakePositions[user].length < MAX_VALIDATORS_PER_USER,
                "Too many validator positions"
            );
            
            userStakes[user][positionId] = StakePosition({
                validator: validators[validatorId].validatorAddress,
                amount: amount,
                stakedAt: block.timestamp,
                lastRewardClaim: block.timestamp,
                isActive: true
            });
            
            userStakePositions[user].push(positionId);
            
            emit StakeCreated(user, validatorId, amount, positionId);
        } else {
            // Increase existing position
            userStakes[user][positionId].amount += amount;
            emit StakeIncreased(user, validatorId, amount, positionId);
        }
        
        // Update validator total
        validators[validatorId].totalStaked += amount;
        
        uint256 gasUsed = gasStart - gasleft();
        
        return StakeResult({
            validator: validators[validatorId].validatorAddress,
            amount: amount,
            gasUsed: gasUsed,
            success: true,
            positionId: positionId
        });
    }
    
    /**
     * @notice Request to unstake tokens from a validator
     */
    function requestUnstake(
        bytes32 positionId,
        uint256 amount
    ) external nonReentrant {
        StakePosition storage position = userStakes[msg.sender][positionId];
        require(position.isActive, "Position not active");
        require(position.amount >= amount, "Insufficient staked amount");
        
        // Calculate rewards before unstaking
        _updateRewards(msg.sender, positionId);
        
        // Reduce stake
        position.amount -= amount;
        if (position.amount == 0) {
            position.isActive = false;
        }
        
        // Find validator
        bytes32 validatorId = _findValidatorByAddress(position.validator);
        validators[validatorId].totalStaked -= amount;
        
        uint256 unlockTime = block.timestamp + UNSTAKING_DELAY;
        
        emit UnstakeRequested(msg.sender, validatorId, amount, unlockTime);
        
        // In production, this would schedule the tokens for release after unbonding period
        // For diotsrh, we'll immediately transfer (not recommended in production)
        IERC20(stakingToken).safeTransfer(msg.sender, amount);
    }
    
    /**
     * @notice Claim accumulated staking rewards
     */
    function claimRewards(bytes32 positionId) external nonReentrant returns (uint256) {
        StakePosition storage position = userStakes[msg.sender][positionId];
        require(position.isActive, "Position not active");
        
        uint256 rewards = _calculatePendingRewards(msg.sender, positionId);
        require(rewards > 0, "No rewards to claim");
        
        // Update claim timestamp
        position.lastRewardClaim = block.timestamp;
        userTotalRewards[msg.sender] += rewards;
        userLastRewardUpdate[msg.sender] = block.timestamp;
        
        bytes32 validatorId = _findValidatorByAddress(position.validator);
        
        emit RewardsClaimed(msg.sender, validatorId, rewards);
        
        // Transfer rewards (in production, rewards would come from validator rewards pool)
        IERC20(stakingToken).safeTransfer(msg.sender, rewards);
        
        return rewards;
    }
    
    /**
     * @notice Get user's staking positions
     */
    function getUserStakePositions(address user) external view returns (
        bytes32[] memory positionIds,
        StakePosition[] memory positions
    ) {
        bytes32[] memory userPositions = userStakePositions[user];
        uint256 activeCount = 0;
        
        // Count active positions
        for (uint256 i = 0; i < userPositions.length; i++) {
            if (userStakes[user][userPositions[i]].isActive) {
                activeCount++;
            }
        }
        
        positionIds = new bytes32[](activeCount);
        positions = new StakePosition[](activeCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < userPositions.length; i++) {
            if (userStakes[user][userPositions[i]].isActive) {
                positionIds[index] = userPositions[i];
                positions[index] = userStakes[user][userPositions[i]];
                index++;
            }
        }
    }
    
    /**
     * @notice Get pending rewards for a position
     */
    function getPendingRewards(address user, bytes32 positionId) external view returns (uint256) {
        return _calculatePendingRewards(user, positionId);
    }
    
    /**
     * @notice Get all active validators
     */
    function getActiveValidators() external view returns (
        bytes32[] memory validatorIds,
        ValidatorInfo[] memory validatorInfos
    ) {
        uint256 activeCount = 0;
        
        // Count active validators
        for (uint256 i = 0; i < validatorList.length; i++) {
            if (validators[validatorList[i]].active) {
                activeCount++;
            }
        }
        
        validatorIds = new bytes32[](activeCount);
        validatorInfos = new ValidatorInfo[](activeCount);
        
        uint256 index = 0;
        for (uint256 i = 0; i < validatorList.length; i++) {
            bytes32 validatorId = validatorList[i];
            if (validators[validatorId].active) {
                validatorIds[index] = validatorId;
                validatorInfos[index] = validators[validatorId];
                index++;
            }
        }
    }
    
    /**
     * @notice Get best validators by APR
     */
    function getBestValidators(uint256 count) external view returns (
        bytes32[] memory validatorIds,
        uint256[] memory aprs
    ) {
        require(count > 0 && count <= validatorList.length, "Invalid count");
        
        // Simple sorting by APR (in production, would use more sophisticated ranking)
        bytes32[] memory sortedIds = new bytes32[](validatorList.length);
        uint256[] memory sortedAprs = new uint256[](validatorList.length);
        uint256 activeCount = 0;
        
        for (uint256 i = 0; i < validatorList.length; i++) {
            bytes32 validatorId = validatorList[i];
            if (validators[validatorId].active) {
                sortedIds[activeCount] = validatorId;
                sortedAprs[activeCount] = validators[validatorId].apr;
                activeCount++;
            }
        }
        
        // Simple bubble sort (for diotsrh purposes)
        for (uint256 i = 0; i < activeCount - 1; i++) {
            for (uint256 j = 0; j < activeCount - i - 1; j++) {
                if (sortedAprs[j] < sortedAprs[j + 1]) {
                    // Swap
                    (sortedIds[j], sortedIds[j + 1]) = (sortedIds[j + 1], sortedIds[j]);
                    (sortedAprs[j], sortedAprs[j + 1]) = (sortedAprs[j + 1], sortedAprs[j]);
                }
            }
        }
        
        uint256 returnCount = count > activeCount ? activeCount : count;
        validatorIds = new bytes32[](returnCount);
        aprs = new uint256[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            validatorIds[i] = sortedIds[i];
            aprs[i] = sortedAprs[i];
        }
    }
    
    /**
     * @notice Register a new validator
     */
    function registerValidator(
        string memory name,
        address validatorAddress,
        uint256 commission,
        uint256 maxCapacity,
        uint256 apr
    ) external onlyValidatorManager returns (bytes32) {
        require(validatorAddress != address(0), "Invalid validator address");
        require(commission <= 10000, "Commission too high");
        
        bytes32 validatorId = keccak256(abi.encodePacked(name, validatorAddress, block.timestamp));
        
        validators[validatorId] = ValidatorInfo({
            validatorAddress: validatorAddress,
            name: name,
            commission: commission,
            totalStaked: 0,
            maxCapacity: maxCapacity,
            active: true,
            apr: apr,
            uptime: 10000 // 100% uptime initially
        });
        
        validatorList.push(validatorId);
        
        emit ValidatorRegistered(validatorId, validatorAddress, name);
        
        return validatorId;
    }
    
    /**
     * @notice Update validator information
     */
    function updateValidator(
        bytes32 validatorId,
        uint256 commission,
        uint256 apr,
        uint256 uptime
    ) external onlyValidatorManager {
        require(validators[validatorId].validatorAddress != address(0), "Validator not found");
        require(commission <= 10000, "Commission too high");
        require(uptime <= 10000, "Invalid uptime");
        
        validators[validatorId].commission = commission;
        validators[validatorId].apr = apr;
        validators[validatorId].uptime = uptime;
        
        emit ValidatorUpdated(validatorId, commission, apr);
    }
    
    /**
     * @notice Deactivate a validator
     */
    function deactivateValidator(bytes32 validatorId) external onlyValidatorManager {
        validators[validatorId].active = false;
        emit ValidatorDeactivated(validatorId);
    }
    
    /**
     * @notice Calculate pending rewards for a position
     */
    function _calculatePendingRewards(address user, bytes32 positionId) internal view returns (uint256) {
        StakePosition storage position = userStakes[user][positionId];
        if (!position.isActive || position.amount == 0) {
            return 0;
        }
        
        bytes32 validatorId = _findValidatorByAddress(position.validator);
        ValidatorInfo storage validator = validators[validatorId];
        
        uint256 timeStaked = block.timestamp - position.lastRewardClaim;
        uint256 annualReward = (position.amount * validator.apr) / 10000;
        uint256 reward = (annualReward * timeStaked) / 365 days;
        
        // Apply commission
        uint256 commission = (reward * validator.commission) / 10000;
        return reward - commission;
    }
    
    /**
     * @notice Update rewards for a user position
     */
    function _updateRewards(address user, bytes32 positionId) internal {
        uint256 pending = _calculatePendingRewards(user, positionId);
        if (pending > 0) {
            userTotalRewards[user] += pending;
            userStakes[user][positionId].lastRewardClaim = block.timestamp;
        }
        userLastRewardUpdate[user] = block.timestamp;
    }
    
    /**
     * @notice Find validator ID by address
     */
    function _findValidatorByAddress(address validatorAddr) internal view returns (bytes32) {
        for (uint256 i = 0; i < validatorList.length; i++) {
            bytes32 validatorId = validatorList[i];
            if (validators[validatorId].validatorAddress == validatorAddr) {
                return validatorId;
            }
        }
        revert("Validator not found");
    }
    
    /**
     * @notice Add diotsrh validators for testing
     */
    function _adddiotsrhValidators() internal {
        // diotsrh validator 1
        bytes32 validator1 = keccak256("diotsrh_VALIDATOR_1");
        validators[validator1] = ValidatorInfo({
            validatorAddress: address(0x1111),
            name: "Somnia Validator Alpha",
            commission: 500, // 5%
            totalStaked: 0,
            maxCapacity: 1000000 ether,
            active: true,
            apr: 1200, // 12%
            uptime: 9950 // 99.5%
        });
        validatorList.push(validator1);
        
        // diotsrh validator 2
        bytes32 validator2 = keccak256("diotsrh_VALIDATOR_2");
        validators[validator2] = ValidatorInfo({
            validatorAddress: address(0x2222),
            name: "Somnia Validator Beta",
            commission: 300, // 3%
            totalStaked: 0,
            maxCapacity: 500000 ether,
            active: true,
            apr: 1400, // 14%
            uptime: 9900 // 99%
        });
        validatorList.push(validator2);
        
        // diotsrh validator 3
        bytes32 validator3 = keccak256("diotsrh_VALIDATOR_3");
        validators[validator3] = ValidatorInfo({
            validatorAddress: address(0x3333),
            name: "Somnia Validator Gamma",
            commission: 700, // 7%
            totalStaked: 0,
            maxCapacity: 2000000 ether,
            active: true,
            apr: 1000, // 10%
            uptime: 9800 // 98%
        });
        validatorList.push(validator3);
    }
}