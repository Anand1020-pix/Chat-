const save_url = import.meta.env.VITE_SAVE ;
const conv_url = import.meta.env.VITE_CONV ;
const CACHE_KEY = "chat:conversations";
let inMemoryCache = null;

function loadCacheFromStorage() {
    if (inMemoryCache !== null) return inMemoryCache;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        inMemoryCache = raw ? JSON.parse(raw) : [];
    } catch (e) {
        inMemoryCache = [];
    }
    return inMemoryCache;
}

function saveCacheToStorage(data) {
    try {
        inMemoryCache = Array.isArray(data) ? data : [];
        localStorage.setItem(CACHE_KEY, JSON.stringify(inMemoryCache));
    } catch (e) {
        // ignore storage errors
    }
}

function getCachedConversations(filterTitle = "") {
    const list = loadCacheFromStorage() || [];
    if (!filterTitle) return list;
    return list.filter((c) => (c.title || "").toLowerCase().includes(String(filterTitle).toLowerCase()));
}

async function fetchFromServer(title = "") {
    const res = await fetch(conv_url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Fetch convs failed: ${res.status} ${text}`);
    }

    try {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.conversations || []);
        saveCacheToStorage(list);
        // notify UI that fresh conversations arrived
        try {
            if (typeof window !== "undefined" && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent("conversations:updated", { detail: list }));
            }
        } catch (e) {
            // ignore
        }
        return list;
    } catch (e) {
        return null;
    }
}
function deriveTitle(prompt) {
    if (!prompt) return "Untitled";
    // prefer the first sentence; fall back to first line or first 60 chars
    const firstLine = String(prompt).split(/\r?\n/)[0];
    const firstSentence = firstLine.split(/[.?!]\s/)[0];
    const candidate = (firstSentence || firstLine || prompt).trim();
    return candidate.slice(0, 60);
}

async function saveConversation({ title, userPrompt, botResponse, forceNew = false } = {}) {
    const finalTitle = title || deriveTitle(userPrompt);
    const payload = {
        title: finalTitle,
        userPrompt: userPrompt || "",
        botResponse: botResponse || "",
    };

    // If caller explicitly requests a new conversation (forceNew), don't attach an existing id.
    if (!forceNew) {
        // If caller already provided a uniqueId (e.g. caller knows the active conversation), keep it.
        if (!payload.uniqueId) {
            try {
                const list = loadCacheFromStorage() || [];
                // Find an existing conversation by exact title match and attach its _id.
                const existing = list.find((c) => c && c.title && c.title === finalTitle);
                if (existing && existing._id) {
                    payload.uniqueId = existing._id;
                }
            } catch (e) {
                // ignore cache lookup errors and proceed without uniqueId
            }
        }
    }

    const res = await fetch(save_url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Save failed: ${res.status} ${text}`);
    }

    // try to return parsed JSON if available and update cache
    try {
        const data = await res.json();
        // if server returned a conversation object or list, upsert into cache
        if (data) {
            const list = loadCacheFromStorage() || [];
            // if server returns an array, replace
            if (Array.isArray(data)) {
                saveCacheToStorage(data);
            } else if (data && (data._id || data.title)) {
                // upsert single conv — match only by server _id to avoid merging different conversations that share a title
                const idx = data._id ? list.findIndex((c) => c && c._id === data._id) : -1;
                if (idx >= 0) list[idx] = { ...list[idx], ...data };
                else list.unshift(data);
                saveCacheToStorage(list);
            } else {
                // fallback: refresh from server
                fetchFromServer().catch(() => {});
            }
        }
        // notify listeners (UI) that conversations changed; include server data as detail
        try {
            if (typeof window !== "undefined" && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent("conversations:updated", { detail: data }));
            }
        } catch (e) {
            // ignore
        }
        return data;
    } catch (e) {
        // if JSON parse fails, trigger background refresh
        fetchFromServer().catch(() => {});
        return null;
    }
}

