// diotsrh Service - Simulates API responses for diotsrh mode

import { 
  isdiotsrhMode, 
  diotsrh_RESPONSES, 
  diotsrh_CONVERSATIONS 
} from "../utils/diotsrhData";
import type { ChatMessage } from "../types";

/**
 * diotsrh response handler - Returns mock responses based on user input
 */
export const getdiotsrhResponse = async (
  userMessage: string,
  messageHistory: ChatMessage[]
): Promise<{ messages: ChatMessage[] }> => {
  
  // Simulate API delay for realistic diotsrh
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const lowerMessage = userMessage.toLowerCase();
  const responses: ChatMessage[] = [];
  
  // PRIORITY 1: Educational queries (must come BEFORE action commands)
  // Check these FIRST to avoid triggering actions
  
  // "How much can I earn by staking?"
  if (lowerMessage.includes("earn") && lowerMessage.includes("stak")) {
    responses.push({
      sender: "ai",
      text: "💸 **Staking Rewards on Somnia:**\\n\\n🎯 **APR Range:** 15-20% annually\\n📅 **Rewards:** Paid out every epoch (~24h)\\n⏱️ **Unbonding:** 21 days\\n\\n**Example:**\\n100 STT staked → ~18.5 STT/year\\n1,000 STT staked → ~185 STT/year\\n\\nReady to start? Try: 'Stake 100 STT'",
      type: "text"
    });
    return { messages: responses };
  }
  
  // "What is Somnia?" - exact match priority
  if ((lowerMessage === "what is somnia?" || lowerMessage === "what is somnia") || 
      (lowerMessage.includes("what") && lowerMessage.includes("somnia") && !lowerMessage.includes("unique") && !lowerMessage.includes("makes"))) {
    responses.push({
      sender: "ai",
      text: "🌐 **Somnia** is a high-performance EVM-compatible blockchain designed for ultra-fast transactions and low fees.\\n\\n**Key Features:**\\n• ⚡ 400,000+ TPS capacity\\n• 🚀 Sub-second finality\\n• 💰 Extremely low transaction costs\\n• 🔗 Full Ethereum compatibility\\n• 🎮 Optimized for gaming and DeFi\\n\\nAither helps you interact with Somnia's DeFi ecosystem using natural language - no complex commands needed!",
      type: "text"
    });
    return { messages: responses };
  }
  
  // "What makes Somnia unique?"
  if ((lowerMessage.includes("unique") || lowerMessage.includes("special") || lowerMessage.includes("different") || lowerMessage.includes("makes")) && lowerMessage.includes("somnia")) {
    responses.push({
      sender: "ai",
      text: "✨ **What Makes Somnia Unique:**\\n\\n🚀 **Speed** - 400K+ TPS vs Ethereum's ~15 TPS\\n⚡ **Finality** - Sub-second vs minutes on other chains\\n💸 **Cost** - Pennies vs dollars per transaction\\n🎮 **Optimized** - Built for gaming & real-time apps\\n🔗 **Compatible** - Works with all Ethereum tools\\n\\nPerfect for high-frequency DeFi operations!",
      type: "text"
    });
    return { messages: responses };
  }
  
  // "What's my total portfolio value?"
  if (lowerMessage.includes("total") && (lowerMessage.includes("value") || lowerMessage.includes("portfolio"))) {
    responses.push({
      sender: "ai",
      text: "💰 **Your Total Portfolio Value:**\\n\\n📊 Total: **$24,651.00**\\n📈 24h Change: **+8.5%** (+$1,932)\\n🔒 Staked: $1,600.00\\n💧 Liquid: $23,051.00\\n\\nYour portfolio is performing well! Want to see the breakdown? Try 'Show my portfolio performance'",
      type: "text"
    });
    return { messages: responses };
  }
  
  // "How do I get started with Somnia?"
  if ((lowerMessage.includes("started") || lowerMessage.includes("get started") || lowerMessage.includes("begin")) && !lowerMessage.includes("vote")) {
    responses.push({
      sender: "ai",
      text: "🚀 **Getting Started with Somnia is Easy!**\\n\\n1️⃣ **Connect Your Wallet** - Already done! ✅\\n2️⃣ **Get STT Tokens** - Visit the Somnia faucet\\n3️⃣ **Explore DeFi** - Try staking, swapping, or governance\\n4️⃣ **Use Aither** - Just ask me in plain English!\\n\\nTry: 'Show my balance' or 'Stake 100 STT'",
      type: "text"
    });
    return { messages: responses };
  }
  
  // "What is the current price of STT?" or "Show token prices"
  if ((lowerMessage.includes("price") || lowerMessage.includes("current price")) && (lowerMessage.includes("stt") || lowerMessage.includes("token"))) {
    responses.push({
      sender: "ai",
      text: "💰 **Current STT Token Price:**\\n\\n**Price:** $2.00\\n**24h Change:** +5.2% 📈\\n**Market Cap:** $2.0B\\n**24h Volume:** $125M\\n**Circulating Supply:** 1B STT\\n\\n**Other Tokens:**\\n• ETH: $2,000 (+2.1%)\\n• USDC: $1.00 (0%)\\n• USDT: $1.00 (0%)",
      type: "text"
    });
    return { messages: responses };
  }
  
  // "How do I vote?" or "How do I vote on proposals?"
  if (lowerMessage.includes("how") && lowerMessage.includes("vote")) {
    responses.push({
      sender: "ai",
      text: "🗳️ **How to Vote on Proposals:**\\n\\n1️⃣ View proposals: 'Show proposals'\\n2️⃣ Read the details carefully\\n3️⃣ Tell me: 'Vote YES on proposal #1'\\n4️⃣ Confirm the transaction\\n\\n**Voting Power:**\\nBased on your staked STT\\nMore stake = more voting power\\n\\nParticipate in Somnia's governance!",
      type: "text"
    });
    return { messages: responses };
  }
  
  // PRIORITY 2: Action commands
  // Pattern matching for different intents
  if (lowerMessage.includes("balance") || lowerMessage.includes("portfolio")) {
    if (lowerMessage.includes("performance") || lowerMessage.includes("allocation")) {
      // Full portfolio view
      responses.push({
        sender: "ai",
        text: "Fetching your portfolio data...",
        type: "text"
      });
      
      responses.push({
        sender: "ai",
        text: diotsrh_RESPONSES.balance.text,
        type: "balance",
        balances: diotsrh_RESPONSES.balance.balances
      });
      
      responses.push({
        sender: "ai",
        text: diotsrh_RESPONSES.portfolio.text,
        type: "pie",
        pie: diotsrh_RESPONSES.portfolio.pie
      });
      
      responses.push({
        sender: "ai",
        text: "Your portfolio is well-balanced with strong diversification across major assets. Total value: $24,651 (+8.5% 24h)",
        type: "text"
      });
    } else {
      // Just balance
      responses.push({
        sender: "ai",
        text: "Fetching your balance...",
        type: "text"
      });
      
      responses.push({
        sender: "ai",
        text: diotsrh_RESPONSES.balance.text,
        type: "balance",
        balances: diotsrh_RESPONSES.balance.balances
      });
    }
  }
  
  else if (lowerMessage.includes("stake") || lowerMessage.includes("staking")) {
    if (lowerMessage.includes("unstake") || lowerMessage.includes("undelegate")) {
      responses.push({
        sender: "ai",
        text: "Fetching your staking positions...",
        type: "text"
      });
      
      responses.push({
        sender: "ai",
        text: "Here are your active staking positions. Select one to unstake:",
        type: "unstake",
        stake_info: [
          {
            validator: "Somnia Foundation",
            stakedAmount: "500",
            rewards: "12.5",
            apr: "18.5%"
          },
          {
            validator: "Crypto Validators",
            stakedAmount: "300",
            rewards: "7.8",
            apr: "17.2%"
          }
        ]
      });
    } else {
      responses.push({
        sender: "ai",
        text: "I'll help you stake your tokens. Analyzing validators...",
        type: "text"
      });
      
      responses.push({
        sender: "ai",
        text: diotsrh_RESPONSES.stake.text,
        type: "validators",
        validators: diotsrh_RESPONSES.stake.validators
      });
    }
  }
  
  else if (lowerMessage.includes("swap") || lowerMessage.includes("exchange") || lowerMessage.includes("trade")) {
    responses.push({
      sender: "ai",
      text: "Analyzing best swap route...",
      type: "text"
    });
    
    responses.push({
      sender: "ai",
      text: diotsrh_RESPONSES.swap.text,
      type: "swap",
      contractInput: diotsrh_RESPONSES.swap.contractInput
    });
  }
  
  else if (lowerMessage.includes("send") || lowerMessage.includes("transfer")) {
    responses.push({
      sender: "ai",
      text: "Preparing transfer...",
      type: "text"
    });
    
    responses.push({
      sender: "ai",
      text: diotsrh_RESPONSES.transfer.text,
      type: "send_token",
      send: diotsrh_RESPONSES.transfer.send
    });
  }
  
  else if (lowerMessage.includes("proposal") || lowerMessage.includes("governance") || lowerMessage.includes("vote")) {
    responses.push({
      sender: "ai",
      text: "Fetching active governance proposals...",
      type: "text"
    });
    
    responses.push({
      sender: "ai",
      text: diotsrh_RESPONSES.proposals.text,
      type: "proposals",
      proposals: diotsrh_RESPONSES.proposals.proposals
    });
    
    responses.push({
      sender: "ai",
      text: "There are currently 2 active proposals in voting period. Would you like to vote on any of them?",
      type: "text"
    });
  }
  
  else if (lowerMessage.includes("metric") || lowerMessage.includes("network") || lowerMessage.includes("stats")) {
    responses.push({
      sender: "ai",
      text: "Gathering network performance data...",
      type: "text"
    });
    
    responses.push({
      sender: "ai",
      text: diotsrh_RESPONSES.metrics.text,
      type: "llama",
      llama: diotsrh_RESPONSES.metrics.llama
    });
    
    responses.push({
      sender: "ai",
      text: "The network is performing excellently with 2,500 TPS and 0.4s block times!",
      type: "text"
    });
  }
  
  else if (lowerMessage.includes("token") && (lowerMessage.includes("info") || lowerMessage.includes("metadata") || lowerMessage.includes("details"))) {
    responses.push({
      sender: "ai",
      text: "Fetching token information...",
      type: "text"
    });
    
    responses.push({
      sender: "ai",
      text: diotsrh_RESPONSES.tokenInfo.text,
      type: "tokenmetadata",
      metadata: diotsrh_RESPONSES.tokenInfo.metadata
    });
  }
  
  else if (lowerMessage.includes("hello") || lowerMessage.includes("hi") || lowerMessage.includes("hey")) {
    responses.push({
      sender: "ai",
      text: "👋 Hello! I'm Aither, your AI DeFi copilot on Somnia. I can help you with:\\n\\n• Check portfolio balance\\n• Stake/unstake tokens\\n• Swap tokens\\n• View governance proposals\\n• Network metrics\\n• And much more!\\n\\nWhat would you like to do?",
      type: "text"
    });
  }
  
  else if (lowerMessage.includes("current") && lowerMessage.includes("tps")) {
    responses.push({
      sender: "ai",
      text: "🚀 **Current Somnia Network Performance:**\\n\\n⚡ **TPS:** 2,500 (real-time)\\n💪 **Capacity:** 400,000+ TPS\\n⏱️ **Block Time:** 0.4 seconds\\n🟢 **Status:** Healthy\\n\\nThe network is running at ~0.6% of max capacity. Plenty of room for growth!",
      type: "text"
    });
  }
  
  else if ((lowerMessage.includes("what") || lowerMessage.includes("who")) && (lowerMessage.includes("you") || lowerMessage.includes("aither"))) {
    responses.push({
      sender: "ai",
      text: "🤖 I'm **Aither**, your AI-powered DeFi copilot built specifically for the Somnia blockchain!\\n\\n**What I do:**\\n• Execute DeFi operations through natural language\\n• Analyze and recommend optimal strategies\\n• Manage your portfolio and staking\\n• Provide real-time network insights\\n• Handle token swaps with best routes\\n\\nJust tell me what you want to do in plain English, and I'll handle the technical complexity!",
      type: "text"
    });
  }
  
  else if (lowerMessage.includes("feature") || lowerMessage.includes("can you do") || lowerMessage.includes("capabilities")) {
    responses.push({
      sender: "ai",
      text: "✨ **Aither's Capabilities:**\\n\\n📊 **Portfolio Management**\\n• Real-time balance tracking\\n• Asset allocation analysis\\n• Performance metrics\\n\\n🎯 **Staking**\\n• Automated validator selection\\n• Rewards tracking\\n• Easy stake/unstake\\n\\n💱 **Trading**\\n• Optimal DEX routing\\n• Slippage protection\\n• Price impact analysis\\n\\n🏛️ **Governance**\\n• Proposal viewing\\n• Voting assistance\\n• Network metrics\\n\\nTry any feature by just asking in natural language!",
      type: "text"
    });
  }
  
  else if (lowerMessage.includes("help")) {
    responses.push({
      sender: "ai",
      text: "🤖 **Aither diotsrh Commands**\\n\\nTry these example queries:\\n\\n📊 **Portfolio**\\n• \\\"Show my balance\\\"\\n• \\\"Portfolio performance\\\"\\n\\n🎯 **Staking**\\n• \\\"Stake 100 STT\\\"\\n• \\\"Show my staking positions\\\"\\n• \\\"Unstake from validator\\\"\\n\\n💱 **Trading**\\n• \\\"Swap 1 ETH for STT\\\"\\n• \\\"Show token prices\\\"\\n\\n🏛️ **Governance**\\n• \\\"Show proposals\\\"\\n• \\\"Network metrics\\\"\\n\\n💸 **Transfers**\\n• \\\"Send 100 STT to address\\\"",
      type: "text"
    });
  }
  
  else {
    // Default response for unrecognized queries - be helpful!
    responses.push({
      sender: "ai",
      text: `I'd be happy to help with that! While I'm in diotsrh mode, I can show you various DeFi operations.\\n\\n**Try these popular commands:**\\n💰 "Show my balance" - View your portfolio\\n🎯 "Stake 100 STT" - Start earning rewards\\n🔄 "Swap 1 ETH for STT" - Trade tokens\\n🏛️ "Show proposals" - View governance\\n📊 "Show network metrics" - Network stats\\n\\nType "help" to see all available commands!`,
      type: "text"
    });
  }
  
  return { messages: responses };
};

/**
 * Check if we should use diotsrh responses
 */
export const shouldUsediotsrhMode = (): boolean => {
  return isdiotsrhMode();
};

/**
 * Get a pre-configured diotsrh conversation flow
 */
export const getdiotsrhConversation = (type: keyof typeof diotsrh_CONVERSATIONS): ChatMessage[] => {
  return diotsrh_CONVERSATIONS[type] || [];
};
