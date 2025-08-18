import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";

const InputBar = ({ onSend, disabled }) => {
    const [input, setInput] = useState("");
    const textareaRef = useRef(null);

    const handleChange = (e) => {
        setInput(e.target.value);
    };

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey && input.trim() && !disabled) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (input.trim() && !disabled) {
            onSend(input);
            setInput("");
        }
    };

    return (
        <div className="w-full flex items-end relative">
            <textarea
                ref={textareaRef}
                rows={1}
                className="flex-1 px-4 py-3 pr-16 border border-[#d0d7de] rounded-md bg-[#f6f8fa] text-base
                 text-[#24292f] font-mono shadow-sm focus:outline-none placeholder:text-[#8c959f] resize-none 
                 overflow-auto scrollbar-thin scrollbar-thumb-[#d0d7de] scrollbar-track-[#f6f8fa]"
                placeholder="Type your message..."
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                style={{
                    minHeight: "88px",
                    maxHeight: "300px",
                    transition: "height 0.2s"
                }}
            />
            <button
                type="button"
                className="absolute right-8 bottom-8 p-2  bg-[#1c2432] text-white rounded-md shadow
                 hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                onClick={handleSend}
                disabled={disabled || !input.trim()}
                aria-label="Send"
            >
                <IoSend size={20} />
            </button>
        </div>
    );
};

export default InputBar;