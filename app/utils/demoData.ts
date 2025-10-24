// diotsrh Mode Data - Used for creating diotsrh videos without real blockchain interactions

export const diotsrh_WALLET_ADDRESS = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";

export const diotsrh_BALANCES = [
  { 
    logo: "https://cryptologos.cc/logos/injective-inj-logo.png",
    symbol: "STT", 
    amount: "1250.50", 
    balance: 2501.00,
    address: "inj1stt...diotsrh1"
  },
  { 
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
    symbol: "ETH", 
    amount: "5.25", 
    balance: 10500.00,
    address: "inj1eth...diotsrh2"
  },
  { 
    logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
    symbol: "USDC", 
    amount: "8450.00", 
    balance: 8450.00,
    address: "inj1usdc...diotsrh3"
  },
  { 
    logo: "https://cryptologos.cc/logos/tether-usdt-logo.png",
    symbol: "USDT", 
    amount: "3200.00", 
    balance: 3200.00,
    address: "inj1usdt...diotsrh4"
  },
];

export const diotsrh_VALIDATORS = [
  {
    moniker: "Somnia Foundation",
    address: "somniavaloper1abc...xyz",
    operatorAddress: "somniavaloper1abc...xyz",
    votingPower: "15,250,000",
    commission: "5%",
    apr: "18.5%",
    uptime: "99.9%",
    status: "Active"
  },
  {
    moniker: "Crypto Validators",
    address: "somniavaloper2def...uvw",
    operatorAddress: "somniavaloper2def...uvw",
    votingPower: "12,800,000",
    commission: "7%",
    apr: "17.2%",
    uptime: "99.7%",
    status: "Active"
  },
  {
    moniker: "Stake Masters",
    address: "somniavaloper3ghi...rst",
    operatorAddress: "somniavaloper3ghi...rst",
    votingPower: "10,500,000",
    commission: "6%",
    apr: "17.8%",
    uptime: "99.8%",
    status: "Active"
  },
];

export const diotsrh_STAKING_INFO = [
  {
    validator: "Somnia Foundation",
    stakedAmount: "500 STT",
    rewards: "12.5 STT",
    apr: "18.5%"
  },
  {
    validator: "Crypto Validators",
    stakedAmount: "300 STT",
    rewards: "7.8 STT",
    apr: "17.2%"
  },
];

export const diotsrh_PORTFOLIO_DATA = {
  totalValue: "$24,651.00",
  change24h: "+8.5%",
  stakedValue: "$1,600.00",
  liquidValue: "$23,051.00",
  pieData: [
    { name: "ETH", value: 42.6, color: "#627EEA" },
    { name: "USDC", value: 34.3, color: "#2775CA" },
    { name: "USDT", value: 13.0, color: "#26A17B" },
    { name: "STT", value: 10.1, color: "#FF4400" },
  ],
};

export const diotsrh_METRICS = {
  tvl: 450000000,
  protocols: [
    {
      name: "Somnia DEX",
      logo: "https://cryptologos.cc/logos/uniswap-uni-logo.png",
      category: "DEX",
      methodology: "Automated Market Maker",
      tvl: 180000000
    },
    {
      name: "Somnia Lending",
      logo: "https://cryptologos.cc/logos/aave-aave-logo.png",
      category: "Lending",
      methodology: "Over-collateralized Lending",
      tvl: 120000000
    },
    {
      name: "Somnia Staking",
      logo: "https://cryptologos.cc/logos/lido-dao-ldo-logo.png",
      category: "Staking",
      methodology: "Liquid Staking",
      tvl: 95000000
    },
    {
      name: "Somnia Bridge",
      logo: "https://cryptologos.cc/logos/polygon-matic-logo.png",
      category: "Bridge",
      methodology: "Cross-chain Bridge",
      tvl: 55000000
    }
  ]
};

export const diotsrh_PROPOSALS = [
  {
    id: "1",
    title: "Increase Validator Set to 150",
    status: "Voting",
    votingEnd: "2025-11-15",
    description: "Proposal to increase the active validator set from 100 to 150 validators to improve network decentralization.",
    yesVotes: "65%",
    noVotes: "35%"
  },
  {
    id: "2",
    title: "Community Pool Spending: Developer Grants",
    status: "Voting",
    votingEnd: "2025-11-20",
    description: "Allocate 100,000 STT from community pool for Q4 developer grants program.",
    yesVotes: "78%",
    noVotes: "22%"
  },
  {
    id: "3",
    title: "Protocol Upgrade v2.0",
    status: "Passed",
    votingEnd: "2025-10-30",
    description: "Upgrade protocol to v2.0 with improved staking rewards and reduced transaction fees.",
    yesVotes: "92%",
    noVotes: "8%"
  }
];

