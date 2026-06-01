import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const IrisAI = async ({
  prompt,
  onToken,
}: {
  prompt: string;
  onToken?: (token: string) => void;
}) => {
  const model = new ChatOllama({
    model: "qwen3:1.7b",
    temperature: 0,
    think: false,
  });

  const messages = [
    new SystemMessage(
      `You are a powerful AI Assistant named IRIS Zero. You can control the user's full computer just by voice. IRIS Zero is a 100% local AI assistant that works without internet.`,
    ),
    new HumanMessage(prompt),
  ];

  let fullText = "";

  const stream = await model.stream(messages);

  for await (const chunk of stream) {
    const token = chunk.content as string;
    if (token) {
      fullText += token;
      onToken?.(token);
    }
  }

  return fullText;
};

export default IrisAI;
