import {DataAPIClient} from "@datastax/astra-db-ts"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import sampleData from "@/database/sample-data.json" with {type: 'json'}
import MistralClient from '@mistralai/mistralai';

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API,
// })

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(process.env.ASTRA_DB_API_ENDPOINT || '', {
    namespace: process.env.ASTRA_DB_NAMESPACE
}) 

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
})

const mistral = new MistralClient(process.env.MISTRAL_API_KEY)

export const createCollection = async () => {
    try {
        await db.createCollection("my_portfolio", {
            vector: {
                metric: 'cosine',
                service: {
                  provider: 'mistral',
                  modelName: 'mistral-embed',
                  authentication: {
                    providerKey: process.env.MISTRAL_API_KEY,
                  },
                },
            },
        })


    } catch (error) {
        console.log("Collection already exists!");
        
    }
}

export const loadData = async () => {
    const collection = await db.collection("my_portfolio")
    for await (const {_id, info, description} of sampleData) {
        const chunks = await splitter.splitText(description);
        let i = 0;
        for await (const chunk of chunks){
            const {data} = await mistral.embeddings({
                model: 'mistral-embed',
                input: chunk,
            })

            const res  = await collection.insertOne({
                _id: _id,
                $vector: data[0].embedding,
                info,
                description: chunk
            })

            i++;
        }
    }

    console.log("Data added.");
}

createCollection().then(() => loadData())

