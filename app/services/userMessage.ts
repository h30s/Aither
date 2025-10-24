"use server";
import { createTitleFromMessage } from "@/ai/titleManager";
import { fetchWithAuth } from "@/lib/fetch";
import { isdiotsrhMode } from "../utils/diotsrhData";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"; // Default to localhost if not set

export const createChatIfNotExists = async ({
  injectiveAddress,
  senderId,
  userMessage,
  token,
}: {
  injectiveAddress: string;
  senderId: string;
  userMessage: string;
  token: string;
}) => {
  // diotsrh mode: Return mock chat data
  if (isdiotsrhMode()) {
    const mockChatId = "diotsrh-chat-" + Date.now();
    const mockTitle = userMessage.substring(0, 30) + (userMessage.length > 30 ? "..." : "");
    return {
      id: mockChatId,
      title: mockTitle,
      ai_id: "diotsrh-ai-id",
      user_id: "diotsrh-user-id"
    };
  }
  
  const title = await createTitleFromMessage(userMessage);
  const res = await fetch(`${baseUrl}/api/chats`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },

    body: JSON.stringify({ title, injectiveAddress, senderId }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create chat: ${res.statusText}`);
  }

  const { data } = await res.json();

  return { id: data.id, title: data.title, ai_id: data.ai_id, user_id: data.user_id };
};

export const crateInjectiveIfNotExists = async (injectiveAddress: string) => {
  // diotsrh mode: Return mock user data
  if (isdiotsrhMode()) {
    return {
      success: true,
      data: {
        id: "diotsrh-user-id",
        wallet_address: injectiveAddress
      }
    };
  }
  
  const res = await fetch(`${baseUrl}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "createInjective", injectiveAddress }),
  });
  const data = await res.json();
  return data;
};

export const createMessage = async ({
  chatId,
  senderId,
  message,
  token,
}: {
  chatId: string;
  senderId: string;
  message: object;
  token: string;
}) => {
  // diotsrh mode: Skip database operations
  if (isdiotsrhMode()) {
    return {
      success: true,
      data: {
        id: "diotsrh-message-" + Date.now(),
        chat_id: chatId,
        sender_id: senderId,
        message: message
      }
    };
  }
  
  const res = await fetchWithAuth(`${baseUrl}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
    body: JSON.stringify({ chatId, senderId, message }),
  });
  const data = await res.json();
  return data;
};
