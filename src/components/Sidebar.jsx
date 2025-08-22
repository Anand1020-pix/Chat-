import React, { useState, useEffect } from "react";
import { fetchConversations, deleteConversation, updateConversation, fetchConversationById } from "../hooks/useSave.js";
import useHover from "../hooks/useHover.js";
import { useConversation } from "../context/ConversationContext.jsx";
import {  RiMenuFill, RiCloseLine } from "react-icons/ri";
import { MdDelete, MdCancel } from "react-icons/md";
import { SiTheconversation } from "react-icons/si";
import Title from "./Title";

import { FaEdit, FaCheck, FaArrowRight } from "react-icons/fa";

const Sidebar = ({ isMobile, closeSidebar, expanded: expandedProp, setExpanded: setExpandedProp, overlayWhenCollapsed, isMobileOpen = false }) => {
    const [internalExpanded, setInternalExpanded] = useState(true);
    const expanded = typeof expandedProp === "boolean" ? expandedProp : internalExpanded;
    const setExpanded = setExpandedProp || setInternalExpanded;
    const [hoverRef, isHovering] = useHover();
    const effectiveExpanded = expanded || isHovering || (isMobile && isMobileOpen);
    const [conversations, setConversations] = useState([]);
    const [editing, setEditing] = useState(null);
    const [editValue, setEditValue] = useState("");

    const { openConversation, clearConversation } = useConversation();

    const convUrl = import.meta.env.VITE_CONV;

    // Use the shared fetchConversationById from the hooks module (imported at top).

    useEffect(() => {
        let mounted = true;
        const saveUrl = import.meta.env.VITE_SAVE ;

        async function load() {
            try {
                // Always try to fetch fresh data from server first
                const tryUrls = [convUrl, saveUrl];
                let data = null;
                for (const url of tryUrls) {
                    try {
                        const res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" } });
                        if (!res.ok) continue;
                        data = await res.json().catch(() => null);
                        if (data) break;
                    } catch (e) {
                        // try next
                    }
                }

                // If fetch failed, fall back to localStorage stored data
                if (!data) {
                    try {
                        const raw = localStorage.getItem('chat:conversations');
                        if (raw) {
                            const parsed = JSON.parse(raw || "[]");
                            if (Array.isArray(parsed)) data = parsed;
                        }
                    } catch (e) {
                        // ignore parse errors
                    }
                }

                if (!mounted) return;

                const rawList = Array.isArray(data) ? data : (data?.conversations || []);

                // Normalize server objects to internal shape
                let list = rawList.map((item) => {
                    const id = item._id || item.uniqueId || item.id;
                    const title = item.title || item.name || "Untitled";
                    const messages = Array.isArray(item.messages)
                        ? item.messages
                        : Array.isArray(item.lastMessages)
                            ? item.lastMessages.map((m) => ({
                                userPrompt: m.userPrompt || m.user || "",
                                botResponse: m.botResponse || m.bot || "",
                                timestamp: m.timestamp,
                            }))
                            : item.lastMessage
                                ? [
                                    {
                                        userPrompt: item.lastMessage.userPrompt || item.lastMessage.user,
                                        botResponse: item.lastMessage.botResponse || item.lastMessage.bot,
                                        timestamp: item.lastMessage.timestamp,
                                    },
                                ]
                                : [];
                    return {
                        _id: id,
                        uniqueId: id,
                        title,
                        messages,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                        messageCount: item.messageCount || (messages ? messages.length : 0),
                        raw: item,
                    };
                });

                // For any items where the server indicates more messages than provided, fetch full conversation
                const needFull = list.filter((it) => it._id && typeof it.messageCount === 'number' && (Array.isArray(it.messages) ? it.messages.length : 0) < it.messageCount);
                if (needFull.length > 0) {
                    // fetch full conversations in parallel
                    const fetched = await Promise.allSettled(needFull.map((it) => fetchConversationById(it._id)));
                    fetched.forEach((r) => {
                        if (r.status === 'fulfilled' && r.value) {
                            const idx = list.findIndex((x) => x._id === r.value._id);
                            if (idx >= 0) list[idx] = { ...list[idx], ...r.value };
                            else list.unshift(r.value);
                        }
                    });
                }

                setConversations(list);
                writeConversationsCookie(list);
            } catch (err) {
                console.error("Failed to load conversations", err);
            }
        }

        // listen for global updates from saveConversation so the sidebar can stay in sync
        const onUpdated = (e) => {
            try {
                const payload = e?.detail;
                if (!payload) return;
                // payload may be an array or single object
                const incoming = Array.isArray(payload) ? payload : [payload];
                const normalized = incoming.map((item) => {
                    const id = item._id || item.uniqueId || item.id;
                    const title = item.title || item.name || "Untitled";
                    const messages = Array.isArray(item.messages)
                        ? item.messages
                        : Array.isArray(item.lastMessages)
                            ? item.lastMessages.map((m) => ({
                                userPrompt: m.userPrompt || m.user || "",
                                botResponse: m.botResponse || m.bot || "",
                                timestamp: m.timestamp,
                            }))
                            : item.lastMessage
                                ? [
                                    {
                                        userPrompt: item.lastMessage.userPrompt || item.lastMessage.user,
                                        botResponse: item.lastMessage.botResponse || item.lastMessage.bot,
                                        timestamp: item.lastMessage.timestamp,
                                    },
                                ]
                                : [];
                    return {
                        _id: id,
                        uniqueId: id,
                        title,
                        messages,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                        messageCount: item.messageCount || (messages ? messages.length : 0),
                        raw: item,
                    };
                });

                setConversations((prev) => {
                    const copy = Array.isArray(prev) ? [...prev] : [];
                    normalized.forEach((inc) => {
                        const idx = inc._id ? copy.findIndex((c) => c && c._id === inc._id) : -1;
                        if (idx >= 0) copy[idx] = { ...copy[idx], ...inc };
                        else copy.unshift(inc);
                    });
                    writeConversationsCookie(copy);
                    return copy;
                });
            } catch (err) {
                // ignore
            }
        };

        load();
        window.addEventListener("conversations:updated", onUpdated);
        return () => {
            mounted = false;
            window.removeEventListener("conversations:updated", onUpdated);
        };
    }, []);
    

    // helper to persist conversations in localStorage
    function writeConversationsCookie(list) {
        try {
            const serialized = JSON.stringify(list || []);
            localStorage.setItem('chat:conversations', serialized);
        } catch (e) {
            // ignore
        }
    }

    // Notify other UI (TopBar) about visual/hover expansion so it can hide/show its title
    useEffect(() => {
        try {
            if (typeof window !== "undefined" && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent('sidebar:effectiveExpanded', { detail: effectiveExpanded }));
            }
        } catch (e) {
            // ignore
        }
    }, [effectiveExpanded]);

    // Precompute title frequencies so we can disambiguate duplicate titles in the UI
    const titleList = conversations.map((c, i) => c.title || c.name || `Conversation ${i + 1}`);
    const titleCounts = titleList.reduce((acc, t) => {
        acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});

    return (
        <>
            <div ref={hoverRef} className={`h-full bg-gray-800 text-white flex flex-col shadow-lg transition-all duration-300 ${effectiveExpanded ? "w-64 opacity-100 relative" : 
                overlayWhenCollapsed ? "w-50 overflow-hidden opacity-0 fixed left-0 top-0 h-full z-40" : "w-3 overflow-hidden opacity-0"}`}>
                <div className="flex items-center justify-between p-4  font-bold text-lg">
                    <span>{effectiveExpanded ? <Title /> : ""}</span>
                    <div className="flex items-center">
                        {isMobile && (
                            <button
                                className="text-gray-400 hover:text-white focus:outline-none mr-4"
                                onClick={closeSidebar}
                            >
                                <RiCloseLine size={24} />
                            </button>
                        )}
                    </div>
                </div>
                {effectiveExpanded && (
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="mb-4 flex items-center justify-between hover:bg-gray-700 transition  px-2 py-2  border-r-8 border-l-4 border-t-2  border-b-2 border-gray-700">
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
                                const convKey = conv._id || `conv-${idx}-${title}`;
                                const isEditing = editing === convKey;
                                return (
                                    <div
                                        key={convKey}
                                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-700 cursor-pointer"
                                        onClick={async () => {
                                            try {
                                                // If the conversation has fewer messages than the server-side count, fetch full conversation
                                                                                const hasCount = typeof conv.messageCount === 'number' && conv.messageCount > 0;
                                                                                const localMessages = Array.isArray(conv.messages) ? conv.messages.length : 0;
                                                                                const convId = conv._id || conv.uniqueId || conv.id;
                                                                                if (convId && hasCount && localMessages < conv.messageCount) {
                                                                                    const full = await fetchConversationById(convId);
                                                    if (full) {
                                                        // upsert into local list
                                                        setConversations((prev) => {
                                                            const copy = [...prev];
                                                                                            const idx = full._id ? copy.findIndex((c) => c && c._id === full._id) : copy.findIndex((c) => (c && (c.uniqueId === full.uniqueId || c.id === full.id)));
                                                                                            if (idx >= 0) copy[idx] = { ...copy[idx], ...full };
                                                                                            else copy.unshift(full);
                                                            writeConversationsCookie(copy);
                                                            return copy;
                                                        });
                                                        openConversation(full);
                                                        if (isMobile && closeSidebar) closeSidebar();
                                                        return;
                                                    }
                                                }
                                            } catch (err) {
                                                // ignore fetch errors and fall back to opening the provided conv
                                            }
                                            openConversation(conv);
                                            if (isMobile && closeSidebar) closeSidebar();
                                        }}
                                    >
                                        {effectiveExpanded ? (
                                            <>
                                                <div className="flex-1 text-sm truncate">
                                                    {isEditing ? (
                                                        <input
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="w-full bg-gray-800 text-white text-sm px-2 py-1 rounded"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center">
                                                            <span title={title} className="">{title}</span>
                                                            {titleCounts[title] > 1 && (
                                                                <span className="ml-2 text-xs text-gray-400">#{conv._id ? String(conv._id).slice(0,6) : idx + 1}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-2 flex items-center space-x-1">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                    onClick={async (ev) => {
                                                                        ev.stopPropagation();
                                                                        try {
                                                                            // Prefer to update by _id when available to avoid ambiguity with duplicate titles
                                                                            await updateConversation(conv._id || title, editValue);
                                                                            const newList = (() => {
                                                                                const copy = [...conversations];
                                                                                copy[idx] = { ...copy[idx], title: editValue };
                                                                                return copy;
                                                                            })();
                                                                            setConversations(newList);
                                                                            writeConversationsCookie(newList);
                                                                            setEditing(null);
                                                                        } catch (err) {
                                                                            console.error(err);
                                                                        }
                                                                    }}
                                                            >
                                                                <FaCheck />
                                                            </button>
                                                            <button onClick={(ev) => { ev.stopPropagation(); setEditing(null); }}><MdCancel /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={(ev) => { ev.stopPropagation(); setEditing(convKey); setEditValue(title); }}><FaEdit /></button>
                                                            <button onClick={(ev) => {
                                                                ev.stopPropagation();
                                                                // Optimistically remove from UI and localStorage immediately
                                                                const newList = conversations.filter((_, i) => i !== idx);
                                                                setConversations(newList);
                                                                writeConversationsCookie(newList);
                                                                // Attempt server delete in background; log errors but don't block local removal
                                                                (async () => {
                                                                    try {
                                                                        await deleteConversation(conv._id || title);
                                                                    } catch (err) {
                                                                        console.error('Failed to delete conversation on server, removed locally', err);
                                                                    }
                                                                })();
                                                            }}><MdDelete /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className=" items-center">
                                                <div className=" w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-semibold">{String(idx + 1)}</div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div className="p-4   text-xs text-gray-400">
            {expanded ? "" : ""}
                </div>
            </div>
        </>
    );
}

export default Sidebar;