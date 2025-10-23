import { connectWalletToSomnia } from "@/lib/somnia-wallet";

export const connectWallet = async (addToChat: (msg: any) => void) => {
  try {
    const result = await connectWalletToSomnia();

    if (!result.success || !result.address) {
      alert(result.error || "Failed to connect MetaMask wallet. Please try again.");
      return;
    }

    const walletAddress = result.address;
    const res = await fetch("/api/db", {
      method: "POST",
      body: JSON.stringify({ type: "createSomnia", walletAddress }),
    });

    localStorage.setItem("walletAddress", walletAddress);

    alert(`Connected! Your Somnia address is: ${walletAddress}`);

    addToChat({
      sender: "system",
      text: `User's Somnia wallet address is: ${walletAddress}. If user asks you about their wallet address, you need to remember it.`,
      type: "text",
      intent: "general",
    });

    return walletAddress;
  } catch (error) {
    console.error("Error connecting to MetaMask:", error);
    alert("Failed to connect MetaMask wallet. Please try again.");
  }
};
