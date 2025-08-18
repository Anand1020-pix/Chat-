import React, { useState } from "react";
import InputBar from "../components/InputBar.jsx";
import useChat from "../hooks/useChat.js";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { LiaClipboardSolid } from "react-icons/lia";

const CodeBlock = ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children)).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    return !inline && match ? (
        <div className="relative bg-black rounded-md my-2">
            <div className="flex items-center justify-between px-4 py-1 bg-gray-700 rounded-t-md">
                <span className="text-xs text-gray-400">{match[1]}</span>
                <button
                    onClick={handleCopy}
                    className="p-1 bg-gray-700 rounded-md text-white hover:bg-gray-600"
                >
                    {copied ? "Copied!" : <LiaClipboardSolid />}
                </button>
            </div>
            <SyntaxHighlighter
                style={coldarkDark}
                language={match[1]}
                PreTag="div"
                {...props}
            >
                {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
        </div>
    ) : (
        <code className={className} {...props}>
            {children}
        </code>
    );
};

const Chat = () => {
    const { messages, loading, spinnerRef, handleSend } = useChat();
    const renderMessage = (msg, idx) => (
        <div
            key={idx}
            className={`   ${msg.role === "bot" ? "text-left shadow-lg rounded-lg p-2 border-t-2 border-gray-100  rounded-r-lg" : 
            " m-1 text-right "}`}
        >
            {msg.role === "bot" ? (
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{ code: CodeBlock }}
                >
                    {msg.text}
                </ReactMarkdown>
            ) : (
                <p className="inline-block bg-cyan-950 font-medium text-white  rounded px-2 py-1 rounded-l-lg">
                    {msg.text}
                </p>
            )}
        </div>
    );

    return (
        <div className="flex flex-col min-h-full dark:bg-dark-main-bg text-black dark:text-black p-4 ">
            <div className="flex flex-col max-w-6xl mx-auto flex-1 w-full ">
                <div className="w-full mb-8 flex-1 overflow-y-auto pb-24  ">
                    {messages.map(renderMessage)}
                </div>
              
                <div className=" fixed bottom-0 left-0 right-0 w-full max-w-xl mx-auto flex items-center flex-col p-4">
                    <div className="m-2">
                     {loading && (
                    <div
                        ref={spinnerRef}
                        className="ml-4 w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"
                    />
                )}
                </div>
                <InputBar onSend={handleSend} disabled={loading} />
                 
            </div>
                
            </div>
            
            </div>
        
        
    );
};

export default Chat;