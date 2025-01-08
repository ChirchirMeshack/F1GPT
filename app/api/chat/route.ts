import OpenAI from "openai";
import {OpenAIStream ,StreamingTextResponse} from "ai"
import {DataAPIClient} from "@datastax/astra-db-ts";

const {
    ASTRA_DB_NAMESPACE,
    OPENAI_API_KEY,
    ASTRA_DB_APPLICATION_TOKEN,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_COLLECTION
} = process.env;

const openai= new OpenAI({
    apiKey:OPENAI_API_KEY
})
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);

const db = client.db(ASTRA_DB_API_ENDPOINT,{namespace:ASTRA_DB_NAMESPACE});

export async  function POST(req:Request){
    try {
        const {messages} = await req.json()
        const latestMessage = messages[messages?.length - 1]?.content

        let docContextt = ""
        const embedding = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: latestMessage,
            encoding_format: "float"
        })
        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION)
            const cursor = collection.find(null, {
                sort: {
                    $vector: embedding.data[0]embedding,
                },
                limit: 10
            })

            const documents = await cursor.toArray()
            const docMap = documents?.map(doc => doc.text)
            docContextt = JSON.stringify(docMap)
        } catch (err) {
            console.log("POST request failed");
            docContextt = ""
        }

        const template = {
            role: 'system'
            content: `You are an AI assistant who knows everything about Formula One.Use the below context to augment what you know about Formula One Racing.The context will provide you with the most recent page data from wikipedia the official F1 website and others.
            If the context doesn't include the information you need answer based on existing knowledge and dont mention the source of your information on what the context does or does'nt include
            Format responses using markdown where applicable and dont  return images
            ----------------------
            START CONTEXT
            ${docContext}
            END CONTEXT
            ----------------------
            QUESTION:${latestMessage}
            ----------------------
            `
        }
        const response = await openai.chat.completions.create({
            model: 'chatgpt-4o-latest'
            stream: true,
            messages: [template, ...messages]
        })

        const stream = OpenAIStream(response)
        return new StreamingTextResponse(stream)
    }catch (err) {
        throw err;

    }
    }