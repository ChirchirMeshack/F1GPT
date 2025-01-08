import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import OpenAI from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import "dotenv/config";

type SimilarityMetric = "dot_product" | "cosine" | "euclidean";

console.log("Starting LoadDb script...");

const {
    ASTRA_DB_NAMESPACE,
    OPENAI_API_KEY,
    ASTRA_DB_APPLICATION_TOKEN,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_COLLECTION
} = process.env;

console.log("Environment Variables:", {
    ASTRA_DB_NAMESPACE,
    OPENAI_API_KEY,
    ASTRA_DB_APPLICATION_TOKEN,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_COLLECTION
});

if (!ASTRA_DB_API_ENDPOINT) {
    throw new Error("ASTRA_DB_API_ENDPOINT is not defined in the environment variables.");
}

if (!ASTRA_DB_COLLECTION) {
    throw new Error('ASTRA_DB_COLLECTION environment variable is not defined.');
}

// Initialize Astra client
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT);

// Initialize OpenAI
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
});

const createCollectionIfNotExists = async (similarityMetric: SimilarityMetric = "dot_product") => {
    try {
        // Try to get the collection first
        const collection = await db.collection(ASTRA_DB_COLLECTION);
        console.log(`Collection ${ASTRA_DB_COLLECTION} already exists`);
        return collection;
    } catch (error) {
        // If collection doesn't exist, create it
        console.log(`Creating new collection ${ASTRA_DB_COLLECTION}`);
        const res = await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: {
                dimension: 1536,
                metric: similarityMetric
            }
        });
        console.log(`Created collection:`, res);
        return await db.collection(ASTRA_DB_COLLECTION);
    }
};

const scrapePage = async (url: string): Promise<string> => {
    const loader = new PuppeteerWebBaseLoader(url);
    const docs = await loader.load();
    return docs[0].pageContent;
};

const loadSampleData = async () => {
    const collection = await createCollectionIfNotExists();
    for (const url of f1data) {
        try {
            console.log(`Processing URL: ${url}`);
            const content = await scrapePage(url);
            const chunks = await splitter.splitText(content);
            console.log(`Split content into ${chunks.length} chunks`);

            for (const chunk of chunks) {
                const embedding = await openai.embeddings.create({
                    input: chunk,
                    model: "text-embedding-3-small"
                });

                const vector = embedding.data[0].embedding;

                const res = await collection.insertOne({
                    url,
                    content: chunk,
                    $vector: vector
                });
                console.log(`Inserted document: ${res.insertedId}`);
            }
            console.log(`Finished processing URL: ${url}`);
        } catch (error) {
            console.error(`Error processing URL ${url}:`, error);
            // Continue with the next URL even if one fails
            continue;
        }
    }
};

const f1data = [
    'https://en.wikipedia.org/wiki/Formula_One',
    'https://www.formula1.com/en/latest/all'
];

const main = async () => {
    try {
        await loadSampleData();
        console.log("Finished LoadDb script.");
    } catch (error) {
        console.error("An error occurred:", error);
    }
};

main();