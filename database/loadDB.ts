import {DataAPIClient} from "@datastax/astra-db-ts"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import sampleData from "@/database/sample-data.json" with {type: 'json'}
// import MistralClient from '@mistralai/mistralai';

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API,
// })

import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HF_API_KEY);

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT || '', {
    namespace: process.env.ASTRA_DB_NAMESPACE
}) 


console.log("HF_API_KEY:", process.env.HF_API_KEY);
console.log("ASTRA_DB_APPLICATION_TOKEN:", process.env.ASTRA_DB_APPLICATION_TOKEN);
console.log("ASTRA_DB_API_ENDPOINT:", process.env.ASTRA_DB_API_ENDPOINT);
console.log("ASTRA_DB_NAMESPACE:", process.env.ASTRA_DB_NAMESPACE);

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
})

// const mistral = new MistralClient(process.env.MISTRAL_API_KEY)

export const createCollection = async () => {
    try {
        await db.createCollection("portfolio", {
            vector: {
                metric: 'cosine',
                service: {
                  provider: 'huggingface',
                  modelName: 'sentence-transformers/all-MiniLM-L6-v2',
                  authentication: {
                    providerKey: process.env.HF_API_KEY,
                  },
                },
            },
        })


    } catch (error) {
        console.log("Collection already exists!");
        console.log(error);
        
        
    }
}

export const loadData = async () => {
    const collection = await db.collection("portfolio")
    for await (const {_id, info, description} of sampleData) {
        const chunks = await splitter.splitText(description);
        let i = 0;
        for await (const chunk of chunks){
            try {
                const data = await hf.featureExtraction({
                    model: "sentence-transformers/all-MiniLM-L6-v2",
                    inputs: chunk,
                })
    
                 // Log the structure of data
                 console.log("Data received from Hugging Face:", data);
    
                // console.log(data);
                
                // Ensure data is an array of floats
                // Ensure data is an array of floats
                let embedding: number[];
                if (Array.isArray(data) && typeof data[0] === 'number') {
                    embedding = data as number[];
                } else {
                    console.error("Unexpected data format", data);
                    continue;
                }
    
                const res  = await collection.insertOne({
                    _id: `${_id}-${i}`,  // Ensure unique _id for each chunk
                    $vector: embedding,
                    info,
                    description: chunk
                })
    
                // console.log(res);
                
    
                i++;
                
            } catch (error) {
                console.log(error);
                
            }
        }
    }

    console.log("Data added.");
}

createCollection().then(() => loadData()).catch((e)=> console.log(e))

