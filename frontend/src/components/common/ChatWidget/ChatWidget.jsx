import React from "react";
import { MessageSquareText, X } from "lucide-react";
import { useChat } from "./useChat";
import ChatWindow from "./ChatWindow";

const ChatWidget = () => {
    const { messages, isLoading, isOpen, toggleChat, sendMessage, chatEndRef } = useChat();

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            <div
                className={`pointer-events-auto bg-white w-[380px] h-[550px] rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen
                        ? "opacity-100 scale-100 translate-y-0"
                        : "opacity-0 scale-95 translate-y-4 pointer-events-none"
                    }`}
            >
                <ChatWindow
                    messages={messages}
                    isLoading={isLoading}
                    sendMessage={sendMessage}
                    onClose={toggleChat}
                    chatEndRef={chatEndRef}
                />
            </div>

            {/* Toggle Button */}
            <button
                onClick={toggleChat}
                className={`pointer-events-auto w-14 h-14 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? "bg-red-500 hover:bg-red-600 rotate-90" : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {isOpen ? (
                    <X className="text-white" size={24} />
                ) : (
                    <MessageSquareText className="text-white" size={24} />
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
