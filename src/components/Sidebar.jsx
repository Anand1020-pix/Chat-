import React, { useState, useEffect } from "react";
import { fetchConversations, deleteConversation, updateConversation } from "../hooks/useSave.js";
import { useConversation } from "../context/ConversationContext.jsx";
import { RiMenuFold2Fill, RiMenuFill, RiCloseLine } from "react-icons/ri";
import { MdDelete , MdCancel} from "react-icons/md";
import { SiTheconversation } from "react-icons/si";

import { FaEdit ,FaCheck , FaArrowRight } from "react-icons/fa";

const Sidebar = ({ isMobile, closeSidebar, expanded: expandedProp, setExpanded: setExpandedProp }) => {
    const [internalExpanded, setInternalExpanded] = useState(true);
    const expanded = typeof expandedProp === "boolean" ? expandedProp : internalExpanded;
    const setExpanded = setExpandedProp || setInternalExpanded;
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
        <>
        <div className={`h-full bg-gray-800 text-white flex flex-col shadow-lg transition-all duration-300 ${expanded ? "w-64" : "hidden"}`}>
            <div className="flex items-center justify-between p-4 border-b border-gray-700 font-bold text-lg">
                <span>{expanded ? "LOGO" : ""}</span>
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
                        className="hidden md:inline-flex text-gray-400 hover:text-white focus:outline-none"
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
                    <div className="mb-4 flex items-center justify-between hover:bg-gray-700 transition rounded px-2 py-2">
                        <SiTheconversation className="text-xl mr-3" />
                        <button
                            className="flex-1 text-left px-3 py-2 rounded text-xl font-bold hover:bg-gray-700 focus:outline-none"
                            onClick={() => { clearConversation(); if (isMobile && closeSidebar) closeSidebar(); }}
                        >
                            New Chat
                        </button>
                        <FaArrowRight className="ml-3" />
                    </div>
                        <div className="space-y-2">
                            {conversations.length === 0 && (
                                <div className="text-sm text-gray-400">No conversations found</div>
                            )}
                {conversations.map((conv, idx) => {
                                const title = conv.title || conv.name || `Conversation ${idx + 1}`;
                                const isEditing = editing === title;
                                return (
                    <div key={title} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-700 cursor-pointer"
                     onClick={() => { openConversation(conv); if (isMobile && closeSidebar) closeSidebar(); }}>
                                        <div className="flex-1 text-sm truncate">
                                            {isEditing ? (
                                                <input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="w-full bg-gray-800 text-white text-sm px-2 py-1 rounded"
                                                />
                                            ) : (
                        <span title={title} className="" >{title}</span>
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
                                                                setConversations((prev) => prev.map(c => 
                                                                    ({...c, title: c.title === title ? editValue : c.title})));
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

        {!expanded && (
            <button
                onClick={() => setExpanded(true)}
                aria-label="Open sidebar"
                className="fixed left-3 top-4 z-50 bg-gray-800 text-white p-2 rounded-md shadow-lg hover:bg-gray-700 focus:outline-none"
            >
                <RiMenuFill />
            </button>
        )}
        </>
    );
}

export default Sidebar;