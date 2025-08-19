import React, { useState } from "react";
import InputBar from "../components/InputBar.jsx";
import useChat from "../hooks/useChat.js";
import { useConversation } from "../context/ConversationContext.jsx";
import { fetchConversationById } from "../hooks/useSave.js";
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
    const { currentConversation, clearConversation, openConversation } = useConversation();
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

    // when conversation changes, replace messages; fetch full conversation if server indicates more messages
    React.useEffect(() => {
        let mounted = true;

        const localMessagesCount = Array.isArray(currentConversation?.messages) ? currentConversation.messages.length : 0;
        const serverCount = typeof currentConversation?.messageCount === 'number' ? currentConversation.messageCount : null;

        (async () => {
            try {
                const convId = currentConversation?._id || currentConversation?.uniqueId || currentConversation?.id;
                if (convId && serverCount !== null && localMessagesCount < serverCount) {
                    const full = await fetchConversationById(convId);
                    if (!mounted) return;
                    if (full && Array.isArray(full.messages) && full.messages.length > 0) {
                        try { openConversation(full); } catch (e) { /* ignore */ }
                        setMessages(mapConvToChat(full.messages));
                        return;
                    }
                }

                if (Array.isArray(currentConversation?.messages) && currentConversation.messages.length > 0) {
                    setMessages(mapConvToChat(currentConversation.messages));
                    return;
                }
            } catch (e) {
                // ignore
            }

            if (mounted) setMessages([]);
        })();

        return () => (mounted = false);
    }, [currentConversation]);
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

    const handleBackgroundClick = (e) => {
        // only treat direct clicks on the container (not on children)
        if (e.target === e.currentTarget) {
            clearConversation();
        }
    };

    return (
        <div onClick={handleBackgroundClick} className="flex flex-col min-h-full dark:bg-dark-main-bg text-black dark:text-black p-4 ">
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