import { useCallback } from "react";
const GEN_URL = import.meta.env.VITE_GEN;

const usePrompt = () => {
    const sendPrompt = useCallback(async (prompt) => {
        try {
            const res = await fetch(GEN_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt }),
            });

            const data = await res.json();
            const lines = data.response.split("\n").filter(Boolean);
            const messages = lines.map(line => {
                try {
                    return JSON.parse(line).response || "";
                } catch {
                    return "";
                }
            }).filter(Boolean); 

            return messages; 
        } catch (error) {
            console.error("Error sending prompt:", error);
            return ["Error!"];
        }
    }, []);

    return sendPrompt;
};

export default usePrompt;