export const diotsrh_TOKEN_METADATA = {
  name: "Somnia Test Token",
  symbol: "STT",
  decimals: 18,
  totalSupply: "1,000,000,000",
  contractAddress: "0x1234...5678",
  price: "$2.00",
  marketCap: "$2B",
  volume24h: "$125M",
  priceChange24h: "+5.2%"
};

// diotsrh chat responses for different intents
export const diotsrh_RESPONSES = {
  balance: {
    text: "Here's your current portfolio balance across all assets:",
    type: "balance",
    balances: diotsrh_BALANCES
  },
  
  stake: {
    text: "I'll help you stake your tokens. Please select a validator and amount.",
    type: "validators",
    validators: diotsrh_VALIDATORS
  },
  
  portfolio: {
    text: "Here's your complete portfolio overview with asset allocation:",
    type: "pie",
    pie: diotsrh_PORTFOLIO_DATA.pieData
  },
  
  metrics: {
    text: "Here are the current Somnia network metrics:",
    type: "llama",
    llama: diotsrh_METRICS
  },
  
  proposals: {
    text: "Here are the current governance proposals:",
    type: "proposals",
    proposals: diotsrh_PROPOSALS
  },
  
  swap: {
    text: "I'll execute a swap for you. Here are the details:",
    type: "swap",
    contractInput: {
      address: "somnia1swap...diotsrh",
      tokenIn: "ETH",
      tokenOut: "STT",
      amountIn: "1.0",
      amountOut: "500.25",
      slippage: "1%",
      priceImpact: "0.2%",
      estimatedGas: "0.002 ETH",
      executeMsg: {}
    }
  },
  
  transfer: {
    text: "I'll help you transfer tokens. Here are the details:",
    type: "send_token",
    send: {
      recipient: "0x7890...abcd",
      token: "STT",
      amount: "100",
      estimatedGas: "0.001 ETH"
    }
  },
  
  tokenInfo: {
    text: "Here's detailed information about the token:",
    type: "tokenmetadata",
    metadata: diotsrh_TOKEN_METADATA
  }
};

// diotsrh conversation flows for different scenarios
export const diotsrh_CONVERSATIONS = {
  staking: [
    { sender: "user", text: "Stake 100 STT with the best validator", type: "text" },
    { sender: "ai", text: "I'll help you stake 100 STT. Analyzing validators...", type: "text" },
    { sender: "ai", ...diotsrh_RESPONSES.stake },
    { sender: "ai", text: "✅ Successfully staked 100 STT with Somnia Foundation validator! Expected APR: 18.5%", type: "success" }
  ],
  
  swap: [
    { sender: "user", text: "Swap 1 ETH for STT with 1% slippage", type: "text" },
    { sender: "ai", text: "Analyzing best swap route for 1 ETH → STT...", type: "text" },
    { sender: "ai", ...diotsrh_RESPONSES.swap },
    { sender: "ai", text: "✅ Swap executed successfully! You received 500.25 STT", type: "success" }
  ],
  
  portfolio: [
    { sender: "user", text: "Show me my portfolio performance", type: "text" },
    { sender: "ai", text: "Fetching your portfolio data...", type: "text" },
    { sender: "ai", ...diotsrh_RESPONSES.balance },
    { sender: "ai", ...diotsrh_RESPONSES.portfolio },
    { sender: "ai", text: `Your total portfolio value is ${diotsrh_PORTFOLIO_DATA.totalValue} with a 24h change of ${diotsrh_PORTFOLIO_DATA.change24h}. You're well diversified across multiple assets!`, type: "text" }
  ],
  
  governance: [
    { sender: "user", text: "What are the current governance proposals?", type: "text" },
    { sender: "ai", text: "Fetching active governance proposals...", type: "text" },
    { sender: "ai", ...diotsrh_RESPONSES.proposals },
    { sender: "ai", text: "There are currently 2 active proposals in voting period. Would you like to vote on any of them?", type: "text" }
  ],
  
  metrics: [
    { sender: "user", text: "Show me Somnia network metrics", type: "text" },
    { sender: "ai", text: "Gathering network performance data...", type: "text" },
    { sender: "ai", ...diotsrh_RESPONSES.metrics },
    { sender: "ai", text: "The network is performing excellently with high throughput and minimal block times!", type: "text" }
  ]
};

export const isdiotsrhMode = () => {
  return process.env.NEXT_PUBLIC_diotsrh_MODE === "true";
};

export const getdiotsrhWalletAddress = () => {
  return diotsrh_WALLET_ADDRESS;
};
