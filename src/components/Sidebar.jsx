import React, { useState, useEffect } from "react";
import { fetchConversations, deleteConversation, updateConversation } from "../hooks/useSave.js";
import { useConversation } from "../context/ConversationContext.jsx";
import { RiMenuFold2Fill, RiMenuFill, RiCloseLine } from "react-icons/ri";
import { MdDelete , MdCancel} from "react-icons/md";

import { FaEdit ,FaCheck} from "react-icons/fa";

const Sidebar = ({ isMobile, closeSidebar }) => {
    const [expanded, setExpanded] = useState(true);
    const [conversations, setConversations] = useState([]);
    const [editing, setEditing] = useState(null);
    const [editValue, setEditValue] = useState("");

    const { openConversation, clearConversation } = useConversation();

    useEffect(() => {
        let mounted = true;
        fetchConversations("")
            .then((data) => {
                if (!mounted) return;
                // Expecting array of convs or object; normalize
                setConversations(Array.isArray(data) ? data : (data?.conversations || []));
            })
            .catch((err) => console.error("Failed to load conversations", err));
        return () => (mounted = false);
    }, []);

    return (
        <div className={`h-full bg-gray-800 text-white flex flex-col shadow-lg transition-all duration-300 ${expanded ? "w-64" : "w-20"}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700 font-bold text-lg">
                <span>{expanded ? "LOGO" : "L"}</span>
                <div className="flex items-center">
                    {isMobile && (
                        <button
                            className="text-gray-400 hover:text-white focus:outline-none mr-4"
                            onClick={closeSidebar}
                        >
                            <RiCloseLine size={24} />
                        </button>
                    )}
                    <button
                        className="text-gray-400 hover:text-white focus:outline-none"
                        onClick={() => setExpanded((prev) => !prev)}
                        title={expanded ? "Shrink sidebar" : "Expand sidebar"}
                    >
                        {expanded ? (
                            <RiMenuFill />
                        ) : (
                            <RiMenuFold2Fill />
                        )}
                    </button>
                </div>
            </div>
            {expanded && (
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="mb-4">
                            <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition" onClick={() => { clearConversation(); if (isMobile && closeSidebar) closeSidebar(); }}>
                                New Chat
                            </button>
                        </div>
                        <div className="space-y-2">
                            {conversations.length === 0 && (
                                <div className="text-sm text-gray-400">No conversations found</div>
                            )}
                {conversations.map((conv, idx) => {
                                const title = conv.title || conv.name || `Conversation ${idx + 1}`;
                                const isEditing = editing === title;
                                return (
                    <div key={title} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-700">
                                        <div className="flex-1 text-sm truncate">
                                            {isEditing ? (
                                                <input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-full bg-gray-800 text-white text-sm px-2 py-1 rounded"
                                                />
                                            ) : (
                        <span title={title} className="cursor-pointer" onClick={() => { openConversation(conv); if (isMobile && closeSidebar) closeSidebar(); }}>{title}</span>
                                            )}
                                        </div>
                                        <div className="ml-2 flex items-center space-x-1">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        className=""
                                                        onClick={async () => {
                                                            try {
                                                                await updateConversation(title, editValue);
                                                                setConversations((prev) => prev.map(c => ({...c, title: c.title === title ? editValue : c.title})));
                                                                setEditing(null);
                                                            } catch (err) {
                                                                console.error(err);
                                                            }
                                                        }}
                                                    >
                                                        <FaCheck />
                                                    </button>
                                                    <button onClick={() => setEditing(null)}><MdCancel /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button  onClick={() => { setEditing(title); setEditValue(title); }}><FaEdit /></button>
                                                    <button  onClick={async () => {
                                                        try {
                                                            await deleteConversation(title);
                                                            setConversations((prev) => prev.filter(c => c.title !== title));
                                                        } catch (err) {
                                                            console.error(err);
                                                        }
                                                    }}><MdDelete /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                </div>
            )}
            <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
                {expanded ? "" : ""}
            </div>
        </div>
    );
}

export default Sidebar;