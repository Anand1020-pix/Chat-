import React, { useState, useRef, useEffect } from "react";
import { IoSend } from "react-icons/io5";
import gsap from "gsap";

const InputBar = ({ onSend, disabled, loading = false }) => {
    const [input, setInput] = useState("");
    const [isAboveMin, setIsAboveMin] = useState(false);
    const textareaRef = useRef(null);
    const borderAnimRef = useRef(null);

    const handleChange = (e) => {
        setInput(e.target.value);
    };

    useEffect(() => {
        if (textareaRef.current) {
            const minHeight = 88; // px
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            // mark when textarea grew above the min height
            const sh = textareaRef.current.scrollHeight || 0;
            setIsAboveMin(sh > minHeight);
        }
    }, [input]);

    // Blink border animation using GSAP when loading is true
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;

        // if loading, create a pulsing border animation
        if (loading) {
            // clear previous animation if any
            if (borderAnimRef.current) {
                borderAnimRef.current.kill();
            }
            borderAnimRef.current = gsap.to(el, {
                borderColor: '#333c4b',
                boxShadow: '0 0 8px rgba(255, 255, 255, 1)',
                duration: 0.5,
                repeat: -1,
                yoyo: true,
                borderBottom: '8px solid #011224',
                ease: 'power1.inOut',
            });
        } else {
            if (borderAnimRef.current) {
                borderAnimRef.current.kill();
                borderAnimRef.current = null;
            }
            // ensure border resets
            gsap.to(el, { borderColor: '#d0d7de', boxShadow: 'none', duration: 0.15 , backgroundColor:null});
        }

        return () => {
            if (borderAnimRef.current) {
                borderAnimRef.current.kill();
                borderAnimRef.current = null;
            }
        };
    }, [loading]);

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
        <div className="w-full flex items-end relative ">
            <div className="relative flex-1">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    className="w-full px-4 py-3 pr-16 border border-[#dcded0] rounded-r-lg bg- text-base
                 text-white font-mono shadow-sm focus:outline-none placeholder:text-[#8c959f] resize-none 
                 overflow-auto scrollbar-thin scrollbar-thumb-[#d0d7de] scrollbar-track-[#f6f8fa] hover:bg-gray-900 border-b-4 border-t-2 border-r-4 border-l-2 "
                    placeholder="Type your message..."
                    value={input}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    style={{
                        minHeight: "88px",
                        maxHeight: "300px",
                        transition: "height 0.2s",
                        backgroundColor: isAboveMin ? "#060817" : undefined,
                        color: isAboveMin ? "#ffffff" : undefined,
                        fontStyle: isAboveMin ? "bold" : "normal",
                    }}
                />
            </div>
            <button
                type="button"
                className="absolute right-8 bottom-9 p-2  bg-[#282c32] text-white rounded-md shadow 
                 transition disabled:opacity-50 flex items-center justify-center"
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