export const SOMNIA_TESTNET = {
  id: 2323,
  name: 'Somnia Testnet (Shannon)',
  network: 'somnia-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia Test Token',
    symbol: 'STT',
  },
  rpcUrls: {
    default: {
      http: [process.env.SOMNIA_RPC_URL || 'https://testnet.somnia.network'],
    },
    public: {
      http: [process.env.SOMNIA_RPC_URL || 'https://testnet.somnia.network'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: process.env.SOMNIA_EXPLORER_URL || 'https://explorer.testnet.somnia.network',
    },
  },
  testnet: true,
} as const;

export const WALLET_CONNECT_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  metadata: {
    name: 'Aither-Somnia',
    description: 'Open-source multi-agent AI copilot for DeFi on Somnia',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://aither-somnia.vercel.app',
    icons: ['https://aither-somnia.vercel.app/icon.png'],
  },
};

export const SUPPORTED_CHAINS = [SOMNIA_TESTNET];

export const DEFAULT_CHAIN = SOMNIA_TESTNET;

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  AGENT_REGISTRY: process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS || '0x0000000000000000000000000000000000000000',
  EXECUTION_PROXY: process.env.NEXT_PUBLIC_EXECUTION_PROXY_ADDRESS || '0x0000000000000000000000000000000000000000',
  SWAP_ADAPTER: process.env.NEXT_PUBLIC_SWAP_ADAPTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  STAKING_ADAPTER: process.env.NEXT_PUBLIC_STAKING_ADAPTER_ADDRESS || '0x0000000000000000000000000000000000000000',
  PORTFOLIO_VIEW: process.env.NEXT_PUBLIC_PORTFOLIO_VIEW_ADDRESS || '0x0000000000000000000000000000000000000000',
  AGENT_ORCHESTRATOR: process.env.NEXT_PUBLIC_AGENT_ORCHESTRATOR_ADDRESS || '0x0000000000000000000000000000000000000000'
} as const;

// Gas configuration for Somnia
export const GAS_CONFIG = {
  gasPrice: '20000000000', // 20 gwei
  gasLimit: {
    swap: 300000,
    stake: 250000,
    unstake: 200000,
    claimRewards: 150000,
    default: 200000
  }
};

// Token configuration
export const TOKENS = {
  STT: {
    address: '0x0000000000000000000000000000000000000000', // Native token
    symbol: 'STT',
    name: 'Somnia Test Token',
    decimals: 18,
    logoURI: '/tokens/stt.png'
  },
  // Add more tokens as needed
} as const;

// Utility functions
export function getSomniaRpcUrl(): string {
  return process.env.SOMNIA_RPC_URL || process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || 'https://testnet.somnia.network';
}

export function getSomniaChainId(): number {
  return parseInt(process.env.SOMNIA_CHAIN_ID || process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID || '2323');
}

export function getSomniaExplorerUrl(): string {
  return process.env.SOMNIA_EXPLORER_URL || process.env.NEXT_PUBLIC_SOMNIA_EXPLORER_URL || 'https://explorer.testnet.somnia.network';
}

export function getTransactionUrl(txHash: string): string {
  return `${getSomniaExplorerUrl()}/tx/${txHash}`;
}

export function getAddressUrl(address: string): string {
  return `${getSomniaExplorerUrl()}/address/${address}`;
}

export function isValidSomniaAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function formatSomniaAmount(amount: string | number, decimals: number = 18): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (value === 0) return '0';
  
  if (value < 0.0001) {
    return value.toExponential(3);
  } else if (value < 1) {
    return value.toFixed(4);
  } else if (value < 1000) {
    return value.toFixed(3);
  } else if (value < 1000000) {
    return `${(value / 1000).toFixed(2)}K`;
  } else {
    return `${(value / 1000000).toFixed(2)}M`;
  }
}

// Network switching helper
export async function switchToSomnia(ethereum: any) {
  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${SOMNIA_TESTNET.id.toString(16)}` }],
    });
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${SOMNIA_TESTNET.id.toString(16)}`,
              chainName: SOMNIA_TESTNET.name,
              nativeCurrency: SOMNIA_TESTNET.nativeCurrency,
              rpcUrls: SOMNIA_TESTNET.rpcUrls.default.http,
              blockExplorerUrls: [SOMNIA_TESTNET.blockExplorers.default.url],
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add Somnia network:', addError);
        return false;
      }
    }
    console.error('Failed to switch to Somnia network:', switchError);
    return false;
  }
}

export default SOMNIA_TESTNET;