export default saveConversation;
export async function fetchConversationById(id) {
    if (!id) return null;
    const tryUrls = [
        `${conv_url}?id=${encodeURIComponent(id)}`,
        `${conv_url}?uniqueId=${encodeURIComponent(id)}`,
        `${conv_url}/${encodeURIComponent(id)}`,
        `${conv_url}/messages?id=${encodeURIComponent(id)}`,
        `${conv_url}/messages/${encodeURIComponent(id)}`,
        `${conv_url}?id=${encodeURIComponent(id)}&messages=true`,
    ];
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
    if (!data) return null;
    const item = Array.isArray(data) ? data[0] : data;
    const idv = item._id || item.uniqueId || item.id;
    const title = item.title || item.name || "Untitled";
    const messages = Array.isArray(item.messages)
        ? item.messages
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
        _id: idv,
        uniqueId: idv,
        title,
        messages,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        messageCount: item.messageCount || (messages ? messages.length : 0),
        raw: item,
    };
}
export async function fetchConversations(title = "", force = false) {
    // Return cached value immediately when available (stale-while-revalidate).
    try {
        const cached = getCachedConversations(title);
        if (cached && cached.length > 0 && !force) {
            // update in background
            fetchFromServer(title).catch(() => {});
            return cached;
        }
    } catch (e) {
        // ignore
    }

    // otherwise fetch from server
    return await fetchFromServer(title);
}

// Delete a conversation by title using DELETE /save with body { title }
export async function deleteConversation(idOrTitle) {
    // idOrTitle may be an _id/uniqueId or a title. Prefer sending uniqueId when we can detect it's an id.
    const body = {};
    if (typeof idOrTitle === "string" && idOrTitle.match(/^[a-f0-9\-]{6,}$/i)) {
        body.uniqueId = idOrTitle;
    } else {
        body.title = idOrTitle;
    }

    const res = await fetch(save_url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Delete failed: ${res.status} ${text}`);
    }

    try {
        const data = await res.json();
        // remove from cache by title or _id
        const list = loadCacheFromStorage() || [];
        const filtered = list.filter((c) => {
            if (!c) return false;
            // remove by matching _id if server returned one, otherwise by title
            if (data && data._id) return c._id !== data._id;
            return c.title !== idOrTitle && c._id !== idOrTitle;
        });
        saveCacheToStorage(filtered);
        try {
            if (typeof window !== "undefined" && window.dispatchEvent) {
                window.dispatchEvent(new CustomEvent("conversations:updated", { detail: filtered }));
            }
        } catch (e) {
            // ignore
        }
        return data;
    } catch (e) {
        // if no json returned, still try to remove locally
        const list = loadCacheFromStorage() || [];
        const filtered = list.filter((c) => c.title !== title);
        saveCacheToStorage(filtered);
        return null;
    }
}

// Update a conversation title using PUT /save with body { title, newTitle }
export async function updateConversation(idOrTitle, newTitle) {
    // idOrTitle can be an _id/uniqueId or a title. Prefer sending uniqueId when it looks like an id.
    const body = { newTitle };
    if (typeof idOrTitle === "string" && idOrTitle.match(/^[a-f0-9\-]{6,}$/i)) {
        body.uniqueId = idOrTitle;
    } else {
        body.title = idOrTitle;
    }

    const res = await fetch(save_url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Update failed: ${res.status} ${text}`);
    }

    try {
        const data = await res.json();
        // update cache entry titles — match by returned _id when possible, otherwise by provided idOrTitle
        const list = loadCacheFromStorage() || [];
        const matchId = data?._id;
        let idx = -1;
        if (matchId) idx = list.findIndex((c) => c && c._id === matchId);
        if (idx === -1) idx = list.findIndex((c) => c && (c.title === idOrTitle || c._id === idOrTitle));
        if (idx >= 0) {
            list[idx] = { ...list[idx], title: newTitle };
            saveCacheToStorage(list);
            try {
                if (typeof window !== "undefined" && window.dispatchEvent) {
                    window.dispatchEvent(new CustomEvent("conversations:updated", { detail: list }));
                }
            } catch (e) {
                // ignore
            }
        }
        return data;
    } catch (e) {
        return null;
    }
}
