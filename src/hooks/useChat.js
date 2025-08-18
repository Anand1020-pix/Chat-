import { useState, useRef, useEffect } from "react";
import usePrompt from "./usePrompt.js";
import saveConversation from "./useSave.js";
import { gsap } from "gsap";

const useChat = (initialMessages = [], activeConversation = null) => {
    const sendPrompt = usePrompt();
    const [messages, setMessages] = useState(initialMessages || []);
    const [loading, setLoading] = useState(false);
    const spinnerRef = useRef(null);

    useEffect(() => {
        if (loading && spinnerRef.current) {
            gsap.to(spinnerRef.current, {
                rotation: 360,
                repeat: -1,
                duration: 1,
                ease: "linear",
            });
        } else if (spinnerRef.current) {
            gsap.killTweensOf(spinnerRef.current);
            gsap.set(spinnerRef.current, { rotation: 0 });
        }
    }, [loading]);

    const handleSend = async (prompt) => {
        setMessages((msgs) => [...msgs, { role: "user", text: prompt }]);
        setLoading(true);
        const replies = await sendPrompt(prompt);
        const botSentence = replies.join("");
        setMessages((msgs) => [
            ...msgs,
            { role: "bot", text: botSentence },
        ]);
        setLoading(false);

        // persist the conversation to the backend (non-blocking)
        const savePayload = {
            userPrompt: prompt,
            botResponse: botSentence,
        };

        // if the active conversation was provided and has identifying info, include it
        try {
            if (activeConversation) {
                if (activeConversation.title) savePayload.title = activeConversation.title;
                if (activeConversation._id) savePayload.uniqueId = activeConversation._id;
            }
        } catch (e) {
            // ignore
        }

        saveConversation(savePayload).catch((error) => {
            // log but don't interrupt the user flow
            console.error("Failed to save conversation:", error);
        });
    };

    return { messages, loading, spinnerRef, handleSend, setMessages };
};

export default useChat;