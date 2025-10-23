/**
 * Somnia Network Configuration for Wallet Integration
 * Supports MetaMask and WalletConnect auto-add functionality
 */

export interface SomniaNetworkConfig {
  chainId: string;
  chainIdHex: string;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrls: string[];
}

export const SOMNIA_NETWORK: SomniaNetworkConfig = {
  chainId: process.env.NEXT_PUBLIC_SOMNIA_CHAIN_ID || "2323",
  chainIdHex: "0x913", // 2323 in hex
  chainName: process.env.NEXT_PUBLIC_SOMNIA_NETWORK_NAME || "Somnia Testnet (Shannon)",
  rpcUrls: [process.env.NEXT_PUBLIC_SOMNIA_RPC_URL || "https://testnet.somnia.network"],
  nativeCurrency: {
    name: "Somnia Test Token",
    symbol: process.env.NEXT_PUBLIC_STT_SYMBOL || "STT",
    decimals: 18,
  },
  blockExplorerUrls: [
    process.env.NEXT_PUBLIC_SOMNIA_EXPLORER_URL || "https://explorer.testnet.somnia.network",
  ],
};

/**
 * Add Somnia network to MetaMask
 * Automatically switches to Somnia if already added
 */
export const addSomniaToMetaMask = async (): Promise<boolean> => {
  if (!window.ethereum) {
    console.error("MetaMask is not installed");
    return false;
  }

  try {
    // Try to switch to Somnia network first
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SOMNIA_NETWORK.chainIdHex }],
      });
      console.log("Switched to Somnia network");
      return true;
    } catch (switchError: any) {
      // Network not added, proceed to add it
      if (switchError.code === 4902) {
        // Add the network
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SOMNIA_NETWORK.chainIdHex,
              chainName: SOMNIA_NETWORK.chainName,
              rpcUrls: SOMNIA_NETWORK.rpcUrls,
              nativeCurrency: SOMNIA_NETWORK.nativeCurrency,
              blockExplorerUrls: SOMNIA_NETWORK.blockExplorerUrls,
            },
          ],
        });
        console.log("Somnia network added to MetaMask");
        return true;
      } else {
        throw switchError;
      }
    }
  } catch (error) {
    console.error("Error adding Somnia network to MetaMask:", error);
    return false;
  }
};

/**
 * Connect to MetaMask with Somnia network
 * Returns the connected address or null
 */
export const connectMetaMaskWithSomnia = async (): Promise<string | null> => {
  if (!window.ethereum) {
    alert("MetaMask is not installed. Please install it and try again.");
    return null;
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      console.error("No accounts found");
      return null;
    }

    // Add/switch to Somnia network
    const networkAdded = await addSomniaToMetaMask();
    if (!networkAdded) {
      console.error("Failed to add Somnia network");
      return null;
    }

    return accounts[0];
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    return null;
  }
};

/**
 * Check if current network is Somnia
 */
export const isOnSomniaNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    return chainId === SOMNIA_NETWORK.chainIdHex;
  } catch (error) {
    console.error("Error checking network:", error);
    return false;
  }
};

/**
 * Get current connected address
 */
export const getCurrentAddress = async (): Promise<string | null> => {
  if (!window.ethereum) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });
    return accounts && accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error("Error getting current address:", error);
    return null;
  }
};

/**
 * Listen to account changes
 */
export const onAccountsChanged = (callback: (accounts: string[]) => void) => {
  if (!window.ethereum) {
    return;
  }

  window.ethereum.on("accountsChanged", callback);
};

/**
 * Listen to network changes
 */
export const onChainChanged = (callback: (chainId: string) => void) => {
  if (!window.ethereum) {
    return;
  }

  window.ethereum.on("chainChanged", callback);
};

/**
 * Format address for display (0x1234...5678)
 */
export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Get block explorer URL for an address
 */
export const getExplorerUrl = (address: string, type: "address" | "tx" = "address"): string => {
  const baseUrl = SOMNIA_NETWORK.blockExplorerUrls[0];
  return `${baseUrl}/${type}/${address}`;
};

// TypeScript declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
