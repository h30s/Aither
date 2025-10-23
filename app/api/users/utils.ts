import { supabase } from "@/lib/supabaseClient";

export async function getMessages(chatId: number) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }

  return data;
}

export async function getInjectiveAddress(injectiveAddress: string): Promise<{ data: { wallet_address: string } | null; error: unknown }> {
  const { data, error } = await supabase
    .from("users")
    .select("wallet_address")
    .eq("wallet_address", injectiveAddress)
    .maybeSingle();

  if (error) {
    console.error("Error fetching injective address:", error);
    return { data: null, error };
  }

  // Auto-create user if not found
  if (!data) {
    const createResult = await createInjectiveIfNotExists(injectiveAddress);
    if (createResult.error) {
      return { data: null, error: createResult.error };
    }
    return { data: { wallet_address: injectiveAddress }, error: null };
  }

  return { data, error: null };
}

export async function createInjectiveIfNotExists(injectiveAddress: string): Promise<{ data: unknown | null; error: unknown }> {
  const { data: existingInjective } = await supabase
    .from("users")
    .select("wallet_address")
    .eq("wallet_address", injectiveAddress)
    .maybeSingle();

  if (existingInjective) {
    return { data: existingInjective, error: null };
  }

  const { data, error } = await supabase
    .from("users")
    .insert([{wallet_address: injectiveAddress}])
    .select()
    .single();

  if (error) {
    console.error("Error creating injective:", error);
    return { data: null, error };
  }

  return { data, error: null };
}

export async function sendMessageToDB(chatId: number, senderId: number, message: object) {
  const { data, error } = await supabase
    .from("messages")
    .insert([{ chat_id: chatId, sender_id: senderId, message }]);

  if (error) {
    console.error("Error sending message:", error);
    return error;
  }

  return data;
}
