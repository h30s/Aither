const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting Aither-Somnia contract deployment to Somnia Testnet...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying contracts with account: ${deployer.address}`);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`Account balance: ${hre.ethers.formatEther(balance)} STT`);

  if (balance === 0n) {
    console.error("❌ Deployer account has no STT tokens. Please fund your account from the Somnia faucet.");
    process.exit(1);
  }

  const deployedContracts = {};
  
  try {
    // 1. Deploy AgentRegistry
    console.log("\n📋 Deploying AgentRegistry...");
    const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
    const agentRegistry = await AgentRegistry.deploy();
    await agentRegistry.waitForDeployment();
    const agentRegistryAddress = await agentRegistry.getAddress();
    deployedContracts.AGENT_REGISTRY = agentRegistryAddress;
    console.log(`✅ AgentRegistry deployed to: ${agentRegistryAddress}`);

    // 2. Deploy ExecutionProxy
    console.log("\n🔐 Deploying ExecutionProxy...");
    const ExecutionProxy = await hre.ethers.getContractFactory("ExecutionProxy");
    const executionProxy = await ExecutionProxy.deploy();
    await executionProxy.waitForDeployment();
    const executionProxyAddress = await executionProxy.getAddress();
    deployedContracts.EXECUTION_PROXY = executionProxyAddress;
    console.log(`✅ ExecutionProxy deployed to: ${executionProxyAddress}`);

    // 3. Deploy SwapAdapter
    console.log("\n🔄 Deploying SwapAdapter...");
    const SwapAdapter = await hre.ethers.getContractFactory("SwapAdapter");
    const swapAdapter = await SwapAdapter.deploy();
    await swapAdapter.waitForDeployment();
    const swapAdapterAddress = await swapAdapter.getAddress();
    deployedContracts.SWAP_ADAPTER = swapAdapterAddress;
    console.log(`✅ SwapAdapter deployed to: ${swapAdapterAddress}`);

    // 4. Deploy StakingAdapter with STT token address (native token = zero address)
    console.log("\n⚡ Deploying StakingAdapter...");
    const StakingAdapter = await hre.ethers.getContractFactory("StakingAdapter");
    const sttTokenAddress = "0x0000000000000000000000000000000000000000"; // Native STT
    const stakingAdapter = await StakingAdapter.deploy(sttTokenAddress);
    await stakingAdapter.waitForDeployment();
    const stakingAdapterAddress = await stakingAdapter.getAddress();
    deployedContracts.STAKING_ADAPTER = stakingAdapterAddress;
    console.log(`✅ StakingAdapter deployed to: ${stakingAdapterAddress}`);

    // 5. Deploy PortfolioView
    console.log("\n📊 Deploying PortfolioView...");
    const PortfolioView = await hre.ethers.getContractFactory("PortfolioView");
    const portfolioView = await PortfolioView.deploy(stakingAdapterAddress);
    await portfolioView.waitForDeployment();
    const portfolioViewAddress = await portfolioView.getAddress();
    deployedContracts.PORTFOLIO_VIEW = portfolioViewAddress;
    console.log(`✅ PortfolioView deployed to: ${portfolioViewAddress}`);

    // 6. Deploy AgentOrchestrator
    console.log("\n🎭 Deploying AgentOrchestrator...");
    const AgentOrchestrator = await hre.ethers.getContractFactory("AgentOrchestrator");
    const agentOrchestrator = await AgentOrchestrator.deploy(
      agentRegistryAddress,
      executionProxyAddress
    );
    await agentOrchestrator.waitForDeployment();
    const agentOrchestratorAddress = await agentOrchestrator.getAddress();
    deployedContracts.AGENT_ORCHESTRATOR = agentOrchestratorAddress;
    console.log(`✅ AgentOrchestrator deployed to: ${agentOrchestratorAddress}`);

    // Configuration phase
    console.log("\n⚙️  Configuring contracts...");

    // Grant roles to AgentOrchestrator in ExecutionProxy
    console.log("Setting up ExecutionProxy permissions...");
    await executionProxy.grantRole(
      await executionProxy.EXECUTOR_ROLE(),
      agentOrchestratorAddress
    );

    // Allowlist the adapters in ExecutionProxy
    console.log("Allowlisting adapter contracts...");
    await executionProxy.setContractAllowed(swapAdapterAddress, true);
    await executionProxy.setContractAllowed(stakingAdapterAddress, true);

    // Grant roles to ExecutionProxy in adapters
    console.log("Setting up adapter permissions...");
    await swapAdapter.grantRole(
      await swapAdapter.EXECUTOR_ROLE(),
      executionProxyAddress
    );
    await stakingAdapter.grantRole(
      await stakingAdapter.EXECUTOR_ROLE(),
      executionProxyAddress
    );

    // Set up some demo validators (if not already done in constructor)
    console.log("Verifying validator setup...");
    try {
      const validators = await stakingAdapter.getActiveValidators();
      console.log(`Found ${validators[0].length} active validators`);
    } catch (error) {
      console.log("Validators already configured or error:", error.message);
    }

    // Set daily limits for ExecutionProxy (example: 1000 STT per day)
    console.log("Setting up user limits...");
    const dailyLimit = hre.ethers.parseEther("1000"); // 1000 STT
    await executionProxy.setUserDailyLimit(deployer.address, dailyLimit);

    console.log("\n🎉 All contracts deployed and configured successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log("==========================================");
    
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${address}`);
    });

    // Save deployment info to file
    const deploymentInfo = {
      network: hre.network.name,
      chainId: await hre.ethers.provider.getNetwork().then(n => Number(n.chainId)),
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts,
      transactionHashes: {
        // These would be populated with actual tx hashes in production
      }
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

    // Generate environment variables
    console.log("\n🔧 Environment variables for .env.local:");
    console.log("==========================================");
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`NEXT_PUBLIC_${name}_ADDRESS="${address}"`);
    });

    console.log("\n📚 Next steps:");
    console.log("1. Update your .env.local file with the contract addresses above");
    console.log("2. Verify contracts on Somnia Explorer (if verification is available)");
    console.log("3. Test the deployment with the provided demo flows");
    console.log("4. Set up monitoring and alerts for your contracts");
    
    console.log(`\n🔗 View contracts on Somnia Explorer:`);
    const explorerUrl = process.env.SOMNIA_EXPLORER_URL || "https://explorer.testnet.somnia.network";
    Object.entries(deployedContracts).forEach(([name, address]) => {
      console.log(`${name}: ${explorerUrl}/address/${address}`);
    });

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Error handling
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment script failed:", error);
    process.exit(1);
  });