const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
  let agentRegistry;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.waitForDeployment();
  });

  describe("Agent Registration", function () {
    it("Should register a new agent successfully", async function () {
      const name = "TradeAgent";
      const capabilities = ["swap", "trade", "slippage-protection"];
      const metadataURI = "ipfs://QmTest123";

      const tx = await agentRegistry.connect(user1).registerAgent(
        name,
        capabilities,
        metadataURI
      );

      const receipt = await tx.wait();
      const event = receipt.logs.find(log => {
        try {
          const parsed = agentRegistry.interface.parseLog(log);
          return parsed.name === "AgentRegistered";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
    });

    it("Should fail to register an agent with empty name", async function () {
      await expect(
        agentRegistry.connect(user1).registerAgent("", ["capability"], "uri")
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should fail to register an agent with no capabilities", async function () {
      await expect(
        agentRegistry.connect(user1).registerAgent("TestAgent", [], "uri")
      ).to.be.revertedWith("Must have at least one capability");
    });
  });

  describe("Agent Management", function () {
    let agentId;

    beforeEach(async function () {
      const tx = await agentRegistry.connect(user1).registerAgent(
        "TestAgent",
        ["capability1", "capability2"],
        "ipfs://test"
      );
      const receipt = await tx.wait();
      
      const event = receipt.logs.find(log => {
        try {
          const parsed = agentRegistry.interface.parseLog(log);
          return parsed.name === "AgentRegistered";
        } catch {
          return false;
        }
      });

      agentId = event.args[0];
    });

    it("Should update agent capabilities", async function () {
      const newCapabilities = ["new-cap-1", "new-cap-2", "new-cap-3"];
      const newMetadata = "ipfs://updated";

      await agentRegistry.connect(user1).updateAgent(
        agentId,
        newCapabilities,
        newMetadata
      );

      const agent = await agentRegistry.getAgent(agentId);
      expect(agent.capabilities.length).to.equal(3);
      expect(agent.metadataURI).to.equal(newMetadata);
    });

    it("Should fail to update agent if not owner", async function () {
      await expect(
        agentRegistry.connect(user2).updateAgent(
          agentId,
          ["new-cap"],
          "new-uri"
        )
      ).to.be.revertedWith("Only owner can update");
    });

    it("Should deactivate an agent", async function () {
      await agentRegistry.connect(user1).deactivateAgent(agentId);

      const agent = await agentRegistry.getAgent(agentId);
      expect(agent.active).to.be.false;
    });

    it("Should reactivate a deactivated agent", async function () {
      await agentRegistry.connect(user1).deactivateAgent(agentId);
      await agentRegistry.connect(user1).activateAgent(agentId);

      const agent = await agentRegistry.getAgent(agentId);
      expect(agent.active).to.be.true;
    });
  });

  describe("Agent Queries", function () {
    beforeEach(async function () {
      // Register multiple agents
      await agentRegistry.connect(user1).registerAgent(
        "Agent1",
        ["swap", "trade"],
        "uri1"
      );
      await agentRegistry.connect(user1).registerAgent(
        "Agent2",
        ["stake", "unstake"],
        "uri2"
      );
      await agentRegistry.connect(user2).registerAgent(
        "Agent3",
        ["analytics"],
        "uri3"
      );
    });

    it("Should get agents by owner", async function () {
      const user1Agents = await agentRegistry.getOwnerAgents(user1.address);
      expect(user1Agents.length).to.equal(2);

      const user2Agents = await agentRegistry.getOwnerAgents(user2.address);
      expect(user2Agents.length).to.equal(1);
    });

    it("Should get all registered agents", async function () {
      const allAgents = await agentRegistry.getAllAgents();
      expect(allAgents.length).to.equal(3);
    });

    it("Should count active agents correctly", async function () {
      const activeCount = await agentRegistry.getActiveAgentsCount();
      expect(activeCount).to.equal(3);

      // Deactivate one agent
      const user1Agents = await agentRegistry.getOwnerAgents(user1.address);
      await agentRegistry.connect(user1).deactivateAgent(user1Agents[0]);

      const newActiveCount = await agentRegistry.getActiveAgentsCount();
      expect(newActiveCount).to.equal(2);
    });
  });

  describe("Access Control", function () {
    it("Should grant DEFAULT_ADMIN_ROLE to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await agentRegistry.DEFAULT_ADMIN_ROLE();
      expect(
        await agentRegistry.hasRole(DEFAULT_ADMIN_ROLE, owner.address)
      ).to.be.true;
    });

    it("Should grant AGENT_MANAGER_ROLE to deployer", async function () {
      const AGENT_MANAGER_ROLE = await agentRegistry.AGENT_MANAGER_ROLE();
      expect(
        await agentRegistry.hasRole(AGENT_MANAGER_ROLE, owner.address)
      ).to.be.true;
    });
  });
});
