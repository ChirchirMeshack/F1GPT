import OpenAI from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";

// Environment variables validation
const requiredEnvVars = {
    ASTRA_DB_NAMESPACE: process.env.ASTRA_DB_NAMESPACE,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ASTRA_DB_APPLICATION_TOKEN: process.env.ASTRA_DB_APPLICATION_TOKEN,
    ASTRA_DB_API_ENDPOINT: process.env.ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_COLLECTION: process.env.ASTRA_DB_COLLECTION
};

// Check for missing environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const client = new DataAPIClient(process.env.ASTRA_DB_APPLICATION_TOKEN!);

const db = client.db(process.env.ASTRA_DB_API_ENDPOINT!, {
    namespace: process.env.ASTRA_DB_NAMESPACE!
});

export async function POST(req: Request) {
    if (req.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    }

    try {
        // Input validation
        const { messages } = await req.json();
        console.log('Received messages:', messages);

        if (!Array.isArray(messages) || messages.length === 0) {
            return new Response('Invalid messages format', { status: 400 });
        }

        const latestMessage = messages[messages.length - 1]?.content;
        if (!latestMessage) {
            return new Response('No message content found', { status: 400 });
        }

        let docContext = "";
        let embedding;

        try {
            // Try to create embedding, if it fails due to quota, continue without it
            embedding = await openai.embeddings.create({
                model: "text-embedding-ada-002", // Using a more widely available model
                input: latestMessage,
                encoding_format: "float"
            });

            // Only try to query database if embedding succeeded
            if (embedding) {
                const collection = await db.collection(process.env.ASTRA_DB_COLLECTION!);
                console.log('Database connected successfully');

                const cursor = collection.find(null, {
                    sort: {
                        $vector: embedding.data[0].embedding
                    },
                    limit: 5 // Reduced limit to save tokens
                });

                const documents = await cursor.toArray();
                console.log('Documents found:', documents?.length);

                const docMap = documents?.map(doc => doc.text);
                docContext = JSON.stringify(docMap);
            }
        } catch (err: any) {
            console.warn("Embedding or database query failed:", err.message);
            // Continue without context if either fails
            docContext = "";
        }

        const systemMessage = {
            role: 'system',
            content: `You are an AI assistant who knows everything about Formula One. ${
                docContext ? 'Use the following context to enhance your response:' + docContext :
                    'Provide general Formula One knowledge in your response.'
            }

Format responses using markdown where applicable and don't return images.`
        };

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo', // Using more cost-effective model
                stream: true,
                messages: [systemMessage, ...messages],
                temperature: 0.7,
                max_tokens: 500 // Reduced tokens to manage costs
            });

            console.log('OpenAI response received');
            const stream = OpenAIStream(response);
            return new StreamingTextResponse(stream);

        } catch (err: any) {
            if (err.status === 429) {
                return new Response(
                    JSON.stringify({
                        error: 'API rate limit exceeded. Please try again in a few moments.',
                        details: 'Rate limit error'
                    }),
                    {
                        status: 429,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }
            throw err;
        }

    } catch (err: any) {
        console.error("Error in POST request:", err);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                details: err instanceof Error ? err.message : 'Unknown error'
            }),
            {
                status: err.status || 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}