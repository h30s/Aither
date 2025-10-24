import { createChatMessage } from "@/app/utils";
import { queryaitherJoke } from "../ai";
import { querySoniaJoke } from "../sonia";

export async function jokeTool(
    intent: string,
    message: string,
    chatHistory: any[],
    addToChat: (msg: any) => void,
    address: string | null
) {
    let messages: any[] = [];
    let latestMessage = message;
    const randNumber = getRandomNumber();

    for (let i = 0; i < randNumber; i++) {
        
        const aitherResponse = await queryaitherJoke(latestMessage, messages);
        messages.push({ sender: "aither", text: aitherResponse });

        addToChat(
            createChatMessage({
                sender: "ai",
                text: aitherResponse,
                type: "text",
                intent: intent,
            })
        );

        
        if (aitherResponse) {
            const soniaResponse = await querySoniaJoke(aitherResponse, messages);
            messages.push({ sender: "sonia", text: soniaResponse });

            addToChat(
                createChatMessage({
                    sender: "sonia",
                    text: soniaResponse,
                    type: "text",
                    intent: intent,
                })
            );

            
            if(soniaResponse){
                latestMessage = soniaResponse;
            }
        }
    }
}

const getRandomNumber = (): number => {
    const numbers = [1, 2, 3];
    return numbers[Math.floor(Math.random() * numbers.length)];
  };
