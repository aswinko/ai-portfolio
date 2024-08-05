import { DataAPIClient } from "@datastax/astra-db-ts";
import { NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_API_KEY);

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT || "", {
  namespace: process.env.ASTRA_DB_NAMESPACE,
});

export async function POST(req: any) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages?.length - 1]?.content;

    if (!latestMessage) {
      return NextResponse.json(
        { error: "No message content found" },
        { status: 400 }
      );
    }

    const data = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: latestMessage,
    });

    let embedding: number[] = [];
    if (Array.isArray(data) && typeof data[0] === "number") {
      embedding = data as number[];
    } else {
      console.error("Unexpected data format", data);
      return NextResponse.json(
        { error: "Failed to process embeddings" },
        { status: 400 }
      );
    }

    const collection = await db.collection("ai_portfolio");

    const cursor = await collection.find(
      {},
      {
        sort: { $vector: embedding },
        limit: 5,
        includeSimilarity: true,
      }
    );

    const documents = await cursor.toArray();

    let dotContent = `
      START CONTEXT
      ${documents?.map((doc) => doc.description).join("\n")}
      END CONTEXT
    `;

    const ragPrompt = [
      {
        role: "system",
        content: `You are an AI assistant but here you are an Aswin K O answering as Aswin K O. AI ASSISTANT only answer questions from the user. Use markdown formatting where appropriate.
  
        Context:
        ${dotContent}
  
        If the answer is not provided in the context, the AI assistant will say,
            "I am sorry, I do not know the answer."`,
      },
    ];

    let out = "";
    for await (const chunk of hf.chatCompletionStream({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [...ragPrompt, ...messages],
      max_tokens: 200,
      temperature: 0.2,
      seed: 0,
      stream: true,
      n: 1,
    })) {
      if (chunk.choices && chunk.choices.length > 0) {
        out += chunk.choices[0].delta.content;
      }
    }

    return NextResponse.json({ data: out }, { status: 201 });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
