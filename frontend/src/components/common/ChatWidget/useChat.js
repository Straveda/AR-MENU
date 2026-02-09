import { useState, useCallback, useRef, useEffect } from "react";
import axiosClient from "../../../api/axiosClient";
import { useAuth } from "../../../context/AuthProvider";

export const useChat = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([
        {
            role: "assistant",
            content: "Hello! I'm your restaurant assistant. How can I help you today?",
            id: "welcome-msg",
        },
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const toggleChat = () => setIsOpen((prev) => !prev);

    const sendMessage = async (content) => {
        if (!content.trim()) return;

        const userMsg = { role: "user", content, id: Date.now().toString() };
        setMessages((prev) => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const { data } = await axiosClient.post("/chat/message", { message: content });

            const aiMsg = {
                role: "assistant",
                content: data.message,
                id: (Date.now() + 1).toString(),
            };

            setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMsg = {
                role: "assistant",
                content: "I'm having trouble connecting right now. Please try again later.",
                id: (Date.now() + 1).toString(),
                isError: true,
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        isLoading,
        isOpen,
        toggleChat,
        sendMessage,
        chatEndRef,
    };
};
