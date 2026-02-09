import React from "react";
import { Bot, User } from "lucide-react";

// Simple markdown-like parser for bold text
const formatText = (text) => {
    if (!text) return "";
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={index}>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
};

const ChatMessage = ({ message }) => {
    const isUser = message.role === "user";

    return (
        <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                    }`}
            >
                {isUser ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${isUser
                        ? "bg-blue-600 text-white rounded-tr-sm"
                        : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                    }`}
            >
                {message.isError ? (
                    <span className="text-red-500">{message.content}</span>
                ) : (
                    formatText(message.content)
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
