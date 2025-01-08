"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import f1GPTLogo from "./assets/f1GPTLogo.png";
import { useChat } from "ai/react";
import { Message } from "ai";
import "./global.css"; // Import the CSS file
import LoadingBubble from "@/app/components/LoadingBubble";
import PromptSuggestionsRow from "@/app/components/PromptSuggestionsRow";

const Home = () => {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
    const [isClient, setIsClient] = useState(false);

    // Ensure client-side only code runs after the component mounts
    useEffect(() => {
        setIsClient(true);
    }, []);

    const noMessages = !messages || messages.length === 0;

    const handlePromptClick = async (promptText) => {
        // Function to handle prompt click
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: 'user'
        };
        // Add your logic here to handle the prompt click
    };

    if (!isClient) {
        // Render a simple loader or fallback content during SSR
        return <div>Loading...</div>;
    }

    return (
        <main className="main-container">
            <Image src={f1GPTLogo} width={250} alt="f1gpt logo" className="logo" />
            <section className={`content-container ${noMessages ? '' : 'populated'}`}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            The ultimate place for Formula One super fans! Ask F1GPT anything
                            about the fantastic topic of F1 racing, and it will come back
                            with the most up-to-date answers. We hope you enjoy!
                        </p>
                        <br />
                        <PromptSuggestionsRow onPromptClick={handlePromptClick} />
                    </>
                ) : (
                    <>
                        {isLoading && <LoadingBubble />}
                        <div className="messages-container">
                            {messages.map((message: Message) => (
                                <div
                                    key={message.id}
                                    className={`message ${
                                        message.role === "assistant" ? "ai-message" : "user-message"
                                    }`}
                                >
                                    <p>{message.content}</p>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="loading-bubble">
                                    <p>Thinking...</p>
                                </div>
                            )}
                        </div>
                    </>
                )}

                <form onSubmit={handleSubmit} className="form-container">
                    <input
                        className="question-box"
                        onChange={handleInputChange}
                        value={input}
                        placeholder="Ask me something about F1..."
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
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