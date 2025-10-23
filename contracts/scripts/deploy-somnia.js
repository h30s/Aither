const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment to Somnia Testnet...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

  const deployedAddresses = {};

  // 1. Deploy AgentRegistry
  console.log("📝 Deploying AgentRegistry...");
  const AgentRegistry = await hre.ethers.getContractFactory("AgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  deployedAddresses.AgentRegistry = await agentRegistry.getAddress();
  console.log("✅ AgentRegistry deployed to:", deployedAddresses.AgentRegistry, "\n");

  // 2. Deploy AgentOrchestrator
  console.log("📝 Deploying AgentOrchestrator...");
  const AgentOrchestrator = await hre.ethers.getContractFactory("AgentOrchestrator");
  const agentOrchestrator = await AgentOrchestrator.deploy(
    deployedAddresses.AgentRegistry
  );
  await agentOrchestrator.waitForDeployment();
  deployedAddresses.AgentOrchestrator = await agentOrchestrator.getAddress();
  console.log("✅ AgentOrchestrator deployed to:", deployedAddresses.AgentOrchestrator, "\n");

  // 3. Deploy ExecutionProxy
  console.log("📝 Deploying ExecutionProxy...");
  const ExecutionProxy = await hre.ethers.getContractFactory("ExecutionProxy");
  const executionProxy = await ExecutionProxy.deploy();
  await executionProxy.waitForDeployment();
  deployedAddresses.ExecutionProxy = await executionProxy.getAddress();
  console.log("✅ ExecutionProxy deployed to:", deployedAddresses.ExecutionProxy, "\n");

  // 4. Deploy SwapAdapter
  console.log("📝 Deploying SwapAdapter...");
  const SwapAdapter = await hre.ethers.getContractFactory("SwapAdapter");
  const swapAdapter = await SwapAdapter.deploy();
  await swapAdapter.waitForDeployment();
  deployedAddresses.SwapAdapter = await swapAdapter.getAddress();
  console.log("✅ SwapAdapter deployed to:", deployedAddresses.SwapAdapter, "\n");

  // 5. Deploy StakingAdapter
  console.log("📝 Deploying StakingAdapter...");
  const StakingAdapter = await hre.ethers.getContractFactory("StakingAdapter");
  const stakingAdapter = await StakingAdapter.deploy();
  await stakingAdapter.waitForDeployment();
  deployedAddresses.StakingAdapter = await stakingAdapter.getAddress();
  console.log("✅ StakingAdapter deployed to:", deployedAddresses.StakingAdapter, "\n");

  // 6. Deploy PortfolioView
  console.log("📝 Deploying PortfolioView...");
  const PortfolioView = await hre.ethers.getContractFactory("PortfolioView");
  const portfolioView = await PortfolioView.deploy();
  await portfolioView.waitForDeployment();
  deployedAddresses.PortfolioView = await portfolioView.getAddress();
  console.log("✅ PortfolioView deployed to:", deployedAddresses.PortfolioView, "\n");

  // Setup permissions
  console.log("🔐 Setting up permissions...");
  
  // Grant ExecutionProxy the EXECUTOR role in AgentOrchestrator
  const EXECUTOR_ROLE = await agentOrchestrator.EXECUTOR_ROLE();
  await agentOrchestrator.grantRole(EXECUTOR_ROLE, deployedAddresses.ExecutionProxy);
  console.log("✅ Granted EXECUTOR_ROLE to ExecutionProxy");

  // Allowlist SwapAdapter and StakingAdapter in ExecutionProxy
  await executionProxy.setContractAllowed(deployedAddresses.SwapAdapter, true);
  console.log("✅ Allowlisted SwapAdapter in ExecutionProxy");
  
  await executionProxy.setContractAllowed(deployedAddresses.StakingAdapter, true);
  console.log("✅ Allowlisted StakingAdapter in ExecutionProxy");

  // Save deployment addresses
  const deploymentData = {
    network: "somnia-testnet",
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    addresses: deployedAddresses,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = path.join(deploymentsDir, `somnia-${Date.now()}.json`);
  fs.writeFileSync(filename, JSON.stringify(deploymentData, null, 2));
  console.log("\n📄 Deployment data saved to:", filename);

  // Generate .env updates
  console.log("\n📝 Update your .env.local with these values:");
  console.log("================================================");
  Object.entries(deployedAddresses).forEach(([name, address]) => {
    const envKey = `NEXT_PUBLIC_${name.replace(/([A-Z])/g, "_$1").toUpperCase()}_ADDRESS`;
    console.log(`${envKey}=${address}`);
  });
  console.log("================================================\n");

  // Generate README update
  const readmeUpdate = `
## 🔗 Deployed Contracts on Somnia Testnet

| Contract | Address | Purpose |
|----------|---------|---------|
| **AgentRegistry** | \`${deployedAddresses.AgentRegistry}\` | On-chain agent registration and capabilities |
| **AgentOrchestrator** | \`${deployedAddresses.AgentOrchestrator}\` | Multi-agent coordination and execution |
| **ExecutionProxy** | \`${deployedAddresses.ExecutionProxy}\` | Secure multicall execution with allowlists |
| **SwapAdapter** | \`${deployedAddresses.SwapAdapter}\` | DEX integration and token swapping |
| **StakingAdapter** | \`${deployedAddresses.StakingAdapter}\` | Validator staking and rewards |
| **PortfolioView** | \`${deployedAddresses.PortfolioView}\` | Read-only portfolio analytics |

**Deployed by:** ${deployer.address}  
**Deployment Date:** ${new Date().toLocaleString()}  
**Chain ID:** ${deploymentData.chainId}
`;

  fs.writeFileSync(path.join(deploymentsDir, "README-update.md"), readmeUpdate);
  console.log("📄 README update generated in deployments/README-update.md\n");

  console.log("✅ Deployment completed successfully!\n");
  
  // Verification instructions
  console.log("🔍 To verify contracts on block explorer, run:");
  console.log("================================================");
  console.log(`npx hardhat verify --network somnia ${deployedAddresses.AgentRegistry}`);
  console.log(`npx hardhat verify --network somnia ${deployedAddresses.AgentOrchestrator} ${deployedAddresses.AgentRegistry}`);
  console.log(`npx hardhat verify --network somnia ${deployedAddresses.ExecutionProxy}`);
  console.log(`npx hardhat verify --network somnia ${deployedAddresses.SwapAdapter}`);
  console.log(`npx hardhat verify --network somnia ${deployedAddresses.StakingAdapter}`);
  console.log(`npx hardhat verify --network somnia ${deployedAddresses.PortfolioView}`);
  console.log("================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
