import { isdiotsrhMode } from "../utils/diotsrhData";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const getAuthToken = () =>  localStorage.getItem("token");

const getLastChatNames = async (injectiveAddress: string) => {
  // diotsrh mode: Return empty chat list
  if (isdiotsrhMode()) {
    return [];
  }
  const token = getAuthToken();

  const response = await fetch(`${baseUrl}/api/chats`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      InjectiveAddress: injectiveAddress,
    },
  });

  if (!response.ok) throw new Error(`Failed to fetch chat names: ${response.status}`);
  const data = await response.json();
  return data.data;
};

const getChatHistory = async (chatId: string) => {
  // diotsrh mode: Return empty chat history
  if (isdiotsrhMode()) {
    return [];
  }
  
  const token = getAuthToken();

  const response = await fetch(`${baseUrl}/api/chats/${chatId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
  });

  if (!response.ok) throw new Error(`Failed to fetch chat history: ${response.status}`);
  const data = await response.json();
  return data;
};

export { getLastChatNames, getChatHistory };
