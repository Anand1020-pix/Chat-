import React, { useState } from "react";
import { RiMenuFold2Fill, RiMenuFill, RiCloseLine } from "react-icons/ri";

const Sidebar = ({ isMobile, closeSidebar }) => {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className={`h-full bg-gray-800 text-white flex flex-col shadow-lg transition-all duration-300 ${expanded ? "w-64" : "w-24"}`}>
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
                        <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition">
                            New Chat
                        </button>
                    </div>
                    <div className="space-y-2">
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