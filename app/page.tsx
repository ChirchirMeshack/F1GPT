"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import f1GPTLogo from "./assets/f1GPTLogo.png";
import { useChat } from "ai/react";
import { Message } from "ai";
import "./global.css";
import LoadingBubble from "@/app/components/LoadingBubble";
import Bubble from "@/app/components/bubble";
import PromptSuggestionsRow from "@/app/components/PromptSuggestionsRow";

const Home = () => {
    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: '/api/chat', // Specify the API endpoint
        initialMessages: [], // Initialize with empty messages
        onError: (error) => {
            console.error('Chat error:', error);
            // You could add toast notification here
            alert(error.message || 'An error occurred. Please try again.');
        },
    });

    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const noMessages = !messages || messages.length === 0;

    const handlePrompt = async (promptText: string) => {
        try {
            const msg: Message = {
                id: crypto.randomUUID(),
                content: promptText,
                role: 'user'
            };
            await append(msg);
        } catch (error) {
            console.error('Error sending prompt:', error);
        }
    };

    if (!isClient) {
        return <div>Loading...</div>;
    }

    return (
        <main className="main-container">
            <Image
                src={f1GPTLogo}
                width={250}
                height={250}
                alt="f1gpt logo"
                className="logo"
                priority
            />
            <section className={`content-container ${noMessages ? '' : 'populated'}`}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The ultimate place for Formula One super fans! Ask F1GPT anything
                            about the fantastic topic of F1 racing, and it will come back
                            with the most up-to-date answers. We hope you enjoy!
                        </p>
                        <br />
                        <PromptSuggestionsRow onPromptClick={handlePrompt} />
                    </>
                ) : (
                    <div className="messages-wrapper">
                        {messages.map((message, index) => (
                            <Bubble
                                key={`message-${index}`}
                                message={message}
                            />
                        ))}
                        {isLoading && <LoadingBubble />}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="form-container">
                    <input
                        className="question-box"
                        onChange={handleInputChange}
                        value={input}
                        placeholder="Ask me something about F1..."
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="submit-button"
                    >
                        {isLoading ? "Thinking..." : "Send"}
                    </button>
                </form>
            </section>
        </main>
    );
};

export default Home;