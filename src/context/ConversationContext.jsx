import React, { createContext, useContext, useState } from "react";

const ConversationContext = createContext(null);

export const ConversationProvider = ({ children }) => {
    const [currentConversation, setCurrentConversation] = useState(null);

    function openConversation(conv) {
        setCurrentConversation(conv);
    }

    function clearConversation() {
    // set to an empty conversation (so consumers can react and clear messages)
    setCurrentConversation({ messages: [] });
    }

    return (
        <ConversationContext.Provider value={{ currentConversation, openConversation, clearConversation }}>
            {children}
        </ConversationContext.Provider>
    );
};

export function useConversation() {
    const ctx = useContext(ConversationContext);
    if (!ctx) throw new Error("useConversation must be used within ConversationProvider");
    return ctx;
}

export default ConversationContext;
