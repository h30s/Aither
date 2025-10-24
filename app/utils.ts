import type { ChatMessage } from "./types";
import { ethers } from "ethers";
import { isdiotsrhMode } from "./utils/diotsrhData";

// diotsrh mode stub for msgBroadcastClient
export const msgBroadcastClient = () => {
  if (isdiotsrhMode()) {
    // Return a mock client for diotsrh mode
    return {
      broadcast: async ({ injectiveAddress, msgs }: { injectiveAddress: string; msgs: unknown }) => {
        // Simulate a successful transaction
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          txHash: "0x" + Math.random().toString(16).substring(2, 66),
          success: true
        };
      }
    };
  }
  
  // In production, this would return the real client
  // You'll need to import and return your actual msgBroadcastClient implementation
  throw new Error("msgBroadcastClient not implemented for production mode");
};

export const createChatMessage = ({
  sender,
  text = "No response from AI, try again.",
  type,
  balances = null,
  validators = null,
  contractInput = null,
  send = null,
  intent = null,
  pie = null,
  token_metadata = null,
  llama = null,
  stake_info = null,
  proposals = null,
}: ChatMessage): ChatMessage => {
  return {
    sender,
    text,
    type,
    intent,
    balances,
    validators,
    contractInput,
    token_metadata,
    pie,
    send,
    llama,
    stake_info,
    proposals,
  };
};

// Somnia/Ethereum provider utilities
export const getEthereumProvider = (): ethers.BrowserProvider | null => {
  if (typeof window === 'undefined' || !(window as { ethereum?: unknown }).ethereum) {
    return null;
  }
  return new ethers.BrowserProvider((window as { ethereum: unknown }).ethereum);
};

export const getSigner = async (): Promise<ethers.Signer | null> => {
  const provider = getEthereumProvider();
  if (!provider) return null;
  try {
    return await provider.getSigner();
  } catch (error) {
    console.error("Error getting signer:", error);
    return null;
  }
};
