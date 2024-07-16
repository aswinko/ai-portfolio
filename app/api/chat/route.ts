import { DataAPIClient } from "@datastax/astra-db-ts";
import MistralClient from "@mistralai/mistralai";
import { NextResponse } from "next/server";

const mistral = new MistralClient(process.env.MISTRAL_API_KEY);

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT || "", {
  namespace: process.env.ASTRA_DB_NAMESPACE,
});

// type Message = {
//   role: "user" | "assistant";
//   content: string;
// };

export async function POST(req: any) {
  try {
    const { messages } = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;

    let dotContent = "";

    const { data } = await mistral.embeddings({
      input: latestMessage,
      model: "mistral-embed",
    });

    const collection = await db.collection("my_portfolio");

    // Perform a similarity search
    const cursor = await collection.find(
      {},
      {
        sort: { $vector: data[0]?.embedding },
        limit: 5,
        includeSimilarity: true,
      }
    );

    const documents = await cursor.toArray();

    dotContent = `
  START CONTEXT
  ${documents?.map((doc) => doc.description).join("\n")}
  END CONTEXT
  `;

    const ragPrompt = [
      {
        role: "system",
        content: `You are an AI assistant answering questions as Aswin K O in hos Portfolio App.
            format responses using markdown where applicable.
            ${dotContent}
            If the answer is not provided in the context, the AI assistant will say,
            "I am sorry, I do not know the answer."`,
      },
    ];

    const response = await mistral.chatStream({
      model: "mistral-tiny",
      // stream: true,
      // max_tokens: 1000,
      messages: [...ragPrompt, ...messages],
    });

    // return new StreamingTextResponse(stream);
    let txt = "";
    let streamText = "";
    for await (const chunk of response) {
      if (chunk.choices[0].delta.content !== undefined) {
        streamText += chunk.choices[0].delta.content;
        txt += process.stdout.write(chunk.choices[0].delta.content);
      }
    }

    return NextResponse.json({ data: streamText }, { status: 201 });

    // console.log("helo" + streamText);
    // const stream = OpenAIStream(response);
    // console.log("Text " + streamText);

    // const stream = MistralStream(response);
    // return new StreamingTextResponse(stream);
    // return response.toAIStreamResponse();
  } catch (error) {
    throw error;
  }
}
