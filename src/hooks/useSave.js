const save_url = import.meta.env.VITE_SAVE || "/save";
const conv_url = import.meta.env.VITE_CONV || "/conv";
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

async function saveConversation({ title, userPrompt, botResponse } = {}) {
    const finalTitle = title || deriveTitle(userPrompt);
    const payload = {
        title: finalTitle,
        userPrompt: userPrompt || "",
        botResponse: botResponse || "",
    };

    // If this title already exists in the local cache, include the existing id as `uniqueId`
    try {
        const list = loadCacheFromStorage() || [];
        const existing = list.find((c) => (c.title && c.title === finalTitle) || (c._id && c._id === finalTitle));
        if (existing && existing._id) {
            payload.uniqueId = existing._id;
        }
    } catch (e) {
        // ignore cache lookup errors and proceed without uniqueId
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
            } else if (data._id || data.title) {
                // upsert single conv
                const idx = list.findIndex((c) => (c._id && data._id && c._id === data._id) || (c.title === data.title));
                if (idx >= 0) list[idx] = { ...list[idx], ...data };
                else list.unshift(data);
                saveCacheToStorage(list);
            } else {
                // fallback: refresh from server
                fetchFromServer().catch(() => {});
            }
        }
        return data;
    } catch (e) {
        // if JSON parse fails, trigger background refresh
        fetchFromServer().catch(() => {});
        return null;
    }
}

export default saveConversation;
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
export async function deleteConversation(title) {
    const res = await fetch(save_url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Delete failed: ${res.status} ${text}`);
    }

    try {
        const data = await res.json();
        // remove from cache by title or _id
        const list = loadCacheFromStorage() || [];
        const filtered = list.filter((c) => c.title !== title && c._id !== title && c._id !== (data?._id));
        saveCacheToStorage(filtered);
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
export async function updateConversation(title, newTitle) {
    const res = await fetch(save_url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, newTitle }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Update failed: ${res.status} ${text}`);
    }

    try {
        const data = await res.json();
        // update cache entry titles
        const list = loadCacheFromStorage() || [];
        const idx = list.findIndex((c) => c.title === title || c._id === title || c._id === data?._id);
        if (idx >= 0) {
            list[idx] = { ...list[idx], title: newTitle };
            saveCacheToStorage(list);
        }
        return data;
    } catch (e) {
        return null;
    }
}
