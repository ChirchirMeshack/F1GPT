/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverActions: true,
    },
    env: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        ASTRA_DB_NAMESPACE: process.env.ASTRA_DB_NAMESPACE,
        ASTRA_DB_APPLICATION_TOKEN: process.env.ASTRA_DB_APPLICATION_TOKEN,
        ASTRA_DB_API_ENDPOINT: process.env.ASTRA_DB_API_ENDPOINT,
        ASTRA_DB_COLLECTION: process.env.ASTRA_DB_COLLECTION,
    }
}

module.exports = nextConfig