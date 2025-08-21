import React, { useEffect, useState } from "react";
import { RiMenuFill, RiMenuFold2Fill } from "react-icons/ri";
import Title from "./Title";

const TopBar = ({ toggleSidebar, toggleExpand, sidebarExpanded }) => {
    const [sidebarVisuallyExpanded, setSidebarVisuallyExpanded] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            setSidebarVisuallyExpanded(!!e?.detail);
        };
        window.addEventListener('sidebar:effectiveExpanded', handler);
        return () => window.removeEventListener('sidebar:effectiveExpanded', handler);
    }, []);

    const hideTitle = sidebarExpanded || sidebarVisuallyExpanded;

    return (
        <div className="w-full h-16 bg-gray-900 text-white flex items-center justify-between px-4">
            <div className="flex items-center">
                <button
                    className="md:hidden text-2xl mr-3"
                    onClick={toggleSidebar}
                >
                    <RiMenuFill />
                </button>
                {/* Show title only when sidebar is NOT expanded (including hover-expanded) */}
                {!hideTitle && (
                    <Title />
                )}
            </div>
            <div className="hidden md:block p-2 font-semibold text-gray-400 text-sm opacity-20 hover:cursor-pointer" onClick={() => window.open("https://github.com/Anand1020-pix", "_blank")}>
              github.com/Anand1020-pix
            </div>
        </div>
    );
}

export default TopBar;