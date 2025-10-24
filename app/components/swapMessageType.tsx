import { MsgExecuteContractCompat } from "@injectivelabs/sdk-ts";
import type { ChatMessage, ContractInput } from "../types";
import { createChatMessage, msgBroadcastClient } from "../utils";
import { isdiotsrhMode } from "../utils/diotsrhData";

const SwapMessageType = ({
  text = "",
  executing,
  handleExit,
  contractInput,
  updateChat,
  updateExecuting,
  injectiveAddress,
}: {
  text?: string;
  executing: boolean;
  handleExit: () => void;
  contractInput: ContractInput;
  updateChat: (cb: (prevChat: ChatMessage[]) => ChatMessage[]) => void;
  updateExecuting: (executing: boolean) => void;
  injectiveAddress: string | null;
}) => {
  const confirmSwap = async (contractInput: ContractInput) => {
    try {
      if (injectiveAddress === null) {
        return;
      }
      updateExecuting(true);
      
      // diotsrh Mode: Simulate swap without blockchain interaction
      if (isdiotsrhMode()) {
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockTxHash = "0x" + Math.random().toString(16).substring(2, 66);
        
        updateChat((prevChat) => [
          ...prevChat,
          createChatMessage({
            sender: "ai",
            text: `✅ **Swap Successful!**\n\n📄 Transaction Hash: \`${mockTxHash}\`\n\n🔄 You swapped **${contractInput.amountIn || "1.0"} ${contractInput.tokenIn || "ETH"}** for **${contractInput.amountOut || "500.25"} ${contractInput.tokenOut || "STT"}**\n\n⭐ Price Impact: ${contractInput.priceImpact || "0.2%"}\n⛽ Gas Used: ${contractInput.estimatedGas || "0.002 ETH"}\n\nYour tokens have been successfully swapped!`,
            type: "success",
          }),
        ]);
        
        updateExecuting(false);
        handleExit(); // Close the swap dialog
        return;
      }
      
      // Real mode: Execute actual blockchain transaction
      if (contractInput.executeMsg.send !== undefined) {
        const msg = MsgExecuteContractCompat.fromJSON({
          sender: injectiveAddress,
          contractAddress: contractInput.address,
          exec: {
            msg: contractInput.executeMsg.send,
            action: "send",
          },
        });
        const msgClient = msgBroadcastClient();

        const res = await msgClient.broadcast({
          injectiveAddress: injectiveAddress,
          msgs: msg,
        });
        updateChat((prevChat) => [
          ...prevChat,
          createChatMessage({
            sender: "ai",
            text: `Swap success ! Here is your tx Hash : ${res.txHash}`,
            type: "text",
            intent: "general",
          }),
        ]);
      } else {
        const msg = MsgExecuteContractCompat.fromJSON({
          sender: injectiveAddress,
          contractAddress: contractInput.address,
          exec: {
            msg: contractInput.executeMsg.execute_routes,
            action: "execute_routes",
          },
          funds: contractInput.funds,
        });
        const msgClient = msgBroadcastClient();

        const res = await msgClient.broadcast({
          injectiveAddress: injectiveAddress,
          msgs: msg,
        });
        updateChat((prevChat) => [
          ...prevChat,
          createChatMessage({
            sender: "ai",
            text: `Swap success ! Here is your tx Hash : ${res.txHash}`,
            type: "text",
            intent: "general",
          }),
        ]);
      }
      updateExecuting(false);
    } catch (error) {
      if (error instanceof Error) {
        updateExecuting(false);
        const errorMessage = error.message;

        // Check if the error message indicates that the minimum receive amount condition failed.
        if (errorMessage.includes("minimum receive amount")) {
          updateChat((prevChat) => [
            ...prevChat,
            createChatMessage({
              sender: "ai",
              text: `Swap failed, Error : 'The swap failed because your minimum receive amount is too high. ' +    
            'Please adjust your slippage settings at your .env to proceed with the swap.'`,
              type: "text",
              intent: "general",
            }),
          ]);
        } else {
          updateChat((prevChat) => [
            ...prevChat,
            createChatMessage({
              sender: "ai",
              text: `Swap failed, Error : ${errorMessage}`,
              type: "text",
              intent: "general",
            }),
          ]);
        }
      } else {
        // Fallback for errors that are not instances of Error
        updateChat((prevChat) => [
          ...prevChat,
          createChatMessage({
            sender: "ai",
            text: `Swap failed, Error : ${error}`,
            type: "text",
            intent: "general",
          }),
        ]);
      }
    }
  };

  return (
    <div className="p-3 rounded-xl bg-zinc-800 text-white max-w-[75%] ">
      <h3 className="text-lg font-semibold mb-2">Your Swap Details</h3>
      <div>{text}</div>
      {!executing && (
        <div className=" space-x-4">
          <button
            type="button"
            onClick={handleExit}
            className="mt-3 px-4 py-2 bg-white text-red-700 font-semibold rounded-lg hover:bg-gray-300"
          >
            Exit
          </button>
          <button
            type="button"
            onClick={() => {
              if (contractInput) {
                confirmSwap(contractInput);
              }
            }}
            className="mt-3 px-4 py-2 bg-white text-red-700 font-semibold rounded-lg hover:bg-gray-300"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
};

export default SwapMessageType;
