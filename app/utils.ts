import type { ChatMessage } from "./types";
import { ethers } from "ethers";

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
