import { DataAPIClient } from "@datastax/astra-db-ts";
// import MistralClient from "@mistralai/mistralai";
import { NextResponse } from "next/server";

import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_API_KEY);

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

    // const { data } = await mistral.embeddings({
    //   input: latestMessage,
    //   model: "mistral-embed",
    // });

    const data = await hf.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: latestMessage,
    });

    //   const {data}:any = res;

    // console.log("API - " + data);

    // if (!data || !data.length) {
    //   throw new Error("No embeddings returned");
    // }

    // const parsedEmbedding = embedding.toString().split(',').map(Number);

    // // Normalize the embedding
    // const min = Math.min(...parsedEmbedding);
    // const max = Math.max(...parsedEmbedding);
    // const normalizedEmbedding = parsedEmbedding.map(
    //   (value) => (value - min) / (max - min)
    // );

    // // Interpolate to the new desired length
    // const interpolate = (arr, newLen) => {
    //   const factor = (arr.length - 1) / (newLen - 1);
    //   return Array.from({ length: newLen }, (_, i) => {
    //     const index = i * factor;
    //     const lower = Math.floor(index);
    //     const upper = Math.ceil(index);
    //     if (lower === upper) {
    //       return arr[lower];
    //     }
    //     return arr[lower] + (arr[upper] - arr[lower]) * (index - lower);
    //   });
    // };

    // let newLength=5;
    // const newEmbedding = interpolate(normalizedEmbedding, newLength= parseInt(newLength, 10));

    // console.log(newEmbedding);

    let embedding: number[] = [];

    if (Array.isArray(data) && typeof data[0] === "number") {
      embedding = data as number[];
    } else {
      console.error("Unexpected data format", data);
      return NextResponse.json({ error: "Failed to process embeddings" }, { status: 400 });
    }


    // // Log the dimension of the embedding for debugging
    // console.log("Embedding dimension:", embedding.length);

    // // Verify that the embedding dimension matches the expected dimension
    // const expectedDimension = 384; // Replace with the actual dimension used in your Astra DB collection
    // if (embedding.length !== expectedDimension) {
    //   console.error(`Embedding dimension mismatch: expected ${expectedDimension}, got ${embedding.length}`);
    //   return NextResponse.json({ error: "Embedding dimension mismatch" }, { status: 400 });
    // }



    const collection = await db.collection("portfolio");

    // Perform a similarity search
    const cursor = await collection.find(
      {},
      {
        sort: { $vector: embedding }, // Sort by similarity
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
      content: `You are an AI assistant in Aswin K O's Portfolio App. Answer the user's questions based on the provided context. Use markdown formatting where appropriate.
  
      Context:
      ${dotContent}
  
      If the context does not contain the answer, respond with: "I am sorry, I do not know the answer."`,
    },
  ];

    // const response = await mistral.chatStream({
    //   model: "mistral-tiny",
    //   // stream: true,
    //   // max_tokens: 1000,
    //   messages: [...ragPrompt, ...messages],
    // });

    // // return new StreamingTextResponse(stream);
    // let txt = "";
    // let streamText = "";
    // for await (const chunk of response) {
    //   if (chunk.choices[0].delta.content !== undefined) {
    //     streamText += chunk.choices[0].delta.content;
    //     txt += process.stdout.write(chunk.choices[0].delta.content);
    //   }
    // }

    // Streaming API
    let out = "";
    for await (const chunk of hf.chatCompletionStream({
      model: "mistralai/Mistral-7B-Instruct-v0.2",
      messages: [...ragPrompt, ...messages],
      max_tokens: 100,
      temperature: 0.1,
      seed: 0,
    })) {
      if (chunk.choices && chunk.choices.length > 0) {
        out += chunk.choices[0].delta.content;
        process.stdout.write(out);
      }
    }

    return NextResponse.json({ data: out }, { status: 201 });
  } catch (error) {
    throw error;
  }
}
