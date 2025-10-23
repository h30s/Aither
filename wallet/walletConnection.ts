import { connectWalletToSomnia, isMetaMaskInstalled } from "@/lib/somnia-wallet";
import { ethers } from "ethers";

export const connectToWallet = async (): Promise<{ 
  address: string | null; 
  wallet: string; 
  token: string | null 
}> => {
  try {
    if (!isMetaMaskInstalled()) {
      console.error("MetaMask is not installed.");
      return { address: null, wallet: "metamask", token: null };
    }

    const result = await connectWalletToSomnia();

    if (!result.success || !result.address) {
      console.error("Failed to connect wallet:", result.error);
      return { address: null, wallet: "metamask", token: null };
    }

    const address = result.address;

    // Check if user exists
    const res = await fetch("/api/users", {
      method: "GET",
      headers: { "Content-Type": "application/json", walletAddress: address },
    });

    const userData = await res.json();

    if (userData.data == null) {
      return { address, wallet: "metamask", token: null };
    }

    // Get nonce for signing
    const nonceRes = await fetch("/api/auth/nonce", {
      method: "POST",
      body: JSON.stringify({ address }),
    });
    const nonceData = await nonceRes.json();

    // Sign message with MetaMask
    const { status, token } = await signMessage(address, nonceData.nonce, result.provider);

    if (status === "success") {
      return { address, wallet: "metamask", token };
    }

    return { address: null, wallet: "metamask", token: null };
  } catch (error) {
    console.error(`Error connecting to MetaMask:`, error);
    return { address: null, wallet: "metamask", token: null };
  }
};

const signMessage = async (
  address: string,
  nonce: string,
  provider?: ethers.BrowserProvider
): Promise<{ status: string; token: string | null }> => {
  try {
    const ethProvider = provider || new ethers.BrowserProvider((window as { ethereum: unknown }).ethereum);
    const signer = await ethProvider.getSigner();
    
    // Sign the nonce message
    const message = `Sign this message to authenticate with Aither-Somnia.\n\nNonce: ${nonce}`;
    const signature = await signer.signMessage(message);

    if (signature) {
      const res = await fetch("/api/auth/verifyArbitrary", {
        method: "POST",
        body: JSON.stringify({ nonce, signature, address }),
      });
      const { isValid, token } = await res.json();

      if (isValid) {
        return { status: "success", token };
      }
    }

    return { status: "failed", token: null };
  } catch (error) {
    console.error("Signing error:", error);
    return { status: "failed", token: null };
  }
};
