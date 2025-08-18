import { useState, useRef, useEffect } from "react";
import usePrompt from "./usePrompt.js";
import { gsap } from "gsap";

const useChat = () => {
    const sendPrompt = usePrompt();
    const [messages, setMessages] = useState([]);
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
    };

    return { messages, loading, spinnerRef, handleSend };
};

export default useChat;