import React from "react";
import { Bot, User } from "lucide-react";

// Enhanced markdown-like parser for structured text (bold, lists, headers, line breaks)
const formatText = (text) => {
    if (!text) return "";

    // Split by lines to handle block-level formatting
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
        let content = line.trim();
        let renderedLine = null;

        // Handle Headers (###)
        if (content.startsWith('###')) {
            renderedLine = (
                <h3 key={lineIndex} className="font-extrabold text-blue-900 mt-3 mb-1 uppercase tracking-wider text-[11px]">
                    {formatInlines(content.replace(/^###\s*/, ''))}
                </h3>
            );
        }
        // Handle Bullet Points (* or -)
        else if (content.match(/^[\*\-]\s/)) {
            renderedLine = (
                <div key={lineIndex} className="flex gap-2 ml-1 my-0.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span className="flex-1">{formatInlines(content.replace(/^[\*\-]\s*/, ''))}</span>
                </div>
            );
        }
        // Handle empty lines (paragraphs)
        else if (content === '') {
            renderedLine = <div key={lineIndex} className="h-2" />;
        }
        // Handle regular paragraphs
        else {
            renderedLine = (
                <p key={lineIndex} className="mb-1">
                    {formatInlines(line)}
                </p>
            );
        }

        return renderedLine;
    });
};

// Helper to handle inline formatting (only bold for now)
const formatInlines = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={index} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${isUser
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm shadow-md"
                    }`}
            >
                {message.isError ? (
                    <span className="text-red-500">{message.content}</span>
                ) : (
                    <div className="flex flex-col">
                        {formatText(message.content)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessage;
