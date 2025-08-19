import React, { useState } from "react";
import InputBar from "../components/InputBar.jsx";
import useChat from "../hooks/useChat.js";
import { useConversation } from "../context/ConversationContext.jsx";
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
            <div className="flex items-center justify-between px-4 py-1 bg-gray-900 rounded-t-md">
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
    const { currentConversation, clearConversation } = useConversation();
    const mapConvToChat = (msgs) => {
        if (!msgs || !Array.isArray(msgs)) return [];
        // Each server message may contain both userPrompt and botResponse — expand into two messages
        const out = [];
        msgs.forEach((m) => {
            if (m.userPrompt) out.push({ role: "user", text: m.userPrompt });
            if (m.botResponse) out.push({ role: "bot", text: m.botResponse });
            // also support alternate keys
            if (!m.userPrompt && m.user) out.push({ role: "user", text: m.user });
            if (!m.botResponse && m.bot) out.push({ role: "bot", text: m.bot });
        });
        return out;
    };

    const { messages, loading, spinnerRef, handleSend, setMessages } = useChat(
        currentConversation?.messages ? mapConvToChat(currentConversation.messages) : [],
        currentConversation || null
    );

    // when conversation changes, replace messages
    React.useEffect(() => {
        if (currentConversation?.messages) {
            setMessages(mapConvToChat(currentConversation.messages));
        }
    }, [currentConversation]);
    const renderMessage = (msg, idx) => (
        <div
            key={idx}
            className={`   ${msg.role === "bot" ? "text-left shadow-lg rounded-lg p-2 bg-gray-300  rounded-r-lg" : 
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
                <p className="inline-block bg-amber-50 text-black  rounded px-2 py-1 rounded-l-lg">
                    {msg.text}
                </p>
            )}
        </div>
    );

    const handleBackgroundClick = (e) => {
        // only treat direct clicks on the container (not on children)
        if (e.target === e.currentTarget) {
            clearConversation();
        }
    };

    return (
        <div onClick={handleBackgroundClick} className="flex flex-col min-h-full dark:bg-dark-main-bg text-black dark:text-black p-4 ">
            <div className="flex flex-col max-w-6xl mx-auto flex-1 w-full ">
                <div className="w-full mb-8 flex-1 overflow-y-auto pb-24 scrollbar-custom">
                    {messages.map(renderMessage)}
                </div>
              
                <div className=" fixed bottom-8 left-0 right-0 w-full max-w-xl mx-auto flex items-center flex-col p-4">
                    <InputBar onSend={handleSend} disabled={loading} loading={loading} />
                 
            </div>
                
            </div>
            
            </div>
        
        
    );
};

export default Chat;