import { ethers } from 'ethers';

export interface SomniaNetwork {
  chainId: string;
  chainIdHex: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const SOMNIA_TESTNET: SomniaNetwork = {
  chainId: process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID || '2323',
  chainIdHex: '0x' + (parseInt(process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID || '2323')).toString(16),
  chainName: process.env.NEXT_PUBLIC_SOMNIA_NETWORK_NAME || 'Somnia Testnet (Shannon)',
  nativeCurrency: {
    name: 'Somnia Test Token',
    symbol: process.env.NEXT_PUBLIC_STT_SYMBOL || 'STT',
    decimals: 18,
  },
  rpcUrls: [process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || 'https://testnet.somnia.network'],
  blockExplorerUrls: [process.env.NEXT_PUBLIC_SOMNIA_EXPLORER_URL || 'https://explorer.testnet.somnia.network'],
};

/**
 * Check if MetaMask is installed
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).ethereum !== 'undefined';
}

/**
 * Get the current chain ID from MetaMask
 */
export async function getCurrentChainId(): Promise<string | null> {
  if (!isMetaMaskInstalled()) return null;
  
  try {
    const ethereum = (window as any).ethereum;
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    return chainId;
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
}

/**
 * Check if currently connected to Somnia network
 */
export async function isConnectedToSomnia(): Promise<boolean> {
  const currentChainId = await getCurrentChainId();
  return currentChainId === SOMNIA_TESTNET.chainIdHex;
}

/**
 * Add Somnia network to MetaMask
 */
export async function addSomniaNetwork(): Promise<{ success: boolean; error?: string }> {
  if (!isMetaMaskInstalled()) {
    return { success: false, error: 'MetaMask is not installed' };
  }

  try {
    const ethereum = (window as any).ethereum;
    
    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: SOMNIA_TESTNET.chainIdHex,
          chainName: SOMNIA_TESTNET.chainName,
          nativeCurrency: SOMNIA_TESTNET.nativeCurrency,
          rpcUrls: SOMNIA_TESTNET.rpcUrls,
          blockExplorerUrls: SOMNIA_TESTNET.blockExplorerUrls,
        },
      ],
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error adding Somnia network:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to add network' 
    };
  }
}

/**
 * Switch to Somnia network
 */
export async function switchToSomniaNetwork(): Promise<{ success: boolean; error?: string }> {
  if (!isMetaMaskInstalled()) {
    return { success: false, error: 'MetaMask is not installed' };
  }

  try {
    const ethereum = (window as any).ethereum;
    
    // Try to switch to Somnia network
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SOMNIA_TESTNET.chainIdHex }],
    });

    return { success: true };
  } catch (error: any) {
    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      // Try to add the network
      return await addSomniaNetwork();
    }

    console.error('Error switching to Somnia network:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to switch network' 
    };
  }
}

/**
 * Connect wallet and ensure Somnia network
 */
export async function connectWalletToSomnia(): Promise<{
  success: boolean;
  address?: string;
  provider?: ethers.BrowserProvider;
  error?: string;
}> {
  if (!isMetaMaskInstalled()) {
    return { 
      success: false, 
      error: 'MetaMask is not installed. Please install MetaMask to continue.' 
    };
  }

  try {
    const ethereum = (window as any).ethereum;

    // Request account access
    const accounts = await ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    if (accounts.length === 0) {
      return { success: false, error: 'No accounts found' };
    }

    // Check if on Somnia network
    const isOnSomnia = await isConnectedToSomnia();
    
    if (!isOnSomnia) {
      // Try to switch to Somnia
      const switchResult = await switchToSomniaNetwork();
      
      if (!switchResult.success) {
        return { 
          success: false, 
          error: 'Please switch to Somnia Testnet to continue' 
        };
      }
    }

    // Create provider
    const provider = new ethers.BrowserProvider(ethereum);

    return {
      success: true,
      address: accounts[0],
      provider,
    };
  } catch (error: any) {
    console.error('Error connecting wallet:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to connect wallet' 
    };
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(
  address: string,
  provider?: ethers.BrowserProvider
): Promise<{ balance: string; balanceFormatted: string } | null> {
  try {
    const ethProvider = provider || new ethers.BrowserProvider((window as any).ethereum);
    const balance = await ethProvider.getBalance(address);
    const balanceFormatted = ethers.formatEther(balance);

    return {
      balance: balance.toString(),
      balanceFormatted,
    };
  } catch (error) {
    console.error('Error getting balance:', error);
    return null;
  }
}

/**
 * Watch for account changes
 */
export function onAccountsChanged(callback: (accounts: string[]) => void): () => void {
  if (!isMetaMaskInstalled()) return () => {};

  const ethereum = (window as any).ethereum;
  ethereum.on('accountsChanged', callback);

  // Return cleanup function
  return () => {
    ethereum.removeListener('accountsChanged', callback);
  };
}

/**
 * Watch for chain changes
 */
export function onChainChanged(callback: (chainId: string) => void): () => void {
  if (!isMetaMaskInstalled()) return () => {};

  const ethereum = (window as any).ethereum;
  ethereum.on('chainChanged', callback);

  // Return cleanup function
  return () => {
    ethereum.removeListener('chainChanged', callback);
  };
}

/**
 * Get network info
 */
export async function getNetworkInfo(): Promise<{
  chainId: string;
  name: string;
  isTestnet: boolean;
  isSomnia: boolean;
} | null> {
  try {
    const chainId = await getCurrentChainId();
    if (!chainId) return null;

    const isSomnia = chainId === SOMNIA_TESTNET.chainIdHex;

    return {
      chainId,
      name: isSomnia ? SOMNIA_TESTNET.chainName : 'Unknown Network',
      isTestnet: true,
      isSomnia,
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return null;
  }
}

/**
 * Format address for display
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Generate explorer URL for transaction
 */
export function getExplorerUrl(txHash: string, type: 'tx' | 'address' = 'tx'): string {
  const baseUrl = SOMNIA_TESTNET.blockExplorerUrls[0];
  return `${baseUrl}/${type}/${txHash}`;
}

/**
 * Request STT tokens from faucet (if available)
 */
export async function requestFaucetTokens(address: string): Promise<{
  success: boolean;
  message: string;
  txHash?: string;
}> {
  try {
    // This would call the actual Somnia faucet API
    // For now, return a placeholder response
    return {
      success: false,
      message: 'Please request STT tokens from the Somnia faucet: https://faucet.somnia.network',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to request faucet tokens',
    };
  }
}

/**
 * Check if wallet has sufficient balance for operation
 */
export async function checkSufficientBalance(
  address: string,
  requiredAmount: string,
  provider?: ethers.BrowserProvider
): Promise<{ sufficient: boolean; current: string; required: string }> {
  const balanceInfo = await getWalletBalance(address, provider);
  
  if (!balanceInfo) {
    return {
      sufficient: false,
      current: '0',
      required: requiredAmount,
    };
  }

  const current = ethers.parseEther(balanceInfo.balanceFormatted);
  const required = ethers.parseEther(requiredAmount);

  return {
    sufficient: current >= required,
    current: balanceInfo.balanceFormatted,
    required: requiredAmount,
  };
}
